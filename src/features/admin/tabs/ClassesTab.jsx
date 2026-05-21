import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function ClassesTab({ showFeedback }) {
  const { users, classes, createNewTurn } = useApp();
  const teachers = users.filter(u => u.role === 'PROFE');

  const [sucursal, setSucursal]     = useState('CENTRO');
  const [teacherId, setTeacherId]   = useState('');
  const [capacity, setCapacity]     = useState('8');
  const [time, setTime]             = useState('18:00 - 20:00');
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
        teacherId, teacherName: teacher.name.split(' (')[0],
        day: repeatDays[0], time, capacity: Number(capacity), sucursal
      }, repeatDays);
      showFeedback(`¡Se crearon ${created.length} turno(s) en ${sucursal} con éxito!`, 'info');
      setTeacherId(''); setRepeatDays([]);
    } catch (err) {
      showFeedback(err.message, 'danger');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Formulario */}
      <div className="clay-card accent-oliva">
        <h3 style={{ fontSize: '16px', marginBottom: '12px', fontWeight: 600 }}>Agregar Turno Semanal</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Sucursal:</label>
              <select className="input-tuti" value={sucursal} onChange={e => setSucursal(e.target.value)}>
                <option value="CENTRO">CENTRO</option>
                <option value="ALTO VERDE">ALTO VERDE</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Profesor Asignado:</label>
              <select className="input-tuti" value={teacherId} onChange={e => setTeacherId(e.target.value)}>
                <option value="">-- Elige profesor --</option>
                {teachers.map(tc => <option key={tc.id} value={tc.id}>{tc.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Cupo Máximo:</label>
              <input type="number" className="input-tuti" value={capacity} onChange={e => setCapacity(e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Horario (HH:MM - HH:MM):</label>
              <input type="text" className="input-tuti" placeholder="ej. 17:00 - 19:00" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>

          {/* Días */}
          <div className="form-group">
            <label style={{ marginBottom: '4px' }}>Días de la semana * (uno o más):</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', backgroundColor: 'var(--bg-crema)', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gris-claro)' }}>
              {DAYS.map(day => {
                const sel = repeatDays.includes(day);
                return (
                  <button key={day} type="button" onClick={() => toggleDay(day)} style={{
                    padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--gris-claro)',
                    fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                    backgroundColor: sel ? 'var(--verde-oliva)' : 'var(--blanco)',
                    color: sel ? 'var(--blanco)' : 'var(--gris-medio)',
                    transition: 'all 0.15s ease'
                  }}>
                    {day}
                  </button>
                );
              })}
            </div>
            <span style={{ fontSize: '10px', color: 'var(--gris-medio)', marginLeft: '4px' }}>
              * Se creará un turno por cada día seleccionado.
            </span>
          </div>

          <button type="submit" className="btn-tuti btn-primary-oliva" style={{ marginTop: '6px', fontSize: '14px', padding: '12px' }}>
            + Crear Turno(s)
          </button>
        </form>
      </div>

      {/* Listado por sucursal */}
      <div>
        <h3 style={{ fontSize: '18px', marginBottom: '12px', fontWeight: 700 }}>Turnos Vigentes</h3>
        {classes.length === 0 ? (
          <div className="clay-card" style={{ textAlign: 'center', padding: '24px 20px', color: 'var(--gris-medio)' }}>
            <p style={{ fontStyle: 'italic', fontSize: '13px' }}>No hay turnos vigentes cargados.</p>
          </div>
        ) : (
          ['CENTRO', 'ALTO VERDE'].map(branch => {
            const branchClasses = classes.filter(c => (c.sucursal || '').toUpperCase() === branch);
            if (branchClasses.length === 0) return null;
            return (
              <div key={branch} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', paddingBottom: '6px', borderBottom: '2px solid var(--verde-oliva-light)' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--verde-oliva-dark)', letterSpacing: '0.5px' }}>📍 {branch}</span>
                  <span className="badge badge-oliva" style={{ fontSize: '10px' }}>{branchClasses.length} turnos</span>
                </div>
                {DAYS.map(dayName => {
                  const dayClasses = branchClasses.filter(c => c.day === dayName);
                  if (dayClasses.length === 0) return null;
                  return (
                    <div key={dayName} style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gris-medio)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{dayName}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {dayClasses.map(c => (
                          <div key={c.id} className="clay-card animate-slide-up" style={{ padding: '10px 14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gris-oscuro)' }}>{c.time}</span>
                                <p style={{ fontSize: '11px', color: 'var(--gris-medio)', marginTop: '2px' }}>Profe: {c.teacherName}</p>
                              </div>
                              <span className="badge badge-oliva" style={{ fontSize: '11px' }}>Cupo: {c.capacity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
