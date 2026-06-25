const { sql, poolPromise } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ==========================================
// 1. USER SIGNUP (REGISTER)
// ==========================================
const registerUser = async (req, res) => {
    const { fullName, email, password, role, phone, gender, dob, address } = req.body;

    if (!fullName || !email || !password || !role) {
        return res.status(400).json({ message: "Please fill all required fields (Name, Email, Password, Role)" });
    }

    try {
        const pool = await poolPromise; 
        
        const userExistCheck = await pool.request()
            .input('Email', sql.VarChar, email)
            .query('SELECT * FROM Users WHERE Email = @Email');

        if (userExistCheck.recordset.length > 0) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await pool.request()
            .input('FullName', sql.VarChar, fullName)
            .input('Email', sql.VarChar, email)
            .input('PasswordHash', sql.VarChar, hashedPassword)
            .input('Role', sql.VarChar, role)
            .input('Phone', sql.VarChar, phone || null)
            .input('Gender', sql.VarChar, gender || null)
            .input('DOB', sql.Date, dob || null)
            .input('Address', sql.VarChar, address || null)
            .query(`
                INSERT INTO Users (FullName, Email, PasswordHash, Role, Phone, Gender, DOB, Address)
                VALUES (@FullName, @Email, @PasswordHash, @Role, @Phone, @Gender, @DOB, @Address)
            `);

        res.status(201).json({ message: "User registered successfully!" });

    } catch (err) {
        console.error("Signup Error:", err.message);
        res.status(500).json({ message: "Server Error during registration", error: err.message });
    }
};

// ==========================================
// 2. USER LOGIN
// ==========================================
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Please enter email and password" });
    }

    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input('Email', sql.VarChar, email)
            .query('SELECT * FROM Users WHERE Email = @Email');

        if (result.recordset.length === 0) {
            return res.status(400).json({ message: "Invalid Email or Password" });
        }

        const user = result.recordset[0];

        const isMatch = await bcrypt.compare(password, user.PasswordHash);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Email or Password" });
        }

        // Token generation (UserID shamil hai)
        const token = jwt.sign(
            { userID: user.UserID, role: user.Role },
            process.env.JWT_SECRET || 'my_super_secret_key_123',
            { expiresIn: '1d' }
        );

        // ✅ Frontend ko wahi ID bhej rahe hain jo database mein hai
        res.status(200).json({
            message: "Login successful!",
            token,
            user: {
                userID: user.UserID,      // ID yahan se jayegi
                fullName: user.FullName,
                email: user.Email,
                role: user.Role
            }
        });

    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).json({ message: "Server Error during login", error: err.message });
    }
};

module.exports = { registerUser, loginUser };