import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import InicioTab from './InicioTab';
import TurnosTab from './TurnosTab';
import CreditosTab from './CreditosTab';
import PerfilTab from './PerfilTab';

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

export default function AlumnoView({ activeTab = 'inicio', setActiveTab }) {
  const {
    currentUser,
    studentProfiles,
    classes,
    bookings,
    bookClass,
    cancelBooking,
    rescheduleBooking,
    requestStudentPayment,
    alerts,
    waitlist,
    joinWaitlistAction,
    packs,
    branches,
    resolveAlertAction,
    payments,
    bakes,
  } = useApp();

  // --- Estado de Turnos ---
  const todayNum = new Date().getDay();
  const defaultDay = DAYS_OF_WEEK.find(d => DAY_NUM[d] >= (todayNum === 0 ? 1 : todayNum)) || 'Lunes';
  const [selectedDay, setSelectedDay] = useState(defaultDay);
  const [bookingError, setBookingError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [initialRescheduleBookingId, setInitialRescheduleBookingId] = useState(null);

  // --- Estado de Créditos / Compra ---
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyStep, setBuyStep] = useState(1);
  const [selectedPackId, setSelectedPackId] = useState(null);
  const [buyLoading, setBuyLoading] = useState(false);
  const activePacks = packs;
  const selectedPack = activePacks.find(p => p.id === selectedPackId) || activePacks[0] || null;

  // --- Datos derivados ---
  const profile = studentProfiles.find(p => p.studentId === currentUser.id) || {
    classCredits: 0, monthlyClayKg: 0
  };

  const myBookings = bookings.filter(
    b => b.studentId === currentUser.id && b.status === 'CONFIRMED' && new Date(b.date + 'T23:59:59') >= new Date()
  ).sort((a, b) => {
    const dateDiff = new Date(a.date) - new Date(b.date);
    if (dateDiff !== 0) return dateDiff;
    const classA = classes.find(c => c.id === a.classId);
    const classB = classes.find(c => c.id === b.classId);
    return (classA?.time || '').localeCompare(classB?.time || '');
  });

  const myAlerts = alerts.filter(
    a => a.studentId === currentUser.id && !a.resolved
  );

  const weekDays = useMemo(() => {
    return DAYS_OF_WEEK.map(day => {
      const date = getWeekDate(day);
      let hasTurns = false;
      
      if (date) {
        hasTurns = classes.some(c => {
          if (c.day !== day) return false;
          const startTimeStr = (c.time || '00:00').split(' - ')[0];
          const [hours, minutes] = startTimeStr.split(':').map(Number);
          
          const classStartTime = new Date(`${date}T00:00:00`);
          classStartTime.setHours(hours, minutes, 0, 0);

          const now = new Date();
          const diffMs = classStartTime.getTime() - now.getTime();
          return diffMs >= 300000;
        });
      }

      return { day, date, available: !!date, hasTurns };
    }).filter(d => d.hasTurns);
  }, [classes]);

  useEffect(() => {
    if (weekDays.length > 0 && !weekDays.find(w => w.day === selectedDay)) {
      setSelectedDay(weekDays[0].day);
    }
  }, [weekDays, selectedDay]);

  const selectedDate = getWeekDate(selectedDay);

  const studentBranch = currentUser.sucursal ? currentUser.sucursal.toUpperCase() : null;
  const classesForDay = classes.filter(c => {
    if (c.day !== selectedDay) return false;
    if (!selectedDate) return false;

    const startTimeStr = (c.time || '00:00').split(' - ')[0];
    const [hours, minutes] = startTimeStr.split(':').map(Number);
    
    const classStartTime = new Date(`${selectedDate}T00:00:00`);
    classStartTime.setHours(hours, minutes, 0, 0);

    const now = new Date();
    const diffMs = classStartTime.getTime() - now.getTime();
    
    // Solo mostrar si faltan 5 minutos o más (300000 ms = 5 min)
    return diffMs >= 300000;
  });
  const byBranch = branches
    .filter(branch => !studentBranch || branch.name.toUpperCase() === studentBranch)
    .map(branch => ({
      branch: branch.name,
      items: classesForDay.filter(c => (c.sucursal || '').toUpperCase() === branch.name.toUpperCase())
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
    const classStart = new Date(booking.date + 'T00:00:00');
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

  const handleReschedule = async (bookingId, newClassId, newDateStr) => {
    try {
      await rescheduleBooking(bookingId, newClassId, newDateStr);
      setSuccessMessage('¡Reserva reprogramada con éxito!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setBookingError(err.message);
      setTimeout(() => setBookingError(''), 5000);
    }
  };

  return (
    <>
      <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Cabecera */}
        {activeTab !== 'creditos' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="badge badge-clay" style={{ marginBottom: '6px' }}>Alumno activo</span>
              <h2 style={{ fontSize: '26px' }}>
                {activeTab === 'inicio' ? `¡Hola, ${currentUser.name}!` : activeTab === 'turnos' ? 'Turnos' : 'Mi perfil'}
              </h2>
            </div>
          </div>
        )}

        {activeTab === 'inicio' && (
          <InicioTab
            currentUser={currentUser}
            profile={profile}
            bookings={bookings}
            myBookings={myBookings}
            myAlerts={myAlerts}
            bookingError={bookingError}
            successMessage={successMessage}
            classes={classes}
            payments={payments}
            bakes={bakes}
            resolveAlertAction={resolveAlertAction}
            onCancel={handleCancel}
            onReprogramar={(bId) => {
              setInitialRescheduleBookingId(bId);
              if (setActiveTab) setActiveTab('turnos');
            }}
            onOpenBuyModal={() => { setBuyStep(1); setShowBuyModal(true); }}
            onGoToTurnos={() => { if (setActiveTab) setActiveTab('turnos'); }}
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
            myBookings={myBookings}
            classes={classes}
            onBook={handleBook}
            onCancel={handleCancel}
            onReschedule={handleReschedule}
            initialRescheduleBookingId={initialRescheduleBookingId}
            clearInitialReschedule={() => setInitialRescheduleBookingId(null)}
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
            profile={profile}
            activePacks={activePacks}
            selectedPackId={selectedPackId}
            setSelectedPackId={setSelectedPackId}
            selectedPack={selectedPack}
            buyStep={buyStep}
            setBuyStep={setBuyStep}
            buyLoading={buyLoading}
            onBuy={handleBuy}
            payments={payments}
            bakes={bakes}
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
              profile={profile}
              activePacks={activePacks}
              selectedPackId={selectedPackId}
              setSelectedPackId={setSelectedPackId}
              selectedPack={selectedPack}
              buyStep={buyStep}
              setBuyStep={buyStep === 2 ? () => setShowBuyModal(false) : setBuyStep}
              buyLoading={buyLoading}
              onBuy={handleBuy}
              payments={payments}
              isModal={true}
            />
          </div>
        </div>
      )}
    </>
  );
}
