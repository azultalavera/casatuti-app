import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';

export default function TeachersTab({ showFeedback, onEdit }) {
  const { users, createNewUserAction, deleteUserAction } = useApp();
  const teachers = users.filter(u => u.role === 'PROFE');

  const [nombre, setNombre]       = useState('');
  const [apellido, setApellido]   = useState('');
  const [email, setEmail]         = useState('');
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono]   = useState('');
  const [instagram, setInstagram] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [branch, setBranch]       = useState('CENTRO');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!nombre || !apellido || !email || !documento) {
      showFeedback('Por favor, completa Nombre, Apellido, Email y DNI.', 'danger');
      return;
    }
    try {
      const fullName = `${nombre.trim()} ${apellido.trim()}`;
      await createNewUserAction({
        name: fullName, email: email.trim(), role: 'PROFE',
        nro_documento: documento,
        telefono: telefono || null,
        instagram: instagram.trim() || null,
        fecha_nacimiento: birthdate || null,
        sucursal: branch
      });
      alert(`¡Profesor/a "${fullName}" registrado con éxito!`);
      setNombre(''); setApellido(''); setEmail(''); setDocumento('');
      setTelefono(''); setInstagram(''); setBirthdate(''); setBranch('CENTRO');
    } catch (err) {
      showFeedback(err.message, 'danger');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar permanentemente a "${name}" y desvincularlo de todas sus clases?\n\nEsta acción no se puede deshacer.`)) return;
    try {
      await deleteUserAction(id);
      showFeedback(`El profesor "${name}" fue eliminado.`, 'info');
    } catch (err) {
      showFeedback(err.message, 'danger');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Formulario Alta */}
      <div className="clay-card animate-slide-up">
        <h3 style={{ fontSize: '16px', marginBottom: '12px', fontWeight: 600 }}>Dar de Alta Nuevo Profesor</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Nombre *:</label>
              <input type="text" placeholder="Ej. Juan" className="input-tuti" value={nombre} onChange={e => setNombre(e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Apellido *:</label>
              <input type="text" placeholder="Ej. Gomez" className="input-tuti" value={apellido} onChange={e => setApellido(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Email *:</label>
              <input type="email" placeholder="juan@correo.com" className="input-tuti" value={email} onChange={e => setEmail(e.target.value)} />
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
              <input type="text" placeholder="@juan.gomez" className="input-tuti" value={instagram} onChange={e => setInstagram(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Fecha Nacimiento:</label>
              <input type="date" className="input-tuti" value={birthdate} onChange={e => setBirthdate(e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Sucursal Principal:</label>
              <select className="input-tuti" value={branch} onChange={e => setBranch(e.target.value)}>
                <option value="CENTRO">CENTRO</option>
                <option value="ALTO VERDE">ALTO VERDE</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-tuti btn-secondary" style={{ marginTop: '4px', fontSize: '14px', padding: '12px' }}>
            + Registrar Profesor
          </button>
        </form>
      </div>

      {/* Listado */}
      <div>
        <h3 style={{ fontSize: '18px', marginBottom: '12px', fontWeight: 700 }}>Listado de Profesores</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {teachers.length === 0 ? (
            <div className="clay-card" style={{ textAlign: 'center', padding: '24px 20px', color: 'var(--gris-medio)' }}>
              <p style={{ fontStyle: 'italic', fontSize: '13px' }}>No hay profesores registrados.</p>
            </div>
          ) : teachers.map(tc => (
            <div key={tc.id} className="clay-card animate-slide-up" style={{ padding: '16px', borderLeft: '5px solid var(--verde-oliva)', transition: 'all 0.2s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gris-oscuro)', margin: 0 }}>{tc.name}</h4>
                    <span className="badge badge-oliva" style={{ fontSize: '9px', padding: '2px 6px' }}>{tc.sucursal || 'CENTRO'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--gris-medio)' }}>Email: {tc.email}</span>
                    <span style={{ fontSize: '11px', color: 'var(--gris-medio)' }}>DNI: {tc.nro_documento || 'No cargado'}</span>
                    {(tc.telefono || tc.instagram) && (
                      <span style={{ fontSize: '11px', color: 'var(--gris-medio)' }}>
                        {tc.telefono ? `Tel: ${tc.telefono}` : ''}{tc.telefono && tc.instagram ? ' | ' : ''}{tc.instagram ? `IG: ${tc.instagram}` : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <button onClick={() => onEdit(tc)} style={{ backgroundColor: 'var(--bg-crema-claro)', border: '1px solid var(--gris-claro)', color: 'var(--marron-arcilla)', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>✏️ Editar</button>
                  <button onClick={() => handleDelete(tc.id, tc.name)} style={{ backgroundColor: 'var(--rojo-alerta-light)', border: '1px solid transparent', color: 'var(--rojo-alerta)', cursor: 'pointer', padding: '6px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
