import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [users, setUsers] = useState([]);
  const [studentProfiles, setStudentProfiles] = useState([]);
  const [classes, setClasses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [clayDeliveries, setClayDeliveries] = useState([]);
  const [bakes, setBakes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [nonWorkingDays, setNonWorkingDays] = useState([]);
  const [packs, setPacks] = useState([]);
  const [branches, setBranches] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar todos los datos desde el servicio
  const loadData = async () => {
    setLoading(true);
    try {
      await mockService.initializeDB();
      const loadedUsers = await mockService.getUsers();
      const loadedProfiles = await mockService.getStudentProfiles();
      const loadedClasses = await mockService.getClasses();
      const loadedBookings = await mockService.getBookings();
      const loadedDeliveries = await mockService.getClayDeliveries();
      const loadedBakes = await mockService.getBakes().catch(() => []);
      const loadedPayments = await mockService.getPayments();
      const loadedAlerts = await mockService.getAlerts();
      const loadedNonWorkingDays = await mockService.getNonWorkingDays().catch(() => []);
      const loadedPacks = await mockService.getPacks().catch(() => []);
      const loadedBranches = await mockService.getBranches().catch(() => []);
      const loadedFaqs = await mockService.getFaqs().catch(() => []);

      setUsers(loadedUsers);
      setStudentProfiles(loadedProfiles);
      setClasses(loadedClasses);
      setBookings(loadedBookings);
      setClayDeliveries(loadedDeliveries);
      setBakes(loadedBakes);
      setPayments(loadedPayments);
      setAlerts(loadedAlerts);
      setNonWorkingDays(loadedNonWorkingDays || []);
      setPacks(loadedPacks || []);
      setBranches(loadedBranches || []);
      setFaqs(loadedFaqs || []);

      // Comprobar si hay una sesión guardada en sessionStorage
      const savedUserId = sessionStorage.getItem('tuti_session_user_id');
      if (savedUserId) {
        const savedUser = loadedUsers.find(u => u.id === savedUserId);
        if (savedUser) {
          setCurrentUser(savedUser);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error("Error cargando los datos de la DB simulada:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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

      return newBooking;
    } finally {
      setLoading(false);
    }
  };

  // 2. Cancelar reserva con lógica de 2 horas de límite
  const cancelBooking = async (bookingId, forceLate = false) => {
    setLoading(true);
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error("Reserva no encontrada");

      const classData = classes.find(c => c.id === booking.classId);
      const profile = studentProfiles.find(p => p.studentId === booking.studentId);

      if (!classData || !profile) throw new Error("Datos de perfil o clase inconsistentes");

      // Validar límite de 2 horas
      // Extraemos la hora de inicio de la clase (ej: "18:00 - 20:00" -> "18:00")
      const startTimeStr = classData.time.split(' - ')[0]; // "18:00"
      const [hours, minutes] = startTimeStr.split(':').map(Number);
      
      // Combinamos la fecha de la clase con la hora de inicio
      const classStartDateTime = new Date(booking.date);
      classStartDateTime.setHours(hours, minutes, 0, 0);

      const now = new Date();
      const diffMs = classStartDateTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      const isLateCancellation = forceLate || diffHours < 2;

      if (isLateCancellation) {
        // Cancelación tardía: se cobra la clase (no se devuelven los créditos)
        await mockService.updateBooking(bookingId, { status: 'CANCELLED_LATE' });
        
        // Crear alerta para el administrador
        await mockService.createAlert({
          type: 'LATE_CANCELLATION',
          message: `El alumno ${booking.studentName} realizó una cancelación tardía (menos de 2 horas de anticipación) para "${classData.name}" del ${booking.date} a las ${startTimeStr}. Se debitó el crédito.`
        });
      } else {
        // Cancelación a tiempo: se devuelve el crédito
        await mockService.updateBooking(bookingId, { status: 'CANCELLED' });
        await mockService.updateStudentProfile(booking.studentId, {
          classCredits: profile.classCredits + 1
        });
      }

      // Recargar datos actualizados
      const loadedBookings = await mockService.getBookings();
      setBookings(loadedBookings);
      const loadedProfiles = await mockService.getStudentProfiles();
      setStudentProfiles(loadedProfiles);
      const loadedAlerts = await mockService.getAlerts();
      setAlerts(loadedAlerts);

      return { isLateCancellation };
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

  const confirmPendingPayment = async (paymentId) => {
    setLoading(true);
    try {
      await mockService.confirmPayment(paymentId);
      // Recargar perfiles y pagos
      const loadedProfiles = await mockService.getStudentProfiles();
      setStudentProfiles(loadedProfiles);
      const loadedPayments = await mockService.getPayments();
      setPayments(loadedPayments);
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
        nonWorkingDays,
        packs,
        branches,
        faqs,
        loading,
        loginAction,
        forgotPasswordAction,
        logoutAction,
        changeUserRole,
        changeUser,
        resetDatabase,
        bookClass,
        cancelBooking,
        takeAttendance,
        deliverClayToStudent,
        createBake,
        recordStudentPayment,
        confirmPendingPayment,
        sendTransferReminder,
        requestStudentPayment,
        createNewTurn,
        changeClassTeacher,
        updateTurn,
        deleteTurn,
        bulkAssignClasses,
        createNewUserAction,
        updateUserAction,
        deleteUserAction,
        toggleStudentBlockAction,
        resolveAlertAction,
        addNonWorkingDay,
        deleteNonWorkingDay,
        createPack,
        updatePack,
        deletePack,
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
