import React, { useState } from 'react';
import logo from './assets/logo.png';
import { AppProvider, useApp } from './context/AppContext';
import AlumnoView from './features/student/AlumnoView';
import ProfeView from './features/teacher/ProfeView';
import AdminView from './features/admin/AdminView';
import ConfigView from './features/support/ConfigView';
import LoginView from './features/auth/LoginView';
import PersonIcon from '@mui/icons-material/Person';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';

function AppContentWrapper() {
  const { currentUser, isAuthenticated, logoutAction, users, changeUser, loading, alerts, resolveAlertAction, resolveAllAlertsAction } = useApp();
  const [viewOverride, setViewOverride] = useState(null); // Permite forzar vista de consola
  const [showImpersonatorDropdown, setShowImpersonatorDropdown] = useState(false);
  const [showHeaderDropdown, setShowHeaderDropdown] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [adminTab, setAdminTab] = useState('dashboard');

  const userAlerts = (alerts || []).filter(a => 
    !a.resolved && (currentUser?.role === 'ADMIN' || a.studentId === currentUser?.id)
  );

  // Determinar qué vista renderizar
  const renderActiveView = () => {
    if (viewOverride === 'config') {
      return <ConfigView />;
    }

    if (!currentUser) return <div style={{ padding: '20px', textAlign: 'center' }}>Cargando usuario...</div>;

    switch (currentUser.role) {
      case 'ADMIN':
        return <AdminView activeTab={adminTab} setActiveTab={setAdminTab} />;
      case 'PROFE':
        return <ProfeView activeTab={viewOverride || 'inicio'} setActiveTab={setViewOverride} />;
      case 'ALUMNO':
        return <AlumnoView activeTab={viewOverride || 'inicio'} setActiveTab={setViewOverride} />;
      case 'CONFIGURADOR':
        return <ConfigView />;
      default:
        return <AlumnoView />;
    }
  };

  // Ícono de rol
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'var(--rojo-alerta)';
      case 'PROFE': return 'var(--verde-oliva-dark)';
      case 'CONFIGURADOR': return 'var(--amarillo-alerta)';
      default: return 'var(--marron-arcilla)';
    }
  };

  // Si no está autenticado, mostrar únicamente la pantalla de Login con estética móvil
  if (!isAuthenticated) {
    return (
      <div className="app-mobile-container">
        {loading && (
          <div className="loading-overlay">
            <div className="tuti-spinner"></div>
          </div>
        )}

        {/* Pantalla de Inicio de Sesión */}
        <div className="app-content" style={{ paddingBottom: '24px' }}>
          <LoginView />
        </div>
      </div>
    );
  }

  return (
    <div className="app-mobile-container">
      {/* Indicador de Carga */}
      {loading && (
        <div className="loading-overlay">
          <div className="tuti-spinner"></div>
        </div>
      )}

      {/* Cabecera de Depuración Rápida (Para facilitar las pruebas de la demo - Solo visible para CONFIGURADOR) */}
      {currentUser?.role === 'CONFIGURADOR' && (
        <div style={{
          backgroundColor: '#EDE7DC',
          padding: '8px 16px',
          borderBottom: '1px solid var(--gris-claro)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          fontWeight: 'bold',
          position: 'relative',
          zIndex: 80
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: getRoleBadgeColor(currentUser?.role)
            }}></div>
            <span style={{ color: 'var(--gris-oscuro)' }}>
              Sesión: <span style={{ textDecoration: 'underline' }}>{currentUser?.name}</span> ({currentUser?.role})
            </span>
          </div>
          
          <div>
            <button
              onClick={() => setShowImpersonatorDropdown(!showImpersonatorDropdown)}
              style={{
                background: 'var(--blanco)',
                border: '1px solid var(--gris-claro)',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                color: 'var(--marron-arcilla)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {showImpersonatorDropdown ? 'Cerrar ✕' : 'Cambiar Rol'}
                {!showImpersonatorDropdown && <PersonIcon style={{ fontSize: '14px' }} />}
              </div>
            </button>

            {showImpersonatorDropdown && (
              <div style={{
                position: 'absolute',
                top: '32px',
                right: '16px',
                backgroundColor: 'var(--blanco)',
                border: '1px solid var(--gris-claro)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-clay)',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                width: '180px',
                zIndex: 99
              }}>
                <span style={{ fontSize: '9px', color: 'var(--gris-medio)', padding: '4px 8px', display: 'block' }}>
                  SELECCIONA PERFIL:
                </span>
                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      changeUser(u.id);
                      setViewOverride(null); // Quitar override de config al impersonar
                      setShowImpersonatorDropdown(false);
                      setShowHeaderDropdown(false);
                    }}
                    style={{
                      padding: '8px',
                      textAlign: 'left',
                      background: currentUser?.id === u.id ? 'var(--bg-crema)' : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: currentUser?.id === u.id ? 'bold' : 'normal',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>{u.nombre || u.name}</span>
                    <span style={{
                      fontSize: '9px',
                      backgroundColor: getRoleBadgeColor(u.rol || u.role),
                      color: 'white',
                      padding: '1px 4px',
                      borderRadius: '4px'
                    }}>{u.rol || u.role}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cabecera de Marca Premium Unificada */}
      <div className="app-brand-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={logo} alt="Casa tuti logo" className="brand-logo-img" />
          <span className="brand-title-text">Casa tuti</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Configuración - Solo para Rol ADMIN */}
          {currentUser?.role === 'ADMIN' && (
            <button
              onClick={() => setAdminTab('config')}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                color: 'var(--blanco)',
                transition: 'var(--transition-quick)',
                outline: adminTab === 'config' ? '2px solid var(--blanco)' : 'none'
              }}
              title="Configuración"
            >
              <SettingsIcon style={{ fontSize: '22px' }} />
            </button>
          )}

          {/* Alertas - Para ADMIN y ALUMNO */}
          {['ADMIN', 'ALUMNO'].includes(currentUser?.role) && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setShowNotificationsDropdown(!showNotificationsDropdown);
                  setShowHeaderDropdown(false);
                }}
                className="bell-notification-btn"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: '18px',
                  position: 'relative',
                  transition: 'var(--transition-quick)'
                }}
              >
                <NotificationsIcon style={{ fontSize: '24px', color: 'var(--blanco)' }} />
                {userAlerts.length > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      backgroundColor: 'var(--rojo-alerta)',
                      color: 'var(--blanco)',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      borderRadius: '50%',
                      minWidth: '18px',
                      height: '18px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: '0 4px',
                      boxShadow: '0 2px 6px rgba(200,90,63,0.4)',
                      border: '1.5px solid #513B2C'
                    }}
                  >
                    {userAlerts.length}
                  </span>
                )}
              </button>

              {showNotificationsDropdown && (
                <div
                  className="dropdown-menu-header notifications-dropdown"
                  style={{
                    position: 'absolute',
                    top: '46px',
                    right: '-46px',
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid var(--gris-claro)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-clay)',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    width: '280px',
                    zIndex: 120,
                    maxHeight: '360px',
                    overflowY: 'auto',
                    animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--gris-claro)', paddingBottom: '6px', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--gris-oscuro)', fontFamily: 'var(--font-sans)' }}>
                        Notificaciones
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--gris-medio)', fontWeight: 'bold', backgroundColor: 'var(--marron-arcilla-light)', padding: '2px 6px', borderRadius: '10px', fontFamily: 'var(--font-sans)' }}>
                        {userAlerts.length}
                      </span>
                    </div>
                    {userAlerts.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          resolveAllAlertsAction(userAlerts.map(a => a.id));
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--marron-arcilla)',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                          textDecoration: 'underline'
                        }}
                      >
                        Marcar todas leídas ✓
                      </button>
                    )}
                  </div>

                  {userAlerts.length === 0 ? (
                    <div style={{ padding: '16px 8px', textAlign: 'center', color: 'var(--gris-medio)', fontSize: '12px', fontStyle: 'italic', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      No tienes alertas pendientes <AutoAwesomeIcon style={{ fontSize: '16px' }} />
                    </div>
                  ) : (
                    userAlerts.map(alt => (
                      <div
                        key={alt.id}
                        style={{
                          padding: '10px',
                          backgroundColor: 'var(--bg-crema-claro)',
                          borderRadius: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          boxShadow: 'var(--shadow-flat)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 'bold',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: alt.type === 'NO_CREDITS' ? 'var(--rojo-alerta-light)' : alt.type === 'CLAY_LIMIT' ? 'var(--marron-arcilla-light)' : 'var(--amarillo-alerta-light)',
                            color: alt.type === 'NO_CREDITS' ? 'var(--rojo-alerta)' : alt.type === 'CLAY_LIMIT' ? 'var(--marron-arcilla)' : 'var(--amarillo-alerta)',
                            fontFamily: 'var(--font-sans)'
                          }}>
                            {alt.type === 'NO_CREDITS' ? 'Sin Créditos' : alt.type === 'CLAY_LIMIT' ? 'Arcilla' : 'Cupo Crítico'}
                          </span>
                          <span style={{ fontSize: '9px', color: 'var(--gris-medio)', fontFamily: 'var(--font-sans)' }}>
                            {alt.date ? new Date(alt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--gris-oscuro)', margin: 0, lineHeight: '1.45', fontFamily: 'var(--font-sans)', textAlign: 'left' }}>
                          {alt.message}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            resolveAlertAction(alt.id);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--marron-arcilla)',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            textAlign: 'right',
                            padding: '2px 0',
                            alignSelf: 'flex-end',
                            fontFamily: 'var(--font-sans)'
                          }}
                        >
                          Marcar como leída ✓
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <div 
              className="user-avatar-dropdown"
              onClick={() => {
                setShowHeaderDropdown(!showHeaderDropdown);
                setShowNotificationsDropdown(false);
              }}
            >
              <div className="avatar-img-circle" style={{ overflow: 'hidden' }}>
                {currentUser?.avatar_url ? (
                  <img src={currentUser.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  currentUser?.nombre ? currentUser.nombre[0].toUpperCase() : currentUser?.name ? currentUser.name[0].toUpperCase() : 'U'
                )}
              </div>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>∨</span>
            </div>

            {showHeaderDropdown && (
              <div className="dropdown-menu-header">
                <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--gris-claro)', marginBottom: '4px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--gris-oscuro)' }}>
                    {currentUser?.nombre || currentUser?.name}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--gris-medio)', marginTop: '2px' }}>
                    {currentUser?.rol || currentUser?.role}
                  </div>
                </div>
                <button 
                  className="dropdown-item-header" 
                  onClick={() => {
                    setViewOverride('perfil');
                    setShowHeaderDropdown(false);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}
                >
                  <PersonIcon style={{ fontSize: '16px', color: 'var(--gris-oscuro)' }} /> <span>Mi perfil</span>
                </button>
                <button 
                  className="dropdown-item-header" 
                  onClick={() => {
                    logoutAction();
                    setViewOverride(null);
                    setShowHeaderDropdown(false);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <LogoutIcon style={{ fontSize: '16px', color: 'var(--rojo-alerta)' }} /> <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido Dinámico de la Vista */}
      <div className="app-content">
        {renderActiveView()}
      </div>

      {/* Navbar Móvil Flotante Inferior */}
      {!(currentUser?.role === 'ADMIN' && adminTab === 'config') && (
        <div className="mobile-navbar-floating">
          {currentUser?.role === 'ADMIN' && viewOverride === null ? (
          <>
            {/* Resumen */}
            <button
              onClick={() => setAdminTab('dashboard')}
              className={`nav-item ${adminTab === 'dashboard' ? 'active' : ''}`}
              style={{ background: 'transparent', border: 'none' }}
              title="Resumen"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '26px', height: '26px', marginBottom: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </button>

            {/* Alumnas */}
            <button
              onClick={() => setAdminTab('students')}
              className={`nav-item ${adminTab === 'students' ? 'active' : ''}`}
              style={{ background: 'transparent', border: 'none' }}
              title="Alumnas"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '26px', height: '26px', marginBottom: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </button>

            {/* Profesores */}
            <button
              onClick={() => setAdminTab('teachers')}
              className={`nav-item ${adminTab === 'teachers' ? 'active' : ''}`}
              style={{ background: 'transparent', border: 'none' }}
              title="Profesores"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '26px', height: '26px', marginBottom: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6.5m7.5-6.5V17M12 14L3 9.5" />
              </svg>
            </button>

            {/* Turnos */}
            <button
              onClick={() => setAdminTab('classes')}
              className={`nav-item ${adminTab === 'classes' ? 'active' : ''}`}
              style={{ background: 'transparent', border: 'none' }}
              title="Turnos"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '26px', height: '26px', marginBottom: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </button>

            {/* Pagos */}
            <button
              onClick={() => setAdminTab('payments')}
              className={`nav-item ${adminTab === 'payments' ? 'active' : ''}`}
              style={{ background: 'transparent', border: 'none' }}
              title="Pagos"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '26px', height: '26px', marginBottom: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5V6a1.5 1.5 0 011.5-1.5zm10.875 7.5a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0z" />
              </svg>
            </button>
          </>
        ) : currentUser?.role === 'ALUMNO' ? (
          <>
            <button
              onClick={() => setViewOverride('inicio')}
              className={`nav-item ${(!viewOverride || viewOverride === 'inicio') ? 'active' : ''}`}
              style={{ background: 'transparent', border: 'none' }}
            >
              <svg viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <span>Inicio</span>
            </button>

            <button
              onClick={() => setViewOverride('turnos')}
              className={`nav-item ${viewOverride === 'turnos' ? 'active' : ''}`}
              style={{ background: 'transparent', border: 'none' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span>Turnos</span>
            </button>

            <button
              onClick={() => setViewOverride('creditos')}
              className={`nav-item ${viewOverride === 'creditos' ? 'active' : ''}`}
              style={{ background: 'transparent', border: 'none' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5V6a1.5 1.5 0 011.5-1.5zm10.875 7.5a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0z" />
              </svg>
              <span>Créditos</span>
            </button>

            <button
              onClick={() => setViewOverride('perfil')}
              className={`nav-item ${viewOverride === 'perfil' ? 'active' : ''}`}
              style={{ background: 'transparent', border: 'none' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span>Perfil</span>
            </button>

            <button
              onClick={() => {
                logoutAction();
                setViewOverride(null);
                setShowHeaderDropdown(false);
              }}
              className="nav-item"
              style={{ background: 'transparent', border: 'none' }}
            >
              <svg viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              <span>Salir</span>
            </button>
          </>
        ) : currentUser?.role === 'PROFE' ? (
          <>
            <button
              onClick={() => setViewOverride('inicio')}
              className={`nav-item ${(!viewOverride || viewOverride === 'inicio') ? 'active' : ''}`}
              style={{ background: 'transparent', border: 'none' }}
            >
              <svg viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <span>Inicio</span>
            </button>

            <button
              onClick={() => setViewOverride('clases')}
              className={`nav-item ${viewOverride === 'clases' ? 'active' : ''}`}
              style={{ background: 'transparent', border: 'none' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span>Clases</span>
            </button>



            <button
              onClick={() => setViewOverride('alumnos')}
              className={`nav-item ${viewOverride === 'alumnos' ? 'active' : ''}`}
              style={{ background: 'transparent', border: 'none' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <span>Alumnos</span>
            </button>

            <button
              onClick={() => setViewOverride('perfil')}
              className={`nav-item ${viewOverride === 'perfil' ? 'active' : ''}`}
              style={{ background: 'transparent', border: 'none' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span>Perfil</span>
            </button>

            <button
              onClick={() => {
                logoutAction();
                setViewOverride(null);
                setShowHeaderDropdown(false);
              }}
              className="nav-item"
              style={{ background: 'transparent', border: 'none' }}
            >
              <svg viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              <span>Salir</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setViewOverride(null)}
              className={`nav-item ${viewOverride === null ? 'active' : ''}`}
              style={{ background: 'transparent', border: 'none' }}
            >
              <svg viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <span>Inicio</span>
            </button>

            <button
              onClick={() => setViewOverride('config')}
              className={`nav-item ${viewOverride === 'config' ? 'active' : ''}`}
              style={{ background: 'transparent', border: 'none' }}
            >
              <svg viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.99l1.005.831a1.125 1.125 0 01.26 1.43l-1.297 2.247a1.125 1.125 0 01-1.37.491l-1.216-.456c-.356-.133-.751-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.83c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.831a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Soporte</span>
            </button>

            <button
              onClick={() => {
                logoutAction();
                setViewOverride(null);
                setShowHeaderDropdown(false);
              }}
              className="nav-item"
              style={{ background: 'transparent', border: 'none' }}
            >
              <svg viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              <span>Salir</span>
            </button>
          </>
        )}
      </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContentWrapper />
    </AppProvider>
  );
}
