import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Select, MenuItem, Checkbox, ListItemText, OutlinedInput } from '@mui/material';
export default function EditUserModal({ userId, onClose, showFeedback }) {
  const { users, updateUserAction, branches } = useApp();
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
  const [selectedBranches, setSelectedBranches] = useState(
    user?.sucursal ? user.sucursal.split(',').map(s => s.trim().toUpperCase()) : (branches.length > 0 ? [branches[0].name.toUpperCase()] : ['CENTRO'])
  );

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
        sucursal: selectedBranches.join(', ')
      });
      showFeedback(isTeacher ? '¡Profesor/a modificado con éxito!' : '¡Alumna modificada con éxito!', 'info');
      onClose();
    } catch (err) {
      showFeedback(err.message, 'danger');
    }
  };

  return (
    <div className="tuti-modal" style={{
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
            {isTeacher ? 'Modificar Profesor/a' : 'Modificar alumno/a'}
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
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>DNI *</label>
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
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Fecha de nacimiento</label>
            <input type="date" className="input-tuti" value={birthdate} onChange={e => setBirthdate(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Sucursal{isTeacher && 'es'}</label>
            {isTeacher ? (
              <>
                <Select 
                  multiple 
                  displayEmpty
                  value={selectedBranches} 
                  onChange={(e) => {
                    const { value } = e.target;
                    if (value.includes('ALL_SELECT')) {
                      if (selectedBranches.length === branches.length) {
                        setSelectedBranches([]);
                      } else {
                        setSelectedBranches(branches.map(b => b.name.toUpperCase()));
                      }
                      return;
                    }
                    setSelectedBranches(typeof value === 'string' ? value.split(',').map(v => v.trim().toUpperCase()) : value.map(v => v.toUpperCase()));
                  }} 
                  input={<OutlinedInput />}
                  renderValue={(selected) => {
                    if (selected.length === 0) return <span style={{ color: 'var(--gris-medio)' }}>Ninguna seleccionada</span>;
                    if (selected.length === branches.length) return 'Todas seleccionadas';
                    return selected.join(', ');
                  }}
                  sx={{
                    backgroundColor: '#fcfcfc',
                    borderRadius: '12px',
                    minHeight: '44px',
                    fontSize: '14px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--gris-claro)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--gris-medio)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--verde-oliva)', borderWidth: '2px' }
                  }}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 224,
                        width: 250,
                        borderRadius: '16px'
                      },
                    },
                  }}
                >
                  <MenuItem value="ALL_SELECT" style={{ fontSize: '14px' }}>
                    <Checkbox 
                      checked={selectedBranches.length === branches.length && branches.length > 0} 
                      indeterminate={selectedBranches.length > 0 && selectedBranches.length < branches.length} 
                      size="small" 
                      sx={{ color: 'var(--gris-medio)', '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: 'var(--verde-oliva)' } }} 
                    />
                    <ListItemText primary="Seleccionar todas" primaryTypographyProps={{ fontSize: '14px', fontWeight: '700', color: 'var(--gris-oscuro)' }} />
                  </MenuItem>
                  {branches.map(b => (
                    <MenuItem key={b.id} value={b.name.toUpperCase()} style={{ fontSize: '14px' }}>
                      <Checkbox 
                        checked={selectedBranches.indexOf(b.name.toUpperCase()) > -1} 
                        size="small"
                        sx={{ color: 'var(--gris-claro)', '&.Mui-checked': { color: 'var(--verde-oliva)' } }}
                      />
                      <ListItemText primary={b.name} primaryTypographyProps={{ fontSize: '14px', color: 'var(--gris-oscuro)' }} />
                    </MenuItem>
                  ))}
                </Select>
              </>
            ) : (
              <select className="input-tuti" value={selectedBranches[0] || 'CENTRO'} onChange={e => setSelectedBranches([e.target.value.toUpperCase()])} style={{ width: '100%', cursor: 'pointer' }}>
                {branches.map(b => (
                  <option key={b.id} value={b.name.toUpperCase()}>{b.name}</option>
                ))}
              </select>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn-tuti btn-danger-soft" style={{ flex: 1, padding: '12px' }}>Cancelar</button>
            <button type="submit" className="btn-tuti btn-success-soft" style={{ flex: 1, padding: '12px' }}>Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
