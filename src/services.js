const { BlobServiceClient } = require("@azure/storage-blob");
import * as CryptoJS from 'crypto-js';

let containerClient;


export async function startcontainer() {
    try 
    {   
        const storageaccount = process.env.VUE_APP_storageaccount;
        const accountKey = process.env.VUE_APP_accountKey;
        const containerName = process.env.VUE_APP_containerName;

        //Creamos las variables para crear el sas
        const end = new Date(new Date().getTime() + (30 * 1000));
        console.log(end);
        const signedpermissions = 'rwdlac';
        const signedservice = 'b';
        const signedresourcetype = 'sco';
        const signedexpiry = end.toISOString().substring(0, end.toISOString().lastIndexOf('.')) + 'Z';
        const signedProtocol = 'https';
        const signedversion = '2018-03-28';
      
        const StringToSign = 
            storageaccount + '\n' + 
            signedpermissions + '\n' + 
            signedservice + '\n' + 
            signedresourcetype + '\n' + '\n' + 
            signedexpiry + '\n' + '\n' +
            signedProtocol + '\n' +
            signedversion + '\n';

        //Encryptamos la llave
        var str = CryptoJS.HmacSHA256(StringToSign,CryptoJS.enc.Base64.parse(accountKey));
        var sig = CryptoJS.enc.Base64.stringify(str);
      
        //Creamos el sas
        const sasToken =`?sv=${(signedversion)}&ss=${(signedservice)}&srt=${(signedresourcetype)}&sp=${(signedpermissions)}&se=${encodeURIComponent(signedexpiry)}&spr=${(signedProtocol)}&sig=${encodeURIComponent(sig)}`;
        
        // Creamos la conexion con azure
        const blobServiceClient = new BlobServiceClient(`https://${storageaccount}.blob.core.windows.net${sasToken}`);    
  
        //Definimos el container
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


export async function getprofile(wallet) {
    try 
    {
        await startcontainer();

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

export async function addprofile(wallet) {
    try 
    {
        await startcontainer();

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

export async function updateprofile(wallet, address_universal_profile) {
    try 
    {
        await startcontainer();

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


export async function getissuedassets(wallet) {
    try 
    {
        await startcontainer();

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

export async function addissuedassets(wallet, address_assets) {
    try 
    {
        await startcontainer();

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

export async function mintissuedassets(wallet, address_assets) {
    try 
    {
        await startcontainer();

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


export async function getreceivedassets(wallet) {
    try 
    {
        await startcontainer();

        //Definimos el archivo a leer
        const blobName = `${wallet}.txt`;
        const blobClient = containerClient.getBlobClient(blobName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
        //Leemos el archivo
        const downloadBlockBlobResponse = await blobClient.download();
        const downloaded = await blobToString(await downloadBlockBlobResponse.blobBody);
        const metadata = JSON.parse(downloaded);

        //Regresamos el valor de la direccion
        return metadata.receivedAssets;
    }
    catch (err) {
        console.log(`Error: ${err.message}`);
    }
}

export async function removereceivedassets(wallet, address_assets) {
    try 
    {
        await startcontainer();

        //Definimos el archivo a leer
        const blobName = `${wallet}.txt`;
        const blobClient = containerClient.getBlobClient(blobName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
        //Leemos el archivo
        const downloadBlockBlobResponse = await blobClient.download();
        const downloaded = await blobToString(await downloadBlockBlobResponse.blobBody);
        const metadata = JSON.parse(downloaded);

        //Quitamos el asset
        metadata.receivedAssets = metadata.receivedAssets.filter(function (assetAddress) {
            return assetAddress !== address_assets;
        });
        console.log(metadata.receivedAssets);

        //Guardamos los valores en el storage
        const uploadBlobResponse = await blockBlobClient.upload(JSON.stringify(metadata), JSON.stringify(metadata).length);

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