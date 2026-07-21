import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { formatDateDDMMYYYY } from '../../utils/dateUtils';
import GroupIcon from '@mui/icons-material/Group';
import LocationOnIcon from '@mui/icons-material/LocationOn';

// Días y meses para formateo
const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function InicioTabProfe({ 
  currentUser, 
  classes, 
  bookings, 
  users, 
  studentProfiles,
  takeAttendance, 
  deliverClayToStudent,
  bookClassForStudent,
  createBake,
  createExtraClay,
  setActiveTab
}) {
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  const [studentActionMenu, setStudentActionMenu] = useState(null);
  const [bakeModal, setBakeModal] = useState({ isOpen: false, studentId: null, studentName: null, description: '', price: '', paymentMethod: 'PENDIENTE', amountCash: '', amountTransfer: '' });
  const [clayModal, setClayModal] = useState({ isOpen: false, studentId: null, studentName: null, quantity: '' });

  // Filtrar las clases asignadas a este profesor
  const myClasses = classes.filter(c => c.teacherId === currentUser.id);

  // Calcular la próxima clase
  const nextClassData = useMemo(() => {
    if (myClasses.length === 0) return null;

    const now = new Date();
    let candidates = [];

    // Buscar en los próximos 7 días
    for (let i = 0; i < 7; i++) {
      const dateToCheck = new Date();
      dateToCheck.setDate(now.getDate() + i);
      const dayName = DAYS[dateToCheck.getDay()];
      
      const dayClasses = myClasses.filter(c => c.day === dayName);
      
      for (const c of dayClasses) {
        // c.time formato "10:00 - 12:00"
        const startStr = c.time.split(' - ')[0] || c.time;
        const [hours, mins] = startStr.split(':');
        
        const classStart = new Date(dateToCheck);
        classStart.setHours(parseInt(hours, 10), parseInt(mins || 0, 10), 0, 0);

        // Si la clase es hoy, mostramos las que están transcurriendo (margen de 2 horas)
        // o las que están por venir.
        const classEnd = new Date(classStart);
        classEnd.setHours(classEnd.getHours() + 2);

        if (classEnd > now) {
          const dateStr = `${dateToCheck.getFullYear()}-${String(dateToCheck.getMonth() + 1).padStart(2, '0')}-${String(dateToCheck.getDate()).padStart(2, '0')}`;
          candidates.push({
            classId: c.id,
            classObj: c,
            dateObj: classStart,
            dateStr: dateStr,
            displayDate: formatDateDDMMYYYY(classStart)
          });
        }
      }
    }

    candidates.sort((a, b) => a.dateObj - b.dateObj);
    return candidates.length > 0 ? candidates[0] : null;
  }, [myClasses]);

  // Obtener inscripciones para la próxima clase
  const nextClassBookings = useMemo(() => {
    if (!nextClassData) return [];
    return bookings.filter(b => 
      b.classId === nextClassData.classId && 
      b.date === nextClassData.dateStr &&
      b.status !== 'CANCELLED' && b.status !== 'CANCELLED_LATE'
    );
  }, [bookings, nextClassData]);

  // Alumnos que pueden ser agregados
  const availableStudentsToAdd = useMemo(() => {
    if (!users) return [];
    const enrolledIds = nextClassBookings.map(b => b.studentId);
    return users.filter(u => 
      u.role === 'ALUMNO' && 
      !enrolledIds.includes(u.id) &&
      // Sólo alumnos con perfil activo y créditos
      studentProfiles?.find(p => p.studentId === u.id && p.classCredits > 0 && !p.isBlocked)
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [users, nextClassBookings, studentProfiles]);

  const handleAddStudentAndMarkPresent = async () => {
    if (!selectedStudentToAdd || !nextClassData) return;
    try {
      setIsAddingStudent(true);
      // 1. Reservar la clase para la alumna
      const newBooking = await bookClassForStudent(
        Number(selectedStudentToAdd), 
        nextClassData.classId, 
        nextClassData.dateStr
      );
      // 2. Marcar asistencia inmediatamente
      if (newBooking && newBooking.id) {
        await takeAttendance(newBooking.id, 'ATTENDED');
      }
      setSelectedStudentToAdd('');
      alert("Alumno/a agregado/a y marcado/a como presente con éxito.");
    } catch (error) {
      alert("Error al agregar alumno/a: " + error.message);
    } finally {
      setIsAddingStudent(false);
    }
  };

  const handleToggleAttendance = async (booking) => {
    const newStatus = booking.status === 'ATTENDED' ? 'CONFIRMED' : 'ATTENDED';
    try {
      await takeAttendance(booking.id, newStatus);
    } catch (err) {
      alert("Error al actualizar asistencia: " + err.message);
    }
  };

  const handleToggleClay = async (b, currentClayValue) => {
    if (currentClayValue) {
      alert("La arcilla ya fue entregada y registrada para esta clase.");
      return;
    }
    try {
      await deliverClayToStudent(
        b.studentId, 
        b.studentName, 
        currentUser.id, 
        currentUser.nombre || currentUser.name
      );
      alert("Arcilla registrada exitosamente.");
    } catch (err) {
      alert("Error al actualizar arcilla: " + err.message);
    }
  };

  const handleRegisterBake = async (e) => {
    e.preventDefault();
    if (!bakeModal.description || !bakeModal.price) return;
    try {
      let finalDescription = bakeModal.description;
      if (bakeModal.paymentMethod === 'CONTADO') {
        finalDescription += ' (Pagado en Efectivo)';
      } else if (bakeModal.paymentMethod === 'TRANSF') {
        finalDescription += ' (Pagado por Transferencia)';
      } else if (bakeModal.paymentMethod === 'COMBINADO') {
        finalDescription += ` (Pago Combinado: $${bakeModal.amountCash || 0} Efvo, $${bakeModal.amountTransfer || 0} Transf)`;
      }

      await createBake({
        studentId: bakeModal.studentId,
        description: finalDescription,
        price: parseFloat(bakeModal.price)
      });
      alert(`Horneado registrado con éxito para ${bakeModal.studentName}.`);
      setBakeModal({ isOpen: false, studentId: null, studentName: null, description: '', price: '', paymentMethod: 'PENDIENTE', amountCash: '', amountTransfer: '' });
    } catch (err) {
      alert("Error al registrar horneado: " + err.message);
    }
  };

  const handleRegisterClay = async (e) => {
    e.preventDefault();
    if (!clayModal.quantity) return;
    try {
      await createExtraClay({
        studentId: clayModal.studentId,
        quantity: clayModal.quantity
      });
      alert(`Arcilla extra registrada con éxito para ${clayModal.studentName}. (Pendiente de cobro)`);
      setClayModal({ isOpen: false, studentId: null, studentName: null, quantity: '' });
    } catch (err) {
      alert("Error al registrar arcilla extra: " + err.message);
    }
  };

  const [showAllClassesModal, setShowAllClassesModal] = useState(false);
  const [filterDay, setFilterDay] = useState('Todos');
  const [filterBranch, setFilterBranch] = useState('Todas');

  // Generar lista de las próximas 15 clases para el modal
  const upcomingClasses = useMemo(() => {
    if (myClasses.length === 0) return [];
    const now = new Date();
    let list = [];
    for (let i = 0; i < 15; i++) {
      const dateToCheck = new Date();
      dateToCheck.setDate(now.getDate() + i);
      const dayName = DAYS[dateToCheck.getDay()];
      
      const dayClasses = myClasses.filter(c => c.day === dayName);
      for (const c of dayClasses) {
        const startStr = c.time.split(' - ')[0] || c.time;
        const [hours, mins] = startStr.split(':');
        
        const classStart = new Date(dateToCheck);
        classStart.setHours(parseInt(hours, 10), parseInt(mins || 0, 10), 0, 0);

        const classEnd = new Date(classStart);
        classEnd.setHours(classEnd.getHours() + 2);

        if (classEnd > now) {
          const dateStr = `${dateToCheck.getFullYear()}-${String(dateToCheck.getMonth() + 1).padStart(2, '0')}-${String(dateToCheck.getDate()).padStart(2, '0')}`;
          const enrolled = bookings.filter(b => 
            b.classId === c.id && 
            b.date === dateStr &&
            b.status !== 'CANCELLED' && b.status !== 'CANCELLED_LATE'
          );
          
          list.push({
            id: `${c.id}-${dateStr}`,
            classObj: c,
            dateObj: classStart,
            displayDate: formatDateDDMMYYYY(classStart),
            enrolledCount: enrolled.length
          });
        }
      }
    }
    list.sort((a, b) => a.dateObj - b.dateObj);
    return list;
  }, [myClasses, bookings]);

  const uniqueDays = useMemo(() => {
    const days = new Set(upcomingClasses.map(c => c.classObj.day));
    return ['Todos', ...Array.from(days)];
  }, [upcomingClasses]);

  const uniqueBranches = useMemo(() => {
    const branches = new Set(upcomingClasses.map(c => c.classObj.sucursal));
    return ['Todas', ...Array.from(branches)];
  }, [upcomingClasses]);

  const currentClass = upcomingClasses.length > 0 ? upcomingClasses[0] : null;
  const otherClasses = upcomingClasses.slice(1).filter(item => {
    if (filterDay !== 'Todos' && item.classObj.day !== filterDay) return false;
    if (filterBranch !== 'Todas' && item.classObj.sucursal !== filterBranch) return false;
    return true;
  });

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gris-oscuro)' }}>Mi resumen</h3>
      </div>
      
      <div className="stats-dashboard-grid">
        {/* Card Mis Clases */}
        <div 
          onClick={() => setShowAllClassesModal(true)}
          className="stat-card-modern stat-card-modern-large" 
          style={{ 
            backgroundColor: 'var(--card-mustard)',
            cursor: 'pointer',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div className="stat-card-modern-icon">
            <span style={{ fontSize: '24px' }}>🧑‍🏫</span>
          </div>
          <div className="stat-card-modern-content">
            <div className="stat-card-modern-number">{myClasses.length}</div>
            <div className="stat-card-modern-label">Clases<br />asignadas</div>
          </div>
        </div>

        {/* Card Alumnos totales */}
        <div className="stat-card-modern" style={{ backgroundColor: 'var(--card-sage)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="stat-card-modern-content">
              {/* Aproximación de alumnos (total de reservas confirmadas) */}
              <div className="stat-card-modern-number">
                {bookings.filter(b => myClasses.some(c => c.id === b.classId) && b.status !== 'CANCELLED').length}
              </div>
              <div className="stat-card-modern-label">Reservas<br />activas</div>
            </div>
            <div className="stat-card-modern-icon" style={{ width: '40px', height: '40px' }}>
              <span style={{ fontSize: '18px' }}>🏺</span>
            </div>
          </div>
        </div>

        {/* Card Insumos (Horneados y Arcilla) */}
        <div 
          onClick={() => setActiveTab('insumos')}
          className="stat-card-modern" 
          style={{ 
            backgroundColor: 'var(--card-brown)',
            cursor: 'pointer',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="stat-card-modern-content">
              <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-sans)', lineHeight: '1.2', letterSpacing: '-0.3px', marginBottom: '4px' }}>
                Horneados y<br/>Arcilla Extra
              </div>
              <div className="stat-card-modern-label">Registrar insumos</div>
            </div>
            <div className="stat-card-modern-icon" style={{ width: '40px', height: '40px' }}>
              <span style={{ fontSize: '18px' }}>🔥</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Próxima clase
        </h3>

        {!nextClassData ? (
          <div className="clay-card" style={{ textAlign: 'center', padding: '24px 20px', color: 'var(--gris-medio)' }}>
            <p style={{ fontSize: '14px', fontStyle: 'italic', margin: 0 }}>No tienes clases programadas próximamente.</p>
          </div>
        ) : (
          <div className="clay-card" style={{ padding: '20px', borderRadius: '24px', backgroundColor: 'var(--blanco)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            {/* Header Próxima Clase */}
            <div style={{ borderBottom: '1px solid #eee', paddingBottom: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="badge badge-mustard" style={{ marginBottom: '8px', display: 'inline-block' }}>
                    {nextClassData.displayDate}
                  </span>
                  <h4 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--gris-oscuro)', margin: 0 }}>
                    {nextClassData.classObj.time}
                  </h4>
                  <p style={{ fontSize: '14px', color: 'var(--gris-medio)', marginTop: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <LocationOnIcon style={{ fontSize: '16px' }} /> {nextClassData.classObj.sucursal}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, padding: '6px 12px', borderRadius: '12px', backgroundColor: 'var(--verde-oliva-light)', color: 'var(--verde-oliva-dark)' }}>
                    {nextClassBookings.length} / {nextClassData.classObj.capacity} Inscriptos/as
                  </span>
                </div>
              </div>
            </div>

            {/* Listado de Alumnas */}
            <h5 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--gris-oscuro)', marginBottom: '12px' }}>
              Alumnos/as inscriptos/as
            </h5>
            
            {nextClassBookings.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--gris-medio)', fontStyle: 'italic', marginBottom: '20px' }}>
                No hay alumnos/as inscriptos/as para esta clase.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {nextClassBookings.map(b => {
                  const studentProfile = studentProfiles?.find(p => p.studentId === b.studentId);
                  const clayDelivered = studentProfile?.lastClayDeliveryDate && new Date(studentProfile.lastClayDeliveryDate).getMonth() === new Date().getMonth();

                  return (
                    <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fdfbfa', padding: '12px 16px', borderRadius: '16px', border: '1px solid #f0ebe1' }}>
                      <span 
                        onClick={() => setStudentActionMenu({ studentId: b.studentId, studentName: b.studentName })}
                        style={{ fontSize: '14px', fontWeight: 700, color: 'var(--marron-arcilla)', textDecoration: 'underline', cursor: 'pointer' }}
                      >
                        {b.studentName}
                      </span>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {/* Check Asistencia */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: b.status === 'ATTENDED' ? 'var(--verde-oliva)' : 'var(--gris-medio)' }}>
                          <input 
                            type="checkbox" 
                            checked={b.status === 'ATTENDED'}
                            onChange={() => handleToggleAttendance(b)}
                            style={{ accentColor: 'var(--verde-oliva)', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          Presente
                        </label>
                        
                        {/* Check Arcilla */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: clayDelivered ? 'var(--marron-arcilla)' : 'var(--gris-medio)' }}>
                          <input 
                            type="checkbox" 
                            checked={!!clayDelivered}
                            onChange={() => handleToggleClay(b, !!clayDelivered)}
                            style={{ accentColor: 'var(--marron-arcilla)', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          Arcilla
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Agregar Alumno/a Extra */}
            <div style={{ backgroundColor: 'var(--bg-crema)', padding: '16px', borderRadius: '16px', border: '1px dashed var(--gris-claro)' }}>
              <h5 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--gris-oscuro)', marginBottom: '8px' }}>
                Agregar alumno/a de forma excepcional
              </h5>
              <p style={{ fontSize: '11px', color: 'var(--gris-medio)', marginBottom: '12px' }}>
                Si un/a alumno/a asistió pero no estaba anotado/a, podés sumarlo/a acá. (Se le descontará 1 crédito).
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <select 
                  className="input-tuti" 
                  value={selectedStudentToAdd} 
                  onChange={e => setSelectedStudentToAdd(e.target.value)}
                  style={{ flex: '1 1 200px', padding: '10px 12px', fontSize: '13px' }}
                >
                  <option value="">-- Seleccionar alumno/a --</option>
                  {availableStudentsToAdd.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <button 
                  onClick={handleAddStudentAndMarkPresent}
                  disabled={!selectedStudentToAdd || isAddingStudent}
                  className="btn-tuti btn-success-soft"
                  style={{ flex: '0 0 auto', padding: '10px 16px', fontSize: '13px' }}
                >
                  {isAddingStudent ? 'Agregando...' : '+ Agregar y marcar presente'}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Modal de Todas las Clases Asignadas */}
      {showAllClassesModal && createPortal(
        <div className="tuti-modal" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100dvh',
          backgroundColor: 'var(--blanco)',
          display: 'flex', flexDirection: 'column',
          zIndex: 1000,
          animation: 'slideUp 0.3s ease-out'
        }}>
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--gris-claro)', backgroundColor: 'var(--blanco)', zIndex: 10 }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--gris-oscuro)', margin: 0 }}>
              Próximas clases
            </h3>
            <button
              type="button"
              onClick={() => setShowAllClassesModal(false)}
              style={{ border: 'none', background: 'var(--bg-crema)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--gris-oscuro)' }}
            >
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {upcomingClasses.length === 0 ? (
              <p style={{ fontSize: '14px', color: 'var(--gris-medio)', fontStyle: 'italic', textAlign: 'center', marginTop: '40px' }}>
                No tienes clases programadas próximamente.
              </p>
            ) : (
              <>
                {/* CLASE ACTUAL */}
                {currentClass && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gris-oscuro)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--verde-oliva)' }}></span>
                      Próxima Clase
                    </h4>
                    <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'var(--verde-oliva-light)', border: '1px solid rgba(135, 149, 113, 0.3)', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 4px 12px rgba(135, 149, 113, 0.1)' }}>
                      <div>
                        <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--verde-oliva-dark)', margin: 0 }}>
                          {currentClass.displayDate}
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
                          <span style={{ fontSize: '14px', color: 'var(--verde-oliva-dark)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255,255,255,0.6)', padding: '4px 10px', borderRadius: '8px' }}>
                            <CalendarTodayIcon style={{ fontSize: '16px' }} /> {currentClass.classObj.time}
                          </span>
                          <span style={{ fontSize: '14px', color: 'var(--verde-oliva-dark)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255,255,255,0.6)', padding: '4px 10px', borderRadius: '8px' }}>
                            <LocationOnIcon style={{ fontSize: '16px' }} /> {currentClass.classObj.sucursal}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '12px', borderTop: '1px dashed rgba(135, 149, 113, 0.3)' }}>
                        <span style={{ fontSize: '13px', color: 'var(--verde-oliva-dark)', fontWeight: 600 }}>Alumnos/as</span>
                        <span style={{ fontSize: '13px', fontWeight: 800, padding: '4px 12px', borderRadius: '12px', backgroundColor: 'var(--verde-oliva)', color: 'var(--blanco)' }}>
                          {currentClass.enrolledCount} / {currentClass.classObj.capacity} inscriptos/as
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* FILTROS Y RESTO DE CLASES */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gris-oscuro)', margin: 0 }}>
                    Resto de tus clases
                  </h4>
                  
                  {/* Controles de Filtro */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', backgroundColor: '#f9f8f6', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gris-medio)', minWidth: '60px' }}>Día:</span>
                      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }} className="hide-scrollbar">
                        {uniqueDays.map(day => (
                          <button
                            key={day}
                            onClick={() => setFilterDay(day)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '13px',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              border: filterDay === day ? 'none' : '1px solid var(--gris-claro)',
                              backgroundColor: filterDay === day ? 'var(--marron-arcilla)' : 'var(--blanco)',
                              color: filterDay === day ? 'var(--blanco)' : 'var(--gris-oscuro)',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>

                    {uniqueBranches.length > 2 && (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gris-medio)', minWidth: '60px' }}>Sede:</span>
                        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }} className="hide-scrollbar">
                          {uniqueBranches.map(branch => (
                            <button
                              key={branch}
                              onClick={() => setFilterBranch(branch)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '13px',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                border: filterBranch === branch ? 'none' : '1px solid var(--gris-claro)',
                                backgroundColor: filterBranch === branch ? 'var(--verde-oliva)' : 'var(--blanco)',
                                color: filterBranch === branch ? 'var(--blanco)' : 'var(--gris-oscuro)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              {branch}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lista Restante */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {otherClasses.length === 0 ? (
                      <p style={{ fontSize: '13px', color: 'var(--gris-medio)', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' }}>
                        No hay clases que coincidan con estos filtros.
                      </p>
                    ) : (
                      otherClasses.map((item, idx) => (
                        <div key={`${item.id}-${idx}`} style={{ padding: '16px', borderRadius: '16px', backgroundColor: '#fdfbfa', border: '1px solid #f0ebe1', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ flex: '1 1 200px' }}>
                            <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--gris-oscuro)', margin: 0 }}>
                              {item.displayDate}
                            </h4>
                            <p style={{ fontSize: '13px', color: 'var(--gris-medio)', marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CalendarTodayIcon style={{ fontSize: '14px' }} /> {item.classObj.time}</span>
                              <span style={{ color: '#d4c5b9' }}>|</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><LocationOnIcon style={{ fontSize: '14px' }} /> {item.classObj.sucursal}</span>
                            </p>
                          </div>
                          <div style={{ flex: '0 0 auto' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', backgroundColor: '#e8e2d9', color: 'var(--gris-oscuro)' }}>
                              {item.enrolledCount} inscriptos/as
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Menú de Acción del Alumno/a */}
      {studentActionMenu && createPortal(
        <div className="tuti-modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(30, 27, 22, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div className="clay-card animate-slide-up" style={{ width: '100%', maxWidth: '350px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gris-oscuro)', margin: 0 }}>Opciones</h3>
              <button type="button" onClick={() => setStudentActionMenu(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--gris-medio)' }}>
                ✕
              </button>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--gris-medio)', marginBottom: '20px' }}>
              ¿Qué deseas registrar para <strong>{studentActionMenu.studentName}</strong>?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={() => {
                  setBakeModal({ isOpen: true, studentId: studentActionMenu.studentId, studentName: studentActionMenu.studentName, description: '', price: '', paymentMethod: 'PENDIENTE', amountCash: '', amountTransfer: '' });
                  setStudentActionMenu(null);
                }}
                className="btn-tuti btn-primary-oliva" 
                style={{ padding: '12px', fontSize: '14px' }}
              >
                Registrar horneado
              </button>
              <button 
                onClick={() => {
                  setClayModal({ isOpen: true, studentId: studentActionMenu.studentId, studentName: studentActionMenu.studentName, quantity: '' });
                  setStudentActionMenu(null);
                }}
                className="btn-tuti btn-primary-clay" 
                style={{ padding: '12px', fontSize: '14px' }}
              >
                Vender arcilla extra
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Horneado */}
      {bakeModal.isOpen && createPortal(
        <div className="tuti-modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(30, 27, 22, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }}>
          <div className="clay-card animate-slide-up" style={{ width: '100%', maxWidth: '400px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gris-oscuro)', marginBottom: '8px' }}>Registrar horneado</h3>
            <p style={{ fontSize: '13px', color: 'var(--gris-medio)', marginBottom: '16px' }}>Alumno/a: <strong>{bakeModal.studentName}</strong></p>
            <form onSubmit={handleRegisterBake}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--gris-medio)', marginBottom: '6px' }}>Descripción de las piezas *</label>
                <textarea className="input-tuti" required value={bakeModal.description} onChange={e => setBakeModal({...bakeModal, description: e.target.value})} placeholder="Ej: Taza blanca, Plato hondo..." rows={3}></textarea>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--gris-medio)', marginBottom: '6px' }}>Precio a cobrar ($) *</label>
                <input type="number" className="input-tuti" required value={bakeModal.price} onChange={e => setBakeModal({...bakeModal, price: e.target.value})} placeholder="Ej: 2500" />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--gris-medio)', marginBottom: '6px' }}>Estado / Método de Pago</label>
                <select className="input-tuti" value={bakeModal.paymentMethod} onChange={e => setBakeModal({...bakeModal, paymentMethod: e.target.value})}>
                  <option value="PENDIENTE">Anotar como Deuda Pendiente</option>
                  <option value="CONTADO">Pagado en Efectivo</option>
                  <option value="TRANSF">Pagado por Transferencia</option>
                  <option value="COMBINADO">Pago Combinado (Efvo + Transf)</option>
                </select>
              </div>

              {bakeModal.paymentMethod === 'COMBINADO' && (
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', backgroundColor: '#fcfaf8', padding: '12px', borderRadius: '12px', border: '1px solid #f0ebe1' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--gris-medio)', marginBottom: '6px' }}>En Efectivo ($)</label>
                    <input type="number" className="input-tuti" value={bakeModal.amountCash} onChange={e => setBakeModal({...bakeModal, amountCash: e.target.value})} placeholder="0" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--gris-medio)', marginBottom: '6px' }}>Transferencia ($)</label>
                    <input type="number" className="input-tuti" value={bakeModal.amountTransfer} onChange={e => setBakeModal({...bakeModal, amountTransfer: e.target.value})} placeholder="0" />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setBakeModal({ isOpen: false })} className="btn-tuti btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn-tuti btn-primary-oliva" style={{ flex: 1 }}>Registrar</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Arcilla Extra */}
      {clayModal.isOpen && createPortal(
        <div className="tuti-modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(30, 27, 22, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }}>
          <div className="clay-card animate-slide-up" style={{ width: '100%', maxWidth: '400px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gris-oscuro)', marginBottom: '8px' }}>Vender arcilla extra</h3>
            <p style={{ fontSize: '13px', color: 'var(--gris-medio)', marginBottom: '16px' }}>Alumno/a: <strong>{clayModal.studentName}</strong></p>
            <form onSubmit={handleRegisterClay}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--gris-medio)', marginBottom: '6px' }}>Cantidad (kg) *</label>
                <input type="number" step="0.1" className="input-tuti" required value={clayModal.quantity} onChange={e => setClayModal({...clayModal, quantity: e.target.value})} placeholder="Ej: 1 o 0.5" />
                <p style={{ fontSize: '11px', color: 'var(--gris-medio)', marginTop: '6px' }}>
                  Se registrará automáticamente como deuda pendiente según el precio por kg actual.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setClayModal({ isOpen: false })} className="btn-tuti btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn-tuti btn-primary-clay" style={{ flex: 1 }}>Registrar</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </>
  );
}
