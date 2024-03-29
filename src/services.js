const { BlobServiceClient } = require("@azure/storage-blob");
import * as CryptoJS from 'crypto-js';

let containerClient;


export async function startcontainer(cont = 1) {
    try 
    {   
        const storageaccount = process.env.VUE_APP_storageaccount;
        const accountKey = process.env.VUE_APP_accountKey;
        const containerNameWallet = process.env.VUE_APP_containerNameWallet;
        const containerNameAssets = process.env.VUE_APP_containerNameAssets;

        //Creamos las variables para crear el sas
        const end = new Date(new Date().getTime() + (30 * 1000));
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
        if (cont == 1){
            containerClient = blobServiceClient.getContainerClient(containerNameWallet);  
        }
        else{
            containerClient = blobServiceClient.getContainerClient(containerNameAssets);  
        }
     
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

export async function validatewallet(wallet) {
    try 
    {
        await startcontainer();

        //Definimos el archivo a leer
        const blobName = `${wallet}.txt`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        //Validamos si hay un registro para el usuario
        let flagblockBlobClient = await blockBlobClient.exists()

        return flagblockBlobClient;
    }
    catch (err) {
        console.log(`Error: ${err.message}`);
    }
}

export async function validateasset(asset_address) {
    try 
    {
        await startcontainer(2);

        //Definimos el archivo a leer
        const blobName = `${asset_address}.txt`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        //Validamos si hay un registro para el usuario
        let flagblockBlobClient = await blockBlobClient.exists()

        return flagblockBlobClient;
    }
    catch (err) {
        console.log(`Error: ${err.message}`);
    }
}

export async function getpermissions(wallet) {
    try 
    {
        await startcontainer();

        //Definimos el archivo a leer
        const blobName = `${wallet}.txt`;
        const blobClient = containerClient.getBlobClient(blobName);
      
        //Leemos el archivo
        const downloadBlockBlobResponse = await blobClient.download();
        const downloaded = await blobToString(await downloadBlockBlobResponse.blobBody);
        const metadata = JSON.parse(downloaded);

        if (metadata.permissions == null)
            return false;

        //Regresamos el valor
        return metadata.permissions;
    }
    catch (err) {
        console.log(`Error: ${err.message}`);
    }
}

export async function updatepermissions(wallet) {
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

        //Actualizamos los permisos
        metadata.permissions = true;

        //Guardamos el metadata
        const uploadBlobResponse = await blockBlobClient.upload(JSON.stringify(metadata), JSON.stringify(metadata).length);

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
            metadata.permissions = false;
            metadata.profileaddress = "";
            metadata.issuedAssets = [];
            metadata.receivedAssets = [];

            //Guardamos los valores en el storage
            const uploadBlobResponse = await blockBlobClient.upload(JSON.stringify(metadata), JSON.stringify(metadata).length);
            
            //Se ha creado el registro
            //console.log("Registro Creado");
        }
        
        //Definimos el archivo del log para el usuario registrado
        const blobNamelog = `${wallet}_log.txt`;
        const blockBlobClientLog = containerClient.getBlockBlobClient(blobNamelog);

        //Validamos si hay un registro para el usuario
        let flagblockBlobClientLog = await blockBlobClientLog.exists()
        if (!flagblockBlobClientLog){
            //No existe registro, creamos el objeto
            let logmetadata = {};
            logmetadata.log = [];

            //Guardamos los valores en el storage
            const uploadBlobResponseLog = await blockBlobClientLog.upload(JSON.stringify(logmetadata), JSON.stringify(logmetadata).length);
            
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

export async function indexissuedasset(wallet, address_Assets){
    
    await startcontainer(2);

    console.log(wallet);
    console.log(address_Assets);
    
    //Insertamos el archivo de assets, definimos el archivo para el usuario registrado
    const blobName = `${address_Assets}.txt`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    //Validamos si ya existe un indice
    let flagblockBlobClient = await blockBlobClient.exists()
    if (!flagblockBlobClient){
        //No existe registro, creamos el objeto
        let metadata = {}
        metadata.wallet = wallet;

        //Guardamos los valores en el storage
        const uploadBlobResponse = await blockBlobClient.upload(JSON.stringify(metadata), JSON.stringify(metadata).length);        
    }
}

export async function getwallet(address_wallet) {
    try 
    {
        await startcontainer(2);

        //Definimos el archivo a leer
        const blobName = `${address_wallet}.txt`;
        const blobClient = containerClient.getBlobClient(blobName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
        //Leemos el archivo
        const downloadBlockBlobResponse = await blobClient.download();
        const downloaded = await blobToString(await downloadBlockBlobResponse.blobBody);
        const metadata = JSON.parse(downloaded);

        //Regresamos el valor de la direccion
        return metadata.wallet;
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

export async function updatelog(wallet, transactionlog){
    try 
    {
        await startcontainer();

        //Definimos el archivo a leer
        const blobName = `${wallet}_log.txt`;
        const blobClient = containerClient.getBlobClient(blobName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        //Leemos el archivo
        const downloadBlockBlobResponse = await blobClient.download();
        const downloaded = await blobToString(await downloadBlockBlobResponse.blobBody);
        const metadata = JSON.parse(downloaded);
     
        //Actualizamos la informacion
        for (let i=0; i < transactionlog.length; i++){
            metadata.log.push(transactionlog[i]);
        }

        //Guardamos los valores en el storage
        const uploadBlobResponse = await blockBlobClient.upload(JSON.stringify(metadata), JSON.stringify(metadata).length);
    }
    catch (err) {
        console.log(`Error: ${err.message}`);
    }
}

export async function downloadlog(wallet){
    try 
    {
        await startcontainer();

        //Definimos el archivo a leer
        const blobName = `${wallet}_log.txt`;
        const blobClient = containerClient.getBlobClient(blobName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        //Leemos el archivo
        const downloadBlockBlobResponse = await blobClient.download();
        const downloaded = await blobToString(await downloadBlockBlobResponse.blobBody);
        const metadata = JSON.parse(downloaded);

        return metadata.log;
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