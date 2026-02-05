-- Migration: Add tratamientos_cabina to reservas_externas
-- Author: Antigravity
-- Date: 2026-02-04

DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'reservas_externas' 
        AND column_name = 'tratamientos_cabina'
    ) THEN 
        ALTER TABLE public.reservas_externas 
        ADD COLUMN tratamientos_cabina boolean DEFAULT false;
    END IF;
END $$;
