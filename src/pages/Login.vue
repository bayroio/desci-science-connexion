<!-- 
  /* */ 
  /* Pantalla de inicio del proyecto, encaminada a validar la identificación de la dirección utilizada */
  /* */ 
 -->

<script>
  import { getprofile } from '../services.js';
  import UniversalProfileContract from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
  const { utils } = require('ethers');

  export default {

    //Definimos las variables que se utilizaran dentro de la pantalla
    data() {
      return {
        isUnsupportedBrowser: false,          //Bandera que determina si el navegador es compatible//
        requiresBrowserExtension: false,      //Bandera que determina si la extensión está instalada//
        requiresLogin: false,                 //Bandera que determina si existe un usuario esta autentificado//
        useOnlyOneExtension: true,            //Bandera que determina si se está usando una sola extensión//
        error: false,                         //Bandera que determina si se ha producido un error//
      };
    },

    //Acciones que se realizan al cargar la página//
    async mounted() {      
      //Validamos si el navegador es Chrome o Firefox//
      if (!(navigator.userAgent.indexOf('Firefox') != -1 || navigator.userAgent.indexOf('Chrome') != -1)) {
        //Cambiamos el estatus de la bandera, para mostrar mensaje de navegador no compatible//
        this.isUnsupportedBrowser = true;      
        return;
      }

      //Validamos si la extensión se encuentra instalada
      if (!window.ethereum) {
        //Cambiamos el estatus de la bandera, para mostrar mensaje de navegador no compatible//  
        this.requiresBrowserExtension = true;   
        return;
      }

      //Validamos si hay un usuario autentificado, obtenemos primero las cuentas de la extensión
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      if (!accounts.length) {
        //Cambiamos el estatus de la bandera, para mostrar pantalla de acceso en la extensión//  
        this.requiresLogin = true;
        return;
      } 

      //Mostramos la pantalla principal del Proyecto
      this.$router.push('/');
    },


    methods: {
      //Función de acceso
      async login() {
        //Obtenemos la cuenta con la que se está tratando de acceder 
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

        //Get the universal profile info
        let address = await getprofile(utils.getAddress(accounts[0]));  
        if (address == ""){
          this.$router.push('/');
          return;
        }

        const domain = window.location.host;
        const origin = window.location.origin;
        const LUKSO_L14_CHAIN_ID = '22';
        const nonce = 'm97bdsjo'; // a randomized token, at least 8 alphanumeric characters
        const date = new Date();
        const issuedAt = date.toISOString();

        const siweMessage = `${domain} wants you to sign in with your Ethereum account:
                            ${accounts[0]}
                            By logging in you agree to the terms and conditions.
                            URI: ${origin}
                            Version: 1
                            Chain ID: ${LUKSO_L14_CHAIN_ID}
                            Nonce: ${nonce}
                            Issued At: ${issuedAt}
                            Resources: ['https://terms.website.com']`;

        //Si hay respuesta vamos a la pantalla de Logout
        if (accounts.length) {
            //const signature = await window.web3.eth.sign(window.web3.utils.sha3(siweMessage), accounts[0]);
            const msg = `0x${Buffer.from(siweMessage, 'utf8').toString('hex')}`;
            const signature = await ethereum.request({
                method: 'personal_sign',
                params: [msg, accounts[0], 'Example password'],
            });

            const myUniversalProfileContract = new web3.eth.Contract(UniversalProfileContract.abi, address);

            const hashedMessage = web3.eth.accounts.hashMessage(siweMessage);
            const MAGIC_VALUE = '0x1626ba7e'; // https://eips.ethereum.org/EIPS/eip-1271

            // if the signature is valid it should return the magic value 0x1626ba7e
            const isValidSignature = await myUniversalProfileContract.methods.isValidSignature(hashedMessage, signature).call();        
            if (isValidSignature === MAGIC_VALUE) {
                this.$router.push('/');
            } 
            else {
                // The EOA which signed the message has no SIGN permission over this UP.
                console.log('😭 Log In failed');
            }
        }
        else this.error = 'No fue seleccionada ninguna cuenta!';
      },
    },
  };
</script>

<template>
  <br />

  <!--Sección de errores-->
  <p class="warning" v-if="error">
    {{ error }}
  </p>

  <div class="login center" v-else>

    <!-- Sección de validación del Navegador, se muestra o no dependiendo de la bandera isUnsupportedBrowser -->
    <p class="note" v-if="isUnsupportedBrowser">
      Cambiar al navegador <a href="https://www.google.com/chrome/" target="_blank">Chrome</a>
      o a
      <a href="https://www.mozilla.org/firefox/new/" target="_blank">Firefox</a> para usar esta dApp.
    </p>

    <!-- Sección de validación de la extensión, se muestra o no dependiendo de la bandera requiresBrowserExtension -->
    <div v-if="requiresBrowserExtension">
      <p class="warning">
        Por favor instale 
        <a href="https://docs.lukso.tech/guides/browser-extension/install-browser-extension/" target="_blank">Universal Profile Browser Extension</a>
        o
        <a href="https://metamask.io/" target="_blank">MetaMask</a> para usar esta dApp.
      </p>
    </div>

    <!-- Sección de login, se muestra o no dependiendo de la bandera requiresLogin -->
    <div v-if="requiresLogin">
      <h1 class="title"><strong>Bienvenido</strong></h1>
      
      <br/>
      <p>Tokenización de la propiedad intelectual en un IP-NFT.</p>
      <br/><br/>

      <button @click="login">Login</button>
    </div>

    <!-- Nota de extensiones registradas -->
    <br/><br/><br/>
    <p class="note" v-if="useOnlyOneExtension">
      Si no tiene instalado Metamask, por favor hagalo desde  
      <a href="https://metamask.io/" target="_blank">aquí</a>.
      Si necesita ayuda, consulte estás guías, para
      <a href="https://support.google.com/chrome_webstore/answer/2664769?hl=en" target="_blank">Chrome</a>
      y para
      <a href="https://support.mozilla.org/en-US/kb/disable-or-remove-add-ons#w_disabling-and-removing-extensions" target="_blank">Firefox</a>.
    </p>


  </div>




  






</template>
