require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.t_suscripciones_push (
          id SERIAL PRIMARY KEY,
          id_usuarios INTEGER REFERENCES public.t_usuarios(id_usuarios) ON DELETE CASCADE,
          subscription JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Tabla t_suscripciones_push creada exitosamente.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
