<!-- 
  /* */ 
  /* Pantalla principal para tokenizar los papers */
  /* */ 
 -->
 
 <!-- Importamos las librerías para recuperar los papers y cargamos los componentes que cargan los NFT y los que los crean  -->
 <script setup>
  import ERC725js from '@erc725/erc725.js';
  import LSP12IssuedAssetsSchema from '@erc725/erc725.js/schemas/LSP12IssuedAssets.json';
  import { onMounted, ref } from 'vue';
  import { IPFS_GATEWAY_BASE_URL } from '../../constants';
  import PapersLoadComponent from './PapersLoadComponent.vue';
  import ModalCreateTokenLSP7 from './ModalCreateTokenLSP7Component.vue';
  import ModalCreateTokenLSP8 from './ModalCreateTokenLSP8Component.vue';
  
  
  //Definimos las variables que se utilizaran dentro de la página//
  const addresses = ref([]);                          //Variable para guardar la dirección del NFT creados//
  const isLoading = ref(false);                       //Bandera que determina si se ha comenzado con el proceso de carga//

  //Definimos las variables que se utilizaran para abrir y cerrar el modal que permita crear el FT//
  const showModalLSP7 = ref(false);
  const handleModalCloseLSP7 = () => {
    showModalLSP7.value = false;
  };

  //Definimos las variables que se utilizaran para abrir y cerrar el modal que permita crear el NFT//
  const showModalLSP8 = ref(false);
  const handleModalCloseLSP8 = () => {
    showModalLSP8.value = false;
  };

  //Acciones que se realizan al cargar la página//
  onMounted(async () => {

    //Comenzamos con el proceso de carga//
    isLoading.value = true;

    // Obtenemos las cuentas de la extensión
    const accounts = await web3.eth.getAccounts();

    // Obtenemos la cuenta con la que se está autentificado
    const account = accounts[0]; 

    //Obtenemos los datos del perfil, los parámetros son el esquema, la cuenta, el provider de la extensión y la ruta de IPFS definida 
    //en el archivo de constants
    const erc725LSP12IssuedAssets = new ERC725js(LSP12IssuedAssetsSchema, account, window.web3.currentProvider, {
        ipfsGateway: IPFS_GATEWAY_BASE_URL,
    });

    //Una vez que se ha cargado el perfil, filtramos solo la sección de los NFT creados (LSP12IssuedAssets)
    try {
      const LSP12IssuedAssets = await erc725LSP12IssuedAssets.getData('LSP12IssuedAssets[]');

      //Guardamos la dirección del NFT creado
      addresses.value = LSP12IssuedAssets.value;
    } 
    catch (err) {
      // Probamos si es una cuenta del tipo EOA, procedemos a leer la información del localStorage
      const LSP12IssuedAssets = JSON.parse(localStorage.getItem('issuedAssets'));

      console.log(LSP12IssuedAssets.value);
      //Guardamos la dirección del NFT creado
      addresses.value = LSP12IssuedAssets.value;
    }

    //Terminamos el proceso de carga
    isLoading.value = false;
  });
</script>

<template>
  <div>
    <h4 class="center"><strong>Tus papers tokenizados</strong></h4>
  </div>
  
  <div class="center">
    <button class="button" @click="showModalLSP7 = !showModalLSP7" style="width: 230px">Tokenizar un paper</button>
    <ModalCreateTokenLSP7 @close="handleModalCloseLSP7" v-if="showModalLSP7" />

    <!-- <button class="button" @click="showModalLSP8 = !showModalLSP8" style="width: 230px">Tokenizar un paper</button>
    <ModalCreateTokenLSP8 @close="handleModalCloseLSP8" v-if="showModalLSP8" /> -->
  </div>

  <br />
  <div class="center" v-if="addresses.length === 0 && !isLoading">No existe ningún NFT hasta ahora</div>

  <br />
  <div class="center" style="display: block">
    <img v-if="addresses.length === 0 && !isLoading" class="emptyLogo center" src="../../assets/empty-up.png" alt="No hay ningún paper tokenizado" />
    <div v-else class="grid">
      <!--Cargamos el listado de componentes, mandamos como parámetros las direcciones de los NFT del perfil-->
      <PapersLoadComponent :address="address" v-for="address in addresses" :key="address" />
    </div>
  </div>

</template>

