import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function ConfigView() {
  const {
    currentUser,
    users,
    studentProfiles,
    classes,
    bookings,
    clayDeliveries,
    payments,
    alerts,
    changeUser,
    changeUserRole,
    resetDatabase
  } = useApp();

  const [activeTab, setActiveTab] = useState('users');

  const getTableData = () => {
    switch (activeTab) {
      case 'users': return users;
      case 'profiles': return studentProfiles;
      case 'classes': return classes;
      case 'bookings': return bookings;
      case 'clay': return clayDeliveries;
      case 'payments': return payments;
      case 'alerts': return alerts;
      default: return {};
    }
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <span className={`badge ${currentUser?.role === 'CONFIGURADOR' ? 'badge-warning' : 'badge-danger'}`} style={{ marginBottom: '8px' }}>
          Rol: {currentUser?.role === 'CONFIGURADOR' ? 'Soporte / Configurador' : 'Administrador'}
        </span>
        <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>Consola de Gestión</h2>
        <p style={{ color: 'var(--gris-medio)', fontSize: '14px' }}>
          {currentUser?.role === 'CONFIGURADOR' 
            ? 'Simula identidades móviles y modifica roles y credenciales de usuario en tiempo real.'
            : 'Modifica roles y credenciales de usuario en caliente.'}
        </p>
      </div>

      {/* Tarjeta de Gestión de Roles y Credenciales */}
      <div className="clay-card accent-clay">
        <h3 style={{ fontSize: '18px', marginBottom: '10px', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
          Gestión de Roles y Credenciales
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--gris-medio)', marginBottom: '16px' }}>
          Como {currentUser?.role === 'CONFIGURADOR' ? 'Soporte Técnico' : 'Administrador'}, puedes cambiar el rol de cualquier usuario en tiempo real y consultar sus contraseñas.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {users.map(u => (
            <div
              key={u.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-crema-claro)',
                border: '1px solid var(--gris-claro)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gris-oscuro)' }}>{u.name}</h4>
                  <p style={{ fontSize: '11px', color: 'var(--gris-medio)' }}>{u.email}</p>
                  <p style={{ fontSize: '11px', color: 'var(--marron-arcilla)', fontWeight: 600, marginTop: '4px' }}>
                    🔑 Clave: <code style={{ backgroundColor: 'rgba(0,0,0,0.05)', padding: '2px 4px', borderRadius: '4px' }}>{u.password}</code>
                  </p>
                </div>
                
                {currentUser?.id === u.id && (
                  <span className="badge badge-warning" style={{ fontSize: '9px' }}>Tú</span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--gris-medio)', fontWeight: 600 }}>Asignar Rol:</span>
                <select
                  value={u.role}
                  onChange={async (e) => {
                    const nextRole = e.target.value;
                    try {
                      await changeUserRole(u.id, nextRole);
                    } catch (err) {
                      alert(`Error al actualizar rol: ${err.message}`);
                    }
                  }}
                  className="input-tuti"
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    width: 'auto',
                    flex: '1',
                    borderRadius: '8px',
                    height: 'auto',
                    border: '1px solid var(--verde-oliva)'
                  }}
                >
                  <option value="ALUMNO">ALUMNO (Estudiante)</option>
                  <option value="PROFE">PROFE (Profesor)</option>
                  <option value="ADMIN">ADMIN (Administrador)</option>
                  <option value="CONFIGURADOR">CONFIGURADOR (Soporte)</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tarjeta de Impersonación (Solo visible para CONFIGURADOR) */}
      {currentUser?.role === 'CONFIGURADOR' && (
        <div className="clay-card">
          <h3 style={{ fontSize: '18px', marginBottom: '14px', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
            Simulador de Identidad (Impersonación)
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--gris-medio)', marginBottom: '16px' }}>
            Selecciona un usuario para cambiar instantáneamente la perspectiva y funcionalidades de la app sin cerrar sesión:
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => changeUser(u.id)}
                className="btn-tuti btn-secondary"
                style={{
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  border: currentUser?.id === u.id ? '2px solid var(--marron-arcilla)' : '1px solid var(--gris-claro)',
                  backgroundColor: currentUser?.id === u.id ? 'var(--marron-arcilla-light)' : 'var(--blanco)'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 600, color: 'var(--gris-oscuro)', fontSize: '14px' }}>{u.name}</span>
                  <span style={{ fontSize: '11px', color: 'var(--gris-medio)' }}>{u.email}</span>
                </div>
                <span className={`badge ${
                  u.role === 'ADMIN' ? 'badge-danger' : 
                  u.role === 'PROFE' ? 'badge-oliva' : 
                  u.role === 'CONFIGURADOR' ? 'badge-warning' : 'badge-clay'
                }`}>
                  {u.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Base de Datos Local en Tiempo Real (Solo visible para CONFIGURADOR) */}
      {currentUser?.role === 'CONFIGURADOR' && (
        <div className="clay-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
              Base de Datos en Tiempo Real
            </h3>
            <button 
              onClick={() => {
                if (window.confirm("¿Seguro que quieres borrar todo y reiniciar con datos de prueba semilla?")) {
                  resetDatabase();
                }
              }} 
              className="btn-tuti btn-danger"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }}
            >
              Reset DB
            </button>
          </div>
          
          {/* Pestañas de Tablas */}
          <div style={{ 
            display: 'flex', 
            overflowX: 'auto', 
            gap: '6px', 
            paddingBottom: '8px', 
            marginBottom: '12px',
            borderBottom: '1px solid var(--gris-claro)'
          }}>
            {['users', 'profiles', 'classes', 'bookings', 'clay', 'payments', 'alerts'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: activeTab === tab ? '700' : '500',
                  cursor: 'pointer',
                  backgroundColor: activeTab === tab ? 'var(--verde-oliva)' : 'transparent',
                  color: activeTab === tab ? 'var(--blanco)' : 'var(--gris-medio)'
                }}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Visor JSON */}
          <pre style={{
            backgroundColor: '#272522',
            color: '#E6E1DC',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '11px',
            overflowX: 'auto',
            maxHeight: '280px',
            fontFamily: 'monospace',
            border: '1px solid #3E3B37',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)'
          }}>
            {JSON.stringify(getTableData(), null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
