const sql = require('mssql');
const { poolPromise } = require('../config/db.js'); 

// 1. Get All Doctors
const getAllDoctors = async (req, res) => {
    try {
        const pool = await poolPromise; 
        const result = await pool.request().query(`
            SELECT d.DoctorID, u.FullName, u.Email, u.Phone, d.Specialization, d.Qualification, d.ExperienceYears, d.ConsultationFee, d.AvailabilityStatus, d.AvailableHours 
            FROM Doctors d
            JOIN Users u ON d.DoctorID = u.UserID
        `);
        res.status(200).json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: "Error fetching doctors", error: err.message });
    }
};

// 2. Add Doctor Details
const addDoctorDetails = async (req, res) => {
    const { doctorID, userID, specialization, qualification, experienceYears, consultationFee, availabilityStatus, availableHours } = req.body;

    if (!doctorID || !userID || !specialization || !qualification || !consultationFee) {
        return res.status(400).json({ message: "Required fields are missing!" });
    }

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('DoctorID', sql.Int, doctorID)
            .input('UserID', sql.Int, userID)
            .input('Specialization', sql.VarChar, specialization)
            .input('Qualification', sql.VarChar, qualification)
            .input('ExperienceYears', sql.Int, experienceYears)
            .input('ConsultationFee', sql.Decimal(10, 2), consultationFee)
            .input('AvailabilityStatus', sql.VarChar, availabilityStatus || 'Available')
            .input('AvailableHours', sql.VarChar, availableHours)
            .query(`
                INSERT INTO Doctors (DoctorID, UserID, Specialization, Qualification, ExperienceYears, ConsultationFee, AvailabilityStatus, AvailableHours)
                VALUES (@DoctorID, @UserID, @Specialization, @Qualification, @ExperienceYears, @ConsultationFee, @AvailabilityStatus, @AvailableHours)
            `);

        res.status(201).json({ message: "Doctor professional details added successfully!" });
    } catch (err) {
        res.status(500).json({ message: "Database error", error: err.message });
    }
};

// 3. Get Specific Doctor's Appointments
const getDoctorAppointments = async (req, res) => {
    try {
        const { doctorID } = req.params;
        const pool = await poolPromise; 
        const result = await pool.request()
            .input('DoctorID', sql.Int, doctorID)
            .query(`
                SELECT a.AppointmentID, a.PatientID, a.AppointmentDate, a.AppointmentTime, a.Status, a.Reason, u.FullName AS PatientName
                FROM Appointments a
                JOIN Users u ON a.PatientID = u.UserID
                LEFT JOIN Doctors d ON a.DoctorID = d.DoctorID
                WHERE a.DoctorID = @DoctorID OR d.UserID = @DoctorID
                ORDER BY a.AppointmentDate DESC, a.AppointmentTime DESC
            `);
        res.status(200).json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: "Error fetching doctor appointments", error: err.message });
    }
};

// 4. Update Appointment Status
const updateAppointmentStatus = async (req, res) => {
    try {
        const { appointmentID } = req.params;
        const requestedStatus = req.body?.status;
        const statusMap = {
            Approved: 'Confirmed',
            Accepted: 'Confirmed',
            Confirmed: 'Confirmed',
            Pending: 'Pending',
            Cancelled: 'Cancelled',
            Completed: 'Completed'
        };
        const status = statusMap[requestedStatus];

        if (!status) {
            return res.status(400).json({ message: "Invalid appointment status" });
        }

        const pool = await poolPromise;
        
        const result = await pool.request()
            .input('Status', sql.VarChar, status)
            .input('AppointmentID', sql.Int, appointmentID)
            .query(`UPDATE Appointments SET Status = @Status WHERE AppointmentID = @AppointmentID`);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Appointment not found" });
        }
        
        res.status(200).json({ message: "Status updated successfully" });
    } catch (err) {
        console.error("Status update error:", err.message);
        res.status(500).json({ message: "Error updating status", error: err.message });
    }
};

// 5. Create Patient Appointment
const createAppointment = async (req, res) => {
    const { patientID, doctorID, appointmentDate, appointmentTime, reason } = req.body;

    if (!patientID || !doctorID || !appointmentDate || !appointmentTime) {
        return res.status(400).json({ message: "Patient, doctor, date and time are required" });
    }

    try {
        const pool = await poolPromise;

        const doctorExists = await pool.request()
            .input('DoctorID', sql.Int, doctorID)
            .query('SELECT DoctorID FROM Doctors WHERE DoctorID = @DoctorID');

        if (!doctorExists.recordset.length) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        const conflict = await pool.request()
            .input('DoctorID', sql.Int, doctorID)
            .input('AppointmentDate', sql.Date, appointmentDate)
            .input('AppointmentTime', sql.VarChar, appointmentTime)
            .query(`
                SELECT AppointmentID
                FROM Appointments
                WHERE DoctorID = @DoctorID
                  AND CAST(AppointmentDate AS DATE) = @AppointmentDate
                  AND CONVERT(VARCHAR(5), AppointmentTime, 108) = @AppointmentTime
                  AND Status <> 'Cancelled'
            `);

        if (conflict.recordset.length > 0) {
            return res.status(409).json({ message: "This time slot is already booked" });
        }

        const result = await pool.request()
            .input('PatientID', sql.Int, patientID)
            .input('DoctorID', sql.Int, doctorID)
            .input('AppointmentDate', sql.Date, appointmentDate)
            .input('AppointmentTime', sql.VarChar, appointmentTime)
            .input('Status', sql.VarChar, 'Pending')
            .input('Reason', sql.VarChar, reason || 'General Checkup')
            .query(`
                INSERT INTO Appointments (PatientID, DoctorID, AppointmentDate, AppointmentTime, Status, Reason)
                OUTPUT inserted.AppointmentID
                VALUES (@PatientID, @DoctorID, @AppointmentDate, @AppointmentTime, @Status, @Reason)
            `);

        res.status(201).json({
            message: "Appointment request submitted successfully",
            appointmentID: result.recordset[0].AppointmentID
        });
    } catch (err) {
        res.status(500).json({ message: "Error creating appointment", error: err.message });
    }
};

// 5. Get Patient Medical History
const getPatientHistory = async (req, res) => {
    try {
        const { patientID } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('PatientID', sql.Int, patientID)
            .query(`SELECT * FROM MedicalRecords WHERE PatientID = @PatientID ORDER BY Date DESC`);
        
        res.status(200).json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: "History fetch karne mein galti hui", error: err.message });
    }
};

// 6. Get Doctor Profile
const getDoctorProfile = async (req, res) => {
    try {
        const { doctorID } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('DoctorID', sql.Int, doctorID)
            .query(`
                SELECT u.FullName, d.Specialization, d.Qualification, d.ConsultationFee, d.AvailabilityStatus
                FROM Doctors d
                JOIN Users u ON d.DoctorID = u.UserID
                WHERE d.DoctorID = @DoctorID OR d.UserID = @DoctorID
            `);
        
        if (result.recordset.length > 0) {
            res.status(200).json(result.recordset[0]);
        } else {
            res.status(404).json({ message: "Doctor profile not found" });
        }
    } catch (err) {
        res.status(500).json({ message: "Error fetching doctor profile", error: err.message });
    }
};

// --- Admin helper functions ---
const bcrypt = require('bcryptjs');

// List doctors for admin, with optional search query and appointment counts
const listDoctorsForAdmin = async (req, res) => {
    try {
        const pool = await poolPromise;
        const q = req.query.q || '';
        
        let sql_query = `
            SELECT d.DoctorID, u.UserID, u.FullName, u.Email, d.Specialization, d.Qualification, d.ConsultationFee,
                   ISNULL((SELECT COUNT(*) FROM Appointments a WHERE a.DoctorID = d.DoctorID), 0) AS AppointmentCount
            FROM Doctors d
            JOIN Users u ON d.DoctorID = u.UserID
        `;

        const request = pool.request();
        
        if (q) {
            sql_query += ` WHERE u.FullName LIKE '%' + @q + '%' OR u.Email LIKE '%' + @q + '%'`;
            request.input('q', sql.VarChar, q);
        }
        
        sql_query += ` ORDER BY u.FullName`;

        const result = await request.query(sql_query);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('List doctors error:', err);
        res.status(500).json({ message: "Error fetching doctors for admin", error: err.message });
    }
};

// Create new doctor (user + doctor rows) — used by admin
const createDoctorForAdmin = async (req, res) => {
    const {
        fullName, email, password, phone, gender, dob, address,
        specialization, qualification, experienceYears, consultationFee, availabilityStatus, availableHours
    } = req.body;

    if (!fullName || !email || !password || !specialization || !qualification) {
        return res.status(400).json({ message: 'Missing required fields for creating doctor' });
    }

    // Basic coercion
    const expYears = parseInt(experienceYears, 10) || 0;
    const fee = parseFloat(consultationFee) || 0;

    let transaction;
    try {
        const pool = await poolPromise;
        // check if email already exists
        const existing = await pool.request().input('Email', sql.VarChar, email).query('SELECT UserID FROM Users WHERE Email = @Email');
        if (existing.recordset.length > 0) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        transaction = new sql.Transaction(pool);
        await transaction.begin();

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);

        // Insert into Users, output UserID
        const insertUser = await transaction.request()
            .input('FullName', sql.VarChar, fullName)
            .input('Email', sql.VarChar, email)
            .input('PasswordHash', sql.VarChar, hashed)
            .input('Role', sql.VarChar, 'Doctor')
            .input('Phone', sql.VarChar, phone || null)
            .input('Gender', sql.VarChar, gender || null)
            .input('DOB', sql.Date, dob || null)
            .input('Address', sql.VarChar, address || null)
            .query(`
                INSERT INTO Users (FullName, Email, PasswordHash, Role, Phone, Gender, DOB, Address)
                OUTPUT inserted.UserID
                VALUES (@FullName, @Email, @PasswordHash, @Role, @Phone, @Gender, @DOB, @Address)
            `);

        const newUserID = insertUser.recordset[0].UserID;

        // In this database, Doctors.DoctorID is a foreign key to Users.UserID.
        const insertDoc = await transaction.request()
            .input('DoctorID', sql.Int, newUserID)
            .input('UserID', sql.Int, newUserID)
            .input('Specialization', sql.VarChar, specialization)
            .input('Qualification', sql.VarChar, qualification)
            .input('ExperienceYears', sql.Int, expYears)
            .input('ConsultationFee', sql.Decimal(10,2), fee)
            .input('AvailabilityStatus', sql.VarChar, availabilityStatus || 'Available')
            .input('AvailableHours', sql.VarChar, availableHours || null)
            .query(`
                INSERT INTO Doctors (DoctorID, UserID, Specialization, Qualification, ExperienceYears, ConsultationFee, AvailabilityStatus, AvailableHours)
                OUTPUT inserted.DoctorID
                VALUES (@DoctorID, @UserID, @Specialization, @Qualification, @ExperienceYears, @ConsultationFee, @AvailabilityStatus, @AvailableHours)
            `);

        const newDoctorID = insertDoc.recordset[0].DoctorID;

        await transaction.commit();
        res.status(201).json({ message: 'Doctor created', doctorID: newDoctorID, userID: newUserID });
    } catch (err) {
        console.error('Create doctor error:', err);
        try { if (transaction) await transaction.rollback(); } catch (_) {}
        res.status(500).json({ message: 'Error creating doctor', error: err.message || String(err) });
    }
};

// Delete doctor (and associated user) — admin action
const deleteDoctorForAdmin = async (req, res) => {
    const { doctorID } = req.params;
    if (!doctorID) return res.status(400).json({ message: 'doctorID required' });

    let transaction;
    try {
        const pool = await poolPromise;
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        // find user id
        let request = transaction.request();
        const find = await request.input('DoctorID', sql.Int, doctorID)
            .query(`
                SELECT d.DoctorID, d.UserID AS LinkedUserID, u.Role AS DoctorUserRole
                FROM Doctors d
                JOIN Users u ON d.DoctorID = u.UserID
                WHERE d.DoctorID = @DoctorID
            `);

        if (!find.recordset.length) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Doctor not found' });
        }

        const doctorUserID = find.recordset[0].DoctorID;

        // delete records that depend on this doctor's appointments first
        request = transaction.request();
        await request.input('DoctorID', sql.Int, doctorID)
            .query(`
                DELETE b
                FROM Billings b
                JOIN Appointments a ON b.AppointmentID = a.AppointmentID
                WHERE a.DoctorID = @DoctorID
            `);

        request = transaction.request();
        await request.input('DoctorID', sql.Int, doctorID)
            .query(`
                DELETE mr
                FROM MedicalRecords mr
                WHERE mr.DoctorID = @DoctorID
                   OR mr.AppointmentID IN (
                        SELECT AppointmentID FROM Appointments WHERE DoctorID = @DoctorID
                   )
            `);

        // delete related appointments
        request = transaction.request();
        await request.input('DoctorID', sql.Int, doctorID)
            .query('DELETE FROM Appointments WHERE DoctorID = @DoctorID');

        // delete doctor
        request = transaction.request();
        await request.input('DoctorID', sql.Int, doctorID)
            .query('DELETE FROM Doctors WHERE DoctorID = @DoctorID');

        // delete the actual doctor user account. Doctors.DoctorID references Users.UserID.
        request = transaction.request();
        await request.input('UserID', sql.Int, doctorUserID)
            .query('DELETE FROM Users WHERE UserID = @UserID');

        await transaction.commit();
        res.status(200).json({ message: 'Doctor and user deleted' });
    } catch (err) {
        console.error('Delete doctor error:', err);
        try { if (transaction) await transaction.rollback(); } catch (e) { /* ignore */ }
        res.status(500).json({ message: 'Error deleting doctor', error: err.message });
    }
};

// SAB KO EXPORT KARNA ZAROORI HAI
module.exports = { 
    getAllDoctors, 
    addDoctorDetails, 
    getDoctorAppointments,
    updateAppointmentStatus,
    createAppointment,
    getPatientHistory,
    getDoctorProfile,
    listDoctorsForAdmin,
    createDoctorForAdmin,
    deleteDoctorForAdmin
};
