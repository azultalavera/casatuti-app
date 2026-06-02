import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import PaletteIcon from '@mui/icons-material/Palette';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import logoH from '../../assets/logoH.png';

export default function LoginView() {
  const { loginAction } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
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
        <img src={logoH} alt="Logo Casa Tuti" style={{ width: '180px', height: 'auto', margin: '0 auto 16px auto', display: 'block' }} />
        <h1 className="brand-title" style={{ fontSize: '32px', color: 'var(--verde-oliva)', fontWeight: 900 }}>Casa Tuti</h1>
        <p style={{ color: 'var(--gris-medio)', fontSize: '14px', marginTop: '6px' }}>
          eslogan de casa tuti
        </p>
      </div>

      {/* Login Card */}
      <div className="stat-card-modern" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--blanco)', borderRadius: '32px', padding: '32px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '18px', textAlign: 'center', fontWeight: 600 }}>
          Iniciar sesión
        </h2>

        {error && (
          <div className="alert-banner danger" style={{ padding: '12px', fontSize: '13px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <WarningAmberIcon style={{ fontSize: '20px' }} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
            <label htmlFor="password">Contraseña</label>
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
      </div>
    </div>
  );
}
