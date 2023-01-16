<script setup>
  import { onMounted, ref } from 'vue';
  import { useRoute } from 'vue-router';
  import ERC725js from '@erc725/erc725.js';
  import LSP4DigitalAssetSchema from '@erc725/erc725.js/schemas/LSP4DigitalAsset.json';
  import LSP8Mintable from '@lukso/lsp-smart-contracts/artifacts/LSP8Mintable.json';
  import { BLOCKCHAIN_EXPLORER_BASE_URL, IPFS_GATEWAY_API_BASE_URL } from '../constants';
  import { LSP4DigitalAssetMetadata } from '@lukso/lsp-factory.js';
  import { addLuksoL14Testnet, addLuksoL16Testnet, isLuksoNetwork } from '../../network';

  const route = useRoute();
  const LSP4TokenName = ref('');
  const LSP4TokenSymbol = ref('');
  const description = ref('');
  const tokenId = ref(''); // Should be bytes32
  const mintEvents = ref([]);
  const error = ref('');
  const isLoading = ref(false);
  const isSuccess = ref(false);
  const forceParameter = ref(false);
  const isMinterEOA = ref(false);
  const isWrongNetwork = ref(false);

  async function onSubmit(e) {
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
      return;
    }

    // Get the address from the browser extension
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];
    let minterBytecode = await web3.eth.getCode(account);

    // If recipient is EOA, force is mandatory
    if (minterBytecode === '0x' && forceParameter.value === false) {
      isMinterEOA.value = true;
      return;
    }

    isMinterEOA.value = false;
    console.log(`Acuñando ${mintAmount.value} nuevos tokens.`);

    isLoading.value = true;
    isSuccess.value = false;
    error.value = '';
    mintEvents.value = [];

    //Create Smart Contract with https://docs.lukso.tech/standards/smart-contracts/lsp8-identifiable-digital-asset
    const lsp8IdentifiableDigitalAssetContract = new window.web3.eth.Contract(LSP8Mintable.abi, route.params.address);
    try {
      const to = account;
      const force = forceParameter.value; // When set to TRUE, to may be any address; when set to FALSE to must be a contract that supports LSP1 UniversalReceiver and not revert.
      const data = '0x';
      const paddedTokenId = web3.utils.padRight(web3.utils.stringToHex(tokenId.value), 64);

      const receipt = await lsp8IdentifiableDigitalAssetContract.methods.mint(to, paddedTokenId, force, data).send({ from: account });
      mintEvents.value.push({ stepName: 'Acuñar el NFT en el smart contract LSP8', functionName: 'acuñar', receipt });
    }
    catch (err) {
      error.value = err.message;
      isLoading.value = false;
      return;
    }

    //Create and upload JSON metadata: https://docs.lukso.tech/tools/lsp-factoryjs/classes/lsp4-digital-asset-metadata#uploadmetadata
    const metadata = await LSP4DigitalAssetMetadata.uploadMetadata(
      {
        description: description.value,
        icon: e.target.querySelector('input#icon').files[0],
      },
      {
        ipfsGateway: IPFS_GATEWAY_API_BASE_URL,
      }
    );
    mintEvents.value.push({ stepName: 'Generar y actualizar el archivo metadata' });

    //We minted the NFT, let's add its metadata in the LSP8 smart contract key/value store
    const erc725js = new ERC725js(
      [
        {
          name: 'LSP8MetadataJSON:<bytes32>',
          key: '0x9a26b4060ae7f7d5e3cd0000<bytes32>',
          keyType: 'Mapping',
          valueType: 'bytes',
          valueContent: 'JSONURL',
        },
      ],
      route.params.address,
      window.web3.currentProvider
    );

    //Encode the metadata
    const encodedErc725Data = erc725js.encodeData({
      keyName: 'LSP8MetadataJSON:<bytes32>',
      dynamicKeyParts: paddedTokenId,
      value: {
        json: metadata.json,
        url: metadata.url,
      },
    });

    //Send transaction
    try {
      const receipt = await lsp8IdentifiableDigitalAssetContract.methods['setData(bytes32[],bytes[])'](encodedErc725Data.keys, encodedErc725Data.values).send({ from: account });
      mintEvents.value.push({ stepName: 'Actualizar el ERC725Y key/value (LSP8MetadataJSON:<bytes32>)', functionName: 'setData', receipt });
    } 
    catch (err) {
      isLoading.value = false;
      error.value = err;
      return;
    }

    // Check if account is EOA, also add new asset list to localStorage
    let bytecode = await web3.eth.getCode(account);
    if (bytecode === '0x') {
      let LSP5ReceivedAssets = JSON.parse(localStorage.getItem('receivedAssets'));
      if (LSP5ReceivedAssets.value.indexOf(route.params.address) === -1) {
        LSP5ReceivedAssets.value.push(route.params.address);
        localStorage.setItem('receivedAssets', JSON.stringify(LSP5ReceivedAssets));
      }
    }

    isLoading.value = false;
    isSuccess.value = true;
  }

  onMounted(async () => {
    const erc725Asset = new ERC725js(LSP4DigitalAssetSchema, route.params.address, window.web3.currentProvider);
    const LSP4DigitalAsset = await erc725Asset.fetchData(['LSP4TokenName', 'LSP4TokenSymbol']);
    LSP4TokenName.value = LSP4DigitalAsset[0].value;
    LSP4TokenSymbol.value = LSP4DigitalAsset[1].value;
  });
</script>

<template>
  <a class="back" @click="$router.push('/')">&lt;</a>

  <p class="warning" v-if="error">
    {{ error }}
  </p>

  <div class="center">
    <h2>Acuña tokens de {{ LSP4TokenName }} ({{ LSP4TokenSymbol }})</h2>

    <form v-if="!isLoading && mintEvents.length === 0" @submit.prevent="onSubmit" class="left">
      <fieldset>
        <p class="warning" v-if="isMinterEOA">Tu dirección es una EOA, por favor permite la trasnferencia a una EOA.</p>
        <p v-if="isWrongNetwork" class="warning">
          Por favor cambia tu red a LUKSO <a style="cursor: pointer" @click="addLuksoL14Testnet()">L14</a> o <a style="cursor: pointer" @click="addLuksoL16Testnet()">L16 </a>para acuñar este activo digital 
        </p>
        
        <label for="tokenId">Token ID</label>
        <textarea placeholder="Mi Token" v-model="tokenId" id="tokenId" required maxlength="30"></textarea>

        <label for="description">Descripción</label>
        <textarea placeholder="El token que cambiará el mundo..." v-model="description" id="description" required></textarea>

        <label for="icon">Ícono del Token</label>
        <input type="file" id="icon" accept="image/*" required />
        <div style="margin-top: 10px">
          <span title="Los tokens y NFT solo se pueden enviar a perfiles universales o contratos inteligentes que implementan un receptor universal de forma predeterminada. Para enviarlo a un EOA, debe usar el parámetro de fuerza">
            <input style="position: absolute; margin: 5px 0px 0px 0px" type="checkbox" v-model="forceParameter" id="force" value="false" />
            <label style="margin-left: 20px" for="force">Permite la trasnferencia a una EOA</label>
          </span>
        </div>

        <br /><br />
        <input class="button-primary" type="submit" value="Mint NFT" />
      </fieldset>
    </form>
  </div>

  <p v-if="isLoading">Cargando...</p>

  <div v-for="(event, index) in mintEvents" :key="index" style="padding-top: 60px">
    <h4>{{ event.stepName }}</h4>
    <span v-if="event.receipt">
      Llamada a la función: {{ event.functionName }}()<br />
      Transacción exitosa: tx hash: <a :href="`${BLOCKCHAIN_EXPLORER_BASE_URL}/tx/${event.receipt.transactionHash}`" target="_blank">{{ event.receipt.transactionHash }}</a>
    </span>
  </div>

  <div v-if="isSuccess" style="padding-top: 60px">
    <h4>El activo digital se acuño exitosamente !</h4>
  </div>
</template>
