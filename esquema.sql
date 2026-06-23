-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.t_clases_def (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  titulo text DEFAULT 'Taller Anual'::text,
  dia_semana text CHECK (dia_semana = ANY (ARRAY['Lunes'::text, 'Martes'::text, 'Miercoles'::text, 'Jueves'::text, 'Viernes'::text, 'Sabado'::text])),
  hora_inicio time without time zone NOT NULL,
  hora_fin time without time zone NOT NULL,
  cupo_maximo integer NOT NULL,
  id_sucursal uuid,
  id_profesor uuid,
  bl_activa boolean DEFAULT true,
  CONSTRAINT t_clases_def_pkey PRIMARY KEY (id),
  CONSTRAINT t_clases_def_id_sucursal_fkey FOREIGN KEY (id_sucursal) REFERENCES public.t_sucursales(id),
  CONSTRAINT t_clases_def_id_profesor_fkey FOREIGN KEY (id_profesor) REFERENCES public.t_usuarios(id_usuario)
);
CREATE TABLE public.t_clases_instancia (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  id_clase_def uuid,
  fecha_efectiva date NOT NULL,
  bl_cancelada boolean DEFAULT false,
  motivo_cancelacion text,
  CONSTRAINT t_clases_instancia_pkey PRIMARY KEY (id),
  CONSTRAINT t_clases_instancia_id_clase_def_fkey FOREIGN KEY (id_clase_def) REFERENCES public.t_clases_def(id)
);
CREATE TABLE public.t_cuenta_alumno (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  id_usuario uuid,
  saldo_actual integer DEFAULT 0,
  saldo integer CHECK (saldo = ANY (ARRAY[4, 6, 8])),
  fec_vencimiento_cuota date,
  id_sucursal_preferida uuid,
  bl_bloqueado boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now(),
  fecha_pago_cuota date,
  CONSTRAINT t_cuenta_alumno_pkey PRIMARY KEY (id),
  CONSTRAINT t_cuenta_alumno_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.t_usuarios(id_usuario),
  CONSTRAINT t_cuenta_alumno_id_sucursal_preferida_fkey FOREIGN KEY (id_sucursal_preferida) REFERENCES public.t_sucursales(id)
);
CREATE TABLE public.t_deudas_insumos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  id_usuario uuid,
  tipo text CHECK (tipo = ANY (ARRAY['HORNO'::text, 'ARCILLA'::text])),
  descripcion text,
  peso_gramos numeric,
  precio_total numeric NOT NULL,
  metodo_pago_pte text CHECK (metodo_pago_pte = ANY (ARRAY['CONTADO'::text, 'TRANSF'::text])),
  bl_pagado boolean DEFAULT false,
  fec_carga timestamp with time zone DEFAULT now(),
  CONSTRAINT t_deudas_insumos_pkey PRIMARY KEY (id),
  CONSTRAINT t_deudas_insumos_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.t_usuarios(id_usuario)
);
CREATE TABLE public.t_historial_creditos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  id_usuario uuid,
  cantidad integer NOT NULL,
  motivo text,
  fec_movimiento timestamp with time zone DEFAULT now(),
  bl_notificado_venc boolean DEFAULT false,
  CONSTRAINT t_historial_creditos_pkey PRIMARY KEY (id),
  CONSTRAINT t_historial_creditos_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.t_usuarios(id_usuario)
);
CREATE TABLE public.t_inscripciones (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  id_usuario uuid,
  id_clase_instancia uuid,
  fec_reserva timestamp with time zone DEFAULT now(),
  estado text DEFAULT 'RESERVADA'::text CHECK (estado = ANY (ARRAY['RESERVADA'::text, 'ASISTIO'::text, 'CANCELADA'::text])),
  CONSTRAINT t_inscripciones_pkey PRIMARY KEY (id),
  CONSTRAINT t_inscripciones_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.t_usuarios(id_usuario),
  CONSTRAINT t_inscripciones_id_clase_instancia_fkey FOREIGN KEY (id_clase_instancia) REFERENCES public.t_clases_instancia(id)
);
CREATE TABLE public.t_lista_espera (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  id_usuario uuid,
  id_clase_instancia uuid,
  fec_registro timestamp with time zone DEFAULT now(),
  bl_notificado boolean DEFAULT false,
  CONSTRAINT t_lista_espera_pkey PRIMARY KEY (id),
  CONSTRAINT t_lista_espera_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.t_usuarios(id_usuario),
  CONSTRAINT t_lista_espera_id_clase_instancia_fkey FOREIGN KEY (id_clase_instancia) REFERENCES public.t_clases_instancia(id)
);
CREATE TABLE public.t_notificaciones (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  id_usuario uuid,
  titulo text,
  mensaje text,
  tipo text,
  leido boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT t_notificaciones_pkey PRIMARY KEY (id),
  CONSTRAINT t_notificaciones_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.t_usuarios(id_usuario)
);
CREATE TABLE public.t_parametros_negocio (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  clave text NOT NULL UNIQUE,
  valor text NOT NULL,
  descripcion text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT t_parametros_negocio_pkey PRIMARY KEY (id)
);
CREATE TABLE public.t_sucursales (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  n_sucursal text NOT NULL,
  direccion text,
  capacidad_max_creditos integer DEFAULT 120,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT t_sucursales_pkey PRIMARY KEY (id)
);
CREATE TABLE public.t_usuarios (
  id_usuario uuid NOT NULL DEFAULT uuid_generate_v4(),
  nro_documento numeric NOT NULL UNIQUE,
  clave text,
  email text NOT NULL UNIQUE,
  google_id text UNIQUE,
  avatar_url text,
  nombre text NOT NULL,
  apellido text NOT NULL,
  telefono numeric,
  instagram text,
  fecha_nacimiento date,
  rol text CHECK (rol = ANY (ARRAY['ADMIN'::text, 'PROFE'::text, 'ALUMNO'::text])),
  bl_cambio_pass_pte boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  sucursal text,
  CONSTRAINT t_usuarios_pkey PRIMARY KEY (id_usuario)
);

CREATE TABLE public.t_dias_no_laborales (
  fecha date NOT NULL,
  tipo character varying(50) NOT NULL,
  nombre character varying(255) NOT NULL,
  CONSTRAINT t_dias_no_laborales_pkey PRIMARY KEY (fecha)
);