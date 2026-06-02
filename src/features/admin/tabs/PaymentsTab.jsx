import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import SettingsIcon from '@mui/icons-material/Settings';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

export default function PaymentsTab({ showFeedback }) {
  const {
    users,
    payments,
    packs,
    recordStudentPayment,
    confirmPendingPayment,
    sendTransferReminder,
    branches
  } = useApp();

  // Filtro de Sucursal
  const [selectedBranch, setSelectedBranch] = useState('ALL');

  const baseStudents = users.filter(u => u.role === 'ALUMNO');

  const students = selectedBranch === 'ALL'
    ? baseStudents
    : baseStudents.filter(s => (s.sucursal || '').toUpperCase() === selectedBranch);

  const pendingPayments = payments.filter(p => {
    if (p.status !== 'PENDING') return false;
    if (selectedBranch === 'ALL') return true;
    const st = baseStudents.find(s => s.id === p.studentId);
    return st && (st.sucursal || '').toUpperCase() === selectedBranch;
  });

  const confirmedPayments = payments.filter(p => {
    if (p.status !== 'PAID') return false;
    if (selectedBranch === 'ALL') return true;
    const st = baseStudents.find(s => s.id === p.studentId);
    return st && (st.sucursal || '').toUpperCase() === selectedBranch;
  });

  // Formulario Manual
  const [manualStudentIds, setManualStudentIds] = useState([]);
  const [searchStudent, setSearchStudent] = useState('');
  const [selectedPackId, setSelectedPackId] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [showSelectStudentsModal, setShowSelectStudentsModal] = useState(false);


  // Acciones Masivas
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // Acordeones
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(pendingPayments.length > 0);
  const [manualOpen, setManualOpen] = useState(false);

  React.useEffect(() => {
    if (pendingPayments.length > 0) setPendingOpen(true);
  }, [pendingPayments.length]);

  const handlePackChange = (e) => {
    const pId = e.target.value;
    setSelectedPackId(pId);
    if (pId) {
      const pack = packs.find(p => p.id === Number(pId));
      if (pack) setManualAmount(pack.price.toString());
    } else {
      setManualAmount('');
    }
  };

  const toggleManualStudent = (id) => {
    if (manualStudentIds.includes(id)) {
      setManualStudentIds(manualStudentIds.filter(s => s !== id));
    } else {
      setManualStudentIds([...manualStudentIds, id]);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (manualStudentIds.length === 0) { showFeedback('Por favor, seleccioná al menos una alumna.', 'danger'); return; }
    if (!selectedPackId) { showFeedback('Por favor, seleccioná un pack.', 'danger'); return; }
    if (!manualAmount) { showFeedback('Por favor, ingresá un monto.', 'danger'); return; }

    const pack = packs.find(p => p.id === Number(selectedPackId));
    if (!pack) return;

    // Se asume que el monto modificado es para TODAS las alumnas seleccionadas por igual
    try {
      await recordStudentPayment(manualStudentIds, Number(manualAmount), pack.credits, paymentDate);
      showFeedback(`¡Pagos registrados! Se agregaron ${pack.credits} créditos a ${manualStudentIds.length} alumna(s).`, 'info');
      setManualStudentIds([]);
      setSearchStudent('');
      setManualAmount('');
      setSelectedPackId('');
      setPaymentDate(new Date().toISOString().split('T')[0]);

      setManualOpen(false);
      setHistoryOpen(true);
    } catch (err) {
      showFeedback(err.message, 'danger');
    }
  };

  const toggleSelectAll = (e) => {
    e.stopPropagation();
    if (selectedPayments.length === pendingPayments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(pendingPayments.map(p => p.id));
    }
  };

  const toggleSelectOne = (id) => {
    if (selectedPayments.includes(id)) {
      setSelectedPayments(selectedPayments.filter(pId => pId !== id));
    } else {
      setSelectedPayments([...selectedPayments, id]);
    }
  };

  const handleBulkConfirm = async () => {
    if (!confirm(`¿Estás seguro de confirmar ${selectedPayments.length} pagos?`)) return;
    setIsProcessingBulk(true);
    let successCount = 0;
    for (const id of selectedPayments) {
      try {
        await confirmPendingPayment(id);
        successCount++;
      } catch (e) {
        console.error(`Error confirmando pago ${id}:`, e);
      }
    }
    setIsProcessingBulk(false);
    setSelectedPayments([]);
    if (successCount > 0) {
      showFeedback(`Se confirmaron ${successCount} pagos exitosamente.`, 'info');
      setPendingOpen(false);
      setHistoryOpen(true);
    }
  };

  const handleBulkNotify = async () => {
    if (!confirm(`¿Estás seguro de enviar ${selectedPayments.length} recordatorios?`)) return;
    setIsProcessingBulk(true);
    let successCount = 0;
    for (const id of selectedPayments) {
      try {
        await sendTransferReminder(id);
        successCount++;
      } catch (e) {
        console.error(`Error notificando pago ${id}:`, e);
      }
    }
    setIsProcessingBulk(false);
    setSelectedPayments([]);
    if (successCount > 0) {
      showFeedback(`Se enviaron ${successCount} notificaciones.`, 'info');
    }
  };

  const searchedStudents = students.filter(s => s.name.toLowerCase().includes(searchStudent.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: selectedPayments.length > 0 ? '80px' : '0' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gris-oscuro)', margin: 0 }}>Pagos</h2>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Filtro Sucursal */}
          <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-crema-claro)', padding: '4px', borderRadius: 'var(--radius-md)', border: 'none', overflowX: 'auto' }}>
            {[{ id: 'all', name: 'ALL' }, ...branches].map((branch) => {
              const isActive = selectedBranch === branch.name;
              return (
                <button
                  key={branch.id}
                  onClick={() => setSelectedBranch(branch.name)}
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
      </div>

      {/* Pagos Pendientes */}
      <details
        open={pendingOpen}
        onToggle={(e) => setPendingOpen(e.target.open)}
        className="stat-card-modern"
        style={{ padding: '0', overflow: 'hidden', border: 'none', borderRadius: '24px', backgroundColor: 'var(--blanco)', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}
      >
        <summary style={{ padding: '16px', fontWeight: 700, fontSize: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <HourglassEmptyIcon style={{ color: 'var(--marron-arcilla)' }} /> Pagos Pendientes
            {pendingPayments.length > 0 && <span className="badge badge-clay" style={{ fontSize: '11px', padding: '2px 6px' }}>{pendingPayments.length}</span>}
          </div>

          {pendingPayments.length > 0 && (
            <div
              onClick={toggleSelectAll}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg-crema)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
            >
              <input
                type="checkbox"
                checked={selectedPayments.length === pendingPayments.length && pendingPayments.length > 0}
                readOnly
                style={{ cursor: 'pointer', accentColor: 'var(--marron-arcilla)', margin: 0 }}
              />
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gris-oscuro)', whiteSpace: 'nowrap' }}>Sel. Todos</span>
            </div>
          )}
        </summary>
        <div style={{ padding: '0 16px 16px 16px' }}>
          {pendingPayments.length === 0 ? (
            <p style={{ fontStyle: 'italic', fontSize: '13px', color: 'var(--gris-medio)' }}>No hay pagos pendientes.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingPayments.map(pay => {
                const st = baseStudents.find(u => u.id === pay.studentId);
                const isSelected = selectedPayments.includes(pay.id);
                return (
                  <div
                    key={pay.id}
                    onClick={() => toggleSelectOne(pay.id)}
                    className="stat-card-modern animate-slide-up"
                    style={{
                      padding: '20px',
                      borderRadius: '24px',
                      cursor: 'pointer',
                      border: 'none',
                      boxShadow: isSelected ? '0 0 0 2px var(--marron-arcilla)' : '0 4px 16px rgba(0,0,0,0.03)',
                      backgroundColor: isSelected ? 'var(--bg-crema)' : 'var(--blanco)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(pay.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--marron-arcilla)', cursor: 'pointer' }}
                      />

                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--gris-oscuro)' }}>{st?.name || 'Alumno'}</h4>
                        <p style={{ fontSize: '12px', color: 'var(--gris-medio)', marginTop: '4px' }}>
                          <strong style={{ color: 'var(--naranja-tierra)' }}>{pay.classCreditsAdded} clases</strong> • <strong>${pay.amount.toLocaleString('es-AR')}</strong>
                        </p>
                        <p style={{ fontSize: '10px', color: 'var(--gris-medio)', marginTop: '2px' }}>{pay.date.split(' ')[0]}</p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={async () => {
                            try {
                              await confirmPendingPayment(pay.id);
                              showFeedback(`Pago de ${st?.name} confirmado con éxito.`, 'info');
                              setPendingOpen(false);
                              setHistoryOpen(true);
                            } catch (err) {
                              showFeedback(err.message, 'danger');
                            }
                          }}
                          className="btn-tuti btn-primary-clay"
                          style={{ fontSize: '11px', padding: '6px 12px' }}
                        >
                          ✓ Confirmar
                        </button>

                        <button
                          onClick={async () => {
                            try {
                              await sendTransferReminder(pay.id);
                              showFeedback(`Recordatorio enviado a ${st?.name}.`, 'info');
                            } catch (err) {
                              showFeedback(err.message, 'danger');
                            }
                          }}
                          className="btn-tuti btn-secondary"
                          style={{ fontSize: '11px', padding: '6px 12px', backgroundColor: 'var(--blanco)', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <NotificationsActiveIcon style={{ fontSize: '14px' }} /> Notificar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </details>

      {/* Registrar Pago Externo */}
      <details
        open={manualOpen}
        onToggle={(e) => setManualOpen(e.target.open)}
        className="stat-card-modern"
        style={{ padding: '0', overflow: 'hidden', border: 'none', borderRadius: '24px', backgroundColor: 'var(--blanco)', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}
      >
        <summary style={{ padding: '16px', fontWeight: 800, fontSize: '16px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--marron-arcilla)' }}>
          Pago Manual
        </summary>
        <div style={{ padding: '0 16px 16px 16px' }}>
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '8px' }}>

            {/* Selector de Alumnas */}
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gris-oscuro)' }}>Alumnas:</label>
              <div
                onClick={() => setShowSelectStudentsModal(true)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-crema)',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  padding: '8px 8px 8px 16px',
                  cursor: 'pointer',
                  marginTop: '4px'
                }}
              >
                <span style={{ fontStyle: 'italic', fontSize: '14px', color: manualStudentIds.length > 0 ? 'var(--gris-oscuro)' : 'var(--marron-arcilla)' }}>
                  {manualStudentIds.length > 0 ? `${manualStudentIds.length} seleccionada(s)` : 'Toca para buscar y seleccionar'}
                </span>
                <button type="button" style={{ background: 'transparent', border: 'none', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--marron-arcilla)' }}>
                  <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
                  </svg>
                </button>
              </div>
            </div>

            {/* Selector de Créditos */}
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gris-oscuro)' }}>Créditos:</label>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                {packs.map(p => {
                  const isSelected = selectedPackId === String(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => handlePackChange({ target: { value: String(p.id) } })}
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: isSelected ? 'var(--marron-arcilla)' : 'var(--bg-crema)',
                        color: isSelected ? 'var(--blanco)' : 'var(--gris-oscuro)',
                        border: isSelected ? 'none' : '1px solid var(--gris-claro)'
                      }}
                    >
                      {p.credits}
                    </div>
                  );
                })}

              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: '1 1 120px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gris-oscuro)' }}>Monto ($):</label>
                <div style={{ position: 'relative', marginTop: '4px' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: 'var(--marron-arcilla)' }}>$</span>
                  <input
                    type="number"
                    className="input-tuti"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    placeholder="0"
                    style={{ paddingLeft: '32px', backgroundColor: 'var(--bg-crema)', border: 'none', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ flex: '1 1 150px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gris-oscuro)' }}>Fecha:</label>
                <input
                  type="date"
                  className="input-tuti"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  style={{ marginTop: '4px', backgroundColor: 'var(--bg-crema)', border: 'none', borderRadius: '20px', fontWeight: 'bold', color: 'var(--marron-arcilla)' }}
                />
              </div>
            </div>

            <button type="submit" className="btn-tuti btn-primary-clay" style={{ marginTop: '10px', fontSize: '16px', padding: '16px', borderRadius: 'var(--radius-lg)' }}>
              Guardar
            </button>
          </form>
        </div>
      </details>

      {/* Historial */}
      <details
        open={historyOpen}
        onToggle={(e) => setHistoryOpen(e.target.open)}
        className="stat-card-modern"
        style={{ padding: '0', overflow: 'hidden', border: 'none', borderRadius: '24px', backgroundColor: 'var(--blanco)', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}
      >
        <summary style={{ padding: '16px', fontWeight: 700, fontSize: '16px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ReceiptLongIcon style={{ color: 'var(--marron-arcilla)' }} /> Historial de Pagos
        </summary>
        <div style={{ padding: '0 16px 16px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {confirmedPayments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 20px', color: 'var(--gris-medio)' }}>
                <p style={{ fontStyle: 'italic', fontSize: '13px' }}>No hay registros de pagos confirmados.</p>
              </div>
            ) : confirmedPayments.map(pay => {
              const st = baseStudents.find(u => u.id === pay.studentId);
              return (
                <div key={pay.id} className="stat-card-modern animate-slide-up" style={{ padding: '20px', borderRadius: '24px', backgroundColor: 'var(--blanco)', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gris-oscuro)' }}>{st?.name || 'Alumno'}</h4>
                      <p style={{ fontSize: '11px', color: 'var(--gris-medio)', marginTop: '2px' }}>
                        {pay.date.split(' ')[0]} • +{pay.classCreditsAdded} clases
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
      </details>


      {/* Modal Seleccionar Alumnas */}
      {showSelectStudentsModal && (
        <div className="modal-overlay" onClick={() => setShowSelectStudentsModal(false)}>
          <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', padding: '0', overflow: 'hidden', height: '80vh', display: 'flex', flexDirection: 'column', borderRadius: '30px' }}>

            <div style={{ padding: '24px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--blanco)' }}>
              <div>
                <h2 style={{ fontSize: '20px', color: 'var(--gris-oscuro)', margin: '0 0 4px' }}>Seleccionar Alumnas</h2>
                <p style={{ fontSize: '12px', color: 'var(--gris-medio)', margin: 0 }}>Tildá todas las que correspondan al pago masivo</p>
              </div>
              <button
                onClick={() => setShowSelectStudentsModal(false)}
                className="btn-tuti btn-primary-clay"
                style={{ padding: '8px 24px', borderRadius: 'var(--radius-lg)' }}
              >
                Listo
              </button>
            </div>

            <div style={{ padding: '0 24px 16px', backgroundColor: 'var(--blanco)' }}>
              <input
                type="text"
                className="input-tuti"
                placeholder="Buscar alumna por nombre..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                style={{ backgroundColor: 'var(--bg-crema)', border: 'none', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px', backgroundColor: 'var(--blanco)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {searchedStudents.map(st => {
                const isSelected = manualStudentIds.includes(st.id);
                // Extraer iniciales para el avatar
                const initials = st.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                return (
                  <div
                    key={st.id}
                    onClick={() => toggleManualStudent(st.id)}
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-crema)',
                      border: isSelected ? '1px solid var(--marron-arcilla)' : '1px solid var(--gris-claro)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--gris-claro)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--marron-arcilla)' }}>
                        {initials}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--gris-oscuro)' }}>{st.name}</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--gris-medio)' }}>{st.email || 'Sin correo'} {st.sucursal ? ` • ${st.sucursal}` : ''}</p>
                      </div>
                    </div>

                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: isSelected ? 'none' : '1px solid var(--gris-medio)',
                      backgroundColor: isSelected ? 'var(--marron-arcilla)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--blanco)'
                    }}>
                      {isSelected && '✓'}
                    </div>
                  </div>
                );
              })}
              {searchedStudents.length === 0 && <div style={{ padding: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--gris-medio)' }}>No hay alumnas que coincidan con la búsqueda.</div>}
            </div>

          </div>
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      {selectedPayments.length > 0 && (
        <div className="animate-slide-up" style={{
          position: 'fixed',
          bottom: '100px', /* Above the main mobile navbar */
          left: '24px',
          right: '24px',
          maxWidth: '400px',
          margin: '0 auto',
          backgroundColor: 'var(--blanco)',
          padding: '12px 16px',
          borderRadius: '30px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          zIndex: 1000,
        }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gris-oscuro)', lineHeight: 1.2, flexShrink: 0 }}>
            {selectedPayments.length} sel.
          </span>
          <div style={{ display: 'flex', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
            <button
              onClick={handleBulkConfirm}
              disabled={isProcessingBulk}
              className="btn-tuti btn-primary-clay"
              style={{ fontSize: '12px', padding: '8px 12px', flex: 1, whiteSpace: 'nowrap' }}
            >
              {isProcessingBulk ? '...' : '✓ Confirmar'}
            </button>
            <button
              onClick={handleBulkNotify}
              disabled={isProcessingBulk}
              className="btn-tuti btn-secondary"
              style={{ fontSize: '12px', padding: '8px 12px', flex: 1, whiteSpace: 'nowrap' }}
            >
              Notificar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
