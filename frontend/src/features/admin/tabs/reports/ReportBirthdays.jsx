import React, { useState } from 'react';
import { useApp } from '../../../../context/AppContext';
import { exportToExcel } from '../../../../utils/exportToExcel';
import { formatDateDDMMYYYY } from '../../../../utils/dateUtils';

export default function ReportBirthdays() {
  const { users } = useApp();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString());

  const months = [
    { id: '1', name: 'Enero' }, { id: '2', name: 'Febrero' }, { id: '3', name: 'Marzo' },
    { id: '4', name: 'Abril' }, { id: '5', name: 'Mayo' }, { id: '6', name: 'Junio' },
    { id: '7', name: 'Julio' }, { id: '8', name: 'Agosto' }, { id: '9', name: 'Septiembre' },
    { id: '10', name: 'Octubre' }, { id: '11', name: 'Noviembre' }, { id: '12', name: 'Diciembre' }
  ];

  // Filtrar alumnas cuyo cumpleaños caiga en el mes seleccionado
  const birthdayUsers = users.filter(u => {
    if (!u.fecha_nacimiento) return false;
    // Asumimos formato YYYY-MM-DD
    const parts = u.fecha_nacimiento.split('-');
    if (parts.length >= 2) {
      const month = parseInt(parts[1], 10);
      return month === parseInt(selectedMonth, 10);
    }
    return false;
  }).sort((a, b) => {
    const dayA = parseInt((a.fecha_nacimiento.split('T')[0] || '').split('-')[2], 10) || 0;
    const dayB = parseInt((b.fecha_nacimiento.split('T')[0] || '').split('-')[2], 10) || 0;
    return dayA - dayB; // Ordenar por día del mes
  });

  const handleExport = () => {
    if (birthdayUsers.length === 0) {
      alert("No hay cumpleaños en este mes.");
      return;
    }
    
    const exportData = birthdayUsers.map(u => ({
      "Fecha": formatDateDDMMYYYY(u.fecha_nacimiento),
      "Mes": months.find(m => m.id === selectedMonth)?.name || '',
      "Alumna": `${u.name} ${u.lastname || ''}`.trim(),
      "Email": u.email,
      "Teléfono": u.telefono || 'N/A'
    }));

    exportToExcel(exportData, `Cumpleanos_Mes_${selectedMonth}`);
  };

  return (
    <div className="clay-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--gris-oscuro)' }}>Reporte de Cumpleaños</h3>
          <p style={{ fontSize: '14px', color: 'var(--gris-medio)' }}>Listado de cumpleaños del mes para enviar saludos o promociones.</p>
        </div>
      </div>

      <div className="form-group" style={{ maxWidth: '300px', marginBottom: '24px' }}>
        <label>Seleccionar Mes:</label>
        <select className="input-tuti" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
          {months.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      {birthdayUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gris-medio)' }}>
          <p>No hay alumnas con fecha de nacimiento registrada en este mes.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {birthdayUsers.map(u => {
            const formattedDate = formatDateDDMMYYYY(u.fecha_nacimiento);
            return (
              <div 
                key={u.id} 
                className="animate-slide-up"
                style={{
                  background: 'var(--blanco)',
                  border: '1px solid var(--gris-claro)',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: 'var(--shadow-flat)'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gris-oscuro)' }}>
                    {u.name} {u.lastname}
                  </span>
                  <div style={{ fontSize: '12px', color: 'var(--gris-medio)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {u.telefono && <span>📞 {u.telefono}</span>}
                    {u.email && <span>✉️ {u.email}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--verde-oliva-light)', padding: '6px 12px', borderRadius: '12px', minWidth: '60px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--verde-oliva-dark)', fontWeight: 600 }}>Fecha</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--verde-oliva)', lineHeight: 1.1 }}>{formattedDate}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
        <button onClick={handleExport} className="btn-tuti btn-primary-clay" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', width: '100%', justifyContent: 'center' }}>
          <span>⬇</span> Descargar Excel
        </button>
      </div>
    </div>
  );
}
