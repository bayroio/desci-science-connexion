<!-- 
  /* */ 
  /* Pantalla que carga los papers del perfil, recibe como parámetros las direcciones de los NFT */
  /* */ 
 -->
 
 <!-- Importamos las librerías para recuperar y leer los papers, así como también cargamos los componentes que permiten acuñar los NFT -->
 <script setup>
  import { onMounted, ref, defineProps } from 'vue';
  import ERC725js from '@erc725/erc725.js';
  import LSP4DigitalAssetSchema from '@erc725/erc725.js/schemas/LSP4DigitalAsset.json';
  import LSP7DigitalAsset from '@lukso/lsp-smart-contracts/artifacts/LSP7DigitalAsset.json';
  import { IPFS_GATEWAY_BASE_URL, COMMON_ABIS, INTERFACE_IDS } from '../../constants';

  //Definimos las variables que se utilizaran dentro de la página//
  const props = defineProps({ address: String });                           //Variable que recibe las direcciones de los NFT creados//
  const LSP4TokenName = ref('');                                            //Variable que almacena el nombre del Token//
  const LSP4TokenSymbol = ref('');                                          //Variable que almacena el símbolo del Token//
  const iconUrl = ref('');                                                  //Variable que almacena el icono del Token//
  const LSP4Metadata = ref();                                               //Variable que almacena el detalle del Token//
  const totalSupply = ref();                                                //Variable que almacena el total de Token acuñados//
  const creationType = ref('unknown');                                      //Variable que almacena el tipo de Token (FT o NFT)//

  
  //Acciones que se realizan al cargar la página//
  onMounted(async () => {

    //Determinamos que tipo de interfaz soporta cada dirección
    const supportsInterfaceContract = new window.web3.eth.Contract([COMMON_ABIS.supportsInterface], props.address);

    //Determinamos para cada dirección el tipo de interfaz que soporta, los NFT soportan la interfaz FT y NFT, mientras que los FT solo soportan la interfaz FT
    const [isLSP7, isLSP8] = await Promise.all([
      await supportsInterfaceContract.methods.supportsInterface(INTERFACE_IDS.LSP7DigitalAsset).call(),
      await supportsInterfaceContract.methods.supportsInterface(INTERFACE_IDS.LSP8IdentifiableDigitalAsset).call(),
    ]);

    //De acuerdo al tipo de interfaz que soportan clasificamos el token
    try {
      if (isLSP8) {
        creationType.value = 'NFT';
      }
      else {
        if (isLSP7) {
          creationType.value = 'NFT ';
        }
        else {
          console.error(`El contrato: ${props.address} no soporta la interface NFT.`);
          return;
        }
      }
    }
    catch (err) {
      console.error(`No se puede encontrar la interface del contrato: ${props.address}`);
    }

    //Obtenemos los datos del token, los parámetros son el esquema, la dirección del token, el provider de la extensión y la ruta de IPFS definida 
    //en el archivo de constants
    const erc725Asset = new ERC725js(LSP4DigitalAssetSchema, props.address, window.web3.currentProvider, {
        ipfsGateway: IPFS_GATEWAY_BASE_URL,
    });
    
    //Filtramos únicamente los datos que nos interesan (Nombre, Símbolo y Metadata (solo el icono))
    const LSP4DigitalAsset = await erc725Asset.fetchData(['LSP4TokenName', 'LSP4TokenSymbol', 'LSP4Metadata']);
    LSP4TokenName.value = LSP4DigitalAsset[0].value;
    LSP4TokenSymbol.value = LSP4DigitalAsset[1].value;
    LSP4Metadata.value = LSP4DigitalAsset[2].value;
    const icons = LSP4DigitalAsset[2].value.LSP4Metadata.icon;

    //Determinamos si existe un icono para el token y si es así lo mostramos
    if (icons && icons.length > 0) {
      iconUrl.value = LSP4DigitalAsset[2].value.LSP4Metadata.icon[0].url.replace('ipfs://', IPFS_GATEWAY_BASE_URL);
    }

    //Por último obtenemos el total de tokens acuñados
    const lsp4DigitalAssetContract = new window.web3.eth.Contract(LSP7DigitalAsset.abi, props.address);
    totalSupply.value = isLSP8 ? await lsp4DigitalAssetContract.methods.totalSupply().call() : web3.utils.fromWei(await lsp4DigitalAssetContract.methods.totalSupply().call());
});
</script>

<template>
  <div class="">
    <div class="preview-card" :style="{ boxShadow: creationType === 'NFT ' ? 'none' : 'none' }">
      <div class="image" :style="{ backgroundImage: `url(${iconUrl})`, borderRadius: creationType === 'NFT ' ? '50%' : '50%' }"></div>
      <div class="infos">{{ LSP4TokenName }} ({{ LSP4TokenSymbol }})</div>
    </div>
    
    <button v-if="creationType === 'NFT'" class="button" style="width: 200px">Solicitar Licencia</button>
    <button v-else-if="creationType === 'NFT '" class="button" style="width: 200px">Solicitar Licencia</button>
  </div>
</template>
