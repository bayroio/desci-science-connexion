<!-- 
  /* */ 
  /* Pantalla que carga el listado de assets, ya sea de forma aleatoria o conforme a una búsqueda */
  /* */ 
 -->

<!-- Listado de componentes que se utilizaran dentro de la pantalla -->
<script setup>
  import { IPFS_GATEWAY_BASE_URL, URL_ASSETS_SEARCH, URL_ASSETS_SEARCH2, ASSETS_COUNT, URL_ASSETS_NO_IMAGE, URL_PROFILE_ASSETS } from '../../constants';
  import axios from 'axios';
  import { defineProps, onMounted, ref } from 'vue';
  import LSP12IssuedAssetsSchema from '@erc725/erc725.js/schemas/LSP12IssuedAssets.json';
  import ERC725js from '@erc725/erc725.js';
  import { getissuedassets, validatewallet } from '../../services.js';
  import PapersLoadComponent from './PapersLoadComponent.vue'
  
  const props = defineProps({ textSearch: String });                //Variable que recibe el texto de búsqueda //
  const addresses = ref([]);                                        //Variable para guardar la dirección del NFT creados//
  const flagempty = ref(false);
  const Assets = ref(false);                                        //Variable que determina si se muestran los assets//

  //Acciones que se realizan al cargar la página//
  onMounted(async () => {

    //Validamos si existe una palabra a buscar//
    if (props.textSearch != ""){

      //Validamos si es un wallet address
      let flagwallet = await validatewallet(props.textSearch);
      if(flagwallet){

        //Obtenemos los datos del perfil, los parámetros son el esquema, la cuenta, el provider de la extensión y la ruta de IPFS definida 
        //en el archivo de constants
        const erc725LSP12IssuedAssets = new ERC725js(LSP12IssuedAssetsSchema, props.textSearch, window.web3.currentProvider, {
            ipfsGateway: IPFS_GATEWAY_BASE_URL,
        });

        //Get the address
        addresses.value = await getissuedassets(props.textSearch);  

        //set empty value
        if (addresses.value.length == 0){
          flagempty.value = true;
        }

        Assets.value = true;
      }
    }
  });

</script>

<template>
  <div v-if=(Assets)>

    <h4 class="center"><strong>NFT</strong></h4>

    <br />
    <div class="center" v-if="flagempty">No existe ningún NFT hasta ahora</div>
    <div class="center" style="display: block">
      <img v-if="flagempty" class="emptyLogo center" src="../../assets/empty-up.png" alt="No hay ningún paper tokenizado" />
      <div v-else class="grid">
        <!--Cargamos el listado de componentes, mandamos como parámetros las direcciones de los NFT del perfil-->
        <PapersLoadComponent :address="address" v-for="address in addresses" :key="address" />
      </div>
    </div>
  </div>

</template>

<style scoped>
  .cards {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    gap: 1rem;
  }

  .card {
    background-color: white;
    height: 240px;
    max-width: 210px;
    border-radius: 15px;
    box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
    transition: 0.5s;
    margin: 2rem;
  }

  .card:hover {
    box-shadow: 0 10px 20px 0 rgba(0,0,0,0.2);
    transform: translate(0, -3.5rem);
  }

  .cardimg {
    min-width: 100%;
    min-height: 170px;
    max-height: 170px;
    border-radius: 15px 15px 0px 0px;
  }

  .cardbody {
    margin-left: 10px;
  }

  .cardaddress {
    color: blueviolet;
    font-size: 17px;
  }

  .cardname{
    color:darkgreen;
    font-size: 14px;
    margin-top: -10px;
  }


/* 
  @media (min-width: 200px) {
    .cards { grid-template-columns: repeat(1, 1fr); }
  } */

  @media (min-width: 400px) {
    .cards { grid-template-columns: repeat(1, 1fr); }
  }

  @media (min-width: 600px) {
    .cards { grid-template-columns: repeat(2, 1fr); }
  }

  @media (min-width: 800px) {
    .cards { grid-template-columns: repeat(3, 1fr); }
  }

  @media (min-width: 1200px) {
    .cards { grid-template-columns: repeat(4, 1fr); }
  }	  
</style>