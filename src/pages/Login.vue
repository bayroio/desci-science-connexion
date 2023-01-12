<script>
  export default {
    data() {
      return {
        isUnsupportedBrowser: true,
        requiresBrowserExtension: false,
        requiresLogin: false,
        useOnlyOneExtension: true,
        error: false,
      };
    },

    async mounted() {
      
      // Check if browser is Chrome or Firefox
      if (navigator.userAgent.indexOf('Firefox') != -1 || navigator.userAgent.indexOf('Chrome') != -1) {
        this.isUnsupportedBrowser = false;
      }

      // Check if Browser Extension is Installed and Universal Profile is Logged In (address is available), Get account
      if (window.ethereum) {
        // Request account
        const accounts = await ethereum.request({ method: 'eth_accounts' });

        // If no account was found
        if (!accounts.length) {
          this.requiresLogin = true;
        } 
        else {
          this.$router.push('/');
        }

      } 
      else {
        // No ethereum extension connected. We ask the user to install the browser extension
        this.requiresBrowserExtension = true;
        this.useOnlyOneExtension = false;
      }
    },

    methods: {
      // If the user clicks the LOGIN BUTTON
      async login() {
        // Request an account
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

        // check if any number of accounts was returned
        // IF go to the dashboard
        if (accounts.length) this.$router.push('/');
        else this.error = 'No account was selected!';
      },
    },
  };
</script>

<template>
  <br />

  <!--Add error message-->
  <p class="warning" v-if="error">
    {{ error }}
  </p>

  <div class="login center" v-else>

    <!-- Check if browser is Chrome or Firefox -->
    <p class="note" v-if="isUnsupportedBrowser">
      Cambiar al navegador <a href="https://www.google.com/chrome/" target="_blank">Chrome</a>
      o a
      <a href="https://www.mozilla.org/firefox/new/" target="_blank">Firefox</a> para usar esta dApp.
    </p>

    <!-- Check the browser extension -->
    <div v-else-if="requiresBrowserExtension">
      <p class="warning">
        Por favor instale 
        <a href="https://docs.lukso.tech/guides/browser-extension/install-browser-extension/" target="_blank">Universal Profile Browser Extension</a>
        o
        <a href="https://metamask.io/" target="_blank">MetaMask</a> para usar esta dApp.
      </p>
    </div>

    <!-- Show the button to Login -->
    <div v-else-if="requiresLogin">
      <h1 class="title"><strong>Bienvenido</strong></h1>
      
      <br/>
      <p>Espacio para dar forma a nuestro futuro estilo de vida digital, y realmente lo que creamos. Un espacio para innovar, inventar e
         interactuar de una manera realmente nueva. Una fundación para la confianza, el valor y el compromiso - construido en la
         universalización de los Perfiles. </p>
      <br/><br/>

      <button @click="login">Login</button>
    </div>

    <!-- Show note -->
    <br/><br/><br/>
    <p class="note" v-if="useOnlyOneExtension">
      Si tiene instalado MetaMask y Universal Profile Browser Extension, por favor deshabilite uno de ellos, preferiblemente Metamask! Si necesita ayuda, consulte estás guías, para
      <a href="https://support.google.com/chrome_webstore/answer/2664769?hl=en" target="_blank">Chrome</a>
      y para
      <a href="https://support.mozilla.org/en-US/kb/disable-or-remove-add-ons#w_disabling-and-removing-extensions" target="_blank">Firefox</a>.
    </p>


  </div>




  






</template>
