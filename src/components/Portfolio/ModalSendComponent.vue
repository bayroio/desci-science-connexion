<!-- 
  /* */ 
  /* Pantalla que realiza el procedimiento de envío de un NFT */
  /* */ 
 -->
 
 <!-- Importamos las librerías para recuperar transferir los tokens -->
 <script setup>
  import { onMounted, defineProps, defineEmits, ref } from 'vue';
  import { isAddress } from 'web3-utils';
  import LSP7DigitalAsset from '@lukso/lsp-smart-contracts/artifacts/LSP7DigitalAsset.json';
  import ProfilePreviewComponent from './ProfilePreviewComponent.vue';
  import LSP8IdentifiableDigitalAsset from '@lukso/lsp-smart-contracts/artifacts/LSP8IdentifiableDigitalAsset.json';
  import { addLuksoL14Testnet, addLuksoL16Testnet, isLuksoNetwork } from '../../../network';
  import { CHAIN_IDS } from '../../constants';

  //Funciones utilizadas para el cierre del modal
  const emit = defineEmits(['close', 'tokens-sent']);
  const handleModalClose = () => {
    emit('close', wasAssetSent.value);
  };

  //Definimos las variables recibidas como parámetros
  const props = defineProps({
    assetAddress: String,                     //Variable que contiene la dirección del Token (NFT)//
    assetName: String,                        //Variable que contiene el nombre del Token (NFT)//
    isLsp7: Boolean,                          //Bandera que determina si el token es compatible con el estándar LSP7//
    isLsp8: Boolean,                          //Bandera que determina si el token es compatible con el estándar LSP8//
    tokenId: String,                          //Variable que contiene el id del Token (NFT)//
  });

  //Definimos las variables
  const error = ref(false);                   //Bandera que determina si se ha producido un error//
  const isSuccess = ref(false);               //Bandera que determina si se ha completado el proceso de actualización//
  const isWrongNetwork = ref(false);          //Bandera que determina si se ha producido un error con la red//
  const isLoading = ref(false);               //Bandera que determina si se ha comenzado con el proceso de actualización//
  const forceParameter = ref(false);          //Bandera que determina si se foza el parametro al acuñar el NFT//
  const isRecepientEOA = ref(false);          //Bandera que determina si el receptor es una cuenta del tipo EOA//
  const isL16 = ref(false);                   //Bandera que determina si se utiliza L16//
  const isL14 = ref(false);                   //Bandera que determina si se utiliza L14//
  const wasAssetSent = ref(false);            //Bandera que determina si el token fue enviado//
  const assetRecipient = ref('');             //Variable que contiene la dirección del activo recibido
  const amountToSend = ref(1);                //Variable que señala el número de elementos a transferir, por default 1
  const txHash = ref('');                     //Variable que establece el hash de la transacción

  //Función que cierra el modal y hace un refresh de la página
  function CloseModal() {
    window.location.reload();
  }

  //Acciones que se realizan al cargar la página//
  onMounted(async () => {
    //Establecemos que se ha comenzado con la carga de los datos
    isLoading.value = false;
    console.log('assetAddress', props.assetAddress);

    //Obtenemos el id de la cadena para determinar si se usa L14 o L16
    try {
      let chainId = await web3.eth.getChainId();

      //Determinamos que tipo de red usamos L14 o L16
      if (chainId === CHAIN_IDS.L14) {
        isL14.value = true;
      } 
      else if (chainId === CHAIN_IDS.L16) {
        isL16.value = true;
      }
    } 
    catch (err) {
      console.warn(err);
    }
  });

  //Función que envía el token
  async function sendAsset() {

    //Obtenemos el id de la cadena para determinar si se usa L14 o L16
    try {
      let chainId = await web3.eth.getChainId();

      //Determinamos que tipo de red usamos L14 o L16
      switch (chainId) {
        case CHAIN_IDS.L14:
          isL14.value = true;
          isL16.value = false;
          break;
        case CHAIN_IDS.L16:
          isL16.value = true;
          isL14.value = false;
          break;
        default:
          isWrongNetwork.value = true;
          isL14.value = false;
          isL16.value = false;
          return;
      }
    } 
    catch (err) {
      console.warn(err);
      error.value = err.message;
      return;
    }

    //Establecemos que se ha comenzado con la carga de los datos
    isLoading.value = true;

    //Validamos que la dirección del receptor es una dirección valida
    let recipientBytecode = await web3.eth.getCode(assetRecipient.value);
    if (!isAddress(assetRecipient.value)) {
      console.warn(`La dirección: ${assetRecipient.value} no es valida.`);
      return;
    }
    
    //Validamos si la cuenta receptora es del tipo EOA
    else if (recipientBytecode === '0x' && forceParameter.value === false) {
      isRecepientEOA.value = true;
      return;
    }
    isRecepientEOA.value = false;
    console.log('Enviando activo a:', assetRecipient.value);

    // Obtenemos las cuentas de la extensión
    const accounts = await web3.eth.getAccounts();
      
    // Obtenemos la cuenta con la que se está autentificado, la guardamos en las variables globales de la página
    const account = accounts[0]; 

    //Comenzamos con el proceso de transferencia
    txHash.value = '';
    try {

      //Validamos de que tipo de estándar se trata
      if (props.isLsp8) {
        
        //Llamamos a la función de transferir
        await sendLSP8Token(account, props.assetAddress);

        //Si se trata de una cuenta EOA, cargamos los datos del LocalStorage y actualizamos los valores
        if (localStorage.getItem('receivedAssets')) {
          const LSP5ReceivedAssets = JSON.parse(localStorage.getItem('receivedAssets'));

          LSP5ReceivedAssets.value = LSP5ReceivedAssets.value.filter(function (assetAddress) {
            return assetAddress !== props.assetAddress;
          });

          localStorage.setItem('receivedAssets', JSON.stringify(LSP5ReceivedAssets));
        }
      }

      else if (props.isLsp7) {
        //Llamamos a la función de transferir
        await sendLSP7Token(account, props.assetAddress);
      }

      //Indicamos que se culminado el proceso de envío
      wasAssetSent.value = true;
      emit('tokens-sent');
      isLoading.value = true;
      isSuccess.value = true;

    }
    catch (err) {
      // It can fail if the recipient is not a UP (cf. force option)
      isLoading.value = false;

      console.warn(err);
    }
  }

  //Función que envía tokens creados bajo el estándar LSP7
  async function sendLSP7Token(accountAddress, assetAddress) {

    //Creamos el smart contract para transferir el token
    const lsp7DigitalAssetContract = new window.web3.eth.Contract(LSP7DigitalAsset.abi, assetAddress);

    const from = accountAddress;                                                    //Cuenta que transfiere el token
    const to = assetRecipient.value;                                                //Cuenta que recibe el token
    const amount = web3.utils.toWei(amountToSend.value.toString());                 //Cantidad que será transferida, por default 1
    const force = forceParameter.value;                                             //Determina si se va a forzar la compatibilidad (true) o solo para las cuentas que tienen habilitado el LSP1 UniversalReceiver(false).
    const data = '0x';

    //Realizamos la transferencia
    const receipt = await lsp7DigitalAssetContract.methods.transfer(from, to, amount, force, data).send({ from: accountAddress });
    
    //Guardamos el hash de la transacción
    txHash.value = receipt.transactionHash;
  }

  //Función que envía tokens creados bajo el estándar LSP8
  async function sendLSP8Token(accountAddress, assetAddress) {

    //Creamos el smart contract para transferir el token
    const lsp8IdentifiableDigitalAssetContract = new window.web3.eth.Contract(LSP8IdentifiableDigitalAsset.abi, assetAddress);

    const tokenIds = await lsp8IdentifiableDigitalAssetContract.methods.tokenIdsOf(accountAddress).call();      //Obtenemos el id del token
    const from = accountAddress;                                                                                //Cuenta que transfiere el token
    const to = assetRecipient.value;                                                                            //Cuenta que recibe el token
    const force = true;                                                                                         //Determina si se va a forzar la compatibilidad (true) o solo para las cuentas que tienen habilitado el LSP1 UniversalReceiver(false).
    const data = '0x';

    //Realizamos la transferencia
    const receipt = await lsp8IdentifiableDigitalAssetContract.methods.transfer(from, to, props.tokenId, force, data).send({ from: accountAddress });
    
    //Guardamos el hash de la transacción
    txHash.value = receipt.transactionHash;
  }
</script>

<template>
  <div class="modal">
    <div class="modal-content" @click.stop="">

      <div class="container center">
        <h2 style="margin-bottom: 0px">Enviar {{ props.assetName }}</h2>
        <small v-if="isL14"><a :href="`https://blockscout.com/lukso/l14/address/${props.assetAddress}`" target="_blank">{{ props.assetAddress }}</a></small>
        <small v-else-if="isL16"><a :href="`https://explorer.execution.l16.lukso.network/address/${props.assetAddress}`" target="_blank">{{ props.assetAddress }}</a></small>
        <small v-else>{{ props.assetAddress }}</small>

        <h2></h2>

        <form v-if="!isLoading" @submit.prevent="sendAsset">
          <fieldset>
            <span><strong>Dirección receptora: </strong></span><br/>
            <input type="text" placeholder="0x..." v-model="assetRecipient" id="assetRecipient" required />

            <div v-if="isLsp7">
              <span><strong>Cantidad: </strong></span><br/>
              <input type="number" placeholder="0x..." v-model="amountToSend" id="amount" required />
            </div>

            <div>
              <span title="Los tokens y NFT solo se pueden enviar a perfiles universales o contratos inteligentes que implementan un receptor universal de forma predeterminada. Para enviarlo a un EOA, debe usar el parámetro de fuerza.">
                <p class="warning" v-if="isRecepientEOA">Tu dirección receptora es una EOA, por favor permite la trasnferencia a la EOA.</p>
              </span>
              <p v-if="isWrongNetwork" class="warning">
                Por favor, cambia tu red a  LUKSO <a style="cursor: pointer" @click="addLuksoL14Testnet()">L14</a> o <a style="cursor: pointer" @click="addLuksoL16Testnet()">L16</a> para enviar este
                token.
              </p>
              <p class="warning" v-if="error">
                {{ error }}
              </p>
            </div>

            <!-- <div style="margin-top: 10px">
              <input style="margin: 5px 0px 0px -50px" type="checkbox" v-model="forceParameter" id="force" value="false" />
              <span style="margin-left: 20px"><strong>Permite la transferencia de tokens a una cuenta EOA </strong></span><br/>
            </div> -->

            <br /><br />
            <div class="right">
              <button type="submit">Enviar</button>
              <button type="button" @click="handleModalClose">Cerrar</button>
            </div>
            </fieldset>
        </form>

        <ProfilePreviewComponent v-if="assetRecipient" :account="assetRecipient" />

        <p v-if="isLoading">Enviando activo...</p>
        <p v-if="txHash">
          Transacción exitosa: Hash:
          <small v-if="isL14"><a :href="`https://blockscout.com/lukso/l14/tx/${txHash}`" target="_blank">{{ txHash }}</a></small>
          <small v-else-if="isL16"><a :href="`https://explorer.execution.l16.lukso.network/tx/${txHash}`" target="_blank">{{ txHash }}</a></small>
          <small v-else>{{ txHash }}</small>
        </p>

        <div v-if="isSuccess">
          <div v-if="props.isLsp8" style="padding-top: 60px">
              <h4>El NFT 2.0 se ha enviado exitosamente !</h4>
          </div>
          <div v-else style="padding-top: 60px">
              <h4>El NFT se ha enviado exitosamente !</h4>
          </div>
        </div>


        <br /><br />
        <div class="right" v-if="isSuccess" >
            <button @click="CloseModal">Cerrar</button>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.modal {
  position: fixed; /* Stay in place */
  z-index: 1; /* Sit on top */
  padding-top: 100px; /* Location of the box */
  left: 0;
  top: 0;
  width: 100%; /* Full width */
  height: 100%; /* Full height */
  overflow: auto; /* Enable scroll if needed */
  background-color: rgb(0, 0, 0); /* Fallback color */
  background-color: rgba(0, 0, 0, 0.4); /* Black w/ opacity */
}

.modal-content {
  background-color: #fefefe;
  margin: -2% auto; /* 0% from the top and centered */
  padding: 20px;
  border: 1px solid #888;
  width: 90%;
  max-width: 600px;
  border-radius: 10px;
}
</style>
