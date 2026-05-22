import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';

export default function StudentsTab({ showFeedback, onEdit }) {
  const { users, studentProfiles, createNewUserAction, deleteUserAction, toggleStudentBlockAction } = useApp();
  const students = users.filter(u => u.role === 'ALUMNO');

  const [mode, setMode] = useState('list'); // 'list' | 'create'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ACTIVE'); // 'ACTIVE' | 'INACTIVE'
  const [expandedStudentId, setExpandedStudentId] = useState(null);

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [instagram, setInstagram] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [branch, setBranch] = useState('CENTRO');

  const filteredStudents = students.filter(st => {
    const profile = studentProfiles.find(p => p.studentId === st.id) || { isBlocked: false };
    const matchesSearch = st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = selectedBranch === 'ALL' || (st.sucursal || '').toUpperCase() === selectedBranch;
    const matchesStatus = selectedStatus === 'ALL' ||
      (selectedStatus === 'ACTIVE' && !profile.isBlocked) ||
      (selectedStatus === 'INACTIVE' && profile.isBlocked);
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
      setMode('list'); // Redirigir a listado después de crear
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
          
          <h3 style={{ fontSize: '18px', marginBottom: '18px', fontWeight: 700, color: 'var(--gris-oscuro)' }}>Dar de Alta Nueva Alumna</h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Nombre *</label>
              <input type="text" placeholder="Ej. Maria" className="input-tuti" value={nombre} onChange={e => setNombre(e.target.value)} style={{ width: '100%' }} />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Apellido *</label>
              <input type="text" placeholder="Ej. Perez" className="input-tuti" value={apellido} onChange={e => setApellido(e.target.value)} style={{ width: '100%' }} />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Email *</label>
              <input type="email" placeholder="maria@correo.com" className="input-tuti" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%' }} />
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
              <input type="text" placeholder="@maria.perez" className="input-tuti" value={instagram} onChange={e => setInstagram(e.target.value)} style={{ width: '100%' }} />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Fecha de Nacimiento</label>
              <input type="date" className="input-tuti" value={birthdate} onChange={e => setBirthdate(e.target.value)} style={{ width: '100%' }} />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Sucursal</label>
              <select className="input-tuti" value={branch} onChange={e => setBranch(e.target.value)} style={{ width: '100%', cursor: 'pointer' }}>
                <option value="CENTRO">CENTRO</option>
                <option value="ALTO VERDE">ALTO VERDE</option>
              </select>
            </div>

            <button type="submit" className="btn-tuti btn-secondary" style={{ marginTop: '8px', fontSize: '14px', padding: '14px', width: '100%', fontWeight: '700' }}>
              + Registrar Alumna
            </button>
          </form>
        </div>
      )}

      {/* Vista de Consulta / Listado */}
      {mode === 'list' && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Cabecera con Contador al principio */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--gris-oscuro)', margin: 0, fontFamily: 'Geist, Outfit, sans-serif', letterSpacing: '-0.8px' }}>Alumnas</h2>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--gris-medio)', backgroundColor: 'rgba(0,0,0,0.05)', padding: '4px 10px', borderRadius: '12px' }}>
              {filteredStudents.length} {filteredStudents.length === 1 ? 'alumna' : 'alumnas'}
            </span>
          </div>

          {/* Bloque de Filtros y Búsqueda Premium (Estilo Mockup) */}
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
                style={{ width: '100%', paddingLeft: '40px', fontSize: '13px', backgroundColor: '#fcfcfc', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', height: '42px' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Sucursales */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--gris-medio)', marginRight: '4px' }}>Sucursal:</span>
                {['ALL', 'CENTRO', 'ALTO VERDE'].map(br => {
                  const isActive = selectedBranch === br;
                  return (
                    <button
                      key={br}
                      onClick={() => setSelectedBranch(br)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '16px',
                        border: isActive ? 'none' : '1px solid var(--gris-claro)',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        backgroundColor: isActive ? 'rgba(69, 95, 62, 0.12)' : 'var(--blanco)',
                        color: isActive ? 'var(--verde-oliva)' : 'var(--gris-medio)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {br === 'ALL' ? 'Todas' : br === 'CENTRO' ? 'Centro' : 'Alto Verde'}
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
                  border: '1px solid rgba(0,0,0,0.02)',
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

          <div>

            {filteredStudents.length === 0 ? (
              <div className="clay-card" style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--gris-medio)' }}>
                <p style={{ fontStyle: 'italic', fontSize: '13px' }}>No se encontraron alumnas.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredStudents.map(st => {
                  const profile = studentProfiles.find(p => p.studentId === st.id) || { classCredits: 0, monthlyClayKg: 0, isBlocked: false };
                  const initials = getInitials(st.name);
                  const isExpanded = expandedStudentId === st.id;

                  return (
                    <div
                      key={st.id}
                      className="clay-card animate-slide-up"
                      onClick={() => setExpandedStudentId(isExpanded ? null : st.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '14px 16px',
                        opacity: profile.isBlocked ? 0.6 : 1,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        borderLeft: profile.isBlocked ? '4px solid var(--rojo-alerta)' : '1px solid var(--gris-claro)',
                        backgroundColor: 'var(--blanco)'
                      }}
                    >
                      {/* Fila Principal de Información */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%' }}>
                        {/* Círculo con Iniciales */}
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(69, 95, 62, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          color: 'var(--verde-oliva)',
                          fontSize: '13px',
                          flexShrink: 0
                        }}>
                          {initials}
                        </div>

                        {/* Nombre y Detalles */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--gris-oscuro)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {st.name}
                            </h4>
                            {profile.isBlocked && (
                              <span style={{ fontSize: '7px', fontWeight: 'bold', backgroundColor: 'var(--rojo-alerta-light)', color: 'var(--rojo-alerta)', padding: '1px 4px', borderRadius: '4px' }}>
                                PAUSA
                              </span>
                            )}
                          </div>

                          <span style={{ fontSize: '11px', color: 'var(--gris-medio)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {st.email}
                          </span>

                          {/* Badge de Sucursal */}
                          <span style={{
                            fontSize: '8px',
                            fontWeight: '800',
                            letterSpacing: '0.4px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            alignSelf: 'flex-start',
                            marginTop: '3px',
                            backgroundColor: (st.sucursal || 'CENTRO').toUpperCase() === 'CENTRO' ? 'rgba(69, 95, 62, 0.08)' : 'rgba(146, 101, 61, 0.08)',
                            color: (st.sucursal || 'CENTRO').toUpperCase() === 'CENTRO' ? 'var(--verde-oliva)' : 'var(--marron-arcilla)'
                          }}>
                            {(st.sucursal || 'CENTRO').toUpperCase()}
                          </span>
                        </div>

                        {/* Clases, Barra Indicadora y Chevron de despliegue */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                            <span style={{ fontSize: '8px', fontWeight: '800', color: 'var(--gris-medio)', letterSpacing: '0.5px' }}>
                              CLASES
                            </span>
                            <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--gris-oscuro)', lineHeight: '1' }}>
                              {profile.classCredits}
                            </span>
                          </div>
                          {/* Barra vertical de indicador */}
                          <div style={{
                            width: '4px',
                            height: '24px',
                            borderRadius: '2px',
                            backgroundColor: profile.classCredits > 0 ? 'var(--verde-oliva)' : 'var(--gris-claro)'
                          }} />

                          {/* Chevron indicador de colapso */}
                          <svg
                            style={{
                              width: '12px',
                              height: '12px',
                              color: 'var(--gris-medio)',
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.25s ease',
                              marginLeft: '2px',
                              flexShrink: 0
                            }}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                      </div>

                      {/* Bloque Desplegable de Acciones (Estilo Mockup) */}
                      {isExpanded && (
                        <div
                          onClick={e => e.stopPropagation()}
                          style={{
                            width: '100%',
                            marginTop: '12px',
                            borderTop: '1px solid rgba(234, 229, 219, 0.5)',
                            paddingTop: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            animation: 'fadeInAcc 0.2s ease-out'
                          }}
                        >


                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                            {/* 1. Pausar */}
                            <div
                              onClick={async (e) => {
                                e.stopPropagation();
                                await handleToggleBlock(st.id, st.name, profile.isBlocked);
                              }}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '12px 8px',
                                borderRadius: '16px',
                                border: profile.isBlocked ? '1px solid rgba(69, 95, 62, 0.12)' : '1px solid rgba(146, 101, 61, 0.12)',
                                backgroundColor: profile.isBlocked ? '#EAF2E8' : '#FAF5F0',
                                color: profile.isBlocked ? 'var(--verde-oliva)' : '#92653D',
                                cursor: 'pointer',
                                transition: 'transform 0.1s ease',
                                textAlign: 'center'
                              }}
                            >
                              {profile.isBlocked ? (
                                <svg style={{ width: '12px', height: '12px', color: 'currentColor' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                                </svg>
                              ) : (
                                <svg style={{ width: '12px', height: '12px', color: 'currentColor' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                                </svg>
                              )}
                              <span style={{ fontSize: '10px', fontWeight: '700' }}>
                                {profile.isBlocked ? 'Reactivar' : 'Pausar'}
                              </span>
                            </div>

                            {/* 2. Editar */}
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(st);
                              }}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '12px 8px',
                                borderRadius: '16px',
                                border: '1px solid rgba(43, 108, 176, 0.12)',
                                backgroundColor: '#F3F8FC',
                                color: '#2B6CB0',
                                cursor: 'pointer',
                                transition: 'transform 0.1s ease',
                                textAlign: 'center'
                              }}
                            >
                              <svg style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                              </svg>
                              <span style={{ fontSize: '10px', fontWeight: '700' }}>Editar</span>
                            </div>

                            {/* 3. Eliminar */}
                            <div
                              onClick={async (e) => {
                                e.stopPropagation();
                                await handleDelete(st.id, st.name);
                              }}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '12px 8px',
                                borderRadius: '16px',
                                border: '1px solid rgba(229, 62, 62, 0.12)',
                                backgroundColor: '#FFF5F5',
                                color: '#E53E3E',
                                cursor: 'pointer',
                                transition: 'transform 0.1s ease',
                                textAlign: 'center'
                              }}
                            >
                              <svg style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                              <span style={{ fontSize: '10px', fontWeight: '700' }}>Eliminar</span>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Botón Flotante "+" para Registrar Alumna */}
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
            setBranch('CENTRO');
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
            lineHeight: '52px',
            animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
          }}
        >
          +
        </button>
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
