# Verificación de Reservas de Piscina en Supabase

Para diagnosticar el problema, por favor ejecuta esta consulta en el **SQL Editor de Supabase**:

```sql
-- Ver cuántas reservas de piscina hay para el 10/11/2025
SELECT 
    fecha_reserva,
    COUNT(*) as total_reservas,
    SUM(cantidad) as total_personas
FROM reservas_piscina
WHERE fecha_reserva = '2025-11-10'
  AND activo = true
GROUP BY fecha_reserva;

-- Ver distribución por hora
SELECT 
    hora_reserva,
    COUNT(*) as num_reservas,
    SUM(cantidad) as personas,
    STRING_AGG(DISTINCT tecnica, ', ') as tecnicas
FROM reservas_piscina
WHERE fecha_reserva = '2025-11-10'
  AND activo = true
GROUP BY hora_reserva
ORDER BY hora_reserva;

-- Ver todas las reservas (muestra 10)
SELECT 
    cliente,
    hora_reserva,
    tecnica,
    cantidad,
    duracion_minutos
FROM reservas_piscina
WHERE fecha_reserva = '2025-11-10'
  AND activo = true
ORDER BY hora_reserva
LIMIT 10;
```

Por favor copia y pégame el resultado de estas tres consultas.
