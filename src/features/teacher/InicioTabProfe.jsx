import React, { useState, useEffect, useMemo } from 'react';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
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
  setActiveTab
}) {
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);

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
            displayDate: `${dayName} ${dateToCheck.getDate()} de ${MONTHS[dateToCheck.getMonth()]}`
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
      alert("Alumna agregada y marcada como presente con éxito.");
    } catch (error) {
      alert("Error al agregar alumna: " + error.message);
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

  const handleToggleClay = async (studentId, currentClayValue) => {
    try {
      await deliverClayToStudent(studentId, !currentClayValue);
    } catch (err) {
      alert("Error al actualizar arcilla: " + err.message);
    }
  };

  const [showAllClassesModal, setShowAllClassesModal] = useState(false);

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
            displayDate: `${dayName} ${dateToCheck.getDate()} de ${MONTHS[dateToCheck.getMonth()]}`,
            enrolledCount: enrolled.length
          });
        }
      }
    }
    list.sort((a, b) => a.dateObj - b.dateObj);
    return list;
  }, [myClasses, bookings]);

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
                    {nextClassBookings.length} / {nextClassData.classObj.capacity} Inscriptas
                  </span>
                </div>
              </div>
            </div>

            {/* Listado de Alumnas */}
            <h5 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--gris-oscuro)', marginBottom: '12px' }}>
              Alumnas inscriptas
            </h5>
            
            {nextClassBookings.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--gris-medio)', fontStyle: 'italic', marginBottom: '20px' }}>
                No hay alumnas inscriptas para esta clase.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {nextClassBookings.map(b => {
                  const studentProfile = studentProfiles?.find(p => p.studentId === b.studentId);
                  const clayDelivered = studentProfile?.lastClayDeliveryDate && new Date(studentProfile.lastClayDeliveryDate).getMonth() === new Date().getMonth();

                  return (
                    <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fdfbfa', padding: '12px 16px', borderRadius: '16px', border: '1px solid #f0ebe1' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gris-oscuro)' }}>
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
                            onChange={() => handleToggleClay(b.studentId, !!clayDelivered)}
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

            {/* Agregar Alumna Extra */}
            <div style={{ backgroundColor: 'var(--bg-crema)', padding: '16px', borderRadius: '16px', border: '1px dashed var(--gris-claro)' }}>
              <h5 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--gris-oscuro)', marginBottom: '8px' }}>
                Agregar alumna de forma excepcional
              </h5>
              <p style={{ fontSize: '11px', color: 'var(--gris-medio)', marginBottom: '12px' }}>
                Si una alumna asistió pero no estaba anotada, podés sumarla acá. (Se le descontará 1 crédito).
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <select 
                  className="input-tuti" 
                  value={selectedStudentToAdd} 
                  onChange={e => setSelectedStudentToAdd(e.target.value)}
                  style={{ flex: '1 1 200px', padding: '10px 12px', fontSize: '13px' }}
                >
                  <option value="">-- Seleccionar alumna --</option>
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
      {showAllClassesModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(30, 27, 22, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '16px'
        }}>
          <div className="clay-card animate-slide-up" style={{
            width: '100%', maxWidth: '500px', backgroundColor: 'var(--blanco)', padding: '24px',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: '16px',
            boxShadow: '0 12px 36px rgba(44, 38, 30, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gris-oscuro)', margin: 0 }}>
                Próximas 15 Clases
              </h3>
              <button
                type="button"
                onClick={() => setShowAllClassesModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--gris-medio)' }}
              >
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingClasses.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--gris-medio)', fontStyle: 'italic', textAlign: 'center' }}>
                  No tienes clases programadas próximamente.
                </p>
              ) : (
                upcomingClasses.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} style={{ padding: '16px', borderRadius: '16px', backgroundColor: '#fdfbfa', border: '1px solid #f0ebe1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--gris-oscuro)', margin: 0 }}>
                        {item.displayDate}
                      </h4>
                      <p style={{ fontSize: '13px', color: 'var(--gris-medio)', marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CalendarTodayIcon style={{ fontSize: '14px' }} /> {item.classObj.time} &nbsp;&bull;&nbsp;
                        <LocationOnIcon style={{ fontSize: '14px' }} /> {item.classObj.sucursal}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-oliva" style={{ fontSize: '11px', padding: '4px 8px' }}>
                        {item.enrolledCount} inscriptas
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </>
  );
}
