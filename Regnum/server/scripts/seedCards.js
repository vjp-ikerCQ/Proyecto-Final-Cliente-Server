const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './database.env' });

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

const cartas = [
    // OROS
    { nombre: 'Rey de Oros', palo: 'oros', numero: 12, calidad: 'Legendaria', vida: 10, habilidad: { voluntad: 5, cantidad: 8, efecto: 'Aumenta el ataque de aliados' } },
    { nombre: 'Caballo de Oros', palo: 'oros', numero: 11, calidad: 'Épica', vida: 8, habilidad: { voluntad: 4, cantidad: 6, efecto: 'Carga contra el enemigo' } },
    { nombre: 'Sota de Oros', palo: 'oros', numero: 10, calidad: 'Rara', vida: 6, habilidad: { voluntad: 3, cantidad: 4, efecto: 'Genera recursos' } },
    { nombre: 'As de Oros', palo: 'oros', numero: 1, calidad: 'Común', vida: 4, habilidad: { voluntad: 1, cantidad: 2, efecto: 'Ataque básico' } },

    // COPAS
    { nombre: 'Rey de Copas', palo: 'copas', numero: 12, calidad: 'Legendaria', vida: 12, habilidad: { voluntad: 5, cantidad: 10, efecto: 'Cura a todos los aliados' } },
    { nombre: 'As de Copas', palo: 'copas', numero: 1, calidad: 'Común', vida: 5, habilidad: { voluntad: 1, cantidad: 3, efecto: 'Cura básica' } },

    // ESPADAS
    { nombre: 'Rey de Espadas', palo: 'espadas', numero: 12, calidad: 'Legendaria', vida: 8, habilidad: { voluntad: 5, cantidad: 12, efecto: 'Daño masivo a un objetivo' } },
    { nombre: 'As de Espadas', palo: 'espadas', numero: 1, calidad: 'Común', vida: 3, habilidad: { voluntad: 1, cantidad: 5, efecto: 'Ataque fuerte' } },

    // BASTOS
    { nombre: 'Rey de Bastos', palo: 'bastos', numero: 12, calidad: 'Legendaria', vida: 15, habilidad: { voluntad: 5, cantidad: 5, efecto: 'Aturde a los enemigos' } },
    { nombre: 'As de Bastos', palo: 'bastos', numero: 1, calidad: 'Común', vida: 7, habilidad: { voluntad: 1, cantidad: 2, efecto: 'Ataque pesado' } },

    // JOKERS
    { nombre: 'Joker Loco', palo: 'jokers', numero: 1, calidad: 'Mítica', vida: 1, habilidad: { voluntad: 0, cantidad: 0, efecto: 'Efecto aleatorio' } }
];

async function seedDB() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB para seed');
        const db = client.db(dbName);

        // Limpiar colección existente
        await db.collection('cartas').deleteMany({});
        console.log('🗑️ Colección de cartas limpiada');

        // Insertar cartas
        const result = await db.collection('cartas').insertMany(cartas);
        console.log(`✨ ${result.insertedCount} cartas insertadas correctamente`);

    } catch (error) {
        console.error('❌ Error en el seed:', error);
    } finally {
        await client.close();
        process.exit();
    }
}

seedDB();
