import React, { useState } from 'react';
import ReportAttendance from './reports/ReportAttendance';
import ReportFinancial from './reports/ReportFinancial';
import ReportAuditing from './reports/ReportAuditing';
import ReportMetrics from './reports/ReportMetrics';
import ReportBirthdays from './reports/ReportBirthdays';
import ReportRevenue from './reports/ReportRevenue';

export default function ReportsTab({ goBack }) {
  const [activeTab, setActiveTab] = useState('REVENUE');

  const tabs = [
    { id: 'REVENUE', label: 'Recaudación Total' },
    { id: 'METRICS', label: 'Métricas Generales' },
    { id: 'ATTENDANCE', label: 'Asistencia' },
    { id: 'FINANCIAL', label: 'Financiero (Horneados)' },
    { id: 'AUDIT', label: 'Auditoría (Deudas)' },
    { id: 'BIRTHDAYS', label: 'Cumpleaños' },
  ];

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {goBack && (
          <button
            onClick={goBack}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '24px',
              color: 'var(--gris-medio)',
              padding: '0'
            }}
          >
            ←
          </button>
        )}
        <h2 style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-sans)', margin: 0, color: 'var(--gris-oscuro)' }}>
          Reportes y Estadísticas
        </h2>
      </div>

      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        gap: '8px', 
        paddingBottom: '8px',
        borderBottom: '1px solid var(--gris-claro)'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: activeTab === tab.id ? 'var(--verde-oliva)' : 'var(--blanco)',
              color: activeTab === tab.id ? 'var(--blanco)' : 'var(--gris-oscuro)',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: activeTab === tab.id ? 'var(--shadow-clay)' : 'var(--shadow-sm)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ marginTop: '10px' }}>
        {activeTab === 'REVENUE' && <ReportRevenue />}
        {activeTab === 'METRICS' && <ReportMetrics />}
        {activeTab === 'ATTENDANCE' && <ReportAttendance />}
        {activeTab === 'FINANCIAL' && <ReportFinancial />}
        {activeTab === 'AUDIT' && <ReportAuditing />}
        {activeTab === 'BIRTHDAYS' && <ReportBirthdays />}
      </div>
    </div>
  );
}
