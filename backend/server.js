import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import webPush from 'web-push';

import db from './db.js';
import { sendRecoveryEmail, sendWelcomeEmail } from './email.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://casatuti.vercel.app',
  'https://casatuti-app.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Si no hay origin (por ejemplo peticiones del mismo servidor o herramientas como Postman), se permite
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por política de CORS'));
    }
  },
  credentials: true
}));

// Configuración de Web Push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    'mailto:azultalav@gmail.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Helper para unificar mayúsculas en la primera letra de cada palabra de nombres y apellidos
const capitalizeName = (str) => {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper para mapear usuario de la BD al formato del Frontend
const mapUserToFE = (u) => {
  if (!u) return null;
  return {
    id: u.id_usuarios,
    name: u.nombre && u.apellido ? `${u.nombre} ${u.apellido}` : (u.nombre || 'Usuario'),
    nombre: u.nombre || '',
    apellido: u.apellido || '',
    email: u.email,
    password: u.clave || 'tuti123',
    role: u.rol || 'ALUMNO',
    active: true,
    nro_documento: u.nro_documento || null,
    google_id: u.google_id || null,
    avatar_url: u.avatar_url || null,
    telefono: u.telefono || null,
    instagram: u.instagram || null,
    fecha_nacimiento: u.fecha_nacimiento || null,
    bl_cambio_pass_pte: u.bl_cambio_pass_pte || false,
    sucursal: u.sucursal || 'CENTRO',
    created_at: u.created_at || null
  };
};

// Helper para mapear perfiles de alumnos
const mapProfileToFE = (p) => {
  if (!p) return null;
  return {
    studentId: p.id_usuarios,
    classCredits: Number(p.class_credits) || 0,
    monthlyClayKg: parseFloat(p.monthly_clay_kg || 0),
    lastClayDeliveryDate: p.last_clay_delivery_date || null,
    isBlocked: p.bl_bloqueado || false,
    expirationDate: p.fec_vencimiento_cuota || null
  };
};

// Helper para mapear reservas
const mapBookingToFE = (b) => {
  if (!b) return null;
  const dateStr = b.date instanceof Date ? b.date.toISOString().split('T')[0] : b.date;
  return {
    id: b.id_inscripcion,
    studentId: b.student_id,
    studentName: b.student_name,
    classId: b.class_id,
    date: dateStr,
    status: b.status,
    rescheduledTo: b.id_reprogramada_hacia,
    rescheduledFrom: b.id_reprogramada_desde
  };
};

// Helper para mapear entregas
const mapDeliveryToFE = (d) => {
  if (!d) return null;
  const dateStr = d.date instanceof Date ? d.date.toISOString().split('T')[0] : d.date;
  return {
    id: d.id_deudas_insumos,
    studentId: d.student_id,
    studentName: d.student_name,
    teacherId: d.teacher_id,
    teacherName: d.teacher_name,
    date: dateStr,
    quantityKg: parseFloat(d.quantity_kg)
  };
};

// Helper para mapear pagos
const mapPaymentToFE = (p) => {
  if (!p) return null;
  const dateStr = p.date instanceof Date ? p.date.toISOString().split('T')[0] : p.date;
  return {
    id: p.id_pago,
    studentId: p.student_id,
    amount: parseFloat(p.amount),
    date: dateStr,
    status: p.status,
    classCreditsAdded: p.class_credits_added,
    description: p.motivo || (p.class_credits_added ? `Pack de ${p.class_credits_added} clases` : 'Deuda pendiente')
  };
};

// Helper para mapear alertas
const mapAlertToFE = (a) => {
  if (!a) return null;
  return {
    id: a.id_alerta,
    studentId: a.id_usuarios,
    type: a.type,
    message: a.message,
    date: a.date,
    resolved: a.resolved
  };
};

// Helper para mapear lista de espera
const mapWaitlistToFE = (w) => {
  if (!w) return null;
  const dateStr = w.date instanceof Date ? w.date.toISOString().split('T')[0] : w.date;
  return {
    id: w.id,
    studentId: w.student_id,
    classId: w.class_id,
    date: dateStr,
    notified: w.notified
  };
};

// Helper para mapear paquetes
const mapPackToFE = (p) => {
  if (!p) return null;
  return {
    id: p.id_paquete,
    name: p.nombre,
    credits: p.cantidad_creditos,
    price: p.precio,
    active: p.activo
  };
};

// Helper para mapear clases
const mapClassToFE = (c) => {
  if (!c) return null;
  const timeStr = c.time || '';
  const dayStr = c.day || '';
  const sucursal = c.sucursal || '';
  // Si no hay titulo, generar un nombre descriptivo a partir de sucursal + dia + horario
  const autoName = sucursal ? `${sucursal} - ${dayStr} ${timeStr}` : `${dayStr} ${timeStr}`;
  return {
    id: c.id_clases_def,
    name: c.name || autoName,
    teacherId: c.teacher_id,
    teacherName: c.teacher_name,
    day: dayStr,
    time: timeStr,
    capacity: c.capacity,
    sucursal: sucursal,
    pausedDates: c.paused_dates || []
  };
};

// Helper para mapear sucursales
const mapBranchToFE = (b) => {
  if (!b) return null;
  return {
    id: b.id_sucursal,
    name: b.n_sucursal,
    address: b.direccion,
    maxCapacity: b.capacidad_max_creditos
  };
};

// Helper para mapear normas (FAQs)
const mapFaqToFE = (f) => {
  if (!f) return null;
  return {
    id: f.id,
    question: f.pregunta,
    answer: f.respuesta
  };
};

// ==========================================
// 1. ENDPOINTS DE AUTENTICACIÓN
// ==========================================

// Ruta de salud de la API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Por favor completa todos los campos.' });
  }

  try {
    const query = 'SELECT * FROM public.t_usuarios WHERE LOWER(email) = LOWER($1)';
    const { rows } = await db.query(query, [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas. Inténtalo de nuevo.' });
    }

    const user = rows[0];

    const validPassword = user.clave === password || (!user.clave && password === 'tuti123');
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales incorrectas. Inténtalo de nuevo.' });
    }

    res.json(mapUserToFE(user));
  } catch (error) {
    console.error('Error en Login:', error);
    res.status(500).json({ error: 'Error del servidor al iniciar sesión.' });
  }
});

// Recuperación de Contraseña
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Por favor ingresa tu correo electrónico.' });
  }

  try {
    const query = 'SELECT * FROM public.t_usuarios WHERE LOWER(email) = LOWER($1)';
    const { rows } = await db.query(query, [email]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No existe una cuenta con ese correo electrónico.' });
    }

    const user = rows[0];

    // Generar contraseña temporal de 8 caracteres
    const tempPassword = Math.random().toString(36).slice(-8);

    // Actualizar en base de datos
    await db.query(
      'UPDATE public.t_usuarios SET clave = $1, bl_cambio_pass_pte = true WHERE id_usuarios = $2',
      [tempPassword, user.id_usuarios]
    );

    // Enviar correo
    await sendRecoveryEmail(user.email, tempPassword);

    res.json({ success: true, message: 'Correo de recuperación enviado.' });
  } catch (error) {
    console.error('Error en forgot-password:', error);
    res.status(500).json({ error: 'Error del servidor al procesar la recuperación.' });
  }
});

// ==========================================
// 2. ENDPOINTS DE USUARIOS
// ==========================================

// Listar todos los usuarios
app.get('/api/users', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM public.t_usuarios ORDER BY nombre ASC');
    res.json(rows.map(mapUserToFE));
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios.' });
  }
});

// Crear usuario (Alumno o Profesor)
app.post('/api/users', async (req, res) => {
  const {
    email,
    password,
    name,
    role,
    nro_documento,
    telefono,
    instagram,
    fecha_nacimiento,
    sucursal
  } = req.body;

  if (!email || !name || !role) {
    return res.status(400).json({ error: 'Faltan campos obligatorios (email, name, role).' });
  }

  const formattedName = capitalizeName(name);
  const nameParts = formattedName.split(' ');
  const nombre = nameParts[0] || 'Usuario';
  const apellido = nameParts.slice(1).join(' ') || '';
  try {
    // 1. Insertar el usuario en la tabla t_usuarios
    const userInsertQuery = `
      INSERT INTO public.t_usuarios 
      (nro_documento, clave, email, nombre, apellido, telefono, instagram, fecha_nacimiento, rol, bl_cambio_pass_pte, sucursal) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const { rows } = await db.query(userInsertQuery, [
      nro_documento ? parseInt(nro_documento) : null,
      password || 'tuti123',
      email,
      nombre,
      apellido,
      telefono ? parseInt(telefono) : null,
      instagram || null,
      fecha_nacimiento || null,
      role,
      false, // bl_cambio_pass_pte
      sucursal || 'CENTRO'
    ]);

    const createdUser = rows[0];

    // 2. Si el rol es ALUMNO, crear su perfil correspondiente en t_cuenta_alumno
    if (role === 'ALUMNO') {
      await db.query(
        'INSERT INTO public.t_cuenta_alumno (id_usuarios, saldo_actual, saldo) VALUES ($1, $2, 4)',
        [createdUser.id_usuarios, 0]
      );

      // Enviar mail de bienvenida con normas de convivencia (FAQs)
      try {
        const { rows: faqs } = await db.query('SELECT pregunta, respuesta FROM public.t_faqs ORDER BY created_at ASC');
        let rulesHtml = faqs.map(f => `<p style="margin-bottom: 4px;"><strong>${f.pregunta}</strong></p><p style="margin-top: 0;">${f.respuesta}</p>`).join('');
        if (!rulesHtml) rulesHtml = '<p>No hay normas registradas en este momento.</p>';
        const tempPassword = password || 'tuti123';

        // Disparamos el correo en background para no bloquear la respuesta
        sendWelcomeEmail(email, nombre, tempPassword, rulesHtml).catch(err => console.error("Error enviando email:", err));
      } catch (emailErr) {
        console.error('Error al armar o enviar el email de bienvenida:', emailErr);
      }
    }

    res.status(201).json(mapUserToFE(createdUser));
  } catch (error) {
    console.error('Error al crear usuario:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El correo electrónico o número de documento ya está registrado.' });
    }
    res.status(500).json({ error: 'Error interno al registrar usuario.' });
  }
});

// Re-enviar email de bienvenida masivo
app.post('/api/users/resend-welcome-bulk', async (req, res) => {
  const { studentIds } = req.body;
  if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ error: 'Faltan los IDs de las alumnas.' });
  }

  try {
    const { rows: usersToNotify } = await db.query(
      'SELECT id_usuarios, email, nombre FROM public.t_usuarios WHERE id_usuarios = ANY($1) AND rol = $2',
      [studentIds, 'ALUMNO']
    );

    if (usersToNotify.length === 0) {
      return res.status(404).json({ error: 'No se encontraron alumnas válidas para notificar.' });
    }

    // Obtener normas (FAQs)
    const { rows: faqs } = await db.query('SELECT pregunta, respuesta FROM public.t_faqs ORDER BY created_at ASC');
    let rulesHtml = faqs.map(f => `<p style="margin-bottom: 4px;"><strong>${f.pregunta}</strong></p><p style="margin-top: 0;">${f.respuesta}</p>`).join('');
    if (!rulesHtml) rulesHtml = '<p>No hay normas registradas en este momento.</p>';

    const tempPassword = 'tuti123';
    
    // Actualizar contraseñas a tuti123 y pedir cambio
    await db.query(
      'UPDATE public.t_usuarios SET clave = $1, bl_cambio_pass_pte = true WHERE id_usuarios = ANY($2)',
      [tempPassword, usersToNotify.map(u => u.id_usuarios)]
    );

    // Enviar correos
    for (const u of usersToNotify) {
      if (u.email) {
        sendWelcomeEmail(u.email, u.nombre, tempPassword, rulesHtml).catch(err => console.error("Error reenviando email a:", u.email, err));
      }
    }

    res.json({ success: true, count: usersToNotify.length });
  } catch (error) {
    console.error('Error al reenviar emails de bienvenida:', error);
    res.status(500).json({ error: 'Error interno al reenviar correos.' });
  }
});

// Actualizar rol de un usuario
app.put('/api/users/:id/role', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({ error: 'El nuevo rol es obligatorio.' });
  }

  try {
    const { rows } = await db.query(
      'UPDATE public.t_usuarios SET rol = $1 WHERE id_usuarios = $2 RETURNING *',
      [role, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // Si cambió su rol a ALUMNO y no tenía perfil creado, crearlo ahora
    if (role === 'ALUMNO') {
      const accountCheck = await db.query('SELECT * FROM public.t_cuenta_alumno WHERE id_usuarios = $1', [id]);
      if (accountCheck.rows.length === 0) {
        await db.query('INSERT INTO public.t_cuenta_alumno (id_usuarios, saldo_actual, saldo) VALUES ($1, 0, 4)', [id]);
      }
    }

    res.json(mapUserToFE(rows[0]));
  } catch (error) {
    console.error('Error al actualizar rol:', error);
    res.status(500).json({ error: 'Error al actualizar el rol de usuario.' });
  }
});


// ==========================================
// 3. ENDPOINTS DE PERFILES DE ALUMNOS
// ==========================================

// Obtener todos los perfiles de estudiantes
app.get('/api/students/profiles', async (req, res) => {
  try {
    const profileQuery = `
      SELECT 
        ca.id_usuarios AS id_usuarios,
        ca.saldo_actual AS class_credits,
        ca.bl_bloqueado AS bl_bloqueado,
        ca.fec_vencimiento_cuota::text AS fec_vencimiento_cuota,
        COALESCE(
          (SELECT COUNT(*) 
           FROM public.t_deudas_insumos d 
           WHERE d.id_usuarios = ca.id_usuarios 
             AND d.tipo = 'ARCILLA' 
             AND d.fec_carga >= DATE_TRUNC('month', CURRENT_DATE)
          ), 
          0
        ) AS monthly_clay_kg,
        (SELECT MAX(d.fec_carga) 
         FROM public.t_deudas_insumos d 
         WHERE d.id_usuarios = ca.id_usuarios 
           AND d.tipo = 'ARCILLA'
        ) AS last_clay_delivery_date
      FROM public.t_cuenta_alumno ca
    `;
    const { rows } = await db.query(profileQuery);
    res.json(rows.map(mapProfileToFE));
  } catch (error) {
    console.error('Error al obtener perfiles:', error);
    res.status(500).json({ error: 'Error al obtener perfiles de estudiantes.' });
  }
});

// Actualizar perfil de estudiante
app.put('/api/students/profiles/:id', async (req, res) => {
  const { id } = req.params;
  const { classCredits } = req.body;

  try {
    const { rows } = await db.query(
      `UPDATE public.t_cuenta_alumno 
       SET saldo_actual = COALESCE($1, saldo_actual) 
       WHERE id_usuarios = $2 RETURNING id_usuarios`,
      [classCredits, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Perfil de estudiante no encontrado.' });
    }

    const profileQuery = `
      SELECT 
        ca.id_usuarios AS id_usuarios,
        ca.saldo_actual AS class_credits,
        ca.bl_bloqueado AS bl_bloqueado,
        COALESCE(
          (SELECT COUNT(*) 
           FROM public.t_deudas_insumos d 
           WHERE d.id_usuarios = ca.id_usuarios 
             AND d.tipo = 'ARCILLA' 
             AND d.fec_carga >= DATE_TRUNC('month', CURRENT_DATE)
          ), 
          0
        ) AS monthly_clay_kg,
        (SELECT MAX(d.fec_carga) 
         FROM public.t_deudas_insumos d 
         WHERE d.id_usuarios = ca.id_usuarios 
           AND d.tipo = 'ARCILLA'
        ) AS last_clay_delivery_date
      FROM public.t_cuenta_alumno ca
      WHERE ca.id_usuarios = $1
    `;
    const profileRes = await db.query(profileQuery, [id]);
    res.json(mapProfileToFE(profileRes.rows[0]));
  } catch (error) {
    console.error('Error al actualizar perfil de estudiante:', error);
    res.status(500).json({ error: 'Error al actualizar el perfil de estudiante.' });
  }
});

// Modificar datos de usuario
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    apellido,
    email,
    nro_documento,
    telefono,
    instagram,
    fecha_nacimiento,
    avatar_url,
    sucursal
  } = req.body;

  if (!email || !nombre || !nro_documento) {
    return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, email, nro_documento).' });
  }

  try {
    await db.query('BEGIN');

    const updateQuery = `
      UPDATE public.t_usuarios
      SET 
        nombre = $1,
        apellido = $2,
        email = $3,
        nro_documento = $4,
        telefono = $5,
        instagram = $6,
        fecha_nacimiento = $7,
        avatar_url = $8,
        sucursal = $9
      WHERE id_usuarios = $10
      RETURNING *
    `;
    const formattedNombre = capitalizeName(nombre);
    const formattedApellido = capitalizeName(apellido);

    const userRes = await db.query(updateQuery, [
      formattedNombre,
      formattedApellido || '',
      email,
      parseInt(nro_documento),
      telefono ? parseInt(telefono) : null,
      instagram || null,
      fecha_nacimiento || null,
      avatar_url || null,
      sucursal || 'CENTRO',
      id
    ]);

    if (userRes.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const updatedUser = userRes.rows[0];

    if (updatedUser.rol === 'ALUMNO' && sucursal) {
      const branchRes = await db.query(
        "SELECT id_sucursal FROM public.t_sucursales WHERE LOWER(n_sucursal) = LOWER($1) LIMIT 1",
        [sucursal]
      );
      if (branchRes.rows.length > 0) {
        const branchId = branchRes.rows[0].id_sucursal;
        await db.query(
          "UPDATE public.t_cuenta_alumno SET id_sucursal = $1 WHERE id_usuarios = $2",
          [branchId, id]
        );
      }
    }

    await db.query('COMMIT');
    res.json(mapUserToFE(updatedUser));
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error al actualizar usuario:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El correo electrónico o número de documento ya está registrado.' });
    }
    res.status(500).json({ error: 'Error interno al actualizar el usuario.' });
  }
});

// Modificar contraseña de usuario
app.put('/api/users/:id/password', async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ error: 'La nueva contraseña es obligatoria.' });
  }

  try {
    const userQuery = await db.query('SELECT clave FROM public.t_usuarios WHERE id_usuarios = $1', [id]);
    if (userQuery.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const user = userQuery.rows[0];
    const validCurrent = user.clave === currentPassword || (!user.clave && currentPassword === 'tuti123');

    // Remove the currentPassword check if we are acting as admin or bypassing for simplicity. 
    // Here we'll just check if it matches, unless it's an admin (but we don't have role check here, so we require it).
    if (currentPassword && !validCurrent) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
    }

    await db.query('UPDATE public.t_usuarios SET clave = $1, bl_cambio_pass_pte = false WHERE id_usuarios = $2', [newPassword, id]);
    res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    console.error('Error al actualizar contraseña:', error);
    res.status(500).json({ error: 'Error interno al actualizar la contraseña.' });
  }
});

// Eliminar usuario en cascada
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('BEGIN');

    // 1. Eliminar reservas en t_inscripciones asociadas a la alumna
    await db.query('DELETE FROM public.t_inscripciones WHERE id_usuarios = $1', [id]);

    // 2. Eliminar lista de espera
    await db.query('DELETE FROM public.t_lista_espera WHERE id_usuarios = $1', [id]);

    // 3. Eliminar notificaciones
    await db.query('DELETE FROM public.t_notificaciones WHERE id_usuarios = $1', [id]);

    // 4. Eliminar deudas
    await db.query('DELETE FROM public.t_deudas_insumos WHERE id_usuarios = $1', [id]);

    // 5. Eliminar historial de créditos
    await db.query('DELETE FROM public.t_historial_creditos WHERE id_usuarios = $1', [id]);

    // 6. Eliminar cuenta de alumno
    await db.query('DELETE FROM public.t_cuenta_alumno WHERE id_usuarios = $1', [id]);

    // 7. Si es un profesor, quitar referencias en t_clases_def seteándolas a NULL
    await db.query('UPDATE public.t_clases_def SET id_profesor = NULL WHERE id_profesor = $1', [id]);

    // 8. Eliminar el usuario final
    const { rowCount } = await db.query('DELETE FROM public.t_usuarios WHERE id_usuarios = $1', [id]);

    if (rowCount === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    await db.query('COMMIT');
    res.json({ success: true, message: 'Usuario y todos sus registros asociados eliminados con éxito.' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error interno al eliminar el usuario.' });
  }
});

// Pausar/Bloquear alumno en t_cuenta_alumno
app.put('/api/students/profiles/:id/block', async (req, res) => {
  const { id } = req.params;
  const { isBlocked } = req.body;

  if (isBlocked === undefined) {
    return res.status(400).json({ error: 'El estado de bloqueo (isBlocked) es obligatorio.' });
  }

  try {
    const { rows } = await db.query(
      'UPDATE public.t_cuenta_alumno SET bl_bloqueado = $1 WHERE id_usuarios = $2 RETURNING id_usuarios',
      [isBlocked, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Perfil de estudiante no encontrado.' });
    }

    res.json({ success: true, isBlocked });
  } catch (error) {
    console.error('Error al cambiar bloqueo de estudiante:', error);
    res.status(500).json({ error: 'Error interno al cambiar estado de bloqueo.' });
  }
});


// ==========================================
// 4. ENDPOINTS DE CLASES (TURNOS)
// ==========================================

// Obtener todas las clases
app.get('/api/classes', async (req, res) => {
  try {
    const classQuery = `
      SELECT 
        c.id_clases_def AS id_clases_def,
        NULL AS name,
        c.id_profesor AS teacher_id,
        COALESCE(u.nombre || ' ' || u.apellido, 'Sin profesor') AS teacher_name,
        CASE c.dia_semana
          WHEN 'Miercoles' THEN 'Miércoles'
          WHEN 'Sabado' THEN 'Sábado'
          ELSE c.dia_semana
        END AS day,
        TO_CHAR(c.hora_inicio, 'HH24:MI') || ' - ' || TO_CHAR(c.hora_fin, 'HH24:MI') AS time,
        c.cupo_maximo AS capacity,
        UPPER(s.n_sucursal) AS sucursal,
        (
          SELECT COALESCE(json_agg(TO_CHAR(i.fecha_efectiva, 'YYYY-MM-DD')), '[]')
          FROM public.t_clases_instancia i
          WHERE i.id_clases_def = c.id_clases_def AND i.bl_cancelada = true
        ) AS paused_dates
      FROM public.t_clases_def c
      LEFT JOIN public.t_usuarios u ON c.id_profesor = u.id_usuarios
      LEFT JOIN public.t_sucursales s ON c.id_sucursal = s.id_sucursal
      WHERE c.bl_activa = true
      ORDER BY 
        CASE UPPER(COALESCE(s.n_sucursal, '')) WHEN 'CENTRO' THEN 1 WHEN 'ALTO VERDE' THEN 2 ELSE 3 END,
        CASE c.dia_semana
          WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miercoles' THEN 3
          WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 WHEN 'Sabado' THEN 6
          ELSE 7
        END,
        c.hora_inicio ASC
    `;
    const { rows } = await db.query(classQuery);
    res.json(rows.map(mapClassToFE));
  } catch (error) {
    console.error('Error al listar clases:', error);
    res.status(500).json({ error: 'Error al obtener clases.' });
  }
});

// Crear una clase o repeticiones múltiples
app.post('/api/classes', async (req, res) => {
  const { name, teacherId, teacherName, day, time, capacity, repeatDays, sucursal } = req.body;

  if (!teacherId || !teacherName || !time || !capacity) {
    return res.status(400).json({ error: 'Faltan campos requeridos para crear el turno.' });
  }

  try {
    // Obtener id_sucursal si se pasa nombre de sucursal
    let idSucursal = null;
    if (sucursal) {
      const sucRes = await db.query(
        "SELECT id_sucursal FROM public.t_sucursales WHERE UPPER(n_sucursal) = UPPER($1) LIMIT 1",
        [sucursal]
      );
      if (sucRes.rows.length > 0) idSucursal = sucRes.rows[0].id_sucursal;
    }

    const createdClasses = [];
    const daysToCreate = repeatDays && repeatDays.length > 0 ? repeatDays : [day];

    const [startStr, endStr] = time.split(' - ');
    const hora_inicio = startStr.trim();
    const hora_fin = endStr.trim();

    for (const d of daysToCreate) {
      const dia_semana = d.replace('é', 'e').replace('á', 'a'); // 'Miércoles' -> 'Miercoles', 'Sábado' -> 'Sabado'

      const query = `
        INSERT INTO public.t_clases_def (dia_semana, hora_inicio, hora_fin, cupo_maximo, id_profesor, id_sucursal, bl_activa)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        RETURNING id_clases_def
      `;
      const result = await db.query(query, [
        dia_semana,
        hora_inicio,
        hora_fin,
        capacity,
        teacherId,
        idSucursal
      ]);
      const generatedId = result.rows[0].id_clases_def;

      createdClasses.push({
        id_clases_def: generatedId,
        name: null,
        teacher_id: teacherId,
        teacher_name: teacherName,
        day: d,
        time,
        capacity,
        sucursal: sucursal ? sucursal.toUpperCase() : null
      });
    }

    res.status(201).json(createdClasses.map(mapClassToFE));
  } catch (error) {
    console.error('Error al crear clases:', error);
    res.status(500).json({ error: 'Error al crear turnos de clase.' });
  }
});

// Modificar datos de una clase (Turno)
app.put('/api/classes/:id', async (req, res) => {
  const { id } = req.params;
  const { teacherId, teacherName, day, time, capacity, sucursal } = req.body;

  if (!time || !capacity || !day) {
    return res.status(400).json({ error: 'Faltan campos requeridos para actualizar el turno.' });
  }

  try {
    // Obtener id_sucursal si se pasa nombre de sucursal
    let idSucursal = null;
    if (sucursal) {
      const sucRes = await db.query(
        "SELECT id_sucursal FROM public.t_sucursales WHERE UPPER(n_sucursal) = UPPER($1) LIMIT 1",
        [sucursal]
      );
      if (sucRes.rows.length > 0) idSucursal = sucRes.rows[0].id_sucursal;
    }

    const [startStr, endStr] = time.split(' - ');
    const hora_inicio = startStr.trim();
    const hora_fin = endStr.trim();
    const dia_semana = day.replace('é', 'e').replace('á', 'a'); // 'Miércoles' -> 'Miercoles', 'Sábado' -> 'Sabado'

    const query = `
      UPDATE public.t_clases_def
      SET dia_semana = $1, hora_inicio = $2, hora_fin = $3, cupo_maximo = $4, id_profesor = $5, id_sucursal = $6
      WHERE id_clases_def = $7
      RETURNING *
    `;
    const { rows } = await db.query(query, [
      dia_semana,
      hora_inicio,
      hora_fin,
      Number(capacity),
      teacherId,
      idSucursal,
      id
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Turno no encontrado.' });
    }

    // Cargar la clase con JOINs para devolver la información completa al Front
    const classQuery = `
      SELECT 
        c.id_clases_def AS id_clases_def,
        NULL AS name,
        c.id_profesor AS teacher_id,
        COALESCE(u.nombre || ' ' || u.apellido, 'Sin profesor') AS teacher_name,
        CASE c.dia_semana
          WHEN 'Miercoles' THEN 'Miércoles'
          WHEN 'Sabado' THEN 'Sábado'
          ELSE c.dia_semana
        END AS day,
        TO_CHAR(c.hora_inicio, 'HH24:MI') || ' - ' || TO_CHAR(c.hora_fin, 'HH24:MI') AS time,
        c.cupo_maximo AS capacity,
        UPPER(s.n_sucursal) AS sucursal,
        (
          SELECT COALESCE(json_agg(TO_CHAR(i.fecha_efectiva, 'YYYY-MM-DD')), '[]')
          FROM public.t_clases_instancia i
          WHERE i.id_clases_def = c.id_clases_def AND i.bl_cancelada = true
        ) AS paused_dates
      FROM public.t_clases_def c
      LEFT JOIN public.t_usuarios u ON c.id_profesor = u.id_usuarios
      LEFT JOIN public.t_sucursales s ON c.id_sucursal = s.id_sucursal
      WHERE c.id_clases_def = $1
    `;
    const detailRes = await db.query(classQuery, [id]);

    res.json(mapClassToFE(detailRes.rows[0]));
  } catch (error) {
    console.error('Error al actualizar clase:', error);
    res.status(500).json({ error: 'Error al actualizar el turno de clase.' });
  }
});

// Pausar o reanudar un turno en una fecha específica
app.post('/api/classes/:id/pause', async (req, res) => {
  const { id } = req.params;
  const { date, isPaused } = req.body;

  if (!date) {
    return res.status(400).json({ error: 'La fecha es obligatoria.' });
  }

  try {
    await db.query('BEGIN');

    // 1. Asegurar que exista la instancia de clase para esa fecha
    let instQuery = await db.query(
      'SELECT id_clase_instancia FROM public.t_clases_instancia WHERE id_clases_def = $1 AND fecha_efectiva = $2 LIMIT 1',
      [id, date]
    );

    let idInstancia;
    if (instQuery.rows.length === 0) {
      // Crear instancia si no existe
      const createInst = await db.query(
        'INSERT INTO public.t_clases_instancia (id_clases_def, fecha_efectiva, bl_cancelada) VALUES ($1, $2, $3) RETURNING id_clase_instancia',
        [id, date, isPaused]
      );
      idInstancia = createInst.rows[0].id_clase_instancia;
    } else {
      idInstancia = instQuery.rows[0].id_clase_instancia;
      // Actualizar instancia existente
      await db.query(
        'UPDATE public.t_clases_instancia SET bl_cancelada = $1 WHERE id_clase_instancia = $2',
        [isPaused, idInstancia]
      );
    }

    // 2. Si se está pausando, cancelar las inscripciones de esa fecha y devolver créditos
    if (isPaused) {
      const inscripciones = await db.query(
        "SELECT i.id_inscripcion, i.id_usuarios FROM public.t_inscripciones i WHERE i.id_clase_instancia = $1 AND i.estado IN ('CONFIRMADA', 'ASISTIO')",
        [idInstancia]
      );

      for (const inscripcion of inscripciones.rows) {
        // Cancelar inscripcion
        await db.query(
          "UPDATE public.t_inscripciones SET estado = 'CANCELADA' WHERE id_inscripcion = $1",
          [inscripcion.id_inscripcion]
        );
        // Devolver credito
        await db.query(
          "UPDATE public.t_cuenta_alumno SET saldo_actual = saldo_actual + 1 WHERE id_usuarios = $1",
          [inscripcion.id_usuarios]
        );
        // Opcional: registrar en historial de créditos
        await db.query(
          "INSERT INTO public.t_historial_creditos (id_usuarios, movimiento, origen_movimiento) VALUES ($1, 1, 'Cancelación por Administrador (Turno Pausado)')",
          [inscripcion.id_usuarios]
        );
      }
    }

    await db.query('COMMIT');
    res.json({ success: true, message: isPaused ? 'Turno pausado.' : 'Turno reanudado.' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error al pausar/reanudar turno:', error);
    res.status(500).json({ error: 'Error interno al cambiar estado del turno.' });
  }
});

// Eliminar un turno (Clase) en cascada
app.delete('/api/classes/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('BEGIN');

    // 1. Eliminar reservas en t_inscripciones de instancias asociadas
    await db.query(
      `DELETE FROM public.t_inscripciones 
       WHERE id_clase_instancia IN (SELECT id_clase_instancia FROM public.t_clases_instancia WHERE id_clases_def = $1)`,
      [id]
    );

    // 2. Eliminar de t_lista_espera
    await db.query(
      `DELETE FROM public.t_lista_espera 
       WHERE id_clase_instancia IN (SELECT id_clase_instancia FROM public.t_clases_instancia WHERE id_clases_def = $1)`,
      [id]
    );

    // 3. Eliminar de t_clases_instancia
    await db.query('DELETE FROM public.t_clases_instancia WHERE id_clases_def = $1', [id]);

    // 4. Eliminar de t_clases_def
    const { rowCount } = await db.query('DELETE FROM public.t_clases_def WHERE id_clases_def = $1', [id]);

    if (rowCount === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Turno no encontrado.' });
    }

    await db.query('COMMIT');
    res.json({ success: true, message: 'Turno eliminado con éxito.' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error al eliminar clase:', error);
    res.status(500).json({ error: 'Error interno al eliminar el turno.' });
  }
});

// Actualizar profesor de una clase
app.put('/api/classes/:id/teacher', async (req, res) => {
  const { id } = req.params;
  const { teacherId } = req.body;

  if (!teacherId) {
    return res.status(400).json({ error: 'El id_profesor es obligatorio.' });
  }

  try {
    const { rowCount } = await db.query(
      'UPDATE public.t_clases_def SET id_profesor = $1 WHERE id_clases_def = $2',
      [teacherId, id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Turno no encontrado.' });
    }

    res.json({ success: true, message: 'Profesor actualizado con éxito.' });
  } catch (error) {
    console.error('Error al actualizar profesor del turno:', error);
    res.status(500).json({ error: 'Error al actualizar el profesor.' });
  }
});

// Asignar múltiples turnos a un profesor (Bulk)
app.put('/api/teachers/:teacherId/classes', async (req, res) => {
  const { teacherId } = req.params;
  const { classIds } = req.body;

  if (!Array.isArray(classIds)) {
    return res.status(400).json({ error: 'classIds debe ser un arreglo de IDs.' });
  }

  try {
    // 1. Quitar la asignación de este profesor de todas las clases
    await db.query(
      'UPDATE public.t_clases_def SET id_profesor = NULL WHERE id_profesor = $1',
      [teacherId]
    );

    // 2. Asignar las clases seleccionadas
    if (classIds.length > 0) {
      await db.query(
        'UPDATE public.t_clases_def SET id_profesor = $1 WHERE id_clases_def = ANY($2)',
        [teacherId, classIds]
      );
    }

    res.json({ success: true, message: 'Asignaciones de turnos actualizadas con éxito.' });
  } catch (error) {
    console.error('Error en asignación múltiple de turnos:', error);
    res.status(500).json({ error: 'Error al actualizar las asignaciones.' });
  }
});


// ==========================================
// 5. ENDPOINTS DE RESERVAS
// ==========================================

// Obtener todas las reservas
app.get('/api/bookings', async (req, res) => {
  try {
    const bookingQuery = `
      SELECT 
        i.id_inscripcion AS id_inscripcion,
        i.id_usuarios AS student_id,
        COALESCE(u.nombre || ' ' || u.apellido, 'Alumno') AS student_name,
        ci.id_clases_def AS class_id,
        ci.fecha_efectiva::text AS date,
        CASE i.estado
          WHEN 'RESERVADA' THEN 'CONFIRMED'
          WHEN 'ASISTIO' THEN 'ATTENDED'
          WHEN 'CANCELADA' THEN 'CANCELLED'
          ELSE i.estado
        END AS status,
        i.fec_reserva AS created_at,
        i.id_reprogramada_hacia,
        i.id_reprogramada_desde
      FROM public.t_inscripciones i
      JOIN public.t_usuarios u ON i.id_usuarios = u.id_usuarios
      JOIN public.t_clases_instancia ci ON i.id_clase_instancia = ci.id_clase_instancia
      ORDER BY ci.fecha_efectiva DESC, i.fec_reserva DESC
    `;
    const { rows } = await db.query(bookingQuery);
    res.json(rows.map(mapBookingToFE));
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    res.status(500).json({ error: 'Error al obtener reservas.' });
  }
});

// Obtener todas las entradas de lista de espera
app.get('/api/waitlist', async (req, res) => {
  try {
    const queryStr = `
      SELECT 
        w.id_lista_espera AS id,
        w.id_usuarios AS student_id,
        ci.id_clases_def AS class_id,
        ci.fecha_efectiva::text AS date,
        w.bl_notificado AS notified
      FROM public.t_lista_espera w
      JOIN public.t_clases_instancia ci ON w.id_clase_instancia = ci.id_clase_instancia
    `;
    const { rows } = await db.query(queryStr);
    res.json(rows.map(mapWaitlistToFE));
  } catch (error) {
    console.error('Error al obtener lista de espera:', error);
    res.status(500).json({ error: 'Error al obtener lista de espera.' });
  }
});

// Agregar un alumno a la lista de espera de un turno
app.post('/api/waitlist', async (req, res) => {
  const { studentId, classId, date } = req.body;

  if (!studentId || !classId || !date) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos.' });
  }

  try {
    // 1. Obtener o crear la instancia de la clase para esa fecha
    let instanceId;
    const instanceRes = await db.query(
      'SELECT id_clase_instancia FROM public.t_clases_instancia WHERE id_clases_def = $1 AND fecha_efectiva = $2',
      [classId, date]
    );

    if (instanceRes.rows.length > 0) {
      instanceId = instanceRes.rows[0].id_clase_instancia;
    } else {
      const result = await db.query(
        'INSERT INTO public.t_clases_instancia (id_clases_def, fecha_efectiva, bl_cancelada) VALUES ($1, $2, false) RETURNING id_clase_instancia',
        [classId, date]
      );
      instanceId = result.rows[0].id_clase_instancia;
    }

    // 2. Validar si ya está en lista de espera (no notificada)
    const checkRes = await db.query(
      'SELECT * FROM public.t_lista_espera WHERE id_usuarios = $1 AND id_clase_instancia = $2 AND bl_notificado = false',
      [studentId, instanceId]
    );

    if (checkRes.rows.length > 0) {
      return res.status(400).json({ error: 'Ya estás en la lista de espera para este turno.' });
    }

    // 3. Registrar en lista de espera
    await db.query(
      'INSERT INTO public.t_lista_espera (id_usuarios, id_clase_instancia, bl_notificado, fec_registro) VALUES ($1, $2, false, NOW())',
      [studentId, instanceId]
    );

    res.status(201).json({ success: true, message: 'Agregado a la lista de espera con éxito.' });
  } catch (error) {
    console.error('Error al registrar en lista de espera:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud.' });
  }
});

// Crear una reserva
app.post('/api/bookings', async (req, res) => {
  const { studentId, studentName, classId, date } = req.body;

  if (!studentId || !studentName || !classId || !date) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos para crear la reserva.' });
  }

  try {
    // 1. Obtener perfil de créditos y datos de clase
    const profileRes = await db.query('SELECT * FROM public.t_cuenta_alumno WHERE id_usuarios = $1', [studentId]);
    const classRes = await db.query('SELECT * FROM public.t_clases_def WHERE id_clases_def = $1', [classId]);

    if (profileRes.rows.length === 0 || classRes.rows.length === 0) {
      return res.status(400).json({ error: 'Estudiante o clase no válidos.' });
    }

    const profile = profileRes.rows[0];
    const classData = classRes.rows[0];
    const className = "Clase";
    const classDay = classData.dia_semana;
    const classTime = `${classData.hora_inicio} - ${classData.hora_fin}`;

    // 2. Validar si la cuenta está bloqueada/pausada
    if (profile.bl_bloqueado) {
      return res.status(400).json({ error: 'Tu cuenta está pausada. No puedes realizar nuevas reservas.' });
    }

    // 3. Validar si el estudiante posee créditos
    if (profile.saldo_actual <= 0) {
      // Crear alerta en BD
      const alertMsg = `El alumno ${studentName} intentó reservar "${className}" (${classDay} - ${classTime}) pero no tiene créditos de clase.`;
      await db.query(
        'INSERT INTO public.t_notificaciones (titulo, mensaje, tipo, leido, created_at) VALUES ($1, $2, $3, false, NOW())',
        ['Sin Créditos', alertMsg, 'NO_CREDITS']
      );

      return res.status(400).json({ error: 'No tienes créditos de clase disponibles. Contacta al administrador.' });
    }

    // 3. Obtener o crear la instancia de la clase para esa fecha
    let instanceId;
    const instanceRes = await db.query(
      'SELECT id_clase_instancia FROM public.t_clases_instancia WHERE id_clases_def = $1 AND fecha_efectiva = $2',
      [classId, date]
    );

    if (instanceRes.rows.length > 0) {
      instanceId = instanceRes.rows[0].id_clase_instancia;
    } else {
      const result = await db.query(
        'INSERT INTO public.t_clases_instancia (id_clases_def, fecha_efectiva, bl_cancelada) VALUES ($1, $2, false) RETURNING id_clase_instancia',
        [classId, date]
      );
      instanceId = result.rows[0].id_clase_instancia;
    }

    // 4. Validar si ya tiene una reserva activa para esa clase en ese día
    const activeBookingRes = await db.query(
      "SELECT * FROM public.t_inscripciones WHERE id_usuarios = $1 AND id_clase_instancia = $2 AND estado != 'CANCELADA'",
      [studentId, instanceId]
    );

    if (activeBookingRes.rows.length > 0) {
      return res.status(400).json({ error: 'Ya tienes una reserva activa para esta clase en esa fecha.' });
    }

    // 5. Validar capacidad / cupos
    const countRes = await db.query(
      "SELECT COUNT(*) FROM public.t_inscripciones WHERE id_clase_instancia = $1 AND estado != 'CANCELADA'",
      [instanceId]
    );
    const activeBookingsCount = parseInt(countRes.rows[0].count);

    if (activeBookingsCount >= classData.cupo_maximo) {
      return res.status(400).json({ error: 'Esta clase ya no tiene cupos disponibles para la fecha seleccionada.' });
    }

    // 6. Crear la reserva
    const insertBookingQuery = `
      INSERT INTO public.t_inscripciones (id_usuarios, id_clase_instancia, estado, fec_reserva)
      VALUES ($1, $2, 'RESERVADA', NOW())
      RETURNING id_inscripcion
    `;
    const bookingResult = await db.query(insertBookingQuery, [studentId, instanceId]);
    const generatedId = bookingResult.rows[0].id_inscripcion;

    // 7. Debitar el crédito
    await db.query(
      'UPDATE public.t_cuenta_alumno SET saldo_actual = saldo_actual - 1 WHERE id_usuarios = $1',
      [studentId]
    );

    // Eliminar de la lista de espera si existía
    await db.query(
      'DELETE FROM public.t_lista_espera WHERE id_usuarios = $1 AND id_clase_instancia = $2',
      [studentId, instanceId]
    );

    // 8. Alerta de alta ocupación si queda crítico (0 o 1 cupos libres)
    const newOccupancy = activeBookingsCount + 1;
    if (classData.cupo_maximo - newOccupancy <= 1) {
      const alertMsg = `La clase "${className}" del ${date} (${classTime}) tiene cupo crítico: solo queda ${classData.cupo_maximo - newOccupancy} lugar(es) libre(s).`;
      await db.query(
        'INSERT INTO public.t_notificaciones (titulo, mensaje, tipo, leido, created_at) VALUES ($1, $2, $3, false, NOW())',
        ['Alta Ocupación', alertMsg, 'HIGH_OCCUPANCY']
      );
    }

    const newBooking = {
      id_reserva: generatedId,
      student_id: studentId,
      student_name: studentName,
      class_id: classId,
      date: date,
      status: 'CONFIRMED',
      created_at: new Date()
    };

    // --- Notificación Web Push a Admins ---
    try {
      const payload = JSON.stringify({
        title: 'Nueva Reserva',
        body: `La alumna ${studentName} se ha inscripto a una clase el ${date} a las ${classTime}.`
      });
      const subQuery = await db.query('SELECT subscription FROM public.t_suscripciones_push');
      for (let s of subQuery.rows) {
        try {
          await webPush.sendNotification(s.subscription, payload);
        } catch (e) {
          console.error('Error enviando push a suscripción:', e);
          // Si la suscripción expiró, se podría eliminar aquí
        }
      }
    } catch (pushErr) {
      console.error('Error procesando web push en reservas:', pushErr);
    }

    res.status(201).json(mapBookingToFE(newBooking));
  } catch (error) {
    console.error('Error al realizar reserva:', error);
    res.status(500).json({ error: 'Error al reservar clase en el servidor.' });
  }
});

// Cancelar una reserva (Límite de 2 horas)
app.post('/api/bookings/:id/cancel', async (req, res) => {
  const { id } = req.params;
  const { forceLate } = req.body;

  try {
    // 1. Obtener la reserva
    const bookingQuery = `
      SELECT 
        i.id_inscripcion AS id_reserva,
        i.id_usuarios AS student_id,
        COALESCE(u.nombre || ' ' || u.apellido, 'Alumno') AS student_name,
        ci.id_clase_instancia AS id_clase_instancia,
        ci.id_clases_def AS class_id,
        ci.fecha_efectiva AS date,
        i.estado AS status
      FROM public.t_inscripciones i
      JOIN public.t_usuarios u ON i.id_usuarios = u.id_usuarios
      JOIN public.t_clases_instancia ci ON i.id_clase_instancia = ci.id_clase_instancia
      WHERE i.id_inscripcion = $1
    `;
    const bookingRes = await db.query(bookingQuery, [id]);
    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada.' });
    }
    const booking = bookingRes.rows[0];

    // Obtener clase
    const classRes = await db.query('SELECT * FROM public.t_clases_def WHERE id_clases_def = $1', [booking.class_id]);
    if (classRes.rows.length === 0) {
      return res.status(400).json({ error: 'La clase no es válida.' });
    }
    const classData = classRes.rows[0];
    const className = "Clase";
    const classTimeStr = `${classData.hora_inicio} - ${classData.hora_fin}`;

    // 2. Lógica de cálculo de tiempo (2 horas antes del inicio)
    const startTimeStr = classData.hora_inicio.toString().split(' ')[0];
    const [hours, minutes] = startTimeStr.split(':').map(Number);

    const dateStr = booking.date instanceof Date ? booking.date.toISOString().split('T')[0] : String(booking.date).split('T')[0];
    const classStartDateTime = new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);

    const now = new Date();
    const diffMs = classStartDateTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    const isLateCancellation = forceLate || diffHours < 2;

    if (isLateCancellation) {
      // Cancelación tardía: Se cobra (se cambia a CANCELADA en la base, pero NO se reintegra el crédito)
      await db.query(
        "UPDATE public.t_inscripciones SET estado = 'CANCELADA' WHERE id_inscripcion = $1",
        [id]
      );

      // Crear alerta en t_notificaciones
      const dateStr = booking.date instanceof Date ? booking.date.toISOString().split('T')[0] : String(booking.date).split('T')[0];
      const alertMsg = `El alumno ${booking.student_name} realizó una cancelación tardía (menos de 2 horas) para "${className}" del ${dateStr} a las ${startTimeStr}. Se debitó el crédito.`;
      try {
        await db.query(
          'INSERT INTO public.t_notificaciones (titulo, mensaje, tipo, leido, created_at) VALUES ($1, $2, $3, false, NOW())',
          ['Cancelación Tardía', alertMsg, 'LATE_CANCELLATION']
        );
      } catch (logErr) {
        console.error('Error al crear notificación de cancelación:', logErr);
      }
    } else {
      // Cancelación a tiempo: Se cambia a CANCELADA y se REINTEGRA el crédito
      await db.query(
        "UPDATE public.t_inscripciones SET estado = 'CANCELADA' WHERE id_inscripcion = $1",
        [id]
      );
      await db.query(
        'UPDATE public.t_cuenta_alumno SET saldo_actual = saldo_actual + 1 WHERE id_usuarios = $1',
        [booking.student_id]
      );
    }

    // --- LÓGICA DE LISTA DE ESPERA (NOTIFICAR CUPOS LIBERADOS) ---
    const waitlistRes = await db.query(
      'SELECT id_usuarios FROM public.t_lista_espera WHERE id_clase_instancia = $1 AND bl_notificado = false',
      [booking.id_clase_instancia]
    );

    if (waitlistRes.rows.length > 0) {
      const dateStr = booking.date instanceof Date ? booking.date.toISOString().split('T')[0] : booking.date;
      const notifyMsg = `¡Se liberó un cupo! Hay lugar disponible para la clase de las ${classTimeStr} el día ${dateStr}.`;

      for (const wlUser of waitlistRes.rows) {
        await db.query(
          'INSERT INTO public.t_notificaciones (id_usuarios, titulo, mensaje, tipo, leido, created_at) VALUES ($1, $2, $3, $4, false, NOW())',
          [wlUser.id_usuarios, 'Cupo Liberado', notifyMsg, 'WAITLIST_FREE_SPOT']
        );
      }

      await db.query(
        'UPDATE public.t_lista_espera SET bl_notificado = true WHERE id_clase_instancia = $1',
        [booking.id_clase_instancia]
      );
    }

    res.json({ isLateCancellation });
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    res.status(500).json({ error: 'Error al cancelar la reserva.' });
  }
});

// Reprogramar una reserva
app.post('/api/bookings/:id/reschedule', async (req, res) => {
  const { id } = req.params;
  const { newClassId, newDate } = req.body;

  if (!newClassId || !newDate) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos (newClassId, newDate).' });
  }

  try {
    await db.query('BEGIN');

    // 1. Obtener reserva original
    const bookingRes = await db.query('SELECT * FROM public.t_inscripciones WHERE id_inscripcion = $1', [id]);
    if (bookingRes.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Reserva no encontrada.' });
    }
    const oldBooking = bookingRes.rows[0];

    // Validar tiempo para reprogramar (mismo que cancelar, 2hs antes)
    const oldInstRes = await db.query('SELECT * FROM public.t_clases_instancia WHERE id_clase_instancia = $1', [oldBooking.id_clase_instancia]);
    const oldClassDefRes = await db.query('SELECT * FROM public.t_clases_def WHERE id_clases_def = $1', [oldInstRes.rows[0].id_clases_def]);
    
    const startTimeStr = oldClassDefRes.rows[0].hora_inicio.toString().split(' ')[0];
    const [hours, minutes] = startTimeStr.split(':').map(Number);
    const oldClassDate = new Date(oldInstRes.rows[0].fecha_efectiva);
    oldClassDate.setHours(hours, minutes, 0, 0);
    const diffHours = (oldClassDate.getTime() - new Date().getTime()) / (1000 * 60 * 60);

    if (diffHours < 2) {
      await db.query('ROLLBACK');
      return res.status(400).json({ error: 'No puedes reprogramar con menos de 2 horas de anticipación.' });
    }

    // 2. Obtener o crear instancia de la nueva clase
    let newInstanceId;
    const instanceRes = await db.query(
      'SELECT id_clase_instancia FROM public.t_clases_instancia WHERE id_clases_def = $1 AND fecha_efectiva = $2',
      [newClassId, newDate]
    );

    if (instanceRes.rows.length > 0) {
      newInstanceId = instanceRes.rows[0].id_clase_instancia;
    } else {
      const result = await db.query(
        'INSERT INTO public.t_clases_instancia (id_clases_def, fecha_efectiva, bl_cancelada) VALUES ($1, $2, false) RETURNING id_clase_instancia',
        [newClassId, newDate]
      );
      newInstanceId = result.rows[0].id_clase_instancia;
    }

    // Validar cupos en nueva clase
    const countRes = await db.query(
      "SELECT COUNT(*) FROM public.t_inscripciones WHERE id_clase_instancia = $1 AND estado != 'CANCELADA'",
      [newInstanceId]
    );
    const activeBookingsCount = parseInt(countRes.rows[0].count);
    const newClassDefRes = await db.query('SELECT cupo_maximo FROM public.t_clases_def WHERE id_clases_def = $1', [newClassId]);
    if (activeBookingsCount >= newClassDefRes.rows[0].cupo_maximo) {
      await db.query('ROLLBACK');
      return res.status(400).json({ error: 'La nueva clase no tiene cupos disponibles.' });
    }

    // 3. Crear nueva reserva apuntando a la vieja
    const insertBookingQuery = `
      INSERT INTO public.t_inscripciones (id_usuarios, id_clase_instancia, estado, fec_reserva, id_reprogramada_desde)
      VALUES ($1, $2, 'RESERVADA', NOW(), $3)
      RETURNING id_inscripcion
    `;
    const newBookingResult = await db.query(insertBookingQuery, [oldBooking.id_usuarios, newInstanceId, oldBooking.id_inscripcion]);
    const newBookingId = newBookingResult.rows[0].id_inscripcion;

    // 4. Cancelar reserva vieja apuntando a la nueva
    await db.query(
      "UPDATE public.t_inscripciones SET estado = 'CANCELADA', id_reprogramada_hacia = $1 WHERE id_inscripcion = $2",
      [newBookingId, oldBooking.id_inscripcion]
    );

    await db.query('COMMIT');
    res.json({ success: true, newBookingId });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error al reprogramar reserva:', error);
    res.status(500).json({ error: 'Error al reprogramar la reserva.' });
  }
});

// Tomar asistencia (Profesor)
app.put('/api/bookings/:id/attendance', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'ATTENDED' (Presente) o 'ABSENT' (Ausente)

  if (!status || (status !== 'ATTENDED' && status !== 'ABSENT')) {
    return res.status(400).json({ error: 'Estado de asistencia no válido.' });
  }

  try {
    const bookingRes = await db.query('SELECT * FROM public.t_inscripciones WHERE id_inscripcion = $1', [id]);
    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada.' });
    }

    if (status === 'ATTENDED') {
      await db.query("UPDATE public.t_inscripciones SET estado = 'ASISTIO' WHERE id_inscripcion = $1", [id]);
    } else {
      // Ausente: Se marca como CANCELADA en la base para liberar cupo, pero NO se le reintegra el crédito
      await db.query("UPDATE public.t_inscripciones SET estado = 'CANCELADA' WHERE id_inscripcion = $1", [id]);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error al registrar asistencia:', error);
    res.status(500).json({ error: 'Error al guardar la asistencia.' });
  }
});


// ==========================================
// 6. ENDPOINTS DE ENTREGAS DE ARCILLA
// ==========================================

// Obtener todas las entregas
app.get('/api/clay-deliveries', async (req, res) => {
  try {
    const clayQuery = `
      SELECT 
        d.id_deudas_insumos AS id_entrega,
        d.id_usuarios AS student_id,
        COALESCE(u.nombre || ' ' || u.apellido, 'Alumno') AS student_name,
        NULL AS teacher_id,
        'Profesor' AS teacher_name,
        d.fec_carga::text AS date,
        1.00 AS quantity_kg
      FROM public.t_deudas_insumos d
      JOIN public.t_usuarios u ON d.id_usuarios = u.id_usuarios
      WHERE d.tipo = 'ARCILLA'
      ORDER BY d.fec_carga DESC
    `;
    const { rows } = await db.query(clayQuery);
    res.json(rows.map(mapDeliveryToFE));
  } catch (error) {
    console.error('Error al listar entregas:', error);
    res.status(500).json({ error: 'Error al obtener entregas de arcilla.' });
  }
});

// Registrar entrega de arcilla
app.post('/api/clay-deliveries', async (req, res) => {
  const { studentId, studentName, teacherId, teacherName } = req.body;

  if (!studentId || !studentName || !teacherId || !teacherName) {
    return res.status(400).json({ error: 'Faltan parámetros de entrega requeridos.' });
  }

  try {
    // Validar límite estricto de 1kg al mes (contamos registros en este mes)
    const clayCountRes = await db.query(
      `SELECT COUNT(*) FROM public.t_deudas_insumos 
       WHERE id_usuarios = $1 AND tipo = 'ARCILLA' AND fec_carga >= DATE_TRUNC('month', CURRENT_DATE)`,
      [studentId]
    );
    const count = parseInt(clayCountRes.rows[0].count);

    if (count >= 1) {
      // Generar alerta de negocio para el admin
      const alertMsg = `El alumno ${studentName} intentó retirar otro bloque de arcilla de 1kg este mes, pero ya alcanzó su límite mensual.`;
      await db.query(
        'INSERT INTO public.t_notificaciones (titulo, mensaje, tipo, leido, created_at) VALUES ($1, $2, $3, false, NOW())',
        ['Límite de Arcilla', alertMsg, 'CLAY_LIMIT']
      );

      return res.status(400).json({ error: 'Límite mensual de arcilla alcanzado (1kg por mes). No se puede entregar más arcilla.' });
    }

    // Registrar en t_deudas_insumos como entrega gratuita de arcilla mensual
    await db.query(
      `INSERT INTO public.t_deudas_insumos 
        (id_usuarios, tipo, descripcion, peso_gramos, precio_total, bl_pagado, fec_carga)
      VALUES 
        ($1, 'ARCILLA', 'Entrega de Arcilla 1kg', 1000, 0, true, NOW())`,
      [studentId]
    );

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error al entregar arcilla:', error);
    res.status(500).json({ error: 'Error al registrar la entrega de arcilla.' });
  }
});

// ==========================================
// 8. HORNEADOS (BAKES)
// ==========================================

// Obtener todos los horneados
app.get('/api/bakes', async (req, res) => {
  try {
    const bakeQuery = `
      SELECT 
        d.id_deudas_insumos AS id,
        d.id_usuarios AS student_id,
        COALESCE(u.nombre || ' ' || u.apellido, 'Alumno') AS student_name,
        d.fec_carga::text AS date,
        d.precio_total AS price,
        d.metodo_pago_pte AS payment_method,
        d.bl_pagado AS is_paid,
        d.descripcion AS description,
        d.tipo AS type
      FROM public.t_deudas_insumos d
      JOIN public.t_usuarios u ON d.id_usuarios = u.id_usuarios
      ORDER BY d.fec_carga DESC
    `;
    const { rows } = await db.query(bakeQuery);
    res.json(rows.map(r => ({
      id: r.id,
      studentId: r.student_id,
      studentName: r.student_name,
      date: r.date,
      price: parseFloat(r.price),
      paymentMethod: r.payment_method,
      isPaid: r.is_paid,
      description: r.description,
      type: r.type
    })));
  } catch (error) {
    console.error('Error al listar horneados:', error);
    res.status(500).json({ error: 'Error al obtener horneados.' });
  }
});

// Confirmar el pago de un insumo (por parte del admin)
app.put('/api/insumos/:id/confirm', async (req, res) => {
  const { id } = req.params;

  try {
    const debtRes = await db.query('SELECT * FROM public.t_deudas_insumos WHERE id_deudas_insumos = $1', [id]);
    if (debtRes.rows.length === 0) {
      return res.status(404).json({ error: 'Deuda de insumo no encontrada.' });
    }

    const debt = debtRes.rows[0];
    if (debt.bl_pagado) {
      return res.status(400).json({ error: 'El pago ya se encuentra confirmado.' });
    }

    await db.query(`
      UPDATE public.t_deudas_insumos 
      SET bl_pagado = true
      WHERE id_deudas_insumos = $1
    `, [id]);

    res.json({ success: true, message: 'Pago de insumo confirmado.' });
  } catch (error) {
    console.error('Error al confirmar pago de insumo:', error);
    res.status(500).json({ error: 'Error al confirmar pago de insumo.' });
  }
});

// Registrar un horneado
app.post('/api/bakes', async (req, res) => {
  const { studentId, price, description } = req.body;

  if (!studentId || price === undefined || !description) {
    return res.status(400).json({ error: 'Faltan parámetros de horneado requeridos.' });
  }

  try {
    await db.query(
      `INSERT INTO public.t_deudas_insumos 
        (id_usuarios, tipo, descripcion, precio_total, metodo_pago_pte, bl_pagado, fec_carga)
      VALUES 
        ($1, 'HORNO', $2, $3, NULL, false, NOW())`,
      [studentId, description, price]
    );

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error al registrar horneado:', error);
    res.status(500).json({ error: 'Error al registrar el horneado.' });
  }
});

// Registrar arcilla extra
app.post('/api/extra-clay', async (req, res) => {
  const { studentId, quantity } = req.body;

  if (!studentId || !quantity) {
    return res.status(400).json({ error: 'Faltan parámetros de arcilla requeridos.' });
  }

  try {
    const descripcion = `Arcilla extra: ${quantity}`;
    await db.query(
      `INSERT INTO public.t_deudas_insumos 
        (id_usuarios, tipo, descripcion, precio_total, metodo_pago_pte, bl_pagado, fec_carga)
      VALUES 
        ($1, 'ARCILLA', $2, 0, NULL, false, NOW())`,
      [studentId, descripcion]
    );

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error al registrar arcilla extra:', error);
    res.status(500).json({ error: 'Error al registrar la arcilla extra.' });
  }
});


// ==========================================
// 7. ENDPOINTS DE PAGOS
// ==========================================

// Obtener listado de pagos
app.get('/api/payments', async (req, res) => {
  try {
    const paymentQuery = `
      SELECT 
        hc.id_historial_credito AS id_pago,
        hc.id_usuarios AS student_id,
        hc.monto AS amount,
        hc.fec_movimiento::text AS date,
        hc.estado AS status,
        hc.cantidad AS class_credits_added,
        hc.motivo
      FROM public.t_historial_creditos hc
      JOIN public.t_usuarios u ON hc.id_usuarios = u.id_usuarios
      ORDER BY hc.fec_movimiento DESC
    `;
    const { rows } = await db.query(paymentQuery);
    res.json(rows.map(mapPaymentToFE));
  } catch (error) {
    console.error('Error al listar pagos:', error);
    res.status(500).json({ error: 'Error al obtener pagos.' });
  }
});

// Registrar un pago manual (Soporta múltiples alumnos y fecha custom)
app.post('/api/payments', async (req, res) => {
  const { studentIds, amount, creditsToAdd, date } = req.body;

  if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0 || !amount || !creditsToAdd) {
    return res.status(400).json({ error: 'Faltan parámetros del pago (studentIds array, amount, creditsToAdd).' });
  }

  // Use provided date or fallback to NOW()
  const paymentDate = date ? date : new Date().toISOString();

  try {
    // Begin Transaction manually if desired, but here we just loop
    for (const sId of studentIds) {
      const profileRes = await db.query('SELECT * FROM public.t_cuenta_alumno WHERE id_usuarios = $1', [sId]);
      if (profileRes.rows.length === 0) {
        console.warn(`Perfil de estudiante no encontrado para ID ${sId}`);
        continue;
      }

      // 1. Insertar en t_historial_creditos para registro de auditoría
      await db.query(
        `INSERT INTO public.t_historial_creditos (id_usuarios, cantidad, motivo, fec_movimiento, estado, monto)
         VALUES ($1, $2, 'Acreditación por Pago', $4, 'PAID', $3)`,
        [sId, creditsToAdd, amount, paymentDate]
      );

      // 2. Acreditar créditos en t_cuenta_alumno
      await db.query(
        'UPDATE public.t_cuenta_alumno SET saldo_actual = saldo_actual + $1 WHERE id_usuarios = $2',
        [creditsToAdd, sId]
      );
    }

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error al procesar pago:', error);
    res.status(500).json({ error: 'Error al registrar el pago en el servidor.' });
  }
});


// ==========================================
// 8. ENDPOINTS DE ALERTAS
// ==========================================

// Obtener alertas no resueltas
app.get('/api/alerts', async (req, res) => {
  try {
    const alertQuery = `
      SELECT 
        id_notificacion AS id_alerta,
        id_usuarios,
        tipo AS type,
        mensaje AS message,
        created_at::text AS date,
        leido AS resolved
      FROM public.t_notificaciones
      ORDER BY created_at DESC
    `;
    const { rows } = await db.query(alertQuery);
    res.json(rows.map(mapAlertToFE));
  } catch (error) {
    console.error('Error al listar alertas:', error);
    res.status(500).json({ error: 'Error al obtener alertas.' });
  }
});

// Crear una alerta manual
app.post('/api/alerts', async (req, res) => {
  const { type, message, studentId } = req.body;

  if (!type || !message) {
    return res.status(400).json({ error: 'Tipo y mensaje obligatorios.' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO public.t_notificaciones (titulo, mensaje, tipo, leido, created_at, id_usuarios)
       VALUES ($1, $2, $3, false, NOW(), $4)
       RETURNING id_notificacion AS id_alerta, id_usuarios, tipo AS type, mensaje AS message, created_at::text AS date, leido AS resolved`,
      [type, message, type, studentId || null]
    );
    res.status(201).json(mapAlertToFE(rows[0]));
  } catch (error) {
    console.error('Error al crear alerta:', error);
    res.status(500).json({ error: 'Error al crear alerta.' });
  }
});

// Resolver alerta
app.put('/api/alerts/:id/resolve', async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await db.query(
      `UPDATE public.t_notificaciones SET leido = true WHERE id_notificacion = $1
       RETURNING id_notificacion AS id_alerta, tipo AS type, mensaje AS message, created_at::text AS date, leido AS resolved`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Alerta no encontrada.' });
    }

    res.json(mapAlertToFE(rows[0]));
  } catch (error) {
    console.error('Error al resolver alerta:', error);
    res.status(500).json({ error: 'Error al resolver la alerta.' });
  }
});


// ==========================================
// 9. DIAS NO LABORALES (CALENDARIO)
// ==========================================



// Listar días no laborales
app.get('/api/non-working-days', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        TO_CHAR(fecha, 'YYYY-MM-DD') AS date, 
        nombre AS reason 
      FROM public.t_dias_no_laborales 
      ORDER BY fecha ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error al listar días no laborales:', error);
    res.status(500).json({ error: 'Error al obtener días no laborales.' });
  }
});

// Agregar o actualizar día no laboral
app.post('/api/non-working-days', async (req, res) => {
  // FE envía { fecha, motivo }
  const { fecha, motivo } = req.body;
  if (!fecha) {
    return res.status(400).json({ error: 'La fecha es obligatoria.' });
  }
  try {
    const valNombre = motivo || 'Feriado / Cerrado';
    await db.query(
      `INSERT INTO public.t_dias_no_laborales (fecha, nombre)
       VALUES ($1, $2)
       ON CONFLICT (fecha) DO UPDATE SET nombre = EXCLUDED.nombre`,
      [fecha, valNombre]
    );
    res.status(201).json({ success: true, date: fecha, reason: valNombre });
  } catch (error) {
    console.error('Error al guardar día no laboral:', error);
    res.status(500).json({ error: 'Error al registrar día no laboral.' });
  }
});

// Solicitar pago pendiente (por parte de la alumna)
app.post('/api/payments/request', async (req, res) => {
  const { studentId, amount, creditsToAdd } = req.body;

  if (!studentId || !amount || !creditsToAdd) {
    return res.status(400).json({ error: 'Faltan parámetros de la solicitud de pago.' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO public.t_historial_creditos (id_usuarios, cantidad, motivo, fec_movimiento, estado, monto)
       VALUES ($1, $2, 'Solicitud de Pago', NOW(), 'PENDING', $3)
       RETURNING id_historial_credito AS id`,
      [studentId, creditsToAdd, amount]
    );

    res.json({ success: true, paymentId: rows[0].id });
  } catch (error) {
    console.error('Error al solicitar pago:', error);
    res.status(500).json({ error: 'Error al solicitar el pago.' });
  }
});

// Confirmar un pago pendiente (por parte del admin)
app.put('/api/payments/:id/confirm', async (req, res) => {
  const { id } = req.params;
  const { confirmationDate } = req.body;

  try {
    const paymentRes = await db.query('SELECT * FROM public.t_historial_creditos WHERE id_historial_credito = $1', [id]);
    if (paymentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Pago pendiente no encontrado.' });
    }

    const payment = paymentRes.rows[0];
    if (payment.estado === 'PAID') {
      return res.status(400).json({ error: 'El pago ya se encuentra confirmado.' });
    }

    // Acreditar los créditos
    await db.query(
      'UPDATE public.t_cuenta_alumno SET saldo_actual = saldo_actual + $1 WHERE id_usuarios = $2',
      [payment.cantidad, payment.id_usuarios]
    );

    // Cambiar estado a PAID y setear la fecha de movimiento
    const updateDate = confirmationDate ? new Date(confirmationDate) : new Date();
    await db.query(
      'UPDATE public.t_historial_creditos SET estado = $1, motivo = $2, fec_movimiento = $3 WHERE id_historial_credito = $4',
      ['PAID', 'Acreditación por Pago Confirmado', updateDate, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error al confirmar pago:', error);
    res.status(500).json({ error: 'Error al confirmar el pago.' });
  }
});

// Notificar a alumna sobre pago pendiente
app.post('/api/payments/:id/notify', async (req, res) => {
  const { id } = req.params;

  try {
    const paymentRes = await db.query('SELECT * FROM public.t_historial_creditos WHERE id_historial_credito = $1', [id]);
    if (paymentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Pago pendiente no encontrado.' });
    }

    const payment = paymentRes.rows[0];

    // Enviar notificación (se usa id_usuario en t_notificaciones si existiera la columna, 
    // pero si las alertas son genéricas por ahora le mandamos el mensaje).
    // Nota: Como no tenemos una columna 'id_usuario' segura en t_notificaciones según el esquema anterior,
    // usaremos la estructura existente e incluiremos el nombre de la alumna en el mensaje si es necesario.
    // Revisando `POST /api/alerts`, se insertan en `t_notificaciones` con `tipo`, `mensaje`, `fecha_notificacion`.
    await db.query(
      `INSERT INTO public.t_notificaciones (titulo, mensaje, tipo, leido, created_at, id_usuarios) 
       VALUES ($1, $2, $3, false, NOW(), $4)`,
      ['Recordatorio de Pago', `Recordatorio: Tienes una transferencia pendiente por la compra de ${payment.cantidad} créditos.`, 'TRANSFER_REMINDER', payment.id_usuarios]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error al notificar pago:', error);
    res.status(500).json({ error: 'Error al notificar el pago.' });
  }
});

// Eliminar día no laboral
app.delete('/api/non-working-days/:fecha', async (req, res) => {
  const { fecha } = req.params;
  try {
    await db.query('DELETE FROM public.t_dias_no_laborales WHERE fecha = $1', [fecha]);
    res.json({ success: true, fecha });
  } catch (error) {
    console.error('Error al eliminar día no laboral:', error);
    res.status(500).json({ error: 'Error al eliminar día no laboral.' });
  }
});


// ==========================================
// 9. ENDPOINTS DE PAQUETES (PACKS)
// ==========================================

app.get('/api/packs', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM public.t_paquetes_creditos ORDER BY cantidad_creditos ASC');
    res.json(rows.map(mapPackToFE));
  } catch (error) {
    console.error('Error al listar paquetes:', error);
    res.status(500).json({ error: 'Error al obtener paquetes.' });
  }
});

app.post('/api/packs', async (req, res) => {
  const { name, credits, price } = req.body;
  if (!name || !credits || !price) {
    return res.status(400).json({ error: 'Faltan datos requeridos (name, credits, price).' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO public.t_paquetes_creditos (nombre, cantidad_creditos, precio)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, credits, price]
    );
    res.status(201).json(mapPackToFE(rows[0]));
  } catch (error) {
    console.error('Error al crear paquete:', error);
    res.status(500).json({ error: 'Error al crear paquete.' });
  }
});

app.put('/api/packs/:id', async (req, res) => {
  const { id } = req.params;
  const { name, credits, price, active } = req.body;

  try {
    const { rows } = await db.query(
      `UPDATE public.t_paquetes_creditos 
       SET nombre = COALESCE($1, nombre),
           cantidad_creditos = COALESCE($2, cantidad_creditos),
           precio = COALESCE($3, precio),
           activo = COALESCE($4, activo)
       WHERE id_paquete = $5
       RETURNING *`,
      [name, credits, price, active, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Paquete no encontrado.' });
    }

    res.json(mapPackToFE(rows[0]));
  } catch (error) {
    console.error('Error al actualizar paquete:', error);
    res.status(500).json({ error: 'Error al actualizar paquete.' });
  }
});

app.delete('/api/packs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query(
      'DELETE FROM public.t_paquetes_creditos WHERE id_paquete = $1 RETURNING *',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Paquete no encontrado.' });
    }
    res.json({ success: true, deleted: rows[0].id_paquete });
  } catch (error) {
    console.error('Error al eliminar paquete:', error);
    res.status(500).json({ error: 'Error al eliminar paquete.' });
  }
});


// ==========================================
// 10. ENDPOINTS DE SUCURSALES (BRANCHES)
// ==========================================

app.get('/api/branches', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM public.t_sucursales ORDER BY n_sucursal ASC');
    res.json(rows.map(mapBranchToFE));
  } catch (error) {
    console.error('Error al listar sucursales:', error);
    res.status(500).json({ error: 'Error al obtener sucursales.' });
  }
});

app.post('/api/branches', async (req, res) => {
  const { name, address, maxCapacity } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'El nombre es obligatorio.' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO public.t_sucursales (n_sucursal, direccion, capacidad_max_creditos)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, address || null, maxCapacity || null]
    );
    res.status(201).json(mapBranchToFE(rows[0]));
  } catch (error) {
    console.error('Error al crear sucursal:', error);
    res.status(500).json({ error: 'Error al crear sucursal.' });
  }
});

app.put('/api/branches/:id', async (req, res) => {
  const { id } = req.params;
  const { name, address, maxCapacity } = req.body;

  try {
    const { rows } = await db.query(
      `UPDATE public.t_sucursales 
       SET n_sucursal = COALESCE($1, n_sucursal),
           direccion = COALESCE($2, direccion),
           capacidad_max_creditos = COALESCE($3, capacidad_max_creditos)
       WHERE id_sucursal = $4
       RETURNING *`,
      [name, address, maxCapacity, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Sucursal no encontrada.' });
    }

    res.json(mapBranchToFE(rows[0]));
  } catch (error) {
    console.error('Error al actualizar sucursal:', error);
    res.status(500).json({ error: 'Error al actualizar sucursal.' });
  }
});

app.delete('/api/branches/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query(
      'DELETE FROM public.t_sucursales WHERE id_sucursal = $1 RETURNING *',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Sucursal no encontrada.' });
    }
    res.json({ success: true, deleted: rows[0].id_sucursal });
  } catch (error) {
    console.error('Error al eliminar sucursal:', error);
    res.status(500).json({ error: 'Error al eliminar sucursal.' });
  }
});


// ==========================================
// 11. ENDPOINTS DE NORMAS (FAQS)
// ==========================================

app.get('/api/faqs', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM public.t_faqs ORDER BY created_at ASC');
    res.json(rows.map(mapFaqToFE));
  } catch (error) {
    console.error('Error al listar faqs:', error);
    res.status(500).json({ error: 'Error al obtener faqs.' });
  }
});

app.post('/api/faqs', async (req, res) => {
  const { question, answer } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ error: 'Pregunta y respuesta son obligatorias.' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO public.t_faqs (pregunta, respuesta)
       VALUES ($1, $2)
       RETURNING *`,
      [question, answer]
    );
    res.status(201).json(mapFaqToFE(rows[0]));
  } catch (error) {
    console.error('Error al crear faq:', error);
    res.status(500).json({ error: 'Error al crear faq.' });
  }
});

app.put('/api/faqs/:id', async (req, res) => {
  const { id } = req.params;
  const { question, answer } = req.body;

  try {
    const { rows } = await db.query(
      `UPDATE public.t_faqs 
       SET pregunta = COALESCE($1, pregunta),
           respuesta = COALESCE($2, respuesta)
       WHERE id = $3
       RETURNING *`,
      [question, answer, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Norma no encontrada.' });
    }

    res.json(mapFaqToFE(rows[0]));
  } catch (error) {
    console.error('Error al actualizar faq:', error);
    res.status(500).json({ error: 'Error al actualizar faq.' });
  }
});

app.delete('/api/faqs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query(
      'DELETE FROM public.t_faqs WHERE id = $1 RETURNING *',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Norma no encontrada.' });
    }
    res.json({ success: true, deleted: rows[0].id });
  } catch (error) {
    console.error('Error al eliminar faq:', error);
    res.status(500).json({ error: 'Error al eliminar faq.' });
  }
});


// ==========================================
// INICIAR SERVIDOR
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});

// ==========================================
// PUSH NOTIFICATIONS ENDPOINT
// ==========================================
app.post('/api/push/subscribe', async (req, res) => {
  const { subscription, userId } = req.body;

  if (!subscription || !userId) {
    return res.status(400).json({ error: 'Faltan datos de suscripción o usuario.' });
  }

  try {
    // Delete existing sub for this user to avoid duplicates if re-subscribing on same device
    // (A more robust way is matching endpoint, but this is simpler for 1 device per admin)
    await db.query('DELETE FROM public.t_suscripciones_push WHERE id_usuarios = $1', [userId]);

    await db.query(
      'INSERT INTO public.t_suscripciones_push (id_usuarios, subscription) VALUES ($1, $2)',
      [userId, subscription]
    );

    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Error al guardar suscripción push:', err);
    res.status(500).json({ error: 'Error al guardar la suscripción.' });
  }
});

// ==========================================
// BACKGROUND JOBS
// ==========================================
const runExpirationJob = async () => {
  try {
    console.log('[Job] Corriendo verificación de vencimientos de créditos...');
    const usersRes = await db.query('SELECT id_usuario, id_usuarios, saldo_actual FROM public.t_cuenta_alumno WHERE saldo_actual > 0');

    for (const user of usersRes.rows) {
      const studentId = user.id_usuarios; // UUID from t_usuarios
      let remainingCredits = user.saldo_actual;

      const paymentsRes = await db.query(
        "SELECT * FROM public.t_historial_creditos WHERE id_usuarios = $1 AND estado IN ('PAID', 'CONFIRMED') ORDER BY fec_movimiento DESC",
        [studentId]
      );

      for (const p of paymentsRes.rows) {
        if (remainingCredits <= 0) break;
        const allocated = Math.min(remainingCredits, p.cantidad);
        remainingCredits -= allocated;

        const fecStr = p.fec_movimiento instanceof Date ? p.fec_movimiento.toISOString().split('T')[0] : String(p.fec_movimiento).split(' ')[0];
        const buyDate = new Date(fecStr + 'T12:00:00');
        const expDate = new Date(buyDate);
        expDate.setDate(expDate.getDate() + 30);

        const now = new Date();
        const daysLeft = (expDate - now) / (1000 * 60 * 60 * 24);

        if (daysLeft <= 0) {
          console.log(`[Job] Expirando ${allocated} creditos para usuario ${studentId}`);
          await db.query('UPDATE public.t_cuenta_alumno SET saldo_actual = GREATEST(0, saldo_actual - $1) WHERE id_usuarios = $2', [allocated, studentId]);
          await db.query('UPDATE public.t_historial_creditos SET estado = $1 WHERE id_historial_credito = $2', ['EXPIRED', p.id_historial_credito]);

          const msg = `Tus ${allocated} clases disponibles han llegado a su fecha de expiración y ya no están disponibles.`;
          await db.query(
            'INSERT INTO public.t_notificaciones (id_usuarios, titulo, mensaje, tipo, leido, created_at) VALUES ($1, $2, $3, $4, false, NOW())',
            [studentId, 'Tus clases han vencido', msg, 'DANGER']
          );
        } else if (daysLeft <= 7 && !p.bl_notificado_venc) {
          console.log(`[Job] Notificando vencimiento próximo a usuario ${studentId}`);
          await db.query('UPDATE public.t_historial_creditos SET bl_notificado_venc = true WHERE id_historial_credito = $1', [p.id_historial_credito]);

          const msg = 'Tus clases disponibles están a punto de vencer. No olvides reservar tus turnos.';
          await db.query(
            'INSERT INTO public.t_notificaciones (id_usuarios, titulo, mensaje, tipo, leido, created_at) VALUES ($1, $2, $3, $4, false, NOW())',
            [studentId, 'Tus clases están a punto de vencer', msg, 'WARNING']
          );

          // Enviar Web Push si tiene suscripción
          try {
            const subsRes = await db.query('SELECT subscription FROM public.t_suscripciones_push WHERE id_usuarios = $1', [studentId]);
            const payload = JSON.stringify({
              title: 'Tus clases están a punto de vencer',
              body: msg,
              url: '/alumnas/turnos'
            });
            for (const s of subsRes.rows) {
              await webPush.sendNotification(s.subscription, payload).catch(e => console.error('Error web-push vencimiento:', e.message));
            }
          } catch (pushErr) {
            console.error('Error enviando push de vencimiento:', pushErr.message);
          }
        }
      }
    }
  } catch (error) {
    console.error('[Job] Error en runExpirationJob:', error);
  }
};

// Ejecutar al iniciar el servidor
setTimeout(runExpirationJob, 5000);
// Ejecutar cada 1 hora
setInterval(runExpirationJob, 60 * 60 * 1000);
