<!-- 
  /* */ 
  /* Pantalla principal del proyecto, se muestran las opciones disponibles dentro de la aplicación */
  /* */ 
 -->

<!-- Listado de componentes que se utilizaran dentro de la pantalla -->
<script setup>
  import ProfileComponent from '../components/Profile/ProfileComponent.vue';                //Componente que incluye la información del Perfil//
  import PapersComponent from '../components/Papers/PapersComponent.vue';                   //Componente que incluye la Tokenización de Papers//
  import PortfolioComponent from '../components/Portfolio/PortfolioComponent.vue';          //Componente que incluye el portafolio del Usuario//
  import SearchComponent from '../components/Search/SearchComponent.vue';                   //Componente que incluye la busqueda de información//  
</script>

<style scoped>

</style><template>
  <div>

    <h1>Bienvenido</h1>

    <!-- Add tabs -->
    <div class="tabs">

      <!-- Tab del Perfil Universal, se incorpora el Componente Profile -->
      <div class="tabby-tab">
        <input type="radio" id="tab-1" name="tabby-tabs">
        <label for="tab-1">Perfil Universal</label>
        <div class="tabby-content">
          <ProfileComponent />
        </div>
      </div>

      <!-- Tab de Papers Tokenizados, se incorpora el Componente LSP12IssuedAssets -->
      <div class="tabby-tab">
        <input type="radio" id="tab-2" name="tabby-tabs">
        <label for="tab-2">Papers Tokenizados</label>
        <div class="tabby-content">
          <PapersComponent style="margin-top: 60px" />
        </div>
      </div>

      <!-- Tab de Portafolio, se incorpora el Componente LSP5ReceivedAssets -->
      <div class="tabby-tab">
        <input type="radio" id="tab-3" name="tabby-tabs">
        <label for="tab-3">Portafolio</label>
        <div class="tabby-content">
          <PortfolioComponent style="margin-top: 60px" />
        </div>
      </div>

      <!-- Tab de Busqueda -->
      <div class="tabby-tab">
        <input type="radio" id="tab-4" name="tabby-tabs" checked>
        <label for="tab-4">Búsqueda</label>
        <div class="tabby-content">
          <SearchComponent style="margin-top: 60px" />
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
  </div>
</template>
