import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_ABBR = { Lunes: 'LUN', Martes: 'MAR', 'Miércoles': 'MIÉ', Jueves: 'JUE', Viernes: 'VIE', Sábado: 'SÁB' };
export default function ClassesTab({ showFeedback }) {
  const { users, classes, createNewTurn, nonWorkingDays, addNonWorkingDay, deleteNonWorkingDay, changeClassTeacher } = useApp();
  const teachers = users.filter(u => u.role === 'PROFE');

  const [mode, setMode] = useState('list'); // 'list' or 'create'
  const [editingTeacherClassId, setEditingTeacherClassId] = useState(null);
  
  // Calcular día actual por defecto
  const todayNum = new Date().getDay(); // 0=Dom, 1=Lun, 2=Mar...
  const defaultIdx = (todayNum === 0 || todayNum === 6) ? 0 : todayNum - 1;
  const defaultDay = DAYS[defaultIdx] || 'Lunes';
  const [selectedDay, setSelectedDay] = useState(defaultDay);

  // Form states
  const [sucursal, setSucursal]     = useState('CENTRO');
  const [teacherId, setTeacherId]   = useState('');
  const [capacity, setCapacity]     = useState('8');
  const [time, setTime]             = useState('18:00 - 20:00');
  const [repeatDays, setRepeatDays] = useState([]);

  // Calendar states
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date().getMonth());
  const [currentCalendarYear, setCurrentCalendarYear] = useState(new Date().getFullYear());
  const [holidayReason, setHolidayReason] = useState('');

  const toggleDay = (day) =>
    setRepeatDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!teacherId) { showFeedback('Por favor, seleccioná un profesor.', 'danger'); return; }
    if (repeatDays.length === 0) { showFeedback('Seleccioná al menos un día.', 'danger'); return; }
    const teacher = users.find(u => u.id === teacherId);
    try {
      const created = await createNewTurn({
        teacherId,
        teacherName: teacher.name.split(' (')[0],
        day: repeatDays[0],
        time,
        capacity: Number(capacity),
        sucursal
      }, repeatDays);
      showFeedback(`¡Se crearon ${created.length} turno(s) en ${sucursal} con éxito!`, 'info');
      setTeacherId('');
      setRepeatDays([]);
      setMode('list');
    } catch (err) {
      showFeedback(err.message, 'danger');
    }
  };

  // Turnos del día seleccionado
  const classesForDay = classes.filter(c => c.day === selectedDay);

  // Helpers de calendario
  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => {
    const d = new Date(year, month, 1).getDay();
    return d === 0 ? 6 : d - 1; // Lunes = index 0
  };

  const daysInMonth = getDaysInMonth(currentCalendarMonth, currentCalendarYear);
  const firstDay = getFirstDayOfMonth(currentCalendarMonth, currentCalendarYear);
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* 1. VISTA DE CREACIÓN / REGISTRO */}
      {mode === 'create' && (
        <div className="clay-card animate-slide-up" style={{ padding: '24px' }}>
          {/* Botón de volver */}
          <button
            onClick={() => setMode('list')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              background: 'transparent',
              fontSize: '12px',
              fontWeight: '800',
              color: 'var(--gris-medio)',
              cursor: 'pointer',
              padding: '0 0 16px 0',
              fontFamily: 'Outfit, sans-serif'
            }}
          >
            <svg style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al Listado
          </button>

          <h3 style={{ fontSize: '18px', marginBottom: '18px', fontWeight: 700, color: 'var(--gris-oscuro)' }}>Agregar Turno Semanal</h3>
          
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Sucursal *</label>
              <select className="input-tuti" value={sucursal} onChange={e => setSucursal(e.target.value)} style={{ width: '100%', cursor: 'pointer' }}>
                <option value="CENTRO">CENTRO</option>
                <option value="ALTO VERDE">ALTO VERDE</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Profesor Asignado *</label>
              <select className="input-tuti" value={teacherId} onChange={e => setTeacherId(e.target.value)} style={{ width: '100%', cursor: 'pointer' }}>
                <option value="">-- Seleccionar Profesor --</option>
                {teachers.map(tc => <option key={tc.id} value={tc.id}>{tc.name}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Cupo Máximo *</label>
              <input type="number" className="input-tuti" value={capacity} onChange={e => setCapacity(e.target.value)} style={{ width: '100%' }} />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Horario (HH:MM - HH:MM) *</label>
              <input type="text" className="input-tuti" placeholder="ej. 17:00 - 19:00" value={time} onChange={e => setTime(e.target.value)} style={{ width: '100%' }} />
            </div>

            {/* Días de repetición */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Días de la semana * (uno o más)</label>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                backgroundColor: '#FAF8F5',
                padding: '12px',
                borderRadius: '16px',
                border: '1px solid rgba(146, 101, 61, 0.08)'
              }}>
                {DAYS.map(day => {
                  const sel = repeatDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: sel ? '1px solid var(--verde-oliva)' : '1px solid var(--gris-claro)',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        backgroundColor: sel ? 'var(--verde-oliva)' : 'var(--blanco)',
                        color: sel ? 'var(--blanco)' : 'var(--gris-medio)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              <span style={{ fontSize: '10px', color: 'var(--gris-medio)', marginTop: '4px', paddingLeft: '4px' }}>
                * Se generará una sesión semanal por cada día tildado.
              </span>
            </div>

            <button type="submit" className="btn-tuti btn-secondary" style={{ marginTop: '8px', fontSize: '14px', padding: '12px' }}>
              + Crear Turno(s)
            </button>
          </form>
        </div>
      )}

      {/* 2. VISTA DE CONSULTA / LISTADO */}
      {mode === 'list' && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header de la Tab */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div>
              <span className="badge badge-oliva" style={{ marginBottom: '6px' }}>Panel de Control</span>
              <h2 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--gris-oscuro)', margin: 0, fontFamily: 'Outfit, sans-serif' }}>Turnos</h2>
            </div>

            {/* Botón Calendario Feriados */}
            <button
              onClick={() => setShowCalendarModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid var(--gris-claro)',
                backgroundColor: 'var(--blanco)',
                color: 'var(--verde-oliva)',
                fontWeight: '700',
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-clay)',
                transition: 'all 0.2s ease',
              }}
              title="Gestionar Feriados"
            >
              <svg style={{ width: '15px', height: '15px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
              </svg>
              Calendario
            </button>
          </div>

          {/* Mini-cards de Días (Estilo Alumna) */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '4px',
            overflowX: 'auto',
            paddingBottom: '8px',
            WebkitOverflowScrolling: 'touch'
          }}>
            {DAYS.map(day => {
              const isSelected = selectedDay === day;
              const dayClasses = classes.filter(c => c.day === day);
              const hasTurns = dayClasses.length > 0;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  style={{
                    flex: '1 1 0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    padding: '12px 10px',
                    borderRadius: '14px',
                    border: isSelected
                      ? '2px solid var(--verde-oliva)'
                      : '2px solid var(--gris-claro)',
                    backgroundColor: isSelected
                      ? 'var(--verde-oliva)'
                      : 'var(--blanco)',
                    color: isSelected
                      ? 'var(--blanco)'
                      : 'var(--gris-oscuro)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? 'var(--shadow-clay)' : 'none',
                    minWidth: '58px'
                  }}
                >
                  <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.5px', fontFamily: 'Outfit, sans-serif' }}>
                    {DAY_ABBR[day]}
                  </span>
                  <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', opacity: 0.7 }}>
                    {day.substring(0, 3) === 'Mié' ? 'MIÉR' : day.substring(0, 4).toUpperCase()}
                  </span>
                  {hasTurns && (
                    <span style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--verde-oliva)',
                      display: 'block',
                      marginTop: '2px'
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Listado de Turnos Vigentes para el día seleccionado */}
          {classes.length === 0 ? (
            <div className="clay-card" style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--gris-medio)' }}>
              <p style={{ fontStyle: 'italic', fontSize: '13px' }}>No hay turnos cargados en el sistema.</p>
            </div>
          ) : classesForDay.length === 0 ? (
            <div className="clay-card" style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--gris-medio)' }}>
              <p style={{ fontStyle: 'italic', fontSize: '13px' }}>No hay turnos vigentes para el día {selectedDay}.</p>
            </div>
          ) : (
            ['CENTRO', 'ALTO VERDE'].map(branch => {
              const branchClasses = classesForDay.filter(c => (c.sucursal || '').toUpperCase() === branch);
              if (branchClasses.length === 0) return null;

              return (
                <div key={branch} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Header de la Sucursal */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '4px',
                    paddingBottom: '4px',
                    borderBottom: '2px solid var(--verde-oliva-light)'
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--verde-oliva-dark)', letterSpacing: '0.5px' }}>
                      📍 {branch}
                    </span>
                    <span className="badge badge-oliva" style={{ fontSize: '9px', padding: '2px 6px' }}>
                      {branchClasses.length} turno{branchClasses.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Lista de Tarjetas del Turno */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {branchClasses.map(c => (
                      <div
                        key={c.id}
                        className="clay-card animate-slide-up"
                        style={{
                          padding: '14px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderLeft: '4px solid var(--verde-oliva)',
                          backgroundColor: 'var(--blanco)'
                        }}
                      >
                        <div>
                          {/* Horario en Fuente Serif Premium */}
                          <span style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--gris-oscuro)' }}>
                            {c.time}
                          </span>
                          
                          {/* Profesor asignable */}
                          {editingTeacherClassId === c.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                              <select
                                value={c.teacher_id || ''}
                                onChange={async (e) => {
                                  const val = e.target.value;
                                  if (val) {
                                    try {
                                      await changeClassTeacher(c.id, val);
                                      showFeedback('Profesor asignado con éxito.', 'info');
                                    } catch (err) {
                                      showFeedback(err.message, 'danger');
                                    }
                                  }
                                  setEditingTeacherClassId(null);
                                }}
                                onBlur={() => setTimeout(() => setEditingTeacherClassId(null), 200)}
                                autoFocus
                                className="input-tuti"
                                style={{
                                  fontSize: '11px',
                                  padding: '2px 6px',
                                  height: '26px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--verde-oliva)',
                                  backgroundColor: 'var(--blanco)',
                                  color: 'var(--gris-oscuro)',
                                  fontFamily: 'Outfit, sans-serif',
                                  cursor: 'pointer',
                                  width: '160px'
                                }}
                              >
                                <option value="">-- Seleccionar Profe --</option>
                                {teachers.map(tc => (
                                  <option key={tc.id} value={tc.id}>
                                    {tc.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div
                              onClick={() => setEditingTeacherClassId(c.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginTop: '3px',
                                cursor: 'pointer',
                                padding: '2px 6px',
                                marginLeft: '-6px',
                                borderRadius: '6px',
                                transition: 'all 0.15s ease',
                                backgroundColor: 'transparent',
                              }}
                              className="hover-bg-crema"
                              title="Hacé clic para reasignar profesor"
                            >
                              <svg style={{ width: '12px', height: '12px', color: 'var(--gris-medio)' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                              </svg>
                              <span style={{ fontSize: '11px', color: 'var(--gris-medio)', fontWeight: '600' }}>
                                Profe: <span style={{ textDecoration: 'underline dotted var(--gris-medio)', color: 'var(--gris-oscuro)' }}>{c.teacherName}</span>
                              </span>
                              <svg style={{ width: '10px', height: '10px', color: 'var(--verde-oliva)', opacity: 0.8 }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Cupo Badge */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                          <span className="badge badge-oliva" style={{ fontSize: '10px', padding: '3px 8px', fontWeight: '800' }}>
                            Cupo: {c.capacity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}

          {/* Botón Flotante "+" para Crear Turnos */}
          <button
            onClick={() => {
              setSucursal('CENTRO');
              setTeacherId('');
              setCapacity('8');
              setTime('18:00 - 20:00');
              setRepeatDays([]);
              setMode('create');
            }}
            style={{
              position: 'fixed',
              bottom: '96px',
              right: '24px',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--verde-oliva)',
              color: 'var(--blanco)',
              border: 'none',
              boxShadow: '0 4px 18px rgba(69, 95, 62, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: '300',
              cursor: 'pointer',
              zIndex: 100,
              transition: 'all 0.2s ease',
              lineHeight: '52px',
              animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
            }}
            title="Agregar Turno Semanal"
          >
            +
          </button>
        </div>
      )}

      {/* 3. MODAL DE CALENDARIO Y FERIADOS */}
      {showCalendarModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(30, 27, 22, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="clay-card animate-slide-up" style={{
            width: '100%',
            maxWidth: '440px',
            backgroundColor: 'var(--blanco)',
            padding: '24px',
            maxHeight: '90vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 12px 36px rgba(44, 38, 30, 0.15)'
          }}>
            {/* Header Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gris-oscuro)', margin: 0 }}>Calendario de Feriados</h3>
              <button
                onClick={() => setShowCalendarModal(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--gris-medio)'
                }}
              >
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--gris-medio)', margin: 0 }}>
              Selecciona los días en el calendario para marcarlos como feriados o no laborables. Las clases regulares no se programarán en estas fechas.
            </p>

            {/* Input para Motivo Personalizado */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--gris-medio)' }}>Motivo (Opcional):</label>
              <input
                type="text"
                placeholder="Ej. Navidad, Mantenimiento..."
                className="input-tuti"
                value={holidayReason}
                onChange={e => setHolidayReason(e.target.value)}
                style={{ fontSize: '13px', padding: '8px 12px' }}
              />
            </div>

            {/* Controles del Mes */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-crema)', padding: '8px 12px', borderRadius: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  if (currentCalendarMonth === 0) {
                    setCurrentCalendarMonth(11);
                    setCurrentCalendarYear(prev => prev - 1);
                  } else {
                    setCurrentCalendarMonth(prev => prev - 1);
                  }
                }}
                style={{ border: 'none', background: 'transparent', color: 'var(--verde-oliva)', fontWeight: '800', cursor: 'pointer', fontSize: '14px' }}
              >
                ←
              </button>
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--gris-oscuro)' }}>
                {monthNames[currentCalendarMonth]} {currentCalendarYear}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (currentCalendarMonth === 11) {
                    setCurrentCalendarMonth(0);
                    setCurrentCalendarYear(prev => prev + 1);
                  } else {
                    setCurrentCalendarMonth(prev => prev + 1);
                  }
                }}
                style={{ border: 'none', background: 'transparent', color: 'var(--verde-oliva)', fontWeight: '800', cursor: 'pointer', fontSize: '14px' }}
              >
                →
              </button>
            </div>

            {/* Calendario Grid */}
            <div>
              {/* Días de la semana abreviados */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '6px' }}>
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                  <span key={i} style={{ fontSize: '10px', fontWeight: 800, color: 'var(--gris-medio)' }}>{d}</span>
                ))}
              </div>

              {/* Días Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {/* Celdas vacías iniciales */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {/* Días del mes */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateString = `${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const holiday = nonWorkingDays.find(d => d.fecha === dateString);
                  const isHoliday = !!holiday;

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={async () => {
                        try {
                          if (isHoliday) {
                            await deleteNonWorkingDay(dateString);
                            showFeedback('Día marcado como laborable.', 'info');
                          } else {
                            await addNonWorkingDay(dateString, holidayReason || 'Feriado / Cerrado');
                            showFeedback('Feriado registrado con éxito.', 'info');
                          }
                        } catch (err) {
                          showFeedback(err.message, 'danger');
                        }
                      }}
                      style={{
                        aspectRatio: '1',
                        borderRadius: '50%',
                        border: isHoliday ? '1px solid var(--rojo-alerta)' : '1px solid var(--gris-claro)',
                        backgroundColor: isHoliday ? 'var(--rojo-alerta-light)' : 'var(--blanco)',
                        color: isHoliday ? 'var(--rojo-alerta)' : 'var(--gris-oscuro)',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                        position: 'relative'
                      }}
                      title={isHoliday ? holiday.motivo : 'Día laboral'}
                    >
                      {dayNum}
                      {isHoliday && (
                        <span style={{
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--rojo-alerta)',
                          position: 'absolute',
                          bottom: '3px'
                        }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Listado de Feriados del Año */}
            <div style={{ marginTop: '4px', borderTop: '1px solid var(--gris-claro)', paddingTop: '12px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--gris-oscuro)', marginBottom: '8px' }}>Feriados Registrados:</h4>
              {nonWorkingDays.length === 0 ? (
                <p style={{ fontSize: '11px', color: 'var(--gris-medio)', fontStyle: 'italic', margin: 0 }}>No hay feriados registrados en el año.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto', paddingRight: '4px' }}>
                  {nonWorkingDays.map(d => (
                    <div key={d.fecha} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', backgroundColor: 'var(--bg-crema)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gris-oscuro)' }}>
                          {d.fecha.split('-').reverse().join('/')}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--gris-medio)' }}>{d.motivo}</span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await deleteNonWorkingDay(d.fecha);
                            showFeedback('Feriado eliminado.', 'info');
                          } catch (err) {
                            showFeedback(err.message, 'danger');
                          }
                        }}
                        style={{ border: 'none', background: 'transparent', color: 'var(--rojo-alerta)', fontWeight: '700', fontSize: '10px', cursor: 'pointer' }}
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowCalendarModal(false)}
              className="btn-tuti btn-primary-oliva"
              style={{ width: '100%', padding: '10px', fontSize: '13px' }}
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
