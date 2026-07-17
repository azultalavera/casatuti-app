import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PauseCircleOutlinedIcon from '@mui/icons-material/PauseCircleOutlined';
import GroupsIcon from '@mui/icons-material/Groups';

export default function ClasesTabProfe({
  currentUser,
  classes,
  bookings,
  studentProfiles,
  takeAttendance,
  deliverClayToStudent,
  createBake
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(null);
  const [activeClassId, setActiveClassId] = useState(null);
  const [view, setView] = useState('CALENDAR'); // CALENDAR | ROSTER
  const [pauseRequests, setPauseRequests] = useState({}); // { 'classId-date': 'PENDING' | 'APPROVED' | 'REJECTED' }
  
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [bakeModal, setBakeModal] = useState({ isOpen: false, studentId: null, studentName: null, price: '', paymentMethod: 'CONTADO' });
  const [pauseModal, setPauseModal] = useState({ isOpen: false, classInfo: null, dateStr: null });

  // 1. Filtrar mis clases
  const myClasses = classes.filter(c => c.teacherId === currentUser.id);
  const daysMapping = {
    0: 'Domingo',
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado'
  };

  // 2. Funciones del Calendario
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  
  // Días para renderizar celdas en blanco al principio
  const blanks = Array(firstDay).fill(null);
  // Días del mes
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getClassesForDate = (year, month, day) => {
    const dateObj = new Date(year, month, day);
    const dayName = daysMapping[dateObj.getDay()];
    return myClasses.filter(c => c.day === dayName);
  };

  const handleDayClick = (day) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const fullDate = `${year}-${month}-${dayStr}`;
    
    setSelectedDateStr(fullDate);
  };

  const handleVerAlumnos = (classId) => {
    setActiveClassId(classId);
    setView('ROSTER');
  };

  const handleRequestPause = (e) => {
    e.preventDefault();
    // Registrar el estado pendiente localmente
    setPauseRequests(prev => ({
      ...prev,
      [`${pauseModal.classInfo.id}-${pauseModal.dateStr}`]: 'PENDING'
    }));
    
    // Simular el envío de solicitud de pausa
    setSuccessMessage(`Solicitud de pausa enviada al administrador para la clase del ${pauseModal.dateStr}.`);
    setTimeout(() => setSuccessMessage(''), 4000);
    setPauseModal({ isOpen: false, classInfo: null, dateStr: null });
  };

  // 3. Funciones del Roster (Asistencia, Arcilla, Horneado)
  const activeClassBookings = bookings.filter(
    b => b.classId === activeClassId && b.date === selectedDateStr && b.status !== 'CANCELLED' && b.status !== 'CANCELLED_LATE'
  );

  const handleAttendance = async (bookingId, status) => {
    try {
      setErrorMessage('');
      await takeAttendance(bookingId, status);
      setSuccessMessage("Asistencia actualizada con éxito.");
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const handleClayDelivery = async (studentId, studentName) => {
    try {
      setErrorMessage('');
      await deliverClayToStudent(studentId, studentName, currentUser.id, currentUser.name);
      setSuccessMessage(`¡Se registró la entrega de 1kg de arcilla a ${studentName}!`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleRegisterBake = async (e) => {
    e.preventDefault();
    if (!bakeModal.price || isNaN(bakeModal.price)) {
      setErrorMessage('Por favor, ingresa un precio válido.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }
    try {
      setErrorMessage('');
      await createBake({
        studentId: bakeModal.studentId,
        price: parseFloat(bakeModal.price),
        paymentMethod: bakeModal.paymentMethod
      });
      setSuccessMessage(`¡Se registró el horneado para ${bakeModal.studentName}!`);
      setTimeout(() => setSuccessMessage(''), 4000);
      setBakeModal({ isOpen: false, studentId: null, studentName: null, price: '', paymentMethod: 'CONTADO' });
    } catch (err) {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  // Nombres de los meses
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <>
      {/* Banners Globales */}
      {errorMessage && (
        <div className="alert-banner danger animate-slide-up" style={{ marginBottom: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><WarningAmberIcon style={{ fontSize: '18px' }} /> {errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="alert-banner info animate-slide-up" style={{ marginBottom: '16px' }}>
          <span>{successMessage}</span>
        </div>
      )}

      {view === 'CALENDAR' && (
        <div className="animate-slide-up">
          {/* Componente Calendario */}
          <div className="clay-card" style={{ padding: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <button onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--marron-arcilla)' }}>
                <ChevronLeftIcon />
              </button>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gris-oscuro)', margin: 0 }}>
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button onClick={handleNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--marron-arcilla)' }}>
                <ChevronRightIcon />
              </button>
            </div>

            {/* Días de la semana */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px', textAlign: 'center' }}>
              {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(d => (
                <div key={d} style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gris-medio)' }}>{d}</div>
              ))}
            </div>

            {/* Cuadrícula de días */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {blanks.map((_, i) => (
                <div key={`blank-${i}`} style={{ height: '40px' }}></div>
              ))}
              {days.map(d => {
                const dayClasses = getClassesForDate(currentMonth.getFullYear(), currentMonth.getMonth(), d);
                const hasClasses = dayClasses.length > 0;
                const isSelected = selectedDateStr === `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                
                return (
                  <div 
                    key={d} 
                    onClick={() => hasClasses ? handleDayClick(d) : null}
                    style={{ 
                      height: '40px', 
                      display: 'flex', 
                      flexDirection: 'column',
                      justifyContent: 'center', 
                      alignItems: 'center',
                      borderRadius: '8px',
                      cursor: hasClasses ? 'pointer' : 'default',
                      backgroundColor: isSelected ? 'var(--marron-arcilla)' : (hasClasses ? 'var(--bg-crema)' : 'transparent'),
                      color: isSelected ? 'var(--blanco)' : (hasClasses ? 'var(--gris-oscuro)' : 'var(--gris-claro)'),
                      fontWeight: isSelected || hasClasses ? 700 : 400,
                      border: isSelected ? 'none' : (hasClasses ? '1px solid var(--marron-arcilla-light)' : '1px solid transparent'),
                      transition: 'var(--transition-quick)'
                    }}
                  >
                    <span style={{ fontSize: '14px' }}>{d}</span>
                    {hasClasses && !isSelected && (
                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--marron-arcilla)', marginTop: '2px' }}></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lista de clases para el día seleccionado */}
          {selectedDateStr && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gris-oscuro)', marginBottom: '12px' }}>
                Clases del {selectedDateStr.split('-').reverse().join('/')}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {getClassesForDate(
                  parseInt(selectedDateStr.split('-')[0]), 
                  parseInt(selectedDateStr.split('-')[1]) - 1, 
                  parseInt(selectedDateStr.split('-')[2])
                ).map(c => {
                  const requestStatus = pauseRequests[`${c.id}-${selectedDateStr}`];
                  
                  return (
                  <div key={c.id} className="clay-card animate-slide-up" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gris-oscuro)', margin: 0 }}>
                          {c.name}
                        </h4>
                        <span style={{ fontSize: '12px', color: 'var(--gris-medio)', fontWeight: 600 }}>{c.time} · {c.sucursal}</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      <button 
                        onClick={() => handleVerAlumnos(c.id)}
                        className="btn-tuti btn-primary-clay" 
                        style={{ flex: 1, padding: '8px', fontSize: '12px', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <GroupsIcon style={{ fontSize: '18px' }} /> Ver Alumnos/as
                      </button>
                      
                      {requestStatus === 'PENDING' ? (
                        <button 
                          className="btn-tuti btn-secondary" 
                          style={{ padding: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'not-allowed', opacity: 0.7 }}
                          disabled
                        >
                          <PauseCircleOutlinedIcon style={{ fontSize: '16px' }} /> Pendiente
                        </button>
                      ) : requestStatus === 'APPROVED' ? (
                        <button 
                          className="btn-tuti btn-primary-oliva" 
                          style={{ padding: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'not-allowed' }}
                          disabled
                        >
                          <PauseCircleOutlinedIcon style={{ fontSize: '16px' }} /> Aprobada
                        </button>
                      ) : requestStatus === 'REJECTED' ? (
                        <button 
                          className="btn-tuti btn-danger" 
                          style={{ padding: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'not-allowed' }}
                          disabled
                        >
                          <PauseCircleOutlinedIcon style={{ fontSize: '16px' }} /> Rechazada
                        </button>
                      ) : (
                        <button 
                          onClick={() => setPauseModal({ isOpen: true, classInfo: c, dateStr: selectedDateStr })}
                          className="btn-tuti btn-secondary" 
                          style={{ padding: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Solicitar pausa"
                        >
                          <PauseCircleOutlinedIcon style={{ fontSize: '16px' }} /> Solicitud de pausa
                        </button>
                      )}
                    </div>
                  </div>
                )})}
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'ROSTER' && (
        <div className="animate-slide-up">
          {/* Cabecera del Roster */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <button 
              onClick={() => setView('CALENDAR')} 
              style={{ background: 'var(--blanco)', border: '1px solid var(--gris-claro)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-flat)' }}
            >
              <ArrowBackIcon style={{ color: 'var(--gris-oscuro)', fontSize: '20px' }} />
            </button>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gris-oscuro)', margin: 0 }}>Gestión de alumnos/as</h3>
              <span style={{ fontSize: '12px', color: 'var(--gris-medio)', fontWeight: 600 }}>{selectedDateStr.split('-').reverse().join('/')}</span>
            </div>
          </div>

          {/* Lista de Alumnos de la Clase */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {activeClassBookings.length === 0 ? (
              <div className="clay-card" style={{ textAlign: 'center', padding: '24px 20px', color: 'var(--gris-medio)' }}>
                <p style={{ fontSize: '14px', fontStyle: 'italic', margin: 0 }}>No hay alumnos/as inscriptos/as para esta fecha.</p>
              </div>
            ) : (
              activeClassBookings.map(b => {
                const profile = studentProfiles.find(p => p.studentId === b.studentId) || { classCredits: 0, monthlyClayKg: 0 };
                return (
                  <div key={b.id} className="clay-card" style={{ padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gris-oscuro)', margin: 0 }}>{b.studentName}</h4>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          <span className="badge badge-clay" style={{ fontSize: '10px', padding: '2px 6px' }}>Créditos: {profile.classCredits}</span>
                          <span className={`badge ${profile.monthlyClayKg >= 1.0 ? 'badge-oliva' : 'badge-warning'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>Arcilla: {profile.monthlyClayKg}kg</span>
                        </div>
                      </div>
                      <div>
                        {b.status === 'ATTENDED' && <span className="badge badge-oliva">✓ Presente</span>}
                        {b.status === 'ABSENT' && <span className="badge badge-danger">✗ Ausente</span>}
                        {b.status === 'CONFIRMED' && <span className="badge badge-warning">Pendiente</span>}
                      </div>
                    </div>

                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--gris-claro)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* Asistencia */}
                      <div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleAttendance(b.id, 'ATTENDED')} className={`btn-tuti ${b.status === 'ATTENDED' ? 'btn-primary-oliva' : 'btn-secondary'}`} style={{ padding: '8px 16px', fontSize: '12px', flex: 1 }}>Presente</button>
                          <button onClick={() => handleAttendance(b.id, 'ABSENT')} className={`btn-tuti ${b.status === 'ABSENT' ? 'btn-danger' : 'btn-secondary'}`} style={{ padding: '8px 16px', fontSize: '12px', flex: 1 }}>Ausente</button>
                        </div>
                      </div>
                      {/* Arcilla */}
                      <div>
                        {profile.monthlyClayKg >= 1.0 ? (
                          <button className="btn-tuti btn-disabled" style={{ padding: '8px 16px', fontSize: '12px', width: '100%' }} disabled>✓ Bloque de 1kg entregado</button>
                        ) : (
                          <button onClick={() => handleClayDelivery(b.studentId, b.studentName)} className="btn-tuti btn-primary-clay" style={{ padding: '8px 16px', fontSize: '12px', width: '100%', justifyContent: 'center' }}>
                            <CardGiftcardIcon style={{ fontSize: '14px' }} /> Entregar 1kg Arcilla
                          </button>
                        )}
                      </div>
                      {/* Horneado */}
                      <div>
                        <button onClick={() => setBakeModal({ isOpen: true, studentId: b.studentId, studentName: b.studentName, price: '', paymentMethod: 'CONTADO' })} className="btn-tuti btn-secondary" style={{ padding: '8px 16px', fontSize: '12px', width: '100%', justifyContent: 'center' }}>
                          Registrar horneado
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal de Registro de Horneado */}
      {bakeModal.isOpen && createPortal(
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content animate-slide-up" style={{ maxWidth: '400px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--gris-oscuro)' }}>Registrar horneado</h3>
            <p style={{ fontSize: '14px', color: 'var(--gris-medio)', marginBottom: '16px' }}>Alumno/a: <strong>{bakeModal.studentName}</strong></p>
            <form onSubmit={handleRegisterBake} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Precio Total ($) *</label>
                <input type="number" className="input-tuti" placeholder="Ej. 1500" value={bakeModal.price} onChange={(e) => setBakeModal({...bakeModal, price: e.target.value})} required />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Método de Pago *</label>
                <select className="input-tuti" value={bakeModal.paymentMethod} onChange={(e) => setBakeModal({...bakeModal, paymentMethod: e.target.value})}>
                  <option value="CONTADO">Efectivo / contado</option>
                  <option value="TRANSF">Transferencia</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setBakeModal({ ...bakeModal, isOpen: false })} className="btn-tuti btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn-tuti btn-primary-clay" style={{ flex: 1 }}>Confirmar registro</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Solicitar Pausa */}
      {pauseModal.isOpen && createPortal(
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content animate-slide-up" style={{ maxWidth: '400px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--gris-oscuro)' }}>Solicitar pausa de clase</h3>
            <p style={{ fontSize: '13px', color: 'var(--gris-medio)', marginBottom: '16px', lineHeight: '1.4' }}>
              Estás por enviar una solicitud al administrador para pausar la clase <strong>{pauseModal.classInfo?.name}</strong> del día <strong>{pauseModal.dateStr?.split('-').reverse().join('/')}</strong>. 
              Los alumnos/as inscriptos/as serán notificados si la pausa es aprobada.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="button" onClick={() => setPauseModal({ isOpen: false, classInfo: null, dateStr: null })} className="btn-tuti btn-secondary" style={{ flex: 1 }}>Cancelar</button>
              <button type="button" onClick={handleRequestPause} className="btn-tuti btn-primary-clay" style={{ flex: 1, backgroundColor: 'var(--rojo-alerta)' }}>Enviar solicitud</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
