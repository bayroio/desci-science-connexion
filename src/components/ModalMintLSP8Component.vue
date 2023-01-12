<script setup>
    import { onMounted, ref } from 'vue';
    import { useRoute } from 'vue-router';
    import ERC725js from '@erc725/erc725.js';
    import LSP4DigitalAssetSchema from '@erc725/erc725.js/schemas/LSP4DigitalAsset.json';
    import LSP8Mintable from '@lukso/lsp-smart-contracts/artifacts/LSP8Mintable.json';
    import { BLOCKCHAIN_EXPLORER_BASE_URL, IPFS_GATEWAY_API_BASE_URL } from '../constants';
    import { LSP4DigitalAssetMetadata } from '@lukso/lsp-factory.js';
    import { addLuksoL14Testnet, addLuksoL16Testnet, isLuksoNetwork } from '../../network';
import { isContractAddressInBloom } from 'web3-utils';

    const props = defineProps({ address: String });
    const emit = defineEmits(['close', 'tokens-sent']);
    const handleModalClose = () => {
        emit('close', true);
    };

    const route = useRoute();
    const LSP4TokenName = ref('');
    const LSP4TokenSymbol = ref('');
    const description = ref('');
    const tokenId = ref(''); // Should be bytes32
    const mintEvents = ref([]);
    const error = ref('');
    const isLoading = ref(false);
    const isSuccess = ref(false);
    const forceParameter = ref(false);
    const isMinterEOA = ref(false);
    const isWrongNetwork = ref(false);

    async function onSubmit(e) {
        console.log("Entrando a onsubmit...")
        // Check network
        try {
            isWrongNetwork.value = await isLuksoNetwork();
            if (isWrongNetwork.value) {
                return;
            }
        } 
        catch (err) {
            console.warn(err);
            error.value = err.message;
            return;
        }

        // Get the address from the browser extension
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];
        let minterBytecode = await web3.eth.getCode(account);

        // If recipient is EOA, force is mandatory
        if (minterBytecode === '0x' && forceParameter.value === false) {
            isMinterEOA.value = true;
            return;
        }

        isMinterEOA.value = false;
        isLoading.value = true;
        isSuccess.value = false;
        error.value = '';
        mintEvents.value = [];

        //Create Smart Contract with https://docs.lukso.tech/standards/smart-contracts/lsp8-identifiable-digital-asset
        const lsp8IdentifiableDigitalAssetContract = new window.web3.eth.Contract(LSP8Mintable.abi, props.address);
        const paddedTokenId = web3.utils.padRight(web3.utils.stringToHex(tokenId.value), 64);
        try {
            const to = account;
            const force = forceParameter.value; // When set to TRUE, to may be any address; when set to FALSE to must be a contract that supports LSP1 UniversalReceiver and not revert.
            const data = '0x';
            console.log("paddedtokenid: ", paddedTokenId);

            const receipt = await lsp8IdentifiableDigitalAssetContract.methods.mint(to, paddedTokenId, force, data).send({ from: account });
            mintEvents.value.push({ stepName: 'Acuñar el NFT en el smart contract LSP8', functionName: 'acuñar', receipt });
        }
        catch (err) {
            error.value = err.message;
            console.log(err);
            isLoading.value = false;
            return;
        }

        //Create and upload JSON metadata: https://docs.lukso.tech/tools/lsp-factoryjs/classes/lsp4-digital-asset-metadata#uploadmetadata
        const metadata = await LSP4DigitalAssetMetadata.uploadMetadata({
                description: description.value,
                icon: e.target.querySelector('input#icon').files[0],
            },
            {
                ipfsGateway: IPFS_GATEWAY_API_BASE_URL,
        });
        mintEvents.value.push({ stepName: 'Generar y actualizar el archivo metadata' });

        //We minted the NFT, let's add its metadata in the LSP8 smart contract key/value store
        const erc725js = new ERC725js(
            [
                {
                name: 'LSP8MetadataJSON:<bytes32>',
                key: '0x9a26b4060ae7f7d5e3cd0000<bytes32>',
                keyType: 'Mapping',
                valueType: 'bytes',
                valueContent: 'JSONURL',
                },
            ],
            props.address,
            window.web3.currentProvider
        );

        //Encode the metadata
        const encodedErc725Data = erc725js.encodeData({
            keyName: 'LSP8MetadataJSON:<bytes32>',
            dynamicKeyParts: paddedTokenId,
            value: {
                json: metadata.json,
                url: metadata.url,
            },
        });

        //Send transaction
        try {
            const receipt = await lsp8IdentifiableDigitalAssetContract.methods['setData(bytes32[],bytes[])'](encodedErc725Data.keys, encodedErc725Data.values).send({ from: account });
            mintEvents.value.push({ stepName: 'Actualizar el ERC725Y key/value (LSP8MetadataJSON:<bytes32>)', functionName: 'setData', receipt });
        } 
        catch (err) {
            isLoading.value = false;
            error.value = err;
            return;
        }

        // Check if account is EOA, also add new asset list to localStorage
        let bytecode = await web3.eth.getCode(account);
        if (bytecode === '0x') {
            let LSP5ReceivedAssets = JSON.parse(localStorage.getItem('receivedAssets'));
            if (LSP5ReceivedAssets.value.indexOf(props.address) === -1) {
                LSP5ReceivedAssets.value.push(props.address);
                localStorage.setItem('receivedAssets', JSON.stringify(LSP5ReceivedAssets));
            }
        }

        isLoading.value = false;
        isSuccess.value = true;
    }

    onMounted(async () => {
        const erc725Asset = new ERC725js(LSP4DigitalAssetSchema, props.address, window.web3.currentProvider);
        const LSP4DigitalAsset = await erc725Asset.fetchData(['LSP4TokenName', 'LSP4TokenSymbol']);
        LSP4TokenName.value = LSP4DigitalAsset[0].value;
        LSP4TokenSymbol.value = LSP4DigitalAsset[1].value;
    });
</script>

<template>
  <div class="modal">
    <div class="modal-content" @click.stop="">
        <p class="warning" v-if="error">
            {{ error }}
        </p>

        <div class="center">
            <h4>Acuña tokens de {{ LSP4TokenName }} ({{ LSP4TokenSymbol }})</h4>

            <form v-if="!isLoading && mintEvents.length === 0" @submit.prevent="onSubmit" class="left">
                <fieldset>
                    <p class="warning" v-if="isMinterEOA">Tu dirección es una EOA, por favor permite la trasnferencia a una EOA.</p>
                    <p v-if="isWrongNetwork" class="warning">
                        Por favor cambia tu red a LUKSO <a style="cursor: pointer" @click="addLuksoL14Testnet()">L14</a> o <a style="cursor: pointer" @click="addLuksoL16Testnet()">L16 </a>para acuñar este activo digital 
                    </p>
                
                    <span><strong>Nombre del Token: </strong></span><br/>
                    <textarea placeholder="Mi Token" v-model="tokenId" id="tokenId" required maxlength="30"></textarea>

                    <span><strong>Descripción (pequeño resumen del documentp)</strong></span><br/>
                    <textarea placeholder="El token que cambiará el mundo..." v-model="description" id="description" required></textarea>

                    <span><strong>Ícono del Token (representación íconografica)</strong></span><br/>
                    <input type="file" id="icon" accept="image/*" required />
                    
                    <div style="margin-top: 10px">
                        <span title="Los tokens y NFT solo se pueden enviar a perfiles universales o contratos inteligentes que implementan un receptor universal de forma predeterminada. Para enviarlo a un EOA, debe usar el parámetro de fuerza">
                            <input style="position: absolute; margin: 5px 0px 0px 0px" type="checkbox" v-model="forceParameter" id="force" value="false" />
                            <span style="margin-left: 20px"><strong>Permite la transferencia de tokens a una cuenta EOA </strong></span><br/>
                        </span>
                    </div>

                    <br /><br />
                    <div class="right">
                        <button type="submit">Acuñar</button>
                        <button type="button" @click="handleModalClose">Cerrar</button>
                    </div>
                </fieldset>
            </form>
        </div>

        <p v-if="isLoading">Cargando...</p>
        <div v-for="(event, index) in mintEvents" :key="index" style="padding-top: 60px">
            <h4>{{ event.stepName }}</h4>
            <span v-if="event.receipt">
                Función llamada: {{ event.functionName }}()<br />
                Transacción exitosa: tx hash: <a :href="`${BLOCKCHAIN_EXPLORER_BASE_URL}/tx/${event.receipt.transactionHash}`" target="_blank">{{ event.receipt.transactionHash }}</a>
            </span>
        </div>

        <div v-if="isSuccess" style="padding-top: 60px">
            <h4>El NFT 2.0 se acuño exitosamente !</h4>
        </div>

        <div v-if="isSuccess" class="right">
            <button type="button" @click="handleModalClose">Cerrar</button>
        </div>


    </div>        
  </div>
</template>

<style scoped>
.modal {
  position: fixed; /* Stay in place */
  z-index: 1; /* Sit on top */
  padding-top: 100px; /* Location of the box */
  left: 0;
  top: 0;
  width: 100%; /* Full width */
  height: 100%; /* Full height */
  overflow: auto; /* Enable scroll if needed */
  background-color: rgb(0, 0, 0); /* Fallback color */
  background-color: rgba(0, 0, 0, 0.4); /* Black w/ opacity */
}

.modal-content {
  background-color: #fefefe;
  margin: -2% auto; /* 0% from the top and centered */
  padding: 20px;
  border: 1px solid #888;
  width: 90%;
  max-width: 750px;
  border-radius: 10px;
}
</style>
