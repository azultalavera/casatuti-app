import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';

export default function StudentsTab({ showFeedback, onEdit, initialFilter, onClearFilter }) {
  const { users, studentProfiles, createNewUserAction, deleteUserAction, toggleStudentBlockAction, branches } = useApp();
  const students = users.filter(u => u.role === 'ALUMNO');

  const [mode, setMode] = useState('list'); // 'list' | 'create'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ACTIVE'); // 'ACTIVE' | 'INACTIVE'
  const [filterZeroCredits, setFilterZeroCredits] = useState(false); // toggle zero credits
  const [filterActivePacks, setFilterActivePacks] = useState(false); // toggle active packs
  const [expandedStudentId, setExpandedStudentId] = useState(null);

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [instagram, setInstagram] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [branch, setBranch] = useState(branches.length > 0 ? branches[0].name : 'CENTRO');

  React.useEffect(() => {
    if (initialFilter === 'ACTIVE_PACKS') {
      setFilterActivePacks(true);
      setFilterZeroCredits(false);
      if (onClearFilter) onClearFilter();
    }
  }, [initialFilter, onClearFilter]);

  const filteredStudents = students.filter(st => {
    const profile = studentProfiles.find(p => p.studentId === st.id) || { isBlocked: false, classCredits: 0 };
    const matchesSearch = st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (st.nro_documento && String(st.nro_documento).includes(searchTerm));
    const matchesBranch = selectedBranch === 'ALL' || (st.sucursal || '').toUpperCase() === selectedBranch.toUpperCase();
    const matchesStatus = selectedStatus === 'ALL' ||
      (selectedStatus === 'ACTIVE' && !profile.isBlocked) ||
      (selectedStatus === 'INACTIVE' && profile.isBlocked);
    const matchesCredits = !filterZeroCredits || profile.classCredits === 0;
    const matchesActive = !filterActivePacks || profile.classCredits >= 1;
    return matchesSearch && matchesBranch && matchesStatus && matchesCredits && matchesActive;
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
      showFeedback(`¡Alumna "${fullName}" registrada con éxito!`, 'success');
      setNombre(''); setApellido(''); setEmail(''); setDocumento('');
      setTelefono(''); setInstagram(''); setBirthdate(''); setBranch(branches.length > 0 ? branches[0].name : 'CENTRO');
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
        <div className="tuti-modal" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(30, 27, 22, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '16px'
        }}>
          <div className="clay-card animate-slide-up" style={{
            width: '100%', maxWidth: '460px', backgroundColor: 'var(--blanco)', padding: '24px',
            maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px',
            boxShadow: '0 12px 36px rgba(44, 38, 30, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gris-oscuro)', margin: 0 }}>
                Nuevo/a alumno/a
              </h3>
              <button
                type="button"
                onClick={() => setMode('list')}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--gris-medio)' }}
              >
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
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
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>DNI *</label>
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
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Fecha de nacimiento</label>
              <input type="date" className="input-tuti" value={birthdate} onChange={e => setBirthdate(e.target.value)} style={{ width: '100%' }} />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gris-medio)' }}>Sucursal</label>
              <select className="input-tuti" value={branch} onChange={e => setBranch(e.target.value)} style={{ width: '100%', cursor: 'pointer' }}>
                {branches.map(b => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn-tuti btn-success-soft" style={{ marginTop: '8px', fontSize: '14px', padding: '14px', width: '100%', fontWeight: '700' }}>
              + Registrar Alumna
            </button>
          </form>
          </div>
        </div>
      )}

      {/* Vista de Consulta / Listado */}
      <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Cabecera con Contador al principio */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--gris-oscuro)', margin: 0, fontFamily: 'Geist, Outfit, sans-serif', letterSpacing: '-0.8px' }}>Alumnos/as</h2>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--gris-medio)', backgroundColor: 'rgba(0,0,0,0.05)', padding: '4px 10px', borderRadius: '12px' }}>
              {filteredStudents.length} {filteredStudents.length === 1 ? 'alumna' : 'alumnos/as'}
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
                placeholder="Buscar por nombre, email o DNI..."
                className="input-tuti"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', paddingLeft: '40px', fontSize: '13px', backgroundColor: '#fcfcfc', border: 'none', borderRadius: '20px', height: '42px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
              />
            </div>
            {/* Filtros de Clases */}
            <div style={{ backgroundColor: '#F6F8F5', border: '1px solid #EFEFEF', padding: '12px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => {
                  setFilterZeroCredits(!filterZeroCredits);
                  if (!filterZeroCredits) setFilterActivePacks(false);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  backgroundColor: 'var(--blanco)', border: filterZeroCredits ? '1px solid var(--marron-arcilla)' : '1px solid #F1E5DF',
                  padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
                  fontSize: '12px', fontWeight: '800', color: filterZeroCredits ? 'var(--marron-arcilla)' : 'var(--gris-medio)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s'
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: filterZeroCredits ? 'var(--marron-arcilla)' : 'var(--gris-claro)' }}></div>
                Sin clases ({students.filter(st => {
                  const p = studentProfiles.find(x => x.studentId === st.id) || { classCredits: 0 };
                  return p.classCredits === 0;
                }).length})
              </button>

              <button
                onClick={() => {
                  setFilterActivePacks(!filterActivePacks);
                  if (!filterActivePacks) setFilterZeroCredits(false);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  backgroundColor: 'var(--blanco)', border: filterActivePacks ? '1px solid var(--verde-oliva)' : '1px solid #F1E5DF',
                  padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
                  fontSize: '12px', fontWeight: '800', color: filterActivePacks ? 'var(--verde-oliva)' : 'var(--gris-medio)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s'
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: filterActivePacks ? 'var(--verde-oliva)' : 'var(--gris-claro)' }}></div>
                Con clases ({students.filter(st => {
                  const p = studentProfiles.find(x => x.studentId === st.id) || { classCredits: 0 };
                  return p.classCredits >= 1;
                }).length})
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
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

              {/* Estado Switch */}
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
                      color: selectedStatus === 'INACTIVE' ? 'var(--verde-oliva)' : 'var(--gris-medio)',
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredStudents.map(st => {
                  const profile = studentProfiles.find(p => p.studentId === st.id) || { classCredits: 0, monthlyClayKg: 0, isBlocked: false };
                  const initials = getInitials(st.name);
                  const isExpanded = expandedStudentId === st.id;

                  return (
                    <div
                      key={st.id}
                      onClick={() => setExpandedStudentId(isExpanded ? null : st.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '20px',
                        borderRadius: '24px',
                        backgroundColor: 'var(--blanco)',
                        opacity: profile.isBlocked ? 0.6 : 1,
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease',
                        border: 'none',
                        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.08)'
                      }}
                    >
                      {/* Fila Principal de Información */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                        {/* Círculo con Iniciales */}
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          backgroundColor: '#F6F8F5',
                          border: '1px solid #EAEAEA',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '800',
                          color: 'var(--gris-oscuro)',
                          fontSize: '15px',
                          flexShrink: 0
                        }}>
                          {initials}
                        </div>

                        {/* Nombre y Detalles */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gris-oscuro)', margin: 0, wordBreak: 'break-word' }}>
                              {st.name}
                            </h4>
                            {profile.isBlocked && (
                              <span style={{ flexShrink: 0, marginTop: '2px', fontSize: '9px', fontWeight: '800', backgroundColor: 'var(--rojo-alerta-light)', color: 'var(--rojo-alerta)', padding: '2px 8px', borderRadius: '8px' }}>
                                Pausa
                              </span>
                            )}
                          </div>
                          {/* Branch Chip */}
                          <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                            <span style={{
                              fontSize: '9px',
                              fontWeight: '700',
                              backgroundColor: 'transparent',
                              color: (st.sucursal || 'CENTRO').toUpperCase() === 'CENTRO' ? 'var(--gris-medio)' : 'var(--marron-arcilla)',
                              border: `1px solid ${(st.sucursal || 'CENTRO').toUpperCase() === 'CENTRO' ? 'var(--gris-claro)' : '#F1E5DF'}`,
                              padding: '2px 8px',
                              borderRadius: '12px'
                            }}>
                              {(st.sucursal || 'Centro').charAt(0).toUpperCase() + (st.sucursal || 'Centro').slice(1).toLowerCase()}
                            </span>
                          </div>
                        </div>

                        {/* Clases, Barra Indicadora y Chevron de despliegue */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--marron-arcilla)', letterSpacing: '0.5px' }}>
                              Clases
                            </span>
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: '6px',
                              backgroundColor: profile.classCredits === 0 ? '#FCF9F7' : '#D1D7CD',
                              border: profile.classCredits === 0 ? '1px solid #F1E5DF' : 'none',
                              padding: '4px 10px', borderRadius: '14px'
                            }}>
                              {profile.classCredits === 0 && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--marron-arcilla)' }}></div>}
                              <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--gris-oscuro)' }}>
                                {profile.classCredits} disp.
                              </span>
                            </div>
                          </div>

                          {/* Chevron indicador de colapso */}
                          <div style={{ backgroundColor: '#F6F8F5', border: '1px solid #EAEAEA', borderRadius: '8px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                          {/* Details removed */}

                          {/* Botones de acción */}
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {/* 1. Pausar */}
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                await handleToggleBlock(st.id, st.name, profile.isBlocked);
                              }}
                              style={{
                                flex: 1, padding: '12px 0', borderRadius: '16px', border: 'none',
                                backgroundColor: profile.isBlocked ? '#EAF2E8' : 'var(--bg-crema)',
                                color: profile.isBlocked ? 'var(--verde-oliva)' : 'var(--marron-arcilla)',
                                fontSize: '12px', fontWeight: 800, cursor: 'pointer', transition: 'opacity 0.2s'
                              }}
                              onMouseOver={e => e.currentTarget.style.opacity = 0.8}
                              onMouseOut={e => e.currentTarget.style.opacity = 1}
                            >
                              {profile.isBlocked ? 'Reactivar' : 'Pausar'}
                            </button>

                            {/* 2. Editar */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(st);
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
                                await handleDelete(st.id, st.name);
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
                })}
              </div>
            )}
          </div>
        </div>

      {/* Botón Flotante "+" para Registrar Alumna */}
      {mode !== 'create' && (
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
            bottom: '108px',
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
        <svg style={{ width: '28px', height: '28px' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
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
