<!-- 
  /* */ 
  /* Pantalla principal de búsqueda de información */
  /* */ 
 -->

<!-- Listado de componentes que se utilizaran dentro de la pantalla -->
<script setup>
  import ProfileListComponent from './ProfileListComponent2.vue';                //Componente que incluye la información del Perfil//
  import AssetsListComponent from './AssetsListComponent2.vue';                  //Componente que incluye la información de los Activos//
  import { URL_REFRESH_IMAGE, URL_SEARCH_IMAGE } from '../../constants';        //Carga de constantes globales
  import { ref } from 'vue';
  import { methods } from 'underscore';

  let profilesearch = ref('');                      //Variable de formulario para buscar el perfil//
  let assetsearch = ref('');                        //Variable de formulario para buscar el activo//

  let profileKey = ref(0);                          //Variable y acción que permite hacer el refresh del perfil//
  let assetsKey = ref(0);                           //Variable y acción que permite hacer el refresh de los activos//
  const reload = () =>  {
      profileKey.value += 1;
      assetsKey.value += 1;
  }
    

</script>

<template>
  
  <!-- Sección de Perfiles -->
  <div>

    <!--Sección de búsqueda -->
    <div class="inputform">
      <input type="text" class="inputsearch" v-model="profilesearch" id="searchprofile" placeholder="Buscar Perfil / NFT..."/>
      <a href="#" @click="reload">
        <img v-bind:src="URL_SEARCH_IMAGE" class="imgsearch"/>
      </a>
    </div>
    <br/>

    <!-- Sección de perfiles-->
    <ProfileListComponent :textSearch="profilesearch" :key="profileKey" />

    <!-- Sección de Assets -->
    <AssetsListComponent :textSearch="profilesearch" :key="assetsKey"/>

  </div>
</template>

<style scoped>
  .reload {
    text-align: right;
    margin-right: 20px;;
  }

  .imgreload {
    width: 16px;
    height: 16px;;
  }
  
  .imgsearch {
    margin-bottom: -5px;
    width: 23px;
    height: 23px;;
  }

  .inputsearch{
    background-color: white;
    border-radius: 15px;
    max-width: 450px;
    box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
    margin: 1rem;
  }

  .inputform {
    text-align: center;
  }
 
</style>