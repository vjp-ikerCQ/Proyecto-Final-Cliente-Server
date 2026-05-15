const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../database.env') });

// Configuración de Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const CARDS_DIR = path.join(__dirname, '../../src/assets/images/cards');
const AUDIO_DIR = path.join(__dirname, '../../public/audio');

const BASE_CLOUDINARY_PATH = 'Assets/Folders/Home/regnumhollow';
const OUTPUT_FILE = path.join(__dirname, 'migration_results.json');

async function migrate() {
    try {
        console.log('🚀 Iniciando subida a Cloudinary (Sin DB por ahora)...');
        
        const results = {
            cards: [],
            audio: {}
        };

        // 1. Subir Imágenes de Cartas
        console.log('\n--- Subiendo Imágenes de Cartas ---');
        const cardFiles = fs.readdirSync(CARDS_DIR).filter(file => file.endsWith('.png'));
        
        for (const file of cardFiles) {
            const filePath = path.join(CARDS_DIR, file);
            const match = file.match(/^(.+)_(\d+)\.png$/);
            if (!match) continue;

            const palo = match[1];
            const numero = parseInt(match[2], 10);

            console.log(`Subiendo ${file}...`);
            const result = await cloudinary.uploader.upload(filePath, {
                folder: `${BASE_CLOUDINARY_PATH}/Cards`,
                public_id: file.replace('.png', ''),
                overwrite: true
            });

            console.log(`✅ Subido: ${result.secure_url}`);
            results.cards.push({ palo, numero, url: result.secure_url });
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
            results.audio.menu = audioResult.secure_url;
        }

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
        console.log(`\n📂 Resultados guardados en: ${OUTPUT_FILE}`);
        console.log('\n✨ Subida completada con éxito!');

    } catch (error) {
        console.error('💥 Error durante la subida:', error);
    }
}

migrate();
