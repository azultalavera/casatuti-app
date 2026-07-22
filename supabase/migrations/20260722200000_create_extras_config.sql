-- Migration: Create t_config_extras
CREATE TABLE IF NOT EXISTS public.t_config_extras (
    id_extra UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('ARCILLA', 'HORNEADO', 'OTRO')),
    nombre VARCHAR(100) NOT NULL,
    precio NUMERIC(10,2) NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial values so the backend doesn't fail right away
INSERT INTO public.t_config_extras (tipo, nombre, precio, activo) 
VALUES 
    ('ARCILLA', 'Entrega de Arcilla (1kg)', 0, true),
    ('HORNEADO', 'Servicio de Horneado', 0, true)
ON CONFLICT DO NOTHING;
