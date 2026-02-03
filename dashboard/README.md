# Panel Balneario Elgorriaga

Dashboard de gestión de aforo para el Circuito Termal y previsión de restaurante.

## Características

- **Gestión de Reservas Externas**: Creación manual con validación de aforo.
- **Integración PMS**: Importación de "Informe 1044" (Excel) de Septeo.
- **Control de Aforo**: Semáforo en tiempo real (Máx 40 pax).
- **Vista Restaurante**: Previsión de comensales para cocina.

## Instalación

1.  Instalar dependencias:
    ```bash
    npm install
    ```

2.  Configurar Supabase:
    - Crear proyecto en Supabase.
    - Ejecutar script SQL `../supabase_schema.sql`.
    - Crear archivo `.env` basado en `.env.example`.

3.  Iniciar desarrollo:
    ```bash
    npm run dev
    ```

## Estructura

- `src/components`: Componentes UI (Átomos, Moléculas, Layout).
- `src/pages`: Vistas principales.
- `src/services`: Conexión con Supabase.
- `src/styles`: Variables de diseño y temas.
