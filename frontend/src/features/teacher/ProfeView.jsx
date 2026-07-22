import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import InicioTabProfe from './InicioTabProfe';
import ClasesTabProfe from './ClasesTabProfe';
import AlumnosTabProfe from './AlumnosTabProfe';
import InsumosTabProfe from './InsumosTabProfe';
import PerfilTab from '../student/PerfilTab';

export default function ProfeView({ activeTab, setActiveTab }) {
  const {
    users,
    currentUser,
    classes,
    bookings,
    studentProfiles,
    takeAttendance,
    deliverClayToStudent,
    createBake,
    createExtraClay,
    bookClassForStudent,
    requestClassPauseAction,
    cancelBooking
  } = useApp();

  const [selectedBranch, setSelectedBranch] = useState('ALL');

  // Determinar sucursales del profe basadas en sus clases
  const myBranches = useMemo(() => {
    const teacherClasses = classes.filter(c => c.teacherId === currentUser.id);
    return [...new Set(teacherClasses.map(c => c.sucursal).filter(Boolean))];
  }, [classes, currentUser.id]);

  // Si selectedBranch ya no es válida, volver a ALL
  useEffect(() => {
    if (selectedBranch !== 'ALL' && !myBranches.includes(selectedBranch)) {
      setSelectedBranch('ALL');
    }
  }, [myBranches, selectedBranch]);

  // Filtrar clases para pasar a las pestañas
  const filteredClasses = useMemo(() => {
    if (selectedBranch === 'ALL') return classes;
    return classes.filter(c => c.sucursal === selectedBranch);
  }, [classes, selectedBranch]);

  const renderContent = () => {
    switch (activeTab) {
      case 'inicio':
        return (
          <InicioTabProfe 
            users={users}
            currentUser={currentUser}
            classes={filteredClasses}
            bookings={bookings}
            studentProfiles={studentProfiles}
            takeAttendance={takeAttendance}
            deliverClayToStudent={deliverClayToStudent}
            bookClassForStudent={bookClassForStudent}
            createBake={createBake}
            createExtraClay={createExtraClay}
            cancelBooking={cancelBooking}
            setActiveTab={setActiveTab}
          />
        );
      case 'clases':
        return (
          <ClasesTabProfe 
            currentUser={currentUser}
            classes={filteredClasses}
            bookings={bookings}
            studentProfiles={studentProfiles}
            takeAttendance={takeAttendance}
            deliverClayToStudent={deliverClayToStudent}
            createBake={createBake}
            createExtraClay={createExtraClay}
            requestClassPauseAction={requestClassPauseAction}
            cancelBooking={cancelBooking}
          />
        );
      case 'alumnos':
        return (
          <AlumnosTabProfe 
            currentUser={currentUser}
            classes={filteredClasses}
            bookings={bookings}
            studentProfiles={studentProfiles}
          />
        );
      case 'insumos':
        return (
          <InsumosTabProfe
            currentUser={currentUser}
            classes={filteredClasses}
            bookings={bookings}
            studentProfiles={studentProfiles}
            createBake={createBake}
            createExtraClay={createExtraClay}
          />
        );
      case 'perfil':
        return <PerfilTab />;
      default:
        return (
          <InicioTabProfe 
            users={users}
            currentUser={currentUser}
            classes={filteredClasses}
            bookings={bookings}
            studentProfiles={studentProfiles}
            takeAttendance={takeAttendance}
            deliverClayToStudent={deliverClayToStudent}
            bookClassForStudent={bookClassForStudent}
            setActiveTab={setActiveTab}
          />
        );
    }
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Cabecera del Profesor (solo mostrar en Inicio y Clases) */}
      {activeTab !== 'perfil' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="badge badge-oliva" style={{ marginBottom: '6px' }}>Profesor activo</span>
              <h2 style={{ fontSize: '26px' }}>Prof. {currentUser.name.split(' ')[0]}</h2>
            </div>
            <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'var(--marron-arcilla)',
            color: 'var(--blanco)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: 'var(--font-serif)',
            fontSize: '20px',
            fontWeight: 'bold',
            boxShadow: 'var(--shadow-clay)',
            overflow: 'hidden'
          }}>
            {currentUser.avatar_url ? (
              <img src={currentUser.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              currentUser.name[0]
            )}
            </div>
          </div>

          {/* Filtro por Sucursal (sólo si tiene más de 1 sucursal) */}
          {myBranches.length > 1 && (
            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-crema-claro)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--gris-claro)', overflowX: 'auto' }}>
              <button
                onClick={() => setSelectedBranch('ALL')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: selectedBranch === 'ALL' ? 'var(--verde-oliva)' : 'transparent',
                  color: selectedBranch === 'ALL' ? 'var(--blanco)' : 'var(--gris-medio)',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                Todas
              </button>
              {myBranches.map((branch) => {
                const isActive = selectedBranch === branch;
                return (
                  <button
                    key={branch}
                    onClick={() => setSelectedBranch(branch)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      backgroundColor: isActive ? 'var(--verde-oliva)' : 'transparent',
                      color: isActive ? 'var(--blanco)' : 'var(--gris-medio)',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {branch}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Contenido de la pestaña */}
      {renderContent()}

    </div>
  );
}
