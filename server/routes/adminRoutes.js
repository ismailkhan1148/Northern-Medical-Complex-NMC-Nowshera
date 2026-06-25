const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const {
  listDoctorsForAdmin,
  createDoctorForAdmin,
  deleteDoctorForAdmin,
  getDoctorAppointments
} = require('../controllers/doctorController');

router.get('/stats', async (req, res) => {
  try {
    const pool = await poolPromise;

    // Queries update ki gayi hain column names ke mutabiq
    const doctorsCount = await pool.request().query("SELECT COUNT(*) as total FROM users WHERE role = 'Doctor'");
    const patientsCount = await pool.request().query("SELECT COUNT(*) as total FROM users WHERE role = 'Patient'");
    
    // Yahan 'AppointmentDate' use kiya gaya hai (bina underscore ke)
    const appointmentsCount = await pool.request().query(
      "SELECT COUNT(*) as total FROM appointments WHERE CAST(AppointmentDate AS DATE) = CAST(GETDATE() AS DATE)"
    );

    res.json({
      totalDoctors: doctorsCount.recordset[0].total,
      registeredPatients: patientsCount.recordset[0].total,
      todayAppointments: appointmentsCount.recordset[0].total
    });
  } catch (error) {
    console.error("Database Query Error:", error);
    res.status(500).json({ message: "Server error fetching stats" });
  }
});

// Admin: list/search doctors
router.get('/doctors', async (req, res) => {
  return listDoctorsForAdmin(req, res);
});

// Admin: create new doctor (user + doctor)
router.post('/doctors', async (req, res) => {
  return createDoctorForAdmin(req, res);
});

// Admin: get appointments for a specific doctor
router.get('/doctors/:doctorID/appointments', async (req, res) => {
  return getDoctorAppointments(req, res);
});

// Admin: delete doctor
router.delete('/doctors/:doctorID', async (req, res) => {
  return deleteDoctorForAdmin(req, res);
});

module.exports = router;