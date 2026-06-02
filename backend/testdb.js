import db from './db.js';

async function run() {
  try {
    await db.query(`ALTER TABLE public.t_historial_creditos ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'PAID';`);
    await db.query(`ALTER TABLE public.t_historial_creditos ADD COLUMN IF NOT EXISTS monto INTEGER DEFAULT 0;`);
    console.log("Columnas agregadas.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

run();
