<script setup>
  import { onMounted, ref, defineProps } from 'vue';
  import ERC725js from '@erc725/erc725.js';
  import LSP4DigitalAssetSchema from '@erc725/erc725.js/schemas/LSP4DigitalAsset.json';
  import LSP7DigitalAsset from '@lukso/lsp-smart-contracts/artifacts/LSP7DigitalAsset.json';
  import { IPFS_GATEWAY_BASE_URL, IPFS_GATEWAY_API_BASE_URL, COMMON_ABIS, INTERFACE_IDS } from '../constants';
  import ModalMintLSP7 from './ModalMintLSP7Component.vue';
  import ModalMintLSP8 from './ModalMintLSP8Component.vue';

  const props = defineProps({ address: String });
  const LSP4TokenName = ref('');
  const LSP4TokenSymbol = ref('');
  const iconUrl = ref('');
  const LSP4Metadata = ref();
  const totalSupply = ref();
  const creationType = ref('unknown'); // LSP7 or LSP8

  const showModalLSP7 = ref(false);
  const handleModalCloseLSP7 = () => {
    showModalLSP7.value = false;
  };
  
  const showModalLSP8 = ref(false);
  const handleModalCloseLSP8 = () => {
    showModalLSP8.value = false;
  };
  
  
  onMounted(async () => {
    const options = {
      ipfsGateway: IPFS_GATEWAY_BASE_URL,
    };

    // CHECK contract's interface
    const supportsInterfaceContract = new window.web3.eth.Contract([COMMON_ABIS.supportsInterface], props.address);
    console.log("props.address: ", props.address);
    console.log("supportsInterfaceContract: ", supportsInterfaceContract);

    const [isLSP7, isLSP8] = await Promise.all([
      await supportsInterfaceContract.methods.supportsInterface(INTERFACE_IDS.LSP7DigitalAsset).call(),
      await supportsInterfaceContract.methods.supportsInterface(INTERFACE_IDS.LSP8IdentifiableDigitalAsset).call(),
    ]);

    console.log("INTERFACE_IDS.LSP7DigitalAsset: ", INTERFACE_IDS.LSP7DigitalAsset);
    console.log("isLSP7: ", isLSP7);
    console.log("isLSP8: ", isLSP8);

    try {
      if (isLSP8) {
        creationType.value = 'NFT';
      }
      else {
        if (isLSP7) {
          creationType.value = 'NFT ';
        }
        else {
          console.error(`El contrato: ${props.address} no soporta la interface NFT.`);
          return;
        }
      }
    }
    catch (err) {
      console.error(`No se puede encontrar la interface del contrato: ${props.address}`);
    }

    //Get the metadata info with erc725js, standard: // https://docs.lukso.tech/standards/nft-2.0/LSP4-Digital-Asset-Metadata
    const erc725Asset = new ERC725js(LSP4DigitalAssetSchema, props.address, window.web3.currentProvider, options);
    const LSP4DigitalAsset = await erc725Asset.fetchData(['LSP4TokenName', 'LSP4TokenSymbol', 'LSP4Metadata']);
    LSP4TokenName.value = LSP4DigitalAsset[0].value;
    LSP4TokenSymbol.value = LSP4DigitalAsset[1].value;
    LSP4Metadata.value = LSP4DigitalAsset[2].value;
    const icons = LSP4DigitalAsset[2].value.LSP4Metadata.icon;

    //Show icon
    if (icons && icons.length > 0) {
      iconUrl.value = LSP4DigitalAsset[2].value.LSP4Metadata.icon[0].url.replace('ipfs://', IPFS_GATEWAY_BASE_URL);
    }

    // Read total supply with web3js
    const lsp4DigitalAssetContract = new window.web3.eth.Contract(LSP7DigitalAsset.abi, props.address); // LSP7 and LSP8 both share the totalSupply function.
    totalSupply.value = isLSP8 ? await lsp4DigitalAssetContract.methods.totalSupply().call() : web3.utils.fromWei(await lsp4DigitalAssetContract.methods.totalSupply().call());
});
</script>

<template>
  <div class="asset-wrapper">
    <div class="preview-card" :style="{ boxShadow: creationType === 'NFT ' ? 'none' : '' }">
      <div class="image" :style="{ backgroundImage: `url(${iconUrl})`, borderRadius: creationType === 'NFT ' ? '50%' : '50%' }">
        <small class="supply">{{ creationType }} - Balance: {{ totalSupply }}</small>
      </div>

      <div class="infos">{{ LSP4TokenName }} ({{ LSP4TokenSymbol }})</div>
    </div>
    
    <button v-if="creationType === 'NFT'" class="button" style="width: 200px" @click="showModalLSP8 = !showModalLSP8" >Acuñar</button>
    <button v-else-if="creationType === 'NFT '" class="button" style="width: 200px" @click="showModalLSP7 = !showModalLSP7" >Acuñar</button>
    <ModalMintLSP7 @close="handleModalCloseLSP7" v-if="showModalLSP7" :address="props.address"/>
    <ModalMintLSP8 @close="handleModalCloseLSP8" v-if="showModalLSP8" :address="props.address"/>
  </div>
</template>
