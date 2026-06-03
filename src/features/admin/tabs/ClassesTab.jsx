import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_ABBR = { Lunes: 'LUN', Martes: 'MAR', 'Miércoles': 'MIÉ', Jueves: 'JUE', Viernes: 'VIE', Sábado: 'SÁB' };
export default function ClassesTab({ showFeedback }) {
  const { users, classes, createNewTurn, changeClassTeacher, updateTurn, deleteTurn, branches } = useApp();
  const teachers = users.filter(u => u.role === 'PROFE');

  const [mode, setMode] = useState('list'); // 'list', 'create', or 'edit'
  const [editingTeacherClassId, setEditingTeacherClassId] = useState(null);
  const [expandedClassId, setExpandedClassId] = useState(null);
  const [editingClass, setEditingClass] = useState(null);

  // Calcular día actual por defecto
  const todayNum = new Date().getDay(); // 0=Dom, 1=Lun, 2=Mar...
  const defaultIdx = (todayNum === 0 || todayNum === 6) ? 0 : todayNum - 1;
  const defaultDay = DAYS[defaultIdx] || 'Lunes';
  const [selectedDay, setSelectedDay] = useState(defaultDay);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('ALL');

  const [sucursal, setSucursal] = useState(branches.length > 0 ? branches[0].name : 'CENTRO');
  const [teacherId, setTeacherId] = useState('');
  const [capacity, setCapacity] = useState('8');
  const [startHour, setStartHour] = useState('18');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('20');
  const [endMinute, setEndMinute] = useState('00');
  const [repeatDays, setRepeatDays] = useState([]);

  // Estados para formulario de Edición
  const [editSucursal, setEditSucursal] = useState('CENTRO');
  const [editTeacherId, setEditTeacherId] = useState('');
  const [editCapacity, setEditCapacity] = useState('8');
  const [editStartHour, setEditStartHour] = useState('18');
  const [editStartMinute, setEditStartMinute] = useState('00');
  const [editEndHour, setEditEndHour] = useState('20');
  const [editEndMinute, setEditEndMinute] = useState('00');
  const [editDay, setEditDay] = useState('Lunes');

  const toggleDay = (day) =>
    setRepeatDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!teacherId) { showFeedback('Por favor, seleccioná un profesor.', 'danger'); return; }
    if (repeatDays.length === 0) { showFeedback('Seleccioná al menos un día.', 'danger'); return; }
    
    const startVal = Number(startHour) * 60 + Number(startMinute);
    const endVal = Number(endHour) * 60 + Number(endMinute);
    if (endVal <= startVal) {
      showFeedback('La hora de salida debe ser posterior a la hora de entrada.', 'danger');
      return;
    }

    const timeString = `${startHour}:${startMinute} - ${endHour}:${endMinute}`;

    // Validar duplicados por día, sucursal y rango horario
    for (const day of repeatDays) {
      const hasDuplicate = classes.some(c => 
        c.day === day &&
        (c.sucursal || '').toUpperCase() === sucursal.toUpperCase() &&
        c.time === timeString
      );
      if (hasDuplicate) {
        showFeedback(`Ya existe un turno registrado en la sucursal ${sucursal} el día ${day} en el horario ${timeString}.`, 'danger');
        return;
      }
    }

    const teacher = users.find(u => u.id == teacherId);
    try {
      const created = await createNewTurn({
        teacherId,
        teacherName: teacher ? teacher.name.split(' (')[0] : 'Sin profesor',
        day: repeatDays[0],
        time: timeString,
        capacity: Number(capacity),
        sucursal
      }, repeatDays);
      showFeedback(`¡Se crearon ${created.length} turno(s) en ${sucursal} con éxito!`, 'info');
      setTeacherId('');
      setRepeatDays([]);
      setStartHour('18');
      setStartMinute('00');
      setEndHour('20');
      setEndMinute('00');
      setMode('list');
    } catch (err) {
      showFeedback(err.message, 'danger');
    }
  };

  const handleStartEdit = (c) => {
    setEditingClass(c);
    setEditSucursal(c.sucursal || 'CENTRO');
    setEditTeacherId(c.teacherId || '');
    setEditCapacity(String(c.capacity || '8'));
    setEditDay(c.day || 'Lunes');

    // Parsear horario: "18:00 - 20:00"
    if (c.time && c.time.includes(' - ')) {
      const [start, end] = c.time.split(' - ');
      if (start.includes(':')) {
        const [sh, sm] = start.split(':');
        setEditStartHour(sh);
        setEditStartMinute(sm);
      }
      if (end.includes(':')) {
        const [eh, em] = end.split(':');
        setEditEndHour(eh);
        setEditEndMinute(em);
      }
    } else {
      setEditStartHour('18');
      setEditStartMinute('00');
      setEditEndHour('20');
      setEditEndMinute('00');
    }

    setMode('edit');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editTeacherId) { showFeedback('Por favor, seleccioná un profesor.', 'danger'); return; }

    const startVal = Number(editStartHour) * 60 + Number(editStartMinute);
    const endVal = Number(editEndHour) * 60 + Number(editEndMinute);
    if (endVal <= startVal) {
      showFeedback('La hora de salida debe ser posterior a la hora de entrada.', 'danger');
      return;
    }

    const timeString = `${editStartHour}:${editStartMinute} - ${editEndHour}:${editEndMinute}`;

    // Validar duplicados por día, sucursal y rango horario (excluyendo el turno actual)
    const hasDuplicate = classes.some(c => 
      c.id !== editingClass.id &&
      c.day === editDay &&
      (c.sucursal || '').toUpperCase() === editSucursal.toUpperCase() &&
      c.time === timeString
    );
    if (hasDuplicate) {
      showFeedback(`Ya existe un turno registrado en la sucursal ${editSucursal} el día ${editDay} en el horario ${timeString}.`, 'danger');
      return;
    }

    const teacher = users.find(u => u.id == editTeacherId);
    try {
      await updateTurn(editingClass.id, {
        teacherId: editTeacherId,
        teacherName: teacher ? teacher.name.split(' (')[0] : 'Sin profesor',
        day: editDay,
        time: timeString,
        capacity: Number(editCapacity),
        sucursal: editSucursal
      });
      showFeedback('¡Turno modificado con éxito!', 'info');
      setMode('list');
      setEditingClass(null);
      setExpandedClassId(null);
    } catch (err) {
      showFeedback(err.message, 'danger');
    }
  };

  const handleDeleteClass = async (classId, time, day) => {
    if (!window.confirm(`¿Estás seguro de eliminar el turno del día ${day} a las ${time}?\n\nSe cancelarán todas las inscripciones e instancias futuras asociadas a este turno.`)) {
      return;
    }
    try {
      await deleteTurn(classId);
      showFeedback('¡Turno eliminado con éxito!', 'info');
      setExpandedClassId(null);
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
          </button>

          <h3 style={{ fontSize: '18px', marginBottom: '18px', fontWeight: 700, color: 'var(--gris-oscuro)' }}>Agregar turno semanal</h3>

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
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Profesor asignado *</label>
              <select className="input-tuti" value={teacherId} onChange={e => setTeacherId(e.target.value)} style={{ width: '100%', cursor: 'pointer' }}>
                <option value="">-- Seleccionar profesor --</option>
                {teachers.map(tc => <option key={tc.id} value={tc.id}>{tc.name}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Cupo máximo *</label>
              <input type="number" className="input-tuti" value={capacity} onChange={e => setCapacity(e.target.value)} style={{ width: '100%' }} />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Horario *</label>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'nowrap' }}>
                {/* Entrada */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <select 
                    className="input-tuti" 
                    value={startHour} 
                    onChange={e => setStartHour(e.target.value)} 
                    style={{ width: '58px', padding: '10px 4px', cursor: 'pointer', textAlign: 'center' }}
                  >
                    {Array.from({ length: 24 }).map((_, i) => {
                      const h = String(i).padStart(2, '0');
                      return <option key={h} value={h}>{h}</option>;
                    })}
                  </select>
                  <span style={{ color: 'var(--gris-medio)', fontWeight: 'bold' }}>:</span>
                  <select 
                    className="input-tuti" 
                    value={startMinute} 
                    onChange={e => setStartMinute(e.target.value)} 
                    style={{ width: '58px', padding: '10px 4px', cursor: 'pointer', textAlign: 'center' }}
                  >
                    {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <span style={{ color: 'var(--gris-medio)', fontSize: '11px', fontWeight: '500', margin: '0 4px' }}>a</span>

                {/* Salida */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <select 
                    className="input-tuti" 
                    value={endHour} 
                    onChange={e => setEndHour(e.target.value)} 
                    style={{ width: '58px', padding: '10px 4px', cursor: 'pointer', textAlign: 'center' }}
                  >
                    {Array.from({ length: 24 }).map((_, i) => {
                      const h = String(i).padStart(2, '0');
                      return <option key={h} value={h}>{h}</option>;
                    })}
                  </select>
                  <span style={{ color: 'var(--gris-medio)', fontWeight: 'bold' }}>:</span>
                  <select 
                    className="input-tuti" 
                    value={endMinute} 
                    onChange={e => setEndMinute(e.target.value)} 
                    style={{ width: '58px', padding: '10px 4px', cursor: 'pointer', textAlign: 'center' }}
                  >
                    {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
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

            <button type="submit" className="btn-tuti btn-success-soft" style={{ marginTop: '8px', fontSize: '14px', padding: '12px' }}>
              + Crear turno(s)
            </button>
          </form>
        </div>
      )}

      {/* 2. VISTA DE EDICIÓN */}
      {mode === 'edit' && (
        <div className="clay-card animate-slide-up" style={{ padding: '24px' }}>
          {/* Botón de volver */}
          <button
            onClick={() => { setMode('list'); setEditingClass(null); }}
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

          <h3 style={{ fontSize: '18px', marginBottom: '18px', fontWeight: 700, color: 'var(--gris-oscuro)' }}>Editar turno semanal</h3>

          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Sucursal *</label>
              <select className="input-tuti" value={editSucursal} onChange={e => setEditSucursal(e.target.value)} style={{ width: '100%', cursor: 'pointer' }}>
                {branches.map(b => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Día de la semana *</label>
              <select className="input-tuti" value={editDay} onChange={e => setEditDay(e.target.value)} style={{ width: '100%', cursor: 'pointer' }}>
                {DAYS.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Profesor asignado *</label>
              <select className="input-tuti" value={editTeacherId} onChange={e => setEditTeacherId(e.target.value)} style={{ width: '100%', cursor: 'pointer' }}>
                <option value="">-- Seleccionar profesor --</option>
                {teachers.map(tc => <option key={tc.id} value={tc.id}>{tc.name}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Cupo máximo *</label>
              <input type="number" className="input-tuti" value={editCapacity} onChange={e => setEditCapacity(e.target.value)} style={{ width: '100%' }} />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Horario *</label>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'nowrap' }}>
                {/* Entrada */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <select 
                    className="input-tuti" 
                    value={editStartHour} 
                    onChange={e => setEditStartHour(e.target.value)} 
                    style={{ width: '58px', padding: '10px 4px', cursor: 'pointer', textAlign: 'center' }}
                  >
                    {Array.from({ length: 24 }).map((_, i) => {
                      const h = String(i).padStart(2, '0');
                      return <option key={h} value={h}>{h}</option>;
                    })}
                  </select>
                  <span style={{ color: 'var(--gris-medio)', fontWeight: 'bold' }}>:</span>
                  <select 
                    className="input-tuti" 
                    value={editStartMinute} 
                    onChange={e => setEditStartMinute(e.target.value)} 
                    style={{ width: '58px', padding: '10px 4px', cursor: 'pointer', textAlign: 'center' }}
                  >
                    {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <span style={{ color: 'var(--gris-medio)', fontSize: '11px', fontWeight: '500', margin: '0 4px' }}>a</span>

                {/* Salida */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <select 
                    className="input-tuti" 
                    value={editEndHour} 
                    onChange={e => setEditEndHour(e.target.value)} 
                    style={{ width: '58px', padding: '10px 4px', cursor: 'pointer', textAlign: 'center' }}
                  >
                    {Array.from({ length: 24 }).map((_, i) => {
                      const h = String(i).padStart(2, '0');
                      return <option key={h} value={h}>{h}</option>;
                    })}
                  </select>
                  <span style={{ color: 'var(--gris-medio)', fontWeight: 'bold' }}>:</span>
                  <select 
                    className="input-tuti" 
                    value={editEndMinute} 
                    onChange={e => setEditEndMinute(e.target.value)} 
                    style={{ width: '58px', padding: '10px 4px', cursor: 'pointer', textAlign: 'center' }}
                  >
                    {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" className="btn-tuti btn-success-soft" style={{ marginTop: '8px', fontSize: '14px', padding: '12px' }}>
              Guardar Cambios
            </button>
          </form>
        </div>
      )}

      {/* 3. VISTA DE CONSULTA / LISTADO */}
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
          <div className="days-selector-wrapper">
            {DAYS.map(day => {
              const isSelected = selectedDay === day;
              const dayClasses = classes.filter(c => c.day === day);
              const hasTurns = dayClasses.length > 0;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className="day-card-btn"
                  style={{
                    backgroundColor: isSelected
                      ? 'var(--card-rust)'
                      : 'var(--blanco)',
                    color: isSelected
                      ? 'var(--blanco)'
                      : 'var(--gris-oscuro)',
                    boxShadow: isSelected ? '0 8px 24px rgba(204, 122, 66, 0.3)' : '0 4px 16px rgba(0,0,0,0.03)',
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
                    {branchClasses.map(c => {
                      const isExpanded = expandedClassId === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => setExpandedClassId(isExpanded ? null : c.id)}
                          className="stat-card-modern animate-slide-up"
                          style={{
                            padding: '20px',
                            borderRadius: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: 'var(--blanco)',
                            border: 'none',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                            transition: 'transform 0.2s ease',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <div>
                              {/* Horario en Fuente Serif Premium */}
                              <span style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--gris-oscuro)' }}>
                                {c.time}
                              </span>

                              {/* Profesor asignable */}
                              {editingTeacherClassId === c.id ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }} onClick={e => e.stopPropagation()}>
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTeacherClassId(c.id);
                                  }}
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
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }} onClick={e => e.stopPropagation()}>
                              <span className="badge badge-oliva" style={{ fontSize: '10px', padding: '3px 8px', fontWeight: '800' }}>
                                Cupo: {c.capacity}
                              </span>
                            </div>
                          </div>

                          {/* Seccion Expandida con Acciones */}
                          {isExpanded && (
                            <div
                              onClick={e => e.stopPropagation()}
                              style={{
                                width: '100%',
                                marginTop: '12px',
                                borderTop: '1px solid rgba(0,0,0,0.04)',
                                paddingTop: '12px',
                                display: 'flex',
                                gap: '8px',
                                animation: 'fadeInAcc 0.2s ease-out'
                              }}
                            >
                              <button
                                onClick={() => handleStartEdit(c)}
                                className="btn-tuti"
                                style={{
                                  flex: 1,
                                  padding: '8px 0',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  fontWeight: '800',
                                  cursor: 'pointer',
                                  backgroundColor: 'var(--gris-oscuro)',
                                  color: 'var(--blanco)',
                                  border: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px'
                                }}
                              >
                                <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                </svg>
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeleteClass(c.id, c.time, c.day)}
                                style={{
                                  flex: 1,
                                  padding: '8px 0',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  fontWeight: '800',
                                  cursor: 'pointer',
                                  backgroundColor: '#FFF5F5',
                                  color: '#E53E3E',
                                  border: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px'
                                }}
                              >
                                <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

        </div>
      )}

      {/* Botón Flotante "+" para Crear Turnos */}
      {mode === 'list' && (
        <button
          onClick={() => {
            setSucursal(branches.length > 0 ? branches[0].name : 'CENTRO');
            setTeacherId('');
            setCapacity('8');
            setStartHour('18');
            setStartMinute('00');
            setEndHour('20');
            setEndMinute('00');
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
            animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
          }}
          title="Agregar Turno Semanal"
        >
          +
        </button>
      )}

      {/* Estilos CSS Inyectados */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeInAcc {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          from { transform: scale(0.7); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}} />

    </div>
  );
}
