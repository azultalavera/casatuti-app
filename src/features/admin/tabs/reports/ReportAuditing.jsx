import React from 'react';
import { useApp } from '../../../../context/AppContext';
import { exportToCSV } from '../../../../utils/exportToCSV';

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
        "Fecha_Pago": p.date ? p.date.split('T')[0] : 'N/A',
        "Alumna": user ? `${user.name} ${user.lastname || ''}`.trim() : 'Desconocida',
        "Documento": user ? user.nro_documento : 'N/A',
        "Monto_Adeudado": p.amount,
        "Créditos_a_acreditar": p.classCreditsAdded,
        "Estado": "Pendiente de Confirmación"
      };
    });

    exportToCSV(exportData, `Reporte_Auditoria_Deudas`);
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
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--gris-claro)' }}>
                <th style={{ padding: '12px 8px', color: 'var(--gris-medio)', fontSize: '14px' }}>Fecha</th>
                <th style={{ padding: '12px 8px', color: 'var(--gris-medio)', fontSize: '14px' }}>Alumna</th>
                <th style={{ padding: '12px 8px', color: 'var(--gris-medio)', fontSize: '14px' }}>DNI</th>
                <th style={{ padding: '12px 8px', color: 'var(--gris-medio)', fontSize: '14px' }}>Monto Pendiente</th>
                <th style={{ padding: '12px 8px', color: 'var(--gris-medio)', fontSize: '14px' }}>Créditos Involucrados</th>
              </tr>
            </thead>
            <tbody>
              {pendingPayments.map(p => {
                const user = users.find(u => u.id === p.studentId);
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px 8px', fontSize: '14px', color: 'var(--gris-oscuro)' }}>{p.date ? p.date.split('T')[0] : '-'}</td>
                    <td style={{ padding: '12px 8px', fontSize: '14px', fontWeight: '500', color: 'var(--gris-oscuro)' }}>
                      {user ? `${user.name} ${user.lastname || ''}` : 'Desconocida'}
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: '14px', color: 'var(--gris-medio)' }}>{user ? user.nro_documento : '-'}</td>
                    <td style={{ padding: '12px 8px', fontSize: '14px', fontWeight: 'bold', color: '#d32f2f' }}>${p.amount.toLocaleString()}</td>
                    <td style={{ padding: '12px 8px', fontSize: '14px' }}>
                      <span className="badge badge-warning">{p.classCreditsAdded} créditos</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
