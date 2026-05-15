const express = require('express');
const router = express.Router();
const { getCards } = require('../controllers/cardsController');

// Ruta para obtener la galería de cartas: GET /api/cards
// Soporta queries como /api/cards?palo=oros&numero=4
router.get('/cards', getCards);

module.exports = router;
