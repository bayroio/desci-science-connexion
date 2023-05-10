const { BlobServiceClient } = require("@azure/storage-blob");
const { v1: uuidv1 } = require("uuid");

export async function agregar_address(address) {
    try 
    {
        // Creamos la conexion con azure
        const storageaccount = "itesm";
        const sas = "?sv=2022-11-02&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2023-05-30T10:54:36Z&st=2023-05-10T02:54:36Z&spr=https,http&sig=p%2BgLkuCcJ1TqHXrF2Xlw8kUDRM2bNYaBWlpXMKn8Fp0%3D";
        const blobServiceClient = new BlobServiceClient(`https://${storageaccount}.blob.core.windows.net${sas}`);    
        console.log(blobServiceClient);

        //Definimos el container existe
        const containerName = "lukso";
        const containerClient = blobServiceClient.getContainerClient(containerName);
     
        //Validar si el container existe
        let flagcontainer = await containerClient.exists();
        if (!flagcontainer){
            //No existe, creamos el container
            const createContainerResponse = await containerClient.create();
            
            //Se ha creado el container
            console.log(createContainerResponse);
        }

        //Definimos el archivo para el usuario registrado
        const blobName = `${address}.txt`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        //Validamos si hay un registro para el usuario
        let flagblockBlobClient = await blockBlobClient.exists()
        if (!flagblockBlobClient){
            //No existe registro, creamos el objeto
            let obj = {}
            obj.profileaddress = "";
            obj.issuedAssets = [];
            obj.receivedAssets = [];

            //Guardamos los valores en el storage
            const uploadBlobResponse = await blockBlobClient.upload(JSON.stringify(obj), JSON.stringify(obj).length);
            
            //Se ha creado el registro
            console.log("Registro Creado");
        }
    }
    catch (err) {
        console.log(`Error: ${err.message}`);
    }
}

