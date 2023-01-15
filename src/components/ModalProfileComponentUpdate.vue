<script>
    import { ref, defineEmits } from 'vue';
    import LSP0ERC725Account from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json'; // TODO change to LSP0ERC725Account
    import { LSPFactory } from '@lukso/lsp-factory.js';
    import ERC725js from '@erc725/erc725.js';
    import LSP7Mintable_0_5_0 from '../contracts/LSP7Mintable_0_5_0.json';
    import LSP3UniversalProfileMetaDataSchema from '@erc725/erc725.js/schemas/LSP3UniversalProfileMetadata.json';
    import _ from 'underscore';
    import { IPFS_GATEWAY_BASE_URL, CHAIN_IDS } from '../constants';
    import { isLuksoNetwork } from '../../network';

    // Form fields
    const tokenUsername = ref('');
    const tokendescription = ref('');

    const deploying = ref(false);
    const error = ref(false);
    const deployEvents = ref([]);
    const isSuccess = ref(false);
    const isWrongNetwork = ref(false);
            
    export default {
        data(){
            return{
                tags:[]
            }
        },
        async mounted() {
            // Get the Universal Profile Data
            const accounts = await web3.eth.getAccounts();
            const account = accounts[0]; 
            
            
            //Get the Profile
            const profile = new ERC725js(LSP3UniversalProfileMetaDataSchema, account, window.web3.currentProvider, {
                ipfsGateway: IPFS_GATEWAY_BASE_URL,
            });

            //Get the metadata
            let metaData;
            try {
                metaData = await profile.fetchData('LSP3Profile');
                console.log(metaData.value.LSP3Profile.name);
            } 
            catch (e) {
                return;
            }
            
            //set the values
            tokenUsername.value = metaData.value.LSP3Profile.name;
            tokendescription.value = metaData.value.LSP3Profile.description;
            this.tags = metaData.value.LSP3Profile.tags;

        },

        methods: {
            addTag (event) {
                if ((event.code == 'Comma') || (event.code == 'Enter')) {
                    event.preventDefault();

                    var val = event.target.value.trim()

                    if (val.length > 0) {
                        this.tags.push(val)
                        event.target.value = ''
                    }
                }
            },
            removeTag (index) {
                this.tags.splice(index, 1);
            },
            removeLastTag (event) {
                if (event.target.value.length === 0) {
                    this.removeTag(this.tags.length - 1)
                }
            },
            CloseModal() {
                window.location.reload();
            },
            async onSubmit(e) {
                console.log("Entrando a onsubmit...");

                // for(let i=0; i < this.tags.length; i++){

                // }
                // console.log(this.tags.length);

                // Check network
                try {
                    isWrongNetwork.value = await isLuksoNetwork();
                    if (isWrongNetwork.value) {
                        return;
                    }
                } 
                catch (err) {
                    console.warn(err);
                    error.value = err.message;
                    console.log("Error...", error.value);
                    return;
                }

                // Get the address from the browser extension
                const accounts = await web3.eth.getAccounts();
                const account = accounts[0];

                // Show the deploying status...
                deployEvents.value = [];
                deploying.value = true;
                isSuccess.value = false;

                // l14 relayer uses smart contracts v0.5.0
                const chainId = await web3.eth.getChainId();
                const version = chainId === CHAIN_IDS.L14 ? LSP7Mintable_0_5_0.bytecode : null;

                //Get the Profile
                const profile = new ERC725js(LSP3UniversalProfileMetaDataSchema, account, window.web3.currentProvider, {
                    ipfsGateway: IPFS_GATEWAY_BASE_URL,
                });

                //Get the metadata
                // let metaData;
                // try {
                //     metaData = await profile.fetchData('LSP3Profile');
                // } 
                // catch (e) {
                //     return;
                // }
                
                //Upload JSON file to IPFS
                const factory = new LSPFactory(web3.currentProvider, { chainId });
                const uploadResult = await factory.UniversalProfile.uploadProfileData({
                    name: tokenUsername.value,
                    tags: this.tags,
                    description: tokendescription.value,
                    profileImage: e.target.querySelector('input#profileimage').files[0],
                    backgroundImage: e.target.querySelector('input#backgroundimage').files[0]
                });

                const encodedData = profile.encodeData({
                    keyName: "LSP3Profile",
                    value: uploadResult,
                });

                //Add the LSP12 to the universal profile
                try {
                    const profileContract = new window.web3.eth.Contract(LSP0ERC725Account.abi, accounts[0]);
                    const receipt = await profileContract.methods['setData(bytes32[],bytes[])'](encodedData.keys, encodedData.values).send({ from: accounts[0] });

                    deployEvents.value.push({ receipt, type: 'TRANSACTION', functionName: 'setData' });
                }
                catch (err) {
                    console.warn(err);
                    error.value = err.message;
                    deploying.value = false;
                    return;
                }

                isSuccess.value = true;
            }
        }
    }
</script>

<script setup>
    const emit = defineEmits(['close', 'tokens-sent']);
    const handleModalClose = () => {
        emit('close', true);
    };
</script>

<template>
  <div class="modal">
    <div class="modal-content" @click.stop="">

        <p class="warning" v-if="error">
            {{ error }}
        </p>

        <div class="center">
            <h4><strong>Actualizar Perfil</strong></h4>
            <br />
            <div v-if="isEOA" class="warning">Token NFT configurado y puesto en blockchain de forma correcta, pero debido al uso de Metamask, el token solo puede ser resguardado en el almacenamiento local del browser.</div>
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
                            <span><strong>Add Tag: </strong></span><br/>
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

        <div class="events">
            <span v-if="deploying">
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
