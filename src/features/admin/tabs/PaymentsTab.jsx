import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';

export default function PaymentsTab({ showFeedback }) {
  const { users, payments, recordStudentPayment } = useApp();
  const students = users.filter(u => u.role === 'ALUMNO');

  const [studentId, setStudentId] = useState('');
  const [amount, setAmount]       = useState('8000');
  const [credits, setCredits]     = useState('4');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId) { showFeedback('Por favor, seleccioná un alumno.', 'danger'); return; }
    try {
      await recordStudentPayment(studentId, Number(amount), Number(credits));
      const st = students.find(u => u.id === studentId);
      showFeedback(`¡Pago registrado! Se agregaron ${credits} créditos a ${st?.name}.`, 'info');
      setStudentId('');
    } catch (err) {
      showFeedback(err.message, 'danger');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Formulario */}
      <div className="clay-card accent-clay">
        <h3 style={{ fontSize: '16px', marginBottom: '12px', fontWeight: 600 }}>Registrar Pago Externo</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label>Seleccioná Alumno:</label>
            <select className="input-tuti" value={studentId} onChange={e => setStudentId(e.target.value)}>
              <option value="">-- Elige alumno --</option>
              {students.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Monto Pago ($):</label>
              <input type="number" className="input-tuti" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Pack Clases:</label>
              <select className="input-tuti" value={credits} onChange={e => setCredits(e.target.value)}>
                <option value="4">4 Clases</option>
                <option value="8">8 Clases</option>
                <option value="12">12 Clases</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-tuti btn-primary-clay" style={{ marginTop: '4px', fontSize: '14px', padding: '12px' }}>
            ✓ Confirmar Pago y Cargar Clases
          </button>
        </form>
      </div>

      {/* Historial */}
      <div>
        <h3 style={{ fontSize: '18px', marginBottom: '12px', fontWeight: 700 }}>Historial de Pagos</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {payments.length === 0 ? (
            <div className="clay-card" style={{ textAlign: 'center', padding: '24px 20px', color: 'var(--gris-medio)' }}>
              <p style={{ fontStyle: 'italic', fontSize: '13px' }}>No hay registros de pagos.</p>
            </div>
          ) : payments.map(pay => {
            const st = students.find(u => u.id === pay.studentId);
            return (
              <div key={pay.id} className="clay-card animate-slide-up" style={{ padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gris-oscuro)' }}>{st?.name || 'Alumno'}</h4>
                    <p style={{ fontSize: '11px', color: 'var(--gris-medio)', marginTop: '2px' }}>
                      Fecha: {pay.date} | Pack: +{pay.classCreditsAdded} clases
                    </p>
                  </div>
                  <span className="badge badge-clay" style={{ fontSize: '12px', fontWeight: 'bold' }}>
                    ${pay.amount.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
