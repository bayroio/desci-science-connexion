<!-- 
  /* */ 
  /* Pantalla principal de busqueda de información */
  /* */ 
 -->

<!-- Listado de componentes que se utilizaran dentro de la pantalla -->
<script setup>
  import ProfileListComponent from './ProfileListComponent.vue';                //Componente que incluye la información del Perfil//
  import AssetsListComponent from './AssetsListComponent.vue';                  //Componente que incluye la información del Perfil//
  import { URL_REFRESH_IMAGE, URL_SEARCH_IMAGE } from '../../constants';
  import { ref } from 'vue';
  import { methods } from 'underscore';

  let profilesearch = ref('');                      //Variable de formulario para buscar el perfil//
  let assetsearch = ref('');                        //Variable de formulario para buscar el activo//

  let profileKey = ref(0);                          //Variable que permite hacerel refresh del perfil//
  const reloadprofiles = () =>  {
      profileKey.value += 1;
  }
    
  let assetsKey = ref(0);                           //Variable que permite hacerel refresh de los activos//
  const reloadassets = () => {
      assetsKey.value += 1;
  }

</script>

<template>
  <div>
    <h4 class="center"><strong>Profiles</strong></h4>
    <div class="inputform">
      <input type="text" class="inputsearch" v-model="profilesearch" id="searchprofile" placeholder="Buscar Perfil ..."/>
      <a href="#" @click="reloadprofiles">
        <img v-bind:src="URL_SEARCH_IMAGE" class="imgsearch"/>
      </a>
    </div>
    <div class="reload">
      <a href="#" @click="reloadprofiles">
        <img v-bind:src="URL_REFRESH_IMAGE" class="imgreload"/>
        Refresh
      </a>
    </div>
    <ProfileListComponent :textSearch="profilesearch" :key="profileKey" />
  </div>

  <br/><br/>
  <div>
    <h4 class="center"><strong>Assets</strong></h4>
    <div class="inputform">
      <input type="text" class="inputsearch" v-model="assetsearch" id="searchasset" placeholder="Buscar Activo ..."/>
      <a href="#" @click="reloadassets">
        <img v-bind:src="URL_SEARCH_IMAGE" class="imgsearch"/>
      </a>
    </div>
    <div class="reload">
      <a href="#" @click="reloadassets">
        <img v-bind:src="URL_REFRESH_IMAGE" class="imgreload"/>
        Refresh
      </a>
    </div>
    <AssetsListComponent :textSearch="assetsearch" :key="assetsKey"/>
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