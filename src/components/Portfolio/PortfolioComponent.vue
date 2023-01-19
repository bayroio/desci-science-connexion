<!-- 
  /* */ 
  /* Pantalla principal que muestra el portafolio */
  /* */ 
 -->
 
 <!-- Importamos las librerías para recuperar los papers y cargamos los componentes que permiten transferir un NFT -->
 <script setup>
  import { onMounted, ref } from 'vue';
  import ERC725js from '@erc725/erc725.js';
  import LSP5ReceivedAssetsSchema from '@erc725/erc725.js/schemas/LSP5ReceivedAssets.json';
  import LSP8IdentifiableDigitalAsset from '@lukso/lsp-smart-contracts/artifacts/LSP8IdentifiableDigitalAsset.json';
  import ModalTransferLSP7Component from './ModalTransferLSP7Component.vue';
  import ModalTransferLSP8Component from './ModalTransferLSP8Component.vue';
  import { INTERFACE_IDS } from '../../constants';

  //Definimos las variables
  const isLoading = ref(false);         //Bandera que determina si se ha comenzado con el proceso de carga//
  const receivedAssets = ref([]);       //Variable que guarda los activos recibidos //
  const receivedTokens = ref([]);       //Variable que guarda el token recibido //

  //Funciones utilizadas para el cierre del modal
  async function handleRemoveAsset({ tokenId, assetAddress }) {
    //Actualizamos el estatus de la variable de carga
    isLoading.value = true;

    //Establecemos el token que se transfirió
    const currentReceivedTokens = receivedTokens.value;

    //Removemos el token del portafolio
    const updatedRecievedTokens = currentReceivedTokens.filter(function (token) {
      if (!tokenId) {
        return token.assetAddress !== assetAddress;
      }
      return token.tokenId !== tokenId;
    });

    try {
      //Actualizamos los tokens recibidos
      receivedTokens.value = updatedRecievedTokens;

      //Reducimos los activos recibidos
      receivedAssets.value = updatedRecievedTokens.reduce(function (acc, token) {
        if (!acc.includes(token.assetAddress)) {
          acc.push(token.assetAddress);
        }
        return acc;
      },
      []);
    }
    catch (err) {
      console.warn(err);
    }

    //Indicamos que se ha culminado el proceso de carga
    isLoading.value = false;
  }

  //Acciones que se realizan al cargar la página//  
  onMounted(async () => {
    //Actualizamos el estatus de la variable de carga
    isLoading.value = true;

    // Obtenemos las cuentas de la extensión
    const accounts = await window.web3.eth.getAccounts();
    
    // Obtenemos la cuenta con la que se está autentificado, la guardamos en las variables globales de la página
    const account = accounts[0]; 
    
    try {
      //Obtenemos los datos del perfil, los parámetros son el esquema, la cuenta, el provider de la extensión 
      const erc725LSP12IssuedAssets = new ERC725js(LSP5ReceivedAssetsSchema, account, window.web3.currentProvider);

      //Filtramos únicamente los token que se pueden transferir
      const LSP5ReceivedAssets = await erc725LSP12IssuedAssets.getData('LSP5ReceivedAssets[]');
      receivedAssets.value = LSP5ReceivedAssets.value;
    } 
    catch (err) {
      // Validamos si se trata de una cuenta EOA, si es así, cargamos la información del Local Storage
      const LSP5ReceivedAssets = JSON.parse(localStorage.getItem('receivedAssets'));
      receivedAssets.value = LSP5ReceivedAssets.value;
    }

    //Filtramos los tokens de acuerdo al token que buscamos
    receivedAssets.value.forEach(async (receivedAsset) => {
      
      //Determinamos para cada dirección el tipo de interfaz que soporta, los NFT soportan la interfaz FT y NFT, mientras que los FT solo soportan la interfaz FT
      const lsp8IdentifiableDigitalAssetContract = new window.web3.eth.Contract(LSP8IdentifiableDigitalAsset.abi, receivedAsset);
      const [isLSP7, isLSP8] = await Promise.all([
        lsp8IdentifiableDigitalAssetContract.methods.supportsInterface(INTERFACE_IDS.LSP7DigitalAsset).call(),
        lsp8IdentifiableDigitalAssetContract.methods.supportsInterface(INTERFACE_IDS.LSP8IdentifiableDigitalAsset).call(),
      ]);

      //Validamos de que tipo de estándar se trata
      if (isLSP8) {
        //Obtenemos los tokens ids de la cuenta
        const tokenIds = await lsp8IdentifiableDigitalAssetContract.methods.tokenIdsOf(account).call();

        //Buscamos el id del token que se va a transferir 
        tokenIds.forEach((tokenId) => {

          //Agregamos los valores a la variable de tokens con los datos requeridos
          receivedTokens.value.push({
            assetAddress: receivedAsset,
            isLSP7,
            isLSP8,
            tokenId,
          });
        });
      }
      else {
        if (!isLSP8){
          //Agregamos los valores a la variable de tokens con los datos requeridos
          receivedTokens.value.push({
            assetAddress: receivedAsset,
            isLSP7,
            isLSP8,
            tokenId: null,
          });
        }
      }
    });

    //Indicamos que hemos terminado el proceso de carga
    isLoading.value = false;
  });
</script>

<template>
  <div>
    <h4 class="center"><strong>Portafolio</strong></h4>
  </div>
  
  <br />
  <div class="center" style="display: block">
    <img v-if="receivedAssets.length === 0 && !isLoading" class="emptyLogo" src="../../assets/empty-up.png" alt="No hay ningún paper tokenizado" />
    <div v-if="receivedAssets.length === 0 && !isLoading">No existe ningún paper tokenizado hasta ahora</div>
    <div v-else class="grid">
      <div v-for="receivedToken in receivedTokens" :key="receivedToken.tokenId">
        <ModalTransferLSP7Component @remove-asset="handleRemoveAsset" v-if="receivedToken.isLSP7 && !receivedToken.isLSP8" :address="receivedToken.assetAddress" />
        <ModalTransferLSP8Component @remove-asset="handleRemoveAsset" v-if="receivedToken.isLSP8" :address="receivedToken.assetAddress" :token-id="receivedToken.tokenId" />
      </div>
    </div>
  </div>
</template>
