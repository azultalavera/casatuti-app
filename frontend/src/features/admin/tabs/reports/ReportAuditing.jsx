import React from 'react';
import { useApp } from '../../../../context/AppContext';
import { exportToExcel } from '../../../../utils/exportToExcel';

export default function ReportAuditing() {
  const { payments, users } = useApp();

  // Filtrar pagos que están pendientes de confirmación (Deudas de auditoría)
  const pendingPayments = payments.filter(p => p.status === 'PENDING');

  const handleExport = () => {
    if (pendingPayments.length === 0) {
      alert("No hay deudas/pagos pendientes para exportar.");
      return;
    }
    
    const exportData = pendingPayments.map(p => {
      const user = users.find(u => u.id === p.studentId);
      return {
        "Fecha_Pago": p.date ? p.date.split('T')[0].split(' ')[0] : 'N/A',
        "Alumna": user ? `${user.name} ${user.lastname || ''}`.trim() : 'Desconocida',
        "Documento": user ? user.nro_documento : 'N/A',
        "Monto_Adeudado": p.amount,
        "Créditos_a_acreditar": p.classCreditsAdded,
        "Estado": "Pendiente de Confirmación"
      };
    });

    exportToExcel(exportData, `Reporte_Auditoria_Deudas`);
  };

  const totalDebt = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="clay-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--gris-oscuro)' }}>Reporte de Auditoría</h3>
          <p style={{ fontSize: '14px', color: 'var(--gris-medio)' }}>Pagos informados por transferencia pendientes de conciliación.</p>
        </div>
        <button onClick={handleExport} className="btn-tuti btn-primary-clay" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⬇</span> Descargar Excel
        </button>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ background: '#fff3f3', padding: '12px 20px', borderRadius: '12px', border: '1px solid #ffcdd2', display: 'inline-block' }}>
          <span style={{ fontSize: '12px', color: '#d32f2f', fontWeight: 'bold', display: 'block' }}>TOTAL EN AUDITORÍA (PENDIENTE)</span>
          <span style={{ fontSize: '24px', color: '#b71c1c', fontWeight: 800 }}>${totalDebt.toLocaleString()}</span>
        </div>
      </div>

      {pendingPayments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gris-medio)' }}>
          <p>Excelente. No hay pagos pendientes de auditoría en este momento.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pendingPayments.map(p => {
            const user = users.find(u => u.id === p.studentId);
            return (
              <div 
                key={p.id} 
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gris-oscuro)' }}>
                      {user ? `${user.name} ${user.lastname || ''}`.trim() : 'Desconocida'}
                    </span>
                    {user?.nro_documento && (
                      <span style={{ fontSize: '11px', color: 'var(--gris-medio)' }}>
                        DNI: {user.nro_documento}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="badge badge-warning" style={{ fontSize: '10px', padding: '2px 8px' }}>
                      {p.classCreditsAdded} créditos
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--gris-medio)' }}>
                      {p.date ? p.date.split('T')[0].split(' ')[0] : '-'}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--rojo-alerta)', marginLeft: '16px' }}>
                  ${p.amount.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
