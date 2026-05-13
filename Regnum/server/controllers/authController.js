const { getDB } = require('../config/db');

const login = async (req, res) => {
    try {
        const { nombre, password } = req.body;

        if (!nombre || !password) {
            return res.status(400).json({
                success: false,
                message: 'Nombre y password son requeridos'
            });
        }

        const db = getDB();

        if (!db) {
            console.error('Database not connected');
            return res.status(503).json({
                success: false,
                message: 'El servidor no está conectado a la base de datos'
            });
        }

        console.log('Buscando usuario:', nombre);

        const usuario = await db.collection('usuarios').findOne({ nombre });

        console.log("🧾 USUARIO EN DB:", usuario);

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // 🔐 comparación de password - buscar en todos los posibles campos
        console.log("🔑 CAMPOS DEL USUARIO:", Object.keys(usuario));
        const storedPassword = usuario.contrasena || usuario.contraseña || usuario.password;
        console.log("🔐 PASS DB:", storedPassword);
        console.log("🔐 PASS INPUT:", password);

        if (storedPassword !== password) {
            return res.status(401).json({
                success: false,
                message: 'Password incorrecta'
            });
        }

        return res.json({
            success: true,
            message: 'Login correcto',
            usuario: {
                nombre: usuario.nombre
            }
        });

    } catch (error) {
        console.error("💥 ERROR EN LOGIN:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const register = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        console.log("📩 BODY RECIBIDO:", req.body);

        if (!nombre || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        const db = getDB();

        if (!db) {
            console.error('Database not connected');
            return res.status(503).json({
                success: false,
                message: 'El servidor no está conectado a la base de datos'
            });
        }

        const usuarioExistente = await db.collection('usuarios').findOne({
            $or: [{ nombre }, { email }]
        });

        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de usuario o email ya está en uso'
            });
        }

        const nuevoUsuario = {
            nombre,
            email,
            contrasena: password, // se guarda como contrasena en DB
            createdAt: new Date()
        };

        await db.collection('usuarios').insertOne(nuevoUsuario);

        return res.status(201).json({
            success: true,
            message: 'Usuario registrado correctamente'
        });

    } catch (error) {
        console.error("💥 ERROR EN REGISTER:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    login,
    register
};