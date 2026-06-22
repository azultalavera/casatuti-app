import React from 'react';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GroupIcon from '@mui/icons-material/Group';
import LocationOnIcon from '@mui/icons-material/LocationOn';

export default function InicioTabProfe({ currentUser, classes, bookings }) {
  // Filtrar las clases asignadas a este profesor
  const myClasses = classes.filter(c => c.teacherId === currentUser.id);
  
  // Obtener el día actual (ej. 'Lunes', 'Martes', etc.)
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const todayName = days[new Date().getDay()];

  // Clases de hoy (por simplicidad, asumiendo que coinciden con el día de la semana)
  const todaysClasses = myClasses.filter(c => c.day === todayName);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gris-oscuro)' }}>Mi resumen</h3>
      </div>
      
      <div className="stats-dashboard-grid">
        {/* Card Mis Clases */}
        <div 
          className="stat-card-modern stat-card-modern-large" 
          style={{ 
            backgroundColor: 'var(--card-mustard)',
            cursor: 'default',
          }}
        >
          <div className="stat-card-modern-icon">
            <span style={{ fontSize: '24px' }}>🧑‍🏫</span>
          </div>
          <div className="stat-card-modern-content">
            <div className="stat-card-modern-number">{myClasses.length}</div>
            <div className="stat-card-modern-label">Clases<br />asignadas</div>
          </div>
        </div>

        {/* Card Alumnos totales */}
        <div className="stat-card-modern" style={{ backgroundColor: 'var(--card-sage)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="stat-card-modern-content">
              {/* Aproximación de alumnos (total de reservas confirmadas) */}
              <div className="stat-card-modern-number">
                {bookings.filter(b => myClasses.some(c => c.id === b.classId) && b.status !== 'CANCELLED').length}
              </div>
              <div className="stat-card-modern-label">Reservas<br />Activas</div>
            </div>
            <div className="stat-card-modern-icon" style={{ width: '40px', height: '40px' }}>
              <span style={{ fontSize: '18px' }}>🏺</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Mis Clases de Hoy ({todayName})
          <span className="badge badge-oliva">{todaysClasses.length}</span>
        </h3>

        {todaysClasses.length === 0 ? (
          <div className="clay-card" style={{ textAlign: 'center', padding: '24px 20px', color: 'var(--gris-medio)' }}>
            <p style={{ fontSize: '14px', fontStyle: 'italic', margin: 0 }}>No tienes clases programadas para hoy.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {todaysClasses.map(c => (
              <div key={c.id} style={{ padding: '20px', borderRadius: '28px', backgroundColor: 'var(--blanco)', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gris-oscuro)', margin: 0 }}>
                    {c.name} · {c.time}
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--gris-medio)', marginTop: '4px', fontWeight: 600 }}>
                    <LocationOnIcon style={{ fontSize: '14px', verticalAlign: 'text-bottom' }} /> {c.sucursal}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '12px', backgroundColor: 'var(--marron-arcilla-light)', color: 'var(--marron-arcilla)' }}>
                    Turno asignado
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
