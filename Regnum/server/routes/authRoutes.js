const express = require('express');

const router = express.Router();

const { login, register, deleteAccount } = require('../controllers/authController');

router.post('/login', login);
router.post('/register', register);
router.delete('/delete-account', deleteAccount);

module.exports = router;