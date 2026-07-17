import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import EventIcon from '@mui/icons-material/Event';
import GroupIcon from '@mui/icons-material/Group';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SettingsIcon from '@mui/icons-material/Settings';
import BarChartIcon from '@mui/icons-material/BarChart';

export default function DashboardTab({ classes, bookings, students, studentProfiles, payments, setAdminTab, navigateToStudents }) {
  const { branches } = useApp();
  const [selectedBranch, setSelectedBranch] = useState('ALL');

  const daysMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const todayDay = daysMap[new Date().getDay()];

  // Filtrado por sucursal
  const filteredClasses = selectedBranch === 'ALL'
    ? classes
    : classes.filter(c => (c.sucursal || '').toUpperCase() === selectedBranch.toUpperCase());

  const filteredStudents = selectedBranch === 'ALL'
    ? students
    : students.filter(s => (s.sucursal || '').toUpperCase() === selectedBranch.toUpperCase());

  const filteredStudentProfiles = selectedBranch === 'ALL'
    ? studentProfiles
    : studentProfiles.filter(p => {
      const student = students.find(s => s.id === p.studentId);
      return student && (student.sucursal || '').toUpperCase() === selectedBranch.toUpperCase();
    });

  const turnosHoyCount = filteredClasses.filter(c => c.day === todayDay).length;
  const alumnosCount = filteredStudents.length;
  const paquetesActivos = filteredStudentProfiles.filter(p => p.classCredits > 0).length;
  const unpaidCount = filteredStudents.filter(st => {
    const p = filteredStudentProfiles.find(p => p.studentId === st.id);
    return !p || p.classCredits === 0;
  }).length;
  const deudaTotal = unpaidCount * 8000;

  // Alertas resúmenes
  const alumnasConUnCredito = filteredStudentProfiles.filter(p => p.classCredits === 1).length;
  
  const expiringProfiles = filteredStudentProfiles.filter(p => {
    if (!p.expirationDate) return false;
    const expDate = new Date(p.expirationDate);
    const diffTime = expDate - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });
  const proximosVencimientosCount = expiringProfiles.length;

  const pendingPaymentsCount = (payments || []).filter(p => {
    if (p.status !== 'PENDING') return false;
    if (selectedBranch === 'ALL') return true;
    const st = students.find(s => s.id === p.studentId);
    return st && (st.sucursal || '').toUpperCase() === selectedBranch.toUpperCase();
  }).length;

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-sans)', marginBottom: '4px', color: 'var(--gris-oscuro)' }}>
            Panel de administración
          </h2>
        </div>

        {/* Filtro por Sucursal (Pills) */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-crema-claro)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--gris-claro)', overflowX: 'auto' }}>
          <button
            onClick={() => setSelectedBranch('ALL')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              backgroundColor: selectedBranch === 'ALL' ? 'var(--verde-oliva)' : 'transparent',
              color: selectedBranch === 'ALL' ? 'var(--blanco)' : 'var(--gris-medio)',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            Todas
          </button>
          {branches.map((branch) => {
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
                {branch.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats 2x2 Masonry-like Grid */}
      <div className="stats-dashboard-grid">
        {/* Card 1: Large (Turnos Hoy) */}
        <div className="stat-card-modern stat-card-modern-large" style={{ backgroundColor: 'var(--card-mustard)' }} onClick={() => setAdminTab('classes')}>
          <div className="stat-card-modern-icon">
            <EventIcon style={{ fontSize: '28px', color: '#fff' }} />
          </div>
          <div className="stat-card-modern-content">
            <div className="stat-card-modern-number">{turnosHoyCount}</div>
            <div className="stat-card-modern-label">Turnos hoy</div>
          </div>
        </div>

        {/* Card 2: Top Right (Alumnos) */}
        <div className="stat-card-modern" style={{ backgroundColor: 'var(--card-rust)' }} onClick={() => setAdminTab('students')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="stat-card-modern-content">
              <div className="stat-card-modern-number">{alumnosCount}</div>
              <div className="stat-card-modern-label">Alumnos</div>
            </div>
            <div className="stat-card-modern-icon" style={{ width: '40px', height: '40px' }}>
              <GroupIcon style={{ fontSize: '22px', color: '#fff' }} />
            </div>
          </div>
        </div>

        {/* Card 3: Bottom Right (Paquetes activos) */}
        <div className="stat-card-modern" style={{ backgroundColor: 'var(--card-olive)' }} onClick={() => navigateToStudents ? navigateToStudents('ACTIVE_PACKS') : setAdminTab('students')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="stat-card-modern-content">
              <div className="stat-card-modern-number">{paquetesActivos}</div>
              <div className="stat-card-modern-label" style={{ opacity: 0.85 }}>Packs activos</div>
            </div>
            <div className="stat-card-modern-icon" style={{ width: '40px', height: '40px' }}>
              <CreditCardIcon style={{ fontSize: '22px', color: '#fff' }} />
            </div>
          </div>
        </div>

        {/* Card 4: Full Width Bottom (Deuda total) */}
        <div className="stat-card-modern" style={{ backgroundColor: 'var(--card-sage)', gridColumn: 'span 2', flexDirection: 'row', alignItems: 'center' }} onClick={() => setAdminTab('payments')}>
          <div className="stat-card-modern-icon" style={{ width: '48px', height: '48px' }}>
            <WaterDropIcon style={{ fontSize: '26px', color: '#fff' }} />
          </div>
          <div className="stat-card-modern-content" style={{ flex: 1, textAlign: 'right' }}>
            <div className="stat-card-modern-number">${deudaTotal.toLocaleString('es-AR')}</div>
            <div className="stat-card-modern-label" style={{ opacity: 0.85 }}>Deuda total calculada</div>
          </div>
        </div>
      </div>

      {/* Alertas de Alumnas: Créditos y Vencimientos */}
      <div className="dashboard-section-header" style={{ marginTop: '16px', marginBottom: '8px' }}>
        <span className="dashboard-section-title">Alertas y Vencimientos</span>
      </div>
      <details className="stat-card-modern" style={{ padding: '0', overflow: 'hidden', marginTop: '0', backgroundColor: 'var(--blanco)', border: 'none', borderRadius: '24px' }} open>
        <summary style={{ padding: '16px', fontWeight: 700, fontSize: '16px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <WarningAmberIcon style={{ color: 'var(--rojo)' }} /> Detalle de alertas
        </summary>
        <div style={{ padding: '0 16px 16px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          
          {/* Alumnas con 1 crédito */}
          <div style={{ backgroundColor: 'var(--blanco)', border: '1px solid var(--gris-claro)', borderRadius: 'var(--radius-md)', padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '36px', fontWeight: 900, color: 'var(--amarillo-alerta)', lineHeight: 1 }}>{alumnasConUnCredito}</span>
            <span style={{ fontSize: '13px', color: 'var(--gris-oscuro)', fontWeight: 600, marginTop: '8px' }}>Alumnas con 1 crédito</span>
          </div>

          {/* Pagos Pendientes */}
          <div 
            onClick={() => setAdminTab('payments')}
            style={{ backgroundColor: 'var(--blanco)', border: '1px solid var(--gris-claro)', borderRadius: 'var(--radius-md)', padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'var(--transition-smooth)' }}
          >
            <span style={{ fontSize: '36px', fontWeight: 900, color: 'var(--rojo-alerta)', lineHeight: 1 }}>{pendingPaymentsCount}</span>
            <span style={{ fontSize: '13px', color: 'var(--gris-oscuro)', fontWeight: 600, marginTop: '8px' }}>Pagos por confirmar</span>
          </div>

          {/* Alumnas con vencimiento cercano (<= 7 días) */}
          <div style={{ backgroundColor: 'var(--blanco)', border: '1px solid var(--gris-claro)', borderRadius: 'var(--radius-md)', padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '36px', fontWeight: 900, color: 'var(--rojo)', lineHeight: 1 }}>{proximosVencimientosCount}</span>
            <span style={{ fontSize: '13px', color: 'var(--gris-oscuro)', fontWeight: 600, marginTop: '8px' }}>Vencimientos próximos</span>
          </div>

        </div>
      </details>

      {/* Botón/Card de Reportes */}
      <div
        className="stat-card-modern"
        onClick={() => setAdminTab('reports')}
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '16px',
          padding: '20px',
          background: 'var(--blanco)',
          border: 'none',
          borderRadius: '24px',
          cursor: 'pointer',
          marginTop: '6px'
        }}
      >
        <div className="stat-card-icon-container" style={{ color: 'var(--verde-oliva)', margin: 0, width: '40px', height: '40px', background: 'rgba(69, 95, 62, 0.1)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <BarChartIcon style={{ fontSize: '22px' }} />
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gris-oscuro)', fontFamily: 'var(--font-sans)', marginBottom: '4px' }}>
            Reportes y estadísticas
          </div>
          <div style={{ fontSize: '12px', color: 'var(--gris-medio)', lineHeight: '1.4' }}>
            Accedé a métricas, informes financieros y rendimiento de la academia.
          </div>
        </div>
        <div style={{ fontSize: '18px', color: 'var(--gris-medio)', fontWeight: 'bold' }}>
          ➔
        </div>
      </div>

      {/* Botón/Card de Configuración */}
      <div
        className="stat-card-modern"
        onClick={() => setAdminTab('config')}
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '16px',
          padding: '20px',
          background: 'var(--blanco)',
          border: 'none',
          borderRadius: '24px',
          cursor: 'pointer'
        }}
      >
        <div className="stat-card-icon-container" style={{ color: 'var(--marron-arcilla)', margin: 0, width: '40px', height: '40px', background: 'var(--bg-crema)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <SettingsIcon style={{ fontSize: '22px' }} />
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gris-oscuro)', fontFamily: 'var(--font-sans)', marginBottom: '4px' }}>
            Configuración
          </div>
          <div style={{ fontSize: '12px', color: 'var(--gris-medio)', lineHeight: '1.4' }}>
            Gestioná el calendario (feriados, días no laborables y días especiales), sucursales y normas de convivencia.
          </div>
        </div>
        <div style={{ fontSize: '18px', color: 'var(--gris-medio)', fontWeight: 'bold' }}>
          ➔
        </div>
      </div>

    </div>
  );
}
