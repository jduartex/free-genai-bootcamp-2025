const { Client } = require('pg');
require('dotenv').config();

// Database configuration
const config = {
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: 'postgres' // Connect to default postgres database
};

async function listDatabases() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('Connected to PostgreSQL server');
    
    // Query to list all databases
    const result = await client.query(`
      SELECT datname AS database_name, 
             pg_size_pretty(pg_database_size(datname)) AS size,
             datistemplate AS is_template,
             datallowconn AS allows_connections
      FROM pg_database
      ORDER BY datname;
    `);
    
    console.log('\nAvailable databases:');
    console.log('===========================================');
    console.log('| Database Name     | Size      | Template |');
    console.log('===========================================');
    
    result.rows.forEach(row => {
      console.log(`| ${row.database_name.padEnd(17)} | ${row.size.padEnd(9)} | ${row.is_template ? 'Yes' : 'No '.padEnd(3)} |`);
    });
    
    console.log('===========================================');
    console.log(`Total: ${result.rowCount} databases\n`);
    
  } catch (error) {
    console.error('Error listing databases:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

listDatabases();
