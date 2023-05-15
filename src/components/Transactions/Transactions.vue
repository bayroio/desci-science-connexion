<!-- 
  /* */ 
  /* Pantalla principal de transacciones */
  /* */ 
 -->

<!-- Listado de componentes que se utilizaran dentro de la pantalla -->
<script setup>
  import { onMounted, ref } from 'vue';
  import { downloadlog } from '../../services.js';

  let transactions = ref([]);

  //Acciones que se realizan al cargar la página//  
  onMounted(async () => {
    // Obtenemos las cuentas de la extensión
    const accounts = await window.web3.eth.getAccounts();
    
    // Obtenemos la cuenta con la que se está autentificado, la guardamos en las variables globales de la página
    const account = accounts[0]; 

    // Obtenemos las transacciones
    let tran = await downloadlog(account);
    for (let i=0; i<tran.length; i++){
      //Get the text
      let text = JSON.parse(tran[i]);
      console.log(text);
      transactions.value.push({
        number: i+1,
        type: text.type,
        contractname: text.contractName,
        functionname: text.functionName,
        status: text.status
      });
    }
  });

</script>

<template>
  <!-- Sección de Transacciones -->
  <div>
    <h4 class="center"><strong>Transacciones</strong></h4>
  </div>

  <br />
  <div class="center" style="display: block">
    <table class="table table-bordered">
			<thead>
				<tr>
					<th> Número </th>
          <th> Tipo </th>
					<th> Contrato </th>
					<th> Función </th>
          <th> Estatus </th>
				</tr>
			</thead>
      <tbody>
        <tr v-for="row in transactions" :key="row">
          <td>{{ row.number }}</td>
          <td>{{ row.type }}</td>
          <td>{{ row.contractname }}</td>
          <td>{{ row.functionname }}</td>
          <td>{{ row.status }}</td>
        </tr>
      </tbody>
    </table>
  </div>


</template>
