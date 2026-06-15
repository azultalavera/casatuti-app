import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import InicioTab from './InicioTab';
import TurnosTab from './TurnosTab';
import CreditosTab from './CreditosTab';
import PerfilTab from './PerfilTab';
import NotificationsIcon from '@mui/icons-material/Notifications';

const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_NUM = { Domingo: 0, Lunes: 1, Martes: 2, 'Miércoles': 3, Jueves: 4, Viernes: 5, Sábado: 6 };

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
  return null;
}

export default function AlumnoView({ activeTab = 'inicio' }) {
  const {
    currentUser,
    studentProfiles,
    classes,
    bookings,
    bookClass,
    cancelBooking,
    requestStudentPayment,
    alerts,
    waitlist,
    joinWaitlistAction,
    packs,
    branches,
    resolveAlertAction,
  } = useApp();

  // --- Estado de Turnos ---
  const todayNum = new Date().getDay();
  const defaultDay = DAYS_OF_WEEK.find(d => DAY_NUM[d] >= (todayNum === 0 ? 1 : todayNum)) || 'Lunes';
  const [selectedDay, setSelectedDay] = useState(defaultDay);
  const [bookingError, setBookingError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // --- Estado de Créditos / Compra ---
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyStep, setBuyStep] = useState(1);
  const [selectedPackId, setSelectedPackId] = useState(null);
  const [buyLoading, setBuyLoading] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  const activePacks = packs;
  const selectedPack = activePacks.find(p => p.id === selectedPackId) || activePacks[0] || null;

  // --- Datos derivados ---
  const profile = studentProfiles.find(p => p.studentId === currentUser.id) || {
    classCredits: 0, monthlyClayKg: 0
  };

  const myBookings = bookings.filter(
    b => b.studentId === currentUser.id && b.status === 'CONFIRMED'
  );

  const myAlerts = alerts.filter(
    a => a.studentId === currentUser.id && !a.resolved
  );

  const weekDays = useMemo(() => {
    return DAYS_OF_WEEK.map(day => {
      const date = getWeekDate(day);
      const hasTurns = classes.some(c => c.day === day);
      return { day, date, available: !!date, hasTurns };
    });
  }, [classes]);

  const selectedDate = getWeekDate(selectedDay);

  const studentBranch = currentUser.sucursal ? currentUser.sucursal.toUpperCase() : null;
  const classesForDay = classes.filter(c => c.day === selectedDay);
  const byBranch = branches
    .filter(branch => !studentBranch || branch.name === studentBranch)
    .map(branch => ({
      branch: branch.name,
      items: classesForDay.filter(c => (c.sucursal || '').toUpperCase() === branch.name)
    }))
    .filter(g => g.items.length > 0);

  const weekLabel = useMemo(() => {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const dn = hoy.getDay();
    const lun = new Date(hoy); lun.setDate(hoy.getDate() - (dn === 0 ? 6 : dn - 1));
    const sab = new Date(lun); sab.setDate(lun.getDate() + 5);
    return `${lun.getDate()}/${lun.getMonth() + 1} – ${sab.getDate()}/${sab.getMonth() + 1}`;
  }, []);

  // --- Handlers ---
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

  const handleBuy = async () => {
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
  };

  return (
    <>
      <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="badge badge-clay" style={{ marginBottom: '6px' }}>Alumno activo</span>
            <h2 style={{ fontSize: '26px' }}>¡Hola, {currentUser.name}!</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
            {/* Icono de notificaciones */}
            <div 
              onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
              style={{
                position: 'relative',
                cursor: 'pointer',
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: 'var(--blanco)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                color: 'var(--gris-oscuro)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                border: '1px solid var(--gris-claro)'
              }}
              title="Notificaciones"
            >
              <NotificationsIcon style={{ fontSize: '22px' }} />
              {myAlerts.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  backgroundColor: 'var(--rojo-alerta)',
                  color: 'var(--blanco)',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--blanco)'
                }}>
                  {myAlerts.length}
                </span>
              )}
            </div>

            {/* Dropdown de notificaciones */}
            {showNotificationsDropdown && (
              <div style={{
                position: 'absolute',
                top: '52px',
                right: '0',
                width: '320px',
                maxHeight: '350px',
                backgroundColor: 'var(--blanco)',
                borderRadius: '16px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                border: '1px solid var(--gris-claro)',
                zIndex: 1000,
                padding: '16px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--gris-claro)', paddingBottom: '8px' }}>
                  <span style={{ fontWeight: '800', color: 'var(--gris-oscuro)', fontSize: '14px' }}>Notificaciones</span>
                  {myAlerts.length > 0 && (
                    <button 
                      onClick={async () => {
                        for (const alert of myAlerts) {
                          await resolveAlertAction(alert.id);
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--verde-oliva-dark)',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Limpiar todo
                    </button>
                  )}
                </div>
                {myAlerts.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--gris-medio)', fontSize: '13px', padding: '16px 0' }}>
                    No tienes notificaciones pendientes.
                  </div>
                ) : (
                  myAlerts.map(alert => (
                    <div 
                      key={alert.id} 
                      style={{ 
                        padding: '8px 10px', 
                        borderRadius: '8px', 
                        backgroundColor: '#fcfcfc', 
                        borderLeft: '4px solid var(--verde-oliva)',
                        fontSize: '12px',
                        color: 'var(--gris-oscuro)',
                        position: 'relative'
                      }}
                    >
                      <div style={{ fontWeight: '700', marginBottom: '2px' }}>{alert.title || 'Alerta'}</div>
                      <div style={{ paddingRight: '16px' }}>{alert.message}</div>
                      <button
                        onClick={() => resolveAlertAction(alert.id)}
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                          color: 'var(--gris-medio)',
                          fontWeight: 'bold'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Avatar */}
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
        </div>

        {activeTab === 'inicio' && (
          <InicioTab
            currentUser={currentUser}
            profile={profile}
            myBookings={myBookings}
            myAlerts={myAlerts}
            bookingError={bookingError}
            successMessage={successMessage}
            classes={classes}
            onCancel={handleCancel}
            onOpenBuyModal={() => { setBuyStep(1); setShowBuyModal(true); }}
          />
        )}

        {activeTab === 'turnos' && (
          <TurnosTab
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            weekDays={weekDays}
            weekLabel={weekLabel}
            selectedDate={selectedDate}
            byBranch={byBranch}
            bookings={bookings}
            classes={classes}
            onBook={handleBook}
            bookingError={bookingError}
            successMessage={successMessage}
            waitlist={waitlist}
            onJoinWaitlist={joinWaitlistAction}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'creditos' && (
          <CreditosTab
            currentUser={currentUser}
            activePacks={activePacks}
            selectedPackId={selectedPackId}
            setSelectedPackId={setSelectedPackId}
            selectedPack={selectedPack}
            buyStep={buyStep}
            setBuyStep={setBuyStep}
            buyLoading={buyLoading}
            onBuy={handleBuy}
          />
        )}

        {activeTab === 'perfil' && (
          <PerfilTab />
        )}

      </div>

      {/* Modal de Compra de Créditos (desde Inicio) */}
      {showBuyModal && (
        <div className="modal-overlay" onClick={() => !buyLoading && setShowBuyModal(false)}>
          <div className="modal-content animate-scale-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', color: 'var(--gris-oscuro)' }}>
                {buyStep === 1 ? 'Comprar créditos' : 'Realizar transferencia'}
              </h2>
              <button onClick={() => !buyLoading && setShowBuyModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--gris-medio)' }}>×</button>
            </div>
            <CreditosTab
              currentUser={currentUser}
              activePacks={activePacks}
              selectedPackId={selectedPackId}
              setSelectedPackId={setSelectedPackId}
              selectedPack={selectedPack}
              buyStep={buyStep}
              setBuyStep={buyStep === 2 ? () => setShowBuyModal(false) : setBuyStep}
              buyLoading={buyLoading}
              onBuy={handleBuy}
            />
          </div>
        </div>
      )}
    </>
  );
}
