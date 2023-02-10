<!-- 
  /* */ 
  /* Pantalla principal de busqueda de información */
  /* */ 
 -->

<!-- Listado de componentes que se utilizaran dentro de la pantalla -->
<script setup>
  import ProfileListComponent from './ProfileListComponent.vue';                //Componente que incluye la información del Perfil//
  import AssetsListComponent from './AssetsListComponent.vue';                  //Componente que incluye la información del Perfil//
  import { URL_REFRESH_IMAGE } from '../../constants';
</script>


<script>
  export default {
    data() {
      return {
        profileKey: 0,
        assetsKey: 0,
      };
    },
    methods: {
      reloadprofiles() {
        this.profileKey += 1;
      },
      reloadassets() {
        this.assetsKey += 1;
      }
    }
  }
</script>



<template>
  <div>
    <h4 class="center"><strong>Profiles</strong></h4>
    <div class="reload">
      <a href="#" @click="reloadprofiles()">
        <img v-bind:src="URL_REFRESH_IMAGE" class="imgreload"/>
        Refresh
      </a>
    </div>
    <ProfileListComponent :key="profileKey"/>
  </div>

  <br/><br/>
  <div>
    <h4 class="center"><strong>Assets</strong></h4>
    <div class="reload">
      <a href="#" @click="reloadassets()">
        <img v-bind:src="URL_REFRESH_IMAGE" class="imgreload"/>
        Refresh
      </a>
    </div>
    <AssetsListComponent :key="assetsKey"/>
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

</style>