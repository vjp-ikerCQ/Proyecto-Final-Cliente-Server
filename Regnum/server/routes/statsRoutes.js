const express = require('express');
const router = express.Router();
const { getUserStats } = require('../controllers/statsController');

// Ruta para obtener estadísticas: GET /api/stats/:username
router.get('/stats/:username', getUserStats);

module.exports = router;
