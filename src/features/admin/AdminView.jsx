import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import DashboardTab  from './tabs/DashboardTab';
import StudentsTab   from './tabs/StudentsTab';
import TeachersTab   from './tabs/TeachersTab';
import ClassesTab    from './tabs/ClassesTab';
import PaymentsTab   from './tabs/PaymentsTab';
import EditUserModal from './components/EditUserModal';

const TABS = [
  { id: 'dashboard', label: 'Resumen'    },
  { id: 'students',  label: 'Alumnas'    },
  { id: 'teachers',  label: 'Profesores' },
  { id: 'classes',   label: 'Turnos'     },
  { id: 'payments',  label: 'Pagos'      },
];

export default function AdminView() {
  const { users, studentProfiles, classes, bookings } = useApp();

  const [activeTab, setActiveTab]     = useState('dashboard');
  const [alertMsg, setAlertMsg]       = useState({ text: '', type: '' });
  const [editUserId, setEditUserId]   = useState(null); // null = modal cerrado

  const students = users.filter(u => u.role === 'ALUMNO');

  const showFeedback = (text, type = 'info') => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg({ text: '', type: '' }), 4000);
  };

  const openEdit  = (user) => setEditUserId(user.id);
  const closeEdit = ()     => setEditUserId(null);

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Tab bar */}
      <div style={{
        display: 'flex', backgroundColor: 'var(--blanco)',
        padding: '6px', borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-flat)', border: '1px solid var(--gris-claro)',
        marginTop: '2px'
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '10px 0', border: 'none',
              borderRadius: 'var(--radius-sm)', fontSize: '12px',
              fontWeight: activeTab === tab.id ? '700' : '500',
              cursor: 'pointer',
              backgroundColor: activeTab === tab.id ? 'var(--marron-arcilla)' : 'transparent',
              color: activeTab === tab.id ? 'var(--blanco)' : 'var(--gris-medio)',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feedback banner */}
      {alertMsg.text && (
        <div className={`alert-banner ${alertMsg.type === 'danger' ? 'danger' : 'info'} animate-slide-up`}>
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Contenido de cada tab */}
      {activeTab === 'dashboard' && (
        <DashboardTab
          classes={classes}
          bookings={bookings}
          students={students}
          studentProfiles={studentProfiles}
          setAdminTab={setActiveTab}
        />
      )}

      {activeTab === 'students' && (
        <StudentsTab showFeedback={showFeedback} onEdit={openEdit} />
      )}

      {activeTab === 'teachers' && (
        <TeachersTab showFeedback={showFeedback} onEdit={openEdit} />
      )}

      {activeTab === 'classes' && (
        <ClassesTab showFeedback={showFeedback} />
      )}

      {activeTab === 'payments' && (
        <PaymentsTab showFeedback={showFeedback} />
      )}

      {/* Modal de edición compartido */}
      {editUserId && (
        <EditUserModal
          userId={editUserId}
          onClose={closeEdit}
          showFeedback={showFeedback}
        />
      )}
    </div>
  );
}
