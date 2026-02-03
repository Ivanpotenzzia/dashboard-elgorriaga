-- Migración para añadir campo categoria a reservas_piscina
-- Ejecutar en Supabase SQL Editor

-- 1. Añadir campo categoria
ALTER TABLE reservas_piscina 
ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'OTROS';

-- 2. Crear índice para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_reservas_piscina_categoria 
ON reservas_piscina(categoria);

-- 3. Actualizar registros existentes basándose en el campo tecnica
UPDATE reservas_piscina
SET categoria = CASE
    WHEN UPPER(tecnica) LIKE '%ALOJADOS%' AND UPPER(tecnica) NOT LIKE '%NO ALOJADOS%' THEN 'HUESPEDES'
    WHEN UPPER(tecnica) LIKE '%NO ALOJADOS%' THEN 'EXTERNOS'
    WHEN UPPER(tecnica) LIKE '%IMS%' OR UPPER(tecnica) LIKE '%IMSERSO%' THEN 'IMSERSO'
    ELSE 'OTROS'
END
WHERE categoria = 'OTROS';

-- Verificar resultados
SELECT categoria, COUNT(*) as total
FROM reservas_piscina
WHERE activo = true
GROUP BY categoria;
