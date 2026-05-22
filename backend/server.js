import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import db from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Habilitar CORS para permitir peticiones del frontend (Vite)
app.use(cors());
app.use(express.json());

// Helper para mapear usuario de la BD al formato del Frontend
const mapUserToFE = (u) => {
  if (!u) return null;
  return {
    id: u.id_usuario,
    name: u.nombre && u.apellido ? `${u.nombre} ${u.apellido}` : (u.nombre || 'Usuario'),
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
    studentId: p.id_usuario,
    classCredits: p.class_credits || 0,
    monthlyClayKg: parseFloat(p.monthly_clay_kg || 0),
    lastClayDeliveryDate: p.last_clay_delivery_date || null,
    isBlocked: p.bl_bloqueado || false
  };
};

// Helper para mapear reservas
const mapBookingToFE = (b) => {
  if (!b) return null;
  const dateStr = b.date instanceof Date ? b.date.toISOString().split('T')[0] : b.date;
  return {
    id: b.id_reserva,
    studentId: b.student_id,
    studentName: b.student_name,
    classId: b.class_id,
    date: dateStr,
    status: b.status
  };
};

// Helper para mapear entregas
const mapDeliveryToFE = (d) => {
  if (!d) return null;
  const dateStr = d.date instanceof Date ? d.date.toISOString().split('T')[0] : d.date;
  return {
    id: d.id_entrega,
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
    classCreditsAdded: p.class_credits_added
  };
};

// Helper para mapear alertas
const mapAlertToFE = (a) => {
  if (!a) return null;
  return {
    id: a.id_alerta,
    type: a.type,
    message: a.message,
    date: a.date,
    resolved: a.resolved
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
    id: c.id_clase,
    name: c.name || autoName,
    teacherId: c.teacher_id,
    teacherName: c.teacher_name,
    day: dayStr,
    time: timeStr,
    capacity: c.capacity,
    sucursal: sucursal
  };
};

// ==========================================
// 1. ENDPOINTS DE AUTENTICACIÓN
// ==========================================

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

  const nameParts = name.trim().split(' ');
  const nombre = nameParts[0] || 'Usuario';
  const apellido = nameParts.slice(1).join(' ') || '';
  const generatedId = crypto.randomUUID();

  try {
    // 1. Insertar el usuario en la tabla t_usuarios
    const userInsertQuery = `
      INSERT INTO public.t_usuarios 
      (id_usuario, nro_documento, clave, email, nombre, apellido, telefono, instagram, fecha_nacimiento, rol, bl_cambio_pass_pte, sucursal) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    const { rows } = await db.query(userInsertQuery, [
      generatedId,
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
        'INSERT INTO public.t_cuenta_alumno (id_usuario, saldo_actual, saldo) VALUES ($1, $2, 4)',
        [generatedId, 0]
      );
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

// Actualizar rol de un usuario
app.put('/api/users/:id/role', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({ error: 'El nuevo rol es obligatorio.' });
  }

  try {
    const { rows } = await db.query(
      'UPDATE public.t_usuarios SET rol = $1 WHERE id_usuario = $2 RETURNING *',
      [role, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // Si cambió su rol a ALUMNO y no tenía perfil creado, crearlo ahora
    if (role === 'ALUMNO') {
      const accountCheck = await db.query('SELECT * FROM public.t_cuenta_alumno WHERE id_usuario = $1', [id]);
      if (accountCheck.rows.length === 0) {
        await db.query('INSERT INTO public.t_cuenta_alumno (id_usuario, saldo_actual, saldo) VALUES ($1, 0, 4)', [id]);
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
        ca.id_usuario AS id_usuario,
        ca.saldo_actual AS class_credits,
        ca.bl_bloqueado AS bl_bloqueado,
        COALESCE(
          (SELECT COUNT(*) 
           FROM public.t_deudas_insumos d 
           WHERE d.id_usuario = ca.id_usuario 
             AND d.tipo = 'ARCILLA' 
             AND d.fec_carga >= DATE_TRUNC('month', CURRENT_DATE)
          ), 
          0
        ) AS monthly_clay_kg,
        (SELECT MAX(d.fec_carga) 
         FROM public.t_deudas_insumos d 
         WHERE d.id_usuario = ca.id_usuario 
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
       WHERE id_usuario = $2 RETURNING id_usuario`,
      [classCredits, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Perfil de estudiante no encontrado.' });
    }

    const profileQuery = `
      SELECT 
        ca.id_usuario AS id_usuario,
        ca.saldo_actual AS class_credits,
        ca.bl_bloqueado AS bl_bloqueado,
        COALESCE(
          (SELECT COUNT(*) 
           FROM public.t_deudas_insumos d 
           WHERE d.id_usuario = ca.id_usuario 
             AND d.tipo = 'ARCILLA' 
             AND d.fec_carga >= DATE_TRUNC('month', CURRENT_DATE)
          ), 
          0
        ) AS monthly_clay_kg,
        (SELECT MAX(d.fec_carga) 
         FROM public.t_deudas_insumos d 
         WHERE d.id_usuario = ca.id_usuario 
           AND d.tipo = 'ARCILLA'
        ) AS last_clay_delivery_date
      FROM public.t_cuenta_alumno ca
      WHERE ca.id_usuario = $1
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
        sucursal = $8
      WHERE id_usuario = $9
      RETURNING *
    `;
    const userRes = await db.query(updateQuery, [
      nombre,
      apellido || '',
      email,
      parseInt(nro_documento),
      telefono ? parseInt(telefono) : null,
      instagram || null,
      fecha_nacimiento || null,
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
        "SELECT id FROM public.t_sucursales WHERE LOWER(n_sucursal) = LOWER($1) LIMIT 1",
        [sucursal]
      );
      if (branchRes.rows.length > 0) {
        const branchId = branchRes.rows[0].id;
        await db.query(
          "UPDATE public.t_cuenta_alumno SET id_sucursal_preferida = $1 WHERE id_usuario = $2",
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

// Eliminar usuario en cascada
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('BEGIN');

    // 1. Eliminar reservas en t_inscripciones asociadas a la alumna
    await db.query('DELETE FROM public.t_inscripciones WHERE id_usuario = $1', [id]);

    // 2. Eliminar lista de espera
    await db.query('DELETE FROM public.t_lista_espera WHERE id_usuario = $1', [id]);

    // 3. Eliminar notificaciones
    await db.query('DELETE FROM public.t_notificaciones WHERE id_usuario = $1', [id]);

    // 4. Eliminar deudas
    await db.query('DELETE FROM public.t_deudas_insumos WHERE id_usuario = $1', [id]);

    // 5. Eliminar historial de créditos
    await db.query('DELETE FROM public.t_historial_creditos WHERE id_usuario = $1', [id]);

    // 6. Eliminar cuenta de alumno
    await db.query('DELETE FROM public.t_cuenta_alumno WHERE id_usuario = $1', [id]);

    // 7. Si es un profesor, quitar referencias en t_clases_def seteándolas a NULL
    await db.query('UPDATE public.t_clases_def SET id_profesor = NULL WHERE id_profesor = $1', [id]);

    // 8. Eliminar el usuario final
    const { rowCount } = await db.query('DELETE FROM public.t_usuarios WHERE id_usuario = $1', [id]);

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
      'UPDATE public.t_cuenta_alumno SET bl_bloqueado = $1 WHERE id_usuario = $2 RETURNING id_usuario',
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
        c.id AS id_clase,
        c.titulo AS name,
        c.id_profesor AS teacher_id,
        COALESCE(u.nombre || ' ' || u.apellido, 'Sin profesor') AS teacher_name,
        CASE c.dia_semana
          WHEN 'Miercoles' THEN 'Miércoles'
          WHEN 'Sabado' THEN 'Sábado'
          ELSE c.dia_semana
        END AS day,
        TO_CHAR(c.hora_inicio, 'HH24:MI') || ' - ' || TO_CHAR(c.hora_fin, 'HH24:MI') AS time,
        c.cupo_maximo AS capacity,
        UPPER(s.n_sucursal) AS sucursal
      FROM public.t_clases_def c
      LEFT JOIN public.t_usuarios u ON c.id_profesor = u.id_usuario
      LEFT JOIN public.t_sucursales s ON c.id_sucursal = s.id
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
        "SELECT id FROM public.t_sucursales WHERE UPPER(n_sucursal) = UPPER($1) LIMIT 1",
        [sucursal]
      );
      if (sucRes.rows.length > 0) idSucursal = sucRes.rows[0].id;
    }

    const createdClasses = [];
    const daysToCreate = repeatDays && repeatDays.length > 0 ? repeatDays : [day];

    const [startStr, endStr] = time.split(' - ');
    const hora_inicio = startStr.trim();
    const hora_fin = endStr.trim();

    for (const d of daysToCreate) {
      const generatedId = crypto.randomUUID();
      const dia_semana = d.replace('é', 'e').replace('á', 'a'); // 'Miércoles' -> 'Miercoles', 'Sábado' -> 'Sabado'
      // Titulo: si no se pasa nombre, se auto-genera vacío (el front lo muestra como día + hora)
      const titulo = name ? name.trim() : null;

      const query = `
        INSERT INTO public.t_clases_def (id, titulo, dia_semana, hora_inicio, hora_fin, cupo_maximo, id_profesor, id_sucursal, bl_activa)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        RETURNING id
      `;
      await db.query(query, [
        generatedId,
        titulo,
        dia_semana,
        hora_inicio,
        hora_fin,
        capacity,
        teacherId,
        idSucursal
      ]);

      createdClasses.push({
        id_clase: generatedId,
        name: titulo,
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

// Actualizar profesor de una clase
app.put('/api/classes/:id/teacher', async (req, res) => {
  const { id } = req.params;
  const { teacherId } = req.body;

  if (!teacherId) {
    return res.status(400).json({ error: 'El id_profesor es obligatorio.' });
  }

  try {
    const { rowCount } = await db.query(
      'UPDATE public.t_clases_def SET id_profesor = $1 WHERE id = $2',
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
        'UPDATE public.t_clases_def SET id_profesor = $1 WHERE id = ANY($2)',
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
        i.id AS id_reserva,
        i.id_usuario AS student_id,
        COALESCE(u.nombre || ' ' || u.apellido, 'Alumno') AS student_name,
        ci.id_clase_def AS class_id,
        ci.fecha_efectiva::text AS date,
        CASE i.estado
          WHEN 'RESERVADA' THEN 'CONFIRMED'
          WHEN 'ASISTIO' THEN 'ATTENDED'
          WHEN 'CANCELADA' THEN 'CANCELLED'
          ELSE i.estado
        END AS status,
        i.fec_reserva AS created_at
      FROM public.t_inscripciones i
      JOIN public.t_usuarios u ON i.id_usuario = u.id_usuario
      JOIN public.t_clases_instancia ci ON i.id_clase_instancia = ci.id
      ORDER BY ci.fecha_efectiva DESC, i.fec_reserva DESC
    `;
    const { rows } = await db.query(bookingQuery);
    res.json(rows.map(mapBookingToFE));
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    res.status(500).json({ error: 'Error al obtener reservas.' });
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
    const profileRes = await db.query('SELECT * FROM public.t_cuenta_alumno WHERE id_usuario = $1', [studentId]);
    const classRes = await db.query('SELECT * FROM public.t_clases_def WHERE id = $1', [classId]);

    if (profileRes.rows.length === 0 || classRes.rows.length === 0) {
      return res.status(400).json({ error: 'Estudiante o clase no válidos.' });
    }

    const profile = profileRes.rows[0];
    const classData = classRes.rows[0];
    const className = classData.titulo;
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
        'INSERT INTO public.t_notificaciones (id, id_usuario, titulo, mensaje, tipo, leido, created_at) VALUES ($1, NULL, $2, $3, $4, false, NOW())',
        [crypto.randomUUID(), 'Sin Créditos', alertMsg, 'NO_CREDITS']
      );

      return res.status(400).json({ error: 'No tienes créditos de clase disponibles. Contacta al administrador.' });
    }

    // 3. Obtener o crear la instancia de la clase para esa fecha
    let instanceId;
    const instanceRes = await db.query(
      'SELECT id FROM public.t_clases_instancia WHERE id_clase_def = $1 AND fecha_efectiva = $2',
      [classId, date]
    );

    if (instanceRes.rows.length > 0) {
      instanceId = instanceRes.rows[0].id;
    } else {
      const newInstanceId = crypto.randomUUID();
      await db.query(
        'INSERT INTO public.t_clases_instancia (id, id_clase_def, fecha_efectiva, bl_cancelada) VALUES ($1, $2, $3, false)',
        [newInstanceId, classId, date]
      );
      instanceId = newInstanceId;
    }

    // 4. Validar si ya tiene una reserva activa para esa clase en ese día
    const activeBookingRes = await db.query(
      "SELECT * FROM public.t_inscripciones WHERE id_usuario = $1 AND id_clase_instancia = $2 AND estado != 'CANCELADA'",
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
    const generatedId = crypto.randomUUID();
    const insertBookingQuery = `
      INSERT INTO public.t_inscripciones (id, id_usuario, id_clase_instancia, estado, fec_reserva)
      VALUES ($1, $2, $3, 'RESERVADA', NOW())
    `;
    await db.query(insertBookingQuery, [generatedId, studentId, instanceId]);

    // 7. Debitar el crédito
    await db.query(
      'UPDATE public.t_cuenta_alumno SET saldo_actual = saldo_actual - 1 WHERE id_usuario = $1',
      [studentId]
    );

    // 8. Alerta de alta ocupación si queda crítico (0 o 1 cupos libres)
    const newOccupancy = activeBookingsCount + 1;
    if (classData.cupo_maximo - newOccupancy <= 1) {
      const alertMsg = `La clase "${className}" del ${date} (${classTime}) tiene cupo crítico: solo queda ${classData.cupo_maximo - newOccupancy} lugar(es) libre(s).`;
      await db.query(
        'INSERT INTO public.t_notificaciones (id, id_usuario, titulo, mensaje, tipo, leido, created_at) VALUES ($1, NULL, $2, $3, $4, false, NOW())',
        [crypto.randomUUID(), 'Alta Ocupación', alertMsg, 'HIGH_OCCUPANCY']
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
        i.id AS id_reserva,
        i.id_usuario AS student_id,
        COALESCE(u.nombre || ' ' || u.apellido, 'Alumno') AS student_name,
        ci.id_clase_def AS class_id,
        ci.fecha_efectiva AS date,
        i.estado AS status
      FROM public.t_inscripciones i
      JOIN public.t_usuarios u ON i.id_usuario = u.id_usuario
      JOIN public.t_clases_instancia ci ON i.id_clase_instancia = ci.id
      WHERE i.id = $1
    `;
    const bookingRes = await db.query(bookingQuery, [id]);
    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada.' });
    }
    const booking = bookingRes.rows[0];

    // Obtener clase
    const classRes = await db.query('SELECT * FROM public.t_clases_def WHERE id = $1', [booking.class_id]);
    if (classRes.rows.length === 0) {
      return res.status(400).json({ error: 'La clase no es válida.' });
    }
    const classData = classRes.rows[0];
    const className = classData.titulo;
    const classTimeStr = `${classData.hora_inicio} - ${classData.hora_fin}`;

    // 2. Lógica de cálculo de tiempo (2 horas antes del inicio)
    const startTimeStr = classData.hora_inicio.toString().split(' ')[0];
    const [hours, minutes] = startTimeStr.split(':').map(Number);

    const classStartDateTime = new Date(booking.date);
    classStartDateTime.setHours(hours, minutes, 0, 0);

    const now = new Date();
    const diffMs = classStartDateTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    const isLateCancellation = forceLate || diffHours < 2;

    if (isLateCancellation) {
      // Cancelación tardía: Se cobra (se cambia a CANCELADA en la base, pero NO se reintegra el crédito)
      await db.query(
        "UPDATE public.t_inscripciones SET estado = 'CANCELADA' WHERE id = $1",
        [id]
      );

      // Crear alerta en t_notificaciones
      const alertMsg = `El alumno ${booking.student_name} realizó una cancelación tardía (menos de 2 horas) para "${className}" del ${booking.date.toISOString().split('T')[0]} a las ${startTimeStr}. Se debitó el crédito.`;
      await db.query(
        'INSERT INTO public.t_notificaciones (id, id_usuario, titulo, mensaje, tipo, leido, created_at) VALUES ($1, NULL, $2, $3, $4, false, NOW())',
        [crypto.randomUUID(), 'Cancelación Tardía', alertMsg, 'LATE_CANCELLATION']
      );
    } else {
      // Cancelación a tiempo: Se cambia a CANCELADA y se REINTEGRA el crédito
      await db.query(
        "UPDATE public.t_inscripciones SET estado = 'CANCELADA' WHERE id = $1",
        [id]
      );
      await db.query(
        'UPDATE public.t_cuenta_alumno SET saldo_actual = saldo_actual + 1 WHERE id_usuario = $1',
        [booking.student_id]
      );
    }

    res.json({ isLateCancellation });
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    res.status(500).json({ error: 'Error al cancelar la reserva.' });
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
    const bookingRes = await db.query('SELECT * FROM public.t_inscripciones WHERE id = $1', [id]);
    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada.' });
    }

    if (status === 'ATTENDED') {
      await db.query("UPDATE public.t_inscripciones SET estado = 'ASISTIO' WHERE id = $1", [id]);
    } else {
      // Ausente: Se marca como CANCELADA en la base para liberar cupo, pero NO se le reintegra el crédito
      await db.query("UPDATE public.t_inscripciones SET estado = 'CANCELADA' WHERE id = $1", [id]);
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
        d.id AS id_entrega,
        d.id_usuario AS student_id,
        COALESCE(u.nombre || ' ' || u.apellido, 'Alumno') AS student_name,
        NULL AS teacher_id,
        'Profesor' AS teacher_name,
        d.fec_carga::text AS date,
        1.00 AS quantity_kg
      FROM public.t_deudas_insumos d
      JOIN public.t_usuarios u ON d.id_usuario = u.id_usuario
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
       WHERE id_usuario = $1 AND tipo = 'ARCILLA' AND fec_carga >= DATE_TRUNC('month', CURRENT_DATE)`,
      [studentId]
    );
    const count = parseInt(clayCountRes.rows[0].count);

    if (count >= 1) {
      // Generar alerta de negocio para el admin
      const alertMsg = `El alumno ${studentName} intentó retirar otro bloque de arcilla de 1kg este mes, pero ya alcanzó su límite mensual.`;
      await db.query(
        'INSERT INTO public.t_notificaciones (id, id_usuario, titulo, mensaje, tipo, leido, created_at) VALUES ($1, NULL, $2, $3, $4, false, NOW())',
        [crypto.randomUUID(), 'Límite de Arcilla', alertMsg, 'CLAY_LIMIT']
      );

      return res.status(400).json({ error: 'Límite mensual de arcilla alcanzado (1kg por mes). No se puede entregar más arcilla.' });
    }

    // Registrar en t_deudas_insumos como entrega gratuita de arcilla mensual
    await db.query(
      `INSERT INTO public.t_deudas_insumos 
        (id, id_usuario, tipo, descripcion, peso_gramos, precio_total, bl_pagado, fec_carga)
      VALUES 
        ($1, $2, 'ARCILLA', 'Entrega de Arcilla 1kg', 1000, 0, true, NOW())`,
      [crypto.randomUUID(), studentId]
    );

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error al entregar arcilla:', error);
    res.status(500).json({ error: 'Error al registrar la entrega de arcilla.' });
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
        hc.id AS id_pago,
        hc.id_usuario AS student_id,
        (hc.cantidad * 2000) AS amount,
        hc.fec_movimiento::text AS date,
        'PAID' AS status,
        hc.cantidad AS class_credits_added
      FROM public.t_historial_creditos hc
      JOIN public.t_usuarios u ON hc.id_usuario = u.id_usuario
      ORDER BY hc.fec_movimiento DESC
    `;
    const { rows } = await db.query(paymentQuery);
    res.json(rows.map(mapPaymentToFE));
  } catch (error) {
    console.error('Error al listar pagos:', error);
    res.status(500).json({ error: 'Error al obtener pagos.' });
  }
});

// Registrar un pago manual
app.post('/api/payments', async (req, res) => {
  const { studentId, amount, creditsToAdd } = req.body;

  if (!studentId || !amount || !creditsToAdd) {
    return res.status(400).json({ error: 'Faltan parámetros del pago.' });
  }

  try {
    const profileRes = await db.query('SELECT * FROM public.t_cuenta_alumno WHERE id_usuario = $1', [studentId]);
    if (profileRes.rows.length === 0) {
      return res.status(400).json({ error: 'Perfil de estudiante no encontrado.' });
    }

    // 1. Insertar en t_historial_creditos para registro de auditoría
    await db.query(
      `INSERT INTO public.t_historial_creditos (id, id_usuario, cantidad, motivo, fec_movimiento)
       VALUES ($1, $2, $3, 'Acreditación por Pago', NOW())`,
      [crypto.randomUUID(), studentId, creditsToAdd]
    );

    // 2. Acreditar créditos en t_cuenta_alumno
    await db.query(
      'UPDATE public.t_cuenta_alumno SET saldo_actual = saldo_actual + $1 WHERE id_usuario = $2',
      [creditsToAdd, studentId]
    );

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
        id AS id_alerta,
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
  const { type, message } = req.body;

  if (!type || !message) {
    return res.status(400).json({ error: 'Tipo y mensaje obligatorios.' });
  }

  const generatedId = crypto.randomUUID();

  try {
    const { rows } = await db.query(
      `INSERT INTO public.t_notificaciones (id, id_usuario, titulo, mensaje, tipo, leido, created_at)
       VALUES ($1, NULL, $2, $3, $4, false, NOW())
       RETURNING id AS id_alerta, tipo AS type, mensaje AS message, created_at::text AS date, leido AS resolved`,
      [generatedId, type, message, type]
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
      `UPDATE public.t_notificaciones SET leido = true WHERE id = $1
       RETURNING id AS id_alerta, tipo AS type, mensaje AS message, created_at::text AS date, leido AS resolved`,
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

// Inicializar tabla si no existe (con auto-healing/migración)
db.query(`
  CREATE TABLE IF NOT EXISTS public.t_dias_no_laborales (
    fecha DATE PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL DEFAULT 'inamovible',
    nombre VARCHAR(255) NOT NULL DEFAULT 'Feriado / Cerrado'
  );
`).then(() => {
  console.log('✓ Tabla public.t_dias_no_laborales verificada/creada con éxito.');
}).catch(async () => {
  // Si hay conflicto de tipos (por ejemplo, si ya existía como VARCHAR), la migramos de forma segura
  try {
    console.log('🔄 Migrando tabla public.t_dias_no_laborales al estándar de producción...');
    await db.query('DROP TABLE IF EXISTS public.t_dias_no_laborales CASCADE');
    await db.query(`
      CREATE TABLE public.t_dias_no_laborales (
        fecha DATE PRIMARY KEY,
        tipo VARCHAR(50) NOT NULL DEFAULT 'inamovible',
        nombre VARCHAR(255) NOT NULL DEFAULT 'Feriado / Cerrado'
      );
    `);
    console.log('✓ Tabla public.t_dias_no_laborales migrada con éxito.');
  } catch (err) {
    console.error('❌ Error al migrar tabla de días no laborales:', err);
  }
});

// Listar días no laborales
app.get('/api/non-working-days', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha, 
        tipo, 
        nombre, 
        nombre AS motivo 
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
  const { fecha, motivo, nombre, tipo } = req.body;
  if (!fecha) {
    return res.status(400).json({ error: 'La fecha es obligatoria.' });
  }
  try {
    const valNombre = nombre || motivo || 'Feriado / Cerrado';
    const valTipo = tipo || 'inamovible';
    await db.query(
      `INSERT INTO public.t_dias_no_laborales (fecha, tipo, nombre)
       VALUES ($1, $2, $3)
       ON CONFLICT (fecha) DO UPDATE SET nombre = EXCLUDED.nombre, tipo = EXCLUDED.tipo`,
      [fecha, valTipo, valNombre]
    );
    res.status(201).json({ success: true, fecha, nombre: valNombre, tipo: valTipo, motivo: valNombre });
  } catch (error) {
    console.error('Error al guardar día no laboral:', error);
    res.status(500).json({ error: 'Error al registrar día no laboral.' });
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
// INICIAR SERVIDOR
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend de Casa Tuti corriendo en http://localhost:${PORT}`);
});
