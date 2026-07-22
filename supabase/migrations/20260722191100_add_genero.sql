CREATE TABLE IF NOT EXISTS public.t_tipos_genero (
    id_genero VARCHAR(1) PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL
);

INSERT INTO public.t_tipos_genero (id_genero, descripcion)
VALUES 
    ('F', 'Femenino'),
    ('M', 'Masculino'),
    ('X', 'No binario')
ON CONFLICT (id_genero) DO NOTHING;

ALTER TABLE public.t_usuarios 
ADD COLUMN IF NOT EXISTS genero VARCHAR(1) REFERENCES public.t_tipos_genero(id_genero);
