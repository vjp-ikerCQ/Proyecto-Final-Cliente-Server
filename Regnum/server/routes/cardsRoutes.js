const express = require('express');
const router = express.Router();
const { getCards, getShuffledDeck, updateCard } = require('../controllers/cardsController');

// Ruta para obtener la galería de cartas: GET /api/cards
// Soporta queries como /api/cards?palo=oros&numero=4
router.get('/cards', getCards);

// Ruta para obtener un mazo barajado al azar para el juego: GET /api/cards/deck
router.get('/cards/deck', getShuffledDeck);

// Ruta para actualizar una carta: PUT /api/cards/:id
router.put('/cards/:id', updateCard);

module.exports = router;
