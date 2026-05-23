const express = require('express');

const router = express.Router();

const { login, register, deleteAccount, getAllUsers, deleteUserByAdmin, updateUser, createTicket, getTickets, updateTicketStatus, deleteTicket } = require('../controllers/authController');

router.post('/login', login);
router.post('/register', register);
router.delete('/delete-account', deleteAccount);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUserByAdmin);
router.put('/users/:id', updateUser);
router.post('/tickets', createTicket);
router.get('/tickets', getTickets);
router.put('/tickets/:id', updateTicketStatus);
router.delete('/tickets/:id', deleteTicket);

module.exports = router;