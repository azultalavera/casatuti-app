import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import EventIcon from '@mui/icons-material/Event';
import SettingsIcon from '@mui/icons-material/Settings';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function ConfigTab({ showFeedback, goBack }) {
  const {
    nonWorkingDays, addNonWorkingDay, deleteNonWorkingDay,
    packs, createPack, updatePack, deletePack,
    branches, createBranch, updateBranch, deleteBranch,
    faqs, createFaq, updateFaq, deleteFaq
  } = useApp();

  const [view, setView] = useState('menu'); // 'menu', 'calendar', 'packs', 'branches', 'faqs'

  // --- CALENDAR STATES ---
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date().getMonth());
  const [currentCalendarYear, setCurrentCalendarYear] = useState(new Date().getFullYear());

  // States for the new Calendar Modal
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedDateToMark, setSelectedDateToMark] = useState(null);
  const [holidayType, setHolidayType] = useState('Feriado'); // 'Feriado' o 'Día no laborable'
  const [holidayReason, setHolidayReason] = useState('');

  // --- PACKS STATES ---
  const [configPackName, setConfigPackName] = useState('');
  const [configPackCredits, setConfigPackCredits] = useState('');
  const [configPackPrice, setConfigPackPrice] = useState('');
  const [editingPackId, setEditingPackId] = useState(null);

  // --- BRANCHES STATES ---
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchMaxCapacity, setBranchMaxCapacity] = useState('');
  const [editingBranchId, setEditingBranchId] = useState(null);

  // --- FAQS STATES ---
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [editingFaqId, setEditingFaqId] = useState(null);

  // --- CALENDAR HELPERS ---
  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => {
    const d = new Date(year, month, 1).getDay();
    return d === 0 ? 6 : d - 1; // Lunes = 0
  };
  const daysInMonth = getDaysInMonth(currentCalendarMonth, currentCalendarYear);
  const firstDay = getFirstDayOfMonth(currentCalendarMonth, currentCalendarYear);
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const handleDayClick = async (dateStr) => {
    const isNW = nonWorkingDays.some(n => n?.date === dateStr);
    if (isNW) {
      if (window.confirm('¿Eliminar este día de la lista?')) {
        try {
          await deleteNonWorkingDay(dateStr);
          showFeedback('Día restaurado.', 'info');
        } catch (e) { showFeedback(e.message, 'danger'); }
      }
    } else {
      setSelectedDateToMark(dateStr);
      setHolidayType('Feriado');
      setHolidayReason('');
      setShowCalendarModal(true);
    }
  };

  const handleSaveCalendarDay = async () => {
    if (!selectedDateToMark) return;
    const finalReason = holidayReason ? `${holidayType} - ${holidayReason}` : holidayType;
    try {
      await addNonWorkingDay(selectedDateToMark, finalReason);
      showFeedback('Día registrado.', 'info');
      setShowCalendarModal(false);
      setSelectedDateToMark(null);
    } catch (e) { showFeedback(e.message, 'danger'); }
  };

  // --- PACKS HANDLERS ---
  const handleSavePack = async (e) => {
    e.preventDefault();
    if (!configPackName || !configPackCredits || !configPackPrice) {
      alert("Completá todos los campos");
      return;
    }
    const data = { name: configPackName, credits: Number(configPackCredits), price: Number(configPackPrice) };
    try {
      if (editingPackId) {
        await updatePack(editingPackId, data);
        showFeedback("Pack actualizado exitosamente.", "info");
      } else {
        await createPack(data);
        showFeedback("Pack creado exitosamente.", "info");
      }
      setConfigPackName('');
      setConfigPackCredits('');
      setConfigPackPrice('');
      setEditingPackId(null);
    } catch (err) { showFeedback(err.message, "danger"); }
  };
  const startEditPack = (pack) => {
    setEditingPackId(pack.id);
    setConfigPackName(pack.name);
    setConfigPackCredits(pack.credits);
    setConfigPackPrice(pack.price);
  };
  const handleDeletePack = async (id) => {
    if (window.confirm("¿Seguro que quieres eliminar este pack?")) {
      try {
        await deletePack(id);
        showFeedback("Pack eliminado.", "info");
      } catch (err) { showFeedback(err.message, "danger"); }
    }
  };

  // --- BRANCHES HANDLERS ---
  const handleSaveBranch = async (e) => {
    e.preventDefault();
    if (!branchName) return;
    try {
      if (editingBranchId) {
        await updateBranch(editingBranchId, { name: branchName.toUpperCase(), address: branchAddress, maxCapacity: Number(branchMaxCapacity) });
        showFeedback("Sucursal actualizada.", "info");
      } else {
        await createBranch({ name: branchName.toUpperCase(), address: branchAddress, maxCapacity: Number(branchMaxCapacity) });
        showFeedback("Sucursal creada.", "info");
      }
      setBranchName('');
      setBranchAddress('');
      setBranchMaxCapacity('');
      setEditingBranchId(null);
    } catch (err) { showFeedback(err.message, "danger"); }
  };
  const startEditBranch = (br) => {
    setEditingBranchId(br.id);
    setBranchName(br.name);
    setBranchAddress(br.address || '');
    setBranchMaxCapacity(br.maxCapacity || '');
  };
  const handleDeleteBranch = async (id) => {
    if (window.confirm("¿Seguro que quieres eliminar esta sucursal?")) {
      try {
        await deleteBranch(id);
        showFeedback("Sucursal eliminada.", "info");
      } catch (err) { showFeedback(err.message, "danger"); }
    }
  };

  // --- FAQS HANDLERS ---
  const handleSaveFaq = async (e) => {
    e.preventDefault();
    if (!faqQuestion || !faqAnswer) return;
    try {
      if (editingFaqId) {
        await updateFaq(editingFaqId, { question: faqQuestion, answer: faqAnswer });
        showFeedback("Norma actualizada.", "info");
      } else {
        await createFaq({ question: faqQuestion, answer: faqAnswer });
        showFeedback("Norma creada.", "info");
      }
      setFaqQuestion('');
      setFaqAnswer('');
      setEditingFaqId(null);
    } catch (err) { showFeedback(err.message, "danger"); }
  };
  const startEditFaq = (f) => {
    setEditingFaqId(f.id);
    setFaqQuestion(f.question);
    setFaqAnswer(f.answer);
  };
  const handleDeleteFaq = async (id) => {
    if (window.confirm("¿Seguro que quieres eliminar esta norma?")) {
      try {
        await deleteFaq(id);
        showFeedback("Norma eliminada.", "info");
      } catch (err) { showFeedback(err.message, "danger"); }
    }
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '20px' }}>

      {/* HEADER DINÁMICO */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => {
            if (view === 'menu') {
              if (goBack) goBack();
            } else {
              setView('menu');
            }
          }}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '8px', color: 'var(--gris-oscuro)', backgroundColor: 'var(--bg-crema-claro)', borderRadius: '50%' }}
        >
          <ArrowBackIcon />
        </button>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--gris-oscuro)', margin: 0 }}>
            {view === 'menu' ? 'Configuración' :
              view === 'calendar' ? 'Calendarios y feriados' :
                view === 'packs' ? 'Tipificar cupos' :
                  view === 'branches' ? 'Sucursales' : 'Normas de convivencia'}
          </h2>
        </div>
      </div>

      {view === 'menu' && (
        <div className="config-grid">

          {/* Tarjeta Calendario y Feriados */}
          <div className="config-card card-calendar" onClick={() => setView('calendar')}>
            <div className="config-card-icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <h4 className="config-card-title">Calendarios y feriados</h4>
            <div className="config-card-action">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </div>

          {/* Tarjeta Tipificar Cupos */}
          <div className="config-card card-packs" onClick={() => setView('packs')}>
            <div className="config-card-icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </div>
            <h4 className="config-card-title">Tipificar cupos</h4>
            <div className="config-card-action">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </div>

          {/* Tarjeta Sucursales */}
          <div className="config-card card-branches" onClick={() => setView('branches')}>
            <div className="config-card-icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </div>
            <h4 className="config-card-title">Sucursales</h4>
            <div className="config-card-action">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </div>

          {/* Tarjeta Normas de Convivencia */}
          <div className="config-card card-faqs" onClick={() => setView('faqs')}>
            <div className="config-card-icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
            <h4 className="config-card-title">Normas de convivencia</h4>
            <div className="config-card-action">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </div>

        </div>
      )}

      {view === 'calendar' && (
        <div className="stat-card-modern animate-slide-up" style={{ padding: '24px', backgroundColor: 'var(--blanco)', borderRadius: '32px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', color: 'var(--gris-oscuro)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <button onClick={() => {
              if (currentCalendarMonth === 0) { setCurrentCalendarMonth(11); setCurrentCalendarYear(y => y - 1); }
              else setCurrentCalendarMonth(m => m - 1);
            }} className="btn-tuti" style={{ padding: '4px 10px', fontSize: '14px', width: 'auto' }}>&larr;</button>
            <h4 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: 'var(--gris-oscuro)' }}>{monthNames[currentCalendarMonth]} {currentCalendarYear}</h4>
            <button onClick={() => {
              if (currentCalendarMonth === 11) { setCurrentCalendarMonth(0); setCurrentCalendarYear(y => y + 1); }
              else setCurrentCalendarMonth(m => m + 1);
            }} className="btn-tuti" style={{ padding: '4px 10px', fontSize: '14px', width: 'auto' }}>&rarr;</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <div key={i} style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--gris-medio)' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const dateStr = `${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const isNW = nonWorkingDays.find(n => n?.date === dateStr);
              return (
                <div
                  key={d}
                  onClick={() => handleDayClick(dateStr)}
                  style={{
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isNW ? 'var(--rojo-alerta-light)' : 'var(--bg-crema)',
                    color: isNW ? 'var(--rojo-alerta)' : 'var(--gris-oscuro)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: isNW ? 'bold' : 'normal',
                    cursor: 'pointer',
                    border: isNW ? '1px solid var(--rojo-alerta)' : '1px solid var(--gris-claro)'
                  }}
                  title={isNW ? isNW.reason : 'Marcar Feriado'}
                >
                  {d}
                </div>
              );
            })}
          </div>

          {/* LISTA DE FERIADOS ABAJO */}
          {nonWorkingDays.filter(n => n?.date?.startsWith(`${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, '0')}`)).length > 0 && (
            <div style={{ marginTop: '24px', padding: '12px', backgroundColor: 'var(--bg-crema)', borderRadius: '16px' }}>
              <strong style={{ fontSize: '12px', color: 'var(--marron-arcilla)' }}>Días marcados este mes:</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                {nonWorkingDays.filter(n => n?.date?.startsWith(`${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, '0')}`)).map(n => (
                  <div key={n.date} style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--blanco)', padding: '6px 12px', borderRadius: '10px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--gris-oscuro)' }}>{n.date.split('-')[2]} {monthNames[currentCalendarMonth].substring(0, 3)}</span>
                    <span style={{ color: 'var(--gris-medio)', fontSize: '12px', textAlign: 'right' }}>{n.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODAL PARA AGREGAR FERIADO/NO LABORABLE */}
          {showCalendarModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
              <div className="stat-card-modern animate-slide-up" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--blanco)', border: '1px solid var(--gris-claro)', boxShadow: 'var(--shadow-clay)' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--gris-oscuro)' }}>Marcar Día</h3>
                <p style={{ fontSize: '13px', color: 'var(--gris-medio)', margin: '4px 0 16px 0' }}>{selectedDateToMark}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label>Tipo</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'normal', color: 'var(--gris-oscuro)' }}>
                        <input type="radio" checked={holidayType === 'Feriado'} onChange={() => setHolidayType('Feriado')} /> Feriado
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'normal', color: 'var(--gris-oscuro)' }}>
                        <input type="radio" checked={holidayType === 'Día no laborable'} onChange={() => setHolidayType('Día no laborable')} /> Día no laborable
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Motivo (opcional)</label>
                    <input
                      type="text"
                      className="input-tuti"
                      value={holidayReason}
                      onChange={e => setHolidayReason(e.target.value)}
                      placeholder="Ej. Carnaval, Cerrado por duelo..."
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
                  <button className="btn-tuti btn-danger-soft" onClick={() => setShowCalendarModal(false)}>Cancelar</button>
                  <button className="btn-tuti btn-success-soft" onClick={handleSaveCalendarDay}>Guardar</button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {view === 'packs' && (
        <div className="stat-card-modern animate-slide-up" style={{ padding: '24px', backgroundColor: 'var(--blanco)', borderRadius: '32px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', color: 'var(--gris-oscuro)' }}>
          <form onSubmit={handleSavePack} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '1 1 120px' }}>
              <label style={{ fontSize: '11px' }}>Nombre</label>
              <input type="text" className="input-tuti" value={configPackName} onChange={e => setConfigPackName(e.target.value)} placeholder="Ej. Básico" required />
            </div>
            <div className="form-group" style={{ flex: '1 1 80px' }}>
              <label style={{ fontSize: '11px' }}>Créditos</label>
              <input type="number" className="input-tuti" value={configPackCredits} onChange={e => setConfigPackCredits(e.target.value)} required />
            </div>
            <div className="form-group" style={{ flex: '1 1 100px' }}>
              <label style={{ fontSize: '11px' }}>Precio ($)</label>
              <input type="number" className="input-tuti" value={configPackPrice} onChange={e => setConfigPackPrice(e.target.value)} required />
            </div>
            <button type="submit" className="btn-tuti btn-success-soft" style={{ padding: '12px 14px', width: 'auto', flex: '0 0 auto' }}>
              {editingPackId ? <EditIcon style={{ fontSize: '18px' }} /> : <AddIcon style={{ fontSize: '18px' }} />}
            </button>
            {editingPackId && (
              <button type="button" className="btn-tuti btn-danger-soft" onClick={() => { setEditingPackId(null); setConfigPackName(''); setConfigPackCredits(''); setConfigPackPrice(''); }} style={{ padding: '12px 14px', width: 'auto', flex: '0 0 auto' }}>
                <CloseIcon style={{ fontSize: '18px' }} />
              </button>
            )}
          </form>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {packs.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: 'none', borderRadius: '24px', backgroundColor: 'var(--blanco)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{p.name}</h4>
                  <span style={{ fontSize: '12px', color: 'var(--gris-medio)' }}>{p.credits} clases • ${p.price.toLocaleString('es-AR')}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => startEditPack(p)} className="btn-tuti" style={{ padding: '4px 8px', fontSize: '11px', width: 'auto', backgroundColor: 'var(--bg-crema)' }}>Editar</button>
                  <button onClick={() => handleDeletePack(p.id)} className="btn-tuti" style={{ padding: '4px 8px', fontSize: '11px', width: 'auto', backgroundColor: '#fee' }}>Borrar</button>
                </div>
              </div>
            ))}
            {packs.length === 0 && <p style={{ fontSize: '12px', color: 'var(--gris-medio)', textAlign: 'center' }}>No hay packs configurados.</p>}
          </div>
        </div>
      )}

      {view === 'branches' && (
        <div className="stat-card-modern animate-slide-up" style={{ padding: '24px', backgroundColor: 'var(--blanco)', borderRadius: '32px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', color: 'var(--gris-oscuro)' }}>
          <form onSubmit={handleSaveBranch} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '1 1 120px' }}>
              <label style={{ fontSize: '11px' }}>Nombre Sucursal</label>
              <input type="text" className="input-tuti" value={branchName} onChange={e => setBranchName(e.target.value)} placeholder="Ej. CENTRO" required />
            </div>
            <div className="form-group" style={{ flex: '2 1 150px' }}>
              <label style={{ fontSize: '11px' }}>Dirección</label>
              <input type="text" className="input-tuti" value={branchAddress} onChange={e => setBranchAddress(e.target.value)} placeholder="Ej. Belgrano 49" />
            </div>
            <div className="form-group" style={{ flex: '1 1 80px' }}>
              <label style={{ fontSize: '11px' }}>Capacidad</label>
              <input type="number" className="input-tuti" value={branchMaxCapacity} onChange={e => setBranchMaxCapacity(e.target.value)} placeholder="Ej. 120" />
            </div>
            <button type="submit" className="btn-tuti btn-success-soft" style={{ padding: '12px 14px', width: 'auto', flex: '0 0 auto' }}>
              {editingBranchId ? <EditIcon style={{ fontSize: '18px' }} /> : <AddIcon style={{ fontSize: '18px' }} />}
            </button>
            {editingBranchId && (
              <button type="button" className="btn-tuti btn-danger-soft" onClick={() => { setEditingBranchId(null); setBranchName(''); setBranchAddress(''); setBranchMaxCapacity(''); }} style={{ padding: '12px 14px', width: 'auto', flex: '0 0 auto' }}>
                <CloseIcon style={{ fontSize: '18px' }} />
              </button>
            )}
          </form>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {branches.map(b => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: 'none', borderRadius: '24px', backgroundColor: 'var(--blanco)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{b.name}</h4>
                  <span style={{ fontSize: '12px', color: 'var(--gris-medio)' }}>{b.address || 'Sin dirección'} {b.maxCapacity ? `• Cap. Max: ${b.maxCapacity}` : ''}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => startEditBranch(b)} className="btn-tuti" style={{ padding: '4px 8px', fontSize: '11px', width: 'auto', backgroundColor: 'var(--bg-crema)' }}>Editar</button>
                  <button onClick={() => handleDeleteBranch(b.id)} className="btn-tuti" style={{ padding: '4px 8px', fontSize: '11px', width: 'auto', backgroundColor: '#fee' }}>Borrar</button>
                </div>
              </div>
            ))}
            {branches.length === 0 && <p style={{ fontSize: '12px', color: 'var(--gris-medio)', textAlign: 'center' }}>No hay sucursales configuradas.</p>}
          </div>
        </div>
      )}

      {view === 'faqs' && (
        <div className="stat-card-modern animate-slide-up" style={{ padding: '24px', backgroundColor: 'var(--blanco)', borderRadius: '32px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', color: 'var(--gris-oscuro)' }}>
          <form onSubmit={handleSaveFaq} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <div className="form-group">
              <label style={{ fontSize: '11px' }}>Pregunta / Norma</label>
              <input type="text" className="input-tuti" value={faqQuestion} onChange={e => setFaqQuestion(e.target.value)} placeholder="Ej. ¿Cómo recupero una clase?" required />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '11px' }}>Respuesta / Detalle</label>
              <textarea className="input-tuti" value={faqAnswer} onChange={e => setFaqAnswer(e.target.value)} placeholder="Detalle de la norma..." rows="3" required style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              {editingFaqId && (
                <button type="button" className="btn-tuti btn-danger-soft" onClick={() => { setEditingFaqId(null); setFaqQuestion(''); setFaqAnswer(''); }} style={{ padding: '10px 14px', width: 'auto' }}>
                  Cancelar
                </button>
              )}
              <button type="submit" className="btn-tuti btn-success-soft" style={{ padding: '10px 16px', width: 'auto' }}>
                {editingFaqId ? 'Guardar Cambios' : 'Agregar Norma'}
              </button>
            </div>
          </form>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {faqs.map(f => (
              <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', border: 'none', borderRadius: '24px', backgroundColor: 'var(--blanco)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{f.question}</h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--gris-medio)' }}>{f.answer}</p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <button onClick={() => startEditFaq(f)} className="btn-tuti" style={{ padding: '4px 8px', fontSize: '11px', width: 'auto', backgroundColor: 'var(--bg-crema)' }}>Editar</button>
                  <button onClick={() => handleDeleteFaq(f.id)} className="btn-tuti" style={{ padding: '4px 8px', fontSize: '11px', width: 'auto', backgroundColor: '#fee' }}>Borrar</button>
                </div>
              </div>
            ))}
            {faqs.length === 0 && <p style={{ fontSize: '12px', color: 'var(--gris-medio)', textAlign: 'center' }}>No hay normas configuradas.</p>}
          </div>
        </div>
      )}

    </div>
  );
}
