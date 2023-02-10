<script>
  import { IPFS_GATEWAY_BASE_URL, URL_PROFILE_SEARCH, PROFILE_COUNT, URL_PROFILE_NO_IMAGE, URL_PROFILE_ASSETS } from '../../constants';
  import axios from 'axios';

  //Definimos las variables que se utilizaran dentro de la página
  export default {
    
    data() {
      return {
        info: null
      }
    },

    // //Acciones que se realizan al cargar la página//
    async mounted() {
      //Leemos los datos de los perfiles
      const {data} = await axios.get(URL_PROFILE_SEARCH);

      //Limitamos la busqueda de perfiles 8 registros//
      this.info = data.slice(0,PROFILE_COUNT);
    },

    methods: {
      getimage(array){
        let path = URL_PROFILE_NO_IMAGE;
        let height = 10000;
        
        if (array == null){
          return path;
        }

        for(let i = 0; i < array.length; i++){
          if ((height > array[i].height) && (array[i].height > 200)){
            if (array[i].url != ""){
              path = array[i].url;
              height = array[i].height;
            }
          }
        }

        return path.replace('ipfs://', IPFS_GATEWAY_BASE_URL);
      },
      getname(name){
        return name.substring(0,15);
      },
      getaddress(address){
        return "#" + address.substring(2,6);
      },
      getdescription(description){
        return description.substring(0,16) + "...";
      },
      getlink(address){
        return URL_PROFILE_ASSETS + address;
      }
    }
  }
</script>

<template>
    <div class="cards">
    <div v-for="item in this.info" :key="item.name" class="card">
      <a v-bind:href="getlink(item.address)" target="_blank">
        <img v-bind:src="getimage(item.profileImage)" class="cardimg"/> 

        <div class="cardbody">
          <span class="cardaddress"><strong>{{ getname(item.name) }} </strong> <small> {{  getaddress(item.address) }}</small></span>
          <br/>
          <span class="cardname">{{ getdescription(item.description) }}</span>
        </div>
      </a>

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