<script setup>
  import { onMounted, ref } from 'vue';
  import ERC725js from '@erc725/erc725.js';
  import LSP5ReceivedAssetsSchema from '@erc725/erc725.js/schemas/LSP5ReceivedAssets.json';
  import LSP8IdentifiableDigitalAsset from '@lukso/lsp-smart-contracts/artifacts/LSP8IdentifiableDigitalAsset.json';
  import OwnedNFTComponent from './OwnedNFTComponent.vue';
  import OwnedCreationComponent from './OwnedCreationComponent.vue';
  import { INTERFACE_IDS } from '../constants';

  const receivedAssets = ref([]);
  const isLoading = ref(false);
  const receivedTokens = ref([]);

  async function handleRemoveAsset({ tokenId, assetAddress }) {
    isLoading.value = true;

    const currentReceivedTokens = receivedTokens.value;

    // Remove asset from receievd tokens
    const updatedRecievedTokens = currentReceivedTokens.filter(function (token) {
      if (!tokenId) {
        return token.assetAddress !== assetAddress;
      }
      return token.tokenId !== tokenId;
    });
    receivedTokens.value = updatedRecievedTokens;

    // Update received assets
    try {
      receivedAssets.value = updatedRecievedTokens.reduce(function (acc, token) {
        if (!acc.includes(token.assetAddress)) {
          acc.push(token.assetAddress);
        }

        return acc;
      },
      []);
    }
    catch (err) {
      console.warn(err);
    }

    isLoading.value = false;
  }

  onMounted(async () => {
    isLoading.value = true;

    // Get the address from the browser extension
    const accounts = await window.web3.eth.getAccounts();
    const universalProfileAddress = accounts[0]; // set the first address as the Universal Profile address

    // GET the received assets directly from the Universal Profile smart contract, https://docs.lukso.tech/standards/universal-profile/lsp5-received-assets
    const erc725LSP12IssuedAssets = new ERC725js(LSP5ReceivedAssetsSchema, universalProfileAddress, window.web3.currentProvider);
    try {
      const LSP5ReceivedAssets = await erc725LSP12IssuedAssets.getData('LSP5ReceivedAssets[]');
      receivedAssets.value = LSP5ReceivedAssets.value;
    } 
    catch (err) {
      // is EOA, Load from Local Storage
      const LSP5ReceivedAssets = JSON.parse(localStorage.getItem('receivedAssets'));
      receivedAssets.value = LSP5ReceivedAssets.value;
    }

    //Set the asset
    receivedAssets.value.forEach(async (receivedAsset) => {
      const lsp8IdentifiableDigitalAssetContract = new window.web3.eth.Contract(LSP8IdentifiableDigitalAsset.abi, receivedAsset);
      const [isLSP7, isLSP8] = await Promise.all([
        lsp8IdentifiableDigitalAssetContract.methods.supportsInterface(INTERFACE_IDS.LSP7DigitalAsset).call(),
        lsp8IdentifiableDigitalAssetContract.methods.supportsInterface(INTERFACE_IDS.LSP8IdentifiableDigitalAsset).call(),
      ]);

      if (isLSP8) {
        const tokenIds = await lsp8IdentifiableDigitalAssetContract.methods.tokenIdsOf(universalProfileAddress).call();

        tokenIds.forEach((tokenId) => {
          receivedTokens.value.push({
            assetAddress: receivedAsset,
            isLSP7,
            isLSP8,
            tokenId,
          });
        });
      }
      else {
        if (!isLSP8){
          receivedTokens.value.push({
            assetAddress: receivedAsset,
            isLSP7,
            isLSP8,
            tokenId: null,
          });
        }
      }
    });

    isLoading.value = false;
  });
</script>

<template>
  <div>
    <h4 class="center"><strong>Token de Archivos</strong></h4>
  </div>
  
  <br />
  <div class="center" style="display: block">
    <img v-if="receivedAssets.length === 0 && !isLoading" class="emptyLogo" src="../assets/empty-up.png" alt="No hay ningún paper tokenizado" />
    <div v-if="receivedAssets.length === 0 && !isLoading">No existe ningún paper tokenizado hasta ahora</div>
    <div v-else class="grid">
      <div v-for="receivedToken in receivedTokens" :key="receivedToken.tokenId">
        <OwnedCreationComponent @remove-asset="handleRemoveAsset" v-if="receivedToken.isLSP7 && !receivedToken.isLSP8" :address="receivedToken.assetAddress" />
        <OwnedNFTComponent @remove-asset="handleRemoveAsset" v-if="receivedToken.isLSP8" :address="receivedToken.assetAddress" :token-id="receivedToken.tokenId" />
      </div>
    </div>
  </div>
</template>
