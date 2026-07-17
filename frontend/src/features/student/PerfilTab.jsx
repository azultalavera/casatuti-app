import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import BadgeIcon from '@mui/icons-material/Badge';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import LockIcon from '@mui/icons-material/Lock';

export default function PerfilTab() {
  const { currentUser, updateUserAction, updateUserPasswordAction } = useApp();

  let defaultNombre = currentUser?.nombre || '';
  let defaultApellido = currentUser?.apellido || '';
  if (!defaultNombre && currentUser?.name) {
    const parts = currentUser.name.split(' ');
    defaultNombre = parts[0];
    defaultApellido = parts.slice(1).join(' ');
  }

  const [formData, setFormData] = useState({
    nombre: defaultNombre,
    apellido: defaultApellido,
    nro_documento: currentUser?.nro_documento || '',
    fecha_nacimiento: currentUser?.fecha_nacimiento
      ? String(currentUser.fecha_nacimiento).split('T')[0]
      : '',
    email: currentUser?.email || '',
    telefono: currentUser?.telefono || '',
    instagram: currentUser?.instagram || '',
    avatar_url: currentUser?.avatar_url || '',
  });

  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [passMessage, setPassMessage] = useState(null);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePassInput = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const fileInputRef = useRef(null);

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Url = reader.result;
        setFormData(prev => ({ ...prev, avatar_url: base64Url }));
        
        // Auto-guardar para que se refleje inmediatamente en el avatar superior
        try {
          await updateUserAction(currentUser.id, { ...formData, avatar_url: base64Url });
          setMessage({ type: 'success', text: '¡Foto de perfil actualizada!' });
          setTimeout(() => setMessage(null), 3000);
        } catch (err) {
          setMessage({ type: 'error', text: err.message || 'Error al actualizar la foto.' });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await updateUserAction(currentUser.id, formData);
      setMessage({ type: 'success', text: '¡Datos actualizados con éxito!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error al actualizar.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    setPassLoading(true);
    setPassMessage(null);
    try {
      await updateUserPasswordAction(currentUser.id, passwordData.currentPassword, passwordData.newPassword);
      setPassMessage({ type: 'success', text: '¡Contraseña actualizada!' });
      setPasswordData({ currentPassword: '', newPassword: '' });
      setTimeout(() => setPassMessage(null), 3000);
    } catch (err) {
      setPassMessage({ type: 'error', text: err.message || 'Error al cambiar la contraseña.' });
    } finally {
      setPassLoading(false);
    }
  };

  const avatarLetter = formData.nombre ? formData.nombre[0].toUpperCase() : (currentUser?.name?.[0]?.toUpperCase() || 'U');

  // Input styling properties matching the screenshot style:
  // - Background: #F4F6F4 (very light greyish green)
  // - Border: none, rounded: 16px, padding: 12px 16px
  const inputStyle = {
    backgroundColor: '#F3F6F4',
    border: 'none',
    borderRadius: '16px',
    padding: '14px 18px',
    fontSize: '14px',
    color: '#2E4A3F',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    fontWeight: '500',
    fontFamily: 'inherit'
  };

  const labelStyle = {
    fontSize: '12px',
    fontWeight: '600',
    color: '#8C9B96',
    marginBottom: '8px',
    display: 'block'
  };

  const cardStyle = {
    padding: '28px 24px',
    borderRadius: '32px',
    backgroundColor: 'var(--blanco)',
    boxShadow: '0 8px 30px rgba(0,0,0,0.025)',
    marginBottom: '20px'
  };

  const sectionHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid #ECEFEC'
  };

  const iconContainerStyle = {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#EBF1ED',
    color: '#2E4A3F',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0
  };

  const headerTitleStyle = {
    fontSize: '14px',
    margin: 0,
    fontWeight: '800',
    color: '#0F3B32',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '20px' }}>

      {/* ── Top Header Avatar Card ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '36px 24px 28px 24px',
        borderRadius: '32px',
        backgroundColor: 'var(--blanco)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.025)',
        marginBottom: '4px'
      }}>
        {/* Avatar wrap for absolute overlap of camera button */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <div style={{
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            backgroundColor: '#E5EAE6',
            color: '#2E4A3F',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '36px',
            fontWeight: 'bold',
            fontFamily: 'var(--font-serif)',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
          }}>
            {formData.avatar_url
              ? <img src={formData.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : avatarLetter
            }
          </div>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#2E4A3F',
              color: 'white',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              cursor: 'pointer'
            }}
          >
            <CameraAltIcon style={{ fontSize: '15px' }} />
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleAvatarUpload}
          />
        </div>

        <h2 style={{ fontSize: '20px', margin: '0 0 6px 0', fontWeight: '800', color: '#0F3B32', fontFamily: 'inherit' }}>
          {formData.nombre} {formData.apellido}
        </h2>

        <span style={{
          backgroundColor: '#EBF1ED',
          color: '#2E4A3F',
          padding: '6px 18px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '1px',
          textTransform: 'uppercase'
        }}>
          {currentUser?.role || 'ALUMNO'}
        </span>
      </div>

      {/* ── Datos personales Card ── */}
      <div style={cardStyle}>
        <div style={sectionHeaderStyle}>
          <div style={iconContainerStyle}>
            <BadgeIcon style={{ fontSize: '18px' }} />
          </div>
          <h3 style={headerTitleStyle}>Datos personales</h3>
        </div>

        {message && (
          <div className={`alert-banner ${message.type === 'error' ? 'danger' : 'success'}`} style={{ position: 'relative', top: 'auto', left: 'auto', transform: 'none', width: '100%', animation: 'none', marginBottom: '20px', zIndex: 1 }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmitProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label style={labelStyle}>Nombre</label>
            <input type="text" name="nombre" style={inputStyle} value={formData.nombre} onChange={handleInput} required />
          </div>
          <div className="form-group">
            <label style={labelStyle}>Apellido</label>
            <input type="text" name="apellido" style={inputStyle} value={formData.apellido} onChange={handleInput} />
          </div>

          <div className="form-group">
            <label style={labelStyle}>DNI</label>
            <input type="number" name="nro_documento" style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} value={formData.nro_documento} disabled />
          </div>
          <div className="form-group">
            <label style={labelStyle}>Fecha de nacimiento</label>
            <input type="date" name="fecha_nacimiento" style={inputStyle} value={formData.fecha_nacimiento} onChange={handleInput} />
          </div>

          <div style={sectionHeaderStyle}>
            <div style={iconContainerStyle}>
              <ContactMailIcon style={{ fontSize: '18px' }} />
            </div>
            <h3 style={headerTitleStyle}>Contacto</h3>
          </div>

          <div className="form-group">
            <label style={labelStyle}>Correo electrónico</label>
            <input type="email" name="email" style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} value={formData.email} disabled />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label style={labelStyle}>Teléfono</label>
              <input type="tel" name="telefono" style={inputStyle} value={formData.telefono} onChange={handleInput} />
            </div>
            <div className="form-group">
              <label style={labelStyle}>Instagram (Usuario)</label>
              <input type="text" name="instagram" style={inputStyle} placeholder="@usuario" value={formData.instagram} onChange={handleInput} />
            </div>
          </div>

          <button type="submit" className="btn-tuti btn-primary-clay" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? 'Guardando...' : 'Guardar mis datos'}
          </button>
        </form>
      </div>

      {/* ── Seguridad / Contraseña Card ── */}
      <div style={cardStyle}>
        <div style={sectionHeaderStyle}>
          <div style={iconContainerStyle}>
            <LockIcon style={{ fontSize: '18px' }} />
          </div>
          <h3 style={headerTitleStyle}>Seguridad</h3>
        </div>

        {passMessage && (
          <div className={`alert-banner ${passMessage.type === 'error' ? 'danger' : 'success'}`} style={{ position: 'relative', top: 'auto', left: 'auto', transform: 'none', width: '100%', animation: 'none', marginBottom: '20px', zIndex: 1 }}>
            {passMessage.text}
          </div>
        )}

        <form onSubmit={handleSubmitPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label style={labelStyle}>Contraseña actual</label>
            <input type="password" name="currentPassword" style={inputStyle} value={passwordData.currentPassword} onChange={handlePassInput} />
            <p style={{ fontSize: '11px', color: '#8C9B96', marginTop: '6px', marginLeft: '4px' }}>Déjalo en blanco si usas la contraseña por defecto (tuti123).</p>
          </div>
          <div className="form-group">
            <label style={labelStyle}>Nueva contraseña</label>
            <input type="password" name="newPassword" style={inputStyle} value={passwordData.newPassword} onChange={handlePassInput} required />
          </div>
          <button
            type="submit"
            className="btn-tuti"
            disabled={passLoading || !passwordData.newPassword}
            style={{ backgroundColor: 'var(--gris-oscuro)', color: 'white', border: 'none', marginTop: '8px' }}
          >
            {passLoading ? 'Actualizando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>

    </div>
  );
}
