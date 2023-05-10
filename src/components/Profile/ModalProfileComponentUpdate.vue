<!-- 
  /* */ 
  /* Pantalla principal del perfil, muestra la información general del perfil */
  /* */ 
 -->

<!-- Importamos las librerías para recuperar y actualizar el perfil -->
<script>
    import { ref, defineEmits } from 'vue';
    import LSP0ERC725Account from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json'; 
    import { LSPFactory } from '@lukso/lsp-factory.js';
    import ERC725js from '@erc725/erc725.js';
    import LSP3UniversalProfileMetaDataSchema from '@erc725/erc725.js/schemas/LSP3UniversalProfileMetadata.json';
    import _ from 'underscore';
    import { IPFS_GATEWAY_BASE_URL, CHAIN_IDS } from '../../constants';
    import { isLuksoNetwork } from '../../../network';
    import { updateprofile, getprofile } from '../../services.js';

    //Definimos las variables
    const tokenUsername = ref('');                      //Variable de formulario para el username//
    const tokendescription = ref('');                   //Variable de formulario para la descripción//
    const error = ref(false);                           //Bandera que determina si se ha producido un error//
    const isWrongNetwork = ref(false);                  //Bandera que determina si se ha producido un error con la red//
    const deploying = ref(false);                       //Bandera que determina si se ha comenzado con el proceso de actualización//
    const isSuccess = ref(false);                       //Bandera que determina si se ha completado el proceso de actualización//
    const deployEvents = ref([]);                       //Variable que guarda los eventos del proceso//
            
    export default {
        data(){
            return{
                tags:[]                                 //Variable de formulario para guarda los tags del perfil//
            }
        },

        //Acciones que se realizan al cargar la página//
        async mounted() {

            // Obtenemos las cuentas de la extensión
            const accounts = await web3.eth.getAccounts();

            // Obtenemos la cuenta con la que se está autentificado
            let account = accounts[0]; 
            
            //Obtenemos la direccion del universal profile, para ello Validamos si es una cuenta EOA
            let bytecode = await web3.eth.getCode(accounts[0]);
            if (bytecode === '0x') {
                account = await getprofile(accounts[0]);  
            }

            //Obtenemos los datos del perfil, los parámetros son el esquema, la cuenta, el provider de la extensión y la ruta de IPFS definida 
            //en el archivo de constants
            const profile = new ERC725js(LSP3UniversalProfileMetaDataSchema, account, window.web3.currentProvider, {
                ipfsGateway: IPFS_GATEWAY_BASE_URL,
            });

            //Validamos los tags
            if (this.tags.length == 0)
                this.tags = [];

            //Una vez que se ha cargado el perfil, filtramos solo la sección del perfil (LSP3Profile)
            let metaData;
            try {
                metaData = await profile.fetchData('LSP3Profile');
            } 
            catch (e) {
                return;
            }
            
            //Colocamos los valores del perfil, en los campos del formulario (username, description y tags)
            tokenUsername.value = metaData.value.LSP3Profile.name;
            tokendescription.value = metaData.value.LSP3Profile.description;
            this.tags = metaData.value.LSP3Profile.tags;
        },

        //Declaraciones de funciones 
        methods: {

            //Función que agrega tags al campo de texto//
            addTag (event) {

                //Definimos los parámetros que separan un tag (Coma y Enter)
                if ((event.code == 'Comma') || (event.code == 'Enter')) {
                    event.preventDefault();

                    //obtenemos el texto y quitamos los espacios al inicio y final del texto
                    var val = event.target.value.trim()

                    //Validamos si el texto es mayor a cero
                    if (val.length > 0) {

                        //Agregamos el texto a la variable tags
                        if (this.tags == undefined)
                            this.tags = [val];
                        else
                            this.tags.push(val);

                        //Limpiamos el valor del campo de entrada
                        event.target.value = '';
                    }
                }
            },

            //Función que remueve un tag
            removeTag (index) {
                this.tags.splice(index, 1);
            },

            //Función que remueve el último tag
            removeLastTag (event) {
                if (event.target.value.length === 0) {
                    this.removeTag(this.tags.length - 1)
                }
            },

            //Función que cierra el modal y hace un refresh de la página
            CloseModal() {
                window.location.reload();
            },

            //Función que actualiza el perfil
            async onSubmit(e) {
                console.log("Entrando a onsubmit...");

                // Obtenemos las cuentas de la extensión
                const accounts = await web3.eth.getAccounts();

                // Obtenemos la cuenta con la que se está autentificado
                let account = accounts[0]; 

                //Iniciamos las variables de actualización
                deployEvents.value = [];
                deploying.value = true;
                isSuccess.value = false;

                //Obtenemos el id de la cadena
                const chainId = await web3.eth.getChainId();
                const lspFactory = new LSPFactory(web3.currentProvider, { chainId });

                //Creamos los datos para actualizar el perfil
                const uploadResult = await lspFactory.UniversalProfile.uploadProfileData({
                    name: tokenUsername.value,
                    tags: this.tags,
                    description: tokendescription.value,
                    profileImage: e.target.querySelector('input#profileimage').files[0],
                    backgroundImage: e.target.querySelector('input#backgroundimage').files[0]
                });

                //Create the smart contract
                const profileDeploymentEvents = [];
                const myContracts = await lspFactory.UniversalProfile.deploy({
                    controllerAddresses: [account], 
                    lsp3Profile: uploadResult
                },
                {
                    onDeployEvents: {
                        next: (deploymentEvent) => {
                            //console.log(deploymentEvent);
                            //deployEvents.value.push(deploymentEvent);
                        },
                        error: (error) => {
                            console.log("Error...");
                            deploying.value = false;
                        },
                        complete: async (contracts) => {
                            // console.log('Universal Profile deployment completed');
                            // console.log("Mi UP Address", contracts.LSP0ERC725Account?.address);
                            // console.log(contracts);
                            
                            //Actualizamos la direccion del universal profile
                            await updateprofile(account, contracts.LSP0ERC725Account?.address);
                            isSuccess.value = true;
                        },
                    }
                });


                //Obtenemos los datos del perfil, los parámetros son el esquema, la cuenta, el provider de la extensión y la ruta de IPFS definida 
                //en el archivo de constants
                // const profile = new ERC725js(LSP3UniversalProfileMetaDataSchema, account, window.web3.currentProvider, {
                //     ipfsGateway: IPFS_GATEWAY_BASE_URL,
                // });

                // //Creamos los datos para actualizar el perfil
                // const uploadResult = await factory.UniversalProfile.uploadProfileData({
                //     name: tokenUsername.value,
                //     tags: this.tags,
                //     description: tokendescription.value,
                //     profileImage: e.target.querySelector('input#profileimage').files[0],
                //     backgroundImage: e.target.querySelector('input#backgroundimage').files[0]
                // });

                // //Codificamos los datos conforme al estándar
                // const encodedData = profile.encodeData({
                //     keyName: "LSP3Profile",
                //     //value: uploadResult,
                // });


                // //Procedemos a realizar la actualización del perfil
                // try {
                //     //Definimos el contrato y la cuenta que se actualizara
                //     const profileContract = new window.web3.eth.Contract(LSP0ERC725Account.abi, accounts[0], { gasPrice: '20000000000' });
                    
                //     //Ejecutamos el proceso de actualización con los datos codificados en la cuenta
                //     const receipt = await profileContract.methods['setData(bytes32[],bytes[])'](encodedData.keys, encodedData.values).send({ from: accounts[0] });

                //     //Mostramos mensajes al usuario del estatus del proceso
                //     deployEvents.value.push({ receipt, type: 'TRANSACTION', functionName: 'setData' });
                // }
                // catch (err) {
                //     console.warn(err);
                //     error.value = err.message;
                //     deploying.value = false;
                //     return;
                // }

                // //Señalamos que el proceso ha finalizado correctamente
                // isSuccess.value = true;

                // //Validamos si guardamos la información en el localstorage
                // let bytecode = await web3.eth.getCode(account);
                // if (bytecode === '0x') {
                //     //Obtenemos la información del LocalStorage
                //     let ProfileLocal = JSON.parse(localStorage.getItem('ProfileInfo'));
                    
                //     var pr = {};

                //     if(ProfileLocal == null) {
                        
                //         //Creamos el registro, ya que no existe
                //         pr.address = account;
                //         pr.username = uploadResult.json.LSP3Profile.name;
                //         pr.url = uploadResult.url;
                //         pr.description = uploadResult.json.LSP3Profile.description;
                //         pr.tags = uploadResult.json.LSP3Profile.tags;
                //         pr.profileImage = uploadResult.json.LSP3Profile.profileImage;
                //         pr.backgroundImage = uploadResult.json.LSP3Profile.backgroundImage;

                //         //Lo agramos a un arreglo
                //         var obj = {};
                //         obj.profiles = [];
                //         obj.profiles.push(pr);
                        
                //         //Guardamos el registro en el LocalStorage
                //         localStorage.setItem('ProfileInfo', JSON.stringify(obj));
                //         return;
                //     }
                //     else {
                //         //Get the address info
                //         for(let i = 0; i < ProfileLocal.profiles.length; i++) {
                //             let p = ProfileLocal.profiles[i];

                //             if(p.address == account){
                //                 ProfileLocal.profiles.splice(i,1);
                //                 break;
                //             }
                //         }

                //         //Creamos el registro, ya que no existe
                //         pr.address = account;
                //         pr.username = uploadResult.json.LSP3Profile.name;
                //         pr.url = uploadResult.url;
                //         pr.description = uploadResult.json.LSP3Profile.description;
                //         pr.tags = uploadResult.json.LSP3Profile.tags;
                //         pr.profileImage = uploadResult.json.LSP3Profile.profileImage;
                //         pr.backgroundImage = uploadResult.json.LSP3Profile.backgroundImage;

                //         //Guardamos el registro en el LocalStorage
                //         ProfileLocal.profiles.push(pr);
                //         localStorage.setItem('ProfileInfo', JSON.stringify(ProfileLocal));
                //     }
                // }
            }
        }
    }
</script>

<script setup>
    //Funciones utilizadas para el cierre del modal
    const emit = defineEmits(['close', 'tokens-sent']);
    const handleModalClose = () => {
        emit('close', true);
    };
</script>

<template>
  <div class="modal">
    <div class="modal-content" @click.stop="">

        <p class="warning center" v-if="error">
            {{ error }}
        </p>

        <div class="center">
            <h4><strong>Actualizar Perfil</strong></h4>
            <br />
            <p v-if="isWrongNetwork" class="warning">
                Por favor cambia tu red a LUKSO <a style="cursor: pointer" @click="addLuksoL14Testnet()">L14</a> o <a style="cursor: pointer" @click="addLuksoL16Testnet()">L16 </a>para crear este token.
            </p>

            <br />
            <form v-if="!deploying" @submit.prevent="onSubmit" class="left" onkeydown="return event.key != 'Enter';">
                <fieldset>
                    <div class="formfields">
                        <div class="item-flex">
                            <span><strong>Username: </strong></span><br/>
                            <input type="text" v-model="tokenUsername" id="username" required />
                        </div>

                        <div class="item-flex">
                            <span><strong>Agregar Tag: </strong></span><br/>
                            <input type='text' placeholder='Ingrese un tag' class='tag-input__text' @keydown='addTag' @keydown.down="removeLastTag"/>
                        </div>
                    </div>

                    <div class="item-flex" style="margin-top: -12px">
                        <span><strong>Tags: </strong></span><br/>
                        <div class="tag-input">
                            <div v-for='(tag, index) in tags' :key='tag' class='tag-input__tag'>
                                <span @click='removeTag(index)'>x</span>
                                {{ tag }}
                            </div>
                        </div>
                    </div>

                    <div class="item-flex">
                        <span><strong>Descripción</strong></span><br/>
                        <textarea  v-model="tokendescription" id="description" required ></textarea>
                    </div>

                    <div class="formfields">
                        <div class="item-flex">
                            <span><strong>Imagen del perfil</strong></span><br/>
                            <input type="file" id="profileimage" accept="image/*" required /><br/>
                        </div>

                        <div class="item-flex">
                            <span><strong>Fondo del perfil</strong></span><br/>
                            <input type="file" id="backgroundimage" accept="image/*" required />
                        </div>
                    </div>

                    <br />
                    <div class="right">
                        <button type="submit">Actualizar el perfil</button>
                        <button type="button" @click="handleModalClose()">Cerrar</button>
                    </div>
                </fieldset>
            </form>
        </div>

        <div class="events center">
            <span v-if="deploying" >
                Actualizando el perfil...<br />
                <strong>Confirme todas las transacciones en la extensión de su navegador.</strong>
            </span>

            <br /><br />
            <div v-for="(event, index) in deployEvents" :key="index">
                <br />
                <span v-if="event.type === 'TRANSACTION'">
                    Función llamada: {{ event.functionName }}()<br />
                    Hash de la transacción: <a :href="`${BLOCKCHAIN_EXPLORER_BASE_URL}/tx/${event.receipt.transactionHash}`" target="_blank">{{ event.receipt.transactionHash }}</a>
                </span>
            </div>

            <div v-if="isSuccess" style="padding-top: 60px">
                <h4>Proceso completado con éxito !</h4>
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

.tag-input {
    width: 100%;
    border: 1px solid #D1D1D1;
    font-size: 0.8em;
    height: 114px;
    max-height: 114px;
    box-sizing: border-box;
    padding: 0 10px;
    border-radius: 3px;
}

.tag-input__tag {
    height: 30px;
    max-height: 30px;
    float: left;
    margin-right: 10px;
    background-color: #eee;
    margin-top: 3px;
    line-height: 30px;
    padding: 0 5px;
    border-radius: 5px;
}

.tag-input__tag > span {
    cursor: pointer;
    opacity: 0.75;
}

.tag-input__text {
    /* border: none; */
    outline: none;
    font-size: 1em;
    line-height: 30px;
    background: none;
}
</style>
