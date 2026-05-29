const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

let db;

async function connectDB() {

  try {

    console.log('Intentando conectar a:', uri ? uri.replace(/:.+@/, ':****@') : 'URI NO DEFINIDA');
    const client = new MongoClient(uri);

    await client.connect();

    db = client.db(dbName);

    console.log('✅ Conectado a MongoDB Atlas');

  } catch (error) {

    console.error('❌ Error conectando MongoDB:', error);

  }

}

function getDB() {
  return db;
}

module.exports = {
  connectDB,
  getDB
};