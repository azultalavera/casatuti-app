import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_ABBR = { Lunes: 'LUN', Martes: 'MAR', 'Miércoles': 'MIÉ', Jueves: 'JUE', Viernes: 'VIE', Sábado: 'SÁB' };
export default function ClassesTab({ showFeedback }) {
  const { users, classes, createNewTurn, changeClassTeacher, branches } = useApp();
  const teachers = users.filter(u => u.role === 'PROFE');

  const [mode, setMode] = useState('list'); // 'list' or 'create'
  const [editingTeacherClassId, setEditingTeacherClassId] = useState(null);

  // Calcular día actual por defecto
  const todayNum = new Date().getDay(); // 0=Dom, 1=Lun, 2=Mar...
  const defaultIdx = (todayNum === 0 || todayNum === 6) ? 0 : todayNum - 1;
  const defaultDay = DAYS[defaultIdx] || 'Lunes';
  const [selectedDay, setSelectedDay] = useState(defaultDay);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('ALL');

  const [sucursal, setSucursal] = useState(branches.length > 0 ? branches[0].name : 'CENTRO');
  const [teacherId, setTeacherId] = useState('');
  const [capacity, setCapacity] = useState('8');
  const [time, setTime] = useState('18:00 - 20:00');
  const [repeatDays, setRepeatDays] = useState([]);


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

  // Turnos del día y sucursal seleccionados
  const classesForDay = classes.filter(c => c.day === selectedDay && (selectedBranchFilter === 'ALL' || (c.sucursal || '').toUpperCase() === selectedBranchFilter));


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
                {branches.map(b => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
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
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
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
          {/* Header de la Tab y Filtros */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--gris-oscuro)', margin: 0, fontFamily: 'Outfit, sans-serif' }}>Turnos</h2>
            </div>

            {/* Filtro Sucursal */}
            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-crema-claro)', padding: '4px', borderRadius: 'var(--radius-md)', border: 'none', overflowX: 'auto' }}>
              {[{ id: 'all', name: 'ALL' }, ...branches].map((branch) => {
                const isActive = selectedBranchFilter === branch.name;
                return (
                  <button
                    key={branch.id}
                    onClick={() => setSelectedBranchFilter(branch.name)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      backgroundColor: isActive ? 'var(--verde-oliva)' : 'transparent',
                      color: isActive ? 'var(--blanco)' : 'var(--gris-medio)',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {branch.name === 'ALL' ? 'Todas' : branch.name}
                  </button>
                );
              })}
            </div>
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
                    padding: '8px',
                    borderRadius: '24px',
                    border: 'none',
                    backgroundColor: isSelected
                      ? 'var(--card-rust)'
                      : 'var(--blanco)',
                    color: isSelected
                      ? 'var(--blanco)'
                      : 'var(--gris-oscuro)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    boxShadow: isSelected ? '0 8px 24px rgba(204, 122, 66, 0.3)' : '0 4px 16px rgba(0,0,0,0.03)',
                    minWidth: '48px',
                    height: '80px'
                  }}
                >
                  <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.5px', fontFamily: 'Outfit, sans-serif' }}>
                    {DAY_ABBR[day]}
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
                    gap: '4px',
                    marginTop: '4px',
                    paddingBottom: '4px',
                    borderBottom: '2px solid var(--verde-oliva-light)'
                  }}>
                    <LocationOnIcon style={{ color: 'var(--verde-oliva-dark)', fontSize: '16px' }} />
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--verde-oliva-dark)', letterSpacing: '0.5px' }}>
                      {branch}
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
                        className="stat-card-modern animate-slide-up"
                        style={{
                          padding: '20px',
                          borderRadius: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: 'var(--blanco)',
                          border: 'none',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                          transition: 'transform 0.2s ease'
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
                                  border: 'none',
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
              setSucursal(branches.length > 0 ? branches[0].name : 'CENTRO');
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
    </div>
  );
}
