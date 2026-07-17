import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import SettingsIcon from '@mui/icons-material/Settings';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';

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
    : baseStudents.filter(s => (s.sucursal || '').toUpperCase() === selectedBranch.toUpperCase());

  const pendingPayments = payments.filter(p => {
    if (p.status !== 'PENDING') return false;
    if (selectedBranch === 'ALL') return true;
    const st = baseStudents.find(s => s.id === p.studentId);
    return st && (st.sucursal || '').toUpperCase() === selectedBranch.toUpperCase();
  });

  const confirmedPayments = payments.filter(p => {
    if (p.status !== 'PAID') return false;
    if (selectedBranch === 'ALL') return true;
    const st = baseStudents.find(s => s.id === p.studentId);
    return st && (st.sucursal || '').toUpperCase() === selectedBranch.toUpperCase();
  });

  // Filtro de Meses para Pagos Confirmados
  const [selectedMonths, setSelectedMonths] = useState([]);

  // Extraer meses únicos en formato YYYY-MM
  const allMonths = Array.from(new Set(
    payments.filter(p => p.status === 'PAID').map(p => p.date.substring(0, 7))
  )).sort((a, b) => b.localeCompare(a)); // Descendente

  // Filtrar pagos confirmados según los meses seleccionados (si no hay ninguno, se muestran todos)
  const filteredConfirmed = confirmedPayments.filter(p => {
    if (selectedMonths.length === 0) return true;
    const m = p.date.substring(0, 7);
    return selectedMonths.includes(m);
  });

  // Total recaudado de los pagos confirmados filtrados
  const totalAmount = filteredConfirmed.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

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
  const [confirmModalData, setConfirmModalData] = useState(null);

  // Tabs y Modales
  const [activeTab, setActiveTab] = useState(pendingPayments.length > 0 ? 'PENDING' : 'CONFIRMED');
  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false);

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

      setShowManualPaymentModal(false);
      setActiveTab('CONFIRMED');
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
    if (selectedPayments.length === 0) {
      showFeedback('Por favor, seleccioná al menos un pago para confirmar.', 'danger');
      return;
    }
    setConfirmModalData({
      ids: selectedPayments,
      date: new Date().toISOString().split('T')[0]
    });
  };
  const handleConfirmSubmit = async () => {
    if (!confirmModalData || confirmModalData.ids.length === 0) return;
    setIsProcessingBulk(true);
    let successCount = 0;
    for (const id of confirmModalData.ids) {
      try {
        await confirmPendingPayment(id, confirmModalData.date);
        successCount++;
      } catch (e) {
        console.error(`Error confirmando pago ${id}:`, e);
        showFeedback(e.message || 'Error al confirmar', 'danger');
      }
    }
    setIsProcessingBulk(false);
    setSelectedPayments([]);
    setConfirmModalData(null);
    if (successCount > 0) {
      showFeedback(`Se confirmaron ${successCount} pagos exitosamente.`, 'info');
      setActiveTab('CONFIRMED');
    }
  };

  const handleBulkNotify = async () => {
    if (selectedPayments.length === 0) {
      showFeedback('Por favor, seleccioná al menos un pago para notificar.', 'danger');
      return;
    }
    if (!window.confirm(`¿Estás seguro de enviar ${selectedPayments.length} recordatorios?`)) return;
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
      showFeedback(`Se enviaron ${successCount} notificaciones con éxito.`, 'info');
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
                  {branch.name === 'ALL' ? 'Todas' : branch.name.charAt(0).toUpperCase() + branch.name.slice(1).toLowerCase()}
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* Segmented Control / Tabs */}
      <div style={{ display: 'flex', backgroundColor: 'var(--bg-crema-claro)', borderRadius: '16px', padding: '4px', marginBottom: '16px', border: '1px solid var(--bg-crema)' }}>
        <button
          onClick={() => setActiveTab('PENDING')}
          style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: 'none', backgroundColor: activeTab === 'PENDING' ? 'var(--blanco)' : 'transparent', color: activeTab === 'PENDING' ? 'var(--gris-oscuro)' : 'var(--gris-medio)', fontWeight: 800, fontSize: '14px', boxShadow: activeTab === 'PENDING' ? '0 2px 8px rgba(0,0,0,0.04)' : 'none', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
        >
          <HourglassEmptyIcon style={{ fontSize: '18px', color: activeTab === 'PENDING' ? 'var(--marron-arcilla)' : 'inherit' }} /> Pendientes
          {pendingPayments.length > 0 && <span className="badge badge-clay" style={{ fontSize: '10px', padding: '2px 6px', marginLeft: '4px' }}>{pendingPayments.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('CONFIRMED')}
          style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: 'none', backgroundColor: activeTab === 'CONFIRMED' ? 'var(--blanco)' : 'transparent', color: activeTab === 'CONFIRMED' ? 'var(--gris-oscuro)' : 'var(--gris-medio)', fontWeight: 800, fontSize: '14px', boxShadow: activeTab === 'CONFIRMED' ? '0 2px 8px rgba(0,0,0,0.04)' : 'none', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
        >
          <ReceiptLongIcon style={{ fontSize: '18px', color: activeTab === 'CONFIRMED' ? 'var(--marron-arcilla)' : 'inherit' }} /> Confirmados
        </button>
      </div>

      {/* Contenido Pagos Pendientes */}
      {activeTab === 'PENDING' && (
      <div className="animate-slide-up stat-card-modern" style={{ padding: '0', border: 'none', borderRadius: '24px', backgroundColor: 'var(--blanco)', color: 'var(--gris-oscuro)' }}>
        <div style={{ padding: '16px', fontWeight: 700, fontSize: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <HourglassEmptyIcon style={{ color: 'var(--marron-arcilla)' }} /> Pagos pendientes
            {pendingPayments.length > 0 && <span className="badge badge-clay" style={{ fontSize: '11px', padding: '2px 6px' }}>{pendingPayments.length}</span>}
          </div>
        </div>
        {pendingPayments.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 16px 12px' }}>
            <div
              onClick={toggleSelectAll}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg-crema-claro)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
            >
              <input
                type="checkbox"
                checked={selectedPayments.length === pendingPayments.length && pendingPayments.length > 0}
                readOnly
                style={{ cursor: 'pointer', accentColor: 'var(--marron-arcilla)', margin: 0 }}
              />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gris-oscuro)', whiteSpace: 'nowrap' }}>Sel. Todos</span>
            </div>
          </div>
        )}
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
                            setConfirmModalData({
                              ids: [pay.id],
                              date: new Date().toISOString().split('T')[0]
                            });
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
      </div>
      )}



      {/* Modal de Pago Manual */}
      {showManualPaymentModal && (
        <div className="tuti-modal" style={{
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
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gris-oscuro)', margin: 0 }}>
                Cargar pago manual
              </h3>
              <button
                type="button"
                onClick={() => setShowManualPaymentModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--gris-medio)' }}
              >
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '8px' }}>
              {/* Selector de Alumnas */}
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.5px', color: 'var(--gris-oscuro)' }}>Alumnas:</label>
                <div
                  onClick={() => setShowSelectStudentsModal(true)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: 'var(--bg-crema)', border: 'none', borderRadius: 'var(--radius-lg)',
                    padding: '8px 8px 8px 16px', cursor: 'pointer', marginTop: '4px'
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
                <label style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.5px', color: 'var(--gris-oscuro)' }}>Créditos:</label>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {packs.map(p => {
                    const isSelected = selectedPackId === String(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => handlePackChange({ target: { value: String(p.id) } })}
                        style={{
                          width: '56px', height: '56px', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
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
                  <label style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.5px', color: 'var(--gris-oscuro)' }}>Monto ($):</label>
                  <div style={{ position: 'relative', marginTop: '4px' }}>
                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: 'var(--marron-arcilla)' }}>$</span>
                    <input
                      type="number" className="input-tuti" value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value)} placeholder="0"
                      style={{ paddingLeft: '32px', backgroundColor: 'var(--bg-crema)', border: 'none', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ flex: '1 1 150px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.5px', color: 'var(--gris-oscuro)' }}>Fecha:</label>
                  <input
                    type="date" className="input-tuti" value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    style={{ marginTop: '4px', backgroundColor: 'var(--bg-crema)', border: 'none', borderRadius: '20px', fontWeight: 'bold', color: 'var(--marron-arcilla)' }}
                  />
                </div>
              </div>

              <button type="submit" className="btn-tuti btn-success-soft" style={{ marginTop: '10px', fontSize: '16px', padding: '16px', borderRadius: 'var(--radius-lg)' }}>
                Guardar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Contenido Pagos Confirmados */}
      {activeTab === 'CONFIRMED' && (
      <div className="animate-slide-up stat-card-modern" style={{ padding: '0', border: 'none', borderRadius: '24px', backgroundColor: 'var(--blanco)', color: 'var(--gris-oscuro)' }}>
        <div style={{ padding: '16px', fontWeight: 700, fontSize: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ReceiptLongIcon style={{ color: 'var(--marron-arcilla)' }} /> Pagos confirmados
        </div>
        <div style={{ padding: '0 16px 16px 16px' }}>
          
          {/* Filtro de Meses */}
          {allMonths.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '16px', paddingBottom: '8px', scrollbarWidth: 'none' }}>
              <button
                onClick={() => setSelectedMonths([])}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: selectedMonths.length === 0 ? 'var(--marron-arcilla)' : 'var(--bg-crema)',
                  color: selectedMonths.length === 0 ? 'var(--blanco)' : 'var(--gris-oscuro)',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                Todos
              </button>
              {allMonths.map(m => {
                const isSelected = selectedMonths.includes(m);
                // Convertir YYYY-MM a algo más legible, ej: 2026-05 -> Mayo 2026
                const dateObj = new Date(`${m}-02`); // Evitar desfase horario
                const monthName = dateObj.toLocaleString('es-ES', { month: 'short' });
                const label = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${dateObj.getFullYear()}`;
                
                return (
                  <button
                    key={m}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedMonths(selectedMonths.filter(x => x !== m));
                      } else {
                        setSelectedMonths([...selectedMonths, m]);
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '16px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--marron-arcilla)' : 'var(--bg-crema)',
                      color: isSelected ? 'var(--blanco)' : 'var(--gris-oscuro)',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s'
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tarjeta de Resumen Total */}
          <div style={{
            backgroundColor: 'var(--verde-oliva)',
            padding: '20px',
            borderRadius: '20px',
            marginBottom: '20px',
            color: 'var(--blanco)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(85, 107, 47, 0.2)'
          }}>
            <span style={{ fontSize: '13px', fontWeight: 600, opacity: 0.9 }}>
              Total recaudado {selectedMonths.length === 0 ? '(Todos los meses)' : '(Selección)'}
            </span>
            <span style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-1px' }}>
              ${totalAmount.toLocaleString('es-AR')}
            </span>
          </div>

          <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--gris-oscuro)', marginBottom: '12px', paddingLeft: '4px' }}>
            Pagos por separado
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {filteredConfirmed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 20px', color: 'var(--gris-medio)' }}>
                <p style={{ fontStyle: 'italic', fontSize: '13px' }}>No hay registros de pagos confirmados.</p>
              </div>
            ) : (() => {
              // Agrupar por mes
              const grouped = {};
              filteredConfirmed.forEach(pay => {
                const m = pay.date.substring(0, 7);
                if (!grouped[m]) grouped[m] = [];
                grouped[m].push(pay);
              });
              
              // Ordenar meses descendente
              const sortedMonths = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
              
              return sortedMonths.map(month => {
                const dateObj = new Date(`${month}-02`);
                const monthName = dateObj.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
                const monthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                
                return (
                  <div key={month} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h5 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--gris-oscuro)', borderBottom: '1px solid var(--gris-claro)', paddingBottom: '8px', marginBottom: '4px', marginTop: '0' }}>
                      {monthLabel}
                    </h5>
                    {grouped[month].map(pay => {
                      const st = baseStudents.find(u => u.id === pay.studentId);
                      return (
                        <div key={pay.id} className="stat-card-modern animate-slide-up" style={{ padding: '16px 20px', borderRadius: '20px', backgroundColor: 'var(--bg-crema-claro)', border: 'none', boxShadow: 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gris-oscuro)', margin: 0 }}>{st?.name || 'Alumno'}</h4>
                              <p style={{ fontSize: '11px', color: 'var(--gris-medio)', marginTop: '2px', marginBottom: 0 }}>
                                {pay.date.split(' ')[0]} • +{pay.classCreditsAdded} clases
                              </p>
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--gris-oscuro)' }}>
                              ${pay.amount.toLocaleString('es-AR')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
      )}


      {/* Modal Seleccionar Alumnas */}
      {showSelectStudentsModal && (
        <div className="modal-overlay" onClick={() => setShowSelectStudentsModal(false)}>
          <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', padding: '0', overflow: 'hidden', height: '80vh', display: 'flex', flexDirection: 'column', borderRadius: '30px' }}>

            <div style={{ padding: '24px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--blanco)' }}>
              <div>
                <h2 style={{ fontSize: '20px', color: 'var(--gris-oscuro)', margin: '0 0 4px' }}>Seleccionar alumnas</h2>
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

      {/* Botón Flotante "+" para Registrar Pago */}
      <button
        onClick={() => {
          setManualStudentIds([]);
          setSearchStudent('');
          setManualAmount('');
          setSelectedPackId('');
          setPaymentDate(new Date().toISOString().split('T')[0]);
          setShowManualPaymentModal(true);
        }}
        style={{
          position: 'fixed',
          bottom: '108px',
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
      >
        <svg style={{ width: '28px', height: '28px' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Modal de Confirmación de Fecha */}
      {confirmModalData && (
        <div className="tuti-modal" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(30, 27, 22, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '16px'
        }}>
          <div className="clay-card animate-slide-up" style={{
            width: '100%', maxWidth: '400px', backgroundColor: 'var(--blanco)', padding: '24px',
            borderRadius: '24px', boxShadow: '0 12px 36px rgba(44, 38, 30, 0.15)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gris-oscuro)', margin: '0 0 16px 0' }}>
              Confirmar {confirmModalData.ids.length > 1 ? 'pagos' : 'pago'}
            </h3>
            
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--gris-oscuro)' }}>Fecha de transferencia / acreditación:</label>
              <input
                type="date"
                className="input-tuti"
                value={confirmModalData.date}
                onChange={(e) => setConfirmModalData({ ...confirmModalData, date: e.target.value })}
                style={{ marginTop: '8px', backgroundColor: 'var(--bg-crema)', border: 'none', borderRadius: '12px', padding: '12px', width: '100%', boxSizing: 'border-box' }}
              />
              <p style={{ fontSize: '11px', color: 'var(--gris-medio)', marginTop: '8px', lineHeight: '1.4' }}>
                El vencimiento de los créditos (30 días) se calculará a partir de esta fecha.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setConfirmModalData(null)}
                className="btn-tuti btn-secondary"
                style={{ flex: 1, backgroundColor: 'var(--bg-crema)', color: 'var(--gris-oscuro)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={isProcessingBulk}
                className="btn-tuti btn-primary-clay"
                style={{ flex: 1 }}
              >
                {isProcessingBulk ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos CSS Inyectados */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes popIn {
          from { transform: scale(0.7); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}} />

    </div>
  );
}
