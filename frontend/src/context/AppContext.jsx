import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { apiService as mockService } from '../api/apiService';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser utilizado dentro de un AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const seenAlertIdsRef = useRef(new Set());
  const [users, setUsers] = useState([]);
  const [studentProfiles, setStudentProfiles] = useState([]);
  const [classes, setClasses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [clayDeliveries, setClayDeliveries] = useState([]);
  const [bakes, setBakes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [nonWorkingDays, setNonWorkingDays] = useState([]);
  const [packs, setPacks] = useState([]);
  const [extras, setExtras] = useState([]);
  const [branches, setBranches] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar todos los datos desde el servicio
  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      await mockService.initializeDB();
      const [
        loadedUsers,
        loadedProfiles,
        loadedClasses,
        loadedBookings,
        loadedDeliveries,
        loadedBakes,
        loadedPayments,
        loadedAlerts,
        loadedWaitlist,
        loadedNonWorkingDays,
        loadedPacks,
        loadedExtras,
        loadedBranches,
        loadedFaqs
      ] = await Promise.all([
        mockService.getUsers().catch(() => ({ error: true })),
        mockService.getStudentProfiles().catch(() => ({ error: true })),
        mockService.getClasses().catch(() => ({ error: true })),
        mockService.getBookings().catch(() => ({ error: true })),
        mockService.getClayDeliveries().catch(() => ({ error: true })),
        mockService.getBakes().catch(() => ({ error: true })),
        mockService.getPayments().catch(() => ({ error: true })),
        mockService.getAlerts().catch(() => ({ error: true })),
        mockService.getWaitlist().catch(() => ({ error: true })),
        mockService.getNonWorkingDays().catch(() => ({ error: true })),
        mockService.getPacks().catch(() => ({ error: true })),
        mockService.getExtras().catch(() => ({ error: true })),
        mockService.getBranches().catch(() => ({ error: true })),
        mockService.getFaqs().catch(() => ({ error: true }))
      ]);

      if (!loadedUsers.error) setUsers(loadedUsers);
      if (!loadedProfiles.error) setStudentProfiles(loadedProfiles);
      if (!loadedClasses.error) setClasses(loadedClasses);
      if (!loadedBookings.error) setBookings(loadedBookings);
      if (!loadedDeliveries.error) setClayDeliveries(loadedDeliveries);
      if (!loadedBakes.error) setBakes(loadedBakes);
      if (!loadedPayments.error) setPayments(loadedPayments);
      if (!loadedAlerts.error) setAlerts(loadedAlerts);
      if (!loadedWaitlist.error) setWaitlist(loadedWaitlist);
      if (!loadedNonWorkingDays.error) setNonWorkingDays(loadedNonWorkingDays || []);
      if (!loadedPacks.error) setPacks(loadedPacks || []);
      if (!loadedExtras.error) setExtras(loadedExtras || []);
      if (!loadedBranches.error) setBranches(loadedBranches || []);
      if (!loadedFaqs.error) setFaqs(loadedFaqs || []);

      // Administrar alertas vistas para no duplicar notificaciones nativas
      if (!loadedAlerts.error) {
        const currentUserId = currentUser?.id || currentUser?.id_usuarios;
        if (!silent) {
          loadedAlerts.forEach(a => seenAlertIdsRef.current.add(a.id));
        } else if (currentUserId) {
          const newAlerts = loadedAlerts.filter(
            a => a.studentId === currentUserId && !a.resolved && !seenAlertIdsRef.current.has(a.id)
          );
          if (newAlerts.length > 0) {
            newAlerts.forEach(alert => {
              seenAlertIdsRef.current.add(alert.id);
              if ('Notification' in window) {
                if (Notification.permission === 'granted') {
                  new Notification('Casa tuti', {
                    body: alert.message,
                    vibrate: [200, 100, 200]
                  });
                } else if (Notification.permission !== 'denied') {
                  Notification.requestPermission().then(perm => {
                    if (perm === 'granted') {
                      new Notification('Casa tuti', {
                        body: alert.message,
                        vibrate: [200, 100, 200]
                      });
                    }
                  });
                }
              }
            });
          }
        }
      }

      // Comprobar si hay una sesión guardada en sessionStorage o actualizar usuario actual en tiempo real
      if (!loadedUsers.error) {
        const savedUserId = sessionStorage.getItem('tuti_session_user_id');
        if (savedUserId) {
          const savedUser = loadedUsers.find(u => u.id?.toString() === savedUserId.toString());
          if (savedUser) {
            setCurrentUser(savedUser);
            setIsAuthenticated(true);
          }
        }
      }
    } catch (error) {
      console.error("Error cargando los datos de la DB simulada:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);

    // Pedir permiso para notificaciones nativas en dispositivo
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    let isPolling = true;
    const pollData = async () => {
      while (isPolling) {
        await new Promise(resolve => setTimeout(resolve, 30000));
        if (isPolling) {
          await loadData(true);
        }
      }
    };
    pollData();

    return () => { isPolling = false; };
  }, []);

  // Login Acción
  const loginAction = async (email, password) => {
    setLoading(true);
    try {
      const user = await mockService.login(email, password);
      setCurrentUser(user);
      setIsAuthenticated(true);
      sessionStorage.setItem('tuti_session_user_id', user.id);
      return user;
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Acción
  const forgotPasswordAction = async (email) => {
    setLoading(true);
    try {
      return await mockService.forgotPassword(email);
    } finally {
      setLoading(false);
    }
  };

  // Logout Acción
  const logoutAction = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('tuti_session_user_id');
  };

  // Cambiar rol de un usuario (para soporte / configurador)
  const changeUserRole = async (userId, newRole) => {
    setLoading(true);
    try {
      const updatedUser = await mockService.updateUserRole(userId, newRole);
      
      // Recargar listado de usuarios
      const loadedUsers = await mockService.getUsers();
      setUsers(loadedUsers);

      // Si el usuario modificado es el actual logueado, actualizamos su rol de inmediato en memoria
      if (currentUser && currentUser.id === userId) {
        setCurrentUser(updatedUser);
      }
      return updatedUser;
    } finally {
      setLoading(false);
    }
  };

  // Cambiar rol secundario de un usuario
  const updateUserSecondaryRole = async (userId, secondaryRole) => {
    setLoading(true);
    try {
      const updatedUser = await mockService.updateUserSecondaryRole(userId, secondaryRole);
      const loadedUsers = await mockService.getUsers();
      setUsers(loadedUsers);
      if (currentUser && currentUser.id === userId) {
        setCurrentUser(updatedUser);
      }
      return updatedUser;
    } finally {
      setLoading(false);
    }
  };

  // Cambiar de perfil (si tiene rol secundario)
  const switchProfile = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const updatedUser = await mockService.switchProfile(currentUser.id);
      setCurrentUser(updatedUser);
      await loadData();
    } catch (err) {
      console.error("Error cambiando de perfil", err);
    } finally {
      setLoading(false);
    }
  };

  // Impersonación: cambiar de usuario
  const changeUser = (userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      sessionStorage.setItem('tuti_session_user_id', user.id);
    }
  };

  // Restablecer base de datos
  const resetDatabase = async () => {
    setLoading(true);
    await mockService.initializeDB(true);
    logoutAction(); // Cerrar sesión tras el reset
    await loadData();
  };

  // --- LÓGICA DE NEGOCIO ---

  // 1. Reservar clase
  const bookClass = async (classId, dateStr) => {
    setLoading(true);
    try {
      const studentId = currentUser.id;
      const studentName = currentUser.name;
      const profile = studentProfiles.find(p => p.studentId === studentId);
      const classData = classes.find(c => c.id === classId);

      if (!profile || !classData) {
        throw new Error("Datos incorrectos");
      }

      // Validar si la clase está pausada para esta fecha
      if (classData.pausedDates && classData.pausedDates.includes(dateStr)) {
        throw new Error("Este turno se encuentra pausado para la fecha seleccionada.");
      }

      // Validar si la cuenta está pausada
      if (profile.isBlocked) {
        throw new Error("Tu cuenta está pausada. No puedes realizar nuevas reservas.");
      }

      // Validar créditos de clase del alumno
      if (profile.classCredits <= 0) {
        // Crear alerta de negocio para el admin
        await mockService.createAlert({
          type: 'NO_CREDITS',
          message: `El alumno ${studentName} intentó reservar "${classData.name}" (${classData.day} - ${classData.time}) pero no tiene créditos de clase.`
        });
        // Recargar alertas en el estado
        const loadedAlerts = await mockService.getAlerts();
        setAlerts(loadedAlerts);
        throw new Error("No tienes créditos de clase disponibles. Contacta al administrador.");
      }

      // Validar reservas ya existentes para el mismo alumno en la misma clase y fecha
      const existingBooking = bookings.find(
        b => b.studentId === studentId && b.classId === classId && b.date === dateStr && b.status !== 'CANCELLED'
      );
      if (existingBooking) {
        throw new Error("Ya tienes una reserva activa para esta clase en esa fecha.");
      }

      // Validar cupos ocupados para esa fecha
      const activeBookingsForClass = bookings.filter(
        b => b.classId === classId && b.date === dateStr && (b.status === 'CONFIRMED' || b.status === 'ATTENDED')
      );

      if (activeBookingsForClass.length >= classData.capacity) {
        throw new Error("Esta clase ya no tiene cupos disponibles para la fecha seleccionada.");
      }

      // Crear la reserva
      const newBooking = await mockService.createBooking({
        studentId,
        studentName,
        classId,
        date: dateStr,
        status: 'CONFIRMED'
      });

      // 3. Notificar a la alumna
      await mockService.createAlert({
        type: 'INFO',
        message: `Te agregaron a la clase "${classData.name}" del día ${dateStr} (${classData.time}). Se ha descontado 1 crédito.`,
        studentId: studentId
      });

      // Si el cupo queda crítico (0 o 1 lugar libre), creamos una alerta de alta ocupación
      const newOccupancy = activeBookingsForClass.length + 1;
      if (classData.capacity - newOccupancy <= 1) {
        await mockService.createAlert({
          type: 'HIGH_OCCUPANCY',
          message: `La clase "${classData.name}" del ${classData.day} ${dateStr} (${classData.time}) tiene cupo crítico: solo queda ${classData.capacity - newOccupancy} lugar(es) libre(s).`
        });
      }

      // Recargar datos actualizados
      const loadedBookings = await mockService.getBookings();
      setBookings(loadedBookings);
      const loadedAlerts = await mockService.getAlerts();
      setAlerts(loadedAlerts);
      const loadedProfiles = await mockService.getStudentProfiles();
      setStudentProfiles(loadedProfiles);
      const loadedWaitlist = await mockService.getWaitlist().catch(() => []);
      setWaitlist(loadedWaitlist);

      return newBooking;
    } finally {
      setLoading(false);
    }
  };

  // 1b. Reservar clase para otro alumno (por el profesor)
  const bookClassForStudent = async (studentId, classId, dateStr) => {
    setLoading(true);
    try {
      const student = users.find(u => u.id === studentId);
      if (!student) throw new Error("Alumno no encontrado");
      const studentName = student.name;
      
      const profile = studentProfiles.find(p => p.studentId === studentId);
      const classData = classes.find(c => c.id === classId);

      if (!profile || !classData) {
        throw new Error("Datos incorrectos");
      }

      // Validar si la clase está pausada para esta fecha
      if (classData.pausedDates && classData.pausedDates.includes(dateStr)) {
        throw new Error("Este turno se encuentra pausado para la fecha seleccionada.");
      }

      // Validar si la cuenta está pausada
      if (profile.isBlocked) {
        throw new Error("La cuenta del alumno está pausada. No puedes realizar reservas.");
      }

      // Validar créditos de clase del alumno
      if (profile.classCredits <= 0) {
        throw new Error("La alumna no tiene créditos de clase disponibles.");
      }

      // Validar reservas ya existentes para el mismo alumno en la misma clase y fecha
      const existingBooking = bookings.find(
        b => b.studentId === studentId && b.classId === classId && b.date === dateStr && (b.status === 'CONFIRMED' || b.status === 'ATTENDED')
      );
      if (existingBooking) {
        throw new Error("La alumna ya se encuentra inscripta en esta clase.");
      }

      // Validar cupo
      const activeBookingsForClass = bookings.filter(b => b.classId === classId && b.date === dateStr && (b.status === 'CONFIRMED' || b.status === 'ATTENDED'));
      if (activeBookingsForClass.length >= classData.capacity) {
        throw new Error("No hay cupo disponible en esta clase.");
      }

      // 1. Crear la reserva en backend (simulado o real)
      const newBooking = await mockService.createBooking({
        studentId,
        studentName,
        classId,
        date: dateStr,
        status: 'CONFIRMED'
      });
      
      // 3. Notificar a la alumna
      await mockService.createAlert({
        type: 'INFO',
        message: `Te agregaron a la clase "${classData.name}" del día ${dateStr} (${classData.time}). Se ha descontado 1 crédito.`,
        studentId: studentId
      });

      // Recargar datos actualizados
      const loadedBookings = await mockService.getBookings();
      setBookings(loadedBookings);
      const loadedAlerts = await mockService.getAlerts();
      setAlerts(loadedAlerts);
      const loadedProfiles = await mockService.getStudentProfiles();
      setStudentProfiles(loadedProfiles);
      
      return newBooking;
    } finally {
      setLoading(false);
    }
  };

  // 2. Cancelar reserva delegando la lógica al backend
  const cancelBooking = async (bookingId, forceLate = false, forceRefund = false) => {
    setLoading(true);
    try {
      // Llamada al backend real para procesar la cancelación. El backend calcula las 2 horas y devuelve los créditos si corresponde.
      const response = await mockService.updateBooking(bookingId, { 
        status: forceLate ? 'CANCELLED_LATE' : forceRefund ? 'CANCELLED_REFUND' : 'CANCELLED' 
      });

      // Recargar datos actualizados desde el backend
      const loadedBookings = await mockService.getBookings();
      setBookings(loadedBookings);
      const loadedProfiles = await mockService.getStudentProfiles();
      setStudentProfiles(loadedProfiles);
      const loadedAlerts = await mockService.getAlerts();
      setAlerts(loadedAlerts);
      
      // La respuesta del backend debería indicar si fue tardía
      return { isLateCancellation: response.isLateCancellation };
    } catch (error) {
      console.error('Error al cancelar reserva:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const rescheduleBooking = async (bookingId, newClassId, newDateStr) => {
    setLoading(true);
    try {
      await mockService.rescheduleBooking(bookingId, newClassId, newDateStr);

      // Recargar datos actualizados
      const loadedBookings = await mockService.getBookings();
      setBookings(loadedBookings);
      const loadedAlerts = await mockService.getAlerts();
      setAlerts(loadedAlerts);
      const loadedProfiles = await mockService.getStudentProfiles();
      setStudentProfiles(loadedProfiles);
      const loadedWaitlist = await mockService.getWaitlist().catch(() => []);
      setWaitlist(loadedWaitlist);
      return true;
    } finally {
      setLoading(false);
    }
  };

  // Agregar a la lista de espera
  const joinWaitlistAction = async (classId, dateStr) => {
    setLoading(true);
    try {
      const studentId = currentUser.id;
      await mockService.joinWaitlist({
        studentId,
        classId,
        date: dateStr
      });
      const loadedWaitlist = await mockService.getWaitlist().catch(() => []);
      setWaitlist(loadedWaitlist);
    } finally {
      setLoading(false);
    }
  };

  // 3. Tomar asistencia por el profesor
  const takeAttendance = async (bookingId, attendanceStatus) => {
    setLoading(true);
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error("Reserva no encontrada");

      const studentId = booking.studentId;
      const profile = studentProfiles.find(p => p.studentId === studentId);
      if (!profile) throw new Error("Perfil de estudiante no encontrado");

      if (attendanceStatus === 'ATTENDED') {
        // Al marcar Presente:
        // Si el estado anterior no era ya ATTENDED, descontamos 1 crédito
        if (booking.status !== 'ATTENDED') {
          // Descontar crédito de clase del perfil
          const newCredits = Math.max(0, profile.classCredits - 1);
          await mockService.updateStudentProfile(studentId, { classCredits: newCredits });
        }
        await mockService.updateBooking(bookingId, { status: 'ATTENDED' });
      } else if (attendanceStatus === 'ABSENT') {
        // Al marcar Ausente:
        // Se actualiza el estado de la reserva a ABSENT, lo cual libera el cupo para esa clase.
        // Nota: en este taller, la inasistencia se registra y la clase queda liberada.
        await mockService.updateBooking(bookingId, { status: 'ABSENT' });
      }

      // Recargar datos actualizados
      const loadedBookings = await mockService.getBookings();
      setBookings(loadedBookings);
      const loadedProfiles = await mockService.getStudentProfiles();
      setStudentProfiles(loadedProfiles);
    } finally {
      setLoading(false);
    }
  };

  // 4. Entrega de arcilla por el profesor durante la clase
  const deliverClayToStudent = async (studentId, studentName, teacherId, teacherName) => {
    setLoading(true);
    try {
      const profile = studentProfiles.find(p => p.studentId === studentId);
      if (!profile) throw new Error("Perfil de estudiante no encontrado");

      // Validar límite estricto de 1kg al mes
      if (profile.monthlyClayKg >= 1.0) {
        // Generar alerta para el admin
        await mockService.createAlert({
          type: 'CLAY_LIMIT',
          message: `El alumno ${studentName} intentó retirar otro bloque de arcilla de 1kg en este mes, pero ya alcanzó su límite mensual.`
        });
        const loadedAlerts = await mockService.getAlerts();
        setAlerts(loadedAlerts);
        throw new Error("Límite mensual de arcilla alcanzado (1kg por mes). No se puede entregar más arcilla.");
      }

      const todayStr = new Date().toISOString().split('T')[0];

      // Registrar entrega en la lista de entregas
      await mockService.createClayDelivery({
        studentId,
        studentName,
        teacherId,
        teacherName,
        date: todayStr,
        quantityKg: 1.0
      });

      // Actualizar perfil de estudiante
      await mockService.updateStudentProfile(studentId, {
        monthlyClayKg: profile.monthlyClayKg + 1.0,
        lastClayDeliveryDate: todayStr
      });

      // Recargar datos
      const loadedProfiles = await mockService.getStudentProfiles();
      setStudentProfiles(loadedProfiles);
      const loadedDeliveries = await mockService.getClayDeliveries();
      setClayDeliveries(loadedDeliveries);
    } finally {
      setLoading(false);
    }
  };

  // 5. Registrar pago manual e incrementar créditos por el ADMIN
  const recordStudentPayment = async (studentIds, amount, creditsToAdd, paymentDate) => {
    setLoading(true);
    try {
      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        throw new Error("Debe seleccionar al menos un estudiante");
      }

      // El backend ahora se encarga de crear el pago y actualizar los saldos
      await mockService.recordStudentPayment(studentIds, amount, creditsToAdd, paymentDate);

      // Recargar datos
      const loadedProfiles = await mockService.getStudentProfiles();
      setStudentProfiles(loadedProfiles);
      const loadedPayments = await mockService.getPayments();
      setPayments(loadedPayments);
    } finally {
      setLoading(false);
    }
  };

  const confirmPendingPayment = async (paymentId, confirmationDate) => {
    setLoading(true);
    try {
      await mockService.confirmPayment(paymentId, confirmationDate);
      // Recargar perfiles y pagos
      const loadedProfiles = await mockService.getStudentProfiles();
      setStudentProfiles(loadedProfiles);
      const loadedPayments = await mockService.getPayments();
      setPayments(loadedPayments);
    } finally {
      setLoading(false);
    }
  };

  const confirmInsumoPayment = async (insumoId) => {
    setLoading(true);
    try {
      await mockService.confirmInsumoPayment(insumoId);
      // Recargar insumos
      const loadedBakes = await mockService.getBakes();
      setBakes(loadedBakes);
    } finally {
      setLoading(false);
    }
  };

  const sendTransferReminder = async (paymentId) => {
    setLoading(true);
    try {
      await mockService.notifyPaymentReminder(paymentId);
    } finally {
      setLoading(false);
    }
  };

  const requestStudentPayment = async (studentId, amount, creditsToAdd) => {
    setLoading(true);
    try {
      await mockService.requestPayment({ studentId, amount, classCreditsAdded: creditsToAdd });
      // Reload payments immediately so that if the user refreshes or switches to admin they see it
      const loadedPayments = await mockService.getPayments();
      setPayments(loadedPayments);
    } finally {
      setLoading(false);
    }
  };

  // 6. Crear un nuevo turno (clase) con opción de repetición semanal por el ADMIN
  const createNewTurn = async (classData, repeatDays) => {
    setLoading(true);
    try {
      const generatedClasses = [];
      if (repeatDays && repeatDays.length > 0) {
        // Crear una instancia de clase para cada día de la semana seleccionado
        for (const day of repeatDays) {
          const newCls = await mockService.createClass({
            name: classData.name,
            teacherId: classData.teacherId,
            teacherName: classData.teacherName,
            day: day,
            time: classData.time,
            capacity: classData.capacity,
            sucursal: classData.sucursal
          });
          generatedClasses.push(newCls);
        }
      } else {
        // Crear solo una instancia con el día que tenga por defecto
        const newCls = await mockService.createClass({
          name: classData.name,
          teacherId: classData.teacherId,
          teacherName: classData.teacherName,
          day: classData.day,
          time: classData.time,
          capacity: classData.capacity,
          sucursal: classData.sucursal
        });
        generatedClasses.push(newCls);
      }

      // Recargar datos
      const loadedClasses = await mockService.getClasses();
      setClasses(loadedClasses);
      return generatedClasses;
    } finally {
      setLoading(false);
    }
  };

  const changeClassTeacher = async (classId, teacherId) => {
    setLoading(true);
    try {
      await mockService.updateClassTeacher(classId, teacherId);
      const loadedClasses = await mockService.getClasses();
      setClasses(loadedClasses);
    } finally {
      setLoading(false);
    }
  };

  const updateTurn = async (classId, classData) => {
    setLoading(true);
    try {
      await mockService.updateClass(classId, classData);
      const loadedClasses = await mockService.getClasses();
      setClasses(loadedClasses);
    } finally {
      setLoading(false);
    }
  };

  const deleteTurn = async (classId) => {
    setLoading(true);
    try {
      await mockService.deleteClass(classId);
      const loadedClasses = await mockService.getClasses();
      setClasses(loadedClasses);
    } finally {
      setLoading(false);
    }
  };

  const toggleClassPauseAction = async (classId, dateStr, isPaused) => {
    setLoading(true);
    try {
      await mockService.toggleClassPause(classId, dateStr, isPaused);
      
      // Recargar clases y reservas porque si se pausó, se cancelaron reservas
      const loadedClasses = await mockService.getClasses();
      setClasses(loadedClasses);
      const loadedBookings = await mockService.getBookings();
      setBookings(loadedBookings);
      const loadedProfiles = await mockService.getStudentProfiles();
      setStudentProfiles(loadedProfiles);
    } finally {
      setLoading(false);
    }
  };

  const bulkAssignClasses = async (teacherId, classIds) => {
    setLoading(true);
    try {
      await mockService.bulkAssignClassesToTeacher(teacherId, classIds);
      const loadedClasses = await mockService.getClasses();
      setClasses(loadedClasses);
    } finally {
      setLoading(false);
    }
  };

  const createBake = async (bakeData) => {
    setLoading(true);
    try {
      await mockService.createBake(bakeData);
      setBakes(await mockService.getBakes());
    } finally {
      setLoading(false);
    }
  };

  const createExtraClay = async (clayData) => {
    setLoading(true);
    try {
      await mockService.createExtraClay(clayData);
      setBakes(await mockService.getBakes());
    } finally {
      setLoading(false);
    }
  };

  // 7. Crear un nuevo estudiante o profesor por el ADMIN
  const createNewUserAction = async (userData) => {
    setLoading(true);
    try {
      const newUser = await mockService.createUser(userData);
      const loadedUsers = await mockService.getUsers();
      setUsers(loadedUsers);
      const loadedProfiles = await mockService.getStudentProfiles();
      setStudentProfiles(loadedProfiles);
      return newUser;
    } finally {
      setLoading(false);
    }
  };

  const resendWelcomeEmailsAction = async (studentIds) => {
    setLoading(true);
    try {
      const result = await mockService.resendWelcomeEmails(studentIds);
      const loadedUsers = await mockService.getUsers();
      setUsers(loadedUsers);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const updateUserAction = async (userId, userData) => {
    setLoading(true);
    try {
      const updatedUser = await mockService.updateUser(userId, userData);
      const loadedUsers = await mockService.getUsers();
      setUsers(loadedUsers);
      const loadedProfiles = await mockService.getStudentProfiles();
      setStudentProfiles(loadedProfiles);

      if (currentUser && currentUser.id === userId) {
        setCurrentUser(updatedUser);
      }
      return updatedUser;
    } finally {
      setLoading(false);
    }
  };

  const updateUserPasswordAction = async (userId, currentPassword, newPassword) => {
    setLoading(true);
    try {
      await mockService.updateUserPassword(userId, currentPassword, newPassword);
      return true;
    } finally {
      setLoading(false);
    }
  };

  const deleteUserAction = async (userId) => {
    setLoading(true);
    try {
      await mockService.deleteUser(userId);
      const loadedUsers = await mockService.getUsers();
      setUsers(loadedUsers);
      const loadedProfiles = await mockService.getStudentProfiles();
      setStudentProfiles(loadedProfiles);
    } finally {
      setLoading(false);
    }
  };

  const toggleStudentBlockAction = async (studentId, isBlocked) => {
    setLoading(true);
    try {
      await mockService.toggleStudentBlock(studentId, isBlocked);
      const loadedProfiles = await mockService.getStudentProfiles();
      setStudentProfiles(loadedProfiles);
    } finally {
      setLoading(false);
    }
  };

  const requestClassPauseAction = async (classId, className, dateStr, teacherName) => {
    setLoading(true);
    try {
      await mockService.createAlert({
        type: 'PAUSE_REQUEST',
        message: `El profesor/a ${teacherName} solicitó pausar la clase "${className}" del día ${dateStr.split('-').reverse().join('/')}.`,
        metadata: { classId, className, dateStr, teacherName }
      });
      const loadedAlerts = await mockService.getAlerts();
      setAlerts(loadedAlerts);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseRequestAction = async (alertId, accept, metadata) => {
    setLoading(true);
    try {
      if (accept && metadata) {
        await mockService.toggleClassPause(metadata.classId, metadata.dateStr, true);
      }
      await mockService.resolveAlert(alertId);
      const loadedAlerts = await mockService.getAlerts();
      setAlerts(loadedAlerts);
      
      // Reload classes if accepted
      if (accept) {
        const loadedClasses = await mockService.getClasses();
        setClasses(loadedClasses);
      }
    } finally {
      setLoading(false);
    }
  };

  // 8. Marcar resuelta una alerta
  const resolveAlertAction = async (alertId) => {
    setLoading(true);
    try {
      await mockService.resolveAlert(alertId);
      const loadedAlerts = await mockService.getAlerts();
      setAlerts(loadedAlerts);
    } finally {
      setLoading(false);
    }
  };

  const resolveAllAlertsAction = async (alertIds) => {
    setLoading(true);
    try {
      await Promise.all(alertIds.map(id => mockService.resolveAlert(id)));
      const loadedAlerts = await mockService.getAlerts();
      setAlerts(loadedAlerts);
    } catch (error) {
      console.error("Error al resolver alertas:", error);
    } finally {
      setLoading(false);
    }
  };

  // 9. Días no laborales (Calendario)
  const addNonWorkingDay = async (fecha, motivo) => {
    setLoading(true);
    try {
      await mockService.addNonWorkingDay(fecha, motivo);
      const loaded = await mockService.getNonWorkingDays();
      setNonWorkingDays(loaded);
    } finally {
      setLoading(false);
    }
  };

  const deleteNonWorkingDay = async (fecha) => {
    setLoading(true);
    try {
      await mockService.deleteNonWorkingDay(fecha);
      const loaded = await mockService.getNonWorkingDays();
      setNonWorkingDays(loaded);
    } finally {
      setLoading(false);
    }
  };

  // --- GESTIÓN DE PAQUETES ---
  const createPack = async (packData) => {
    setLoading(true);
    try {
      await mockService.createPack(packData);
      const loadedPacks = await mockService.getPacks();
      setPacks(loadedPacks);
    } finally {
      setLoading(false);
    }
  };

  const updatePack = async (packId, packData) => {
    setLoading(true);
    try {
      await mockService.updatePack(packId, packData);
      const loadedPacks = await mockService.getPacks();
      setPacks(loadedPacks);
    } finally {
      setLoading(false);
    }
  };

  const deletePack = async (packId) => {
    setLoading(true);
    try {
      await mockService.deletePack(packId);
      const loadedPacks = await mockService.getPacks();
      setPacks(loadedPacks);
    } catch (error) {
      console.error('Error al eliminar paquete:', error);
      throw error;
    }
  };

  // --- Extras ---
  const reloadExtras = async () => {
    try {
      const loadedExtras = await mockService.getExtras();
      setExtras(loadedExtras);
    } catch (error) {
      console.error('Error al recargar extras:', error);
    }
  };

  const createExtra = async (extraData) => {
    try {
      await mockService.createExtra(extraData);
      await reloadExtras();
    } catch (error) {
      console.error('Error al crear extra:', error);
      throw error;
    }
  };

  const updateExtra = async (extraId, extraData) => {
    try {
      await mockService.updateExtra(extraId, extraData);
      await reloadExtras();
    } catch (error) {
      console.error('Error al actualizar extra:', error);
      throw error;
    }
  };

  const deleteExtra = async (extraId) => {
    try {
      await mockService.deleteExtra(extraId);
      await reloadExtras();
    } finally {
      setLoading(false);
    }
  };

  // --- FAQS CRUD ---
  const createFaq = async (faq) => {
    setLoading(true);
    try {
      await mockService.createFaq(faq);
      setFaqs(await mockService.getFaqs());
    } finally { setLoading(false); }
  };
  const updateFaq = async (id, data) => {
    setLoading(true);
    try {
      await mockService.updateFaq(id, data);
      setFaqs(await mockService.getFaqs());
    } finally { setLoading(false); }
  };
  const deleteFaq = async (id) => {
    setLoading(true);
    try {
      await mockService.deleteFaq(id);
      setFaqs(await mockService.getFaqs());
    } finally { setLoading(false); }
  };

  // --- BRANCHES CRUD ---
  const createBranch = async (branch) => {
    setLoading(true);
    try {
      await mockService.createBranch(branch);
      setBranches(await mockService.getBranches());
    } finally { setLoading(false); }
  };
  const updateBranch = async (id, data) => {
    setLoading(true);
    try {
      await mockService.updateBranch(id, data);
      setBranches(await mockService.getBranches());
    } finally { setLoading(false); }
  };
  const deleteBranch = async (id) => {
    setLoading(true);
    try {
      await mockService.deleteBranch(id);
      setBranches(await mockService.getBranches());
    } finally { setLoading(false); }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        users,
        studentProfiles,
        classes,
        bookings,
        clayDeliveries,
        bakes,
        payments,
        alerts,
        waitlist,
        nonWorkingDays,
        packs,
        extras,
        branches,
        faqs,
        loading,
        loginAction,
        forgotPasswordAction,
        logoutAction,
        changeUserRole,
        updateUserSecondaryRole,
        switchProfile,
        changeUser,
        resetDatabase,
        // Student Actions
        bookClass,
        bookClassForStudent,
        createExtraClay,
        cancelBooking,
        rescheduleBooking,
        joinWaitlistAction,
        takeAttendance,
        deliverClayToStudent,
        createBake,
        recordStudentPayment,
        confirmPendingPayment,
        confirmInsumoPayment,
        sendTransferReminder,
        requestStudentPayment,
        createNewTurn,
        changeClassTeacher,
        updateTurn,
        deleteTurn,
        toggleClassPauseAction,
        bulkAssignClasses,
        createNewUserAction,
        updateUserAction,
        updateUserPasswordAction,
        resendWelcomeEmailsAction,
        deleteUserAction,
        toggleStudentBlockAction,
        requestClassPauseAction,
        handlePauseRequestAction,
        resolveAlertAction,
        resolveAllAlertsAction,
        addNonWorkingDay,
        deleteNonWorkingDay,
        createPack,
        updatePack,
        deletePack,
        createExtra,
        updateExtra,
        deleteExtra,
        createFaq,
        updateFaq,
        deleteFaq,
        createBranch,
        updateBranch,
        deleteBranch,
        reloadAllData: loadData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
