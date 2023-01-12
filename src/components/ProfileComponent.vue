<script>
  import _ from 'underscore';
  import ERC725js from '@erc725/erc725.js';
  import LSP3UniversalProfileMetaDataSchema from '@erc725/erc725.js/schemas/LSP3UniversalProfileMetadata.json';
  import identicon from 'ethereum-blockies-base64';
  import { IPFS_GATEWAY_BASE_URL } from '../constants';

  export default {
    data() {
      return {
        profileData: {
          profileImage: {
            url: '',
          },
        },
        address: '',
        error: false,
      };
    },

    async mounted() {
      // Get the Universal Profile Data
      const accounts = await web3.eth.getAccounts();
      const account = accounts[0]; 
      
      //Get the address values
      this.address = account;
      this.profileData.address = account;

      //Get the image
      this.profileData.identicon = identicon(account);
      
      //Get the Profile
      const profile = new ERC725js(LSP3UniversalProfileMetaDataSchema, account, window.web3.currentProvider, {
        ipfsGateway: IPFS_GATEWAY_BASE_URL,
      });

      //Get the metadata
      let metaData;
      try {
        metaData = await profile.fetchData('LSP3Profile');
        console.log(metaData);
      } 
      catch (e) {
        this.profileData.name = false;
        return;
      }
      

      this.profileData = {
        // merge profileData with fetched profile data
        ...this.profileData,
        ...metaData.value.LSP3Profile,
      };

      // GET the right image size for the profile image from the profile images array
      this.profileData.profileImage = _.find(this.profileData.profileImage, (image) => {
        if (image.width >= 200 && image.width <= 500) return image;
      });
      
      // If there is no image of the preferred size, take the default one
      if (!this.profileData.profileImage && metaData.value.LSP3Profile.profileImage) {
        this.profileData.profileImage = metaData.value.LSP3Profile.profileImage[0];
        // change the IPFS path to a provider of our choice
      }
      this.profileData.profileImage.url = this.profileData.profileImage.url.replace('ipfs://', profile.options.ipfsGateway);
    },
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

      <!--Data-->
      <td width="70%" valign="top">
        <div>
          <span><strong>Address: </strong></span><br/>
          <span class="username">{{ address }}</span><br/>

          <br/>
          <span><strong>Nombre: </strong></span><br/>
          <span class="username" v-if="profileData.name"> {{ profileData.name }} </span><br/>

          <br/>
          <span><strong>Tags: </strong></span><br/>
          <span class="username" v-if="profileData.tags"> {{ profileData.tags }} </span><br/>

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
    <!-- <tr>
      <td colspan="2" align="right">
        <button @click="login">Actualizar</button>
      </td>
    </tr> -->
  </table>

</template>
