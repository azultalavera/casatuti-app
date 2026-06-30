import db from './db.js';
async function check() {
  try {
    const r = await db.query("SELECT DISTINCT rol FROM public.t_usuarios");
    console.log('Roles in DB:', r.rows);
    process.exit(0);
  } catch(e) {
    console.error('Error:', e);
    process.exit(1);
  }
}
check();
