-- =============================================
-- TABLA: reservas_restaurante
-- Reservas de comida y cena del restaurante
-- =============================================

CREATE TABLE IF NOT EXISTS public.reservas_restaurante (
    id_reserva_restaurante UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Datos de la reserva
    fecha_reserva DATE NOT NULL,
    nombre_cliente TEXT NOT NULL,
    tipo_servicio TEXT NOT NULL CHECK (tipo_servicio IN ('COMIDA', 'CENA')),
    comensales INTEGER NOT NULL DEFAULT 1 CHECK (comensales >= 1 AND comensales <= 100),
    comentarios TEXT, -- Intolerancias, alergias, peticiones especiales
    
    -- Control
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_reservas_restaurante_fecha ON public.reservas_restaurante(fecha_reserva);
CREATE INDEX IF NOT EXISTS idx_reservas_restaurante_tipo ON public.reservas_restaurante(tipo_servicio);
CREATE INDEX IF NOT EXISTS idx_reservas_restaurante_activo ON public.reservas_restaurante(activo);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_restaurante_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_restaurante_updated_at ON public.reservas_restaurante;
CREATE TRIGGER trigger_restaurante_updated_at
    BEFORE UPDATE ON public.reservas_restaurante
    FOR EACH ROW
    EXECUTE FUNCTION update_restaurante_updated_at();

-- RLS (Row Level Security) - Permitir acceso público por ahora
ALTER TABLE public.reservas_restaurante ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on reservas_restaurante" ON public.reservas_restaurante
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Comentarios
COMMENT ON TABLE public.reservas_restaurante IS 'Reservas de restaurante (comidas y cenas)';
COMMENT ON COLUMN public.reservas_restaurante.tipo_servicio IS 'COMIDA o CENA';
COMMENT ON COLUMN public.reservas_restaurante.comentarios IS 'Intolerancias, alergias, peticiones especiales';
