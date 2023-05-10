<!-- 
  /* */ 
  /* Pantalla que permite la creación del NFT bajo al estándar LSP7 */
  /* */ 
 -->

<!-- Importamos las librerías para crear los NFT bajo el estándar LSP7 -->
<script setup>
    import { ref } from 'vue';
    import LSP0ERC725Account from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
    import { LSPFactory } from '@lukso/lsp-factory.js';
    import ERC725js from '@erc725/erc725.js';
    import LSP12IssuedAssetsSchema from '@erc725/erc725.js/schemas/LSP12IssuedAssets.json';
    import LSP7Mintable_0_5_0 from '../../contracts/LSP7Mintable_0_5_0.json';
    import { IPFS_GATEWAY_API_BASE_URL, IPFS_GATEWAY_BASE_URL, BLOCKCHAIN_EXPLORER_BASE_URL, CHAIN_IDS } from '../../constants';
    import { addLuksoL14Testnet, addLuksoL16Testnet, isLuksoNetwork } from '../../../network';
    import { agregar_assets, leer_assets } from '../../services.js';

    //Funciones utilizadas para el cierre del modal
    const emit = defineEmits(['close', 'tokens-sent']);
    const handleModalClose = () => {
        emit('close', true);
    };

    //Definimos las variables
    const deploying = ref(false);               //Bandera que determina si se ha comenzado con el proceso de actualización//
    const error = ref(false);                   //Bandera que determina si se ha producido un error//
    const isEOA = ref(false);                   //Bandera que determina si se trata de una cuenta EOA//
    const deployEvents = ref([]);               //Variable que guarda los eventos del proceso//
    const isSuccess = ref(false);               //Bandera que determina si se ha completado el proceso de actualización//
    const isWrongNetwork = ref(false);          //Bandera que determina si se ha producido un error con la red//
    const tokenName = ref('');                  //Variable de formulario para el Nombre del Token//
    const tokenSymbol = ref('');                //Variable de formulario para el Símbolo del Token//
    const description = ref('');                //Variable de formulario para la descripción//

    //Función que cierra el modal y hace un refresh de la página
    function CloseModal() {
      window.location.reload();
    }

    //Función que crea el token
    async function onSubmit(e) {
        console.log("Entrando a onsubmit...");
        
        //Validamos si se encuentra activa la red de lukso, si no está activa, mostramos el error 
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

        // Obtenemos las cuentas de la extensión
        const accounts = await web3.eth.getAccounts();

        // Obtenemos la cuenta con la que se está autentificado
        const account = accounts[0]; 

        // Creamos la estructura JSON del metadata para crear el NFT
        const LSP4MetaData = {
            description: description.value,
            // icon: e.target.querySelector('input#icon').files[0],
            icon: [
                {
                    width: 640,
                    height: 598,
                    hashFunction: 'keccak256(bytes)',
                    hash: '0x78cfe3eea3a1924ec6d9b6599c507f150e956465494f98a4aa9b47422399cc8f',
                    url: 'ipfs://QmQhn79RV4GrzdYix39vgaWY3VzE4NvmCR2WqPYEgPDNop'
                }
            ],
            links: [],
            images: [],
            assets: [],
        };

        //Agregamos los archivos PDF al JSON
        Array.from(e.target.querySelector('input#pdf').files).forEach((value, index) => {
            LSP4MetaData.assets.push(value);
            // console.log(value);
            // console.log(index);
        });

        //Iniciamos las variables de actualización
        deployEvents.value = [];
        deploying.value = true;
        isSuccess.value = false;

        //Obtenemos el id de la cadena y la versión del Token
        const chainId = await web3.eth.getChainId();
        const version = chainId === CHAIN_IDS.L14 ? LSP7Mintable_0_5_0.bytecode : null;

        //Configuramos el estándar para crear el token 
        const factory = new LSPFactory(web3.currentProvider, { chainId });

        //Procedemos a crear el token 
        let contracts;
        try {
            //Establecemos los datos del token
            contracts = await factory.LSP7DigitalAsset.deploy(
            {
                name: tokenName.value,                      //Nombre del token, de acuerdo al formulario
                symbol: tokenSymbol.value,                  //Nombre del símbolo, de acuerdo al formulario
                controllerAddress: account,                 //Propietario del token de acuerdo al usurio logueado
                isNFT: true,                                //Establecemos si se trata de un FT (false) o un NFT (true)
                creators: [account],                        //Establecemos como creador al usuario autentificado
                digitalAssetMetadata: LSP4MetaData,         //Establecemos en el activo el valor del metadada creado
            },
            {
                ipfsGateway: IPFS_GATEWAY_API_BASE_URL,     //Configuramos el IPFS de las constantes
                LSP7DigitalAsset: {
                    version,                                //Establecemos la versión del token
                },
                onDeployEvents: {
                    next: (deploymentEvent) => {
                        console.log(deploymentEvent);

                        //Reportamos al usuario cuando se haya culminado cada fase
                        if (deploymentEvent.status === 'COMPLETE') {
                            deployEvents.value.push(deploymentEvent);
                        }
                    },
                    error: (err) => {
                        //Reportamos al usuario cuando se haya producido un error
                        deploying.value = false;
                        error.value = err.message;
                        console.log("Error in onDeployEvents...", error.value);
                        console.log("Error message in onDeployEvents...", error.value);
                    },
                    complete: (contracts) => {
                        //Reportamos al usuario cuando se haya culminado el proceso
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

        //Validamos si el proceso fue realizado con éxito, si no, se reporta al usuario
        if (!contracts && !contracts.LSP7DigitalAsset) {
            error.value = 'Error deploying LSP7DigitalAsset';
            console.log(error.value);
            return;
        }

        //Obtenemos los tokens del usuario, los parámetros son el esquema, la dirección del token, el provider de la extensión y la ruta de IPFS definida 
        //en el archivo de constants
        const deployedLSP7DigitalAssetContract = contracts.LSP7DigitalAsset;
        const erc725LSP12IssuedAssets = new ERC725js(LSP12IssuedAssetsSchema, accounts[0], window.web3.currentProvider, {
            ipfsGateway: IPFS_GATEWAY_BASE_URL,
        });

        //Filtramos únicamente los tokens creados por el usuario
        let LSP12IssuedAssets;
        let LSP12AssetsComplete;
        let i = 0;
        try {
            LSP12IssuedAssets = await erc725LSP12IssuedAssets.getData('LSP12IssuedAssets[]');
        }
        catch (err) {

            //Validamos si se trata de una cuenta EOA, se carga la información del local storage
            let bytecode = await web3.eth.getCode(accounts[0]);
            if (bytecode === '0x') {
                LSP12AssetsComplete = await leer_assets(accounts[0]);  

                let obj = {};
                obj.value = LSP12AssetsComplete;
                obj.account = accounts[0];

                LSP12IssuedAssets = obj;
                console.log(LSP12IssuedAssets);
            }            
        }

        //Obtenemos el nuevo token y lo agregamos a los tokens del usuario
        LSP12IssuedAssets.value.push(deployedLSP7DigitalAssetContract.address);

        //Validamos si se trata de una cuenta EOA, se carga la información del local storage
        let bytecode = await web3.eth.getCode(accounts[0]);
        if (bytecode === '0x') {
            
            //Guardamos los assets de la cuenta
            await agregar_assets(accounts[0], LSP12IssuedAssets.value);  

            isEOA.value = true;
        }

        //Codificamos los tokens (que incluyen el nuevo token)
        const LSP7InterfaceId = '0xe33f65c3';
        const encodedErc725Data = erc725LSP12IssuedAssets.encodeData([
            {
                keyName: 'LSP12IssuedAssets[]',
                value: LSP12IssuedAssets.value,
            },
            {
                keyName: 'LSP12IssuedAssetsMap:<address>',
                dynamicKeyParts: deployedLSP7DigitalAssetContract.address,
                value: [LSP7InterfaceId, LSP12IssuedAssets.value.length - 1], // LSP7 interface ID + index position of asset
            },
        ]);

        //Asignamos los tokens al usuario (importante, al asignarnos se remplazan los anteriores, por tal motivo se agrega el nuevo token al arreglo de tokens)
        try {
            //Definimos el contrato y la cuenta que se actualizara
            const profileContract = new window.web3.eth.Contract(LSP0ERC725Account.abi, accounts[0]);
            
            //Ejecutamos el proceso de actualización con los datos codificados en la cuenta
            const receipt = await profileContract.methods['setData(bytes32[],bytes[])'](encodedErc725Data.keys, encodedErc725Data.values).send({ from: accounts[0] });

            //Mostramos mensajes al usuario del estatus del proceso
            deployEvents.value.push({ receipt, type: 'TRANSACTION', functionName: 'setData' });
        }
        catch (err) {
            console.warn(err);
            error.value = err.message;
            deploying.value = false;
            return;
        }

        //Señalamos que el proceso ha finalizado correctamente
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
                        <!-- <div class="item-flex">
                            <span><strong>Ícono del Token (representación íconografica)</strong></span><br/>
                            <input type="file" id="icon" accept="image/*" value="https://upload.wikimedia.org/wikipedia/commons/4/47/Logo_del_ITESM.svg" required /><br/>
                        </div> -->

                        <div class="item-flex">
                            <span><strong>Archivo en PDF (paper)</strong></span><br/>
                            <input type="file" id="pdf" accept="application/pdf" required multiple />
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
