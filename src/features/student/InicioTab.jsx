import React from 'react';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LocationOnIcon from '@mui/icons-material/LocationOn';

export default function InicioTab({
  currentUser,
  profile,
  myBookings,
  myAlerts,
  bookingError,
  successMessage,
  classes,
  onCancel,
  onOpenBuyModal,
}) {
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
          <div className="stat-card-modern stat-card-modern-large" style={{ backgroundColor: 'var(--card-mustard)' }}>
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

          {/* Card Progreso Arcilla */}
          <div className="stat-card-modern" style={{ backgroundColor: 'var(--blanco)', color: 'var(--gris-oscuro)', padding: '16px 20px' }}>
            <div className="stat-card-modern-content" style={{ justifyContent: 'center', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px', fontWeight: 700 }}>
                <span style={{ color: 'var(--gris-medio)' }}>Límite arcilla</span>
                <span style={{ color: 'var(--verde-oliva)' }}>{profile.monthlyClayKg}kg / 1kg</span>
              </div>
              <div className="progress-bar-container" style={{ height: '6px', backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: '10px' }}>
                <div className="progress-bar-fill" style={{ width: `${Math.min(100, profile.monthlyClayKg * 100)}%`, backgroundColor: 'var(--card-sage)', borderRadius: '10px', height: '100%' }} />
              </div>
              <span style={{ fontSize: '10px', color: profile.monthlyClayKg >= 1 ? 'var(--card-rust)' : 'var(--gris-medio)', marginTop: '8px', fontWeight: profile.monthlyClayKg >= 1 ? 800 : 600 }}>
                {profile.monthlyClayKg >= 1 ? 'Límite alcanzado.' : 'Bloque 1kg disponible.'}
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
        <div key={a.id} className="alert-banner info animate-slide-up">
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <NotificationsIcon style={{ fontSize: '18px' }} /> {a.message}
          </span>
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
                      {cd.day} · {cd.time}
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
    </>
  );
}
