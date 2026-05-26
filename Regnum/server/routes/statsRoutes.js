const express = require('express');
const router = express.Router();
const { getUserStats, getLeaderboard, updateStats } = require('../controllers/statsController');

// Ruta para obtener el ranking: GET /api/leaderboard
router.get('/leaderboard', getLeaderboard);

// Ruta para obtener estadísticas: GET /api/stats/:username
router.get('/stats/:username', getUserStats);

// Ruta para actualizar estadísticas al final de partida: POST /api/stats/update
router.post('/stats/update', updateStats);

module.exports = router;
