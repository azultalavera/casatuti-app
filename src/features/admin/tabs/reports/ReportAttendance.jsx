import React, { useState } from 'react';
import { useApp } from '../../../../context/AppContext';
import { exportToExcel } from '../../../../utils/exportToExcel';

export default function ReportAttendance() {
  const { classes, bookings, users } = useApp();
  const [selectedDate, setSelectedDate] = useState('');

  // Fechas con clases registradas
  const availableDates = [...new Set(bookings.filter(b => b.status !== 'CANCELLED' && b.status !== 'CANCELLED_LATE').map(b => b.date))].sort();

  // Filtrar clases del día seleccionado
  const dayBookings = bookings.filter(b => b.date === selectedDate && b.status !== 'CANCELLED' && b.status !== 'CANCELLED_LATE');
  const classIdsForDay = [...new Set(dayBookings.map(b => b.classId))];
  const classesForDay = classes.filter(c => classIdsForDay.includes(c.id));

  const handleExport = () => {
    if (!selectedDate) {
      alert("Selecciona una fecha primero.");
      return;
    }
    
    const exportData = [];
    classesForDay.forEach(cls => {
      const teacher = users.find(u => u.id === cls.teacherId);
      const teacherName = teacher ? teacher.name : 'Desconocido';
      
      const enrolled = dayBookings.filter(b => b.classId === cls.id);
      enrolled.forEach(b => {
        exportData.push({
          "Fecha": selectedDate,
          "Clase_Dia": cls.day,
          "Clase_Hora": cls.time,
          "Profesor": teacherName,
          "Alumna": b.studentName,
          "Estado_Asistencia": b.status === 'ATTENDED' ? 'Presente' : (b.status === 'ABSENT' ? 'Ausente' : 'Pendiente')
        });
      });
    });

    if (exportData.length === 0) {
      alert("No hay alumnas inscriptas en esta fecha.");
      return;
    }

    exportToExcel(exportData, `Reporte_Asistencia_${selectedDate}`);
  };

  return (
    <div className="clay-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--gris-oscuro)' }}>Reporte de asistencia</h3>
          <p style={{ fontSize: '14px', color: 'var(--gris-medio)' }}>Alumnas anotadas por horario para la toma de lista.</p>
        </div>
        <button onClick={handleExport} className="btn-tuti btn-primary-clay" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⬇</span> Descargar Excel
        </button>
      </div>

      <div className="form-group" style={{ maxWidth: '300px', marginBottom: '24px' }}>
        <label>Filtrar por Fecha:</label>
        <select className="input-tuti" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
          <option value="">Selecciona una fecha</option>
          {availableDates.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {!selectedDate && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gris-medio)' }}>
          <p>Por favor selecciona una fecha para ver la lista de clases y alumnas.</p>
        </div>
      )}

      {selectedDate && classesForDay.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gris-medio)' }}>
          <p>No hay clases con alumnas inscriptas para el {selectedDate}.</p>
        </div>
      )}

      {selectedDate && classesForDay.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {classesForDay.map(cls => {
            const teacher = users.find(u => u.id === cls.teacherId);
            const enrolled = dayBookings.filter(b => b.classId === cls.id);
            return (
              <div key={cls.id} style={{ border: '1px solid var(--gris-claro)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--gris-claro)', paddingBottom: '12px', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--gris-oscuro)' }}>
                      {cls.day} - {cls.time} ({cls.name || 'Taller'})
                    </h4>
                    <p style={{ fontSize: '14px', color: 'var(--gris-medio)', margin: '4px 0 0 0' }}>Profesor: {teacher ? teacher.name : 'N/A'}</p>
                  </div>
                  <span className="badge badge-clay">{enrolled.length} / {cls.maxCapacity} Inscriptas</span>
                </div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--gris-claro)', textAlign: 'left' }}>
                      <th style={{ padding: '8px', color: 'var(--gris-medio)', fontSize: '14px' }}>Alumna</th>
                      <th style={{ padding: '8px', color: 'var(--gris-medio)', fontSize: '14px', width: '100px' }}>Asistencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolled.map(b => (
                      <tr key={b.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '8px', fontSize: '14px', color: 'var(--gris-oscuro)' }}>{b.studentName}</td>
                        <td style={{ padding: '8px', fontSize: '14px' }}>
                          {b.status === 'ATTENDED' && <span style={{ color: 'var(--verde-oliva)', fontWeight: 'bold' }}>Presente</span>}
                          {b.status === 'ABSENT' && <span style={{ color: '#d9534f', fontWeight: 'bold' }}>Ausente</span>}
                          {b.status === 'CONFIRMED' && <span style={{ color: 'var(--gris-medio)' }}>Pendiente</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
