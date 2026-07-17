import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import BadgeIcon from '@mui/icons-material/Badge';

export default function ProfileView() {
  const { currentUser, updateUserAction, updateUserPasswordAction } = useApp();
  
  // Extraer nombre y apellido de "name" si no vienen explícitos
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
    fecha_nacimiento: currentUser?.fecha_nacimiento || '',
    email: currentUser?.email || '',
    telefono: currentUser?.telefono || '',
    instagram: currentUser?.instagram || '',
    avatar_url: currentUser?.avatar_url || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [passMessage, setPassMessage] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
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
      setPassMessage({ type: 'success', text: '¡Contraseña actualizada con éxito!' });
      setPasswordData({ currentPassword: '', newPassword: '' });
      setTimeout(() => setPassMessage(null), 3000);
    } catch (err) {
      setPassMessage({ type: 'error', text: err.message || 'Error al cambiar la contraseña.' });
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="animate-slide-up" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', paddingBottom: '80px' }}>
      
      {/* HEADER AVATAR */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
        <div style={{ 
          width: '90px', 
          height: '90px', 
          borderRadius: '50%', 
          backgroundColor: 'var(--verde-oliva)', 
          color: 'white',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '36px',
          fontWeight: 'bold',
          marginBottom: '10px',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {formData.avatar_url ? (
            <img src={formData.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            formData.nombre ? formData.nombre[0].toUpperCase() : 'U'
          )}
        </div>
        <h2 style={{ fontSize: '24px', margin: '0', color: 'var(--gris-oscuro)' }}>Mi perfil</h2>
        <p style={{ fontSize: '14px', color: 'var(--gris-medio)', margin: '4px 0 0 0' }}>{currentUser?.rol || 'ALUMNO'}</p>
      </div>

      {/* DATOS DE PERFIL */}
      <div className="clay-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--gris-claro)', paddingBottom: '10px' }}>
          <BadgeIcon style={{ color: 'var(--marron-arcilla)' }} />
          <h3 style={{ fontSize: '18px', margin: 0, color: 'var(--gris-oscuro)' }}>Datos personales</h3>
        </div>

        {message && (
          <div className={`alert-banner ${message.type === 'error' ? 'danger' : 'success'}`} style={{ position: 'relative', top: 'auto', left: 'auto', transform: 'none', width: '100%', animation: 'none', marginBottom: '20px', zIndex: 1 }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmitProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold' }}>Nombre</label>
              <input 
                type="text" 
                name="nombre"
                className="form-input" 
                value={formData.nombre} 
                onChange={handleInputChange} 
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold' }}>Apellido</label>
              <input 
                type="text" 
                name="apellido"
                className="form-input" 
                value={formData.apellido} 
                onChange={handleInputChange} 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold' }}>DNI / Pasaporte</label>
              <input 
                type="number" 
                name="nro_documento"
                className="form-input" 
                value={formData.nro_documento} 
                onChange={handleInputChange} 
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold' }}>Fecha de nacimiento</label>
              <input 
                type="date" 
                name="fecha_nacimiento"
                className="form-input" 
                value={formData.fecha_nacimiento} 
                onChange={handleInputChange} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', marginBottom: '6px', borderBottom: '1px solid var(--gris-claro)', paddingBottom: '10px' }}>
            <ContactMailIcon style={{ color: 'var(--marron-arcilla)' }} />
            <h3 style={{ fontSize: '18px', margin: 0, color: 'var(--gris-oscuro)' }}>Contacto</h3>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold' }}>Correo electrónico</label>
            <input 
              type="email" 
              name="email"
              className="form-input" 
              value={formData.email} 
              onChange={handleInputChange} 
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold' }}>Teléfono</label>
              <input 
                type="tel" 
                name="telefono"
                className="form-input" 
                value={formData.telefono} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold' }}>Instagram (Usuario)</label>
              <input 
                type="text" 
                name="instagram"
                className="form-input" 
                placeholder="@usuario"
                value={formData.instagram} 
                onChange={handleInputChange} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', marginBottom: '6px', borderBottom: '1px solid var(--gris-claro)', paddingBottom: '10px' }}>
            <CameraAltIcon style={{ color: 'var(--marron-arcilla)' }} />
            <h3 style={{ fontSize: '18px', margin: 0, color: 'var(--gris-oscuro)' }}>Foto de perfil</h3>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold' }}>URL de la imagen (opcional)</label>
            <input 
              type="url" 
              name="avatar_url"
              className="form-input" 
              placeholder="https://ejemplo.com/mifoto.jpg"
              value={formData.avatar_url} 
              onChange={handleInputChange} 
            />
            <p style={{ fontSize: '11px', color: 'var(--gris-medio)', marginTop: '4px' }}>Pega el enlace de una imagen para usarla como tu foto de perfil.</p>
          </div>

          <button 
            type="submit" 
            className="btn-tuti btn-primary-clay" 
            disabled={loading}
            style={{ marginTop: '16px' }}
          >
            {loading ? 'Guardando...' : 'Guardar mis datos'}
          </button>
        </form>
      </div>

      {/* SEGURIDAD / CONTRASEÑA */}
      <div className="clay-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--gris-claro)', paddingBottom: '10px' }}>
          <LockIcon style={{ color: 'var(--marron-arcilla)' }} />
          <h3 style={{ fontSize: '18px', margin: 0, color: 'var(--gris-oscuro)' }}>Seguridad</h3>
        </div>

        {passMessage && (
          <div className={`alert-banner ${passMessage.type === 'error' ? 'danger' : 'success'}`} style={{ position: 'relative', top: 'auto', left: 'auto', transform: 'none', width: '100%', animation: 'none', marginBottom: '20px', zIndex: 1 }}>
            {passMessage.text}
          </div>
        )}

        <form onSubmit={handleSubmitPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold' }}>Contraseña actual</label>
            <input 
              type="password" 
              name="currentPassword"
              className="form-input" 
              value={passwordData.currentPassword} 
              onChange={handlePasswordChange} 
            />
            <p style={{ fontSize: '11px', color: 'var(--gris-medio)', marginTop: '4px' }}>Déjalo en blanco si usas la contraseña por defecto (tuti123).</p>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 'bold' }}>Nueva contraseña</label>
            <input 
              type="password" 
              name="newPassword"
              className="form-input" 
              value={passwordData.newPassword} 
              onChange={handlePasswordChange} 
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-tuti" 
            disabled={passLoading || !passwordData.newPassword}
            style={{ marginTop: '10px', backgroundColor: 'var(--gris-oscuro)', color: 'white', border: 'none' }}
          >
            {passLoading ? 'Actualizando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>

    </div>
  );
}
