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

// Rutas
app.use('/api', authRoutes);

// Ruta test
app.get('/api/test', (req, res) => {
    res.json({
        message: 'Backend funcionando'
    });
});

async function startServer() {

    try {

        await connectDB();

        app.listen(PORT, () => {

            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);

        });

    } catch (error) {

        console.error(error);

    }

}

startServer();