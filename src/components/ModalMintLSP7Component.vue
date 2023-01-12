<script setup>
    import { onMounted, ref } from 'vue';
    import { useRoute } from 'vue-router';
    import ERC725js from '@erc725/erc725.js';
    import LSP4DigitalAssetSchema from '@erc725/erc725.js/schemas/LSP4DigitalAsset.json';
    import LSP7DigitalAsset from '@lukso/lsp-smart-contracts/artifacts/LSP7Mintable.json';
    import { BLOCKCHAIN_EXPLORER_BASE_URL } from '../constants';
    import { addLuksoL14Testnet, addLuksoL16Testnet, isLuksoNetwork } from '../../network';

    const props = defineProps({ address: String });
    const emit = defineEmits(['close', 'tokens-sent']);
    const handleModalClose = () => {
        emit('close', true);
    };

    const route = useRoute();
    const LSP4TokenName = ref('');
    const LSP4TokenSymbol = ref('');
    const mintAmount = ref(0);
    const txHash = ref('');
    const error = ref('');
    const isLoading = ref(false);
    const forceParameter = ref(false);
    const isMinterEOA = ref(false);
    const isWrongNetwork = ref(false);

    async function onSubmit() {
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

        // Validate quantity
        if (mintAmount.value === 0) {
            return;
        }
        else if (minterBytecode === '0x' && forceParameter.value === false) {
            // If recipient is EOA, force is mandatory
            isMinterEOA.value = true;
            return;
        }
        isMinterEOA.value = false;
        console.log(`Acuñando ${mintAmount.value} nuevos tokens.`);

        //Create Smart Contract with https://docs.lukso.tech/standards/smart-contracts/lsp7-digital-asset
        const lsp7DigitalAssetContract = new window.web3.eth.Contract(LSP7DigitalAsset.abi, props.address);
        try {
            isLoading.value = true;

            const to = account;
            const amount = web3.utils.toWei(mintAmount.value.toString());
            const force = forceParameter.value; // When set to TRUE, to may be any address; when set to FALSE to must be a contract that supports LSP1 UniversalReceiver and not revert.
            const data = '0x';

            const receipt = await lsp7DigitalAssetContract.methods.mint(to, amount, force, data).send({ from: account });
            isLoading.value = false;
            txHash.value = receipt.transactionHash;

            // Check if account is EOA, also add new asset list to localStorage
            let bytecode = await web3.eth.getCode(account);
            if (bytecode === '0x') {
                let LSP5ReceivedAssets = JSON.parse(localStorage.getItem('receivedAssets'));
                if (LSP5ReceivedAssets.value.indexOf(props.address) === -1) {
                    LSP5ReceivedAssets.value.push(props.address);
                    localStorage.setItem('receivedAssets', JSON.stringify(LSP5ReceivedAssets));
                }
            }
        }
        catch (err) {
            error.value = err.message;
        }
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
            <h4><strong>Acuñar tokens de {{ LSP4TokenName }} ({{ LSP4TokenSymbol }})</strong></h4>

            <form @submit.prevent="onSubmit" class="left">
                <fieldset>
                    <p class="warning" v-if="isMinterEOA">Tu cuenta es una EOA, por favor permite la transferencia de tokens a otra cuenta EOA.</p>
                    <p v-if="isWrongNetwork" class="warning">
                        Por favor cambia tu red a LUKSO <a style="cursor: pointer" @click="addLuksoL14Testnet()">L14</a> o <a style="cursor: pointer" @click="addLuksoL16Testnet()">L16 </a>para acuñar este activo digital.
                    </p>

                    <span><strong>Cantidad a acuñar: </strong></span><br/>
                    <input type="number" v-model="mintAmount" placeholder="1" id="amount" required />

                    <div>
                        <span title="Los tokens y NFT solo se pueden enviar a perfiles universales o contratos inteligentes que implementan un receptor universal de forma predeterminada. Para enviarlo a un EOA, debe usar el parámetro de fuerza.">
                            <input style="position: absolute; margin: 5px 0px 0px 0px" type="checkbox" v-model="forceParameter" id="force" value="false" />
                            <span style="margin-left: 20px"><strong>Permite la transferencia de tokens a una cuenta EOA </strong></span><br/>
                        </span>
                    </div>
                    <br />
                    <div class="right">
                        <button type="submit">Acuñar</button>
                        <button type="button" @click="handleModalClose">Cerrar</button>
                    </div>
                </fieldset>
            </form>

            <p v-if="isLoading">Cargando...</p>

            <p v-if="txHash">
                Proceso completado con éxito: tx hash: <a :href="`${BLOCKCHAIN_EXPLORER_BASE_URL}/tx/${txHash}`" target="_blank">{{ txHash }}</a>
            </p>
            
            <div v-if="txHash" class="right">
                <button type="button" @click="handleModalClose">Cerrar</button>
            </div>
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
