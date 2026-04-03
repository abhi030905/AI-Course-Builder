const mysql = require('mysql2/promise');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ...(isProduction && {
        ssl: { rejectUnauthorized: true }
    })
});

pool.getConnection()
    .then(conn => { console.log('Database connected'); conn.release(); })
    .catch(err => { console.error('Database connection failed:', err.message); process.exit(1); });

module.exports = pool;