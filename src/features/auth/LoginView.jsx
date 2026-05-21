import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

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
      minHeight: '80vh',
      padding: '10px 0'
    }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'var(--marron-arcilla-trans)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '0 auto 16px auto',
          fontSize: '32px',
          border: '2px dashed var(--marron-arcilla)'
        }}>
          🏺
        </div>
        <h1 className="brand-title" style={{ fontSize: '32px', color: 'var(--marron-arcilla-dark)' }}>Casa Tuti</h1>
        <p style={{ color: 'var(--gris-medio)', fontSize: '14px', marginTop: '6px' }}>
          Plataforma de Gestión para Talleres de Cerámica
        </p>
      </div>

      {/* Login Card */}
      <div className="clay-card accent-oliva" style={{ width: '100%' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '18px', textAlign: 'center', fontWeight: 600 }}>
          Iniciar Sesión
        </h2>

        {error && (
          <div className="alert-banner danger" style={{ padding: '12px', fontSize: '13px', marginBottom: '16px' }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-tuti"
              placeholder="nombre@ejemplo.com"
              disabled={isSubmitting}
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
            />
          </div>

          <button
            type="submit"
            className="btn-tuti btn-primary-oliva"
            style={{ marginTop: '8px' }}
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
