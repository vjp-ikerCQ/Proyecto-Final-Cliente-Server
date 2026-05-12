const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config({ path: './database.env'});
console.log(process.env.MONGODB_URI);
console.log(process.env.DB_NAME);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Variables de entorno
const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

let db;

// Conectar a MongoDB
async function connectToMongo() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    console.log('✅ Conectado a MongoDB Atlas');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
  }
}

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend funcionando correctamente' });
});

// Ruta para obtener cartas (ejemplo)
app.get('/api/cartas', async (req, res) => {
  try {
    const cartas = await db.collection('cartas').find({}).toArray();
    res.json(cartas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  connectToMongo();
});