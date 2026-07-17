import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import OpacityIcon from '@mui/icons-material/Opacity';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function InsumosTabProfe({
  currentUser,
  classes,
  bookings,
  studentProfiles,
  createBake,
  createExtraClay
}) {
  const myClasses = classes.filter(c => c.teacherId === currentUser.id);

  // Calcular la próxima clase para autoseleccionar
  const nextClassData = useMemo(() => {
    if (myClasses.length === 0) return null;
    const now = new Date();
    let candidates = [];
    for (let i = 0; i < 7; i++) {
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
          candidates.push({
            classId: c.id,
            dateStr: dateStr,
            sucursal: c.sucursal
          });
        }
      }
    }
    candidates.sort((a, b) => a.dateObj - b.dateObj);
    return candidates.length > 0 ? candidates[0] : null;
  }, [myClasses]);

  const [selectedClassId, setSelectedClassId] = useState(nextClassData ? `${nextClassData.classId}-${nextClassData.dateStr}` : '');

  // Modal de Horneado
  const [bakeModal, setBakeModal] = useState({ 
    isOpen: false, studentId: null, studentName: null, description: '', price: '', 
    paymentMethod: 'PENDIENTE', amountCash: '', amountTransfer: '' 
  });
  // Modal de Arcilla
  const [clayModal, setClayModal] = useState({ isOpen: false, studentId: null, studentName: null, quantity: '' });

  // Derivar opciones de clases (próximos 15 días)
  const availableClasses = useMemo(() => {
    if (myClasses.length === 0) return [];
    const now = new Date();
    let list = [];
    for (let i = 0; i < 15; i++) {
      const dateToCheck = new Date();
      dateToCheck.setDate(now.getDate() + i);
      const dayName = DAYS[dateToCheck.getDay()];
      
      const dayClasses = myClasses.filter(c => c.day === dayName);
      for (const c of dayClasses) {
        const dateStr = `${dateToCheck.getFullYear()}-${String(dateToCheck.getMonth() + 1).padStart(2, '0')}-${String(dateToCheck.getDate()).padStart(2, '0')}`;
        list.push({
          id: `${c.id}-${dateStr}`,
          classId: c.id,
          dateStr: dateStr,
          label: `${c.sucursal ? c.sucursal + ' - ' : ''}${dayName} ${dateToCheck.getDate()} - ${c.time}`
        });
      }
    }
    return list;
  }, [myClasses]);

  // Alumnos inscriptos en la clase seleccionada
  const enrolledStudents = useMemo(() => {
    if (!selectedClassId) return [];
    const [cId, dateStr] = selectedClassId.split('-');
    // DateStr can have multiple hyphens (YYYY-MM-DD), so split properly:
    const actualClassId = parseInt(selectedClassId.split('-')[0], 10);
    const actualDateStr = selectedClassId.split('-').slice(1).join('-');

    return bookings.filter(b => 
      b.classId === actualClassId && 
      b.date === actualDateStr &&
      b.status !== 'CANCELLED' && b.status !== 'CANCELLED_LATE'
    );
  }, [selectedClassId, bookings]);

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

  return (
    <>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--gris-oscuro)', marginBottom: '8px' }}>
          Horneados y arcilla extra
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--gris-medio)' }}>
          Registrá los servicios de horneado o venta de arcilla extra por alumna. Se cargarán como deuda pendiente.
        </p>
      </div>

      <div className="clay-card" style={{ padding: '20px', borderRadius: '24px', backgroundColor: 'var(--blanco)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <label className="label-tuti">Turno / Clase</label>
            <select 
              className="input-tuti" 
              value={selectedClassId} 
              onChange={e => setSelectedClassId(e.target.value)}
            >
              <option value="">Seleccionar Turno</option>
              {availableClasses.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedClassId && (
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gris-oscuro)', marginBottom: '16px' }}>
            Alumnas en este turno ({enrolledStudents.length})
          </h4>
          
          {enrolledStudents.length === 0 ? (
            <div className="clay-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--gris-medio)' }}>
              No hay alumnas anotadas en esta clase.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {enrolledStudents.map(b => (
                <div key={b.id} className="clay-card" style={{ padding: '16px', borderRadius: '16px', backgroundColor: 'var(--blanco)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gris-oscuro)' }}>
                    {b.studentName}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn-tuti btn-outline-tuti" 
                      style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', borderColor: 'var(--marron-arcilla)', color: 'var(--marron-arcilla)' }}
                      onClick={() => setBakeModal({ isOpen: true, studentId: b.studentId, studentName: b.studentName, description: '', price: '', paymentMethod: 'PENDIENTE', amountCash: '', amountTransfer: '' })}
                    >
                      <LocalFireDepartmentIcon style={{ fontSize: '14px' }} /> Horneado
                    </button>
                    <button 
                      className="btn-tuti btn-outline-tuti" 
                      style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', borderColor: 'var(--verde-oliva)', color: 'var(--verde-oliva)' }}
                      onClick={() => setClayModal({ isOpen: true, studentId: b.studentId, studentName: b.studentName, quantity: '' })}
                    >
                      <OpacityIcon style={{ fontSize: '14px' }} /> Arcilla
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Horneado */}
      {bakeModal.isOpen && createPortal(
        <div className="modal-overlay" style={{ padding: '16px', zIndex: 9999 }}>
          <div className="clay-card animate-slide-up" style={{
            width: '100%', maxWidth: '400px', backgroundColor: 'var(--blanco)', padding: '24px', position: 'relative',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <button 
              type="button" 
              onClick={() => setBakeModal({...bakeModal, isOpen: false})}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--gris-medio)' }}
            >
              ✕
            </button>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gris-oscuro)', marginBottom: '16px' }}>
              Registrar horneado
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--gris-medio)', marginBottom: '16px' }}>
              Alumna: <strong>{bakeModal.studentName}</strong>
            </p>
            <form onSubmit={handleRegisterBake}>
              <div style={{ marginBottom: '16px' }}>
                <label className="label-tuti">Descripción (Ej: 2 tazas y 1 plato)</label>
                <input 
                  type="text" 
                  className="input-tuti" 
                  required
                  value={bakeModal.description}
                  onChange={e => setBakeModal({...bakeModal, description: e.target.value})}
                  placeholder="Detalle de piezas..."
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label className="label-tuti">Monto a cobrar ($)</label>
                <input 
                  type="number" 
                  className="input-tuti" 
                  required
                  value={bakeModal.price}
                  onChange={e => setBakeModal({...bakeModal, price: e.target.value})}
                  placeholder="Ej: 2500"
                  min="0"
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="label-tuti">¿Cómo abonó?</label>
                <select 
                  className="input-tuti"
                  value={bakeModal.paymentMethod}
                  onChange={e => setBakeModal({...bakeModal, paymentMethod: e.target.value})}
                >
                  <option value="PENDIENTE">A pagar (queda pendiente)</option>
                  <option value="CONTADO">Efectivo</option>
                  <option value="TRANSF">Transferencia</option>
                  <option value="COMBINADO">Combinado (Efectivo + Transferencia)</option>
                </select>
              </div>

              {bakeModal.paymentMethod === 'COMBINADO' && (
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="label-tuti">Monto Efectivo</label>
                    <input 
                      type="number" 
                      className="input-tuti" 
                      required
                      value={bakeModal.amountCash}
                      onChange={e => setBakeModal({...bakeModal, amountCash: e.target.value})}
                      placeholder="$"
                      min="0"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label-tuti">Monto Transf.</label>
                    <input 
                      type="number" 
                      className="input-tuti" 
                      required
                      value={bakeModal.amountTransfer}
                      onChange={e => setBakeModal({...bakeModal, amountTransfer: e.target.value})}
                      placeholder="$"
                      min="0"
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                className="btn-tuti btn-primary-tuti" 
                style={{ width: '100%', padding: '14px', fontSize: '15px', backgroundColor: 'var(--verde-oliva)', border: 'none' }}
              >
                Registrar
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Arcilla */}
      {clayModal.isOpen && createPortal(
        <div className="modal-overlay" style={{ padding: '16px', zIndex: 9999 }}>
          <div className="clay-card animate-slide-up" style={{
            width: '100%', maxWidth: '400px', backgroundColor: 'var(--blanco)', padding: '24px', position: 'relative',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <button 
              type="button" 
              onClick={() => setClayModal({...clayModal, isOpen: false})}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--gris-medio)' }}
            >
              ✕
            </button>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gris-oscuro)', marginBottom: '16px' }}>
              Arcilla extra
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--gris-medio)', marginBottom: '16px' }}>
              Alumna: <strong>{clayModal.studentName}</strong>
            </p>
            <form onSubmit={handleRegisterClay}>
              <div style={{ marginBottom: '24px' }}>
                <label className="label-tuti">Cantidad (Ej: 2kg)</label>
                <input 
                  type="text" 
                  className="input-tuti" 
                  required
                  value={clayModal.quantity}
                  onChange={e => setClayModal({...clayModal, quantity: e.target.value})}
                  placeholder="Ej: 1kg"
                />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--gris-medio)', fontStyle: 'italic', marginBottom: '20px' }}>
                El monto lo asignará el administrador más tarde.
              </p>
              <button 
                type="submit" 
                className="btn-tuti btn-primary-tuti" 
                style={{ width: '100%', padding: '14px', fontSize: '15px', backgroundColor: 'var(--verde-oliva)', border: 'none' }}
              >
                Registrar
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
