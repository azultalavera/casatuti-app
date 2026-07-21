import React, { useState } from 'react';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { formatDateDDMMYYYY } from '../../utils/dateUtils';

export default function CreditosTab({
  currentUser,
  profile,
  activePacks,
  selectedPackId,
  setSelectedPackId,
  selectedPack,
  buyStep,
  setBuyStep,
  buyLoading,
  onBuy,
  payments = [],
  bakes = [],
  isModal = false,
}) {
  const [payingDebt, setPayingDebt] = useState(null);

  const getDateObj = (dateString) => {
    if (!dateString) return new Date();
    if (dateString instanceof Date && !isNaN(dateString)) return dateString;
    
    let str = String(dateString).trim();
    if (str === 'undefined' || str === 'null' || str === 'Invalid Date') return new Date();

    let cleanStr = str.split('T')[0].split(' ')[0];
    let d;

    if (cleanStr.includes('/')) {
      const parts = cleanStr.split('/');
      if (parts.length === 3) {
        d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00`);
        if (!isNaN(d.getTime())) return d;
      }
    }

    d = new Date(cleanStr + 'T12:00:00');
    if (!isNaN(d.getTime())) return d;

    d = new Date(str);
    if (!isNaN(d.getTime())) return d;

    return new Date();
  };

  const myPayments = payments.filter(p => p.studentId == currentUser?.id);
  const myPendingPayments = myPayments.filter(p => p.status === 'PENDING').sort((a, b) => getDateObj(b.date) - getDateObj(a.date));
  const myConfirmedPayments = myPayments.filter(p => p.status === 'CONFIRMED' || p.status === 'PAID').sort((a, b) => getDateObj(b.date) - getDateObj(a.date));

  // -- ALGORITMO PARA MAPEAR SALDO ACTUAL A LOS PACKS COMPRADOS --
  const { classCredits = 0 } = profile || {};
  const activePacksList = [];
  let remainingCredits = classCredits;

  for (const p of myConfirmedPayments) {
    if (remainingCredits <= 0) break;
    const allocated = Math.min(remainingCredits, p.classCreditsAdded);
    remainingCredits -= allocated;

    const buyDate = getDateObj(p.date);
    const expDate = new Date(buyDate);
    expDate.setDate(expDate.getDate() + 30);

    activePacksList.push({
      ...p,
      buyDate,
      expDate,
      allocated,
      total: p.classCreditsAdded,
      isLegacy: false
    });
  }

  // Si sobraron créditos (por ej: agregados manualmente o antes de tener la tabla de pagos)
  if (remainingCredits > 0) {
    const expirationDateStr = profile?.expirationDate;
    const expDate = expirationDateStr ? getDateObj(expirationDateStr) : null;
    let buyDate = null;
    if (expDate) {
       buyDate = new Date(expDate);
       buyDate.setDate(buyDate.getDate() - 30);
    }

    activePacksList.push({
      isLegacy: true,
      allocated: remainingCredits,
      total: remainingCredits,
      buyDate: buyDate,
      expDate: expDate
    });
  }

  // Si estamos en modal (desde Inicio -> Comprar), mostramos el flujo de compra original
  if (isModal) {
    return (
      <div>
        {buyStep === 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '13px', color: 'var(--gris-medio)', margin: 0 }}>Elegí tu pack de clases:</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activePacks.length === 0 && (
                <p style={{ fontSize: '13px', color: 'var(--gris-medio)' }}>No hay paquetes disponibles en este momento.</p>
              )}
              {activePacks.map(pack => (
                <div
                  key={pack.id}
                  onClick={() => setSelectedPackId(pack.id)}
                  style={{
                    padding: '16px 20px',
                    borderRadius: '24px',
                    border: 'none',
                    backgroundColor: (selectedPackId === pack.id || (!selectedPackId && selectedPack?.id === pack.id)) ? 'var(--bg-crema)' : 'var(--blanco)',
                    boxShadow: (selectedPackId === pack.id || (!selectedPackId && selectedPack?.id === pack.id)) ? '0 0 0 2px var(--marron-arcilla)' : '0 4px 16px rgba(0,0,0,0.03)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--gris-oscuro)' }}>
                      {pack.name} ({pack.credits} clases)
                    </span>
                  </div>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--marron-arcilla)' }}>
                    ${pack.price.toLocaleString('es-AR')}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
              <button
                onClick={onBuy}
                disabled={buyLoading || !selectedPack}
                className="btn-tuti btn-primary-clay"
                style={{ flex: 1 }}
              >
                {buyLoading ? 'Procesando...' : 'Continuar'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: 'var(--bg-crema)', padding: '24px', borderRadius: '24px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
              <p style={{ fontSize: '13px', color: 'var(--gris-medio)', marginBottom: '4px' }}>Total a transferir:</p>
              <p style={{ fontSize: '32px', fontWeight: 800, color: 'var(--marron-arcilla)', margin: 0 }}>
                ${selectedPack?.price.toLocaleString('es-AR')}
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--blanco)', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.02)', padding: '20px', borderRadius: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', marginBottom: '12px' }}><strong>Datos bancarios:</strong></p>
              <p style={{ fontSize: '13px', marginBottom: '8px' }}>
                CBU: <code style={{ backgroundColor: '#f0f0f0', padding: '4px 8px', borderRadius: '8px', wordBreak: 'break-all' }}>000003100076164884013</code>
              </p>
              <p style={{ fontSize: '13px', marginBottom: '8px' }}>
                Alias: <code style={{ backgroundColor: '#f0f0f0', padding: '4px 8px', borderRadius: '8px', wordBreak: 'break-all' }}>CASA.TUTI</code>
              </p>
              <p style={{ fontSize: '13px', margin: 0 }}>Titular: maria candelaria luna ottonello</p>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--gris-medio)', margin: '4px 0', textAlign: 'center' }}>
              Enviá el comprobante por WhatsApp para acreditar tus clases.
            </p>

            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href="https://wa.me/5493517371575?text=Hola,%20acabo%20de%20realizar%20una%20transferencia%20para%20comprar%20clases."
                target="_blank"
                rel="noreferrer"
                className="btn-tuti"
                style={{ backgroundColor: '#25D366', color: 'white', textAlign: 'center', textDecoration: 'none' }}
              >
                Enviar comprobante por WhatsApp
              </a>
              <button onClick={() => setBuyStep(1)} className="btn-tuti btn-secondary">
                Volver
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Si el usuario tocó "Pagar >" en una deuda pendiente, mostramos los datos de transferencia
  if (payingDebt) {
    return (
      <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '26px', color: 'var(--gris-oscuro)', marginBottom: '10px' }}>Realizar transferencia</h2>

        <div style={{ backgroundColor: '#FFF7ED', padding: '24px', borderRadius: '24px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
          <p style={{ fontSize: '13px', color: 'var(--gris-medio)', marginBottom: '4px' }}>Total a transferir:</p>
          <p style={{ fontSize: '32px', fontWeight: 800, color: '#CC7A42', margin: 0 }}>
            ${Number(payingDebt.amount || payingDebt.price).toLocaleString('es-AR')}
          </p>
          <p style={{ fontSize: '13px', color: '#CC7A42', marginTop: '8px', fontWeight: 'bold' }}>
            {payingDebt.creditsAdded ? `Por el Pack de ${payingDebt.creditsAdded} Clases` : `Por ${payingDebt.description}`}
          </p>
        </div>

        <div style={{ backgroundColor: 'var(--blanco)', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.02)', padding: '20px', borderRadius: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', marginBottom: '12px' }}><strong>Datos bancarios:</strong></p>
          <p style={{ fontSize: '13px', marginBottom: '8px' }}>
            CBU: <code style={{ backgroundColor: '#f0f0f0', padding: '4px 8px', borderRadius: '8px', wordBreak: 'break-all' }}>000003100076164884013</code>
          </p>
          <p style={{ fontSize: '13px', marginBottom: '8px' }}>
            Alias: <code style={{ backgroundColor: '#f0f0f0', padding: '4px 8px', borderRadius: '8px', wordBreak: 'break-all' }}>CASA.TUTI</code>
          </p>
          <p style={{ fontSize: '13px', margin: 0 }}>Titular: maria candelaria luna ottonello</p>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--gris-medio)', margin: '4px 0', textAlign: 'center' }}>
          Enviá el comprobante por WhatsApp para que la administración confirme tu pago y te asigne los créditos.
        </p>

        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a
            href={`https://wa.me/5493517371575?text=${encodeURIComponent(
              payingDebt.creditsAdded 
                ? 'Hola, acabo de realizar la transferencia para pagar mi deuda de clases.' 
                : `Hola, acabo de realizar la transferencia para pagar mi deuda de insumos (${payingDebt.description}).`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="btn-tuti"
            style={{ backgroundColor: '#25D366', color: 'white', textAlign: 'center', textDecoration: 'none' }}
          >
            Enviar comprobante por WhatsApp
          </a>
          <button onClick={() => setPayingDebt(null)} className="btn-tuti btn-secondary">
            Volver a mis pagos
          </button>
        </div>
      </div>
    );
  }

  // Vista principal: "Pagos y créditos"
  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Título */}
      <h2 style={{ fontSize: '28px', color: 'var(--gris-oscuro)', letterSpacing: '-0.5px' }}>Pagos y créditos</h2>

      {/* SECCIÓN DE DEUDAS PENDIENTES */}
      {(myPendingPayments.length > 0 || (bakes || []).filter(b => b.studentId == currentUser.id && !b.isPaid && b.price > 0).length > 0) && (
        <div>
          <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--gris-medio)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>
            Deudas pendientes
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {myPendingPayments.map((p, idx) => (
              <div
                key={idx}
                style={{
                  padding: '16px 20px',
                  borderRadius: '24px',
                  backgroundColor: 'var(--blanco)',
                  border: '2px solid #FFF1E5',
                  boxShadow: '0 4px 16px rgba(204,122,66,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{
                      fontSize: '10px', fontWeight: 800, color: '#CC7A42',
                      backgroundColor: '#FFF7ED', padding: '4px 8px', borderRadius: '8px',
                      textTransform: 'uppercase', display: 'inline-block', marginBottom: '8px'
                    }}>
                      Deuda de Créditos
                    </span>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gris-oscuro)', margin: 0 }}>
                      Pack de {p.classCreditsAdded} clases
                    </h3>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: '#CC7A42', display: 'block' }}>
                      ${Number(p.amount).toLocaleString('es-AR')}
                    </span>
                    <button
                      onClick={() => setPayingDebt(p)}
                      style={{
                        backgroundColor: '#CC7A42', color: 'white', border: 'none',
                        fontSize: '14px', fontWeight: 800, padding: '8px 16px', marginTop: '8px',
                        borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(204,122,66,0.2)'
                      }}
                    >
                      Pagar &gt;
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gris-medio)' }}>
                  <CalendarTodayIcon style={{ fontSize: '14px' }} />
                  <span style={{ fontSize: '12px' }}>
                    Registrado: {p.date ? formatDateDDMMYYYY(p.date) : 'Fecha desconocida'}
                  </span>
                </div>
              </div>
            ))}
            {(bakes || []).filter(b => b.studentId == currentUser.id && !b.isPaid && b.price > 0).map((b, idx) => (
              <div
                key={`bake-${idx}`}
                style={{
                  padding: '16px 20px',
                  borderRadius: '24px',
                  backgroundColor: 'var(--blanco)',
                  border: '2px solid #FFF1E5',
                  boxShadow: '0 4px 16px rgba(204,122,66,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{
                      fontSize: '10px', fontWeight: 800, color: '#CC7A42',
                      backgroundColor: '#FFF7ED', padding: '4px 8px', borderRadius: '8px',
                      textTransform: 'uppercase', display: 'inline-block', marginBottom: '8px'
                    }}>
                      Deuda de Insumos
                    </span>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gris-oscuro)', margin: 0 }}>
                      {(b.description || 'Insumo').charAt(0).toUpperCase() + (b.description || 'Insumo').slice(1).toLowerCase()}
                    </h3>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: '#CC7A42', display: 'block' }}>
                      ${Number(b.price).toLocaleString('es-AR')}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--gris-medio)' }}>
                      {formatDateDDMMYYYY(b.date || new Date())}
                    </span>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--gris-claro)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setPayingDebt(b)}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--marron-arcilla)', fontSize: '14px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    Pagar {'>'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECCIÓN DE CRÉDITOS ACTIVOS */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--gris-oscuro)', letterSpacing: '0.5px', margin: 0 }}>
            Clases disponibles
          </h4>
        </div>

        {activePacksList.length === 0 ? (
          <p style={{ fontSize: '14px', color: 'var(--gris-medio)' }}>No tenés packs de créditos activos actualmente.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activePacksList.map((pack, idx) => (
              <div
                key={idx}
                style={{
                  padding: '16px 20px',
                  borderRadius: '24px',
                  backgroundColor: 'var(--blanco)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gris-oscuro)', margin: 0 }}>
                    {pack.isLegacy ? 'Créditos asignados' : `Pack de ${pack.total} clases adquirido`}
                  </h3>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--verde-oliva)', backgroundColor: '#EBF1ED', padding: '4px 10px', borderRadius: '12px' }}>
                    {pack.allocated} / {pack.total} Disp.
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gris-oscuro)',
                    backgroundColor: 'var(--bg-crema)', padding: '6px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600
                  }}>
                    <CalendarTodayIcon style={{ fontSize: '14px', color: 'var(--gris-medio)' }} />
                    {pack.buyDate ? `Inicia: ${formatDateDDMMYYYY(pack.buyDate)}` : 'Fecha: No registrada'}
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px', color: '#9E7412',
                    backgroundColor: '#FFFBEA', padding: '6px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700
                  }}>
                    <HourglassEmptyIcon style={{ fontSize: '14px' }} />
                    {pack.expDate ? `Vence: ${formatDateDDMMYYYY(pack.expDate)}` : 'Vence: A confirmar'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
