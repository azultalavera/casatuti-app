import React, { useState } from 'react';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EventIcon from '@mui/icons-material/Event';

const DAY_ABBR = { Lunes: 'LUN', Martes: 'MAR', 'Miércoles': 'MIÉ', Jueves: 'JUE', Viernes: 'VIE', Sábado: 'SÁB' };

export default function TurnosTab({
  selectedDay,
  setSelectedDay,
  weekDays,
  weekLabel,
  selectedDate,
  byBranch,
  bookings,
  classes,
  onBook,
  bookingError,
  successMessage,
  waitlist = [],
  onJoinWaitlist,
  currentUser,
}) {
  const [expandedClassId, setExpandedClassId] = useState(null);

  const getOccupancyInfo = (classId, dateStr) => {
    const cd = classes.find(c => c.id === classId);
    if (!cd || !dateStr) return { occupied: 0, free: cd?.capacity || 0 };
    const occupied = bookings.filter(
      b => b.classId === classId && b.date === dateStr &&
        (b.status === 'CONFIRMED' || b.status === 'ATTENDED')
    ).length;
    return { occupied, free: cd.capacity - occupied };
  };

  return (
    <div>
      {/* Header con semana */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={{ fontSize: '18px' }}>Reservar turno</h3>
        <span style={{
          fontSize: '11px', fontWeight: 600, color: 'var(--marron-arcilla)',
          backgroundColor: 'var(--bg-crema)', padding: '4px 10px',
          borderRadius: '20px', border: '1px solid var(--gris-claro)'
        }}>
          <EventIcon style={{ fontSize: '16px' }} /> {weekLabel}
        </span>
      </div>

      {/* Alertas inline */}
      {bookingError && (
        <div className="alert-banner danger animate-slide-up" style={{ marginBottom: '12px' }}>
          {bookingError}
        </div>
      )}
      {successMessage && (
        <div className="alert-banner info animate-slide-up" style={{ marginBottom: '12px' }}>
          {successMessage}
        </div>
      )}

      {/* Mini-cards de días */}
      <div className="alumno-days-wrapper">
        {weekDays.map(({ day, date, available, hasTurns }) => {
          const isSelected = selectedDay === day;
          const isPast = !available;
          return (
            <button
              key={day}
              onClick={() => available && setSelectedDay(day)}
              className="alumno-day-btn"
              style={{
                backgroundColor: isSelected ? 'var(--card-rust)' : isPast ? 'transparent' : 'var(--blanco)',
                color: isSelected ? 'var(--blanco)' : isPast ? 'var(--gris-claro)' : 'var(--gris-oscuro)',
                cursor: isPast ? 'default' : 'pointer',
                opacity: isPast ? 0.5 : 1,
                boxShadow: isSelected ? '0 8px 24px rgba(204, 122, 66, 0.3)' : (isPast ? 'none' : '0 4px 16px rgba(0,0,0,0.03)'),
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.5px' }}>
                {DAY_ABBR[day]}
              </span>
              <span style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-serif)', lineHeight: 1 }}>
                {date ? new Date(date + 'T00:00:00').getDate() : '—'}
              </span>
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
                  <LocationOnIcon style={{ fontSize: '12px' }} /> {branch}
                </span>
              </div>

              {/* Cards de turnos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {items.map(c => {
                  const classBookings = bookings.filter(
                    b => b.classId === c.id && b.date === selectedDate &&
                      (b.status === 'CONFIRMED' || b.status === 'ATTENDED')
                  );
                  const occ = getOccupancyInfo(c.id, selectedDate);
                  const full = occ.free <= 0;
                  const isWaitlisted = waitlist.some(
                    w => w.studentId === currentUser?.id && w.classId === c.id && w.date === selectedDate && !w.notified
                  );
                  return (
                    <div
                      key={c.id}
                      style={{
                        borderRadius: '24px',
                        backgroundColor: 'var(--blanco)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                        padding: '18px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {/* Fila principal */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div style={{ flex: 1, paddingRight: '12px' }}>
                          <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--gris-oscuro)', letterSpacing: '-0.5px' }}>
                            {c.time}
                          </span>
                          <p style={{ fontSize: '13px', color: 'var(--gris-medio)', marginTop: '4px', fontWeight: 600, marginBottom: '0px' }}>
                            Prof. {c.teacherName}
                          </p>
                          {classBookings.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedClassId(expandedClassId === c.id ? null : c.id);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '11px',
                                color: 'var(--verde-oliva-dark)',
                                backgroundColor: '#EBF1ED',
                                padding: '5px 12px',
                                borderRadius: '12px',
                                marginTop: '8px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              👥 {classBookings.length} {classBookings.length === 1 ? 'inscripta' : 'inscriptas'} {expandedClassId === c.id ? '▲' : '▼'}
                            </button>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: full ? 'var(--rojo-alerta)' : 'var(--gris-medio)' }}>
                            {full ? 'Sin cupos' : `${occ.free} lugar${occ.free !== 1 ? 'es' : ''}`}
                          </span>
                          {full ? (
                            isWaitlisted ? (
                              <button
                                disabled
                                style={{
                                  padding: '8px 16px',
                                  fontSize: '13px',
                                  fontWeight: 800,
                                  borderRadius: '20px',
                                  border: 'none',
                                  backgroundColor: '#EBF1ED',
                                  color: '#2E4A3F',
                                  cursor: 'default'
                                }}
                              >
                                En espera
                              </button>
                            ) : (
                              <button
                                onClick={() => onJoinWaitlist(c.id, selectedDate)}
                                style={{
                                  padding: '8px 16px',
                                  fontSize: '13px',
                                  fontWeight: 800,
                                  borderRadius: '20px',
                                  border: 'none',
                                  backgroundColor: 'var(--gris-oscuro)',
                                  color: 'var(--blanco)',
                                  cursor: 'pointer'
                                }}
                              >
                                Lista de espera
                              </button>
                            )
                          ) : (
                            <button
                              onClick={() => onBook(c.id)}
                              style={{
                                padding: '8px 16px',
                                fontSize: '13px',
                                  fontWeight: 800,
                                  borderRadius: '20px',
                                  border: 'none',
                                  backgroundColor: 'var(--gris-oscuro)',
                                  color: 'var(--blanco)',
                                  cursor: 'pointer'
                              }}
                            >
                              Reservar
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Desplegable de inscriptas */}
                      {expandedClassId === c.id && classBookings.length > 0 && (
                        <div style={{
                          borderTop: '1px solid #ECEFEC',
                          paddingTop: '12px',
                          fontSize: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          animation: 'fadeIn 0.2s ease-in-out'
                        }}>
                          <div style={{ fontWeight: '700', color: '#0F3B32' }}>Alumnas anotadas:</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {classBookings.map((b, idx) => (
                              <span
                                key={idx}
                                style={{
                                  backgroundColor: '#F3F6F4',
                                  color: '#2E4A3F',
                                  padding: '4px 10px',
                                  borderRadius: '10px',
                                  fontSize: '11px',
                                  fontWeight: '500'
                                }}
                              >
                                {b.studentName}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
