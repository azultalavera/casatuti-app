const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'casatuti',
  password: 'admin',
  port: 5432,
});

async function run() {
  const res = await pool.query(`
    SELECT * FROM t_clases 
    WHERE sucursal ILIKE 'Centro' AND dia ILIKE 'Mi%rcoles'
  `);
  console.log(res.rows);
  pool.end();
}
run().catch(console.error);
