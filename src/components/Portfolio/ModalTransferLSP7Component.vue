<!-- 
  /* */ 
  /* Pantalla que permite la transferencia del NFT bajo al estándar LSP7 */
  /* */ 
 -->

 <!-- Importamos las librerías para transferir el NFT bajo el estándar LSP7, así como el componente de envío -->
<script setup>
  import { onMounted, ref, defineProps, defineEmits } from 'vue';
  import ERC725js from '@erc725/erc725.js';
  import LSP4DigitalAssetSchema from '@erc725/erc725.js/schemas/LSP4DigitalAsset.json';
  import LSP7DigitalAsset from '@lukso/lsp-smart-contracts/artifacts/LSP7DigitalAsset.json';
  import { IPFS_GATEWAY_BASE_URL, INTERFACE_IDS } from '../../constants';
  import ModalSendComponent from './ModalSendComponent.vue';

  //Funciones utilizadas para el cierre del modal
  const emit = defineEmits(['remove-asset']);
  const handleModalClose = () => {
    showModal.value = false;

    //Leemos el token id que se recibió como parámetro para descontarlo
    if (!parseInt(balanceOf.value)) {
      emit('remove-asset', { assetAddress: props.address });
    }
  };

  //Definimos las variables que utilizaremos
  const props = defineProps({
    address: String,                              //Variable que guarda la dirección del token (enviado por parámetro)
  });
  const LSP4TokenName = ref('');                  //Variable que guarda el Nombre del Token//
  const LSP4TokenSymbol = ref('');                //Variable que guarda el Simbolo del Token//
  const LSP4Metadata = ref();                     //Variable que guarda el Metadata del Token//
  const iconUrl = ref('');                        //Variable que guarda la URL del Token//
  const balanceOf = ref();                        //Variable que guarda el saldo de la cuenta //
  const isLsp7 = ref(false);                      //Bandera que determina si se trata de un token de estándar LSP7 (observación, los token NFT son LSP7 y LSP8)//
  const isLsp8 = ref(false);                      //Bandera que determina si se trata de un token de estándar LSP8 (solo los NFT 2.0)//
  const showModal = ref(false);                   //Bandera que determina si se muestra el modal de transferir//

  //Acciones que se realizan al cargar la página//
  onMounted(async () => {
    refreshToken();
  });


  //Función que descuenta del total acuñado la cantidad
  async function handleTokensSent() {
    await refreshToken();

    //Si se trata de un token EOA, actualizamos el número total acuñado en el LocalStorage
    if (!parseInt(balanceOf.value) && localStorage.getItem('receivedAssets')) {

      //Leemos los datos del local storage
      const LSP5ReceivedAssets = JSON.parse(localStorage.getItem('receivedAssets'));
      LSP5ReceivedAssets.value = LSP5ReceivedAssets.value.filter(function (assetAddress) {
        return assetAddress !== props.address;
      });

      //Actualizamos los datos del LocalStorage
      localStorage.setItem('receivedAssets', JSON.stringify(LSP5ReceivedAssets));
    }
  }

  //Función que obtiene los datos del token 
  const refreshToken = async () => {

    //Leemos los datos del token
    const erc725Asset = new ERC725js(LSP4DigitalAssetSchema, props.address, window.web3.currentProvider, {
      ipfsGateway: IPFS_GATEWAY_BASE_URL,
    });

    //Filtramos únicamente los datos que requerimos (Nombre, símbolo, metadata) 
    const LSP4DigitalAsset = await erc725Asset.fetchData(['LSP4TokenName', 'LSP4TokenSymbol', 'LSP4Metadata']);
    LSP4TokenName.value = LSP4DigitalAsset[0].value;
    LSP4TokenSymbol.value = LSP4DigitalAsset[1].value;
    LSP4Metadata.value = LSP4DigitalAsset[2].value;
    iconUrl.value = LSP4DigitalAsset[2].value.LSP4Metadata.icon[0].url.replace('ipfs://', IPFS_GATEWAY_BASE_URL);

    // Obtenemos las cuentas de la extensión
    const accounts = await web3.eth.getAccounts();

    // Obtenemos la cuenta con la que se está autentificado
    const account = accounts[0]; 

    //Creamos el contrato, para trasferir el NFT
    const lsp4DigitalAssetContract = new window.web3.eth.Contract(LSP7DigitalAsset.abi, props.address);

    //Obtenemos el saldo de la cuenta
    balanceOf.value = web3.utils.fromWei(await lsp4DigitalAssetContract.methods.balanceOf(account).call());

    //Obtenemos si el token soporta la interfaz LSP7 y LSP8
    [isLsp7.value, isLsp8.value] = await Promise.all([
      lsp4DigitalAssetContract.methods.supportsInterface(INTERFACE_IDS.LSP7DigitalAsset).call(),
      lsp4DigitalAssetContract.methods.supportsInterface(INTERFACE_IDS.LSP8IdentifiableDigitalAsset).call(),
    ]);
  };
</script>

<template>
  <div class="asset-wrapper">
    <div class="preview-card" :style="{ boxShadow: isLsp7 ? 'none' : '' }">
      <div class="image" :style="{ backgroundImage: `url(${iconUrl})`, borderRadius: isLsp7 ? '50%' : '50%' }">
        <small class="supply"> Balance: {{ balanceOf }} </small>
      </div>

      <div class="infos">{{ LSP4TokenName }} ({{ LSP4TokenSymbol }})</div>
    </div>
    <button class="button" style="width: 200px" @click="showModal = !showModal">Enviar</button>
    <ModalSendComponent @tokens-sent="handleTokensSent" :is-lsp7="true" :is-lsp8="false" v-if="showModal" :asset-address="props.address" :asset-name="LSP4TokenName" @close="handleModalClose" />
  </div>
</template>
