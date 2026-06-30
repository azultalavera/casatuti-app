import db from './db.js';

async function run() {
  try {
    const res = await db.query(`SELECT * FROM t_clases_def`);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
