const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:admin@localhost:5432/casatutidb'
});

async function run() {
  await client.connect();
  
  // Encontrar usuario
  const userRes = await client.query("SELECT id_usuarios FROM public.t_usuarios WHERE email = 'azultalavra@gmail.com'");
  if (userRes.rows.length === 0) return;
  const userId = userRes.rows[0].id_usuarios;

  // 1. Limpiar historial y notificaciones
  await client.query("DELETE FROM public.t_notificaciones WHERE id_usuarios = $1", [userId]);
  await client.query("DELETE FROM public.t_historial_creditos WHERE id_usuarios = $1", [userId]);
  
  // 2. Setear saldo a 4
  await client.query("UPDATE public.t_cuenta_alumno SET saldo_actual = 4 WHERE id_usuarios = $1", [userId]);

  const payments = await client.query("SELECT bl_notificado_venc FROM public.t_historial_creditos WHERE id_usuarios = $1", [userId]);
  const notifs = await client.query("SELECT titulo, mensaje FROM public.t_notificaciones WHERE id_usuarios = $1", [userId]);
  
  console.log("Notificado vencimiento flag:", payments.rows[0].bl_notificado_venc);
  console.log("Notificaciones:", notifs.rows);
  
  await client.end();
}

run().catch(console.error);
