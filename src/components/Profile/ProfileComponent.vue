<!-- 
  /* */ 
  /* Pantalla principal del perfil, muestra la información general del perfil */
  /* */ 
 -->

<!-- Importamos las librerías para recuperar el perfil y cargamos el componente para actualizar el perfil -->
<script>
  import { ref } from 'vue';
  import _ from 'underscore';
  import ERC725js from '@erc725/erc725.js';
  import LSP3UniversalProfileMetaDataSchema from '@erc725/erc725.js/schemas/LSP3UniversalProfileMetadata.json';
  import identicon from 'ethereum-blockies-base64';
  import { IPFS_GATEWAY_BASE_URL } from '../../constants';
  import ModalUpdate from './ModalProfileComponentUpdate.vue';

  //Definimos las variables que se utilizaran dentro de la página
  export default {
    data() {
      return {
        profileData: {                          //Variable para asignar el perfil//
          profileImage: {
            url: '',
          },
        },
        address: '',                            //Variable para guardar la dirección del perfil//
        error: false,                           //Variable para guardar los errores//
      };
    },

    //Acciones que se realizan al cargar la página//
    async mounted() {

      // Obtenemos las cuentas de la extensión
      const accounts = await web3.eth.getAccounts();
      
      // Obtenemos la cuenta con la que se está autentificado, la guardamos en las variables globales de la página
      const account = accounts[0]; 
      this.address = account;
      this.profileData.address = account;

      //Obtenemos la imagen (default) de la cuenta autentificada
      this.profileData.identicon = identicon(account);
      
      //Obtenemos los datos del perfil, los parámetros son el esquema, la cuenta, el provider de la extensión y la ruta de IPFS definida 
      //en el archivo de constants
      const profile = new ERC725js(LSP3UniversalProfileMetaDataSchema, account, window.web3.currentProvider, {
        ipfsGateway: IPFS_GATEWAY_BASE_URL,
      });

      //Una vez que se ha cargado el perfil, filtramos solo la sección del perfil (LSP3Profile)
      let metaData;
      try {
        metaData = await profile.fetchData('LSP3Profile');
        //console.log(metaData);
      } 
      catch (e) {
        this.profileData.name = false;
        this.error = e;
        return;
      }
      
      //Guardamos la información en la variable ProfileData
      this.profileData = {
        ...this.profileData,
        ...metaData.value.LSP3Profile,
      };

      //Validamos si la imagen está dentro del rango de 200 y 500 de largo (estándar definido), 
      //si es así, colocamos la imagen como la imagen del perfil
      this.profileData.profileImage = _.find(this.profileData.profileImage, (image) => {
        if (image.width >= 200 && image.width <= 500) 
          return image;
      });
      
      //Si la imagen no se encuentra definida, se coloca la imagen por default
      if (!this.profileData.profileImage && metaData.value.LSP3Profile.profileImage) {
        this.profileData.profileImage = metaData.value.LSP3Profile.profileImage[0];
      }

      //Colocamos la ruta del IPFS en caso de que exista
      if (this.profileData.profileImage != undefined)
        this.profileData.profileImage.url = this.profileData.profileImage.url.replace('ipfs://', profile.options.ipfsGateway);
    },
  };
</script>

<script setup>
  const showModal = ref(false);
  const handleModalClose = () => {
    showModal.value = false;
  };
</script>


<template>
  <div>
    <h4 class="center"><strong>Datos Generales</strong></h4>
  </div>

  <table style="border: none">
    <tr>
      <!--Images-->
      <td width="30%" valign="Top">
        <div class="center profile">
          <div class="profileImage">
            <div class="identicon" v-bind:style="{ backgroundImage: 'url(' + profileData.identicon + ')' }" ></div>
            <div class="image" v-bind:style="{ backgroundImage: 'url(' + profileData.profileImage?.url + ')' }"></div>
          </div>
        </div>
      </td>

      <!--Datos-->
      <td width="70%" valign="top">
        <div>
          <span><strong>Address: </strong></span><br/>
          <span class="username">{{ address }}</span><br/>

          <br/>
          <span><strong>Username: </strong></span><br/>
          <span class="username" v-if="profileData.name"> {{ profileData.name }} </span><br/>

          <br/>
          <span><strong>Tags: </strong></span><br/>
          <div v-if="profileData.tags">
            <span class="username"  v-for="(item, index) in profileData.tags" v-bind:key="index"> "{{ item }}"&nbsp;&nbsp;&nbsp;&nbsp;</span><br/>
          </div>
          
          <br/>
          <span><strong>Links: </strong></span><br/>
          <div v-if="profileData.links">
            <span class="username"  v-for="(item, index) in profileData.links" v-bind:key="index"> "{{ item }}"&nbsp;&nbsp;&nbsp;&nbsp;</span><br/>
          </div>
                    
          <br/>
          <span><strong>Descripción: </strong></span><br/>
          <span class="description">
            {{ profileData.description }}
          </span><br/>

          <br/>
          <span v-if="profileData.name === false" class="warning" id="extension">
            Se esta utilizando MetaMask con esta dApp, <br />
            se recomienda intentar con <br /><a href="https://docs.lukso.tech/guides/universal-profile/browser-extension/install-browser-extension">Extensión Universal</a>.
          </span>

        </div>
      </td>    
    </tr>
    <tr>
      <td colspan="2" align="right">
        <button class="button" @click="showModal=!showModal" style="width: 200px">Actualizar</button>
        <ModalUpdate @close="handleModalClose" v-if="showModal" />
      </td>
    </tr>
  </table>

</template>
