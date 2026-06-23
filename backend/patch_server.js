import fs from 'fs';

let content = fs.readFileSync('server.js', 'utf8');

content = content.replace(
  "    date: dateStr,\n    status: b.status\n  };",
  "    date: dateStr,\n    status: b.status,\n    rescheduledTo: b.id_reprogramada_hacia,\n    rescheduledFrom: b.id_reprogramada_desde\n  };"
);

content = content.replace(
  "        END AS status,\n        i.fec_reserva AS created_at\n      FROM public.t_inscripciones i",
  "        END AS status,\n        i.fec_reserva AS created_at,\n        i.id_reprogramada_hacia,\n        i.id_reprogramada_desde\n      FROM public.t_inscripciones i"
);

const newEndpoint = `    res.json({ isLateCancellation });
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
    const insertBookingQuery = \`
      INSERT INTO public.t_inscripciones (id_usuarios, id_clase_instancia, estado, fec_reserva, id_reprogramada_desde)
      VALUES ($1, $2, 'RESERVADA', NOW(), $3)
      RETURNING id_inscripcion
    \`;
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
});`;

content = content.replace(
  `    res.json({ isLateCancellation });
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    res.status(500).json({ error: 'Error al cancelar la reserva.' });
  }
});`,
  newEndpoint
);

fs.writeFileSync('server.js', content);
console.log('patched');
