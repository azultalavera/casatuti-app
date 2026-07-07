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
  myBookings,
  classes,
  onBook,
  onCancel,
  onReschedule,
  bookingError,
  successMessage,
  waitlist = [],
  onJoinWaitlist,
  currentUser,
  initialRescheduleBookingId,
  clearInitialReschedule,
}) {
  const [expandedClassId, setExpandedClassId] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('reservar');
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [bookingToReschedule, setBookingToReschedule] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('Todos');

  const [rescheduleSelectedDay, setRescheduleSelectedDay] = useState(weekDays.find(w => w.available)?.day || 'Lunes');

  const getOccupancyInfo = (classId, dateStr) => {
    const cd = classes.find(c => c.id === classId);
    if (!cd || !dateStr) return { occupied: 0, free: cd?.capacity || 0 };
    const occupied = bookings.filter(
      b => b.classId === classId && b.date === dateStr &&
        (b.status === 'CONFIRMED' || b.status === 'ATTENDED')
    ).length;
    return { occupied, free: cd.capacity - occupied };
  };

  const historyBookings = bookings.filter(b => b.studentId === currentUser?.id).sort((a,b) => new Date(b.date) - new Date(a.date));

  const availableMonths = React.useMemo(() => {
    const months = new Set();
    historyBookings.forEach(b => {
      if (b.date) {
        const d = new Date(b.date + 'T00:00:00');
        months.add(d.toLocaleString('es-ES', { month: 'long', year: 'numeric' }));
      }
    });
    return ['Todos', ...Array.from(months)];
  }, [historyBookings]);

  const filteredHistory = React.useMemo(() => {
    if (selectedMonth === 'Todos') return historyBookings;
    return historyBookings.filter(b => {
      if (!b.date) return false;
      const d = new Date(b.date + 'T00:00:00');
      const mStr = d.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
      return mStr === selectedMonth;
    });
  }, [historyBookings, selectedMonth]);

  const openRescheduleModal = (booking) => {
    setBookingToReschedule(booking);
    setRescheduleModalOpen(true);
  };

  React.useEffect(() => {
    if (initialRescheduleBookingId) {
      const b = historyBookings.find(x => x.id === initialRescheduleBookingId);
      if (b) {
        setActiveSubTab('historial');
        openRescheduleModal(b);
      }
      if (clearInitialReschedule) clearInitialReschedule();
    }
  }, [initialRescheduleBookingId, historyBookings, clearInitialReschedule]);

  const executeReschedule = (newClassId, newDateStr) => {
    if (onReschedule && bookingToReschedule) {
      onReschedule(bookingToReschedule.id, newClassId, newDateStr);
      setRescheduleModalOpen(false);
      setBookingToReschedule(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--gris-claro)' }}>
        <button
          onClick={() => setActiveSubTab('reservar')}
          style={{
            padding: '10px 16px', border: 'none', background: 'none',
            fontSize: '14px', fontWeight: activeSubTab === 'reservar' ? 800 : 600,
            color: activeSubTab === 'reservar' ? 'var(--verde-oliva-dark)' : 'var(--gris-medio)',
            borderBottom: activeSubTab === 'reservar' ? '3px solid var(--verde-oliva-dark)' : '3px solid transparent',
            cursor: 'pointer'
          }}
        >
          Reservar turno
        </button>
        <button
          onClick={() => setActiveSubTab('historial')}
          style={{
            padding: '10px 16px', border: 'none', background: 'none',
            fontSize: '14px', fontWeight: activeSubTab === 'historial' ? 800 : 600,
            color: activeSubTab === 'historial' ? 'var(--verde-oliva-dark)' : 'var(--gris-medio)',
            borderBottom: activeSubTab === 'historial' ? '3px solid var(--verde-oliva-dark)' : '3px solid transparent',
            cursor: 'pointer'
          }}
        >
          Mi historial
        </button>
      </div>

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

      {activeSubTab === 'reservar' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '18px' }}>Turnos disponibles</h3>
            <span style={{
              fontSize: '11px', fontWeight: 600, color: 'var(--marron-arcilla)',
              backgroundColor: 'var(--bg-crema)', padding: '4px 10px',
              borderRadius: '20px', border: '1px solid var(--gris-claro)'
            }}>
              <EventIcon style={{ fontSize: '16px' }} /> {weekLabel}
            </span>
          </div>

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
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    marginBottom: '10px', paddingBottom: '6px',
                    borderBottom: '2px solid var(--verde-oliva-light)'
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--verde-oliva-dark)', letterSpacing: '0.5px' }}>
                      <LocationOnIcon style={{ fontSize: '12px' }} /> {branch}
                    </span>
                  </div>

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
                              
                              {/* Mostrar estado de reserva o botones */}
                              {(() => {
                                const myBooking = myBookings?.find(b => b.classId === c.id && b.date === selectedDate && b.status === 'CONFIRMED');
                                
                                if (myBooking) {
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                      <span style={{
                                        fontSize: '11px', fontWeight: 800, color: 'var(--verde-oliva)',
                                        backgroundColor: '#EBF1ED', padding: '4px 10px', borderRadius: '12px'
                                      }}>
                                        ✓ Reservada
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onCancel(myBooking.id);
                                        }}
                                        style={{
                                          padding: '6px 14px', fontSize: '12px', fontWeight: 700,
                                          borderRadius: '20px', border: '1px solid var(--rojo-alerta)',
                                          backgroundColor: 'transparent', color: 'var(--rojo-alerta)', cursor: 'pointer'
                                        }}
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  );
                                }

                                if (full) {
                                  return isWaitlisted ? (
                                    <button
                                      disabled
                                      style={{
                                        padding: '8px 16px', fontSize: '13px', fontWeight: 800,
                                        borderRadius: '20px', border: 'none',
                                        backgroundColor: '#EBF1ED', color: '#2E4A3F', cursor: 'default'
                                      }}
                                    >
                                      En espera
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => onJoinWaitlist(c.id, selectedDate)}
                                      style={{
                                        padding: '8px 16px', fontSize: '13px', fontWeight: 800,
                                        borderRadius: '20px', border: 'none',
                                        backgroundColor: 'var(--gris-oscuro)', color: 'var(--blanco)', cursor: 'pointer'
                                      }}
                                    >
                                      Lista de espera
                                    </button>
                                  );
                                }

                                return (
                                  <button
                                    onClick={() => onBook(c.id)}
                                    style={{
                                      padding: '8px 16px', fontSize: '13px', fontWeight: 800,
                                      borderRadius: '20px', border: 'none',
                                      backgroundColor: 'var(--gris-oscuro)', color: 'var(--blanco)', cursor: 'pointer'
                                    }}
                                  >
                                    Reservar
                                  </button>
                                );
                              })()}
                            </div>
                          </div>

                          {expandedClassId === c.id && classBookings.length > 0 && (
                            <div style={{
                              borderTop: '1px solid #ECEFEC', paddingTop: '12px', fontSize: '12px',
                              display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeIn 0.2s ease-in-out'
                            }}>
                              <div style={{ fontWeight: '700', color: '#0F3B32' }}>Alumnas anotadas:</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {classBookings.map((b, idx) => (
                                  <span
                                    key={idx}
                                    style={{
                                      backgroundColor: '#F3F6F4', color: '#2E4A3F',
                                      padding: '4px 10px', borderRadius: '10px',
                                      fontSize: '11px', fontWeight: '500'
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
        </>
      )}

      {activeSubTab === 'historial' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '16px', margin: 0, color: 'var(--verde-oliva-dark)' }}>Filtro por mes</h3>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '12px',
                border: '1px solid var(--gris-claro)',
                backgroundColor: 'var(--blanco)',
                color: 'var(--verde-oliva-dark)',
                fontSize: '14px',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              {availableMonths.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="clay-card" style={{ textAlign: 'center', padding: '24px 20px', color: 'var(--gris-medio)' }}>
              <p style={{ fontSize: '14px', fontStyle: 'italic', margin: 0 }}>No hay turnos registrados en este mes.</p>
            </div>
          ) : (
            filteredHistory.map(b => {
              const cd = classes.find(c => c.id === b.classId) || {};
              const isActive = b.status === 'CONFIRMED' && new Date(b.date + 'T23:59:59') >= new Date();
              const isPast = b.status === 'CONFIRMED' && new Date(b.date + 'T23:59:59') < new Date();
              
              let statusLabel = 'Reservada';
              let statusColor = 'var(--verde-oliva)';
              if (b.status === 'ATTENDED') { statusLabel = 'Asistió'; statusColor = 'var(--verde-oliva-dark)'; }
              else if (b.status === 'CANCELLED' && b.rescheduledTo) { statusLabel = 'Reprogramada'; statusColor = 'var(--marron-arcilla)'; }
              else if (b.status === 'CANCELLED' || b.status === 'CANCELLED_LATE') { statusLabel = 'Cancelada'; statusColor = 'var(--rojo-alerta)'; }
              else if (b.status === 'ABSENT') { statusLabel = 'Ausente'; statusColor = 'var(--rojo-alerta)'; }
              else if (isPast) { statusLabel = 'Pasada (Sin Asistencia)'; statusColor = 'var(--gris-medio)'; }

              // Data de Reprogramación
              let rescheduledText = null;
              if (b.rescheduledTo) {
                const newB = bookings.find(x => x.id === b.rescheduledTo);
                if (newB) {
                  const newC = classes.find(c => c.id === newB.classId) || {};
                  rescheduledText = `Reprogramaste para el ${newC.day} ${newB.date?.split('-').reverse().join('/')} a las ${newC.time}`;
                }
              }
              if (b.rescheduledFrom) {
                const oldB = bookings.find(x => x.id === b.rescheduledFrom);
                if (oldB) {
                  const oldC = classes.find(c => c.id === oldB.classId) || {};
                  rescheduledText = `Reprogramada desde la clase del ${oldC.day} ${oldB.date?.split('-').reverse().join('/')} a las ${oldC.time}`;
                }
              }

              return (
                <div key={b.id} style={{
                  padding: '20px', borderRadius: '28px', backgroundColor: 'var(--blanco)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gris-oscuro)', margin: 0 }}>
                        {cd.day} {b.date ? `${b.date.split('-')[2]}/${b.date.split('-')[1]}` : ''} · {cd.time}
                      </h4>
                      <p style={{ fontSize: '13px', color: 'var(--gris-medio)', marginTop: '4px', fontWeight: 600, marginBottom: 0 }}>
                        <LocationOnIcon style={{ fontSize: '14px', verticalAlign: 'text-bottom' }} /> {cd.sucursal} · Prof. {cd.teacherName}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '12px', border: `1px solid ${statusColor}`, color: statusColor }}>
                        {statusLabel}
                      </span>
                    </div>
                  </div>

                  {rescheduledText && (
                    <div style={{ fontSize: '12px', color: 'var(--marron-arcilla)', backgroundColor: 'var(--bg-crema)', padding: '6px 10px', borderRadius: '8px', fontWeight: 600 }}>
                      ℹ️ {rescheduledText}
                    </div>
                  )}

                  {isActive && (
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                      {(() => {
                        const classStartDateTime = new Date(`${b.date}T${cd.time.split(' - ')[0]}:00`);
                        const hoursDiff = (classStartDateTime - new Date()) / (1000 * 60 * 60);
                        const canReschedule = hoursDiff > 2;
                        return canReschedule && (
                          <button
                            onClick={() => openRescheduleModal(b)}
                            style={{ background: 'transparent', border: '1px solid var(--marron-arcilla)', borderRadius: '16px', fontSize: '12px', color: 'var(--marron-arcilla)', fontWeight: 800, cursor: 'pointer', padding: '6px 12px' }}
                          >
                            Reprogramar
                          </button>
                        );
                      })()}
                      <button
                        onClick={() => onCancel(b.id)}
                        style={{ background: 'transparent', border: 'none', fontSize: '12px', color: 'var(--rojo-alerta)', fontWeight: 800, cursor: 'pointer', padding: '6px 12px' }}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL REPROGRAMAR */}
      {rescheduleModalOpen && bookingToReschedule && (
        <div className="modal-overlay" onClick={() => setRescheduleModalOpen(false)}>
          <div className="modal-content animate-scale-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '20px', color: 'var(--gris-oscuro)', marginBottom: '16px' }}>Reprogramar turno</h2>
            <p style={{ fontSize: '14px', color: 'var(--gris-medio)', marginBottom: '16px' }}>
              Seleccioná un nuevo día y horario para reprogramar tu clase.
            </p>

            <div className="alumno-days-wrapper" style={{ marginBottom: '16px', flexShrink: 0 }}>
              {weekDays.map(({ day, date, available }) => {
                const isSelected = rescheduleSelectedDay === day;
                const isPast = !available;
                return (
                  <button
                    key={day}
                    onClick={() => available && setRescheduleSelectedDay(day)}
                    className="alumno-day-btn"
                    style={{
                      backgroundColor: isSelected ? 'var(--card-rust)' : isPast ? 'transparent' : 'var(--blanco)',
                      color: isSelected ? 'var(--blanco)' : isPast ? 'var(--gris-claro)' : 'var(--gris-oscuro)',
                      cursor: isPast ? 'default' : 'pointer',
                      opacity: isPast ? 0.5 : 1,
                      padding: '8px',
                      minWidth: '48px'
                    }}
                  >
                    <span style={{ fontSize: '10px', fontWeight: 800 }}>{DAY_ABBR[day]}</span>
                    <span style={{ fontSize: '15px', fontWeight: 700 }}>{date ? new Date(date + 'T00:00:00').getDate() : '—'}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              {classes.filter(c => {
                const origClass = classes.find(orig => orig.id === bookingToReschedule?.classId);
                const dateStr = weekDays.find(w => w.day === rescheduleSelectedDay)?.date;
                const isAlreadyEnrolled = myBookings?.some(b => b.classId === c.id && b.date === dateStr && b.status === 'CONFIRMED');
                const isSameSlot = bookingToReschedule?.classId === c.id && bookingToReschedule?.date === dateStr;
                return c.day === rescheduleSelectedDay && origClass && c.sucursal === origClass.sucursal && !isAlreadyEnrolled && !isSameSlot;
              }).map(c => {
                const dateStr = weekDays.find(w => w.day === rescheduleSelectedDay)?.date;
                const occ = getOccupancyInfo(c.id, dateStr);
                const isFull = occ.free <= 0;
                
                return (
                  <div key={c.id} style={{
                    padding: '12px', border: '1px solid var(--gris-claro)', borderRadius: '12px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    opacity: isFull ? 0.5 : 1
                  }}>
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--gris-oscuro)' }}>{c.time}</div>
                      <div style={{ fontSize: '12px', color: 'var(--gris-medio)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.sucursal} - Prof. {c.teacherName}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: isFull ? 'var(--rojo-alerta)' : 'var(--verde-oliva-dark)' }}>
                        {isFull ? 'Agotado' : `${occ.free} lugares`}
                      </span>
                      {!isFull && (
                        <button
                          onClick={() => executeReschedule(c.id, dateStr)}
                          style={{
                            marginTop: '6px', background: 'var(--marron-arcilla)', color: 'var(--blanco)', border: 'none',
                            padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                            transition: 'background 0.2s ease', whiteSpace: 'nowrap'
                          }}
                        >
                          Confirmar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {classes.filter(c => c.day === rescheduleSelectedDay).length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--gris-medio)', fontSize: '13px', fontStyle: 'italic', padding: '10px' }}>
                  No hay clases este día.
                </div>
              )}
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                onClick={() => setRescheduleModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--gris-medio)', fontWeight: 700, cursor: 'pointer', padding: '8px 16px' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
