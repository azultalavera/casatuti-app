import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function ProfeView() {
  const {
    currentUser,
    classes,
    bookings,
    studentProfiles,
    takeAttendance,
    deliverClayToStudent
  } = useApp();

  const [activeClassId, setActiveClassId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filtrar las clases asignadas a este profesor
  const myClasses = classes.filter(c => c.teacherId === currentUser.id);

  // Obtener las fechas distintas que tienen reservas para las clases de este profesor
  const getAvailableDates = () => {
    const classIds = myClasses.map(c => c.id);
    const dates = bookings
      .filter(b => classIds.includes(b.classId) && b.status !== 'CANCELLED' && b.status !== 'CANCELLED_LATE')
      .map(b => b.date);
    return [...new Set(dates)].sort();
  };

  const datesWithBookings = getAvailableDates();

  // Si no hay una clase activa seleccionada y el profe tiene clases, seleccionamos la primera
  if (!activeClassId && myClasses.length > 0) {
    setActiveClassId(myClasses[0].id);
  }
  // Si no hay una fecha seleccionada y hay fechas disponibles, seleccionamos la primera
  if (!selectedDate && datesWithBookings.length > 0) {
    setSelectedDate(datesWithBookings[0]);
  }

  const activeClass = classes.find(c => c.id === activeClassId);

  // Alumnos inscriptos en la clase seleccionada para la fecha seleccionada
  const activeClassBookings = bookings.filter(
    b => b.classId === activeClassId && b.date === selectedDate && b.status !== 'CANCELLED' && b.status !== 'CANCELLED_LATE'
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
      setSuccessMessage('');
      await deliverClayToStudent(studentId, studentName, currentUser.id, currentUser.name);
      setSuccessMessage(`¡Se registró la entrega de 1kg de arcilla a ${studentName}!`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Cabecera del Profesor */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="badge badge-oliva" style={{ marginBottom: '6px' }}>Profesor Activo</span>
          <h2 style={{ fontSize: '26px' }}>Prof. {currentUser.name.split(' ')[0]}</h2>
        </div>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: 'var(--marron-arcilla)',
          color: 'var(--blanco)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'var(--font-serif)',
          fontSize: '20px',
          fontWeight: 'bold',
          boxShadow: 'var(--shadow-clay)'
        }}>
          {currentUser.name[0]}
        </div>
      </div>

      {/* Selectores de Clase y Fecha */}
      <div className="clay-card">
        <h3 style={{ fontSize: '16px', marginBottom: '12px', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
          Selecciona Clase & Fecha de Taller
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label>Clase:</label>
            <select
              className="input-tuti"
              value={activeClassId}
              onChange={(e) => setActiveClassId(e.target.value)}
            >
              {myClasses.length === 0 ? (
                <option value="">No tienes clases asignadas</option>
              ) : (
                myClasses.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.day} - {c.time})</option>
                ))
              )}
            </select>
          </div>

          <div className="form-group">
            <label>Fecha del Taller:</label>
            <select
              className="input-tuti"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            >
              {datesWithBookings.length === 0 ? (
                <option value="">No hay reservas registradas</option>
              ) : (
                datesWithBookings.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Banners de Notificaciones */}
      {errorMessage && (
        <div className="alert-banner danger animate-slide-up">
          <span>⚠️ {errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="alert-banner info animate-slide-up">
          <span>{successMessage}</span>
        </div>
      )}

      {/* Lista de Alumnos de la Clase */}
      <div>
        <h3 style={{ fontSize: '18px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Alumnos Inscriptos
          <span className="badge badge-clay">{activeClassBookings.length}</span>
        </h3>

        {activeClassBookings.length === 0 ? (
          <div className="clay-card" style={{ textAlign: 'center', padding: '24px 20px', color: 'var(--gris-medio)' }}>
            <p style={{ fontSize: '14px', fontStyle: 'italic' }}>No hay alumnos inscriptos para esta fecha.</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>Los alumnos que reserven figurarán aquí.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {activeClassBookings.map(b => {
              const profile = studentProfiles.find(p => p.studentId === b.studentId) || {
                classCredits: 0,
                monthlyClayKg: 0
              };

              return (
                <div key={b.id} className="clay-card animate-slide-up" style={{ padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gris-oscuro)' }}>{b.studentName}</h4>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <span className="badge badge-clay" style={{ fontSize: '10px', padding: '2px 6px' }}>
                          Créditos: {profile.classCredits}
                        </span>
                        <span className={`badge ${profile.monthlyClayKg >= 1.0 ? 'badge-oliva' : 'badge-warning'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                          Arcilla: {profile.monthlyClayKg}kg
                        </span>
                      </div>
                    </div>

                    {/* Estado de Asistencia actual */}
                    <div>
                      {b.status === 'ATTENDED' && <span className="badge badge-oliva">✓ Presente</span>}
                      {b.status === 'ABSENT' && <span className="badge badge-danger">✗ Ausente</span>}
                      {b.status === 'CONFIRMED' && <span className="badge badge-warning">Pendiente</span>}
                    </div>
                  </div>

                  {/* Panel de Acciones del Profesor (Asistencia y Arcilla) */}
                  <div style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--gris-claro)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    {/* Botones de Asistencia */}
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--gris-medio)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                        TOMAR ASISTENCIA:
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleAttendance(b.id, 'ATTENDED')}
                          className={`btn-tuti ${b.status === 'ATTENDED' ? 'btn-primary-oliva' : 'btn-secondary'}`}
                          style={{ padding: '8px 16px', fontSize: '12px', flex: 1 }}
                        >
                          Presente
                        </button>
                        <button
                          onClick={() => handleAttendance(b.id, 'ABSENT')}
                          className={`btn-tuti ${b.status === 'ABSENT' ? 'btn-danger' : 'btn-secondary'}`}
                          style={{ padding: '8px 16px', fontSize: '12px', flex: 1 }}
                        >
                          Ausente
                        </button>
                      </div>
                    </div>

                    {/* Botón de Arcilla */}
                    <div style={{ marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--gris-medio)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                        ENTREGA DE MATERIALES:
                      </span>
                      {profile.monthlyClayKg >= 1.0 ? (
                        <button
                          className="btn-tuti btn-disabled"
                          style={{ padding: '8px 16px', fontSize: '12px', width: '100%' }}
                          disabled
                        >
                          ✓ Bloque de 1kg Entregado este mes
                        </button>
                      ) : (
                        <button
                          onClick={() => handleClayDelivery(b.studentId, b.studentName)}
                          className="btn-tuti btn-primary-clay"
                          style={{ padding: '8px 16px', fontSize: '12px', width: '100%', justifyContent: 'center' }}
                        >
                          🎁 Entregar Bloque de 1kg
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
