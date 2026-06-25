const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// Route for Signup -> POST /api/auth/register
router.post('/register', registerUser);

// Route for Login -> POST /api/auth/login
router.post('/login', loginUser);

module.exports = router;