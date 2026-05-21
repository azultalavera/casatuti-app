import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';

export default function StudentsTab({ showFeedback, onEdit }) {
  const { users, studentProfiles, createNewUserAction, deleteUserAction, toggleStudentBlockAction } = useApp();
  const students = users.filter(u => u.role === 'ALUMNO');

  const [nombre, setNombre]         = useState('');
  const [apellido, setApellido]     = useState('');
  const [email, setEmail]           = useState('');
  const [documento, setDocumento]   = useState('');
  const [telefono, setTelefono]     = useState('');
  const [instagram, setInstagram]   = useState('');
  const [birthdate, setBirthdate]   = useState('');
  const [branch, setBranch]         = useState('CENTRO');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!nombre || !apellido || !email || !documento) {
      showFeedback('Por favor, completa Nombre, Apellido, Email y DNI.', 'danger');
      return;
    }
    try {
      const fullName = `${nombre.trim()} ${apellido.trim()}`;
      await createNewUserAction({
        name: fullName, email: email.trim(), role: 'ALUMNO',
        nro_documento: documento,
        telefono: telefono || null,
        instagram: instagram.trim() || null,
        fecha_nacimiento: birthdate || null,
        sucursal: branch
      });
      alert(`¡Alumna "${fullName}" registrada con éxito!`);
      setNombre(''); setApellido(''); setEmail(''); setDocumento('');
      setTelefono(''); setInstagram(''); setBirthdate(''); setBranch('CENTRO');
    } catch (err) {
      showFeedback(err.message, 'danger');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar permanentemente a "${name}" y toda su información?\n\nEsta acción no se puede deshacer.`)) return;
    try {
      await deleteUserAction(id);
      showFeedback(`La alumna "${name}" fue eliminada.`, 'info');
    } catch (err) {
      showFeedback(err.message, 'danger');
    }
  };

  const handleToggleBlock = async (id, name, blocked) => {
    const newState = !blocked;
    if (!window.confirm(`¿${newState ? 'Pausar' : 'Reactivar'} la cuenta de "${name}"?`)) return;
    try {
      await toggleStudentBlockAction(id, newState);
      showFeedback(`"${name}" fue ${newState ? 'pausada' : 'reactivada'}.`, 'info');
    } catch (err) {
      showFeedback(err.message, 'danger');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Formulario Alta */}
      <div className="clay-card">
        <h3 style={{ fontSize: '16px', marginBottom: '12px', fontWeight: 600 }}>Dar de Alta Nueva Alumna</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Nombre *:</label>
              <input type="text" placeholder="Ej. Maria" className="input-tuti" value={nombre} onChange={e => setNombre(e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Apellido *:</label>
              <input type="text" placeholder="Ej. Perez" className="input-tuti" value={apellido} onChange={e => setApellido(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Email *:</label>
              <input type="email" placeholder="maria@correo.com" className="input-tuti" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>DNI / Documento *:</label>
              <input type="number" placeholder="12345678" className="input-tuti" value={documento} onChange={e => setDocumento(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Teléfono:</label>
              <input type="number" placeholder="2614000000" className="input-tuti" value={telefono} onChange={e => setTelefono(e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Instagram:</label>
              <input type="text" placeholder="@maria.perez" className="input-tuti" value={instagram} onChange={e => setInstagram(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Fecha Nacimiento:</label>
              <input type="date" className="input-tuti" value={birthdate} onChange={e => setBirthdate(e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Sucursal:</label>
              <select className="input-tuti" value={branch} onChange={e => setBranch(e.target.value)}>
                <option value="CENTRO">CENTRO</option>
                <option value="ALTO VERDE">ALTO VERDE</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-tuti btn-secondary" style={{ marginTop: '4px', fontSize: '14px', padding: '12px' }}>
            + Registrar Alumna
          </button>
        </form>
      </div>

      {/* Listado */}
      <div>
        <h3 style={{ fontSize: '18px', marginBottom: '12px', fontWeight: 700 }}>Listado de Alumnas</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {students.map(st => {
            const profile = studentProfiles.find(p => p.studentId === st.id) || { classCredits: 0, monthlyClayKg: 0, isBlocked: false };
            return (
              <div key={st.id} className="clay-card animate-slide-up" style={{
                padding: '16px', opacity: profile.isBlocked ? 0.75 : 1,
                borderLeft: profile.isBlocked ? '5px solid var(--rojo-alerta)' : '1px solid var(--gris-claro)',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gris-oscuro)', margin: 0 }}>{st.name}</h4>
                      {profile.isBlocked && <span className="badge badge-danger" style={{ fontSize: '9px', padding: '2px 6px' }}>PAUSADA</span>}
                      <span className="badge badge-oliva" style={{ fontSize: '9px', padding: '2px 6px' }}>{st.sucursal || 'CENTRO'}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--gris-medio)' }}>Email: {st.email}</span>
                      <span style={{ fontSize: '11px', color: 'var(--gris-medio)' }}>DNI: {st.nro_documento || 'No cargado'}</span>
                      {(st.telefono || st.instagram) && (
                        <span style={{ fontSize: '11px', color: 'var(--gris-medio)' }}>
                          {st.telefono ? `Tel: ${st.telefono}` : ''}{st.telefono && st.instagram ? ' | ' : ''}{st.instagram ? `IG: ${st.instagram}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span className="badge badge-oliva" style={{ fontSize: '10px' }}>{profile.classCredits} clases</span>
                      <span className={`badge ${profile.monthlyClayKg >= 1.0 ? 'badge-clay' : 'badge-warning'}`} style={{ fontSize: '10px' }}>{profile.monthlyClayKg}kg arcilla</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => onEdit(st)} style={{ backgroundColor: 'var(--bg-crema-claro)', border: '1px solid var(--gris-claro)', color: 'var(--marron-arcilla)', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', transition: 'all 0.15s ease' }}>✏️ Editar</button>
                      <button onClick={() => handleToggleBlock(st.id, st.name, profile.isBlocked)} style={{ backgroundColor: profile.isBlocked ? 'var(--verde-oliva-light)' : 'var(--rojo-alerta-light)', border: '1px solid transparent', color: profile.isBlocked ? 'var(--verde-oliva-dark)' : 'var(--rojo-alerta)', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                        {profile.isBlocked ? '▶ Reactivar' : '⏸ Pausar'}
                      </button>
                      <button onClick={() => handleDelete(st.id, st.name)} style={{ backgroundColor: 'var(--rojo-alerta-light)', border: '1px solid transparent', color: 'var(--rojo-alerta)', cursor: 'pointer', padding: '6px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>🗑</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
