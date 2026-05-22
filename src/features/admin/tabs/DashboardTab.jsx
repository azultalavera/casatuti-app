import React, { useState } from 'react';

export default function DashboardTab({ classes, bookings, students, studentProfiles, setAdminTab }) {
  const [selectedBranch, setSelectedBranch] = useState('ALL');

  const daysMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const todayDay = daysMap[new Date().getDay()];

  // Filtrado por sucursal
  const filteredClasses = selectedBranch === 'ALL'
    ? classes
    : classes.filter(c => (c.sucursal || '').toUpperCase() === selectedBranch);

  const filteredStudents = selectedBranch === 'ALL'
    ? students
    : students.filter(s => (s.sucursal || '').toUpperCase() === selectedBranch);

  const filteredStudentProfiles = selectedBranch === 'ALL'
    ? studentProfiles
    : studentProfiles.filter(p => {
      const student = students.find(s => s.id === p.studentId);
      return student && (student.sucursal || '').toUpperCase() === selectedBranch;
    });

  const turnosHoyCount = filteredClasses.filter(c => c.day === todayDay).length;
  const alumnosCount = filteredStudents.length;
  const paquetesActivos = filteredStudentProfiles.filter(p => p.classCredits > 0).length;
  const unpaidCount = filteredStudents.filter(st => {
    const p = filteredStudentProfiles.find(p => p.studentId === st.id);
    return !p || p.classCredits === 0;
  }).length;
  const deudaTotal = unpaidCount * 8000;

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-sans)', marginBottom: '4px', color: 'var(--gris-oscuro)' }}>
            Panel de Administración
          </h2>
          <p style={{ color: 'var(--gris-medio)', fontSize: '13px' }}>Resumen operacional de Casa Tuti</p>
        </div>

        {/* Filtro por Sucursal (Pills) */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-crema-claro)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--gris-claro)' }}>
          {['ALL', 'CENTRO', 'ALTO VERDE'].map((branch) => {
            const isActive = selectedBranch === branch;
            return (
              <button
                key={branch}
                onClick={() => setSelectedBranch(branch)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: isActive ? 'var(--verde-oliva)' : 'transparent',
                  color: isActive ? 'var(--blanco)' : 'var(--gris-medio)',
                  transition: 'all 0.15s ease'
                }}
              >
                {branch === 'ALL' ? 'Todas' : branch === 'ALTO VERDE' ? 'Alto Verde' : 'Centro'}
              </button>
            );
          })}
        </div>
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

    </div>
  );
}
