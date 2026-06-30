import db from './db.js';

async function run() {
  try {
    const res = await db.query('SELECT column_name FROM information_schema.columns WHERE table_name = \'t_notificaciones\'');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
