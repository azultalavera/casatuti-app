import React from 'react';
import { useApp } from '../../../../context/AppContext';
import { exportToCSV } from '../../../../utils/exportToCSV';

export default function ReportMetrics() {
  const { users, studentProfiles, classes, bookings } = useApp();

  const alumnos = users.filter(u => u.role === 'ALUMNO');

  // 1. Alumnas Activas (No bloqueadas y con créditos > 0 o simplemente no bloqueadas)
  const activeStudents = alumnos.filter(a => {
    const profile = studentProfiles.find(p => p.studentId === a.id);
    return profile && !profile.isBlocked && profile.classCredits > 0;
  });

  // 2. Tasa de abandono (Alumnas con 0 créditos que no tienen reservas a futuro ni en los últimos 30 días)
  const dropoutStudents = alumnos.filter(a => {
    const profile = studentProfiles.find(p => p.studentId === a.id);
    if (!profile || profile.classCredits > 0) return false;

    // Buscar reservas de esta alumna
    const studentBookings = bookings.filter(b => b.studentId === a.id && b.status !== 'CANCELLED');
    if (studentBookings.length === 0) return true; // Nunca tomó clase y no tiene créditos = abandono/inactiva

    // Verificar si la última clase fue hace más de 30 días
    const sortedDates = studentBookings.map(b => new Date(b.date)).sort((x, y) => y - x);
    const lastClassDate = sortedDates[0];
    const daysSinceLastClass = (new Date() - lastClassDate) / (1000 * 60 * 60 * 24);

    return daysSinceLastClass > 30;
  });

  const totalAlumnos = alumnos.length;
  const activePercentage = totalAlumnos > 0 ? Math.round((activeStudents.length / totalAlumnos) * 100) : 0;
  const dropoutPercentage = totalAlumnos > 0 ? Math.round((dropoutStudents.length / totalAlumnos) * 100) : 0;

  // 3. Ocupación de cupos (Semana actual)
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);
  
  const recentBookings = bookings.filter(b => {
    const d = new Date(b.date);
    return d >= oneWeekAgo && d <= today && b.status !== 'CANCELLED';
  });

  // Calcular la capacidad total de las clases que ocurrieron en la última semana
  // (Aproximación simple: tomamos las clases activas y asumimos 1 sesión por semana)
  const activeClasses = classes.filter(c => c.isActive !== false);
  const totalWeeklyCapacity = activeClasses.reduce((sum, c) => sum + (c.maxCapacity || 0), 0);
  const currentWeeklyOccupancy = totalWeeklyCapacity > 0 ? Math.round((recentBookings.length / totalWeeklyCapacity) * 100) : 0;

  const handleExportActive = () => {
    if (activeStudents.length === 0) return alert("No hay alumnas activas.");
    const data = activeStudents.map(a => {
      const p = studentProfiles.find(p => p.studentId === a.id);
      return { "Nombre": a.name, "Email": a.email, "Teléfono": a.telefono, "Créditos_Restantes": p?.classCredits || 0 };
    });
    exportToCSV(data, "Reporte_Alumnas_Activas");
  };

  const handleExportDropouts = () => {
    if (dropoutStudents.length === 0) return alert("No hay alumnas en abandono.");
    const data = dropoutStudents.map(a => {
      return { "Nombre": a.name, "Email": a.email, "Teléfono": a.telefono, "Estado": "Abandono (>30 días sin créditos)" };
    });
    exportToCSV(data, "Reporte_Alumnas_Abandono");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Cards de Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        
        <div className="stat-card-modern" style={{ background: 'linear-gradient(135deg, #455f3e 0%, #2c3d28 100%)', color: 'white' }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px', fontWeight: 600 }}>ALUMNAS ACTIVAS</div>
          <div style={{ fontSize: '36px', fontWeight: 800, marginBottom: '8px' }}>{activeStudents.length} <span style={{fontSize:'16px', fontWeight:400, opacity:0.8}}>/ {totalAlumnos}</span></div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '16px' }}>{activePercentage}% del total de alumnas registradas.</div>
          <button onClick={handleExportActive} className="btn-tuti" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', width: '100%', fontSize: '12px' }}>⬇ Exportar Activas</button>
        </div>

        <div className="stat-card-modern" style={{ background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)', color: 'white' }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px', fontWeight: 600 }}>TASA DE ABANDONO</div>
          <div style={{ fontSize: '36px', fontWeight: 800, marginBottom: '8px' }}>{dropoutPercentage}%</div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '16px' }}>{dropoutStudents.length} alumnas sin créditos ni reservas recientes.</div>
          <button onClick={handleExportDropouts} className="btn-tuti" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', width: '100%', fontSize: '12px' }}>⬇ Exportar Abandonos</button>
        </div>

        <div className="stat-card-modern" style={{ background: 'var(--blanco)', border: '1px solid var(--gris-claro)' }}>
          <div style={{ fontSize: '14px', color: 'var(--gris-medio)', marginBottom: '8px', fontWeight: 600 }}>OCUPACIÓN SEMANAL</div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--gris-oscuro)', marginBottom: '8px' }}>{currentWeeklyOccupancy}%</div>
          <div style={{ fontSize: '12px', color: 'var(--gris-medio)', marginBottom: '16px' }}>{recentBookings.length} reservas sobre {totalWeeklyCapacity} cupos disponibles.</div>
          <div style={{ width: '100%', height: '8px', background: 'var(--bg-crema-claro)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${currentWeeklyOccupancy}%`, height: '100%', background: currentWeeklyOccupancy > 80 ? 'var(--marron-arcilla)' : 'var(--verde-oliva)' }}></div>
          </div>
        </div>

      </div>

    </div>
  );
}
