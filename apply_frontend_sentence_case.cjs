const fs = require('fs');
const path = require('path');

const replacements = [
  ['Casa Tuti', 'Casa tuti'],
  ['Mi Perfil', 'Mi perfil'],
  ['-- Seleccionar Profe --', '-- Seleccionar profe --'],
  ['Nuevo Cupo Máximo', 'Nuevo cupo máximo'],
  ['Nombre Sucursal', 'Nombre sucursal'],
  ['Pregunta / Norma', 'Pregunta / norma'],
  ['Respuesta / Detalle', 'Respuesta / detalle'],
  ['Avisos de Reservas', 'Avisos de reservas'],
  ['Reporte de Asistencia', 'Reporte de asistencia'],
  ['Monto Pendiente', 'Monto pendiente'],
  ['Reporte Financiero (Horneados)', 'Reporte financiero (horneados)'],
  ['Este Mes', 'Este mes'],
  ['Exportar Activas', 'Exportar activas'],
  ['Exportar Abandonos', 'Exportar abandonos'],
  ['Fecha de Nacimiento', 'Fecha de nacimiento'],
  ['Fecha Nacimiento', 'Fecha de nacimiento'],
  ['Datos Personales', 'Datos personales'],
  ['Foto de Perfil', 'Foto de perfil'],
  ['Titular: Maria Candelaria Luna Ottonello', 'Titular: maria candelaria luna ottonello'],
  ['Reprogramar Turno', 'Reprogramar turno'],
  ['Bloque de 1kg Entregado', 'Bloque de 1kg entregado'],
  ['Registrar Horneado', 'Registrar horneado'],
  ['Precio Total ($) *', 'Precio total ($) *'],
  ['Efectivo / Contado', 'Efectivo / contado'],
  ['Confirmar Registro', 'Confirmar registro'],
  ['Solicitar Pausa de Clase', 'Solicitar pausa de clase'],
  ['Enviar Solicitud', 'Enviar solicitud'],
  ['Profesor Activo', 'Profesor activo'],
  ['Mis Clases de Hoy', 'Mis clases de hoy'],
  ['Turnos Disponibles', 'Turnos disponibles'],
  ['Gestión de Alumnos', 'Gestión de alumnos'],
  ['Alumno Activo', 'Alumno activo'],
  ['Turnos Semanales', 'Turnos semanales'],
  ['Mis Reservas', 'Mis reservas'],
  ['Pagos y Créditos', 'Pagos y créditos'],
  ['Comprar Créditos', 'Comprar créditos'],
  ['Realizar Transferencia', 'Realizar transferencia'],
  ['Cerrar Sesión', 'Cerrar sesión'],
  ['Iniciar Sesión', 'Iniciar sesión'],
  ['Correo Electrónico', 'Correo electrónico'],
  ['Contraseña', 'Contraseña'],
  ['Recuperar Contraseña', 'Recuperar contraseña']
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  replacements.forEach(([search, replace]) => {
    // Regex global exact string replace
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'g');
    content = content.replace(regex, replace);
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
    console.log(`Updated ${file}`);
  }
});

console.log(`Modified ${changedFiles} files.`);
