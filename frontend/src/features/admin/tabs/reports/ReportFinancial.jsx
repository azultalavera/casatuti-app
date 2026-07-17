import React, { useState } from 'react';
import { useApp } from '../../../../context/AppContext';
import { exportToExcel } from '../../../../utils/exportToExcel';

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

    exportToExcel(exportData, `Reporte_Horneados_${filterType}`);
  };

  return (
    <div className="clay-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--gris-oscuro)' }}>Reporte Financiero (Horneados)</h3>
          <p style={{ fontSize: '14px', color: 'var(--gris-medio)' }}>Registro de cobros por servicio de horneado.</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div className="form-group" style={{ maxWidth: '200px', margin: 0 }}>
          <label>Periodo:</label>
          <select className="input-tuti" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="ALL">Todo el historial</option>
            <option value="DAY">Hoy</option>
            <option value="WEEK">Última Semana</option>
            <option value="MONTH">Este mes</option>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredBakes.map(b => (
            <div 
              key={b.id} 
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
                  {b.studentName}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className={`badge ${b.paymentMethod === 'TRANSF' ? 'badge-oliva' : 'badge-clay'}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                    {b.paymentMethod === 'TRANSF' ? 'Transferencia' : 'Contado'}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--gris-medio)' }}>
                    {b.date.split(' ')[0]}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gris-oscuro)', marginLeft: '16px' }}>
                +${b.price.toLocaleString()}
              </div>
            </div>
          ))}
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
