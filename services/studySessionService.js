const { Pool } = require('pg');

// Configure the PostgreSQL connection to use Docker PostgreSQL database
const pool = new Pool({
    user: process.env.DB_USER || 'your_db_user',
    host: process.env.DB_HOST || 'localhost', // or the name of the Docker service if using Docker Compose
    database: process.env.DB_NAME || 'progres',
    password: process.env.DB_PASSWORD || 'your_db_password',
    port: process.env.DB_PORT || 5432, // or the port exposed by the Docker container
});

// Log connection details
pool.on('connect', () => {
    console.log('Connected to the PostgreSQL database');
});

async function getLastStudySession() {
    console.log('getLastStudySession called');
    try {
        const result = await pool.query('SELECT * FROM study_sessions ORDER BY date DESC LIMIT 1');
        console.log('Query result:', result.rows);
        return result.rows[0];
    } catch (error) {
        console.error('Error querying the database:', error);
        throw error;
    }
}

async function getAllStudySessions() {
    console.log('getAllStudySessions called');
    try {
        const result = await pool.query('SELECT * FROM study_sessions ORDER BY date DESC');
        console.log('Query result:', result.rows);
        return result.rows;
    } catch (error) {
        console.error('Error querying the database:', error);
        throw error;
    }
}

async function createStudySession(sessionData) {
    const { topic, duration, date } = sessionData;
    console.log('createStudySession called with data:', sessionData);
    try {
        const result = await pool.query(
            'INSERT INTO study_sessions (topic, duration, date) VALUES ($1, $2, $3) RETURNING *',
            [topic, duration, date]
        );
        console.log('Insert result:', result.rows);
        return result.rows[0];
    } catch (error) {
        console.error('Error inserting into the database:', error);
        throw error;
    }
}

module.exports = { getLastStudySession, getAllStudySessions, createStudySession };
