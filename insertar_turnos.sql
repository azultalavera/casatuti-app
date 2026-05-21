-- ============================================================
-- Script para insertar los turnos fijos de Casa Tuti
-- EJECUTAR EN: Supabase > SQL Editor
-- Cupo por defecto: 10 alumnos por turno
-- ============================================================
-- CENTRO       → 9d29f19e-a64a-480e-9191-7ab056a27aba
-- ALTO VERDE   → 2c44054d-26d7-4642-bc99-6d0c62d034da
-- ============================================================

-- ============================================================
-- SUCURSAL: ALTO VERDE
-- ============================================================

-- LUNES
INSERT INTO public.t_clases_def (id, titulo, dia_semana, hora_inicio, hora_fin, cupo_maximo, id_sucursal, bl_activa) VALUES
(gen_random_uuid(), NULL, 'Lunes',    '17:00', '19:00', 10, '2c44054d-26d7-4642-bc99-6d0c62d034da', true),
(gen_random_uuid(), NULL, 'Lunes',    '19:15', '21:15', 10, '2c44054d-26d7-4642-bc99-6d0c62d034da', true),

-- MARTES
(gen_random_uuid(), NULL, 'Martes',   '10:00', '12:00', 10, '2c44054d-26d7-4642-bc99-6d0c62d034da', true),
(gen_random_uuid(), NULL, 'Martes',   '17:00', '19:00', 10, '2c44054d-26d7-4642-bc99-6d0c62d034da', true),
(gen_random_uuid(), NULL, 'Martes',   '19:15', '21:15', 10, '2c44054d-26d7-4642-bc99-6d0c62d034da', true),

-- MIERCOLES
(gen_random_uuid(), NULL, 'Miercoles','17:00', '19:00', 10, '2c44054d-26d7-4642-bc99-6d0c62d034da', true),
(gen_random_uuid(), NULL, 'Miercoles','19:15', '21:15', 10, '2c44054d-26d7-4642-bc99-6d0c62d034da', true),

-- JUEVES
(gen_random_uuid(), NULL, 'Jueves',   '17:00', '19:00', 10, '2c44054d-26d7-4642-bc99-6d0c62d034da', true),
(gen_random_uuid(), NULL, 'Jueves',   '19:15', '21:15', 10, '2c44054d-26d7-4642-bc99-6d0c62d034da', true),

-- VIERNES
(gen_random_uuid(), NULL, 'Viernes',  '10:00', '12:00', 10, '2c44054d-26d7-4642-bc99-6d0c62d034da', true),
(gen_random_uuid(), NULL, 'Viernes',  '17:00', '19:00', 10, '2c44054d-26d7-4642-bc99-6d0c62d034da', true),
(gen_random_uuid(), NULL, 'Viernes',  '19:15', '21:15', 10, '2c44054d-26d7-4642-bc99-6d0c62d034da', true),

-- SABADO
(gen_random_uuid(), NULL, 'Sabado',   '11:00', '13:00', 10, '2c44054d-26d7-4642-bc99-6d0c62d034da', true),
(gen_random_uuid(), NULL, 'Sabado',   '15:00', '17:00', 10, '2c44054d-26d7-4642-bc99-6d0c62d034da', true),


-- ============================================================
-- SUCURSAL: CENTRO
-- ============================================================

-- LUNES
(gen_random_uuid(), NULL, 'Lunes',    '11:00', '13:00', 10, '9d29f19e-a64a-480e-9191-7ab056a27aba', true),
(gen_random_uuid(), NULL, 'Lunes',    '16:00', '18:00', 10, '9d29f19e-a64a-480e-9191-7ab056a27aba', true),
(gen_random_uuid(), NULL, 'Lunes',    '18:15', '20:15', 10, '9d29f19e-a64a-480e-9191-7ab056a27aba', true),

-- MARTES
(gen_random_uuid(), NULL, 'Martes',   '16:00', '18:00', 10, '9d29f19e-a64a-480e-9191-7ab056a27aba', true),
(gen_random_uuid(), NULL, 'Martes',   '18:15', '20:15', 10, '9d29f19e-a64a-480e-9191-7ab056a27aba', true),

-- MIERCOLES
(gen_random_uuid(), NULL, 'Miercoles','11:00', '13:00', 10, '9d29f19e-a64a-480e-9191-7ab056a27aba', true),
(gen_random_uuid(), NULL, 'Miercoles','16:00', '18:00', 10, '9d29f19e-a64a-480e-9191-7ab056a27aba', true),
(gen_random_uuid(), NULL, 'Miercoles','18:15', '20:15', 10, '9d29f19e-a64a-480e-9191-7ab056a27aba', true),

-- JUEVES
(gen_random_uuid(), NULL, 'Jueves',   '14:00', '16:00', 10, '9d29f19e-a64a-480e-9191-7ab056a27aba', true),
(gen_random_uuid(), NULL, 'Jueves',   '16:15', '18:15', 10, '9d29f19e-a64a-480e-9191-7ab056a27aba', true),

-- VIERNES
(gen_random_uuid(), NULL, 'Viernes',  '15:00', '17:00', 10, '9d29f19e-a64a-480e-9191-7ab056a27aba', true),
(gen_random_uuid(), NULL, 'Viernes',  '17:15', '19:15', 10, '9d29f19e-a64a-480e-9191-7ab056a27aba', true),

-- SABADO
(gen_random_uuid(), NULL, 'Sabado',   '09:00', '11:00', 10, '9d29f19e-a64a-480e-9191-7ab056a27aba', true),
(gen_random_uuid(), NULL, 'Sabado',   '11:15', '13:15', 10, '9d29f19e-a64a-480e-9191-7ab056a27aba', true);
