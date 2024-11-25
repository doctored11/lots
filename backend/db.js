require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'https://snullprojects.ru',
    database: 'node_slots',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});


pool.on('connect', () => {
    console.log('Успешное подключение к базе данных');
});


pool.on('error', (err) => {
    console.error('Ошибка подключения к базе данных:', err.message);
    process.exit(-1);
});

module.exports = pool; 
