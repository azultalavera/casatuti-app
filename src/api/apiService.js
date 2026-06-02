const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper para procesar la respuesta HTTP
const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ocurrió un error en el servidor.');
  }
  return data;
};

export const apiService = {
  // Inicialización (No-op en el backend real, pero probamos conexión)
  initializeDB: async (force = false) => {
    try {
      const res = await fetch(`${API_URL}/classes`);
      return res.ok;
    } catch (e) {
      console.warn('⚠️ No se pudo conectar al backend real. Asegúrate de que el servidor esté corriendo.', e);
      return false;
    }
  },

  // --- USUARIOS ---
  getUsers: async () => {
    const res = await fetch(`${API_URL}/users`);
    return handleResponse(res);
  },

  createUser: async (user) => {
    const res = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    return handleResponse(res);
  },

  recordStudentPayment: async (studentIds, amount, creditsToAdd, date) => {
    const res = await fetch(`${API_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentIds, amount, creditsToAdd, date })
    });
    return handleResponse(res);
  },

  login: async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  updateUserRole: async (userId, newRole) => {
    const res = await fetch(`${API_URL}/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole })
    });
    return handleResponse(res);
  },

  updateUser: async (userId, userData) => {
    const res = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return handleResponse(res);
  },

  deleteUser: async (userId) => {
    const res = await fetch(`${API_URL}/users/${userId}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  toggleStudentBlock: async (studentId, isBlocked) => {
    const res = await fetch(`${API_URL}/students/profiles/${studentId}/block`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isBlocked })
    });
    return handleResponse(res);
  },

  // --- PERFILES DE ESTUDIANTES ---
  getStudentProfiles: async () => {
    const res = await fetch(`${API_URL}/students/profiles`);
    return handleResponse(res);
  },

  updateStudentProfile: async (studentId, updates) => {
    const res = await fetch(`${API_URL}/students/profiles/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        classCredits: updates.classCredits,
        monthlyClayKg: updates.monthlyClayKg,
        lastClayDeliveryDate: updates.lastClayDeliveryDate
      })
    });
    return handleResponse(res);
  },

  // --- CLASES (TURNOS) ---
  getClasses: async () => {
    const res = await fetch(`${API_URL}/classes`);
    return handleResponse(res);
  },

  createClass: async (classData) => {
    const res = await fetch(`${API_URL}/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(classData)
    });
    const classes = await handleResponse(res);
    // Para conservar compatibilidad con el front que espera un objeto individual
    return Array.isArray(classes) ? classes[0] : classes;
  },

  updateClassTeacher: async (classId, teacherId) => {
    const res = await fetch(`${API_URL}/classes/${classId}/teacher`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId })
    });
    return handleResponse(res);
  },

  bulkAssignClassesToTeacher: async (teacherId, classIds) => {
    const res = await fetch(`${API_URL}/teachers/${teacherId}/classes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classIds })
    });
    return handleResponse(res);
  },

  // --- RESERVAS ---
  getBookings: async () => {
    const res = await fetch(`${API_URL}/bookings`);
    return handleResponse(res);
  },

  createBooking: async (bookingData) => {
    const res = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: bookingData.studentId,
        studentName: bookingData.studentName,
        classId: bookingData.classId,
        date: bookingData.date
      })
    });
    return handleResponse(res);
  },

  updateBooking: async (bookingId, updates) => {
    // Si la actualización es para cancelar la clase
    if (updates.status === 'CANCELLED' || updates.status === 'CANCELLED_LATE') {
      const res = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceLate: updates.status === 'CANCELLED_LATE' })
      });
      return handleResponse(res);
    }

    // Si la actualización es de asistencia (Profesor)
    if (updates.status === 'ATTENDED' || updates.status === 'ABSENT') {
      const res = await fetch(`${API_URL}/bookings/${bookingId}/attendance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: updates.status })
      });
      return handleResponse(res);
    }

    throw new Error('Operación de actualización de reserva no soportada en el servidor real.');
  },

  // --- ENTREGAS DE ARCILLA ---
  getClayDeliveries: async () => {
    const res = await fetch(`${API_URL}/clay-deliveries`);
    return handleResponse(res);
  },

  createClayDelivery: async (deliveryData) => {
    const res = await fetch(`${API_URL}/clay-deliveries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: deliveryData.studentId,
        studentName: deliveryData.studentName,
        teacherId: deliveryData.teacherId,
        teacherName: deliveryData.teacherName
      })
    });
    return handleResponse(res);
  },

  // --- PAGOS ---
  getPayments: async () => {
    const res = await fetch(`${API_URL}/payments`);
    return handleResponse(res);
  },

  createPayment: async (paymentData) => {
    const res = await fetch(`${API_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: paymentData.studentId,
        amount: paymentData.amount,
        creditsToAdd: paymentData.classCreditsAdded
      })
    });
    return handleResponse(res);
  },

  requestPayment: async (paymentData) => {
    const res = await fetch(`${API_URL}/payments/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: paymentData.studentId,
        amount: paymentData.amount,
        creditsToAdd: paymentData.classCreditsAdded
      })
    });
    return handleResponse(res);
  },

  confirmPayment: async (paymentId) => {
    const res = await fetch(`${API_URL}/payments/${paymentId}/confirm`, {
      method: 'PUT'
    });
    return handleResponse(res);
  },

  notifyPaymentReminder: async (paymentId) => {
    const res = await fetch(`${API_URL}/payments/${paymentId}/notify`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  // --- ALERTAS ---
  getAlerts: async () => {
    const res = await fetch(`${API_URL}/alerts`);
    return handleResponse(res);
  },

  createAlert: async (alertData) => {
    const res = await fetch(`${API_URL}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertData)
    });
    return handleResponse(res);
  },

  resolveAlert: async (alertId) => {
    const res = await fetch(`${API_URL}/alerts/${alertId}/resolve`, {
      method: 'PUT'
    });
    return handleResponse(res);
  },

  // --- DÍAS NO LABORALES (CALENDARIO) ---
  getNonWorkingDays: async () => {
    const res = await fetch(`${API_URL}/non-working-days`);
    return handleResponse(res);
  },

  addNonWorkingDay: async (fecha, motivo) => {
    const res = await fetch(`${API_URL}/non-working-days`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha, motivo })
    });
    return handleResponse(res);
  },

  deleteNonWorkingDay: async (fecha) => {
    const res = await fetch(`${API_URL}/non-working-days/${fecha}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  // --- PAQUETES DE CREDITOS (PACKS) ---
  getPacks: async () => {
    const res = await fetch(`${API_URL}/packs`);
    return handleResponse(res);
  },

  createPack: async (packData) => {
    const res = await fetch(`${API_URL}/packs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(packData)
    });
    return handleResponse(res);
  },

  updatePack: async (packId, packData) => {
    const res = await fetch(`${API_URL}/packs/${packId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(packData)
    });
    return handleResponse(res);
  },

  deletePack: async (packId) => {
    const res = await fetch(`${API_URL}/packs/${packId}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  // --- SUCURSALES (BRANCHES) ---
  getBranches: async () => {
    const res = await fetch(`${API_URL}/branches`);
    return handleResponse(res);
  },

  createBranch: async (branch) => {
    const res = await fetch(`${API_URL}/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(branch)
    });
    return handleResponse(res);
  },

  updateBranch: async (id, data) => {
    const res = await fetch(`${API_URL}/branches/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  deleteBranch: async (id) => {
    const res = await fetch(`${API_URL}/branches/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  // --- NORMAS (FAQS) ---
  getFaqs: async () => {
    const res = await fetch(`${API_URL}/faqs`);
    return handleResponse(res);
  },

  createFaq: async (faq) => {
    const res = await fetch(`${API_URL}/faqs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(faq)
    });
    return handleResponse(res);
  },

  updateFaq: async (id, data) => {
    const res = await fetch(`${API_URL}/faqs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  deleteFaq: async (id) => {
    const res = await fetch(`${API_URL}/faqs/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  }
};
