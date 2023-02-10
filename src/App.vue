<script setup>
  import Web3 from 'web3';
  window.web3 = new Web3(Web3.givenProvider);
</script>

<script>

  export default {
    async mounted() {

      // TRY getting the UniversalProfile address
      try {
        const accounts = await web3.eth.getAccounts();

        if (!accounts.length) {
          throw Error('No accounts given: ' + accounts);
        }
        //console.log('Authenticated account:\n', accounts);

        // GET the Universal Profile
        window.account = accounts[0];

        // Check if address is EOA, create localStorage to store assets on
        let bytecode = await web3.eth.getCode(accounts[0]);
        if (bytecode === '0x') {
          this.setupLocalStorage("receivedAssets", accounts[0]);
          this.setupLocalStorage("issuedAssets", accounts[0])
        }

        // If address is Universal Profile, clear cache used before
        else{
          this.clearLocalStorage("receivedAssets");
          this.clearLocalStorage("issuedAssets");
        }
      } 
      catch (e) {
        console.log('Not authenticated:\n\n', e);
        this.$router.push('/login');
      }
    },

    methods: {
      setupLocalStorage(itemName, account){
        if (localStorage.getItem(itemName) === null) {
          localStorage.setItem(itemName, JSON.stringify({"value":[], "account": account}));
        }
        else{
          const localStorageOwner = JSON.parse(localStorage.getItem(itemName));
            
          if(localStorageOwner.account !== account){
            localStorage.removeItem(itemName);
          }
        }
      },

      clearLocalStorage(itemName){
          if (localStorage.getItem(itemName) !== null) {
            localStorage.removeItem(itemName);
          }
      }
    }
  };
</script>

<template>
  <!--Header-->
  <div class="header_title">
    <img src="https://scienceconnexion.com/img/MainLogo.png"/>
    <h2>DeSci para Science Connexion</h2>
  </div>

  <div class="app container">
    <header></header>

    <main>
      <router-view />
    </main>
    <footer> <a target="_blank" rel="noopener noreferrer" href="https://scienceconnexion.com/">Science Connexion</a></footer>
  </div>
</template>

<style lang="less">
  @import './styles.less';
</style>
