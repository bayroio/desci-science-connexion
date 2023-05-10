<!-- 
  /* */ 
  /* Pantalla que permite acuñar NFT bajo al estándar LSP7 */
  /* */ 
 -->

<!-- Importamos las librerías para acuñar los NFT bajo el estándar LSP7 -->
<script setup>
    import { onMounted, ref } from 'vue';
    import ERC725js from '@erc725/erc725.js';
    import LSP4DigitalAssetSchema from '@erc725/erc725.js/schemas/LSP4DigitalAsset.json';
    import LSP7DigitalAsset from '@lukso/lsp-smart-contracts/artifacts/LSP7Mintable.json';
    import { BLOCKCHAIN_EXPLORER_BASE_URL } from '../../constants';
    import { addLuksoL14Testnet, addLuksoL16Testnet, isLuksoNetwork } from '../../../network';
    import { mintissuedassets } from '@/services';

    //Funciones utilizadas para el cierre del modal
    const emit = defineEmits(['close', 'tokens-sent']);
    const handleModalClose = () => {
        emit('close', true);
    };

    //Definimos las variables
    const props = defineProps({ address: String });     //Variable que recibe la dirección del NFT a acuñar//
    const LSP4TokenName = ref('');                      //Variable para el Nombre del Token//
    const LSP4TokenSymbol = ref('');                    //Variable para el Simbolo del Token//
    const mintAmount = ref(0);                          //Variable de formulario para indicar el Número de NFT a acuñar//
    const txHash = ref('');                             //Variable que establece el hash de la transacción//
    const error = ref('');                              //Variable que guarda los errores//
    const isSuccess = ref(false);                       //Bandera que determina si se ha completado el proceso de actualización//
    const isWrongNetwork = ref(false);                  //Bandera que determina si se ha producido un error con la red//
    const isLoading = ref(false);                       //Bandera que determina si se ha comenzado con el proceso de actualización//
    const forceParameter = ref(false);                  //Bandera que determina si se fuerza el parámetro al acuñar el NFT//
    const isMinterEOA = ref(false);                     //Bandera que determina si se trata de una cuenta EOA//

    //Función que cierra el modal y hace un refresh de la página    
    function CloseModal() {
      window.location.reload();
    }

    //Función que acuña el tokem
    async function onSubmit() {
        console.log("Entrando a onsubmit...")

        //Validamos si se encuentra activa la red de lukso, si no está activa, mostramos el error 
        try {
            isWrongNetwork.value = await isLuksoNetwork();
            if (isWrongNetwork.value) {
                return;
            }
        } 
        catch (err) {
            console.warn(err);
            error.value = err.message;
            return;
        }

        // Obtenemos las cuentas de la extensión
        const accounts = await web3.eth.getAccounts();

        // Obtenemos la cuenta con la que se está autentificado
        const account = accounts[0]; 

        //Obtenemos el código de la cuenta
        let minterBytecode = await web3.eth.getCode(account);

        //Validamos que la cantidad digitada por el usuario sea mayor a cero
        if (mintAmount.value === 0) {
            return;
        }
        // else if (minterBytecode === '0x' && forceParameter.value === false) {
        //     //Validamos si se trata de un EOA, si es así se debe de forzar el acuñado
        //     isMinterEOA.value = true;
        //     return;
        // }
        isMinterEOA.value = true;
        console.log(`Acuñando ${mintAmount.value} nuevos tokens.`);


        try {
            //Cambiamos el estatus del proceso
            isLoading.value = true;

            //Creamos el smart contract para acuñar el NFT y las variables 
            const lsp7DigitalAssetContract = new window.web3.eth.Contract(LSP7DigitalAsset.abi, props.address);
            const to = account;                                                     //Persona que acuña el token
            const amount = web3.utils.toWei(mintAmount.value.toString());           //Cantidad de tokens a acuñar
            const force = true;                                     //Determina si se va a forzar la compatibilidad (true) o solo para las cuentas que tienen habilitado el LSP1 UniversalReceiver(false).
            const data = '0x';

            //Acuñamos el token y guardamos el hash de resultado
            const receipt = await lsp7DigitalAssetContract.methods.mint(to, amount, force, data).send({ from: account });
            txHash.value = receipt.transactionHash;

            //Culminamos el proceso de acuñado
            isSuccess.value = true;

            //Si se trata de una cuenta EOA, cargamos los datos del LocalStorage y agregamos el nuevo token acuñado
            let bytecode = await web3.eth.getCode(account);
            if (bytecode === '0x') {
                mintissuedassets(account, props.address);
            }
        }
        catch (err) {
            error.value = err.message;
        }
    }

    //Acciones que se realizan al cargar la página//
    onMounted(async () => {
        //Cargamos la información del token 
        const erc725Asset = new ERC725js(LSP4DigitalAssetSchema, props.address, window.web3.currentProvider);

        //Filtramos la información que requerimos (TokenName y Token Symbol)
        const LSP4DigitalAsset = await erc725Asset.fetchData(['LSP4TokenName', 'LSP4TokenSymbol']);

        //Guardamos los valores en las variables globales de la página
        LSP4TokenName.value = LSP4DigitalAsset[0].value;
        LSP4TokenSymbol.value = LSP4DigitalAsset[1].value;
    });
</script>

<template>
  <div class="modal">
    <div class="modal-content" @click.stop="">
        <p class="warning" v-if="error">
            {{ error }}
        </p>

        <div class="center">
            <h4><strong>Acuñar tokens de {{ LSP4TokenName }} ({{ LSP4TokenSymbol }})</strong></h4>

            <form v-if="!isLoading" @submit.prevent="onSubmit" class="left">
                <fieldset>
                    <p class="warning" v-if="isMinterEOA">Tu cuenta es una EOA, por favor permite la transferencia de tokens a otra cuenta EOA.</p>
                    <p v-if="isWrongNetwork" class="warning">
                        Por favor cambia tu red a LUKSO <a style="cursor: pointer" @click="addLuksoL14Testnet()">L14</a> o <a style="cursor: pointer" @click="addLuksoL16Testnet()">L16 </a>para acuñar este activo digital.
                    </p>

                    <span><strong>Cantidad a acuñar: </strong></span><br/>
                    <input type="number" v-model="mintAmount" placeholder="1" id="amount" required />

                    <!-- <div>
                        <span title="Los tokens y NFT solo se pueden enviar a perfiles universales o contratos inteligentes que implementan un receptor universal de forma predeterminada. Para enviarlo a un EOA, debe usar el parámetro de fuerza.">
                            <input style="position: absolute; margin: 5px 0px 0px 0px" type="checkbox" v-model="forceParameter" id="force" value="false" />
                            <span style="margin-left: 20px"><strong>Permite la transferencia de tokens a una cuenta EOA </strong></span><br/>
                        </span>
                    </div> -->
                    <br />
                    <div class="right">
                        <button type="submit">Acuñar</button>
                        <button type="button" @click="handleModalClose">Cerrar</button>
                    </div>
                </fieldset>
            </form>

            <p v-if="isLoading">Cargando...</p>

            <p v-if="txHash">
                Transacción exitosa: tx hash: <a :href="`${BLOCKCHAIN_EXPLORER_BASE_URL}/tx/${txHash}`" target="_blank">{{ txHash }}</a>
            </p>
            
            <div v-if="isSuccess" style="padding-top: 60px">
                <h4>El NFT se acuño exitosamente !</h4>
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
  max-width: 750px;
  border-radius: 10px;
}
</style>
