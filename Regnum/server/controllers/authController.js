//requerimientos para la conexion
const { getDB } = require('../config/db');

const login = async (req, res) => {
    try {
        const { nombre, contraseña } = req.body;

        if (!nombre || !contraseña) {
            return res.status(400).json({
                success: false,
                message: 'Nombre y contraseña son requeridos'
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
        const usuario = await db.collection('usuarios').findOne({
            nombre: nombre
        });

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Comprobar contraseña (por ahora comparación directa, idealmente usar bcrypt)
        if (usuario.contraseña !== contraseña) {
            return res.status(401).json({
                success: false,
                message: 'Contraseña incorrecta'
            });
        }

        // Si todo sale bien
        res.json({
            success: true,
            message: 'Login correcto',
            usuario: {
                nombre: usuario.nombre,
                // No devolvemos la contraseña al frontend
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const register = async (req, res) => {
    try {
        const { nombre, email, contraseña } = req.body;

        if (!nombre || !email || !contraseña) {
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

        // Verificar si el usuario ya existe
        const usuarioExistente = await db.collection('usuarios').findOne({
            $or: [{ nombre: nombre }, { email: email }]
        });

        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de usuario o email ya está en uso'
            });
        }

        // Crear el nuevo usuario
        const nuevoUsuario = {
            nombre,
            email,
            contraseña, // En producción usar bcrypt para hashear
            createdAt: new Date()
        };

        await db.collection('usuarios').insertOne(nuevoUsuario);

        res.status(201).json({
            success: true,
            message: 'Usuario registrado correctamente'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//exportar al login
module.exports = {
    login,
    register
}