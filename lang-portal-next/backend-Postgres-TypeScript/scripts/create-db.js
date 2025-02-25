const { Client } = require('pg');
require('dotenv').config();

// Database configuration
const config = {
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  // Connect to default postgres database initially
  database: 'postgres'
};

const dbName = process.env.POSTGRES_DB || 'langportal';

async function createDatabase() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('Connected to PostgreSQL server');
    
    // Check if the database exists
    const checkResult = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = $1
    `, [dbName]);
    
    if (checkResult.rows.length === 0) {
      // Database doesn't exist, so create it
      console.log(`Creating database "${dbName}"...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database "${dbName}" created successfully`);
    } else {
      console.log(`Database "${dbName}" already exists`);
    }
  } catch (error) {
    console.error('Error creating database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();
