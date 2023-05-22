<!-- 
  /* */ 
  /* Pantalla principal del proyecto, se muestran las opciones disponibles dentro de la aplicación */
  /* */ 
 -->

<!-- Listado de componentes que se utilizaran dentro de la pantalla -->
<script setup>
  import ProfileComponent from '../components/Profile/ProfileComponent.vue';                //Componente que incluye la información del Perfil//
  import PapersComponent from '../components/Papers/PapersComponent.vue';                   //Componente que incluye la Tokenización de Papers//
  import PortfolioComponent from '../components/Portfolio/PortfolioComponent.vue';          //Componente que incluye el portafolio del Usuario//
  import Transactions from '../components/Transactions/Transactions.vue';                   //Componente que incluye las transacciones de información//  
  import SearchComponent from '../components/Search/SearchComponent.vue';                   //Componente que incluye la busqueda de información//    
  import { getpermissions, getprofile, updatepermissions } from '../services.js';
  import { onMounted, ref } from 'vue';

  const { utils } = require('ethers');
  const LabelCreateProfile = ref(false);         //Bandera que determina si se muestra el mensaje de crear perfil//
  const LabelAcceptTerms = ref(false);           //Bandera que determina si se muestra el mensaje de aceptar terminos//
  const ShowTabs = ref(true);                  //Bandera que determina si se muestran los tabs//


  onMounted(async () => {
    // Obtenemos las cuentas de la extensión
    const accounts = await web3.eth.getAccounts();
    let account = accounts[0]; 

    //Validamos si ya aceptó los terminos
    let flagpermissions = await getpermissions(account);
    if (flagpermissions == false){
      LabelAcceptTerms.value = true;
      ShowTabs.value = false;
    }
    else{
      //Validamos si ya existe el perfil
      let address = await getprofile(accounts[0]);  
      if (address == ""){
        LabelCreateProfile.value = true;
        ShowTabs.value = false;
      }
    }
  });

  async function login() {
      //Obtenemos la cuenta con la que se está tratando de acceder 
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length) {

        //Validamos si el usuario ya autorizo los permisos
        let flagpermissions = await getpermissions(utils.getAddress(accounts[0]));  
        if (flagpermissions == true){
          //Ya se autorizaron los permisos, mostramos la pantalla inicial
          this.$router.push('/');
          return;
        }

        //No se han autorizado los permisos, definimos las variables
        const domain = window.location.host;
        const origin = window.location.origin;
        const LUKSO_L14_CHAIN_ID = '22';
        const nonce = 'm97bdsjo'; // a randomized token, at least 8 alphanumeric characters
        const date = new Date();
        const issuedAt = date.toISOString();

        //Procedemos a crear el mensaje
        const siweMessage = `${domain} wants you to sign in with your Ethereum account:  ${accounts[0]}
By logging in you agree to the terms and conditions.
URI: ${origin}
Version: 1
Chain ID: ${LUKSO_L14_CHAIN_ID}
Nonce: ${nonce}
Issued At: ${issuedAt}
Resources: ['https://tec.mx/aviso-legal']`;

        try
        {
            //Mostramos el mensaje de permisos
            const msg = `0x${Buffer.from(siweMessage, 'utf8').toString('hex')}`;
            const signature = await ethereum.request({
                method: 'personal_sign',
                params: [msg, accounts[0], 'Example password'],
            });

            //El usuario acepto los terminos, guardamos que ha autorizado los cambios
            await updatepermissions(utils.getAddress(accounts[0]));

            console.log('complete');
        }
        catch(ex)
        {
          //El usuario rechazo los permisos
        }

        //Enviamos a la pantalla principal 
        window.location.reload();
      }
      else {
        this.error = 'No fue seleccionada ninguna cuenta!';
      }
  }

</script>

<style scoped>

</style><template>
  <div>

    <h1>Bienvenido</h1>

    <!-- Add tabs -->
    <div class="tabs">

      <!-- Tab del Perfil Universal, se incorpora el Componente Profile -->
      <div class="tabby-tab">
        <input type="radio" id="tab-1" name="tabby-tabs" checked>
        <label for="tab-1">Perfil Universal</label>
        <div class="tabby-content">
          <ProfileComponent />
          <h4 class="center" v-if="LabelCreateProfile">Por favor cree su perfil de usuario para poder interacturar con la dapp</h4>

          <div class="center">
            <button @click="login" v-if="LabelAcceptTerms">Iniciar Sesión</button>
            <p class="center" v-if="LabelAcceptTerms">Al iniciar la sesión, el usuario acepta los <a href="https://tec.mx/aviso-legal" target="_blank">términos y condiciones</a>.</p>
          </div>
        </div>
      </div>

      <!-- Tab de Papers Tokenizados, se incorpora el Componente LSP12IssuedAssets -->
      <div v-if="ShowTabs" class="tabby-tab">
        <input type="radio" id="tab-2" name="tabby-tabs">
        <label for="tab-2">Papers Tokenizados</label>
        <div class="tabby-content">
          <PapersComponent style="margin-top: 60px" />
        </div>
      </div>

      <!-- Tab de Portafolio, se incorpora el Componente LSP5ReceivedAssets -->
      <div v-if="ShowTabs" class="tabby-tab">
        <input type="radio" id="tab-3" name="tabby-tabs">
        <label for="tab-3">Portafolio</label>
        <div class="tabby-content">
          <PortfolioComponent style="margin-top: 60px" />
        </div>
      </div>

      <!-- Tab de Transacciones -->
      <div v-if="ShowTabs" class="tabby-tab">
        <input type="radio" id="tab-4" name="tabby-tabs">
        <label for="tab-4">Transacciones</label>
        <div class="tabby-content">
          <Transactions style="margin-top: 60px" />
        </div>
      </div>

      <!-- Tab de Busqueda -->
      <div v-if="ShowTabs" class="tabby-tab">
        <input type="radio" id="tab-5" name="tabby-tabs">
        <label for="tab-5">Búsqueda</label>
        <div class="tabby-content">
          <SearchComponent style="margin-top: 60px" />
        </div>
      </div>


      <!--Transfer-->
      <!-- <div class="tabby-tab">
        <input type="radio" id="tab-4" name="tabby-tabs">
        <label for="tab-4">Transferir</label>
        <div class="tabby-content">
            <p>Throwup on your pillow wake up human for food at 4am and hide when guests come over, yet inspect anything brought into the house.</p>
        </div>
      </div> -->

    </div>
  </div>
</template>
