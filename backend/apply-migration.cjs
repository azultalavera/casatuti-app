const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigration() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    const sqlPath = path.join(__dirname, '../supabase/migrations/20260722200000_create_extras_config.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Running migration...');
    await client.query(sql);
    console.log('Migration applied successfully.');
    
    client.release();
  } catch (error) {
    console.error('Error applying migration:', error);
  } finally {
    pool.end();
  }
}

runMigration();
