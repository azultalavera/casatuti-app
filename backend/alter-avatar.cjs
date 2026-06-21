const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const viewDef = `
  SELECT id_usuarios AS id_usuario,
    nro_documento::character varying AS nro_documento,
    clave,
    email,
    google_id,
    avatar_url,
    nombre,
    apellido,
    telefono::character varying AS telefono,
    instagram,
    fecha_nacimiento,
    rol,
    bl_cambio_pass_pte,
    created_at,
    sucursal,
    true AS active
   FROM t_usuarios;
`;

async function alterDB() {
  try {
    await pool.query('DROP VIEW IF EXISTS usuarios;');
    await pool.query('ALTER TABLE t_usuarios ALTER COLUMN avatar_url TYPE TEXT;');
    await pool.query(`CREATE OR REPLACE VIEW usuarios AS ${viewDef}`);
    console.log('Database updated successfully.');
  } catch (error) {
    console.error('Error updating DB:', error);
  } finally {
    await pool.end();
  }
}

alterDB();
