const express = require('express');
const router = express.Router();
const { getUserStats, getLeaderboard } = require('../controllers/statsController');

// Ruta para obtener el ranking: GET /api/leaderboard
router.get('/leaderboard', getLeaderboard);

// Ruta para obtener estadísticas: GET /api/stats/:username
router.get('/stats/:username', getUserStats);

module.exports = router;
