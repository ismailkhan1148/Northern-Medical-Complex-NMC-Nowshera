const express = require('express');
const router = express.Router();

// 1. Controller se saare functions ko import kar rahe hain
const {
    getAllDoctors,
    addDoctorDetails,
    getDoctorAppointments,
    updateAppointmentStatus,
    createAppointment,
    getPatientHistory,
    getDoctorProfile
} = require('../controllers/doctorController.js');

// 2. Purane chalte hue routes (Inko nahi cherna)
router.get('/', getAllDoctors);
router.post('/add', addDoctorDetails);
router.get('/appointments/:doctorID', getDoctorAppointments);

// 3. NAYA ROUTE: Jab frontend '/api/doctor/profile/8' hit karega, toh yeh chalega
router.get('/profile/:doctorID', getDoctorProfile);
router.post('/appointments', createAppointment);
router.put('/update-status/:appointmentID', updateAppointmentStatus);
router.get('/patient-history/:patientID', getPatientHistory);

module.exports = router;
