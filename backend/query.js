import db from './db.js';

async function checkSchema() {
  try {
    const res = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 't_clases_instancia';
    `);
    console.log("t_clases_instancia columns:", res.rows);

  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
checkSchema();
