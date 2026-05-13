const express = require('express');
const cors = require('cors');

require('dotenv').config({ path: './database.env' });

const { connectDB } = require('./config/db');

const authRoutes = require('./routes/authRoutes');

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

//Rutas
app.use('/api', authRoutes);

//Ruta test
app.get('/api/test', (req, res) => {
    res.json({
        message: 'Backend funcionando'
    });
});

//Iniciar servidor
app.listen(PORT, async () => {

    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);

    await connectDB();

});


/* Ruta para obtener cartas (ejemplo)
app.get('/api/cartas', async (req, res) => {
    try {
        const cartas = await db.collection('cartas').find({}).toArray();
        res.json(cartas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});*/

