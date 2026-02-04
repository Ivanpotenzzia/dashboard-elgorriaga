-- Migration: Add comentarios_restaurante to reservas_externas
-- Author: Antigravity
-- Date: 2026-02-04

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'reservas_externas' 
        AND column_name = 'comentarios_restaurante'
    ) THEN 
        ALTER TABLE public.reservas_externas 
        ADD COLUMN comentarios_restaurante text;
    END IF;
END $$;
