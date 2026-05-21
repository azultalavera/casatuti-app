import React from 'react';

export default function DashboardTab({ classes, bookings, students, studentProfiles, setAdminTab }) {
  const daysMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const todayDay = daysMap[new Date().getDay()];

  const turnosHoyCount    = classes.filter(c => c.day === todayDay).length;
  const alumnosCount      = students.length;
  const paquetesActivos   = studentProfiles.filter(p => p.classCredits > 0).length;
  const unpaidCount       = students.filter(st => {
    const p = studentProfiles.find(p => p.studentId === st.id);
    return !p || p.classCredits === 0;
  }).length;
  const deudaTotal = unpaidCount * 8000;

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-sans)', marginBottom: '4px', color: 'var(--gris-oscuro)' }}>
          Panel de Administración
        </h2>
        <p style={{ color: 'var(--gris-medio)', fontSize: '13px' }}>Resumen operacional de Casa Tuti</p>
      </div>

      {/* Stats 2x2 */}
      <div className="stats-dashboard-grid">
        <div className="stat-card-premium" onClick={() => setAdminTab('classes')}>
          <div className="stat-card-icon-container">📅</div>
          <div>
            <div className="stat-card-number">{turnosHoyCount}</div>
            <div className="stat-card-label">Turnos Hoy</div>
          </div>
        </div>
        <div className="stat-card-premium" onClick={() => setAdminTab('students')}>
          <div className="stat-card-icon-container">👥</div>
          <div>
            <div className="stat-card-number">{alumnosCount}</div>
            <div className="stat-card-label">Alumnos</div>
          </div>
        </div>
        <div className="stat-card-premium" onClick={() => setAdminTab('students')}>
          <div className="stat-card-icon-container">💳</div>
          <div>
            <div className="stat-card-number">{paquetesActivos}</div>
            <div className="stat-card-label">Paquetes Activos</div>
          </div>
        </div>
        <div className="stat-card-premium" onClick={() => setAdminTab('students')}>
          <div className="stat-card-icon-container">💧</div>
          <div>
            <div className="stat-card-number">${deudaTotal.toLocaleString('es-AR')}</div>
            <div className="stat-card-label">Deuda Total</div>
          </div>
        </div>
      </div>

      {/* Próximos Turnos */}
      <div>
        <div className="dashboard-section-header">
          <h3 className="dashboard-section-title">Próximos Turnos</h3>
          <button className="dashboard-section-link" onClick={() => setAdminTab('classes')}>Ver todos</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
          {classes.length === 0 ? (
            <div className="clay-card" style={{ textAlign: 'center', padding: '24px 20px', color: 'var(--gris-medio)' }}>
              <p style={{ fontStyle: 'italic', fontSize: '13px' }}>No hay turnos vigentes.</p>
            </div>
          ) : (
            classes.map(c => {
              const startTime      = c.time.split(' - ')[0];
              const occupancyCount = bookings.filter(b => b.classId === c.id && b.status === 'CONFIRMED').length;
              return (
                <div key={c.id} className="upcoming-turn-card">
                  <span className="upcoming-turn-time">{startTime}</span>
                  <div className="upcoming-turn-details">
                    <span className="upcoming-turn-title">{c.sucursal ? `${c.sucursal} ·` : ''} {c.day}</span>
                    <span className="upcoming-turn-subtitle">Profe: {c.teacherName} | {c.time}</span>
                  </div>
                  <span className="upcoming-turn-badge">{occupancyCount}/{c.capacity}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <button className="fab-create-turn" onClick={() => setAdminTab('classes')}>
        <span>+</span> Crear Turno
      </button>
    </div>
  );
}
