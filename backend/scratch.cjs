const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:admin@localhost:5432/casatutidb'
});

async function run() {
  await client.connect();
  
  try {
    await client.query("ALTER TABLE public.t_historial_creditos ADD COLUMN bl_notificado_venc boolean DEFAULT false");
    console.log("Columna agregada exitosamente.");
  } catch (e) {
    console.error("Error o la columna ya existe:", e.message);
  }

  await client.end();
}

run().catch(console.error);
