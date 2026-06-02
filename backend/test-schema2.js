import db from './db.js';
async function run() {
  const { rows } = await db.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 't_parametros_negocio'`);
  console.log(rows);
  process.exit(0);
}
run();
