-- Migration: Add missing audit columns to reservas_externas
-- Author: Antigravity
-- Date: 2026-02-04

DO $$ 
BEGIN 
    -- Add usuario_modificacion if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'reservas_externas' 
        AND column_name = 'usuario_modificacion'
    ) THEN 
        ALTER TABLE public.reservas_externas 
        ADD COLUMN usuario_modificacion text;
    END IF;

    -- Add usuario_creacion if it doesn't exist (good practice)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'reservas_externas' 
        AND column_name = 'usuario_creacion'
    ) THEN 
        ALTER TABLE public.reservas_externas 
        ADD COLUMN usuario_creacion text;
    END IF;
END $$;
