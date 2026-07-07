import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import PaletteIcon from '@mui/icons-material/Palette';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import logoH from '../../assets/logoH.png';

export default function LoginView() {
  const { loginAction, forgotPasswordAction } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [view, setView] = useState('login'); // 'login', 'forgot', 'success'

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await loginAction(email, password);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor ingresa tu correo electrónico.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await forgotPasswordAction(email);
      setView('success');
    } catch (err) {
      setError(err.message || 'Error al recuperar contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-slide-up" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '24px',
      backgroundColor: 'var(--bg-crema)',
      margin: '-16px' /* to override potential default padding in parent if any, though likely not needed */
    }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <img src={logoH} alt="Logo Casa tuti" style={{ width: '180px', height: 'auto', margin: '0 auto 16px auto', display: 'block' }} />
        <h1 className="brand-title" style={{ fontSize: '32px', color: 'var(--verde-oliva)', fontWeight: 900 }}>Casa tuti</h1>
        <p style={{ color: 'var(--gris-medio)', fontSize: '14px', marginTop: '6px' }}>
          Espacio Creativo
        </p>
      </div>

      {/* Login Card */}
      <div className="stat-card-modern" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--blanco)', borderRadius: '32px', padding: '32px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
        {view === 'login' && (
          <>
            <h2 style={{ fontSize: '20px', marginBottom: '18px', textAlign: 'center', fontWeight: 600 }}>
              Iniciar sesión
            </h2>

            {error && (
              <div className="alert-banner danger" style={{ padding: '12px', fontSize: '13px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <WarningAmberIcon style={{ fontSize: '20px' }} />
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="email">Correo electrónico</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-tuti"
                  placeholder="nombre@ejemplo.com"
                  disabled={isSubmitting}
                  style={{ paddingLeft: '20px', borderRadius: '20px', backgroundColor: 'var(--bg-crema-claro)', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="password">Contraseña</label>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-tuti"
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  style={{ paddingLeft: '20px', borderRadius: '20px', backgroundColor: 'var(--bg-crema-claro)', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                />
                <div style={{ textAlign: 'right', marginTop: '6px' }}>
                  <button 
                    type="button" 
                    onClick={() => { setView('forgot'); setError(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--verde-oliva)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-tuti"
                style={{ marginTop: '8px', padding: '16px', borderRadius: '24px', backgroundColor: 'var(--verde-oliva)', color: 'var(--blanco)', fontSize: '16px', fontWeight: 800 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="tuti-spinner" style={{ width: '16px', height: '16px', borderTopColor: 'var(--blanco)' }}></div>
                    Ingresando...
                  </>
                ) : (
                  'Ingresar'
                )}
              </button>
            </form>
          </>
        )}

        {view === 'forgot' && (
          <>
            <h2 style={{ fontSize: '20px', marginBottom: '10px', textAlign: 'center', fontWeight: 600 }}>
              Recuperar contraseña
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--gris-medio)', textAlign: 'center', marginBottom: '18px' }}>
              Ingresa el correo electrónico asociado a tu cuenta para recibir tu nueva clave temporal.
            </p>

            {error && (
              <div className="alert-banner danger" style={{ padding: '12px', fontSize: '13px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <WarningAmberIcon style={{ fontSize: '20px' }} />
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="emailForgot">Correo electrónico</label>
                <input
                  id="emailForgot"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-tuti"
                  placeholder="nombre@ejemplo.com"
                  disabled={isSubmitting}
                  style={{ paddingLeft: '20px', borderRadius: '20px', backgroundColor: 'var(--bg-crema-claro)', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                />
              </div>

              <button
                type="submit"
                className="btn-tuti"
                style={{ marginTop: '8px', padding: '16px', borderRadius: '24px', backgroundColor: 'var(--verde-oliva)', color: 'var(--blanco)', fontSize: '16px', fontWeight: 800 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="tuti-spinner" style={{ width: '16px', height: '16px', borderTopColor: 'var(--blanco)' }}></div>
                    Enviando...
                  </>
                ) : (
                  'Continuar'
                )}
              </button>
              
              <div style={{ textAlign: 'center', marginTop: '4px' }}>
                <button 
                  type="button" 
                  onClick={() => { setView('login'); setError(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--gris-medio)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', padding: '8px' }}
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </form>
          </>
        )}

        {view === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#EAF2E8', color: 'var(--verde-oliva)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <svg style={{ width: '32px', height: '32px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 style={{ fontSize: '20px', marginBottom: '10px', fontWeight: 600 }}>
              ¡Correo enviado!
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--gris-medio)', marginBottom: '24px' }}>
              Te hemos enviado un correo con tu nueva clave temporal. Revisa tu bandeja de entrada (y tu carpeta de spam).
            </p>
            <button
              onClick={() => { setView('login'); setEmail(''); setPassword(''); }}
              className="btn-tuti"
              style={{ padding: '16px', borderRadius: '24px', backgroundColor: 'var(--verde-oliva)', color: 'var(--blanco)', fontSize: '16px', fontWeight: 800, width: '100%' }}
            >
              Volver a iniciar sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
