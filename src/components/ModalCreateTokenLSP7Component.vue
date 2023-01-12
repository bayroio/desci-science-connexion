<script setup>
    import { ref } from 'vue';
    import LSP0ERC725Account from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json'; // TODO change to LSP0ERC725Account
    import { LSPFactory } from '@lukso/lsp-factory.js';
    import ERC725js from '@erc725/erc725.js';
    import LSP12IssuedAssetsSchema from '@erc725/erc725.js/schemas/LSP12IssuedAssets.json'; // https://docs.lukso.tech/tools/erc725js/schemas
    import LSP7Mintable_0_5_0 from '../contracts/LSP7Mintable_0_5_0.json';
    import { IPFS_GATEWAY_API_BASE_URL, IPFS_GATEWAY_BASE_URL, BLOCKCHAIN_EXPLORER_BASE_URL, CHAIN_IDS } from '../constants';
    import { addLuksoL14Testnet, addLuksoL16Testnet, isLuksoNetwork } from '../../network';

    const emit = defineEmits(['close', 'tokens-sent']);
    const handleModalClose = () => {
        emit('close', true);
    };

    const deploying = ref(false);
    const error = ref(false);
    const isEOA = ref(false);
    const deployEvents = ref([]);
    const isSuccess = ref(false);
    const isWrongNetwork = ref(false);

    // Form fields
    const tokenName = ref('');
    const tokenSymbol = ref('');
    const description = ref('');

    function CloseModal() {
      window.location.reload();
    }

    async function onSubmit(e) {
        console.log("Entrando a onsubmit...")
        // Check network
        try {
            isWrongNetwork.value = await isLuksoNetwork();
            console.log("isWrongNetwork...", isWrongNetwork.value);
            if (isWrongNetwork.value) {
                return;
            }
        } 
        catch (err) {
            console.warn(err);
            error.value = err.message;
            console.log("Error...", error.value);
            return;
        }

        // Get the address from the browser extension
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];
        console.log("accounts...", accounts);
        console.log("account...", account);

        // Create the meta data
        const LSP4MetaData = {
            description: description.value,
            icon: e.target.querySelector('input#icon').files[0],
            links: [],
            images: [],
            assets: [e.target.querySelector('input#pdf').files[0]],
        };

        // Show the deploying status...
        deployEvents.value = [];
        deploying.value = true;
        isSuccess.value = false;

        // l14 relayer uses smart contracts v0.5.0
        const chainId = await web3.eth.getChainId();
        const version = chainId === CHAIN_IDS.L14 ? LSP7Mintable_0_5_0.bytecode : null;
        console.log("chainId...", chainId);
        console.log("version...", version);

        // Inititate the LSPFactory
        const factory = new LSPFactory(web3.currentProvider, { chainId });

        // Deploy the LSP7 contract, https://docs.lukso.tech/tools/lsp-factoryjs/classes/lsp7-digital-asset
        let contracts;
        try {
            //Create the contract
            contracts = await factory.LSP7DigitalAsset.deploy(
            {
                name: tokenName.value,
                symbol: tokenSymbol.value,
                controllerAddress: account, // the "issuer" of the asset, that is allowed to change meta data
                isNFT: false, // Token decimals set to 18
                creators: [account],
                digitalAssetMetadata: LSP4MetaData,
            },
            {
                ipfsGateway: IPFS_GATEWAY_API_BASE_URL,
                LSP7DigitalAsset: {
                    version,
                },
                onDeployEvents: {
                    next: (deploymentEvent) => {
                        console.log(deploymentEvent);

                        if (deploymentEvent.status === 'COMPLETE') {
                            deployEvents.value.push(deploymentEvent);
                        }
                    },
                    error: (err) => {
                        deploying.value = false;
                        error.value = err.message;
                        console.log("Error in onDeployEvents...", error.value);
                        console.log("Error message in onDeployEvents...", error.value);
                    },
                    complete: (contracts) => {
                        console.log('Deployment Complete');
                        console.log("Token address", contracts.LSP7DigitalAsset.address);
                        console.log("Token receipt", contracts.LSP7DigitalAsset.receipt);
                        console.log(contracts.LSP7DigitalAsset);
                    },
                },
            });
        }
        catch (err) {
            console.warn(err.message);
            error.value = err.message;
            deploying.value = false;
            console.log("LSP7DigitalAsset.deploy...", error.value);
            return;
        }

        if (!contracts && !contracts.LSP7DigitalAsset) {
            error.value = 'Error deploying LSP7DigitalAsset';
            console.log(error.value);
            return;
        }

        //--- Add the smart contract to Universal Profile ---\\
        const deployedLSP7DigitalAssetContract = contracts.LSP7DigitalAsset;
        const options = {
            ipfsGateway: IPFS_GATEWAY_BASE_URL,
        };
        const erc725LSP12IssuedAssets = new ERC725js(LSP12IssuedAssetsSchema, accounts[0], window.web3.currentProvider, options);

        // Get the current issued assets
        let LSP12IssuedAssets;
        try {
            LSP12IssuedAssets = await erc725LSP12IssuedAssets.getData('LSP12IssuedAssets[]');
        }
        catch (err) {
            // Is EOA, Load all assets that were stored in local storage
            LSP12IssuedAssets = JSON.parse(localStorage.getItem('issuedAssets'));
        }

        // Add new asset
        LSP12IssuedAssets.value.push(deployedLSP7DigitalAssetContract.address);

        // if EOA, also add new asset list to localStorage
        let bytecode = await web3.eth.getCode(accounts[0]);
        if (bytecode === '0x') {
            localStorage.setItem('issuedAssets', JSON.stringify(LSP12IssuedAssets));
        }

        //Encode the new LSP12
        const LSP7InterfaceId = '0x5fcaac27'; //'0xe33f65c3';
        const encodedErc725Data = erc725LSP12IssuedAssets.encodeData([
            {
                keyName: 'LSP12IssuedAssets[]',
                value: LSP12IssuedAssets.value,
            },
            {
                keyName: 'LSP12IssuedAssetsMap:<address>',
                dynamicKeyParts: deployedLSP7DigitalAssetContract.address,
                value: [LSP7InterfaceId, LSP12IssuedAssets.length - 1], // LSP7 interface ID + index position of asset
            },
        ]);

        //Add the LSP12 to the universal profile
        try {
            const profileContract = new window.web3.eth.Contract(LSP0ERC725Account.abi, accounts[0]);
            const receipt = await profileContract.methods['setData(bytes32[],bytes[])'](encodedErc725Data.keys, encodedErc725Data.values).send({ from: accounts[0] });

            deployEvents.value.push({ receipt, type: 'TRANSACTION', functionName: 'setData' });
        }
        catch (err) {
            console.warn(err);
            error.value = err.message;
            deploying.value = false;
            return;
        }

        // Show EOA local storage warning
        if (bytecode === '0x') {
            isEOA.value = true;
        }

        isSuccess.value = true;
    }
</script>

<template>
  <div class="modal">
    <div class="modal-content" @click.stop="">

        <p class="warning" v-if="error">
            {{ error }}
        </p>

        <div class="center">
            <h4><strong>Papers tokenizados</strong></h4>
            <h6 style="margin-top: -25px;">basandote en: <a href="https://docs.lukso.tech/standards/nft-2.0/LSP7-Identifiable-Digital-Asset" target="_blank">NFT </a></h6>

            <br />
            <div v-if="isEOA" class="warning">Token NFT configurado y puesto en blockchain de forma correcta, pero debido al uso de Metamask, el token solo puede ser resguardado en el almacenamiento local del browser.</div>
            <p v-if="isWrongNetwork" class="warning">
                Por favor cambia tu red a LUKSO <a style="cursor: pointer" @click="addLuksoL14Testnet()">L14</a> o <a style="cursor: pointer" @click="addLuksoL16Testnet()">L16 </a>para crear este token.
            </p>

            <br />
            <form v-if="!deploying" @submit.prevent="onSubmit" class="left">
                <fieldset>
                    <div class="formfields">
                        <div class="item-flex">
                            <span><strong>Nombre del Token: </strong></span><br/>
                            <input type="text" placeholder="Mi Token" v-model="tokenName" id="name" required />
                        </div>
                        <div class="item-flex">
                            <span><strong>Símbolo del Token (entre 4 y 5 caracteres)</strong></span><br/>
                            <input type="text" placeholder="MYTOK" id="symbol" v-model="tokenSymbol" required maxlength="5"/>
                        </div>
                    </div>

                    <div class="item-flex">
                        <span><strong>Descripción (pequeño resumen del documento)</strong></span><br/>
                        <textarea placeholder="El Token que cambiará el mundo..." id="description" required></textarea>
                    </div>

                    <div class="formfields">
                        <div class="item-flex">
                            <span><strong>Ícono del Token (representación íconografica)</strong></span><br/>
                            <input type="file" id="icon" accept="image/*" required /><br/>
                        </div>

                        <div class="item-flex">
                            <span><strong>Archivo en PDF (paper)</strong></span><br/>
                            <input type="file" id="pdf" accept="application/pdf" required />
                        </div>
                    </div>

                    <br />
                    <div class="right">
                        <button type="submit">Despliega el Token</button>
                        <button type="button" @click="handleModalClose">Cerrar</button>
                    </div>
                </fieldset>
            </form>
        </div>

        <div class="events">
            <span v-if="deploying">
                Desplegando el NFT en Blockchain...<br />
                <strong>Confirme todas las transacciones en la extensión de su navegador y espere hasta que se agreguen a Blockchain.</strong>
            </span>

            <br /><br />
            <div v-for="(event, index) in deployEvents" :key="index">
                <span v-if="event.type === 'PROXY_DEPLOYMENT'">
                    NFT desplegado: {{ event.contractName }} ({{ event.type }}): <a :href="`${BLOCKCHAIN_EXPLORER_BASE_URL}/address/${event.contractAddress}`" target="_blank">{{ event.contractAddress }}</a>
                    <br />
                    Hash de la transacción: <a :href="`${BLOCKCHAIN_EXPLORER_BASE_URL}/tx/${event.receipt.transactionHash}`" target="_blank">{{ event.receipt.transactionHash }}</a>
                </span>

                <br />
                <span v-if="event.type === 'TRANSACTION'">
                    Función llamada: {{ event.functionName }}()<br />
                    Hash de la transacción: <a :href="`${BLOCKCHAIN_EXPLORER_BASE_URL}/tx/${event.receipt.transactionHash}`" target="_blank">{{ event.receipt.transactionHash }}</a>
                </span>
            </div>

            <div v-if="isSuccess" style="padding-top: 60px">
                <h4>Proceso completado con éxito !</h4>
            </div>

            <br /><br />
            <div class="right" v-if="isSuccess" >
                <button @click="CloseModal">Cerrar</button>
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
