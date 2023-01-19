<!-- 
  /* */ 
  /* Pantalla de inicio del proyecto, encaminada a validar la identificación de la dirección utilizada */
  /* */ 
 -->

<script>
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
        //Cambiamos el estatus de la bandera, para mostrar pantalla de login en la extensión//  
        this.requiresLogin = true;
        return;
      } 

      //Mostramos la pantalla principal del Proyecto
      this.$router.push('/');
    },

    methods: {
      //Función de acceso
      async login() {
        //Obtenemos la cuenta con la que se esta tratando de acceder
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

        //Si hay respuesta check if any number of accounts was returned
        // IF go to the dashboard
        if (accounts.length) this.$router.push('/');
        else this.error = 'No account was selected!';
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
      <p>Espacio para dar forma a nuestro futuro estilo de vida digital, y realmente lo que creamos. Un espacio para innovar, inventar e
         interactuar de una manera realmente nueva. Una fundación para la confianza, el valor y el compromiso - construido en la
         universalización de los Perfiles. </p>
      <br/><br/>

      <button @click="login">Login</button>
    </div>

    <!-- Nota de extensiones registradas -->
    <br/><br/><br/>
    <p class="note" v-if="useOnlyOneExtension">
      Si tiene instalado MetaMask y Universal Profile Browser Extension, por favor deshabilite uno de ellos, preferiblemente Metamask! Si necesita ayuda, consulte estás guías, para
      <a href="https://support.google.com/chrome_webstore/answer/2664769?hl=en" target="_blank">Chrome</a>
      y para
      <a href="https://support.mozilla.org/en-US/kb/disable-or-remove-add-ons#w_disabling-and-removing-extensions" target="_blank">Firefox</a>.
    </p>


  </div>




  






</template>
