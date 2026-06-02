import db from './db.js';

async function setup() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.t_paquetes_creditos (
        id_paquete SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        cantidad_creditos INTEGER NOT NULL,
        precio INTEGER NOT NULL,
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Check if empty
    const res = await db.query('SELECT COUNT(*) FROM public.t_paquetes_creditos');
    if (parseInt(res.rows[0].count) === 0) {
      await db.query(`
        INSERT INTO public.t_paquetes_creditos (nombre, cantidad_creditos, precio) VALUES
        ('Pack 2 clases', 2, 4000),
        ('Pack 4 clases', 4, 8000),
        ('Pack 6 clases', 6, 12000),
        ('Pack 8 clases', 8, 16000)
      `);
      console.log('Paquetes por defecto insertados.');
    } else {
      console.log('La tabla ya contenia paquetes.');
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    process.exit(0);
  }
}
setup();
