const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './database.env' });

async function check() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    const user = await db.collection('usuarios').findOne({ nombre: 'Pablo' });
    console.log('USUARIO ENCONTRADO:', JSON.stringify(user, null, 2));
    const all = await db.collection('usuarios').find().toArray();
    console.log('TODOS LOS USUARIOS:', JSON.stringify(all.map(u => u.nombre), null, 2));
  } finally {
    await client.close();
  }
}
check();
