import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';

const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_ABBR    = { Lunes: 'LUN', Martes: 'MAR', 'Miércoles': 'MIÉ', Jueves: 'JUE', Viernes: 'VIE', Sábado: 'SÁB' };
const DAY_NUM     = { Domingo: 0, Lunes: 1, Martes: 2, 'Miércoles': 3, Jueves: 4, Viernes: 5, Sábado: 6 };

// Dado un nombre de día (Lunes…Sábado), devuelve su fecha YYYY-MM-DD dentro de la semana actual.
// Retorna null si ese día ya pasó.
function getWeekDate(dayName) {
  const targetNum = DAY_NUM[dayName];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayNum = today.getDay();
  const offset = targetNum - todayNum;
  if (offset >= 0 && targetNum >= 1 && targetNum <= 6) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    return d.toISOString().split('T')[0];
  }
  return null; // ya pasó
}

export default function AlumnoView() {
  const {
    currentUser,
    studentProfiles,
    classes,
    bookings,
    bookClass,
    cancelBooking
  } = useApp();

  // Estado principal: qué día está seleccionado
  const todayNum = new Date().getDay(); // 0=Dom
  const defaultDay = DAYS_OF_WEEK.find(d => DAY_NUM[d] >= (todayNum === 0 ? 1 : todayNum)) || 'Lunes';
  const [selectedDay, setSelectedDay] = useState(defaultDay);

  const [bookingError, setBookingError]     = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const profile = studentProfiles.find(p => p.studentId === currentUser.id) || {
    classCredits: 0, monthlyClayKg: 0
  };

  const myBookings = bookings.filter(
    b => b.studentId === currentUser.id && b.status === 'CONFIRMED'
  );

  // Días de la semana actual (hoy → sábado), con su fecha y si tiene turnos
  const weekDays = useMemo(() => {
    return DAYS_OF_WEEK.map(day => {
      const date = getWeekDate(day);
      const hasTurns = classes.some(c => c.day === day);
      return { day, date, available: !!date, hasTurns };
    });
  }, [classes]);

  // Fecha del día seleccionado
  const selectedDate = getWeekDate(selectedDay);

  // Turnos del día seleccionado, agrupados por sucursal
  const classesForDay = classes.filter(c => c.day === selectedDay);
  const byBranch = ['CENTRO', 'ALTO VERDE'].map(branch => ({
    branch,
    items: classesForDay.filter(c => (c.sucursal || '').toUpperCase() === branch)
  })).filter(g => g.items.length > 0);

  const getOccupancyInfo = (classId, dateStr) => {
    const cd = classes.find(c => c.id === classId);
    if (!cd || !dateStr) return { occupied: 0, free: cd?.capacity || 0 };
    const occupied = bookings.filter(
      b => b.classId === classId && b.date === dateStr &&
           (b.status === 'CONFIRMED' || b.status === 'ATTENDED')
    ).length;
    return { occupied, free: cd.capacity - occupied };
  };

  const handleBook = async (classId) => {
    setBookingError('');
    setSuccessMessage('');
    if (!selectedDate) {
      setBookingError('Este día ya pasó esta semana.');
      return;
    }
    try {
      await bookClass(classId, selectedDate);
      setSuccessMessage('¡Reserva confirmada con éxito!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setBookingError(err.message);
      setTimeout(() => setBookingError(''), 5000);
    }
  };

  const handleCancel = async (bookingId) => {
    const booking   = bookings.find(b => b.id === bookingId);
    const classData = classes.find(c => c.id === booking.classId);
    const [h, m]    = (classData.time.split(' - ')[0]).split(':').map(Number);
    const classStart = new Date(booking.date);
    classStart.setHours(h, m, 0, 0);
    const diffHours  = (classStart - new Date()) / 3600000;
    const isLate     = diffHours < 2;
    const msg = isLate
      ? '⚠️ Faltan menos de 2 horas. Perderás el crédito. ¿Continuar?'
      : '¿Cancelar esta reserva?';
    if (!window.confirm(msg)) return;
    try {
      const res = await cancelBooking(bookingId, isLate);
      alert(res.isLateCancellation ? 'Cancelación tardía. Crédito debitado.' : 'Reserva cancelada. Crédito reintegrado.');
    } catch (err) {
      alert(err.message);
    }
  };

  // Semana formateada
  const weekLabel = useMemo(() => {
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const dn  = hoy.getDay();
    const lun = new Date(hoy); lun.setDate(hoy.getDate() - (dn === 0 ? 6 : dn - 1));
    const sab = new Date(lun); sab.setDate(lun.getDate() + 5);
    return `${lun.getDate()}/${lun.getMonth()+1} – ${sab.getDate()}/${sab.getMonth()+1}`;
  }, []);

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="badge badge-clay" style={{ marginBottom: '6px' }}>Alumno Activo</span>
          <h2 style={{ fontSize: '26px' }}>¡Hola, {currentUser.name}!</h2>
        </div>
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%',
          backgroundColor: 'var(--verde-oliva)', color: 'var(--blanco)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 'bold',
          boxShadow: 'var(--shadow-clay)'
        }}>
          {currentUser.name[0]}
        </div>
      </div>

      {/* Créditos y Arcilla */}
      <div className="clay-card accent-clay">
        <div style={{ display: 'flex', gap: '16px', marginBottom: '18px' }}>
          <div style={{ flex: 1, backgroundColor: 'var(--bg-crema)', padding: '14px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--gris-medio)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>CLASES DISPONIBLES</span>
            <span style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', fontWeight: 'bold', color: 'var(--marron-arcilla)' }}>
              {profile.classCredits}
            </span>
          </div>
          <div style={{ flex: 1, backgroundColor: 'var(--bg-crema)', padding: '14px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--gris-medio)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>ARCILLA RETIRADA</span>
            <span style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', fontWeight: 'bold', color: 'var(--verde-oliva-dark)' }}>
              {profile.monthlyClayKg} <span style={{ fontSize: '14px' }}>kg</span>
            </span>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', fontWeight: 600 }}>
            <span style={{ color: 'var(--gris-medio)' }}>Límite de Arcilla Mensual</span>
            <span style={{ color: 'var(--marron-arcilla)' }}>{profile.monthlyClayKg}kg / 1kg</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${Math.min(100, profile.monthlyClayKg * 100)}%` }} />
          </div>
          <span style={{ fontSize: '11px', color: profile.monthlyClayKg >= 1 ? 'var(--rojo-alerta)' : 'var(--gris-medio)', marginTop: '6px', display: 'block', fontWeight: profile.monthlyClayKg >= 1 ? 600 : 400 }}>
            {profile.monthlyClayKg >= 1 ? '✓ Bloque mensual de 1kg retirado con éxito.' : 'El profesor te entregará tu bloque de 1kg durante el taller.'}
          </span>
        </div>
      </div>

      {/* Alertas */}
      {bookingError && (
        <div className="alert-banner danger animate-slide-up"><span>⚠️ {bookingError}</span></div>
      )}
      {successMessage && (
        <div className="alert-banner info animate-slide-up"><span>{successMessage}</span></div>
      )}

      {/* Reservas Activas */}
      <div>
        <h3 style={{ fontSize: '18px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Mis Reservas Activas
          <span className="badge badge-oliva">{myBookings.length}</span>
        </h3>
        {myBookings.length === 0 ? (
          <div className="clay-card" style={{ textAlign: 'center', padding: '24px 20px', color: 'var(--gris-medio)' }}>
            <p style={{ fontSize: '14px', fontStyle: 'italic' }}>No tienes reservas activas.</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>Elegí un día abajo para reservar tu turno.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {myBookings.map(b => {
              const cd = classes.find(c => c.id === b.classId) || {};
              return (
                <div key={b.id} className="clay-card animate-slide-up" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 600 }}>
                        {cd.day} · {cd.time}
                      </h4>
                      <p style={{ fontSize: '12px', color: 'var(--gris-medio)', marginTop: '2px' }}>
                        📍 {cd.sucursal} · Prof. {cd.teacherName}
                      </p>
                    </div>
                    <span className="badge badge-oliva">Confirmada</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--gris-claro)' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gris-oscuro)' }}>{b.date}</span>
                    <button
                      onClick={() => handleCancel(b.id)}
                      className="btn-tuti btn-secondary"
                      style={{ width: 'auto', padding: '8px 12px', fontSize: '12px', borderColor: 'var(--rojo-alerta)', color: 'var(--rojo-alerta)' }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========== RESERVAR TURNO ========== */}
      <div>
        {/* Header con semana */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '18px' }}>Reservar Turno</h3>
          <span style={{
            fontSize: '11px', fontWeight: 600, color: 'var(--marron-arcilla)',
            backgroundColor: 'var(--bg-crema)', padding: '4px 10px',
            borderRadius: '20px', border: '1px solid var(--gris-claro)'
          }}>
            📅 {weekLabel}
          </span>
        </div>

        {/* Mini-cards de días */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
          {weekDays.map(({ day, date, available, hasTurns }) => {
            const isSelected = selectedDay === day;
            const isPast     = !available;
            return (
              <button
                key={day}
                onClick={() => available && setSelectedDay(day)}
                style={{
                  flex: '0 0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '10px 14px',
                  borderRadius: '14px',
                  border: isSelected
                    ? '2px solid var(--verde-oliva)'
                    : '2px solid var(--gris-claro)',
                  backgroundColor: isSelected
                    ? 'var(--verde-oliva)'
                    : isPast
                      ? 'var(--bg-crema)'
                      : 'var(--blanco)',
                  color: isSelected
                    ? 'var(--blanco)'
                    : isPast
                      ? 'var(--gris-claro)'
                      : 'var(--gris-oscuro)',
                  cursor: isPast ? 'default' : 'pointer',
                  opacity: isPast ? 0.5 : 1,
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? 'var(--shadow-clay)' : 'none',
                  minWidth: '52px'
                }}
              >
                {/* Abreviatura del día */}
                <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.5px' }}>
                  {DAY_ABBR[day]}
                </span>
                {/* Número del día */}
                <span style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-serif)', lineHeight: 1 }}>
                  {date ? new Date(date + 'T00:00:00').getDate() : '—'}
                </span>
                {/* Dot si tiene turnos */}
                {hasTurns && !isPast && (
                  <span style={{
                    width: '5px', height: '5px', borderRadius: '50%',
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--verde-oliva)',
                    display: 'block'
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Turnos del día seleccionado */}
        {!selectedDate ? (
          <div className="clay-card" style={{ textAlign: 'center', padding: '20px', color: 'var(--gris-medio)' }}>
            <p style={{ fontSize: '13px', fontStyle: 'italic' }}>Este día ya pasó. Seleccioná otro día.</p>
          </div>
        ) : byBranch.length === 0 ? (
          <div className="clay-card" style={{ textAlign: 'center', padding: '20px', color: 'var(--gris-medio)' }}>
            <p style={{ fontSize: '13px', fontStyle: 'italic' }}>No hay turnos disponibles este día.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {byBranch.map(({ branch, items }) => (
              <div key={branch}>
                {/* Header sucursal */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  marginBottom: '10px', paddingBottom: '6px',
                  borderBottom: '2px solid var(--verde-oliva-light)'
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--verde-oliva-dark)', letterSpacing: '0.5px' }}>
                    📍 {branch}
                  </span>
                </div>

                {/* Cards de turnos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {items.map(c => {
                    const occ = getOccupancyInfo(c.id, selectedDate);
                    const full = occ.free <= 0;
                    return (
                      <div
                        key={c.id}
                        className="clay-card animate-slide-up"
                        style={{
                          padding: '14px 16px',
                          borderLeft: `4px solid ${full ? 'var(--gris-claro)' : 'var(--verde-oliva)'}`,
                          opacity: full ? 0.7 : 1
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {/* Info del turno */}
                          <div>
                            <span style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--gris-oscuro)' }}>
                              {c.time}
                            </span>
                            <p style={{ fontSize: '11px', color: 'var(--gris-medio)', marginTop: '2px' }}>
                              Prof. {c.teacherName}
                            </p>
                          </div>

                          {/* Cupos + botón */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                            <span className={`badge ${full ? 'badge-danger' : occ.free <= 2 ? 'badge-danger' : 'badge-oliva'}`}>
                              {full ? 'Sin cupos' : `${occ.free} lugar${occ.free !== 1 ? 'es' : ''}`}
                            </span>
                            <button
                              onClick={() => handleBook(c.id)}
                              disabled={full}
                              className={`btn-tuti ${full ? 'btn-disabled' : 'btn-primary-oliva'}`}
                              style={{ padding: '7px 14px', fontSize: '12px', width: 'auto' }}
                            >
                              {full ? 'Sin cupos' : 'Reservar'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
