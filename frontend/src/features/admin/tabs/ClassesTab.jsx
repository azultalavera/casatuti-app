import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_ABBR = { Lunes: 'LUN', Martes: 'MAR', 'Miércoles': 'MIÉ', Jueves: 'JUE', Viernes: 'VIE', Sábado: 'SÁB' };
const getMonday = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
  return new Date(date.setDate(diff));
};

const formatDateToLocal = (date) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return (new Date(date.getTime() - tzOffset)).toISOString().split('T')[0];
};

export default function ClassesTab({ showFeedback }) {
  const { users, classes, createNewTurn, changeClassTeacher, updateTurn, deleteTurn, toggleClassPauseAction, branches, bookings = [] } = useApp();
  const teachers = users.filter(u => u.role === 'PROFE');

  const [mode, setMode] = useState('list'); // 'list', 'create', or 'edit'
  const [editingTeacherClassId, setEditingTeacherClassId] = useState(null);
  const [expandedClassId, setExpandedClassId] = useState(null);
  const [editingClass, setEditingClass] = useState(null);

  const [currentWeekMonday, setCurrentWeekMonday] = useState(() => getMonday(new Date()));

  // Calcular día actual por defecto
  const todayNum = new Date().getDay(); // 0=Dom, 1=Lun, 2=Mar...
  const defaultIdx = (todayNum === 0 || todayNum === 6) ? 0 : todayNum - 1;
  const defaultDay = DAYS[defaultIdx] || 'Lunes';
  const [selectedDay, setSelectedDay] = useState(defaultDay);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('ALL');

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekMonday);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekMonday(prev);
  };
  const handleNextWeek = () => {
    const next = new Date(currentWeekMonday);
    next.setDate(next.getDate() + 7);
    setCurrentWeekMonday(next);
  };

  const selectedDayIndex = DAYS.indexOf(selectedDay);
  const selectedDate = new Date(currentWeekMonday);
  if (selectedDayIndex !== -1) selectedDate.setDate(selectedDate.getDate() + selectedDayIndex);
  const selectedDateString = formatDateToLocal(selectedDate);

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

  const handleTogglePause = async (classId, isCurrentlyPaused) => {
    const actionName = isCurrentlyPaused ? 'reanudar' : 'pausar';
    let confirmMsg = `¿Estás seguro de que querés ${actionName} el turno del día ${selectedDay} ${selectedDateString}?`;
    if (!isCurrentlyPaused) {
      confirmMsg += `\n\nATENCIÓN: Se cancelarán todas las reservas confirmadas de las alumnas para esta fecha, y se les devolverá el crédito a su perfil.`;
    }
    if (!window.confirm(confirmMsg)) return;

    try {
      await toggleClassPauseAction(classId, selectedDateString, !isCurrentlyPaused);
      showFeedback(`Turno ${isCurrentlyPaused ? 'reanudado' : 'pausado'} con éxito.`, 'info');
    } catch (err) {
      showFeedback(err.message, 'danger');
    }
  };

  // Turnos del día y sucursal seleccionados
  const classesForDay = classes.filter(c => c.day === selectedDay && (selectedBranchFilter === 'ALL' || (c.sucursal || '').toUpperCase() === selectedBranchFilter.toUpperCase()));


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* 1. VISTA DE CREACIÓN / REGISTRO */}
      {mode === 'create' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(30, 27, 22, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '16px'
        }}>
          <div className="clay-card animate-slide-up" style={{
            width: '100%', maxWidth: '460px', backgroundColor: 'var(--blanco)', padding: '24px',
            maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px',
            boxShadow: '0 12px 36px rgba(44, 38, 30, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gris-oscuro)', margin: 0 }}>
                Agregar turno semanal
              </h3>
              <button
                type="button"
                onClick={() => setMode('list')}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--gris-medio)' }}
              >
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

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
        </div>
      )}

      {/* 2. VISTA DE EDICIÓN */}
      {mode === 'edit' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(30, 27, 22, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '16px'
        }}>
          <div className="clay-card animate-slide-up" style={{
            width: '100%', maxWidth: '460px', backgroundColor: 'var(--blanco)', padding: '24px',
            maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px',
            boxShadow: '0 12px 36px rgba(44, 38, 30, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gris-oscuro)', margin: 0 }}>
                Editar turno semanal
              </h3>
              <button
                type="button"
                onClick={() => { setMode('list'); setEditingClass(null); }}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--gris-medio)' }}
              >
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

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
        </div>
      )}

      {/* 3. VISTA DE CONSULTA / LISTADO */}
      <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header de la Tab y Filtros */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--gris-oscuro)', margin: 0, fontFamily: 'Outfit, sans-serif' }}>Turnos</h2>
              
              {/* Controles de Semana */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f5f3f0', padding: '4px 12px', borderRadius: '16px' }}>
                <button onClick={handlePrevWeek} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--verde-oliva)', display: 'flex', alignItems: 'center' }}>
                  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--gris-oscuro)' }}>
                  {(() => {
                    const endOfWeek = new Date(currentWeekMonday);
                    endOfWeek.setDate(endOfWeek.getDate() + 5);
                    const fmt = (d) => `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}`;
                    return `Semana ${fmt(currentWeekMonday)} al ${fmt(endOfWeek)}`;
                  })()}
                </span>
                <button onClick={handleNextWeek} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--verde-oliva)', display: 'flex', alignItems: 'center' }}>
                  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
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
            {DAYS.map((day, idx) => {
              const isSelected = selectedDay === day;
              const dayClasses = classes.filter(c => c.day === day);
              const hasTurns = dayClasses.length > 0;

              const dateForDay = new Date(currentWeekMonday);
              dateForDay.setDate(dateForDay.getDate() + idx);
              const dateNum = dateForDay.getDate();

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
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px'
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 600, opacity: isSelected ? 0.9 : 0.6 }}>
                    {DAY_ABBR[day]}
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.5px', fontFamily: 'Outfit, sans-serif' }}>
                    {dateNum}
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
                      const isPaused = c.pausedDates && c.pausedDates.includes(selectedDateString);

                      return (
                        <div
                          key={c.id}
                          onClick={() => setExpandedClassId(isExpanded ? null : c.id)}
                          className={`stat-card-modern animate-slide-up ${isPaused ? 'paused-card' : ''}`}
                          style={{
                            padding: '20px',
                            borderRadius: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: isPaused ? '#fff9f9' : 'var(--blanco)',
                            border: isPaused ? '1px solid #ffebeb' : 'none',
                            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.08)',
                            transition: 'transform 0.2s ease',
                            cursor: 'pointer',
                            opacity: isPaused ? 0.7 : 1
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
                                    <option value="">-- Seleccionar profe --</option>
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
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }} onClick={e => e.stopPropagation()}>
                              {isPaused && (
                                <span className="badge badge-danger" style={{ fontSize: '10px', padding: '3px 8px', fontWeight: '800', backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                                  PAUSADA
                                </span>
                              )}
                              <span className="badge badge-oliva" style={{ fontSize: '10px', padding: '3px 8px', fontWeight: '800' }}>
                                Cupo: {c.capacity}
                              </span>
                            </div>
                          </div>

                          {/* Seccion Expandida con Acciones */}
                          {isExpanded && (() => {
                            const enrolled = bookings.filter(b => b.classId === c.id && b.date === selectedDateString && (b.status === 'CONFIRMED' || b.status === 'ATTENDED'));
                            
                            return (
                              <div
                                onClick={e => e.stopPropagation()}
                                style={{
                                  width: '100%',
                                  marginTop: '12px',
                                  borderTop: '1px solid rgba(0,0,0,0.04)',
                                  paddingTop: '12px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '12px',
                                  animation: 'fadeInAcc 0.2s ease-out'
                                }}
                              >
                                {/* Lista de Alumnas Inscriptas */}
                                <div>
                                  <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gris-medio)', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Alumnas Inscriptas ({enrolled.length}/{c.capacity})
                                  </h4>
                                  {isPaused ? (
                                    <p style={{ fontSize: '13px', color: '#E53E3E', fontStyle: 'italic', margin: 0, fontWeight: 500 }}>Este turno fue pausado en esta fecha.</p>
                                  ) : enrolled.length === 0 ? (
                                    <p style={{ fontSize: '13px', color: 'var(--gris-claro)', fontStyle: 'italic', margin: 0 }}>No hay reservas para esta fecha.</p>
                                  ) : (
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      {enrolled.map(booking => (
                                        <li key={booking.id} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gris-oscuro)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--verde-oliva)', display: 'inline-block' }}></span>
                                          {booking.studentName}
                                          {booking.status === 'ATTENDED' && <span className="badge badge-success" style={{ fontSize: '9px', padding: '1px 4px', marginLeft: '4px' }}>Presente</span>}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                                
                                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                  <button
                                    onClick={() => handleTogglePause(c.id, isPaused)}
                                    className="btn-tuti"
                                    style={{
                                      flex: 1,
                                      padding: '8px 0',
                                      borderRadius: '12px',
                                      fontSize: '12px',
                                      fontWeight: '800',
                                      cursor: 'pointer',
                                      backgroundColor: isPaused ? '#E6F4EA' : '#FFF5F5',
                                      color: isPaused ? '#1E8E3E' : '#E53E3E',
                                      border: 'none',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '6px'
                                    }}
                                  >
                                    {isPaused ? 'Reanudar' : 'Pausar'} Fecha
                                  </button>
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
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

        </div>

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
          <svg style={{ width: '28px', height: '28px' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
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
