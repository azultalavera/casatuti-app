import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Configuración de conexión flexible:
// 1. Si DATABASE_URL está definida (Supabase / Neon), usar esa URL directa.
// 2. Si no, usar los parámetros individuales.
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
    }
  : {
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'admin',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_DATABASE || 'casatuti',
      ssl: false
    };

const pool = new Pool(poolConfig);

// Validar conexión exitosa al iniciar
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error al conectar con la base de datos PostgreSQL:', err.stack);
  } else {
    console.log('🔌 Conexión exitosa a la base de datos PostgreSQL.');
    release();
  }
});

export default {
  query: (text, params) => pool.query(text, params),
  pool
};
