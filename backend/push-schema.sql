CREATE TABLE IF NOT EXISTS public.t_suscripciones_push (
    id SERIAL PRIMARY KEY,
    id_usuarios INTEGER REFERENCES public.t_usuarios(id_usuarios) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
