const express = require('express');
const cors = require('cors');
require('dotenv').config();

// 1. SABSE PEHLE 'app' ko define karein
const app = express(); 

// 2. PHIR 'app' par middlewares (cors, json) lagayein
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());

// 3. BAQI CHEEZEIN (Routes, Database connection, Listen)
const { poolPromise } = require('./config/db.js');
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const adminRoutes = require('./routes/adminRoutes');

poolPromise; // Database connection

app.use('/api/auth', authRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('Hospital Management System API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});