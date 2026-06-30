import React from 'react';
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
    bookClassForStudent
  } = useApp();

  const renderContent = () => {
    switch (activeTab) {
      case 'inicio':
        return (
          <InicioTabProfe 
            users={users}
            currentUser={currentUser}
            classes={classes}
            bookings={bookings}
            studentProfiles={studentProfiles}
            takeAttendance={takeAttendance}
            deliverClayToStudent={deliverClayToStudent}
            bookClassForStudent={bookClassForStudent}
            setActiveTab={setActiveTab}
          />
        );
      case 'clases':
        return (
          <ClasesTabProfe 
            currentUser={currentUser}
            classes={classes}
            bookings={bookings}
            studentProfiles={studentProfiles}
            takeAttendance={takeAttendance}
            deliverClayToStudent={deliverClayToStudent}
            createBake={createBake}
          />
        );
      case 'alumnos':
        return (
          <AlumnosTabProfe 
            currentUser={currentUser}
            classes={classes}
            bookings={bookings}
            studentProfiles={studentProfiles}
          />
        );
      case 'insumos':
        return (
          <InsumosTabProfe
            currentUser={currentUser}
            classes={classes}
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
            classes={classes}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
      )}

      {/* Contenido de la pestaña */}
      {renderContent()}

    </div>
  );
}
