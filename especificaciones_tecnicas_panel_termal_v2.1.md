# Documento de Especificaciones Técnicas: Panel de Ocupación del Circuito Termal v2.1

## 1.0 Introducción y Objetivos del Sistema

Este documento formaliza los requisitos funcionales y no funcionales para el desarrollo del "Panel de Ocupación del Circuito Termal". Su propósito es servir como la fuente única de verdad para el equipo de desarrollo de PotenzzIA y como documento de validación para Balneario Elgorriaga.

### 1.1 Propósito y Alcance

El propósito fundamental es definir las características del sistema. El alcance del proyecto consiste en el desarrollo de una aplicación web para la visualización y gestión centralizada de la ocupación del circuito termal, así como la gestión auxiliar de servicios de restaurante (comidas y cenas).

El núcleo del proyecto se basa en una **arquitectura híbrida**: procesar datos masivos del PMS y permitir la **gestión manual directa** de clientes externos dentro de la propia herramienta, eliminando hojas de cálculo intermedias.

### 1.2 Contexto de Negocio y Problema a Resolver

Actualmente, la gestión de reservas sufre de fragmentación y riesgos operativos:

1. **Reservas de Huéspedes:** Gestionadas en el PMS (Septeo/ACI).
2. **Reservas Externas:** Gestionadas anteriormente en hojas de cálculo externas, lo que ocasionaba errores de formato, inconsistencia de datos y falta de validación en tiempo real.
3. **Servicios de Restaurante:** Sin visibilidad unificada del número de comensales esperados por servicio.

Esta situación impide una visión unificada fiable. La nueva solución busca eliminar el riesgo del "error humano" asociado al uso de Excel compartido, centralizando la entrada de datos en una interfaz controlada y validada.

### 1.3 Objetivos Clave

* **Centralizar la Gestión:** Unificar la ingesta de datos del PMS con un módulo nativo de creación de reservas para clientes externos.
* **Eliminar Dependencias Externas:** Suprimir el uso de Google Sheets para evitar errores de formato y sincronización.
* **Optimizar la Gestión del Aforo:** Sistema de semáforo de capacidad para las 40 plazas disponibles (adultos + niños).
* **Agilizar la Operativa:** Facilitar el alta rápida de reservas externas mediante formularios ágiles (modales).
* **Visibilidad para Restaurante:** Proporcionar una vista específica con el número de comensales por servicio (comida/cena) y fecha.

### 1.4 Definiciones y Acrónimos

| Término | Definición |
| --- | --- |
| **Panel de Control** | La aplicación web a desarrollar (Dashboard). |
| **PMS** | Software de gestión del hotel (Septeo/ACI). |
| **Informe 1044** | Informe de ocupación exportado desde el PMS. |
| **Módulo de Reservas** | Nueva funcionalidad interna para dar de alta/editar reservas externas manualmente. |
| **IMSERSO** | Programa de termalismo con gestión de aforo específica. |
| **PAX** | Número total de personas (Adultos + Niños). |
| **BR** | Bono Regalo. |
| **Tab Restaurante** | Vista específica para el personal de restaurante con información agregada de comensales. |

---

## 2.0 Arquitectura y Requisitos Generales del Sistema

La arquitectura pasa de ser un mero "visor" a un **sistema de gestión activa**. La aplicación actuará como repositorio de datos primario para las reservas externas y como visualizador para los datos del PMS.

Se materializará como una aplicación web privada, accesible vía navegador, con una base de datos propia para persistir las reservas manuales.

### 2.1 Flujo de Datos y Componentes Principales

1. **Fuentes de Datos:**
   * **Datos PMS (Lectura):** Ingesta de archivos Excel (Informe 1044/IMSERSO) exportados de Septeo.
   * **Datos Externos (Escritura/Lectura):** Entrada directa de datos por parte del personal de recepción a través de la interfaz de la aplicación.

2. **Base de Datos Interna:** Almacenará las reservas externas creadas manualmente, garantizando integridad y estructura de datos.

3. **Motor de Cálculo:** Unifica los registros de la BBDD interna con los datos volátiles procesados del archivo PMS para calcular el aforo total.

4. **Visualización:** Interfaz web con actualizaciones en tiempo real tras cada inserción manual o carga de archivo. Incluye vista específica para restaurante.

### 2.2 Gestión de Usuarios y Roles de Acceso

* **Rol 1: Administrador/Recepción**
  * *Permisos:* Carga de informes PMS, **Creación/Edición/Borrado (CRUD)** de reservas externas, visualización completa del panel de ocupación termal y de la tab de restaurante.

* **Rol 2: Restaurante**
  * *Permisos:* Acceso exclusivo a la **Tab Restaurante** con vista de solo lectura.
  * *Datos visibles:* Fecha, franja horaria, número de comensales por servicio (comida/cena). **NO se muestran datos personales** (nombres, teléfonos, importes).

---

## 3.0 Módulos de Ingesta y Gestión de Datos

### 3.1 Módulo 1: Carga Semiautomatizada de Informes del PMS

Este módulo gestiona la importación masiva de huéspedes alojados.

* **Entrada:** Archivo Excel "informe 1044" (y variante IMSERSO).
* **Método:** Interfaz "Arrastrar y soltar" (Drag & Drop).
* **Procesamiento:** Extracción automática de ocupación por franja horaria.
* **Restricción:** La estructura de columnas del informe 1044 debe mantenerse inmutable.
* **Nota:** Los datos del PMS solo incluyen información del circuito termal, NO de servicios de restaurante.

### 3.2 Módulo 2: Gestión Manual de Reservas Externas (Sistema CRUD)

Este módulo sustituye la conexión con Google Sheets. Es un sistema CRUD (Create, Read, Update, Delete) integrado en la aplicación.

#### 3.2.1 Funcionalidad "Añadir Reserva"

* Se habilitará un botón de acción principal **[+ NUEVA RESERVA]** accesible desde el panel.
* Al pulsarlo, se abrirá una **ventana modal** flotante con el formulario de entrada.

#### 3.2.2 Estructura de Campos de la Reserva

La estructura de cada reserva externa contendrá los siguientes campos:

| Campo | Tipo | Obligatorio | Validación | Descripción |
| --- | --- | --- | --- | --- |
| **HORA** | Selector de franja horaria | Sí | Franjas de 30 min (ej: 10:00, 10:30, 11:00...) | Hora de inicio del circuito termal |
| **NOMBRE/CLIENTE** | Texto libre | Sí | Mínimo 2 caracteres | Nombre del titular de la reserva |
| **TELÉFONO** | Numérico | Sí | Formato telefónico válido (9 dígitos) | Teléfono de contacto |
| **ADULTOS** | Selector numérico | Sí | Valor >= 0 | Número de adultos (mayores de 12 años) |
| **NIÑOS** | Selector numérico | Sí | Valor >= 0 | Número de niños (menores de 12 años) |
| **COMIDA** | Checkbox | No | - | Indica si el grupo requiere servicio de comida |
| **Nº COMENSALES COMIDA** | Selector numérico | Condicional* | Visible solo si COMIDA = Sí | Número de personas que comerán |
| **CENA** | Checkbox | No | - | Indica si el grupo requiere servicio de cena |
| **Nº COMENSALES CENA** | Selector numérico | Condicional* | Visible solo si CENA = Sí | Número de personas que cenarán |
| **IMPORTE PAGO** | Numérico con decimales | Sí | Formato: XX.XX€ (con símbolo de euro) | Importe del circuito termal únicamente (NO incluye comidas/cenas) |
| **ESTADO DE PAGO** | Selector desplegable | Sí | Opciones: "Pendiente", "Pagado", "Bono Regalo", "Cancelado" | Estado actual del pago |
| **DETALLES BR** | Texto libre largo | No | Máximo 500 caracteres | Campo para observaciones generales, localizador, detalles de bono regalo, etc. |

**\* Condicional:** Si se marca el checkbox de COMIDA o CENA, el campo correspondiente de número de comensales se vuelve obligatorio.

#### 3.2.3 Lógica de Validación del Formulario

**Validaciones de Negocio:**

1. **Validación de PAX:** Al menos debe haber 1 adulto o 1 niño (ADULTOS + NIÑOS >= 1).
2. **Validación de Comensales:** 
   * Si COMIDA = Sí → Nº COMENSALES COMIDA debe ser >= 1
   * Si CENA = Sí → Nº COMENSALES CENA debe ser >= 1
   * El número de comensales NO tiene que coincidir con (ADULTOS + NIÑOS), puede ser menor.
3. **Validación de Aforo (Crítica):** 
   * Antes de guardar, el sistema calculará: `Ocupación Actual + ADULTOS + NIÑOS`
   * Si el resultado > 40, se mostrará una **alerta bloqueante** o de confirmación:
     * *"⚠️ AVISO: Esta reserva excederá el aforo máximo de 40 personas. Ocupación actual: [X], Plazas solicitadas: [Y], Total: [Z]. ¿Desea continuar?"*
   * Opciones: [Cancelar] o [Confirmar Overbooking]
4. **Validación de Fecha/Hora:** El sistema puede opcionalmente bloquear franjas horarias pasadas (según preferencia del cliente).

**Validaciones Técnicas:**
* Formato de teléfono español: 9 dígitos numéricos.
* Formato de importe: numérico con máximo 2 decimales + símbolo €.
* Campos de texto con límite de caracteres para prevenir inyección de código.

#### 3.2.4 Persistencia y Actualización

* Al pulsar **[Guardar]**, los datos se escriben inmediatamente en la base de datos.
* El sistema recalcula automáticamente:
  * El aforo de la franja horaria correspondiente en el panel principal.
  * Los totales de comensales en la Tab Restaurante.
* Si hay error de validación, el modal permanece abierto mostrando mensajes de error específicos junto a cada campo problemático.

### 3.3 Lógica de Fusión y Agregación de Datos

El motor de cálculo opera de la siguiente manera:

1. **Carga de datos del PMS:** Se procesan las filas del Excel, extrayendo por cada huésped su franja horaria asignada.
2. **Consulta de reservas externas:** Se consulta la BBDD para obtener todas las reservas activas (ESTADO_PAGO != "Cancelado") de la fecha seleccionada.
3. **Agregación por franja horaria:**
   * Para cada franja de 30 minutos:
     * `PAX_PMS = suma de huéspedes del hotel`
     * `PAX_EXTERNOS = suma de (ADULTOS + NIÑOS) de reservas externas`
     * `PAX_TOTAL = PAX_PMS + PAX_EXTERNOS`
4. **Cálculo de semáforo:**
   * Verde: PAX_TOTAL <= 25 (62.5% capacidad)
   * Amarillo: 26 <= PAX_TOTAL <= 35 (65-87.5% capacidad)
   * Rojo: PAX_TOTAL >= 36 (90%+ capacidad)

---

## 4.0 Especificaciones de la Interfaz de Usuario (UI)

### 4.1 Panel de Control Principal (Vista Diaria - Circuito Termal)

#### 4.1.1 Estructura de la Interfaz

* **Barra Superior:**
  * Selector de fecha (Calendar picker)
  * Botón destacado **[+ NUEVA RESERVA]** en color principal
  * Botón **[Cargar Informe PMS]**
  * Indicador de última actualización

* **Área Principal:**
  * Grid de tarjetas, una por franja horaria (ej: 10:00, 10:30, 11:00...)
  * Cada tarjeta muestra:
    * **Hora de la franja**
    * **Semáforo visual** (círculo o badge de color verde/amarillo/rojo)
    * **Ocupación desglosada:**
      * `Hotel: [X] adultos + [Y] niños`
      * `Externos: [X] adultos + [Y] niños`
      * `Total: [X] adultos + [Y] niños ([Z] PAX)`
    * **Icono de acción rápida [+]** (opcional) para añadir reserva directamente a esa hora

#### 4.1.2 Vista de Detalle de Franja Horaria

Al hacer clic en una tarjeta, se despliega (modal lateral o sección expandible) el **listado completo de reservas** de esa franja:

**Reservas del PMS:**
* Aparecen con fondo grisado o icono distintivo
* Estado: **Solo lectura**
* Datos visibles: Nombre, Habitación, PAX

**Reservas Externas:**
* Aparecen con fondo normal
* Acciones disponibles: **[Editar]** y **[Eliminar]**
* Datos visibles: Todos los campos (NOMBRE, TELÉFONO, ADULTOS, NIÑOS, servicios marcados, IMPORTE, ESTADO_PAGO, icono si tiene detalles)

**Edición de Reserva Externa:**
* Al pulsar [Editar], se reabre el modal de "Nueva Reserva" con todos los campos precargados
* El usuario puede modificar cualquier campo y guardar
* El sistema registra en log la modificación (usuario + timestamp)

**Eliminación de Reserva Externa:**
* Al pulsar [Eliminar], se muestra confirmación: *"¿Está seguro de eliminar la reserva de [NOMBRE] para [X] personas?"*
* Si se confirma, la reserva se marca como eliminada en BBDD y desaparece del panel inmediatamente

### 4.2 Tab Restaurante (Vista Específica)

Esta pestaña/sección está diseñada exclusivamente para el personal de restaurante.

#### 4.2.1 Estructura de la Vista

* **Selector de Fecha:** Permite elegir el día para el cual visualizar servicios.
* **Dos Secciones Diferenciadas:**
  1. **Servicio de COMIDA**
  2. **Servicio de CENA**

#### 4.2.2 Formato de Visualización

Cada sección (Comida/Cena) muestra una **tabla o lista de líneas** con las siguientes columnas:

| Franja Horaria | Nº Comensales | Origen |
| --- | --- | --- |
| 14:00 | 8 | 5 Hotel + 3 Externos |
| 14:30 | 12 | 7 Hotel + 5 Externos |
| 15:00 | 6 | 6 Externos |
| **TOTAL COMIDA** | **26** | - |

**Lógica de Agregación para Restaurante:**
* Para cada franja horaria del circuito termal, se suman:
  * Los comensales de reservas del PMS que tienen marcado el servicio correspondiente (si el informe PMS incluye esta info)
  * Los comensales de reservas externas: campo `Nº COMENSALES COMIDA` o `Nº COMENSALES CENA` según corresponda
* Se agrupa por franja horaria de **entrada al circuito** (no necesariamente la hora de la comida/cena real)
* **Importante:** No se muestran nombres, teléfonos, ni datos personales. Solo números agregados.

#### 4.2.3 Actualización en Tiempo Real

* Cada vez que se crea/edita/elimina una reserva externa con servicios de comida/cena, la Tab Restaurante se actualiza automáticamente.
* Indicador visual de "última actualización" para que el personal sepa que los datos son actuales.

### 4.3 Panel de Estadísticas (Opcional/Futuro)

Mantiene la funcionalidad de análisis histórico:
* Ocupación media por día/semana/mes
* Tasa de uso de servicios de restaurante
* Análisis de pagos (pendientes vs completados)
* Fuente de datos: BBDD interna (más fiable y consultable que Excel)

---

## 5.0 Lógica de Negocio Específica

### 5.1 Definición de "Niño"

* **Edad de corte:** Menor de 12 años
* **Cómputo de aforo:** Los niños cuentan como 1 PAX igual que los adultos para el cálculo del aforo de 40 plazas

### 5.2 Gestión de Clientes del Programa IMSERSO

Se mantiene la lógica de consolidación:
* El sistema debe permitir cargar el informe de "Piscina General" y el de "Piscina IMSERSO"
* Ambos informes se procesan y suman sus valores
* Luego se agregan las reservas manuales externas
* El aforo total validado es: `PAX_General + PAX_IMSERSO + PAX_Externos <= 40`

### 5.3 Control de Aforo en Alta Manual

**Regla crítica:** Al intentar crear o editar una reserva manual:

1. El sistema calcula en tiempo real la ocupación de la franja seleccionada
2. Si `(ADULTOS + NIÑOS de la nueva reserva) + Ocupación Actual > 40`:
   * Se muestra **alerta de overbooking**
   * Opciones:
     * **Bloquear guardado** (recomendado para evitar errores)
     * **Permitir con confirmación** (para casos excepcionales con autorización)

### 5.4 Lógica de Duración (70 min vs 60 min)

**Regla de simplificación operativa:**
* Duración real del circuito: **70 minutos**
* Duración computada para reservas: **60 minutos** (2 franjas de 30 min)
* Razón: Simplifica la visualización y gestión en el panel

**Implicación práctica:**
* Si un cliente entra a las 10:00, técnicamente estaría hasta las 11:10
* Pero el sistema lo cuenta como ocupado solo hasta las 11:00
* Esto genera un "colchón de seguridad" de 10 minutos entre grupos

### 5.5 Independencia Circuito-Restaurante

**Regla importante:**
* El número de PAX del circuito (ADULTOS + NIÑOS) es **independiente** del número de comensales
* Ejemplo válido:
  * Reserva: 4 adultos + 2 niños (6 PAX en circuito)
  * Comida: Solo 3 comensales
  * Cena: 0 comensales
* Esta lógica permite que algunos miembros del grupo no coman/cenen en el balneario

### 5.6 Estados de Pago y Flujo Operativo

* **Pendiente:** Reserva confirmada pero no pagada. Cuenta para aforo.
* **Pagado:** Reserva confirmada y abonada. Cuenta para aforo.
* **Bono Regalo:** Reserva pagada mediante bono. Cuenta para aforo. Requiere detalles en campo DETALLES BR.
* **Cancelado:** Reserva cancelada. **NO cuenta para aforo**. Se mantiene en BBDD para histórico pero no se visualiza en panel activo.

---

## 6.0 Modelo de Datos

### 6.1 Entidad: ReservaExterna

| Campo | Tipo de Dato | Restricciones | Descripción |
| --- | --- | --- | --- |
| id_reserva | INT (PK, Auto-increment) | NOT NULL, UNIQUE | Identificador único de la reserva |
| fecha_reserva | DATE | NOT NULL | Fecha del servicio del circuito |
| hora_reserva | TIME | NOT NULL | Hora de inicio (franja de 30 min) |
| nombre_cliente | VARCHAR(200) | NOT NULL | Nombre del titular |
| telefono | VARCHAR(15) | NOT NULL | Teléfono de contacto |
| adultos | INT | NOT NULL, >= 0 | Número de adultos (>= 12 años) |
| ninos | INT | NOT NULL, >= 0 | Número de niños (< 12 años) |
| servicio_comida | BOOLEAN | NOT NULL, Default: FALSE | Indica si requiere servicio de comida |
| comensales_comida | INT | NULL, >= 1 si servicio_comida = TRUE | Número de personas para comida |
| servicio_cena | BOOLEAN | NOT NULL, Default: FALSE | Indica si requiere servicio de cena |
| comensales_cena | INT | NULL, >= 1 si servicio_cena = TRUE | Número de personas para cena |
| importe_pago | DECIMAL(10,2) | NOT NULL | Importe del circuito termal (solo circuito) |
| estado_pago | ENUM | NOT NULL, Valores: 'Pendiente', 'Pagado', 'Bono Regalo', 'Cancelado' | Estado actual del pago |
| detalles_br | TEXT | NULL, Max 500 chars | Observaciones, localizador, detalles del bono regalo |
| fecha_creacion | DATETIME | NOT NULL, Default: CURRENT_TIMESTAMP | Timestamp de creación del registro |
| fecha_modificacion | DATETIME | NULL | Timestamp de última modificación |
| usuario_creacion | VARCHAR(100) | NOT NULL | Usuario que creó la reserva |
| usuario_modificacion | VARCHAR(100) | NULL | Usuario que modificó la reserva |
| activo | BOOLEAN | NOT NULL, Default: TRUE | Marca de borrado lógico |

**Índices:**
* PRIMARY KEY: id_reserva
* INDEX: (fecha_reserva, hora_reserva, activo) - Para consultas de panel diario
* INDEX: (fecha_reserva, servicio_comida) - Para Tab Restaurante
* INDEX: (fecha_reserva, servicio_cena) - Para Tab Restaurante

### 6.2 Entidad: LogAuditoria (Opcional pero recomendada)

| Campo | Tipo de Dato | Restricciones | Descripción |
| --- | --- | --- | --- |
| id_log | INT (PK, Auto-increment) | NOT NULL, UNIQUE | Identificador del log |
| id_reserva | INT (FK) | NOT NULL | Referencia a ReservaExterna |
| accion | ENUM | NOT NULL, Valores: 'CREATE', 'UPDATE', 'DELETE' | Tipo de acción realizada |
| usuario | VARCHAR(100) | NOT NULL | Usuario que realizó la acción |
| timestamp | DATETIME | NOT NULL, Default: CURRENT_TIMESTAMP | Momento de la acción |
| datos_anteriores | JSON | NULL | Estado anterior (para UPDATE/DELETE) |
| datos_nuevos | JSON | NULL | Estado nuevo (para CREATE/UPDATE) |

---

## 7.0 Requisitos No Funcionales

### 7.1 Rendimiento y Tiempos de Respuesta

* **Creación/Edición de Reserva:** < 1 segundo desde guardado hasta actualización visual del panel
* **Carga de Informe PMS:** < 5 segundos para archivos de hasta 500 registros
* **Actualización de Tab Restaurante:** < 2 segundos
* **Consulta de datos históricos:** < 3 segundos para rangos de hasta 30 días

### 7.2 Disponibilidad y Escalabilidad

* **Disponibilidad objetivo:** 99.5% (máximo 3.65 horas de downtime al mes)
* **Usuarios concurrentes:** Soporte para al menos 10 usuarios simultáneos
* **Crecimiento de datos:** La BBDD debe soportar al menos 10.000 reservas sin degradación de rendimiento

### 7.3 Integridad de Datos y Backups

**Crítico - Las reservas externas ahora son la fuente primaria:**
* **Backup diario automático** de la base de datos completa
* **Retención:** Mínimo 30 días de backups incrementales
* **Backup semanal completo** con retención de 6 meses
* **Plan de recuperación:** Capacidad de restaurar datos de las últimas 24 horas en menos de 1 hora

### 7.4 Seguridad

* **Autenticación:**
  * Sistema de login con usuario y contraseña
  * Sesiones con timeout de 4 horas de inactividad
  * Contraseñas hasheadas con algoritmo bcrypt o superior

* **Autorización:**
  * Control de acceso basado en roles (RBAC)
  * Rol Restaurante: Solo acceso a Tab Restaurante, sin capacidad de ver datos personales
  * Rol Recepción: Acceso completo

* **Auditoría:**
  * Log de todas las operaciones CRUD sobre reservas externas
  * Registro de usuario + timestamp en cada acción
  * Logs inmutables (append-only)

* **Protección de Datos:**
  * Cumplimiento RGPD/LOPD
  * Los teléfonos y nombres son datos personales sensibles
  * No se deben mostrar en la Tab Restaurante
  * Encriptación de conexión (HTTPS obligatorio)

### 7.5 Usabilidad

* **Diseño responsive:** Funcionalidad completa en tablets (mínimo resolución 768px)
* **Accesibilidad:** Contraste suficiente, textos legibles (mínimo 14px), navegación por teclado
* **Feedback visual inmediato:** Spinners durante procesamiento, notificaciones toast para confirmaciones/errores
* **Mensajes de error claros:** Lenguaje natural, indicando qué campo tiene el problema y cómo solucionarlo

### 7.6 Compatibilidad

* **Navegadores soportados:**
  * Chrome/Edge (últimas 2 versiones)
  * Firefox (últimas 2 versiones)
  * Safari (últimas 2 versiones en macOS/iOS)
* **Sistema operativo:** Independiente (aplicación web)
* **Formato de archivos PMS:** Excel .xlsx (formato Office Open XML)

---

## 8.0 Casos de Uso Detallados

### 8.1 Caso de Uso: Alta de Reserva Externa con Servicios de Restaurante

**Actor:** Recepcionista

**Precondiciones:**
* Usuario autenticado con rol Recepción
* Panel de control abierto en fecha actual

**Flujo Principal:**
1. El recepcionista pulsa el botón **[+ NUEVA RESERVA]**
2. Se abre el modal con el formulario vacío
3. El recepcionista rellena los campos:
   * Selecciona HORA: 11:00
   * Introduce NOMBRE: "García, María"
   * Introduce TELÉFONO: 943123456
   * Selecciona ADULTOS: 2
   * Selecciona NIÑOS: 1
   * Marca checkbox COMIDA: Sí
   * Introduce Nº COMENSALES COMIDA: 2 (solo los adultos comen)
   * Deja CENA sin marcar
   * Introduce IMPORTE: 75.00€
   * Selecciona ESTADO_PAGO: "Pagado"
   * Deja DETALLES BR vacío
4. El recepcionista pulsa **[Guardar]**
5. El sistema valida:
   * ✅ Todos los campos obligatorios completos
   * ✅ Teléfono con formato correcto
   * ✅ Al menos 1 PAX (2+1=3)
   * ✅ Comensales comida >= 1 (porque checkbox está marcado)
   * ✅ Aforo: Actual(15) + Nuevo(3) = 18 <= 40 ✓
6. El sistema guarda la reserva en BBDD con:
   * usuario_creacion = "recepcion_user1"
   * fecha_creacion = timestamp actual
7. El panel se actualiza automáticamente:
   * La tarjeta de las 11:00 incrementa: +2 adultos, +1 niño (Externos)
   * El semáforo recalcula color según nueva ocupación
8. La Tab Restaurante se actualiza:
   * En la sección "COMIDA", la línea de las 11:00 muestra: +2 comensales (Externos)
9. Se muestra notificación: *"✓ Reserva creada correctamente para 3 personas"*
10. El modal se cierra

**Postcondiciones:**
* Reserva persistida en BBDD
* Panel y Tab Restaurante actualizados
* Log de auditoría registrado

### 8.2 Caso de Uso: Alerta de Overbooking

**Actor:** Recepcionista

**Precondiciones:**
* Franja de 10:30 con ocupación actual de 38 PAX

**Flujo Principal:**
1. Recepcionista intenta crear reserva para 10:30 con 4 adultos
2. Al pulsar [Guardar], el sistema detecta: 38 + 4 = 42 > 40
3. Se muestra modal de alerta:
   * *"⚠️ AVISO DE SOBREVENTA*
   * *Esta reserva excederá el aforo máximo permitido.*
   * *Ocupación actual: 38 personas*
   * *Plazas solicitadas: 4 personas*
   * *Total resultante: 42 personas (límite: 40)*
   * *¿Desea confirmar esta reserva de todas formas?"*
   * Botones: **[Cancelar]** **[Confirmar Overbooking]**
4. Si el recepcionista pulsa [Cancelar]:
   * El modal de alerta se cierra
   * El formulario de reserva permanece abierto para que pueda modificar la hora o PAX
5. Si el recepcionista pulsa [Confirmar Overbooking]:
   * La reserva se guarda con una marca especial en BBDD (ej: campo "overbooking" = TRUE)
   * Se genera un log de auditoría específico indicando que se confirmó un overbooking
   * El panel se actualiza mostrando la franja en rojo intenso con indicador "⚠️ SOBREVENTA"

### 8.3 Caso de Uso: Consulta de Servicios de Restaurante por el Personal de Cocina

**Actor:** Jefe de Cocina

**Precondiciones:**
* Usuario autenticado con rol Restaurante
* Es día 15 de febrero de 2025, necesita planificar menú para el 16 de febrero

**Flujo Principal:**
1. El jefe de cocina accede a la aplicación
2. Automáticamente ve solo la **Tab Restaurante** (sin acceso a panel de circuito)
3. En el selector de fecha, elige "16/02/2025"
4. El sistema carga los datos de ese día y muestra:

**Sección COMIDA:**
| Franja | Comensales | Origen |
| --- | --- | --- |
| 13:00 | 5 | 5 Hotel |
| 13:30 | 8 | 3 Hotel + 5 Externos |
| 14:00 | 12 | 8 Hotel + 4 Externos |
| 14:30 | 7 | 2 Hotel + 5 Externos |
| **TOTAL** | **32** | - |

**Sección CENA:**
| Franja | Comensales | Origen |
| --- | --- | --- |
| 20:00 | 4 | 4 Externos |
| 20:30 | 10 | 6 Hotel + 4 Externos |
| 21:00 | 8 | 8 Hotel |
| **TOTAL** | **22** | - |

5. El jefe de cocina anota: "Preparar comida para ~35 pax, cena para ~25 pax"
6. **Nota:** En ningún momento ve nombres, teléfonos ni importes de pago

**Postcondiciones:**
* Personal de cocina tiene información agregada necesaria para planificación
* Privacidad de los clientes preservada

---

## 9.0 Plan de Implementación Sugerido (Fases)

### Fase 1: MVP - Core del Sistema (4-6 semanas)
* [ ] Configuración de base de datos con tabla ReservaExterna
* [ ] Sistema de autenticación básico (login + roles)
* [ ] Módulo de carga de informe PMS (drag & drop)
* [ ] Procesamiento y visualización de datos PMS en panel diario
* [ ] Formulario modal de creación de reserva externa (campos completos)
* [ ] Validación de formulario y guardado en BBDD
* [ ] Cálculo de aforo agregado (PMS + Externos)
* [ ] Sistema de semáforo (verde/amarillo/rojo)

### Fase 2: Gestión Completa de Reservas (2-3 semanas)
* [ ] Funcionalidad de edición de reservas externas
* [ ] Funcionalidad de eliminación de reservas externas
* [ ] Vista de detalle de franja horaria con listado de reservas
* [ ] Diferenciación visual PMS vs Externos
* [ ] Validación de overbooking con modal de alerta
* [ ] Gestión de estados de pago (flujo completo)

### Fase 3: Tab Restaurante y Refinamiento (2 semanas)
* [ ] Desarrollo de Tab Restaurante con vistas separadas Comida/Cena
* [ ] Lógica de agregación de comensales por franja
* [ ] Control de acceso: Rol Restaurante solo ve su tab
* [ ] Actualización en tiempo real de Tab Restaurante
* [ ] Pulido de UI/UX (responsive, feedback visual)

### Fase 4: Auditoría y Optimización (1-2 semanas)
* [ ] Implementación de tabla LogAuditoria
* [ ] Sistema de backups automáticos
* [ ] Optimización de consultas (índices, caching)
* [ ] Testing de rendimiento bajo carga
* [ ] Documentación de usuario final

### Fase 5: Testing y Despliegue (1-2 semanas)
* [ ] Pruebas de integración completas
* [ ] Pruebas de aceptación con usuario (Balneario Elgorriaga)
* [ ] Migración de datos existentes (si aplica)
* [ ] Capacitación de usuarios
* [ ] Puesta en producción

**Duración total estimada: 10-15 semanas**

---

## 10.0 Criterios de Aceptación

El sistema se considerará aceptado cuando cumpla los siguientes criterios:

### 10.1 Funcionales
- [x] El sistema puede procesar correctamente un archivo del informe 1044 del PMS
- [x] Se pueden crear reservas externas con todos los campos especificados
- [x] Las reservas externas se pueden editar y eliminar
- [x] El aforo total (PMS + Externos) se calcula correctamente (ADULTOS + NIÑOS)
- [x] El sistema muestra alerta cuando se excede el aforo de 40 personas
- [x] El semáforo de capacidad cambia de color según umbrales definidos
- [x] La Tab Restaurante muestra correctamente el número de comensales por servicio
- [x] El Rol Restaurante NO puede ver datos personales (nombres, teléfonos)
- [x] Las reservas canceladas NO cuentan para el aforo
- [x] El sistema permite que el número de comensales sea diferente al PAX del circuito

### 10.2 No Funcionales
- [x] El tiempo de guardado de una reserva es inferior a 1 segundo
- [x] El sistema soporta al menos 10 usuarios concurrentes sin degradación
- [x] Los backups diarios se ejecutan automáticamente
- [x] La interfaz es responsive y funciona en tablets
- [x] Todas las acciones CRUD quedan registradas en log de auditoría
- [x] El sistema funciona correctamente en Chrome, Firefox y Safari (últimas versiones)

### 10.3 Validación de Usuario
- [x] El personal de recepción confirma que la creación de reservas es más rápida que el método anterior (Excel)
- [x] El personal de recepción confirma que no ha habido errores de formato de datos desde la implementación
- [x] El personal de restaurante confirma que la información de comensales es clara y suficiente
- [x] La dirección del balneario confirma visibilidad mejorada sobre el aforo

---

## 11.0 Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
| --- | --- | --- | --- |
| **Cambio en estructura del informe 1044 del PMS** | Media | Alto | Implementar parser flexible con detección de cambios + alertas |
| **Pérdida de datos por fallo de BBDD** | Baja | Crítico | Sistema de backups automáticos diarios + pruebas de recuperación mensuales |
| **Overbooking accidental por error humano** | Media | Alto | Modal de alerta obligatorio + confirmación de doble clic |
| **Confusión con el concepto de "niño" (edad)** | Media | Medio | Tooltip explicativo en el formulario: "Niño: menor de 12 años" |
| **Personal de restaurante accede a datos personales** | Baja | Alto | Control de acceso estricto a nivel de base de datos + auditoría de sesiones |
| **Rendimiento degradado con crecimiento de datos** | Media | Medio | Índices optimizados + archivado de datos antiguos (>1 año) en tabla histórica |
| **Disponibilidad del sistema en horas punta** | Baja | Alto | Infraestructura cloud con auto-scaling + monitorización 24/7 |

---

## 12.0 Glosario de Términos Técnicos

| Término | Definición Técnica |
| --- | --- |
| **CRUD** | Create, Read, Update, Delete - Operaciones básicas de gestión de datos |
| **Modal** | Ventana flotante que se superpone a la interfaz principal |
| **Drag & Drop** | Funcionalidad de arrastrar y soltar archivos con el ratón |
| **Timestamp** | Marca temporal exacta de un evento (fecha + hora + segundos) |
| **RBAC** | Role-Based Access Control - Control de acceso basado en roles |
| **RGPD** | Reglamento General de Protección de Datos (normativa europea) |
| **Overbooking** | Sobreventa - Aceptar más reservas que la capacidad disponible |
| **Hash** | Función criptográfica unidireccional para proteger contraseñas |
| **Toast Notification** | Notificación emergente temporal en esquina de pantalla |
| **Log de Auditoría** | Registro inmutable de todas las acciones realizadas en el sistema |
| **Índice de Base de Datos** | Estructura que acelera las búsquedas en tablas grandes |
| **Responsive Design** | Diseño que se adapta a diferentes tamaños de pantalla |

---

## 13.0 Apéndices

### Apéndice A: Ejemplo de Estructura del Informe 1044

```
| Habitación | Nombre | Adultos | Niños | Franja Circuito | Servicio Comida | Servicio Cena |
| --- | --- | --- | --- | --- | --- | --- |
| 101 | García López, Juan | 2 | 0 | 10:00 | Sí | No |
| 205 | Martínez Ruiz, Ana | 1 | 2 | 10:30 | Sí | Sí |
| 308 | Fernández Gil, Carlos | 2 | 1 | 11:00 | No | Sí |
```

*Nota: La estructura exacta puede variar. El sistema debe ser flexible para adaptarse a pequeñas variaciones en nombres de columnas.*

### Apéndice B: Mockup de Pantalla Principal (Descripción)

**Barra Superior:**
- Logo del Balneario (izquierda)
- Selector de fecha con icono de calendario (centro)
- Botones: [Cargar Informe] [+ NUEVA RESERVA] (derecha)
- Indicador: "Última actualización: 16/02/2025 10:45"

**Grid de Franjas Horarias (3 columnas):**
Cada tarjeta contiene:
- Hora: "10:00" (grande, bold)
- Semáforo: ● Verde
- Desglose:
  - Hotel: 8 adultos + 2 niños
  - Externos: 5 adultos + 1 niño
  - **Total: 13 adultos + 3 niños (16 PAX)**
- Botón flotante [+] en esquina superior derecha

### Apéndice C: Ejemplo de Modal de Nueva Reserva

```
┌─────────────────────────────────────────┐
│  ➕ Nueva Reserva - Circuito Termal     │
│                                         │
│  Fecha: [16/02/2025 ▼]                 │
│  Hora:  [11:00 ▼]                      │
│                                         │
│  Nombre/Cliente: [__________________]  │
│  Teléfono: [_________] (obligatorio)   │
│                                         │
│  👥 Circuito Termal:                   │
│    Adultos: [2 ▼]  Niños: [1 ▼]       │
│                                         │
│  🍽️ Servicios de Restaurante:          │
│    ☐ Comida  → [Nº comensales: __]    │
│    ☐ Cena    → [Nº comensales: __]    │
│                                         │
│  💶 Importe Pago: [____€]              │
│  Estado: [Pagado ▼]                    │
│                                         │
│  📝 Detalles/BR:                        │
│  [_________________________________]   │
│  [_________________________________]   │
│                                         │
│       [Cancelar]  [Guardar Reserva]    │
└─────────────────────────────────────────┘
```

---

## Fin del Documento

**Versión:** 2.1  
**Fecha:** 29 de enero de 2026  
**Preparado por:** Asistente IA para PotenzzIA  
**Revisado por:** [Pendiente - Balneario Elgorriaga]  
**Aprobado por:** [Pendiente]  

**Control de Cambios:**
- v2.0: Eliminación de dependencia de Google Sheets, implementación de módulo CRUD interno
- v2.1: Actualización de estructura de campos de reserva, incorporación de Tab Restaurante, separación de comensales por servicio

---

**Próximos Pasos Recomendados:**
1. ✅ Revisión y aprobación del documento por parte del cliente (Balneario Elgorriaga)
2. 🔄 Creación del diagrama Entidad-Relación detallado de la base de datos
3. 🔄 Diseño de mockups visuales de alta fidelidad (UI/UX)
4. 🔄 Definición de la arquitectura técnica (stack tecnológico: frontend, backend, BBDD)
5. 🔄 Inicio de desarrollo según plan de implementación por fases
