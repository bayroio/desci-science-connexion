<!-- 
  /* */ 
  /* Pantalla que permite acuñar NFT bajo al estándar LSP8 */
  /* */ 
 -->

<!-- Importamos las librerías para acuñar los NFT bajo el estándar LSP8 -->
<script setup>
    import { onMounted, ref } from 'vue';
    import { useRoute } from 'vue-router';
    import ERC725js from '@erc725/erc725.js';
    import LSP4DigitalAssetSchema from '@erc725/erc725.js/schemas/LSP4DigitalAsset.json';
    import LSP8Mintable from '@lukso/lsp-smart-contracts/artifacts/LSP8Mintable.json';
    import { BLOCKCHAIN_EXPLORER_BASE_URL, IPFS_GATEWAY_API_BASE_URL } from '../../constants';
    import { LSP4DigitalAssetMetadata } from '@lukso/lsp-factory.js';
    import { addLuksoL14Testnet, addLuksoL16Testnet, isLuksoNetwork } from '../../../network';
    import { isContractAddressInBloom } from 'web3-utils';

    //Funciones utilizadas para el cierre del modal
    const emit = defineEmits(['close', 'tokens-sent']);
    const handleModalClose = () => {
        emit('close', true);
    };

    //Definimos las variables    
    const props = defineProps({ address: String });     //Variable que recibe la dirección del NFT a acuñar//
    const LSP4TokenName = ref('');                      //Variable para el Nombre del Token//
    const LSP4TokenSymbol = ref('');                    //Variable para el Simbolo del Token//
    const error = ref('');                              //Variable que guarda los errores que se producen//
    const description = ref('');                        //Variable de formulario para indicar la descripción del token//
    const tokenId = ref('');                            //Variable que almacena el id del token//
    const mintEvents = ref([]);                         //Variable que indica el número de tokens a acuñar//    
    const isSuccess = ref(false);                       //Bandera que determina si se ha completado el proceso de actualización//
    const isWrongNetwork = ref(false);                  //Bandera que determina si se ha producido un error con la red//
    const isLoading = ref(false);                       //Bandera que determina si se ha comenzado con el proceso de actualización//
    const forceParameter = ref(false);                  //Bandera que determina si se fuerza el parámetro al acuñar el NFT//
    const isMinterEOA = ref(false);                     //Bandera que determina si se trata de una cuenta EOA//

    //Función que cierra el modal y hace un refresh de la página    
    function CloseModal() {
      window.location.reload();
    }

    //Función que acuña el token
    async function onSubmit(e) {
        console.log("Entrando a onsubmit...")

        //Validamos si se encuentra activa la red de lukso, si no está activa, mostramos el error 
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

        // Obtenemos las cuentas de la extensión
        const accounts = await web3.eth.getAccounts();

        // Obtenemos la cuenta con la que se está autentificado
        const account = accounts[0]; 
        
        //Obtenemos el código de la cuenta
        let minterBytecode = await web3.eth.getCode(account);

        //Validamos si se trata de un EOA, si es así se debe de forzar el acuñado
        if (minterBytecode === '0x' && forceParameter.value === false) {
            isMinterEOA.value = true;
            return;
        }

        //Cambiamos el estatus del proceso
        isMinterEOA.value = false;
        isLoading.value = true;
        isSuccess.value = false;
        error.value = '';
        mintEvents.value = [];

        //Creamos el smart contract para acuñar el NFT y las variables 
        const lsp8IdentifiableDigitalAssetContract = new window.web3.eth.Contract(LSP8Mintable.abi, props.address);
        const paddedTokenId = web3.utils.padRight(web3.utils.stringToHex(tokenId.value), 64);       //Token que se acuñara
        const to = account;                                                                         //Persona que acuña el token
        const force = forceParameter.value;                                                         //Determina si se va a forzar la compatibilidad (true) o solo para las cuentas que tienen habilitado el LSP1 UniversalReceiver(false).
        const data = '0x';
        console.log("paddedtokenid: ", paddedTokenId);

        try {
            //Acuñamos el token e informaos al usuario
            const receipt = await lsp8IdentifiableDigitalAssetContract.methods.mint(to, paddedTokenId, force, data).send({ from: account });
            mintEvents.value.push({ stepName: 'Acuñar el NFT', functionName: 'acuñar', receipt });

        }
        catch (err) {
            error.value = err.message;
            console.log(err);
            isLoading.value = false;
            return;
        }

        //Agregamos los archivos PDF al JSON
        const filespdf = [];
        e.target.querySelector('input#pdf').files.forEach((value, index) => {
            filespdf.push(value);
            console.log(value);
            console.log(index);
        });

        //Creamos y actualizamos el token, con los datos proporcionados en el formulario por el usuario
        const metadata = await LSP4DigitalAssetMetadata.uploadMetadata({
                description: description.value,                                     //Actualizamos la descripción
                icon: e.target.querySelector('input#icon').files[0],                //Actualizamos el icono
                assets: filespdf,                                                   //Actualizamos los PDF
            },
            {
                ipfsGateway: IPFS_GATEWAY_API_BASE_URL,
        });
        
        //Informamos al usuario que se actualizo el token
        mintEvents.value.push({ stepName: 'Generar y actualizar el archivo metadata' });

        //Obtenemos el token del usuario, los parámetros son el esquema, la dirección del token, el provider de la extensión
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

        //Codificamos los datos conforme al estándar
        const encodedErc725Data = erc725js.encodeData({
            keyName: 'LSP8MetadataJSON:<bytes32>',
            dynamicKeyParts: paddedTokenId,
            value: {
                json: metadata.json,
                url: metadata.url,
            },
        });

        try {
            //Actualizamos el perfil del usuario con la nueva cantidad de tokens
            const receipt = await lsp8IdentifiableDigitalAssetContract.methods['setData(bytes32[],bytes[])'](encodedErc725Data.keys, encodedErc725Data.values).send({ from: account });

            //Informamos al usuario que se está realizando el proceso de actualización del perfil
            mintEvents.value.push({ stepName: 'Actualizar el Universal Profile', functionName: 'setData', receipt });
        } 
        catch (err) {
            isLoading.value = false;
            error.value = err;
            return;
        }

        //Si se trata de una cuenta EOA, cargamos los datos del LocalStorage y agregamos el nuevo token acuñado
        let bytecode = await web3.eth.getCode(account);
        if (bytecode === '0x') {
            let LSP5ReceivedAssets = JSON.parse(localStorage.getItem('receivedAssets'));
            if (LSP5ReceivedAssets.value.indexOf(props.address) === -1) {
                LSP5ReceivedAssets.value.push(props.address);
                localStorage.setItem('receivedAssets', JSON.stringify(LSP5ReceivedAssets));
            }
        }

        //Informamos que se ha realizado el proceso de forma correcta
        isLoading.value = false;
        isSuccess.value = true;
    }

    //Acciones que se realizan al cargar la página//
    onMounted(async () => {
        //Cargamos la información del token 
        const erc725Asset = new ERC725js(LSP4DigitalAssetSchema, props.address, window.web3.currentProvider);

        //Filtramos la información que requerimos (TokenName y Token Symbol)
        const LSP4DigitalAsset = await erc725Asset.fetchData(['LSP4TokenName', 'LSP4TokenSymbol']);

        //Guardamos los valores en las variables globales de la página
        LSP4TokenName.value = LSP4DigitalAsset[0].value;
        LSP4TokenSymbol.value = LSP4DigitalAsset[1].value;
        icon.value = '';
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

                    <div class="formfields">
                        <div class="item-flex">                    
                            <span><strong>Ícono del Token (representación íconografica)</strong></span><br/>
                            <input type="file" id="icon" accept="image/*" required />
                        </div>   

                        <div class="item-flex">
                            <span><strong>Archivo en PDF (paper)</strong></span><br/>
                            <input type="file" id="pdf" accept="application/pdf" required multiple/>
                        </div>   
                    </div>

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

        <br /><br />
        <div class="right" v-if="isSuccess" >
            <button @click="CloseModal">Cerrar</button>
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
