const { BlobServiceClient } = require("@azure/storage-blob");
const { v1: uuidv1 } = require("uuid");

let containerClient;

export async function iniciarcontainer() {
    try 
    {
        // Creamos la conexion con azure
        const storageaccount = "itesm";
        const sas = "?sv=2022-11-02&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2023-05-30T10:54:36Z&st=2023-05-10T02:54:36Z&spr=https,http&sig=p%2BgLkuCcJ1TqHXrF2Xlw8kUDRM2bNYaBWlpXMKn8Fp0%3D";
        const blobServiceClient = new BlobServiceClient(`https://${storageaccount}.blob.core.windows.net${sas}`);    

        //Definimos el container existe
        const containerName = "lukso";
        containerClient = blobServiceClient.getContainerClient(containerName);
     
        //Validar si el container existe
        let flagcontainer = await containerClient.exists();
        if (!flagcontainer){
            //No existe, creamos el container
            const createContainerResponse = await containerClient.create();
            
            //Se ha creado el container
            console.log(createContainerResponse);
        }
    }
    catch (err) {
        console.log(`Error: ${err.message}`);
    }
}

export async function leer_perfil(wallet) {
    try 
    {
        await iniciarcontainer();

        //Definimos el archivo a leer
        const blobName = `${wallet}.txt`;
        const blobClient = containerClient.getBlobClient(blobName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
        //Leemos el archivo
        const downloadBlockBlobResponse = await blobClient.download();
        const downloaded = await blobToString(await downloadBlockBlobResponse.blobBody);
        const metadata = JSON.parse(downloaded);

        //Regresamos el valor de la direccion
        return metadata.profileaddress;
    }
    catch (err) {
        console.log(`Error: ${err.message}`);
    }
}

export async function agregar_perfil(wallet) {
    try 
    {
        await iniciarcontainer();

        //Definimos el archivo para el usuario registrado
        const blobName = `${wallet}.txt`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        //Validamos si hay un registro para el usuario
        let flagblockBlobClient = await blockBlobClient.exists()
        if (!flagblockBlobClient){
            //No existe registro, creamos el objeto
            let metadata = {}
            metadata.profileaddress = "";
            metadata.issuedAssets = [];
            metadata.receivedAssets = [];

            //Guardamos los valores en el storage
            const uploadBlobResponse = await blockBlobClient.upload(JSON.stringify(metadata), JSON.stringify(metadata).length);
            
            //Se ha creado el registro
            //console.log("Registro Creado");
        }
    }
    catch (err) {
        console.log(`Error: ${err.message}`);
    }
}

export async function actualizar_perfil(wallet, address_universal_profile) {
    try 
    {
        await iniciarcontainer();

        //Definimos el archivo a leer
        const blobName = `${wallet}.txt`;
        const blobClient = containerClient.getBlobClient(blobName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
        //Leemos el archivo
        const downloadBlockBlobResponse = await blobClient.download();
        const downloaded = await blobToString(await downloadBlockBlobResponse.blobBody);
        const metadata = JSON.parse(downloaded);

        //Guardamos los valores en el storage
        metadata.profileaddress = address_universal_profile;
        const uploadBlobResponse = await blockBlobClient.upload(JSON.stringify(metadata), JSON.stringify(metadata).length);

        //Perfil actualizado
        //console.log("Perfil Actualizado");
    }
    catch (err) {
        console.log(`Error: ${err.message}`);
    }
}


export async function leer_assets(wallet) {
    try 
    {
        await iniciarcontainer();

        //Definimos el archivo a leer
        const blobName = `${wallet}.txt`;
        const blobClient = containerClient.getBlobClient(blobName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
        //Leemos el archivo
        const downloadBlockBlobResponse = await blobClient.download();
        const downloaded = await blobToString(await downloadBlockBlobResponse.blobBody);
        const metadata = JSON.parse(downloaded);

        //Regresamos el valor de la direccion
        return metadata.issuedAssets;
    }
    catch (err) {
        console.log(`Error: ${err.message}`);
    }
}

export async function agregar_assets(wallet, address_assets) {
    try 
    {
        await iniciarcontainer();

        //Definimos el archivo a leer
        const blobName = `${wallet}.txt`;
        const blobClient = containerClient.getBlobClient(blobName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
        //Leemos el archivo
        const downloadBlockBlobResponse = await blobClient.download();
        const downloaded = await blobToString(await downloadBlockBlobResponse.blobBody);
        const metadata = JSON.parse(downloaded);
        
        //Actualizamos la informacion
        metadata.issuedAssets = address_assets;

        //Guardamos los valores en el storage
        const uploadBlobResponse = await blockBlobClient.upload(JSON.stringify(metadata), JSON.stringify(metadata).length);
    }
    catch (err) {
        console.log(`Error: ${err.message}`);
    }
}

export async function acuñar_assets(wallet, address_assets) {
    try 
    {
        await iniciarcontainer();

        //Definimos el archivo a leer
        const blobName = `${wallet}.txt`;
        const blobClient = containerClient.getBlobClient(blobName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
        //Leemos el archivo
        const downloadBlockBlobResponse = await blobClient.download();
        const downloaded = await blobToString(await downloadBlockBlobResponse.blobBody);
        const metadata = JSON.parse(downloaded);
        
        //Cargamos la informacion de los receivedAssets
        if (metadata.receivedAssets.indexOf(address_assets) === -1) {
            //No se encuentra el asset, por lo que lo agregamos a los assets
            metadata.receivedAssets.push(address_assets);

            //Guardamos los valores en el storage
            const uploadBlobResponse = await blockBlobClient.upload(JSON.stringify(metadata), JSON.stringify(metadata).length);
        }
    }
    catch (err) {
        console.log(`Error: ${err.message}`);
    }
}



//Funcion que lee un archivo
async function blobToString(blob) {
    const fileReader = new FileReader();
    return new Promise((resolve, reject) => {
      fileReader.onloadend = (ev) => {
        resolve(ev.target.result);
      };
      fileReader.onerror = reject;
      fileReader.readAsText(blob);
    });
  }