import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EventIcon from '@mui/icons-material/Event';

const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_ABBR = { Lunes: 'LUN', Martes: 'MAR', 'Miércoles': 'MIÉ', Jueves: 'JUE', Viernes: 'VIE', Sábado: 'SÁB' };
const DAY_NUM = { Domingo: 0, Lunes: 1, Martes: 2, 'Miércoles': 3, Jueves: 4, Viernes: 5, Sábado: 6 };

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
    cancelBooking,
    requestStudentPayment,
    alerts,
    packs,
    branches
  } = useApp();

  // Estado principal: qué día está seleccionado
  const todayNum = new Date().getDay(); // 0=Dom
  const defaultDay = DAYS_OF_WEEK.find(d => DAY_NUM[d] >= (todayNum === 0 ? 1 : todayNum)) || 'Lunes';
  const [selectedDay, setSelectedDay] = useState(defaultDay);

  const [bookingError, setBookingError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modal de Compra de Créditos
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyStep, setBuyStep] = useState(1);
  const activePacks = packs;
  const [selectedPackId, setSelectedPackId] = useState(null);
  const [buyLoading, setBuyLoading] = useState(false);

  // Derive selected pack object
  const selectedPack = activePacks.find(p => p.id === selectedPackId) || activePacks[0] || null;

  const profile = studentProfiles.find(p => p.studentId === currentUser.id) || {
    classCredits: 0, monthlyClayKg: 0
  };

  const myBookings = bookings.filter(
    b => b.studentId === currentUser.id && b.status === 'CONFIRMED'
  );

  const myAlerts = alerts.filter(
    a => a.studentId === currentUser.id && !a.resolved
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
  const studentBranch = currentUser.sucursal ? currentUser.sucursal.toUpperCase() : null;
  const classesForDay = classes.filter(c => c.day === selectedDay);
  const byBranch = branches
    .filter(branch => !studentBranch || branch.name === studentBranch)
    .map(branch => ({
      branch: branch.name,
      items: classesForDay.filter(c => (c.sucursal || '').toUpperCase() === branch.name)
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
    const booking = bookings.find(b => b.id === bookingId);
    const classData = classes.find(c => c.id === booking.classId);
    const [h, m] = (classData.time.split(' - ')[0]).split(':').map(Number);
    const classStart = new Date(booking.date);
    classStart.setHours(h, m, 0, 0);
    const diffHours = (classStart - new Date()) / 3600000;
    const isLate = diffHours < 2;
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
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const dn = hoy.getDay();
    const lun = new Date(hoy); lun.setDate(hoy.getDate() - (dn === 0 ? 6 : dn - 1));
    const sab = new Date(lun); sab.setDate(lun.getDate() + 5);
    return `${lun.getDate()}/${lun.getMonth() + 1} – ${sab.getDate()}/${sab.getMonth() + 1}`;
  }, []);

  return (
    <>
      <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="badge badge-clay" style={{ marginBottom: '6px' }}>Alumno activo</span>
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

        {/* Resumen (Estilo Dashboard) */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gris-oscuro)' }}>Mi resumen</h3>
            <button 
              onClick={() => { setBuyStep(1); setShowBuyModal(true); }}
              className="btn-tuti" 
              style={{ fontSize: '12px', padding: '8px 14px', width: 'auto', backgroundColor: 'var(--gris-oscuro)', color: 'var(--blanco)', border: 'none', borderRadius: '20px' }}
            >
              + Comprar
            </button>
          </div>
          <div className="stats-dashboard-grid">
            {/* Card Clases (Grande) */}
            <div className="stat-card-modern stat-card-modern-large" style={{ backgroundColor: 'var(--card-mustard)' }}>
              <div className="stat-card-modern-icon">
                <span style={{ fontSize: '24px' }}>🎫</span>
              </div>
              <div className="stat-card-modern-content">
                <div className="stat-card-modern-number">{profile.classCredits}</div>
                <div className="stat-card-modern-label">Clases<br/>disponibles</div>
              </div>
            </div>

            {/* Card Arcilla */}
            <div className="stat-card-modern" style={{ backgroundColor: 'var(--card-sage)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="stat-card-modern-content">
                  <div className="stat-card-modern-number">{profile.monthlyClayKg} <span style={{fontSize: '14px', fontWeight: 600}}>kg</span></div>
                  <div className="stat-card-modern-label">Arcilla<br/>retirada</div>
                </div>
                <div className="stat-card-modern-icon" style={{ width: '40px', height: '40px' }}>
                   <span style={{ fontSize: '18px' }}>🏺</span>
                </div>
              </div>
            </div>

            {/* Card Progreso Arcilla */}
            <div className="stat-card-modern" style={{ backgroundColor: 'var(--blanco)', color: 'var(--gris-oscuro)', padding: '16px 20px' }}>
              <div className="stat-card-modern-content" style={{ justifyContent: 'center', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px', fontWeight: 700 }}>
                  <span style={{ color: 'var(--gris-medio)' }}>Límite arcilla</span>
                  <span style={{ color: 'var(--verde-oliva)' }}>{profile.monthlyClayKg}kg / 1kg</span>
                </div>
                <div className="progress-bar-container" style={{ height: '6px', backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: '10px' }}>
                  <div className="progress-bar-fill" style={{ width: `${Math.min(100, profile.monthlyClayKg * 100)}%`, backgroundColor: 'var(--card-sage)', borderRadius: '10px', height: '100%' }} />
                </div>
                <span style={{ fontSize: '10px', color: profile.monthlyClayKg >= 1 ? 'var(--card-rust)' : 'var(--gris-medio)', marginTop: '8px', fontWeight: profile.monthlyClayKg >= 1 ? 800 : 600 }}>
                  {profile.monthlyClayKg >= 1 ? 'Límite alcanzado.' : 'Bloque 1kg disponible.'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas */}
        {bookingError && (
          <div className="alert-banner danger animate-slide-up"><span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><WarningAmberIcon style={{ fontSize: '18px' }} /> {bookingError}</span></div>
        )}
        {successMessage && (
          <div className="alert-banner info animate-slide-up"><span>{successMessage}</span></div>
        )}
        {myAlerts.map(a => (
          <div key={a.id} className="alert-banner info animate-slide-up">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><NotificationsIcon style={{ fontSize: '18px' }} /> {a.message}</span>
          </div>
        ))}

        {/* Reservas Activas */}
        <div>
          <h3 style={{ fontSize: '18px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Mis reservas activas
            <span className="badge badge-oliva">{myBookings.length}</span>
          </h3>
          {myBookings.length === 0 ? (
            <div className="clay-card" style={{ textAlign: 'center', padding: '24px 20px', color: 'var(--gris-medio)' }}>
              <p style={{ fontSize: '14px', fontStyle: 'italic', margin: 0 }}>No tienes reservas activas.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {myBookings.map(b => {
                const cd = classes.find(c => c.id === b.classId) || {};
                return (
                  <div key={b.id} style={{ padding: '20px', borderRadius: '28px', backgroundColor: 'var(--blanco)', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gris-oscuro)', margin: 0 }}>
                        {cd.day} · {cd.time}
                      </h4>
                      <p style={{ fontSize: '13px', color: 'var(--gris-medio)', marginTop: '4px', fontWeight: 600 }}>
                        <LocationOnIcon style={{ fontSize: '14px', verticalAlign: 'text-bottom' }} /> {cd.sucursal} · Prof. {cd.teacherName}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '12px', backgroundColor: 'var(--card-sage)', color: 'var(--blanco)' }}>Confirmada</span>
                      <button
                        onClick={() => handleCancel(b.id)}
                        style={{ background: 'transparent', border: 'none', fontSize: '12px', color: 'var(--rojo-alerta)', fontWeight: 800, cursor: 'pointer', padding: 0 }}
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
            <h3 style={{ fontSize: '18px' }}>Reservar turno</h3>
            <span style={{
              fontSize: '11px', fontWeight: 600, color: 'var(--marron-arcilla)',
              backgroundColor: 'var(--bg-crema)', padding: '4px 10px',
              borderRadius: '20px', border: '1px solid var(--gris-claro)'
            }}>
              <EventIcon style={{ fontSize: '16px' }} /> {weekLabel}
            </span>
          </div>

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
                    backgroundColor: isSelected
                      ? 'var(--card-rust)'
                      : isPast
                        ? 'transparent'
                        : 'var(--blanco)',
                    color: isSelected
                      ? 'var(--blanco)'
                      : isPast
                        ? 'var(--gris-claro)'
                        : 'var(--gris-oscuro)',
                    cursor: isPast ? 'default' : 'pointer',
                    opacity: isPast ? 0.5 : 1,
                    boxShadow: isSelected ? '0 8px 24px rgba(204, 122, 66, 0.3)' : (isPast ? 'none' : '0 4px 16px rgba(0,0,0,0.03)'),
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
                      <LocationOnIcon style={{ fontSize: '12px' }} /> {branch}
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
                          style={{
                            padding: '18px 20px',
                            borderRadius: '24px',
                            backgroundColor: 'var(--blanco)',
                            border: 'none',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                            opacity: full ? 0.6 : 1,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'transform 0.2s ease'
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--gris-oscuro)', letterSpacing: '-0.5px' }}>
                              {c.time}
                            </span>
                            <p style={{ fontSize: '13px', color: 'var(--gris-medio)', marginTop: '4px', fontWeight: 600 }}>
                              Prof. {c.teacherName}
                            </p>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: full ? 'var(--rojo-alerta)' : 'var(--gris-medio)' }}>
                              {full ? 'Sin cupos' : `${occ.free} lugar${occ.free !== 1 ? 'es' : ''}`}
                            </span>
                            <button
                              onClick={() => handleBook(c.id)}
                              disabled={full}
                              style={{ 
                                padding: '8px 16px', 
                                fontSize: '13px', 
                                fontWeight: 800,
                                borderRadius: '20px',
                                border: 'none',
                                backgroundColor: full ? 'rgba(0,0,0,0.05)' : 'var(--gris-oscuro)',
                                color: full ? 'var(--gris-medio)' : 'var(--blanco)',
                                cursor: full ? 'default' : 'pointer'
                              }}
                            >
                              Reservar
                            </button>
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

      {/* Modal de Compra de Créditos */}
      {showBuyModal && (
        <div className="modal-overlay" onClick={() => !buyLoading && setShowBuyModal(false)}>
          <div className="modal-content animate-scale-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', color: 'var(--gris-oscuro)' }}>
                {buyStep === 1 ? 'Comprar créditos' : 'Realizar transferencia'}
              </h2>
              <button onClick={() => !buyLoading && setShowBuyModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--gris-medio)' }}>×</button>
            </div>

            {buyStep === 1 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '13px', color: 'var(--gris-medio)', margin: 0 }}>Elegí tu pack de clases:</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activePacks.length === 0 && <p style={{ fontSize: '13px', color: 'var(--gris-medio)' }}>No hay paquetes disponibles en este momento.</p>}
                  {activePacks.map(pack => (
                    <div
                      key={pack.id}
                      onClick={() => setSelectedPackId(pack.id)}
                      style={{
                        padding: '16px 20px',
                        borderRadius: '24px',
                        border: 'none',
                        backgroundColor: (selectedPackId === pack.id || (!selectedPackId && selectedPack?.id === pack.id)) ? 'var(--bg-crema)' : 'var(--blanco)',
                        boxShadow: (selectedPackId === pack.id || (!selectedPackId && selectedPack?.id === pack.id)) ? '0 0 0 2px var(--marron-arcilla)' : '0 4px 16px rgba(0,0,0,0.03)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--gris-oscuro)' }}>{pack.name} ({pack.credits} clases)</span>
                      </div>
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--marron-arcilla)' }}>
                        ${pack.price.toLocaleString('es-AR')}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                  <button onClick={() => setShowBuyModal(false)} className="btn-tuti btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                  <button
                    onClick={async () => {
                      if (!selectedPack) return;
                      setBuyLoading(true);
                      try {
                        await requestStudentPayment(currentUser.id, selectedPack.price, selectedPack.credits);
                        setBuyStep(2);
                      } catch (err) {
                        alert(err.message);
                      } finally {
                        setBuyLoading(false);
                      }
                    }}
                    disabled={buyLoading || !selectedPack}
                    className="btn-tuti btn-primary-clay"
                    style={{ flex: 1 }}
                  >
                    {buyLoading ? 'Procesando...' : 'Continuar'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ backgroundColor: 'var(--bg-crema)', padding: '24px', borderRadius: '24px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
                  <p style={{ fontSize: '13px', color: 'var(--gris-medio)', marginBottom: '4px' }}>Total a transferir:</p>
                  <p style={{ fontSize: '32px', fontWeight: 800, color: 'var(--marron-arcilla)', margin: 0 }}>${selectedPack?.price.toLocaleString('es-AR')}</p>
                </div>

                <div style={{ backgroundColor: 'var(--blanco)', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.02)', padding: '20px', borderRadius: '24px', textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', marginBottom: '12px' }}><strong>Datos bancarios:</strong></p>
                  <p style={{ fontSize: '13px', marginBottom: '8px' }}>CBU: <code style={{ backgroundColor: '#f0f0f0', padding: '4px 8px', borderRadius: '8px', wordBreak: 'break-all' }}>0000000000000000000000</code></p>
                  <p style={{ fontSize: '13px', marginBottom: '8px' }}>Alias: <code style={{ backgroundColor: '#f0f0f0', padding: '4px 8px', borderRadius: '8px', wordBreak: 'break-all' }}>CASA.TUTI</code></p>
                  <p style={{ fontSize: '13px', margin: 0 }}>Titular: Casa Tuti</p>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--gris-medio)', margin: '4px 0', textAlign: 'center' }}>
                  Enviá el comprobante por WhatsApp para acreditar tus clases.
                </p>

                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <a
                    href="https://wa.me/5493517371575?text=Hola,%20acabo%20de%20realizar%20una%20transferencia%20para%20comprar%20clases."
                    target="_blank"
                    rel="noreferrer"
                    className="btn-tuti"
                    style={{ backgroundColor: '#25D366', color: 'white', textAlign: 'center', textDecoration: 'none' }}
                  >
                    Enviar comprobante por WhatsApp
                  </a>
                  <button onClick={() => setShowBuyModal(false)} className="btn-tuti btn-secondary">
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
