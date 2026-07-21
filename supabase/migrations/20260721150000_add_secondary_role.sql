-- Add secondary_role column to t_usuarios table to allow a user to have an alternate profile
ALTER TABLE public.t_usuarios ADD COLUMN IF NOT EXISTS secondary_role VARCHAR(50);
