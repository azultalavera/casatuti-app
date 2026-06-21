import { useState } from 'react';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LocationOnIcon from '@mui/icons-material/LocationOn';

export default function InicioTab({
  currentUser,
  profile,
  myBookings,
  myAlerts,
  bookingError,
  classes,
  payments,
  resolveAlertAction,
  onCancel,
  onOpenBuyModal,
  onGoToTurnos,
}) {
  const [showDebtsModal, setShowDebtsModal] = useState(false);

  const myPendingPayments = (payments || []).filter(
    p => p.studentId == currentUser.id && p.status === 'PENDING'
  );
  const pendingDebt = myPendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <>
      {/* Resumen (Estilo Dashboard) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gris-oscuro)' }}>Mi resumen</h3>
          <button
            onClick={onOpenBuyModal}
            className="btn-tuti"
            style={{ fontSize: '12px', padding: '8px 14px', width: 'auto', backgroundColor: 'var(--gris-oscuro)', color: 'var(--blanco)', border: 'none', borderRadius: '20px' }}
          >
            + Comprar
          </button>
        </div>
        <div className="stats-dashboard-grid">
          {/* Card Clases (Grande) */}
          <div 
            className="stat-card-modern stat-card-modern-large" 
            style={{ 
              backgroundColor: 'var(--card-mustard)',
              cursor: profile.classCredits > 0 ? 'pointer' : 'default',
              transition: 'var(--transition-quick)'
            }}
            onClick={() => { if (profile.classCredits > 0 && onGoToTurnos) onGoToTurnos(); }}
          >
            <div className="stat-card-modern-icon">
              <span style={{ fontSize: '24px' }}>🎫</span>
            </div>
            <div className="stat-card-modern-content">
              {profile.classCredits > 0 ? (
                <>
                  <div className="stat-card-modern-number">{profile.classCredits}</div>
                  <div className="stat-card-modern-label">Clases<br />disponibles</div>
                </>
              ) : (
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gris-oscuro)', lineHeight: '1.4' }}>
                  No tienes créditos disponibles.<br/>Podes renovarlos desde el botón "Comprar"
                </div>
              )}
            </div>
          </div>

          {/* Card Arcilla */}
          <div className="stat-card-modern" style={{ backgroundColor: 'var(--card-sage)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="stat-card-modern-content">
                <div className="stat-card-modern-number">{profile.monthlyClayKg} <span style={{ fontSize: '14px', fontWeight: 600 }}>kg</span></div>
                <div className="stat-card-modern-label">Arcilla<br />retirada</div>
              </div>
              <div className="stat-card-modern-icon" style={{ width: '40px', height: '40px' }}>
                <span style={{ fontSize: '18px' }}>🏺</span>
              </div>
            </div>
          </div>

          {/* Card Deudas Pendientes */}
          <div 
            className="stat-card-modern" 
            style={{ 
              backgroundColor: pendingDebt > 0 ? '#FFF7ED' : 'var(--blanco)', 
              color: 'var(--gris-oscuro)', 
              padding: '16px 20px',
              cursor: pendingDebt > 0 ? 'pointer' : 'default',
              transition: 'var(--transition-quick)'
            }}
            onClick={() => { if (pendingDebt > 0) setShowDebtsModal(true); }}
          >
            <div className="stat-card-modern-content" style={{ justifyContent: 'center', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gris-medio)' }}>Deudas pendientes</span>
                <span style={{ fontSize: '16px' }}>{pendingDebt > 0 ? '💸' : '✅'}</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: pendingDebt > 0 ? 'var(--rojo-alerta)' : 'var(--verde-oliva)' }}>
                ${pendingDebt.toLocaleString('es-AR')}
              </div>
              <span style={{ fontSize: '10px', color: pendingDebt > 0 ? 'var(--rojo-alerta)' : 'var(--gris-medio)', marginTop: '8px', fontWeight: pendingDebt > 0 ? 800 : 600 }}>
                {pendingDebt > 0 ? 'Aboná a la brevedad.' : 'Todo al día.'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {bookingError && (
        <div className="alert-banner danger animate-slide-up">
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <WarningAmberIcon style={{ fontSize: '18px' }} /> {bookingError}
          </span>
        </div>
      )}
      {myAlerts.map(a => (
        <div key={a.id} className="alert-banner info animate-slide-up" style={{ justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <NotificationsIcon style={{ fontSize: '18px' }} /> {a.message}
          </span>
          {resolveAlertAction && (
            <button 
              onClick={() => resolveAlertAction(a.id)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', marginLeft: '12px', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}
            >
              ✕
            </button>
          )}
        </div>
      ))}

      {/* Reservas Activas */}
      <div>
        <h3 style={{ fontSize: '18px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Mis reservas activas
          <span className="badge badge-oliva">{myBookings.length}</span>
        </h3>
        {myBookings.length === 0 ? (
          <div className="clay-card" style={{ textAlign: 'center', padding: '24px 20px', color: 'var(--gris-medio)' }}>
            <p style={{ fontSize: '14px', fontStyle: 'italic', margin: 0 }}>No tienes reservas activas.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {myBookings.map(b => {
              const cd = classes.find(c => c.id === b.classId) || {};
              return (
                <div key={b.id} style={{ padding: '20px', borderRadius: '28px', backgroundColor: 'var(--blanco)', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gris-oscuro)', margin: 0 }}>
                      {cd.day} {b.date ? `${b.date.split('-')[2]}/${b.date.split('-')[1]}` : ''} · {cd.time}
                    </h4>
                    <p style={{ fontSize: '13px', color: 'var(--gris-medio)', marginTop: '4px', fontWeight: 600 }}>
                      <LocationOnIcon style={{ fontSize: '14px', verticalAlign: 'text-bottom' }} /> {cd.sucursal} · Prof. {cd.teacherName}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '12px', backgroundColor: 'var(--card-sage)', color: 'var(--blanco)' }}>Confirmada</span>
                    <button
                      onClick={() => onCancel(b.id)}
                      style={{ background: 'transparent', border: 'none', fontSize: '12px', color: 'var(--rojo-alerta)', fontWeight: 800, cursor: 'pointer', padding: 0 }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Modal Detalles de Deudas */}
      {showDebtsModal && (
        <div className="modal-overlay" onClick={() => setShowDebtsModal(false)}>
          <div className="modal-content animate-scale-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', color: 'var(--gris-oscuro)' }}>Detalle de deudas</h2>
              <button onClick={() => setShowDebtsModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--gris-medio)' }}>×</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflowY: 'auto' }}>
              {myPendingPayments.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--bg-crema)', borderRadius: '12px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gris-oscuro)' }}>
                      {(p.description || 'Deuda pendiente').charAt(0).toUpperCase() + (p.description || 'Deuda pendiente').slice(1).toLowerCase()}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gris-medio)', marginTop: '4px' }}>
                      {new Date(p.date || new Date()).toLocaleDateString('es-AR')}
                    </div>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--rojo-alerta)' }}>
                    ${Number(p.amount).toLocaleString('es-AR')}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--gris-claro)' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gris-oscuro)' }}>Total a abonar</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--rojo-alerta)' }}>
                ${pendingDebt.toLocaleString('es-AR')}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
