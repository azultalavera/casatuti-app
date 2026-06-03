import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import LocationOnIcon from '@mui/icons-material/LocationOn';

export default function TeachersTab({ showFeedback, onEdit }) {
  const { users, createNewUserAction, deleteUserAction, classes, bulkAssignClasses, branches } = useApp();
  const teachers = users.filter(u => u.role === 'PROFE');

  const [mode, setMode] = useState('list'); // 'list' | 'create'
  const [expandedTeacherId, setExpandedTeacherId] = useState(null);
  
  // States para popup de asignación múltiple de turnos
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignModalTeacher, setAssignModalTeacher] = useState(null);
  const [selectedTurnIds, setSelectedTurnIds] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ACTIVE'); // 'ACTIVE' | 'INACTIVE'

  // Persistencia de bloqueados localmente
  const [blockedTeacherIds, setBlockedTeacherIds] = useState(() => {
    try {
      const saved = localStorage.getItem('blocked_teachers');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const persistBlockedTeachers = (newIds) => {
    setBlockedTeacherIds(newIds);
    try {
      localStorage.setItem('blocked_teachers', JSON.stringify(newIds));
    } catch (e) {}
  };

  const handleToggleBlock = (teacherId, name, currentlyBlocked) => {
    const actionText = currentlyBlocked ? 'reactivar' : 'pausar';
    if (!window.confirm(`¿Seguro que deseas ${actionText} al profesor/a "${name}"?`)) return;
    
    let newIds;
    if (currentlyBlocked) {
      newIds = blockedTeacherIds.filter(id => id !== teacherId);
      showFeedback(`El profesor/a "${name}" ha sido reactivado con éxito.`, 'success');
    } else {
      newIds = [...blockedTeacherIds, teacherId];
      showFeedback(`El profesor/a "${name}" ha sido pausado con éxito.`, 'warning');
    }
    persistBlockedTeachers(newIds);
  };

  const [nombre, setNombre]       = useState('');
  const [apellido, setApellido]   = useState('');
  const [email, setEmail]         = useState('');
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono]   = useState('');
  const [instagram, setInstagram] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [branch, setBranch] = useState(branches.length > 0 ? branches[0].name : 'CENTRO');

  // Filtrado de Profesores
  const filteredTeachers = teachers.filter(tc => {
    const isBlocked = blockedTeacherIds.includes(tc.id);
    const matchesSearch = tc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tc.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = selectedBranch === 'ALL' || (tc.sucursal || 'CENTRO').toUpperCase() === selectedBranch;
    const matchesStatus = selectedStatus === 'ACTIVE' ? !isBlocked : isBlocked;
    return matchesSearch && matchesBranch && matchesStatus;
  });

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
      setTelefono(''); setInstagram(''); setBirthdate(''); setBranch(branches.length > 0 ? branches[0].name : 'CENTRO');
      setMode('list'); // Regresa al listado después de crear
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

  const getInitials = (name) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    return parts.map(p => p[0]).join('').toUpperCase().substring(0, 3);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Vista de Registro / Alta */}
      {mode === 'create' && (
        <div className="clay-card animate-slide-up" style={{ padding: '24px' }}>
          {/* Botón de volver */}
          <button
            onClick={() => setMode('list')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              background: 'transparent',
              fontSize: '12px',
              fontWeight: '800',
              color: 'var(--gris-medio)',
              cursor: 'pointer',
              padding: '0 0 16px 0',
              fontFamily: 'Outfit, sans-serif'
            }}
          >
            ← Volver al Listado
          </button>

          <h3 style={{ fontSize: '18px', marginBottom: '18px', fontWeight: 700, color: 'var(--gris-oscuro)' }}>Dar de Alta Nuevo Profesor</h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Nombre *</label>
              <input type="text" placeholder="Ej. Juan" className="input-tuti" value={nombre} onChange={e => setNombre(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Apellido *</label>
              <input type="text" placeholder="Ej. Gomez" className="input-tuti" value={apellido} onChange={e => setApellido(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Email *</label>
              <input type="email" placeholder="juan@correo.com" className="input-tuti" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>DNI / Documento *</label>
              <input type="number" placeholder="12345678" className="input-tuti" value={documento} onChange={e => setDocumento(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Teléfono</label>
              <input type="number" placeholder="2614000000" className="input-tuti" value={telefono} onChange={e => setTelefono(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Instagram</label>
              <input type="text" placeholder="@juan.gomez" className="input-tuti" value={instagram} onChange={e => setInstagram(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Fecha Nacimiento</label>
              <input type="date" className="input-tuti" value={birthdate} onChange={e => setBirthdate(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Sucursal Principal</label>
              <select className="input-tuti" value={branch} onChange={e => setBranch(e.target.value)} style={{ width: '100%', cursor: 'pointer' }}>
                {branches.map(b => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-tuti btn-success-soft" style={{ marginTop: '8px', fontSize: '14px', padding: '12px' }}>
              + Registrar Profesor
            </button>
          </form>
        </div>
      )}

      {/* Vista de Listado */}
      {mode === 'list' && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Cabecera con Contador */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--gris-oscuro)', margin: 0, fontFamily: 'Geist, Outfit, sans-serif', letterSpacing: '-0.8px' }}>Profesores</h2>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--gris-medio)', backgroundColor: 'rgba(0,0,0,0.05)', padding: '4px 10px', borderRadius: '12px' }}>
              {filteredTeachers.length} {filteredTeachers.length === 1 ? 'profesor' : 'profesores'}
            </span>
          </div>

          {/* Bloque de Filtros y Búsqueda Premium */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--gris-medio)' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                className="input-tuti"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', paddingLeft: '40px', fontSize: '13px', backgroundColor: '#fcfcfc', border: 'none', borderRadius: '20px', height: '42px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Sucursales */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--gris-medio)', marginRight: '4px' }}>Sucursal:</span>
                {[{ id: 'all', name: 'ALL' }, ...branches].map(br => {
                  const isActive = selectedBranch === br.name;
                  return (
                    <button
                      key={br.id}
                      onClick={() => setSelectedBranch(br.name)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '16px',
                        border: isActive ? 'none' : '1px solid var(--gris-claro)',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        backgroundColor: isActive ? 'rgba(69, 95, 62, 0.12)' : 'var(--blanco)',
                        color: isActive ? 'var(--verde-oliva)' : 'var(--gris-medio)',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {br.name === 'ALL' ? 'Todas' : br.name}
                    </button>
                  );
                })}
              </div>

              {/* Estado Switch (Mockup) */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--gris-medio)', marginRight: '14px' }}>Estado:</span>
                
                {/* Switch Deslizable Container */}
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  width: '180px',
                  height: '34px',
                  backgroundColor: 'rgba(0,0,0,0.04)',
                  borderRadius: '20px',
                  padding: '2px',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}>
                  {/* Slider Backdrop */}
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    left: selectedStatus === 'ACTIVE' ? '2px' : 'calc(50% + 1px)',
                    width: 'calc(50% - 3px)',
                    height: '30px',
                    backgroundColor: 'var(--blanco)',
                    borderRadius: '18px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                    transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                    zIndex: 1
                  }} />

                  {/* Opción Activas */}
                  <div 
                    onClick={() => setSelectedStatus('ACTIVE')}
                    style={{
                      flex: 1,
                      zIndex: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: '800',
                      color: selectedStatus === 'ACTIVE' ? 'var(--verde-oliva)' : 'var(--gris-medio)',
                      transition: 'color 0.2s ease'
                    }}
                  >
                    Activas
                  </div>

                  {/* Opción Inactivas */}
                  <div 
                    onClick={() => setSelectedStatus('INACTIVE')}
                    style={{
                      flex: 1,
                      zIndex: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: '800',
                      color: selectedStatus === 'INACTIVE' ? 'var(--marron-arcilla)' : 'var(--gris-medio)',
                      transition: 'color 0.2s ease'
                    }}
                  >
                    Inactivas
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredTeachers.length === 0 ? (
              <div className="stat-card-modern" style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--gris-medio)' }}>
                <p style={{ fontStyle: 'italic', fontSize: '13px' }}>No hay profesores registrados.</p>
              </div>
            ) : (
              filteredTeachers.map(tc => {
                const initials = getInitials(tc.name);
                const isExpanded = expandedTeacherId === tc.id;
                const isBlocked = blockedTeacherIds.includes(tc.id);

                return (
                  <div
                    key={tc.id}
                    onClick={() => setExpandedTeacherId(isExpanded ? null : tc.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '20px',
                      borderRadius: '24px',
                      backgroundColor: 'var(--blanco)',
                      opacity: isBlocked ? 0.6 : 1,
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease',
                      border: 'none',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
                    }}
                  >
                    {/* Fila Principal */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                      {/* Avatar */}
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--bg-crema)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        color: 'var(--marron-arcilla)',
                        fontSize: '15px',
                        flexShrink: 0
                      }}>
                        {initials}
                      </div>

                      {/* Info de Profesor */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gris-oscuro)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tc.name}
                          </h4>
                          {isBlocked && (
                            <span style={{ fontSize: '9px', fontWeight: '800', backgroundColor: 'var(--rojo-alerta-light)', color: 'var(--rojo-alerta)', padding: '2px 8px', borderRadius: '8px' }}>
                              INACTIVA
                            </span>
                          )}
                        </div>

                          {/* Removed Email and Specialty to make it cleaner */}
                        </div>

                      {/* Icono de expansión */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <svg
                          style={{
                            width: '16px',
                            height: '16px',
                            color: 'var(--gris-medio)',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.25s ease',
                            flexShrink: 0
                          }}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </div>

                      {/* Bloque Desplegable de Acciones y Detalles */}
                      {isExpanded && (
                        <div
                          onClick={e => e.stopPropagation()}
                          style={{
                            width: '100%',
                            marginTop: '16px',
                            borderTop: '1px solid rgba(0,0,0,0.04)',
                            paddingTop: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            animation: 'fadeInAcc 0.2s ease-out'
                          }}
                        >
                          {/* Detalles Extras */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px', color: 'var(--gris-medio)' }}>{tc.email}</span>
                            <span style={{
                              fontSize: '9px', fontWeight: '800', letterSpacing: '0.4px', padding: '2px 8px', borderRadius: '12px',
                              backgroundColor: 'var(--bg-crema-claro)', color: 'var(--marron-arcilla)'
                            }}>
                              CERÁMICA
                            </span>
                          </div>
                        {/* Botón Asignar Turnos (Principal) */}
                        <button
                          type="button"
                          onClick={() => {
                            setAssignModalTeacher(tc);
                            setSelectedTurnIds(classes.filter(c => c.teacher_id === tc.id).map(c => c.id));
                            setShowAssignModal(true);
                          }}
                          style={{
                            width: '100%', padding: '12px', fontSize: '12px', fontWeight: '800',
                            borderRadius: '16px', backgroundColor: 'var(--bg-crema-claro)', color: 'var(--marron-arcilla)',
                            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                          }}
                        >
                          <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Asignar Turnos
                        </button>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          {/* 1. Pausar */}
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              await handleToggleBlock(tc.id, tc.name, isBlocked);
                            }}
                            style={{
                              flex: 1, padding: '12px 0', borderRadius: '16px', border: 'none',
                              backgroundColor: isBlocked ? '#EAF2E8' : 'var(--bg-crema)',
                              color: isBlocked ? 'var(--verde-oliva)' : 'var(--marron-arcilla)',
                              fontSize: '12px', fontWeight: 800, cursor: 'pointer', transition: 'opacity 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.opacity = 0.8}
                            onMouseOut={e => e.currentTarget.style.opacity = 1}
                          >
                            {isBlocked ? 'Reactivar' : 'Pausar'}
                          </button>

                          {/* 2. Editar */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(tc);
                            }}
                            style={{
                              flex: 1, padding: '12px 0', borderRadius: '16px', border: 'none',
                              backgroundColor: 'var(--gris-oscuro)', color: 'var(--blanco)',
                              fontSize: '12px', fontWeight: 800, cursor: 'pointer', transition: 'opacity 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.opacity = 0.8}
                            onMouseOut={e => e.currentTarget.style.opacity = 1}
                          >
                            Editar
                          </button>

                          {/* 3. Eliminar */}
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              await handleDelete(tc.id, tc.name);
                            }}
                            style={{
                              flex: 1, padding: '12px 0', borderRadius: '16px', border: 'none',
                              backgroundColor: '#FFF5F5', color: '#E53E3E',
                              fontSize: '12px', fontWeight: 800, cursor: 'pointer', transition: 'opacity 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.opacity = 0.8}
                            onMouseOut={e => e.currentTarget.style.opacity = 1}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Botón Flotante "+" para Registrar Profesor */}
      {mode === 'list' && (
        <button
          onClick={() => {
            setNombre('');
            setApellido('');
            setEmail('');
            setDocumento('');
            setTelefono('');
            setInstagram('');
            setBirthdate('');
            setBranch(branches.length > 0 ? branches[0].name : 'CENTRO');
            setMode('create');
          }}
          style={{
            position: 'fixed',
            bottom: '96px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--verde-oliva)',
            color: 'var(--blanco)',
            border: 'none',
            boxShadow: '0 4px 18px rgba(69, 95, 62, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: '300',
            cursor: 'pointer',
            zIndex: 100,
            transition: 'all 0.2s ease',
            animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
          }}
        >
          +
        </button>
      )}

      {/* 4. MODAL POPUP PARA ASIGNAR MULTIPLES TURNOS */}
      {showAssignModal && assignModalTeacher && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(30, 27, 22, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="clay-card animate-slide-up" style={{
            width: '100%',
            maxWidth: '460px',
            backgroundColor: 'var(--blanco)',
            padding: '24px',
            maxHeight: '90vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 12px 36px rgba(44, 38, 30, 0.15)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gris-oscuro)', margin: 0 }}>
                  Asignar Turnos a:
                </h3>
                <span style={{ fontSize: '13px', color: 'var(--verde-oliva)', fontWeight: '700' }}>
                  {assignModalTeacher.name}
                </span>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--gris-medio)'
                }}
              >
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--gris-medio)', margin: 0 }}>
              Selecciona todos los turnos semanales que dictará esta profesora. Puedes seleccionar múltiples turnos a la vez.
            </p>

            {/* Listado de Turnos */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '45vh',
              overflowY: 'auto',
              paddingRight: '4px'
            }}>
              {classes.length === 0 ? (
                <p style={{ fontStyle: 'italic', fontSize: '12px', textAlign: 'center', color: 'var(--gris-medio)', padding: '16px 0' }}>
                  No hay turnos registrados en el sistema.
                </p>
              ) : (
                classes.map(c => {
                  const isChecked = selectedTurnIds.includes(c.id);
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedTurnIds(prev => 
                          prev.includes(c.id) 
                            ? prev.filter(id => id !== c.id) 
                            : [...prev, c.id]
                        );
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: isChecked ? '2px solid var(--verde-oliva)' : '1px solid var(--gris-claro)',
                        backgroundColor: isChecked ? 'rgba(69, 95, 62, 0.04)' : 'var(--blanco)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--gris-oscuro)' }}>
                          {c.day} - {c.time}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--gris-medio)', fontWeight: '600' }}>
                          <LocationOnIcon style={{ fontSize: '12px' }} /> Sucursal: {c.sucursal} | Actual: {c.teacherName}
                        </span>
                      </div>

                      {/* Checkbox táctil */}
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '6px',
                        border: isChecked ? '2px solid var(--verde-oliva)' : '2px solid var(--gris-medio)',
                        backgroundColor: isChecked ? 'var(--verde-oliva)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease'
                      }}>
                        {isChecked && (
                          <svg style={{ width: '12px', height: '12px', color: 'var(--blanco)' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer de Acciones */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="btn-tuti btn-danger-soft"
                style={{ flex: 1, padding: '12px', fontSize: '13px', fontWeight: '800' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await bulkAssignClasses(assignModalTeacher.id, selectedTurnIds);
                    showFeedback(`¡Asignación de turnos para ${assignModalTeacher.name} guardada con éxito!`, 'success');
                    setShowAssignModal(false);
                  } catch (err) {
                    showFeedback('Error al guardar asignaciones de turnos.', 'danger');
                  }
                }}
                className="btn-tuti btn-success-soft"
                style={{ flex: 1, padding: '12px', fontSize: '13px', fontWeight: '800' }}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos CSS Inyectados */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeInAcc {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          from { transform: scale(0.7); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}} />

    </div>
  );
}
