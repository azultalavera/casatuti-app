import { useState } from 'react';
import { createPortal } from 'react-dom';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useApp } from '../../context/AppContext';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DrawIcon from '@mui/icons-material/Draw';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { formatDateDDMMYYYY } from '../../utils/dateUtils';

const NORMAS_ICONS = [
  <DrawIcon style={{ color: '#E48F45', fontSize: '20px' }} />,
  <CleaningServicesIcon style={{ color: '#3A7056', fontSize: '20px' }} />,
  <FavoriteIcon style={{ color: '#D65A31', fontSize: '20px' }} />,
  <LightbulbIcon style={{ color: '#F1C40F', fontSize: '20px' }} />,
];

export default function InicioTab({
  currentUser,
  profile,
  bookings,
  myBookings,
  myAlerts,
  bookingError,
  classes,
  payments,
  bakes,
  resolveAlertAction,
  onCancel,
  onReprogramar,
  onOpenBuyModal,
  onGoToTurnos,
}) {
  const { faqs = [] } = useApp();
  const [showDebtsModal, setShowDebtsModal] = useState(false);

  const [showNoCreditsError, setShowNoCreditsError] = useState(false);

  const myPendingPayments = (payments || []).filter(
    p => p.studentId == currentUser.id && p.status === 'PENDING'
  );
  
  const myPendingInsumos = (bakes || []).filter(
    b => b.studentId == currentUser.id && !b.isPaid && b.price > 0
  );

  const pendingDebt = 
    myPendingPayments.reduce((sum, p) => sum + Number(p.amount), 0) +
    myPendingInsumos.reduce((sum, b) => sum + Number(b.price), 0);

  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const [isNormasExpanded, setIsNormasExpanded] = useState(true);

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

        {showNoCreditsError && (
          <div className="alert-banner danger animate-slide-up" style={{ marginBottom: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <WarningAmberIcon style={{ fontSize: '18px' }} /> No tienes créditos disponibles. Podes renovarlos desde el botón "Comprar"
            </span>
          </div>
        )}

        <div className="stats-dashboard-grid">
          {/* Card Clases (Grande) */}
          <div
            className="stat-card-modern stat-card-modern-large"
            style={{
              backgroundColor: 'var(--card-mustard)',
              cursor: 'pointer',
              transition: 'var(--transition-quick)'
            }}
            onClick={() => {
              if (profile.classCredits > 0 && onGoToTurnos) {
                onGoToTurnos();
                setShowNoCreditsError(false);
              } else {
                setShowNoCreditsError(true);
                setTimeout(() => setShowNoCreditsError(false), 5000);
              }
            }}
          >
            <div className="stat-card-modern-icon">
              <span style={{ fontSize: '24px' }}>🎫</span>
            </div>
            <div className="stat-card-modern-content">
              <div className="stat-card-modern-number">{profile.classCredits}</div>
              <div className="stat-card-modern-label">Clases<br />disponibles</div>
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
              const classBookings = bookings?.filter(
                allB => allB.classId === b.classId && allB.date === b.date &&
                  (allB.status === 'CONFIRMED' || allB.status === 'ATTENDED')
              ) || [];

              return (
                <div
                  key={b.id}
                  onClick={() => setExpandedBookingId(expandedBookingId === b.id ? null : b.id)}
                  style={{
                    padding: '20px',
                    borderRadius: '28px',
                    backgroundColor: 'var(--blanco)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gris-oscuro)', margin: 0 }}>
                        {cd.day} {b.date ? formatDateDDMMYYYY(b.date) : ''} · {cd.time}
                      </h4>
                      <p style={{ fontSize: '13px', color: 'var(--gris-medio)', marginTop: '4px', fontWeight: 600 }}>
                        <LocationOnIcon style={{ fontSize: '14px', verticalAlign: 'text-bottom' }} /> {cd.sucursal} · Prof. {cd.teacherName}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        {(() => {
                          const classStartDateTime = new Date(`${b.date}T${cd.time.split(' - ')[0]}:00`);
                          const hoursDiff = (classStartDateTime - new Date()) / (1000 * 60 * 60);
                          const canReschedule = hoursDiff > 2;
                          return canReschedule && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onReprogramar && onReprogramar(b.id); }}
                              style={{ background: 'transparent', border: '1px solid var(--marron-arcilla)', borderRadius: '16px', fontSize: '12px', color: 'var(--marron-arcilla)', fontWeight: 800, cursor: 'pointer', padding: '4px 10px' }}
                            >
                              Reprogramar
                            </button>
                          );
                        })()}
                        <button
                          onClick={(e) => { e.stopPropagation(); onCancel(b.id); }}
                          style={{ background: 'transparent', border: 'none', fontSize: '12px', color: 'var(--rojo-alerta)', fontWeight: 800, cursor: 'pointer', padding: '4px 10px', alignSelf: 'center' }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Detalle Inscriptas */}
                  {expandedBookingId === b.id && classBookings.length > 0 && (
                    <div style={{
                      borderTop: '1px solid #ECEFEC',
                      paddingTop: '12px',
                      fontSize: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      animation: 'fadeIn 0.2s ease-in-out'
                    }}>
                      <div style={{ fontWeight: '700', color: '#0F3B32' }}>Alumnas anotadas:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {classBookings.map((eb, idx) => (
                          <span
                            key={idx}
                            style={{
                              backgroundColor: eb.studentId === currentUser.id ? 'var(--verde-oliva-light)' : '#F3F6F4',
                              color: eb.studentId === currentUser.id ? 'var(--verde-oliva-dark)' : '#2E4A3F',
                              padding: '4px 10px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: eb.studentId === currentUser.id ? '800' : '500',
                              border: eb.studentId === currentUser.id ? '1px solid var(--verde-oliva)' : '1px solid transparent'
                            }}
                          >
                            {eb.studentName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Normas de convivencia */}
      {faqs && faqs.length > 0 && (
        <div style={{ marginTop: '24px', backgroundColor: '#F8F9FA', borderRadius: '16px', padding: '20px' }}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => setIsNormasExpanded(!isNormasExpanded)}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
              Normas de convivencia
            </h3>
            <ExpandMoreIcon
              style={{
                color: 'var(--gris-medio)',
                transform: isNormasExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}
            />
          </div>

          {isNormasExpanded && (
            <div style={{ marginTop: '16px', animation: 'fadeIn 0.2s ease-in-out' }}>
              <p style={{ fontSize: '14px', color: '#718096', marginBottom: '16px', lineHeight: '1.5', marginTop: 0 }}>
                Para mantener la armonía y cuidar las piezas de todos en el taller, recordá estas normas básicas:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {faqs.map((faq, idx) => (
                  <div
                    key={faq.id}
                    style={{
                      backgroundColor: 'var(--blanco)',
                      borderRadius: '12px',
                      padding: '16px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start'
                    }}
                  >
                    <div style={{ marginTop: '2px' }}>
                      {NORMAS_ICONS[idx % NORMAS_ICONS.length]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#2D3748', marginRight: '4px' }}>
                        {faq.question}:
                      </span>
                      <span style={{ fontSize: '14px', color: '#4A5568', lineHeight: '1.5' }}>
                        {faq.answer}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Detalles de Deudas */}
      {showDebtsModal && createPortal(
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
                      {(p.motivo || 'Deuda pendiente').charAt(0).toUpperCase() + (p.motivo || 'Deuda pendiente').slice(1).toLowerCase()}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gris-medio)', marginTop: '4px' }}>
                      {formatDateDDMMYYYY(p.date || new Date())}
                    </div>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--rojo-alerta)' }}>
                    ${Number(p.amount).toLocaleString('es-AR')}
                  </div>
                </div>
              ))}
              {myPendingInsumos.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--bg-crema)', borderRadius: '12px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gris-oscuro)' }}>
                      {(b.description || 'Deuda de insumos').charAt(0).toUpperCase() + (b.description || 'Deuda de insumos').slice(1).toLowerCase()}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gris-medio)', marginTop: '4px' }}>
                      {formatDateDDMMYYYY(b.date || new Date())}
                    </div>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--rojo-alerta)' }}>
                    ${Number(b.price).toLocaleString('es-AR')}
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
        </div>,
        document.body
      )}
    </>
  );
}
