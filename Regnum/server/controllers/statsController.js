const { getDB } = require('../config/db');

const getUserStats = async (req, res) => {
    try {
        const { username } = req.params;

        const db = getDB();
        if (!db) {
            console.error('Database not connected');
            return res.status(503).json({
                success: false,
                message: 'El servidor no está conectado a la base de datos'
            });
        }

        const usuario = await db.collection('usuarios').findOne({ nombre: username });

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Obtener estadísticas o valores por defecto
        const stats = usuario.estadisticas || {
            partidasJugadas: 0,
            partidasGanadas: 0,
            partidasPerdidas: 0,
            tiempoJugado: 0
        };

        // Calcular porcentaje de victoria (Win Rate)
        let winRate = '0%';
        if (stats.partidasJugadas > 0) {
            const rate = Math.round((stats.partidasGanadas / stats.partidasJugadas) * 100);
            winRate = `${rate}%`;
        }

        // Formatear el tiempo jugado (asumiendo que viene en minutos de la base de datos)
        // Ejemplo: 765 minutos = 12h 45m
        const horas = Math.floor(stats.tiempoJugado / 60);
        const minutos = stats.tiempoJugado % 60;
        const playTime = `${horas}h ${minutos}m`;

        return res.json({
            success: true,
            stats: {
                gamesPlayed: stats.partidasJugadas,
                gamesWon: stats.partidasGanadas,
                gamesLost: stats.partidasPerdidas,
                winRate: winRate,
                playTime: playTime
            }
        });

    } catch (error) {
        console.error("💥 ERROR EN GET STATS:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const getLeaderboard = async (req, res) => {
    try {
        const db = getDB();
        if (!db) {
            console.error('Database not connected');
            return res.status(503).json({
                success: false,
                message: 'El servidor no está conectado a la base de datos'
            });
        }

        // Obtener usuarios ordenados por partidas ganadas
        // Solo proyectamos nombre y estadísticas por seguridad (no enviar emails ni contraseñas)
        const leaderboard = await db.collection('usuarios')
            .find({
                estadisticas: { $exists: true }
            }, {
                projection: {
                    nombre: 1,
                    estadisticas: 1,
                    _id: 0
                }
            })
            .sort({ "estadisticas.partidasGanadas": -1 })
            .limit(10) // Limitamos a los 10 mejores
            .toArray();

        return res.json({
            success: true,
            leaderboard
        });

    } catch (error) {
        console.error("💥 ERROR EN GET LEADERBOARD:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const updateStats = async (req, res) => {
    try {
        const { username, result } = req.body; // result: 'win' | 'lose'
        if (!username || !result) {
            return res.status(400).json({ success: false, message: 'Faltan parámetros' });
        }

        const db = getDB();
        if (!db) return res.status(503).json({ success: false, message: 'Sin conexión a la base de datos' });

        const inc = { 'estadisticas.partidasJugadas': 1 };
        if (result === 'win')  inc['estadisticas.partidasGanadas'] = 1;
        if (result === 'lose') inc['estadisticas.partidasPerdidas'] = 1;

        await db.collection('usuarios').updateOne(
            { nombre: username },
            { $inc: inc }
        );

        return res.json({ success: true });
    } catch (error) {
        console.error('💥 ERROR EN UPDATE STATS:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getUserStats,
    getLeaderboard,
    updateStats
};
