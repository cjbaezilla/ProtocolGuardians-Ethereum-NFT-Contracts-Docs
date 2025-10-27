require('dotenv').config();
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function uploadToPinata(filePath) {
    if (!filePath) {
        console.error('Error: No se proporcionó la ruta del archivo');
        process.exit(1);
    }

    if (!fs.existsSync(filePath)) {
        console.error(`Error: El archivo no existe: ${filePath}`);
        process.exit(1);
    }

    if (!process.env.PINATA_JWT) {
        console.error('Error: PINATA_JWT no está configurado en el archivo .env');
        process.exit(1);
    }

    const jwt = process.env.PINATA_JWT.trim();
    if (!jwt.includes('.')) {
        console.error('Error: PINATA_JWT no es un token JWT válido. Debe ser un JWT completo (ej: eyJhbGc...).');
        console.error('Genera tu token en: https://app.pinata.cloud/');
        process.exit(1);
    }

    try {
        const formData = new FormData();
        const fileStream = fs.createReadStream(filePath);
        formData.append('file', fileStream);

        const response = await axios.post(
            'https://api.pinata.cloud/pinning/pinFileToIPFS',
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${jwt}`
                }
            }
        );

        console.log(response.data.IpfsHash);
    } catch (error) {
        console.error('Error:', error.response?.data?.error?.details || error.message);
        process.exit(1);
    }
}

const filePath = process.argv[2];
uploadToPinata(filePath);
