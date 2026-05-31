const cloudinary = require('cloudinary').v2;
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../database.env') });

// Configuración de Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

const CARDS_DIR = path.join(__dirname, '../../src/assets/images/cards');
const AUDIO_DIR = path.join(__dirname, '../../public/audio');

const BASE_CLOUDINARY_PATH = 'Assets/Folders/Home/regnumhollow';

async function migrate() {
    let client;
    try {
        console.log('🚀 Iniciando migración a Cloudinary...');
        
        client = new MongoClient(uri);
        await client.connect();
        const db = client.db(dbName);
        const cardsCollection = db.collection('cartas');

        // 1. Subir Imágenes de Cartas
        console.log('\n--- Subiendo Imágenes de Cartas ---');
        const cardFiles = fs.readdirSync(CARDS_DIR).filter(file => file.endsWith('.png'));
        
        for (const file of cardFiles) {
            const filePath = path.join(CARDS_DIR, file);
            // Extraer palo y número del nombre del archivo (ej: espadas_1.png)
            const match = file.match(/^(.+)_(\d+)\.png$/);
            if (!match) {
                console.warn(`⚠️ Saltando archivo no reconocido: ${file}`);
                continue;
            }

            const palo = match[1]; // ej: espadas
            const numero = parseInt(match[2], 10); // ej: 1

            console.log(`Subiendo ${file}...`);
            const result = await cloudinary.uploader.upload(filePath, {
                folder: `${BASE_CLOUDINARY_PATH}/Cards`,
                public_id: file.replace('.png', ''),
                overwrite: true
            });

            console.log(`✅ Subido: ${result.secure_url}`);

            // Actualizar en MongoDB
            const query = { palo: palo.toLowerCase(), numero: numero };
            const update = { $set: { image: result.secure_url } };
            
            const updateResult = await cardsCollection.updateOne(query, update);
            if (updateResult.matchedCount > 0) {
                console.log(`🔹 DB Actualizada para ${palo} ${numero}`);
            } else {
                console.warn(`❓ No se encontró la carta ${palo} ${numero} en la DB.`);
            }
        }

        // 2. Subir Música del Menú
        console.log('\n--- Subiendo Música del Menú ---');
        const menuMusicPath = path.join(AUDIO_DIR, 'menu.mp3');
        if (fs.existsSync(menuMusicPath)) {
            console.log('Subiendo menu.mp3...');
            const audioResult = await cloudinary.uploader.upload(menuMusicPath, {
                folder: `${BASE_CLOUDINARY_PATH}/music`,
                resource_type: 'video',
                public_id: 'menu',
                overwrite: true
            });
            console.log(`✅ Música subida: ${audioResult.secure_url}`);
        }

        console.log('\n✨ Migración completada con éxito!');

    } catch (error) {
        console.error('💥 Error durante la migración:', error);
    } finally {
        if (client) await client.close();
    }
}

migrate();
