const { Client } = require('pg');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);
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

/**
 * Executes a shell command asynchronously.
 *
 * This function logs the command, executes it, and outputs any returned standard output or errors.
 * It returns a promise that resolves to true if the command runs successfully, or false if an error occurs.
 *
 * @param {string} command - The shell command to execute.
 * @returns {Promise<boolean>} A promise resolving to true if execution is successful, or false otherwise.
 */
async function runCommand(command) {
  try {
    console.log(`Running: ${command}`);
    const { stdout, stderr } = await execPromise(command);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    return true;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error);
    return false;
  }
}

/**
 * Sets up the PostgreSQL database by ensuring the target database exists and, if necessary, creating it, 
 * then applying Prisma migrations, generating the Prisma client, and seeding the database with initial data.
 *
 * The function connects to the PostgreSQL server using a predefined configuration, checks for the existence 
 * of the specified database, and creates it if it does not exist. It sequentially runs shell commands to deploy 
 * migrations, generate the Prisma client, and seed the database. If any of these steps fail, an error is thrown 
 * and the process exits with a non-zero status.
 *
 * @returns {Promise<void>}
 *
 * @throws {Error} If applying migrations, generating the Prisma client, or seeding the database fails.
 */
async function setupDatabase() {
  const client = new Client(config);
  
  try {
    // 1. Check if PostgreSQL is running
    console.log('Checking PostgreSQL connection...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL server');
    
    // 2. Check if the database exists
    const checkResult = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = $1
    `, [dbName]);
    
    if (checkResult.rows.length === 0) {
      // Database doesn't exist, so create it
      console.log(`Creating database "${dbName}"...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database "${dbName}" created successfully`);
    } else {
      console.log(`✅ Database "${dbName}" already exists`);
    }
    
    // 3. Run Prisma migrations
    console.log('Running Prisma migrations...');
    const migrateSuccess = await runCommand('npx prisma migrate deploy');
    if (migrateSuccess) {
      console.log('✅ Migrations applied successfully');
    } else {
      throw new Error('Failed to apply migrations');
    }
    
    // 4. Generate Prisma client
    console.log('Generating Prisma client...');
    const generateSuccess = await runCommand('npx prisma generate');
    if (generateSuccess) {
      console.log('✅ Prisma client generated successfully');
    } else {
      throw new Error('Failed to generate Prisma client');
    }
    
    // 5. Run seed script
    console.log('Seeding database...');
    const seedSuccess = await runCommand('npx prisma db seed');
    if (seedSuccess) {
      console.log('✅ Database seeded successfully');
    } else {
      throw new Error('Failed to seed database');
    }
    
    console.log('✅ Database setup completed successfully');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();
