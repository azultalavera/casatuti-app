import db from './db.js';
async function run() {
  const { rows } = await db.query(`SELECT * FROM public.t_cuenta_alumno LIMIT 5`);
  console.log(rows);
  process.exit(0);
}
run();
