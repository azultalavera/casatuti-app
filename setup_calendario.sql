-- ==============================================================
-- SETUP TABLA DIAS NO LABORALES (CASA TUTI)
-- ==============================================================

-- 1. Crear Tabla de Días No Laborales (feriados oficiales)
CREATE TABLE IF NOT EXISTS public.t_dias_no_laborales (
    fecha DATE PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL
);

-- 2. Poblar Tabla de Días No Laborales (Feriados Argentina 2026 desde api.argentinadatos.com)
INSERT INTO public.t_dias_no_laborales (fecha, tipo, nombre) VALUES
('2026-01-01', 'inamovible', 'Año nuevo'),
('2026-02-16', 'inamovible', 'Carnaval'),
('2026-02-17', 'inamovible', 'Carnaval'),
('2026-03-23', 'puente', 'Puente turístico no laborable'),
('2026-03-24', 'inamovible', 'Día Nacional de la Memoria por la Verdad y la Justicia'),
('2026-04-02', 'inamovible', 'Día del Veterano y de los Caídos en la Guerra de Malvinas'),
('2026-04-03', 'inamovible', 'Viernes Santo'),
('2026-05-01', 'inamovible', 'Día del Trabajador'),
('2026-05-25', 'inamovible', 'Día de la Revolución de Mayo'),
('2026-06-15', 'trasladable', 'Paso a la Inmortalidad del General Martín Güemes (17/6)'),
('2026-06-20', 'inamovible', 'Paso a la Inmortalidad del General Manuel Belgrano'),
('2026-07-09', 'inamovible', 'Día de la Independencia'),
('2026-07-10', 'puente', 'Puente turístico no laborable'),
('2026-08-17', 'trasladable', 'Paso a la Inmortalidad del Gral. José de San Martín'),
('2026-10-12', 'trasladable', 'Día del Respeto a la Diversidad Cultural'),
('2026-11-23', 'trasladable', 'Día de la Soberanía Nacional (20/11)'),
('2026-12-07', 'puente', 'Puente turístico no laborable'),
('2026-12-08', 'inamovible', 'Día de la Inmaculada Concepción de María'),
('2026-12-25', 'inamovible', 'Navidad')
ON CONFLICT (fecha) DO UPDATE SET 
    tipo = EXCLUDED.tipo,
    nombre = EXCLUDED.nombre;
