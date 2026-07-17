import {
  initialUsers,
  initialStudentProfiles,
  initialClasses,
  initialBookings,
  initialClayDeliveries,
  initialPayments,
  initialAlerts
} from './mockData';

// Utilidad para simular latencia de red de 200ms
const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper para obtener datos de localStorage
const getStorageItem = (key, fallback) => {
  const item = localStorage.getItem(key);
  if (!item) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
  return JSON.parse(item);
};

// Helper para guardar datos en localStorage
const setStorageItem = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const mockService = {
  // Inicialización de la base de datos local
  initializeDB: async (force = false) => {
    await delay(150);
    
    // Si se fuerza o no existe, inicializar con las semillas completas
    if (force || !localStorage.getItem('tuti_users')) {
      setStorageItem('tuti_users', initialUsers);
      setStorageItem('tuti_student_profiles', initialStudentProfiles);
      setStorageItem('tuti_classes', initialClasses);
      setStorageItem('tuti_bookings', initialBookings);
      setStorageItem('tuti_clay_deliveries', initialClayDeliveries);
      setStorageItem('tuti_payments', initialPayments);
      setStorageItem('tuti_alerts', initialAlerts);
      setStorageItem('tuti_branches', [{ id: 'br_1', name: 'CENTRO' }, { id: 'br_2', name: 'ALTO VERDE' }]);
      setStorageItem('tuti_faqs', [
        { id: 'faq_1', question: '¿Cómo recupero una clase?', answer: 'Debes cancelar con 2 horas de anticipación.' },
        { id: 'faq_2', question: '¿Cuánto dura un bloque de arcilla?', answer: 'Depende del tamaño de tus piezas, pero en promedio 4 clases.' }
      ]);
      return true;
    }

    // Si ya existe, hacer un parche pacífico para inyectar contraseñas faltantes o migrar estructura antigua
    try {
      const storedUsers = JSON.parse(localStorage.getItem('tuti_users') || '[]');
      
      // Si hay registros antiguos que no usan la columna id_usuario, forzar re-seeding para migrar limpiamente
      if (storedUsers.length > 0 && !storedUsers[0].id_usuario) {
        setStorageItem('tuti_users', initialUsers);
        setStorageItem('tuti_student_profiles', initialStudentProfiles);
        setStorageItem('tuti_classes', initialClasses);
        setStorageItem('tuti_bookings', initialBookings);
        setStorageItem('tuti_clay_deliveries', initialClayDeliveries);
        setStorageItem('tuti_payments', initialPayments);
        setStorageItem('tuti_alerts', initialAlerts);
        setStorageItem('tuti_branches', [{ id: 'br_1', name: 'CENTRO' }, { id: 'br_2', name: 'ALTO VERDE' }]);
        setStorageItem('tuti_faqs', [
          { id: 'faq_1', question: '¿Cómo recupero una clase?', answer: 'Debes cancelar con 2 horas de anticipación.' },
          { id: 'faq_2', question: '¿Cuánto dura un bloque de arcilla?', answer: 'Depende del tamaño de tus piezas, pero en promedio 4 clases.' }
        ]);
        return true;

      let updated = false;
      const patchedUsers = storedUsers.map(u => {
        if (!u.clave && !u.password) {
          u.clave = 'tuti123';
          updated = true;
        }
        return u;
      });

      // Asegurar que el nuevo administrador admin@tuti.com esté en localStorage con la clave/rol correctos
      const adminIdx = patchedUsers.findIndex(u => u.email.toLowerCase() === 'admin@tuti.com');
      if (adminIdx === -1) {
        patchedUsers.push({
          id_usuario: 'usr_admin_tuti',
          nro_documento: '99001122',
          clave: 'admin',
          email: 'admin@tuti.com',
          google_id: null,
          avatar_url: null,
          nombre: 'Admin',
          apellido: 'Tuti',
          telefono: '777888',
          instagram: 'admin_tuti',
          fecha_nacimiento: '1985-01-01',
          rol: 'ADMIN',
          bl_cambio_pass_pte: false,
          created_at: new Date().toISOString(),
          sucursal: 'CENTRO',
          active: true
        });
        updated = true;
      } else {
        const u = patchedUsers[adminIdx];
        if (u.clave !== 'admin' || u.rol !== 'ADMIN') {
          u.clave = 'admin';
          u.rol = 'ADMIN';
          updated = true;
        }
      }

      if (updated) {
        setStorageItem('tuti_users', patchedUsers);
      }
    } catch (e) {
      console.error("Error al parchar o migrar usuarios con claves de demo:", e);
    }
    
    return false;
  },

  // --- MAPADORES DE ESQUEMA (DATABASE <-> FRONTEND MODEL) ---
  mapUserToFE: (u) => {
    if (!u) return null;
    return {
      id: u.id_usuario || u.id,
      name: u.nombre && u.apellido ? `${u.nombre} ${u.apellido}` : (u.nombre || u.name || 'Usuario'),
      email: u.email,
      password: u.clave || u.password || 'tuti123',
      role: u.rol || u.role || 'ALUMNO',
      active: u.active !== false,
      nro_documento: u.nro_documento || null,
      google_id: u.google_id || null,
      avatar_url: u.avatar_url || null,
      telefono: u.telefono || null,
      instagram: u.instagram || null,
      fecha_nacimiento: u.fecha_nacimiento || null,
      bl_cambio_pass_pte: u.bl_cambio_pass_pte || false,
      sucursal: u.sucursal || 'CENTRO',
      created_at: u.created_at || null
    };
  },

  mapUserToDB: (u) => {
    if (!u) return null;
    const nameStr = u.name || '';
    const [nombre, ...apellidoParts] = nameStr.split(' ');
    const apellido = apellidoParts.join(' ');
    return {
      id_usuario: u.id || `usr_${Date.now()}`,
      nro_documento: u.nro_documento || null,
      clave: u.password || 'tuti123',
      email: u.email,
      google_id: u.google_id || null,
      avatar_url: u.avatar_url || null,
      nombre: nombre || u.nombre || 'Usuario',
      apellido: apellido || u.apellido || '',
      telefono: u.telefono || null,
      instagram: u.instagram || null,
      fecha_nacimiento: u.fecha_nacimiento || null,
      rol: u.role || 'ALUMNO',
      bl_cambio_pass_pte: u.bl_cambio_pass_pte || false,
      created_at: u.created_at || new Date().toISOString(),
      sucursal: u.sucursal || 'CENTRO',
      active: u.active !== false
    };
  },

  // --- USUARIOS ---
  getUsers: async () => {
    await delay();
    const rawUsers = getStorageItem('tuti_users', initialUsers);
    return rawUsers.map(mockService.mapUserToFE);
  },

  createUser: async (user) => {
    await delay();
    const rawUsers = getStorageItem('tuti_users', initialUsers);
    const dbUser = mockService.mapUserToDB({ ...user, id: `usr_${Date.now()}` });
    rawUsers.push(dbUser);
    setStorageItem('tuti_users', rawUsers);

    const feUser = mockService.mapUserToFE(dbUser);

    // Si es un Alumno, le creamos su perfil de créditos
    if (feUser.role === 'ALUMNO') {
      const profiles = getStorageItem('tuti_student_profiles', initialStudentProfiles);
      profiles.push({
        studentId: feUser.id,
        classCredits: 0,
        monthlyClayKg: 0,
        lastClayDeliveryDate: null
      });
      setStorageItem('tuti_student_profiles', profiles);
    }
    return feUser;
  },

  resendWelcomeEmails: async (studentIds) => {
    await delay();
    const rawUsers = getStorageItem('tuti_users', initialUsers);
    let count = 0;
    for (const u of rawUsers) {
      if (studentIds.includes(u.id_usuario)) {
        u.clave = 'tuti123';
        u.bl_cambio_pass_pte = true;
        count++;
      }
    }
    setStorageItem('tuti_users', rawUsers);
    return { success: true, count };
  },

  login: async (email, password) => {
    await delay();
    const rawUsers = getStorageItem('tuti_users', initialUsers);
    const dbUser = rawUsers.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && 
      (u.clave === password || u.password === password || ((!u.clave && !u.password) && password === 'tuti123'))
    );
    if (!dbUser) {
      throw new Error('Credenciales incorrectas. Inténtalo de nuevo.');
    }
    return mockService.mapUserToFE(dbUser);
  },

  updateUserRole: async (userId, newRole) => {
    await delay();
    const rawUsers = getStorageItem('tuti_users', initialUsers);
    const idx = rawUsers.findIndex(u => (u.id_usuario || u.id) === userId);
    if (idx !== -1) {
      rawUsers[idx].rol = newRole;
      setStorageItem('tuti_users', rawUsers);
      return mockService.mapUserToFE(rawUsers[idx]);
    }
    throw new Error('Usuario no encontrado');
  },

  // --- PERFILES DE ESTUDIANTES ---
  getStudentProfiles: async () => {
    await delay();
    return getStorageItem('tuti_student_profiles', initialStudentProfiles);
  },

  updateStudentProfile: async (studentId, updates) => {
    await delay();
    const profiles = getStorageItem('tuti_student_profiles', initialStudentProfiles);
    const idx = profiles.findIndex(p => p.studentId === studentId);
    if (idx !== -1) {
      profiles[idx] = { ...profiles[idx], ...updates };
      setStorageItem('tuti_student_profiles', profiles);
      return profiles[idx];
    }
    throw new Error('Perfil de alumno no encontrado');
  },

  // --- CLASES (TURNOS) ---
  getClasses: async () => {
    await delay();
    return getStorageItem('tuti_classes', initialClasses);
  },

  createClass: async (classData) => {
    await delay();
    const classes = getStorageItem('tuti_classes', initialClasses);
    const newClass = { ...classData, id: `cls_${Date.now()}` };
    classes.push(newClass);
    setStorageItem('tuti_classes', classes);
    return newClass;
  },

  // --- RESERVAS ---
  getBookings: async () => {
    await delay();
    return getStorageItem('tuti_bookings', initialBookings);
  },

  createBooking: async (bookingData) => {
    await delay();
    const bookings = getStorageItem('tuti_bookings', initialBookings);
    const newBooking = { ...bookingData, id: `bk_${Date.now()}` };
    bookings.push(newBooking);
    setStorageItem('tuti_bookings', bookings);
    return newBooking;
  },

  updateBooking: async (bookingId, updates) => {
    await delay();
    const bookings = getStorageItem('tuti_bookings', initialBookings);
    const idx = bookings.findIndex(b => b.id === bookingId);
    if (idx !== -1) {
      bookings[idx] = { ...bookings[idx], ...updates };
      setStorageItem('tuti_bookings', bookings);
      return bookings[idx];
    }
    throw new Error('Reserva no encontrada');
  },

  // --- ENTREGAS DE ARCILLA ---
  getClayDeliveries: async () => {
    await delay();
    return getStorageItem('tuti_clay_deliveries', initialClayDeliveries);
  },

  createClayDelivery: async (deliveryData) => {
    await delay();
    const deliveries = getStorageItem('tuti_clay_deliveries', initialClayDeliveries);
    const newDelivery = { ...deliveryData, id: `clay_${Date.now()}` };
    deliveries.push(newDelivery);
    setStorageItem('tuti_clay_deliveries', deliveries);
    return newDelivery;
  },

  // --- PAGOS ---
  getPayments: async () => {
    await delay();
    return getStorageItem('tuti_payments', initialPayments);
  },

  createPayment: async (paymentData) => {
    await delay();
    const payments = getStorageItem('tuti_payments', initialPayments);
    const newPayment = { ...paymentData, id: `pay_${Date.now()}` };
    payments.push(newPayment);
    setStorageItem('tuti_payments', payments);
    return newPayment;
  },

  // --- ALERTAS ---
  getAlerts: async () => {
    await delay();
    return getStorageItem('tuti_alerts', initialAlerts);
  },

  createAlert: async (alertData) => {
    await delay();
    const alerts = getStorageItem('tuti_alerts', initialAlerts);
    const newAlert = { ...alertData, id: `alt_${Date.now()}`, date: new Date().toISOString(), resolved: false };
    alerts.unshift(newAlert); // Las más nuevas primero
    setStorageItem('tuti_alerts', alerts);
    return newAlert;
  },

  resolveAlert: async (alertId) => {
    await delay();
    const alerts = getStorageItem('tuti_alerts', initialAlerts);
    const idx = alerts.findIndex(a => a.id === alertId);
    if (idx !== -1) {
      alerts[idx].resolved = true;
      setStorageItem('tuti_alerts', alerts);
      return alerts[idx];
    }
    throw new Error('Alerta no encontrada');
  }
  // --- FAQS ---
  getFaqs: async () => {
    await delay();
    return getStorageItem('tuti_faqs', []);
  },
  createFaq: async (faq) => {
    await delay();
    const faqs = getStorageItem('tuti_faqs', []);
    const newFaq = { ...faq, id: `faq_${Date.now()}` };
    faqs.push(newFaq);
    setStorageItem('tuti_faqs', faqs);
    return newFaq;
  },
  updateFaq: async (id, data) => {
    await delay();
    const faqs = getStorageItem('tuti_faqs', []);
    const idx = faqs.findIndex(f => f.id === id);
    if (idx !== -1) {
      faqs[idx] = { ...faqs[idx], ...data };
      setStorageItem('tuti_faqs', faqs);
      return faqs[idx];
    }
    throw new Error('FAQ no encontrada');
  },
  deleteFaq: async (id) => {
    await delay();
    const faqs = getStorageItem('tuti_faqs', []);
    setStorageItem('tuti_faqs', faqs.filter(f => f.id !== id));
  },

  // --- BRANCHES ---
  getBranches: async () => {
    await delay();
    return getStorageItem('tuti_branches', [{ id: 'br_1', name: 'CENTRO' }, { id: 'br_2', name: 'ALTO VERDE' }]);
  },
  createBranch: async (branch) => {
    await delay();
    const branches = getStorageItem('tuti_branches', []);
    const newBranch = { ...branch, id: `br_${Date.now()}` };
    branches.push(newBranch);
    setStorageItem('tuti_branches', branches);
    return newBranch;
  },
  updateBranch: async (id, data) => {
    await delay();
    const branches = getStorageItem('tuti_branches', []);
    const idx = branches.findIndex(b => b.id === id);
    if (idx !== -1) {
      branches[idx] = { ...branches[idx], ...data };
      setStorageItem('tuti_branches', branches);
      return branches[idx];
    }
    throw new Error('Sucursal no encontrada');
  },
  deleteBranch: async (id) => {
    await delay();
    const branches = getStorageItem('tuti_branches', []);
    setStorageItem('tuti_branches', branches.filter(b => b.id !== id));
  }
};
