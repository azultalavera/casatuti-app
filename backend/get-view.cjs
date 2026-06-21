const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT pg_get_viewdef('usuarios', true);")
  .then((res) => console.log('View definition:\n', res.rows[0].pg_get_viewdef))
  .catch(console.error)
  .finally(() => pool.end());
