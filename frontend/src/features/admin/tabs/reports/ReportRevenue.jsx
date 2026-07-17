import React, { useState, useMemo } from 'react';
import { useApp } from '../../../../context/AppContext';
import { exportToExcel } from '../../../../utils/exportToExcel';

export default function ReportRevenue() {
  const { payments, bakes, studentProfiles, users } = useApp();
  const [filterType, setFilterType] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // 'ALL', 'Clases', 'Horneados'

  // Unificar pagos y horneados en un solo array de ingresos
  const allRevenue = useMemo(() => {
    const unified = [];

    // Pagos (Clases / Packs) - Solo considerar pagos confirmados (status === 'CONFIRMED' o equivalente)
    // Asumiendo que status === 'PAID' o 'CONFIRMED' o sin status
    payments.forEach(p => {
      if (p.status === 'PENDING') return; // ignorar pagos pendientes

      // Obtener nombre del alumno
      const user = users?.find(u => u.id === p.studentId);
      const studentName = user ? user.name : 'Alumno Desconocido';

      unified.push({
        id: `pay_${p.id}`,
        date: p.date,
        amount: p.amount || 0,
        category: 'Clases',
        description: p.description || 'Pago de clases',
        studentName,
        paymentMethod: 'No especificado', // Podría venir en p.paymentMethod
        originalRecord: p
      });
    });

    // Horneados
    bakes.forEach(b => {
      unified.push({
        id: `bake_${b.id}`,
        date: b.date,
        amount: b.price || 0,
        category: 'Horneados',
        description: 'Servicio de Horneado',
        studentName: b.studentName || 'Alumno Desconocido',
        paymentMethod: b.paymentMethod === 'TRANSF' ? 'Transferencia' : 'Contado',
        originalRecord: b
      });
    });

    // Ordenar por fecha descendente
    return unified.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [payments, bakes, users]);

  // Aplicar filtros
  const filteredRevenue = useMemo(() => {
    return allRevenue.filter(item => {
      // Filtro de categoría
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false;
      }

      // Filtro de fecha
      if (filterType === 'ALL') return true;
      
      const itemDate = new Date(item.date);
      const today = new Date();
      
      if (filterType === 'DAY') {
        return itemDate.toDateString() === today.toDateString();
      }
      
      if (filterType === 'WEEK') {
        const msInWeek = 7 * 24 * 60 * 60 * 1000;
        return (today - itemDate) <= msInWeek;
      }
      
      if (filterType === 'MONTH') {
        return itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
      }
      
      return true;
    });
  }, [allRevenue, filterType, categoryFilter]);

  // Agrupar totales
  const totals = useMemo(() => {
    let total = 0;
    const byCategory = {};

    filteredRevenue.forEach(item => {
      total += item.amount;
      if (!byCategory[item.category]) {
        byCategory[item.category] = 0;
      }
      byCategory[item.category] += item.amount;
    });

    return { total, byCategory };
  }, [filteredRevenue]);

  const categories = Array.from(new Set(allRevenue.map(item => item.category)));

  const handleExport = () => {
    if (filteredRevenue.length === 0) {
      alert("No hay datos para exportar con este filtro.");
      return;
    }
    
    const exportData = filteredRevenue.map(r => ({
      "Fecha": r.date.split(' ')[0],
      "Categoría": r.category,
      "Descripción": r.description,
      "Alumna": r.studentName,
      "Monto": r.amount,
      "Método de Pago": r.paymentMethod,
    }));

    exportToExcel(exportData, `Reporte_Recaudacion_${filterType}`);
  };

  return (
    <div className="clay-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--gris-oscuro)' }}>Recaudación Total</h3>
          <p style={{ fontSize: '14px', color: 'var(--gris-medio)' }}>Registro unificado de todos los ingresos (Clases, Horneados, etc).</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ maxWidth: '200px', margin: 0 }}>
            <label>Periodo:</label>
            <select className="input-tuti" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="ALL">Todo el historial</option>
              <option value="DAY">Hoy</option>
              <option value="WEEK">Última Semana</option>
              <option value="MONTH">Este mes</option>
            </select>
          </div>
          <div className="form-group" style={{ maxWidth: '200px', margin: 0 }}>
            <label>Tipificación:</label>
            <select className="input-tuti" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="ALL">Todas las tipificaciones</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {Object.entries(totals.byCategory).map(([cat, amount]) => (
            <div key={cat} style={{ background: 'var(--blanco)', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--gris-claro)' }}>
              <span style={{ fontSize: '12px', color: 'var(--gris-medio)', fontWeight: 'bold', display: 'block', textTransform: 'uppercase' }}>{cat}</span>
              <span style={{ fontSize: '20px', color: 'var(--gris-oscuro)', fontWeight: 600 }}>${amount.toLocaleString()}</span>
            </div>
          ))}
          <div style={{ background: 'var(--bg-crema-claro)', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--marron-arcilla)' }}>
            <span style={{ fontSize: '12px', color: 'var(--marron-arcilla)', fontWeight: 'bold', display: 'block' }}>TOTAL RECAUDADO</span>
            <span style={{ fontSize: '24px', color: 'var(--gris-oscuro)', fontWeight: 800 }}>${totals.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {filteredRevenue.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gris-medio)' }}>
          <p>No se encontraron registros de recaudación para este periodo y filtro.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredRevenue.map(r => (
            <div 
              key={r.id} 
              className="animate-slide-up"
              style={{
                background: 'var(--blanco)',
                border: '1px solid var(--gris-claro)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: 'var(--shadow-flat)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gris-oscuro)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.studentName}
                  </span>
                  <span className={`badge ${r.category === 'Clases' ? 'badge-clay' : 'badge-oliva'}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                    {r.category}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--gris-medio)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {r.description}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--gris-medio)' }}>
                  {r.date.split(' ')[0]}
                </div>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--verde-oliva)', marginLeft: '16px', whiteSpace: 'nowrap' }}>
                +${r.amount.toLocaleString()}
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
