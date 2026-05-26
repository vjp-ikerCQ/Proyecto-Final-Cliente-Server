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

        if (usuario.status === 'Baneado') {
            return res.status(403).json({
                success: false,
                message: 'Tu cuenta ha sido baneada. Puedes apelar esta decisión enviando un ticket de soporte.'
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
            createdAt: new Date(),
            estadisticas: {
                partidasJugadas: 0,
                partidasGanadas: 0,
                partidasPerdidas: 0,
                tiempoJugado: 0
            }
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

const deleteAccount = async (req, res) => {
    try {
        const { nombre, password } = req.body;

        if (!nombre || !password) {
            return res.status(400).json({
                success: false,
                message: 'Nombre y password son requeridos para eliminar la cuenta'
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

        const usuario = await db.collection('usuarios').findOne({ nombre });

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Verificar password antes de eliminar
        const storedPassword = usuario.contrasena || usuario.contraseña || usuario.password;

        if (storedPassword !== password) {
            return res.status(401).json({
                success: false,
                message: 'Password incorrecta. No se puede eliminar la cuenta'
            });
        }

        await db.collection('usuarios').deleteOne({ nombre });

        console.log(`🗑️ Usuario eliminado: ${nombre}`);

        return res.json({
            success: true,
            message: 'Cuenta eliminada correctamente'
        });

    } catch (error) {
        console.error('💥 ERROR EN DELETE ACCOUNT:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const db = getDB();
        if (!db) {
            return res.status(503).json({ success: false, message: 'El servidor no está conectado a la base de datos' });
        }
        
        // Buscamos todos los usuarios, excluyendo las contraseñas
        const users = await db.collection('usuarios').find({}, { projection: { contrasena: 0, contraseña: 0, password: 0 } }).toArray();
        
        return res.json(users);
    } catch (error) {
        console.error("💥 ERROR EN GET ALL USERS:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

const deleteUserByAdmin = async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;
        const { ObjectId } = require('mongodb');

        if (!id) {
            return res.status(400).json({ success: false, message: 'ID de usuario requerido' });
        }

        let queryId;
        const numId = Number(id);
        if (!isNaN(numId)) {
            queryId = numId;
        } else {
            try {
                queryId = new ObjectId(id);
            } catch (e) {
                queryId = id;
            }
        }

        // Borramos el usuario por su ID
        const result = await db.collection('usuarios').deleteOne({ _id: queryId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        return res.json({ success: true, message: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error("💥 ERROR AL ELIMINAR USUARIO:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;
        const { nombre, role, status } = req.body;
        const { ObjectId } = require('mongodb');

        if (!id) {
            return res.status(400).json({ success: false, message: 'ID requerido' });
        }

        const updateData = {};
        if (nombre) updateData.nombre = nombre;
        if (role) updateData.role = role;
        if (status) updateData.status = status;

        let queryId;
        const numId = Number(id);
        if (!isNaN(numId)) {
            queryId = numId;
        } else {
            try {
                queryId = new ObjectId(id);
            } catch (e) {
                queryId = id;
            }
        }

        const result = await db.collection('usuarios').updateOne(
            { _id: queryId },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        return res.json({ success: true, message: 'Usuario actualizado correctamente' });
    } catch (error) {
        console.error("💥 ERROR AL ACTUALIZAR USUARIO:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

const createTicket = async (req, res) => {
    try {
        const db = getDB();
        const { user, type, message } = req.body;

        const nuevoTicket = {
            user: user || 'Invitado',
            type,
            message,
            status: 'Abierto',
            createdAt: new Date()
        };

        await db.collection('tickets').insertOne(nuevoTicket);

        return res.status(201).json({ success: true, message: 'Ticket guardado correctamente' });
    } catch (error) {
        console.error("💥 ERROR AL CREAR TICKET:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

const getTickets = async (req, res) => {
    try {
        const db = getDB();
        
        const tickets = await db.collection('tickets').find().sort({ createdAt: -1 }).toArray();
        
        return res.json(tickets);
    } catch (error) {
        console.error("💥 ERROR AL OBTENER TICKETS:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

const updateTicketStatus = async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;
        const { status } = req.body;
        const { ObjectId } = require('mongodb');

        let queryId;
        try {
            queryId = new ObjectId(id);
        } catch (e) {
            queryId = id;
        }

        const result = await db.collection('tickets').updateOne(
            { _id: queryId },
            { $set: { status: status } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, message: 'Ticket no encontrado' });
        }

        return res.json({ success: true, message: 'Estado del ticket actualizado' });
    } catch (error) {
        console.error("💥 ERROR AL ACTUALIZAR TICKET:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

const deleteTicket = async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;
        const { ObjectId } = require('mongodb');

        let queryId;
        try {
            queryId = new ObjectId(id);
        } catch (e) {
            queryId = id;
        }

        const result = await db.collection('tickets').deleteOne({ _id: queryId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Ticket no encontrado' });
        }

        return res.json({ success: true, message: 'Ticket eliminado correctamente' });
    } catch (error) {
        console.error("💥 ERROR AL ELIMINAR TICKET:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    login,
    register,
    deleteAccount,
    getAllUsers,
    deleteUserByAdmin,
    updateUser,
    createTicket,
    getTickets,
    updateTicketStatus,
    deleteTicket
};