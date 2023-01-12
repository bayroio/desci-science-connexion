<script setup>
  import ProfileComponent from '../components/ProfileComponent.vue';
  import LSP12IssuedAssetsComponent from '../components/LSP12IssuedAssetsComponent.vue';
  import LSP5ReceivedAssets from '../components/LSP5ReceivedAssets.vue';
</script>

<template>
  <div>

    <h1>Bienvenido</h1>

    <!-- Add tabs -->
    <div class="tabs">

      <!--Universal Profile-->
      <div class="tabby-tab">
        <input type="radio" id="tab-1" name="tabby-tabs" checked>
        <label for="tab-1">Perfil Universal</label>
        <div class="tabby-content">
          <ProfileComponent />
        </div>
      </div>

      <!--LSP12-->
      <div class="tabby-tab">
        <input type="radio" id="tab-2" name="tabby-tabs">
        <label for="tab-2">Tokens Creados</label>
        <div class="tabby-content">
          <LSP12IssuedAssetsComponent style="margin-top: 60px" />
        </div>
      </div>

      <!--LSP5-->
      <div class="tabby-tab">
        <input type="radio" id="tab-3" name="tabby-tabs">
        <label for="tab-3">Envío/Recepción de Tokens</label>
        <div class="tabby-content">
          <LSP5ReceivedAssets style="margin-top: 60px" />
        </div>
      </div>



      <!--Transfer-->
      <!-- <div class="tabby-tab">
        <input type="radio" id="tab-4" name="tabby-tabs">
        <label for="tab-4">Transferir</label>
        <div class="tabby-content">
            <p>Throwup on your pillow wake up human for food at 4am and hide when guests come over, yet inspect anything brought into the house.</p>
        </div>
      </div> -->

    </div>



    <!-- <div class="center">
      <button @click="$router.push('/createToken')" style="width: 235px">Tokeniza un paper</button>
      <button @click="$router.push('/createNFTCollection')" style="width: 350px">Crea una colección de papers tokenizados</button>
      <LSP12IssuedAssetsComponent style="margin-top: 60px" />
      <LSP5ReceivedAssets style="margin-top: 60px" />
    </div> -->
  </div>
</template>
