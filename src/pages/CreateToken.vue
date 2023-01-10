<script setup>
import LSP0ERC725Account from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json'; // TODO change to LSP0ERC725Account

// https://docs.lukso.tech/tools/lsp-factoryjs/getting-started
import { LSPFactory } from '@lukso/lsp-factory.js';

// https://docs.lukso.tech/tools/erc725js/getting-started
import ERC725js from '@erc725/erc725.js';
import LSP12IssuedAssetsSchema from '@erc725/erc725.js/schemas/LSP12IssuedAssets.json'; // https://docs.lukso.tech/tools/erc725js/schemas

import LSP7Mintable_0_5_0 from '../contracts/LSP7Mintable_0_5_0.json';

import { IPFS_GATEWAY_BASE_URL, IPFS_GATEWAY_API_BASE_URL, BLOCKCHAIN_EXPLORER_BASE_URL, CHAIN_IDS } from '../constants';
import { addLuksoL14Testnet, addLuksoL16Testnet, isLuksoNetwork } from '../../network';
</script>

<script>
export default {
  data() {
    return {
      deploying: false,
      isSuccess: false,
      isEOA: false,
      deployEvents: [],
      error: false,
      isWrongNetwork: false,
    };
  },

  mounted() {
    document.getElementById('name').value = '';
    document.getElementById('symbol').value = '';
    document.getElementById('description').value = '';
    document.getElementById('icon').value = null;
  },

  methods: {
    async onSubmit(e) {
      console.log("Entrando a onsubmit...")
      // Check network
      try {
        this.isWrongNetwork = await isLuksoNetwork();
        console.log("isWrongNetwork...", this.isWrongNetwork);
        if (this.isWrongNetwork) {
          return;
        }
      } catch (err) {
        console.warn(err);
        this.error = err.message;
        console.log("Error...", this.error);
        return;
      }

      // GET the address from the browser extension
      const accounts = await web3.eth.getAccounts();
      const account = accounts[0];

      console.log("accounts...", accounts);
      console.log("account...", account);

      // CONSTRUCT the meta data
      const LSP4MetaData = {
        description: e.target.querySelector('textarea#description').value,
        icon: e.target.querySelector('input#icon').files[0],
        links: [],
        images: [],
        assets: [],
      };

      // show the deploying status...
      this.deployEvents = [];
      this.deploying = true;
      this.isSuccess = false;

      // DEPLOY the LSP7 token
      // https://docs.lukso.tech/tools/lsp-factoryjs/classes/lsp7-digital-asset

      let contracts;

      // l14 relayer uses smart contracts v0.5.0
      const chainId = await web3.eth.getChainId();
      const version = chainId === CHAIN_IDS.L14 ? LSP7Mintable_0_5_0.bytecode : null;

      console.log("chainId...", chainId);
      console.log("version...", version);

      // INITIATE the LSPFactory
      const factory = new LSPFactory(web3.currentProvider, { chainId });
      console.log("web3.currentProvider...", web3.currentProvider);

      try {
        contracts = await factory.LSP7DigitalAsset.deploy(
          {
            name: e.target.querySelector('input#name').value,
            symbol: e.target.querySelector('input#symbol').value,
            controllerAddress: account, // the "issuer" of the asset, that is allowed to change meta data
            isNFT: false, // Token decimals set to 18
            digitalAssetMetadata: LSP4MetaData,
            creators: [account], // Array of ERC725Account addresses that define the creators of the digital asset.
          },
          {
            LSP7DigitalAsset: {
              version,
            },
            ipfsGateway: IPFS_GATEWAY_API_BASE_URL,
            onDeployEvents: {
              next: (deploymentEvent) => {
                console.log(deploymentEvent);

                if (deploymentEvent.status === 'COMPLETE') this.deployEvents.push(deploymentEvent);
              },
              error: (error) => {
                this.deploying = false;
                this.error = error.message;
                console.log("Error in onDeployEvents...", error);
                console.log("Error message in onDeployEvents...", this.error);
              },
              complete: async (contracts) => {
                console.log('Deployment Complete');
                console.log("Token address", contracts.LSP7DigitalAsset.address);
              console.log("Token receipt", contracts.LSP7DigitalAsset.receipt);
                console.log(contracts.LSP7DigitalAsset);
              },
            },
          }
        );
      } catch (err) {
        console.warn(err.message);
        this.error = err.message;
        this.deploying = false;
        console.log("LSP7DigitalAsset.deploy...", this.error);
        return;
      }

      if (!contracts && !contracts.LSP7DigitalAsset) {
        this.error = 'Error deploying LSP7DigitalAsset';
        console.log(this.error);
        return;
      }

      const deployedLSP7DigitalAssetContract = contracts.LSP7DigitalAsset;

      // ADD creations to UP
      const options = {
        ipfsGateway: IPFS_GATEWAY_BASE_URL,
      };

      const erc725LSP12IssuedAssets = new ERC725js(LSP12IssuedAssetsSchema, account, window.web3.currentProvider, options);

      // GET the current issued assets
      let LSP12IssuedAssets;
      try {
        LSP12IssuedAssets = await erc725LSP12IssuedAssets.getData('LSP12IssuedAssets[]');
      } catch (err) {
        // Is EOA
        // Load all assets that were stored in local storage
        LSP12IssuedAssets = JSON.parse(localStorage.getItem('issuedAssets'));
      }

      // add new asset
      LSP12IssuedAssets.value.push(deployedLSP7DigitalAssetContract.address);

      // if EOA, also add new asset list to localStorage
      let bytecode = await web3.eth.getCode(account);

      if (bytecode === '0x') {
        localStorage.setItem('issuedAssets', JSON.stringify(LSP12IssuedAssets));
      }

      // https://docs.lukso.tech/standards/smart-contracts/interface-ids
      const LSP7InterfaceId = '0x5fcaac27'; //'0xe33f65c3';

      const encodedErc725Data = erc725LSP12IssuedAssets.encodeData([
        {
          keyName: 'LSP12IssuedAssets[]',
          value: LSP12IssuedAssets.value,
        },
        {
          keyName: 'LSP12IssuedAssetsMap:<address>',
          dynamicKeyParts: deployedLSP7DigitalAssetContract.address,
          value: [LSP7InterfaceId, LSP12IssuedAssets.length - 1], // LSP7 interface ID + index position of asset
        },
      ]);

      // SEND transaction
      try {
        const profileContract = new window.web3.eth.Contract(LSP0ERC725Account.abi, account);
        const receipt = await profileContract.methods['setData(bytes32[],bytes[])'](encodedErc725Data.keys, encodedErc725Data.values).send({ from: account });

        this.deployEvents.push({ receipt, type: 'TRANSACTION', functionName: 'setData' });
      } catch (err) {
        console.warn(err);
        this.error = err.message;
        this.deploying = false;
        return;
      }
      // Show EOA local storage warning
      if (bytecode === '0x') {
        this.isEOA = true;
      }

      this.deploying = false;
      this.isSuccess = true;
    },
  },
};
</script>

<template>
  <a class="back" @click="$router.push('/')">&lt;</a>

  <p class="warning" v-if="error">
    {{ error }}
  </p>

  <div class="center">
    <h2>Tokeniza uno de tus papers de investigación, basandote en un <a href="https://docs.lukso.tech/standards/nft-2.0/LSP7-Digital-Asset" target="_blank">LSP7 Digital Asset</a></h2>

    <br />
    <br />

    <div v-if="isEOA" class="warning">Tu paper ha sido tokenizado a través de un NFT 2.0 , configurado y puesto en blockchain de forma correcta, pero debido al uso de Metamask, el token solo puede ser resguardado en el almacenamiento local del browser.</div>
    <p v-if="isWrongNetwork" class="warning">
      Por favor cambia tu red a LUKSO <a style="cursor: pointer" @click="addLuksoL14Testnet()">L14</a> o <a style="cursor: pointer" @click="addLuksoL16Testnet()">L16 </a>para crear este token.
    </p>
    <br />
    <br />

    <form v-if="!deploying && deployEvents.length === 0" @submit.prevent="onSubmit" class="left">
      <fieldset>
        <label for="name">Nombre del Token (no el título de tu paper)</label>
        <input type="text" placeholder="Mi Token" id="name" required />

        <label for="symbol">Símbolo del Token (entre 4 y 5 caracteres)</label>
        <input type="text" placeholder="MYTOK" id="symbol" required />

        <label for="description">Descripción (puede ser un pequeño resumen de tu paper)</label>
        <textarea placeholder="El Token que cambiará el mundo..." id="description" required></textarea>

        <label for="icon">Ícono del Token (representación íconografica de tu paper)</label>
        <input type="file" id="icon" accept="image/*" required />

        <br /><br />

        <input class="button-primary" type="submit" value="Despliega el Token" />
      </fieldset>
    </form>
  </div>

  <div class="events">
    <span v-if="deploying">
      Desplegando el Smart Contract en Blockchain...<br />
      <strong>Confirme todas las transacciones en la extensión de su navegador y espere hasta que se agreguen a Blockchain.</strong>
    </span>

    <br /><br />

    <div v-for="(event, index) in deployEvents" :key="index">
      <span v-if="event.type === 'PROXY_DEPLOYMENT'">
        Smart Contract desplegado: {{ event.contractName }} ({{ event.type }}): <a :href="`${BLOCKCHAIN_EXPLORER_BASE_URL}/address/${event.contractAddress}`" target="_blank">{{ event.contractAddress }}</a
        ><br />
        Hash de la transacción: <a :href="`${BLOCKCHAIN_EXPLORER_BASE_URL}/tx/${event.receipt.transactionHash}`" target="_blank">{{ event.receipt.transactionHash }}</a>
      </span>
      <br />
      <span v-if="event.type === 'TRANSACTION'">
        Función llamada: {{ event.functionName }}()<br />
        Hash de la transacción: <a :href="`${BLOCKCHAIN_EXPLORER_BASE_URL}/tx/${event.receipt.transactionHash}`" target="_blank">{{ event.receipt.transactionHash }}</a>
      </span>
    </div>

    <div v-if="isSuccess" style="padding-top: 60px">
      <h4>🎉 Éxito !</h4>
    </div>
  </div>
</template>
