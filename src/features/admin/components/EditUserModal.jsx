import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';

export default function EditUserModal({ userId, onClose, showFeedback }) {
  const { users, updateUserAction } = useApp();
  const user = users.find(u => u.id === userId);
  const isTeacher = user?.role === 'PROFE';

  const nameParts = (user?.name || '').trim().split(' ');

  const [nombre, setNombre]       = useState(nameParts[0] || '');
  const [apellido, setApellido]   = useState(nameParts.slice(1).join(' ') || '');
  const [email, setEmail]         = useState(user?.email || '');
  const [documento, setDocumento] = useState(user?.nro_documento || '');
  const [telefono, setTelefono]   = useState(user?.telefono || '');
  const [instagram, setInstagram] = useState(user?.instagram || '');
  const [birthdate, setBirthdate] = useState((user?.fecha_nacimiento || '').split('T')[0] || '');
  const [branch, setBranch]       = useState(user?.sucursal || 'CENTRO');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !apellido || !email || !documento) {
      showFeedback('Por favor, completa Nombre, Apellido, Email y DNI.', 'danger');
      return;
    }
    try {
      const fullName = `${nombre.trim()} ${apellido.trim()}`;
      await updateUserAction(userId, {
        nombre: nombre.trim(), apellido: apellido.trim(), name: fullName,
        email: email.trim(), nro_documento: documento,
        telefono: telefono || null,
        instagram: instagram.trim() || null,
        fecha_nacimiento: birthdate || null,
        sucursal: branch
      });
      showFeedback(isTeacher ? '¡Profesor/a modificado con éxito!' : '¡Alumna modificada con éxito!', 'info');
      onClose();
    } catch (err) {
      showFeedback(err.message, 'danger');
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(107, 79, 59, 0.4)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 999, padding: '20px'
    }}>
      <div className="clay-card animate-slide-up" style={{
        width: '100%', maxWidth: '500px', padding: '24px',
        backgroundColor: 'var(--blanco)', boxShadow: 'var(--shadow-clay)',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-serif)', margin: 0 }}>
            {isTeacher ? 'Modificar Profesor/a' : 'Modificar Alumna'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--gris-medio)' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Nombre *</label>
            <input type="text" className="input-tuti" value={nombre} onChange={e => setNombre(e.target.value)} required style={{ width: '100%' }} />
          </div>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Apellido *</label>
            <input type="text" className="input-tuti" value={apellido} onChange={e => setApellido(e.target.value)} required style={{ width: '100%' }} />
          </div>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Email *</label>
            <input type="email" className="input-tuti" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%' }} />
          </div>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>DNI / Documento *</label>
            <input type="number" className="input-tuti" value={documento} onChange={e => setDocumento(e.target.value)} required style={{ width: '100%' }} />
          </div>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Teléfono</label>
            <input type="number" className="input-tuti" value={telefono} onChange={e => setTelefono(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Instagram</label>
            <input type="text" className="input-tuti" value={instagram} onChange={e => setInstagram(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Fecha Nacimiento</label>
            <input type="date" className="input-tuti" value={birthdate} onChange={e => setBirthdate(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Sucursal</label>
            <select className="input-tuti" value={branch} onChange={e => setBranch(e.target.value)} style={{ width: '100%', cursor: 'pointer' }}>
              <option value="CENTRO">CENTRO</option>
              <option value="ALTO VERDE">ALTO VERDE</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn-tuti btn-secondary" style={{ flex: 1, padding: '12px' }}>Cancelar</button>
            <button type="submit" className="btn-tuti btn-primary-clay" style={{ flex: 1, padding: '12px' }}>Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
}
