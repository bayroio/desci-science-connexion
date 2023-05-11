<!-- 
  /* */ 
  /* Componente que carga la información del usuario al que se le va a transferir el token */
  /* */ 
 -->

 <!-- Importamos las librerías para transferir el NFT bajo el estándar LSP7, así como el componente de envío -->
 <script>
  import _ from 'underscore';
  import ERC725js from '@erc725/erc725.js';
  import LSP3UniversalProfileMetaDataSchema from '@erc725/erc725.js/schemas/LSP3UniversalProfileMetadata.json';
  import identicon from 'ethereum-blockies-base64';
  import { IPFS_GATEWAY_BASE_URL } from '../../constants';
  import { isAddress } from 'web3-utils';
  import { getprofile, addprofile } from '../../services.js';

  //Definimos las variables que utilizaremos
  export default {
    data() {
      return {
        profileData: {                              //Variable para asignar el perfil//
          profileImage: {
            url: '',
          },
        },
        address: '',                                //Variable para guardar la dirección del perfil//
        error: false,                               //Variable para guardar los errores//
      };
    },
    props: {
      account: String,                              //Variable que almacena la dirección del perfil (recibida como parámetro) //
    },
    watch: {
      account: async function updateProfile() {
        this.updateProfile(this.account);
      },
    },

    //Acciones que se realizan al cargar la página//
    async mounted() {
      this.updateProfile(this.account);
    },

    methods: {
      //Función que actualiza la información del perfil//
      async updateProfile(account) {

        //Validamos que se haya recibido como parámetro la dirección
        if (!isAddress(account)) {
          //Si no se recibe una dirección valida, limpiamos las variables
          this.profileData.description = '';
          this.address = 'Invalid Address';
          this.profileData.profileImage.url = false;
          this.profileData.identicon = false;
          this.profileData.name = false;

          return;
        }

        //Guardamos la dirección recibida y las variables de la página y cagamos el icono de la cuenta
        this.address = account;
        this.profileData.identicon = identicon(account);
        
        //Obtenemos la direccion del universal profile, para ello Validamos si es una cuenta EOA
        let bytecode = await web3.eth.getCode(account);
        if (bytecode === '0x') {          
          await addprofile(account);
          account = await getprofile(account);  
        }

        //Obtenemos los datos del perfil, los parámetros son el esquema, la cuenta, el provider de la extensión y la ruta de IPFS definida 
        //en el archivo de constants
        const profile = new ERC725js(LSP3UniversalProfileMetaDataSchema, account, window.web3.currentProvider, {
          ipfsGateway: IPFS_GATEWAY_BASE_URL,
        });

        //Una vez que se ha cargado el perfil, filtramos solo la sección del perfil (LSP3Profile)
        let metaData;
        try {
          metaData = await profile.fetchData('LSP3Profile');
        }
        catch (e) {
          this.profileData.name = false;
          this.profileData.profileImage.url = false;
          this.profileData.description = 'Address may not be a Universal Profile';
        }

        //Guardamos la información en la variable ProfileData
        this.profileData = {
          ...this.profileData,
          ...metaData.value.LSP3Profile,
        };

        //Validamos si la imagen está dentro del rango de 200 y 500 de largo (estándar definido), 
        //si es así, colocamos la imagen como la imagen del perfil
        this.profileData.profileImage = _.find(this.profileData.profileImage, (image) => {
          if (image.width >= 200 && image.width <= 500) return image;
        });


        //Si la imagen no se encuentra definida, se coloca la imagen por default
        if (!this.profileData.profileImage && metaData.value.LSP3Profile.profileImage) {
          this.profileData.profileImage = metaData.value.LSP3Profile.profileImage[0];
        }

      //Colocamos la ruta del IPFS en caso de que exista
      if (this.profileData.profileImage != undefined)
        this.profileData.profileImage.url = this.profileData.profileImage.url.replace('ipfs://', profile.options.ipfsGateway);
      },
    },
  };
</script>

<template>
  <div class="center profile">
    <div class="profileImage">
      <div class="identicon" v-bind:style="{ backgroundImage: 'url(' + profileData.identicon + ')' }"></div>
      <div class="image" v-bind:style="{ backgroundImage: 'url(' + profileData.profileImage?.url + ')' }"></div>
    </div>

    <span class="username" v-if="profileData.name"> @{{ profileData.name }} </span>
    <p class="addressField" style="font-family: 'Courier New', Courier, monospace">{{ address }}</p>
    <p class="description" v-if="profileData.description">
      {{ profileData.description }}
    </p>
  </div>
</template>
