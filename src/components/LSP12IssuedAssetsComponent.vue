<script setup>
import ERC725js from '@erc725/erc725.js';

import LSP12IssuedAssetsSchema from '@erc725/erc725.js/schemas/LSP12IssuedAssets.json';
import { onMounted, ref } from 'vue';

import { IPFS_GATEWAY_BASE_URL } from '../constants';
import CreationComponentVue from './CreationComponent.vue';
import ModalCreateTokenLSP7 from './ModalCreateTokenLSP7Component.vue';
import ModalCreateTokenLSP8 from './ModalCreateTokenLSP8Component.vue';

const addresses = ref([]);
const isLoading = ref(false);

const showModalLSP7 = ref(false);
const handleModalCloseLSP7 = () => {
  showModalLSP7.value = false;
};
const showModalLSP8 = ref(false);
const handleModalCloseLSP8 = () => {
  showModalLSP8.value = false;
};

onMounted(async () => {
  isLoading.value = true;
  const accounts = await web3.eth.getAccounts();
  // TODO: make sure accounts is not empty!
  const account = accounts[0]; // set the first address as the Universal Profile address

  const options = {
    ipfsGateway: IPFS_GATEWAY_BASE_URL,
  };
  const erc725LSP12IssuedAssets = new ERC725js(LSP12IssuedAssetsSchema, account, window.web3.currentProvider, options);

  try {
    // GET the current issued assets
    const LSP12IssuedAssets = await erc725LSP12IssuedAssets.getData('LSP12IssuedAssets[]');
    addresses.value = LSP12IssuedAssets.value;
  } catch (err) {
    // is EOA, get assets from localStorage
    const LSP12IssuedAssets = JSON.parse(localStorage.getItem('issuedAssets'));
    addresses.value = LSP12IssuedAssets.value;
  }

  isLoading.value = false;
});
</script>

<template>
  <div>
    <h4 class="center"><strong>Token de Archivos</strong></h4>
  </div>
  
  <div class="center">
    <button class="button" @click="showModalLSP7 = !showModalLSP7" style="width: 230px">Crear token con LSP7</button>
    <ModalCreateTokenLSP7 @close="handleModalCloseLSP7" v-if="showModalLSP7" />

    <button class="button" @click="showModalLSP8 = !showModalLSP8" style="width: 230px">Crear token con LSP8</button>
    <ModalCreateTokenLSP8 @close="handleModalCloseLSP8" v-if="showModalLSP8" />
  </div>

  <br />
  <div class="center" v-if="addresses.length === 0 && !isLoading">No existe ningún token de archivos hasta ahora</div>

  <br />
  <div class="center" style="display: block">
    <img v-if="addresses.length === 0 && !isLoading" class="emptyLogo center" src="../assets/empty-up.png" alt="No hay ningún paper tokenizado" />
    <div v-else class="grid">
      <CreationComponentVue :address="address" v-for="address in addresses" :key="address" />
    </div>
  </div>

</template>

