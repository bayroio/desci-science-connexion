<!--
  /* */
  /* Pantalla que carga el listado de perfiles, ya sea de forma aleatoria o conforme a una búsqueda */
  /* */
 -->

<!-- Listado de componentes que se utilizaran dentro de la pantalla -->
<script setup>
  import { IPFS_GATEWAY_BASE_URL, URL_PROFILE_NO_IMAGE, URL_PROFILE_ASSETS } from '../../constants';
  import LSP3UniversalProfileMetaDataSchema from '@erc725/erc725.js/schemas/LSP3UniversalProfileMetadata.json';
  import ERC725js from '@erc725/erc725.js';
  import { defineProps, onMounted, ref } from 'vue';
  import { getprofile, validatewallet } from '../../services.js';

  const props = defineProps({ textSearch: String });              //Variable que recibe el texto de búsqueda //
  const ProfileName = ref('');                                    //Variable que guarda el Nombre del perfil//
  const ProfileDescription = ref('');                             //Variable que guarda la descripcion del perfil//
  const ProfileAddressLink = ref('');                             //Variable que guarda la direccion del perfil//
  const ProfileAddress = ref('');                                 //Variable que guarda la direccion del perfil//
  const ProfileImage = ref('');                                   //Variable que guarda la ubicacion de las imagenes del perfil//
  const Profile = ref(false);                                     //Variable que determina si se muestra el perfil//

  //Acciones que se realizan al cargar la página//
  onMounted(async () => {

    //Validamos si hay un address a buscar//
    if (props.textSearch != ""){
      
      //validamos si es un wallet address
      let flagwallet = await validatewallet(props.textSearch);
      if(flagwallet){

        //Es un wallet, cargamos los datos del universal profile
        let account = await getprofile(props.textSearch);
        if ((account != null) && (account != "")) {

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
            console.log(e);
            let profile_empty = false;
            return;
          }

          //Obtenemos la informacion del perfil
          ProfileName.value = metaData.value.LSP3Profile.name.substring(0,15);
          ProfileDescription.value = metaData.value.LSP3Profile.description.substring(0,16) + "...";
          ProfileAddressLink.value = URL_PROFILE_ASSETS + props.textSearch;
          ProfileAddress.value = "#" + props.textSearch.substring(2,6);

          //Obtenemos la imagen del perfil
          let height = 10000;
          let path = URL_PROFILE_NO_IMAGE;
          for(let i=0; i < metaData.value.LSP3Profile.profileImage.length; i++){
            if ((height > metaData.value.LSP3Profile.profileImage[i].height) && (metaData.value.LSP3Profile.profileImage[i].height > 200)){
              if (metaData.value.LSP3Profile.profileImage[i].url != ""){
                path = metaData.value.LSP3Profile.profileImage[i].url;
                height = metaData.value.LSP3Profile.profileImage[i].height;
              }
            }
          }
          ProfileImage.value = path.replace('ipfs://', IPFS_GATEWAY_BASE_URL);
        }
        else{
          //Colocamos valores vacios
          ProfileName.value = "";
          ProfileDescription.value = "";
          ProfileAddressLink.value = URL_PROFILE_ASSETS + props.textSearch;
          ProfileAddress.value = "#" + props.textSearch.substring(2,6);

          //Obtenemos la imagen del perfil
          let height = 10000;
          let path = URL_PROFILE_NO_IMAGE;
          ProfileImage.value = path.replace('ipfs://', IPFS_GATEWAY_BASE_URL);
        }

        Profile.value = true;

      }
    }
  });

</script>

<template>
  <div v-if=(Profile)>

    <h4 class="center"><strong>Perfiles</strong></h4>

    <div class="grid">

      <div class="cards">
        <div class="card">
          <a v-bind:href=(ProfileAddressLink) target="_blank">
            <img v-bind:src=(ProfileImage) class="cardimg"/>

            <div class="cardbody">
              <span class="cardaddress">
                <strong> {{ ProfileName }} </strong>
                <small> {{ ProfileAddress }} </small>
              </span>
              <br/>

              <span class="cardname">{{ ProfileDescription }}</span>
            </div>
          </a>
        </div>
      </div>
    </div>    
  </div>
</template>

<style scoped>

  .cards {
    max-width: 1200px;
    margin: 0 auto;
    /* display: grid;
    gap: 1rem;
    align-items: center */
  }

  .card {
    background-color: white;
    height: 240px;
    width: 210px;
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
    .cards { grid-template-columns: repeat(1, 1fr); }
  }

  @media (min-width: 800px) {
    .cards { grid-template-columns: repeat(1, 1fr); }
  }

  @media (min-width: 1200px) {
    .cards { grid-template-columns: repeat(1, 1fr); }
  }
</style>