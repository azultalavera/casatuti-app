import React from 'react';
import { useApp } from '../../../../context/AppContext';
import { exportToExcel } from '../../../../utils/exportToExcel';
import { formatDateDDMMYYYY } from '../../../../utils/dateUtils';

export default function ReportMetrics() {
  const { users, studentProfiles, classes, bookings, payments } = useApp();

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
    
    const sortedPayments = [...(payments || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

    const data = activeStudents.map(a => {
      const p = studentProfiles.find(p => p.studentId === a.id);
      
      const lastPayment = sortedPayments.find(pay => pay.studentId === a.id && (pay.status === 'CONFIRMED' || !pay.status));
      const fechaCompraRaw = lastPayment && lastPayment.date ? lastPayment.date : null;
      
      const formatFec = (d) => {
        if (!d) return 'N/A';
        const formatted = formatDateDDMMYYYY(d);
        return formatted === '' ? 'N/A' : formatted;
      };

      return { 
        "Nombre": a.name || a.nombre || '-', 
        "Teléfono": a.telefono || '-', 
        "Instagram": a.instagram || '-',
        "Fecha de nacimiento": formatFec(a.fecha_nacimiento || a.birthdate),
        "DNI": a.nro_documento || '-',
        "Créditos Disponibles": p?.classCredits || 0,
        "Fecha de Compra": formatFec(fechaCompraRaw),
        "Fecha de Vencimiento": formatFec(p?.expirationDate)
      };
    });
    
    exportToExcel(data, "Reporte_Alumnas_Activas");
  };

  const handleExportDropouts = () => {
    if (dropoutStudents.length === 0) return alert("No hay alumnas en abandono.");
    const data = dropoutStudents.map(a => {
      return { "Nombre": a.name, "Email": a.email, "Teléfono": a.telefono, "Estado": "Abandono (>30 días sin créditos)" };
    });
    exportToExcel(data, "Reporte_Alumnas_Abandono");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Cards de Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        
        <div className="stat-card-modern" style={{ backgroundColor: 'var(--blanco)', border: '2px solid var(--verde-oliva)', color: 'var(--gris-oscuro)' }}>
          <div style={{ fontSize: '14px', color: 'var(--gris-medio)', marginBottom: '8px', fontWeight: 600 }}>ALUMNAS ACTIVAS</div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--verde-oliva)', marginBottom: '8px' }}>{activeStudents.length} <span style={{fontSize:'16px', fontWeight:400, color: 'var(--gris-medio)'}}>/ {totalAlumnos}</span></div>
          <div style={{ fontSize: '12px', color: 'var(--gris-medio)' }}>{activePercentage}% del total de alumnas registradas.</div>
        </div>

        <div className="stat-card-modern" style={{ backgroundColor: 'var(--blanco)', border: '2px solid var(--rojo-alerta)', color: 'var(--gris-oscuro)' }}>
          <div style={{ fontSize: '14px', color: 'var(--gris-medio)', marginBottom: '8px', fontWeight: 600 }}>TASA DE ABANDONO</div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--rojo-alerta)', marginBottom: '8px' }}>{dropoutPercentage}%</div>
          <div style={{ fontSize: '12px', color: 'var(--gris-medio)' }}>{dropoutStudents.length} alumnas sin créditos ni reservas recientes.</div>
        </div>

        <div className="stat-card-modern" style={{ backgroundColor: 'var(--blanco)', border: '1px solid var(--gris-claro)', color: 'var(--gris-oscuro)' }}>
          <div style={{ fontSize: '14px', color: 'var(--gris-medio)', marginBottom: '8px', fontWeight: 600 }}>OCUPACIÓN SEMANAL</div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--gris-oscuro)', marginBottom: '8px' }}>{currentWeeklyOccupancy}%</div>
          <div style={{ fontSize: '12px', color: 'var(--gris-medio)', marginBottom: '16px' }}>{recentBookings.length} reservas sobre {totalWeeklyCapacity} cupos disponibles.</div>
          <div style={{ width: '100%', height: '8px', background: 'var(--bg-crema-claro)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${currentWeeklyOccupancy}%`, height: '100%', background: currentWeeklyOccupancy > 80 ? 'var(--marron-arcilla)' : 'var(--verde-oliva)' }}></div>
          </div>
        </div>

      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '12px' }}>
        <button onClick={handleExportActive} className="btn-tuti btn-primary-clay" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', flex: 1, justifyContent: 'center', minWidth: '200px' }}>
          <span>⬇</span> Exportar Activas (Excel)
        </button>
        <button onClick={handleExportDropouts} className="btn-tuti btn-primary-clay" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', flex: 1, justifyContent: 'center', minWidth: '200px', backgroundColor: 'var(--marron-arcilla)' }}>
          <span>⬇</span> Exportar Abandonos (Excel)
        </button>
      </div>

    </div>
  );
}
