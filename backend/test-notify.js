import fetch from 'node-fetch';
import db from './db.js';

async function run() {
  try {
    await db.query(`INSERT INTO public.t_notificaciones (titulo, mensaje, tipo, leido, created_at) 
       VALUES ('TEST', 'Recordatorio', 'TRANSFER_REMINDER', false, NOW())`);
    console.log("Notificación manual insertada");
  } catch (err) {
    console.error("Error manual:", err);
  } finally {
    process.exit(0);
  }
}
run();
