import React, { useState } from 'react';
import { useApp } from '../../../../context/AppContext';
import { exportToCSV } from '../../../../utils/exportToCSV';

export default function ReportFinancial() {
  const { bakes } = useApp();
  const [filterType, setFilterType] = useState('ALL');

  // Filtrar bakes según la fecha (se asume que date es YYYY-MM-DD o YYYY-MM-DD HH:mm:ss)
  const filteredBakes = bakes.filter(bake => {
    if (filterType === 'ALL') return true;
    
    const bakeDate = new Date(bake.date);
    const today = new Date();
    
    if (filterType === 'DAY') {
      return bakeDate.toDateString() === today.toDateString();
    }
    
    if (filterType === 'WEEK') {
      const msInWeek = 7 * 24 * 60 * 60 * 1000;
      return (today - bakeDate) <= msInWeek;
    }
    
    if (filterType === 'MONTH') {
      return bakeDate.getMonth() === today.getMonth() && bakeDate.getFullYear() === today.getFullYear();
    }
    
    return true;
  });

  const totalRevenue = filteredBakes.reduce((sum, b) => sum + (b.price || 0), 0);

  const handleExport = () => {
    if (filteredBakes.length === 0) {
      alert("No hay datos para exportar con este filtro.");
      return;
    }
    
    const exportData = filteredBakes.map(b => ({
      "Fecha": b.date.split(' ')[0],
      "Alumna": b.studentName,
      "Precio": b.price,
      "Metodo_Pago": b.paymentMethod === 'TRANSF' ? 'Transferencia' : 'Efectivo',
    }));

    exportToCSV(exportData, `Reporte_Horneados_${filterType}`);
  };

  return (
    <div className="clay-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--gris-oscuro)' }}>Reporte Financiero (Horneados)</h3>
          <p style={{ fontSize: '14px', color: 'var(--gris-medio)' }}>Registro de cobros por servicio de horneado.</p>
        </div>
        <button onClick={handleExport} className="btn-tuti btn-primary-clay" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⬇</span> Descargar Excel
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div className="form-group" style={{ maxWidth: '200px', margin: 0 }}>
          <label>Periodo:</label>
          <select className="input-tuti" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="ALL">Todo el historial</option>
            <option value="DAY">Hoy</option>
            <option value="WEEK">Última Semana</option>
            <option value="MONTH">Este Mes</option>
          </select>
        </div>

        <div style={{ background: 'var(--bg-crema-claro)', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--marron-arcilla)' }}>
          <span style={{ fontSize: '12px', color: 'var(--marron-arcilla)', fontWeight: 'bold', display: 'block' }}>RECAUDACIÓN</span>
          <span style={{ fontSize: '24px', color: 'var(--gris-oscuro)', fontWeight: 800 }}>${totalRevenue.toLocaleString()}</span>
        </div>
      </div>

      {filteredBakes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gris-medio)' }}>
          <p>No se encontraron registros de horneados para este periodo.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--gris-claro)' }}>
                <th style={{ padding: '12px 8px', color: 'var(--gris-medio)', fontSize: '14px' }}>Fecha</th>
                <th style={{ padding: '12px 8px', color: 'var(--gris-medio)', fontSize: '14px' }}>Alumna</th>
                <th style={{ padding: '12px 8px', color: 'var(--gris-medio)', fontSize: '14px' }}>Monto</th>
                <th style={{ padding: '12px 8px', color: 'var(--gris-medio)', fontSize: '14px' }}>Método de Pago</th>
              </tr>
            </thead>
            <tbody>
              {filteredBakes.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 8px', fontSize: '14px', color: 'var(--gris-oscuro)' }}>{b.date.split(' ')[0]}</td>
                  <td style={{ padding: '12px 8px', fontSize: '14px', fontWeight: '500', color: 'var(--gris-oscuro)' }}>{b.studentName}</td>
                  <td style={{ padding: '12px 8px', fontSize: '14px', fontWeight: 'bold' }}>${b.price.toLocaleString()}</td>
                  <td style={{ padding: '12px 8px', fontSize: '14px' }}>
                    <span className={`badge ${b.paymentMethod === 'TRANSF' ? 'badge-oliva' : 'badge-clay'}`}>
                      {b.paymentMethod === 'TRANSF' ? 'Transferencia' : 'Contado'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
