const sql = require('mssql');

const dbConfig = {
    user: 'sa', // 🟢 Direct fixed username
    password: 'Ismail@123', // 🟢 Jo password aapne SSMS may set kiya hay (Agar koi aur hay toh yahan badal dein)
    server: '127.0.0.1', 
    database: 'HospitalManagementDB',
    options: {
        encrypt: false, 
        trustServerCertificate: true,
        enableArithAbort: true
    },
    port: 1433
};

// Singleton connection instance
let poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log("✔ SQL Server Database Connected Successfully...");
        return pool;
    })
    .catch(err => {
        console.error("❌ Database Connection Failed: ", err.message);
        process.exit(1);
    });

module.exports = {
    sql,
    poolPromise
};