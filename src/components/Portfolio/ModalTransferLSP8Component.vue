<!-- 
  /* */ 
  /* Pantalla que permite la transferencia del NFT bajo al estándar LSP8 */
  /* */ 
 -->

 <!-- Importamos las librerías para transferir el NFT bajo el estándar LSP8, así como el componente de envío -->
 <script setup>
  import { onMounted, ref, defineProps, defineEmits } from 'vue';
  import ERC725js from '@erc725/erc725.js';
  import LSP4DigitalAssetSchema from '@erc725/erc725.js/schemas/LSP4DigitalAsset.json';
  import { IPFS_GATEWAY_BASE_URL } from '../../constants';
  import ModalSendComponent from './ModalSendComponent.vue';

  //Funciones utilizadas para el cierre del modal
  const emit = defineEmits(['remove-asset']);
  async function handleModalClose(wasAssetSent) {
    showModal.value = false;

    //Leemos el token id que se recibió como parámetro para descontarlo
    if (wasAssetSent) {
      emit('remove-asset', { assetAddress: props.address, tokenId: props.tokenId });
    }
  }

  //Definimos las variables que utilizamos
  const props = defineProps({
    address: String,                                  //Variable que guarda la dirección del token (enviado por parámetro)
    tokenId: String,                                  //Variable que guarda el id del token (enviado por parámetro)
  });
  const LSP4TokenName = ref('');                      //Variable que guarda el Nombre del Token//
  const LSP4TokenSymbol = ref('');                    //Variable que guarda el Simbolo del Token//
  const LSP4Metadata = ref();                         //Variable que guarda el Metadata del Token//
  const iconUrl = ref('');                            //Variable que guarda la URL del Token//
  const showModal = ref(false);                       //Bandera que determina si se muestra el modal de transferir//  
  const LSP8MetadataJSONSchema = {                    //Definimos el esquema para transferir el token
    name: 'LSP8MetadataJSON:<bytes32>',
    key: '0x9a26b4060ae7f7d5e3cd0000<bytes32>',
    keyType: 'Mapping',
    valueType: 'bytes',
    valueContent: 'JSONURL',
  };

  //Acciones que se realizan al cargar la página//
  onMounted(async () => {

    //Leemos los datos del token
    const erc725Asset = new ERC725js([...LSP4DigitalAssetSchema, LSP8MetadataJSONSchema], props.address, window.web3.currentProvider, {
      ipfsGateway: IPFS_GATEWAY_BASE_URL,
    });

    //Filtramos únicamente los datos que requerimos (Nombre, símbolo, metadata y la imagen) 
    const LSP4DigitalAsset = await erc725Asset.fetchData([
      'LSP4TokenName',
      'LSP4TokenSymbol',
      {
        keyName: 'LSP8MetadataJSON:<bytes32>',
        dynamicKeyParts: props.tokenId,
      },
      'LSP4Metadata',
    ]);
    LSP4TokenName.value = LSP4DigitalAsset[0].value;
    LSP4TokenSymbol.value = LSP4DigitalAsset[1].value;
    LSP4Metadata.value = LSP4DigitalAsset[2].value;
    try {
      iconUrl.value = LSP4DigitalAsset[2].value.LSP4Metadata.icon[0].url.replace('ipfs://', IPFS_GATEWAY_BASE_URL);
    }
    catch (error) {
      iconUrl.value = LSP4DigitalAsset[3].value.LSP4Metadata.icon[0].url.replace('ipfs://', IPFS_GATEWAY_BASE_URL);
    }
  });
</script>

<template>
  <div class="asset-wrapper">
    <div class="preview-card">
      <div class="image" :style="{ backgroundImage: `url(${iconUrl})`, borderRadius: isLsp7 ? '50%' : '50%'  }"></div>
      <div class="infos">{{ LSP4TokenName }} ({{ LSP4TokenSymbol }})</div>
    </div>
    <button class="button" style="width: 200px" @click="showModal = !showModal">Enviar</button>
    <ModalSendComponent @close="handleModalClose" :token-id="tokenId" :is-lsp7="false" :is-lsp8="true" v-if="showModal" :asset-address="props.address" :asset-name="LSP4TokenName" />
  </div>
</template>
