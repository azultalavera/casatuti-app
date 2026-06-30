import db from './db.js';

const toSentenceCase = (str) => {
  if (!str) return null;
  const trimmed = str.trim().toLowerCase();
  if (trimmed.length === 0) return null;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

async function applySentenceCase() {
  try {
    await db.query('BEGIN');

    // 1. Usuarios: nombre y apellido
    const usersRes = await db.query('SELECT id_usuarios, nombre, apellido FROM public.t_usuarios');
    for (const u of usersRes.rows) {
      const newNombre = toSentenceCase(u.nombre);
      const newApellido = toSentenceCase(u.apellido);
      await db.query(
        'UPDATE public.t_usuarios SET nombre = $1, apellido = $2 WHERE id_usuarios = $3',
        [newNombre, newApellido, u.id_usuarios]
      );
    }

    // 2. Sucursales: nombre
    const branchesRes = await db.query('SELECT id_sucursal, n_sucursal FROM public.t_sucursales');
    for (const b of branchesRes.rows) {
      if (b.n_sucursal) {
        const newName = toSentenceCase(b.n_sucursal);
        await db.query(
          'UPDATE public.t_sucursales SET n_sucursal = $1 WHERE id_sucursal = $2',
          [newName, b.id_sucursal]
        );
      }
    }

    await db.query('COMMIT');
    console.log('Todos los nombres propios han sido formateados a sentence case.');
    process.exit(0);
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Error aplicando sentence case:', err);
    process.exit(1);
  }
}

applySentenceCase();
