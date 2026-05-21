export const initialUsers = [
  {
    id_usuario: 'usr_admin_admin',
    nro_documento: '00000000',
    clave: 'admin',
    email: 'admin',
    google_id: null,
    avatar_url: null,
    nombre: 'Admin',
    apellido: 'Admin',
    telefono: '000000',
    instagram: 'admin',
    fecha_nacimiento: '1990-01-01',
    rol: 'ADMIN',
    bl_cambio_pass_pte: false,
    created_at: '2026-05-21 12:00:00+00',
    sucursal: 'CENTRO',
    active: true
  },
  {
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
    created_at: '2026-05-21 12:00:00+00',
    sucursal: 'CENTRO',
    active: true
  },
  {
    id_usuario: 'usr_admin',
    nro_documento: '11223344',
    clave: 'tuti123',
    email: 'tuti@casatuti.com',
    google_id: null,
    avatar_url: null,
    nombre: 'Tuti',
    apellido: 'Admin',
    telefono: '123456',
    instagram: 'casatuti',
    fecha_nacimiento: '1990-01-01',
    rol: 'ADMIN',
    bl_cambio_pass_pte: false,
    created_at: '2026-05-16 12:00:00+00',
    sucursal: 'CENTRO',
    active: true
  },
  {
    id_usuario: 'usr_profe_lorena',
    nro_documento: '22334455',
    clave: 'tuti123',
    email: 'lorena@casatuti.com',
    google_id: null,
    avatar_url: null,
    nombre: 'Lorena',
    apellido: 'Profe',
    telefono: '654321',
    instagram: 'lore_cerámica',
    fecha_nacimiento: '1988-05-10',
    rol: 'PROFE',
    bl_cambio_pass_pte: false,
    created_at: '2026-05-16 12:00:00+00',
    sucursal: 'CENTRO',
    active: true
  },
  {
    id_usuario: 'usr_profe_carlos',
    nro_documento: '33445566',
    clave: 'tuti123',
    email: 'carlos@casatuti.com',
    google_id: null,
    avatar_url: null,
    nombre: 'Carlos',
    apellido: 'Profe',
    telefono: '987654',
    instagram: 'carlos_torno',
    fecha_nacimiento: '1985-09-15',
    rol: 'PROFE',
    bl_cambio_pass_pte: false,
    created_at: '2026-05-16 12:00:00+00',
    sucursal: 'ALTO VERDE',
    active: true
  },
  {
    id_usuario: 'usr_alumno_azul',
    nro_documento: '44556677',
    clave: 'tuti123',
    email: 'azul@alumno.com',
    google_id: null,
    avatar_url: null,
    nombre: 'Azul',
    apellido: 'Estudiante',
    telefono: '112233',
    instagram: 'azul_tutera',
    fecha_nacimiento: '1995-12-05',
    rol: 'ALUMNO',
    bl_cambio_pass_pte: false,
    created_at: '2026-05-16 12:00:00+00',
    sucursal: 'CENTRO',
    active: true
  },
  // --- USUARIOS REALES DESDE LA BASE DE DATOS DE PRODUCTION ---
  {
    id_usuario: 'f268d571-625a-4059-90e0-18f6dbcc9f3f',
    nro_documento: '55667788',
    clave: null, // Inicia sesión con 'tuti123' por fallback
    email: 'test_new@test.com',
    google_id: null,
    avatar_url: null,
    nombre: 'Florencia',
    apellido: 'Test',
    telefono: null,
    instagram: null,
    fecha_nacimiento: null,
    rol: 'ALUMNO',
    bl_cambio_pass_pte: true,
    created_at: '2026-05-16 15:01:50.806038+00',
    sucursal: 'CENTRO',
    active: true
  },
  {
    id_usuario: 'c145d93c-88a8-43fe-b337-696a6d8aba98',
    nro_documento: '43449999',
    clave: null,
    email: 'julietamormino1@gmail.com',
    google_id: null,
    avatar_url: null,
    nombre: 'Julieta',
    apellido: 'Amormino',
    telefono: null,
    instagram: 'julietaamormino',
    fecha_nacimiento: '2001-06-27',
    rol: 'ALUMNO',
    bl_cambio_pass_pte: true,
    created_at: '2026-05-16 15:02:49.035339+00',
    sucursal: 'ALTO VERDE',
    active: true
  },
  {
    id_usuario: '5b5b23f1-db79-426e-9400-daff46da6939',
    nro_documento: '41087061',
    clave: null,
    email: 'bruno@gmail.com',
    google_id: null,
    avatar_url: null,
    nombre: 'bruno',
    apellido: 'aresu barella',
    telefono: '12346',
    instagram: 'itsmebrunito',
    fecha_nacimiento: '1998-03-30',
    rol: 'ALUMNO',
    bl_cambio_pass_pte: true,
    created_at: '2026-05-18 00:28:13.427447+00',
    sucursal: 'ALTO VERDE',
    active: true
  },
  {
    id_usuario: 'usr_soporte',
    nro_documento: '99999999',
    clave: 'tuti123',
    email: 'soporte@casatuti.com',
    google_id: null,
    avatar_url: null,
    nombre: 'Soporte',
    apellido: 'Técnico',
    telefono: '000000',
    instagram: null,
    fecha_nacimiento: '1990-01-01',
    rol: 'CONFIGURADOR',
    bl_cambio_pass_pte: false,
    created_at: '2026-05-16 12:00:00+00',
    sucursal: 'CENTRO',
    active: true
  }
];

export const initialStudentProfiles = [
  { studentId: 'usr_alumno_azul', classCredits: 4, monthlyClayKg: 0, lastClayDeliveryDate: null },
  { studentId: 'f268d571-625a-4059-90e0-18f6dbcc9f3f', classCredits: 0, monthlyClayKg: 1.0, lastClayDeliveryDate: '2026-05-15' },
  { studentId: 'c145d93c-88a8-43fe-b337-696a6d8aba98', classCredits: 2, monthlyClayKg: 0, lastClayDeliveryDate: null },
  { studentId: '5b5b23f1-db79-426e-9400-daff46da6939', classCredits: 3, monthlyClayKg: 0, lastClayDeliveryDate: null }
];

export const initialClasses = [
  { id: 'cls_1', name: 'Taller de Torno', teacherId: 'usr_profe_carlos', teacherName: 'Carlos', day: 'Sábado', time: '10:00 - 12:00', capacity: 8 },
  { id: 'cls_2', name: 'Modelado Manual', teacherId: 'usr_profe_lorena', teacherName: 'Lorena', day: 'Martes', time: '18:00 - 20:00', capacity: 6 },
  { id: 'cls_3', name: 'Cerámica Avanzada', teacherId: 'usr_profe_lorena', teacherName: 'Lorena', day: 'Jueves', time: '17:00 - 19:00', capacity: 5 }
];

export const initialBookings = [
  { id: 'bk_1', studentId: 'usr_alumno_azul', studentName: 'Azul', classId: 'cls_1', date: '2026-05-23', status: 'CONFIRMED' },
  { id: 'bk_2', studentId: 'f268d571-625a-4059-90e0-18f6dbcc9f3f', studentName: 'Florencia', classId: 'cls_1', date: '2026-05-23', status: 'CONFIRMED' },
  { id: 'bk_3', studentId: 'c145d93c-88a8-43fe-b337-696a6d8aba98', studentName: 'Julieta', classId: 'cls_1', date: '2026-05-23', status: 'CONFIRMED' }
];

export const initialClayDeliveries = [
  { id: 'clay_1', studentId: 'f268d571-625a-4059-90e0-18f6dbcc9f3f', studentName: 'Florencia', teacherId: 'usr_profe_carlos', teacherName: 'Carlos', date: '2026-05-15', quantityKg: 1.0 }
];

export const initialPayments = [
  { id: 'pay_1', studentId: 'usr_alumno_azul', amount: 8000, date: '2026-05-18', status: 'PAID', classCreditsAdded: 4 },
  { id: 'pay_2', studentId: 'c145d93c-88a8-43fe-b337-696a6d8aba98', amount: 8000, date: '2026-05-19', status: 'PAID', classCreditsAdded: 4 }
];

export const initialAlerts = [
  { id: 'alt_1', type: 'NO_CREDITS', message: 'El alumno Bruno intentó reservar el "Taller de Torno" del Sábado pero no poseía créditos de clase disponibles.', date: '2026-05-20T10:30:00Z', resolved: false },
  { id: 'alt_2', type: 'CLAY_LIMIT', message: 'La alumna Florencia ya retiró su bloque de arcilla de 1kg mensual. Límite mensual alcanzado.', date: '2026-05-15T19:15:00Z', resolved: false },
  { id: 'alt_3', type: 'HIGH_OCCUPANCY', message: 'La clase de "Modelado Manual" del Martes tiene ocupación crítica: 2 cupos disponibles restantes.', date: '2026-05-21T12:00:00Z', resolved: false }
];
