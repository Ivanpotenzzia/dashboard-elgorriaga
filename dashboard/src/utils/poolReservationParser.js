/**
 * Pool Reservation Parser
 * Parsea el archivo MULTISELECCION.xlsx con datos de reservas de piscina
 */

import * as XLSX from 'xlsx';

/**
 * Determina la duración de la reserva según la técnica
 */
function getDuracionFromTecnica(tecnica) {
    if (!tecnica) return 60;
    const tecnicaUpper = String(tecnica).toUpperCase();
    // Según instrucciones: IMS es 30 min, el resto 60 min.
    if (tecnicaUpper.includes('IMS') || tecnicaUpper.includes('IMSERSO') || tecnicaUpper.includes('25')) {
        return 30;
    }
    return 60;
}

/**
 * Categoriza la reserva según el campo Técnica
 * - HUESPEDES: "RECORRIDO TERMAL ALOJADOS 60´"
 * - EXTERNOS: "RECORRIDO TERMAL NO ALOJADOS 60´"
 * - IMSERSO: "IMS PISCINA TERMAL 25´"
 */
function getCategoriaFromTecnica(tecnica) {
    if (!tecnica) return 'OTROS';
    const tecnicaUpper = String(tecnica).toUpperCase();

    // Primero verificar NO ALOJADOS (debe ir antes que ALOJADOS)
    if (tecnicaUpper.includes('NO ALOJADOS')) {
        return 'EXTERNOS';
    }

    // Luego ALOJADOS
    if (tecnicaUpper.includes('ALOJADOS')) {
        return 'HUESPEDES';
    }

    // IMSERSO
    if (tecnicaUpper.includes('IMS') || tecnicaUpper.includes('IMSERSO')) {
        return 'IMSERSO';
    }

    return 'OTROS';
}


/**
 * Normaliza el formato de hora a HH:MM
 */
function normalizeHora(hora) {
    if (hora === null || hora === undefined) return null;

    // Si es un número (formato Excel de tiempo serial)
    if (typeof hora === 'number') {
        const totalMinutes = Math.round(hora * 24 * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    // Si es string, intentar parsear
    const horaStr = String(hora).trim();
    if (!horaStr) return null;

    // Formato HH:MM o HH:MM:SS
    const match = horaStr.match(/(\d{1,2}):(\d{2})/);
    if (match) {
        return `${String(match[1]).padStart(2, '0')}:${String(match[2]).padStart(2, '0')}`;
    }

    // Formato HHMM
    const match2 = horaStr.match(/^(\d{3,4})$/);
    if (match2) {
        const num = match2[1].padStart(4, '0');
        return `${num.substring(0, 2)}:${num.substring(2, 4)}`;
    }

    return null;
}

/**
 * Normaliza fecha de Excel a formato YYYY-MM-DD
 */
function normalizeFecha(fecha) {
    if (fecha === null || fecha === undefined) return null;

    // Si es Date object
    if (fecha instanceof Date && !isNaN(fecha.getTime())) {
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Si es un número (formato Excel de fecha serial)
    if (typeof fecha === 'number') {
        // Excel serial date: días desde 1899-12-30
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + fecha * 24 * 60 * 60 * 1000);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Si es string
    const fechaStr = String(fecha).trim();

    // Formato DD/MM/YYYY
    const dmyMatch = fechaStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dmyMatch) {
        return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
    }

    return null;
}

/**
 * Parsea el archivo MULTISELECCION.xlsx
 */
export async function parsePoolReservationsFile(file) {
    console.log('Iniciando parseo de archivo de piscina:', file.name);

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                console.log('--- EXCEL PARSER V2 (Fix headerRowIndex) ---');

                // Declarar variables críticas al inicio del scope para evitar ReferenceError
                let headerRowIndex = -1;
                let columnMapping = {
                    cliente: -1, hora: -1, hab: -1, cant: -1, tecnica: -1,
                    tel: -1, adultos: -1, ninos: -1, importe: -1, pago: -1, detalles: -1
                };

                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Extraer fecha de celda B6
                const fechaCell = worksheet['B6'];
                if (!fechaCell) {
                    throw new Error('No se encontró fecha en la celda B6 del Excel.');
                }

                const fechaReserva = normalizeFecha(fechaCell.v);
                if (!fechaReserva) {
                    throw new Error(`Fomato de fecha inválido en B6: ${fechaCell.v}`);
                }

                console.log('Fecha de reserva extraída:', fechaReserva);

                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                console.log('Total filas en la hoja:', jsonData.length);

                // Buscar el encabezado

                for (let i = 0; i < Math.min(50, jsonData.length); i++) {
                    const row = jsonData[i];
                    if (!row || !Array.isArray(row)) continue;

                    let rowMarkers = 0;
                    row.forEach((cell, j) => {
                        if (cell === null || cell === undefined) return;

                        const cellStr = String(cell).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

                        if (cellStr.includes('cliente') || cellStr.includes('nombre')) { columnMapping.cliente = j; rowMarkers++; }
                        else if (cellStr.includes('hora')) { columnMapping.hora = j; rowMarkers++; }
                        else if (cellStr.includes('hab')) { columnMapping.hab = j; rowMarkers++; }
                        else if (cellStr.includes('cant')) { columnMapping.cant = j; rowMarkers++; }
                        else if (cellStr.includes('tecnica')) { columnMapping.tecnica = j; rowMarkers++; }
                        else if (cellStr.includes('tel')) { columnMapping.tel = j; }
                        else if (cellStr.includes('adult')) { columnMapping.adultos = j; }
                        else if (cellStr.includes('nin')) { columnMapping.ninos = j; }
                        else if (cellStr.includes('import')) { columnMapping.importe = j; }
                        else if (cellStr.includes('pago') || cellStr.includes('estado')) { columnMapping.pago = j; }
                        else if (cellStr.includes('detall') || cellStr.includes('observ')) { columnMapping.detalles = j; }
                    });

                    // Si encontramos al menos Cliente y Hora, asumimos que es el encabezado
                    if (columnMapping.cliente !== -1 && columnMapping.hora !== -1) {
                        headerRowIndex = i;
                        console.log(`Encabezado encontrado en fila ${i}:`, columnMapping);
                        break;
                    }
                }

                if (headerRowIndex === -1) {
                    throw new Error('No se pudo encontrar el encabezado con las columnas "Cliente" y "Hora" en las primeras 50 filas.');
                }

                const reservations = [];
                let filasConDatos = 0;
                let filasSaltadas = 0;
                const primerasFilasSaltadas = [];

                // Procesar TODAS las filas del archivo, incluso si hay secciones separadas
                for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || !Array.isArray(row)) continue;

                    const clienteVal = row[columnMapping.cliente];
                    const horaRaw = row[columnMapping.hora];

                    // Si la fila no tiene cliente Y hora, saltarla pero CONTINUAR con el resto
                    // Esto permite procesar múltiples secciones (Piscina Termal + Piscina IMSERSO)
                    if (!clienteVal || horaRaw === null || horaRaw === undefined) {
                        filasSaltadas++;
                        if (primerasFilasSaltadas.length < 5) {
                            primerasFilasSaltadas.push({ fila: i, motivo: 'Cliente o Hora vacíos', cliente: clienteVal, hora: horaRaw });
                        }
                        continue; // IMPORTANTE: continue (no break) para seguir procesando
                    }

                    filasConDatos++;
                    const horaNormal = normalizeHora(horaRaw);
                    if (!horaNormal) {
                        console.warn(`Hora inválida en fila ${i}:`, horaRaw);
                        filasSaltadas++; // También se salta si la hora es inválida
                        if (primerasFilasSaltadas.length < 5) {
                            primerasFilasSaltadas.push({ fila: i, motivo: 'Hora inválida', hora: horaRaw });
                        }
                        continue;
                    }

                    const tecnicaVal = columnMapping.tecnica !== -1 ? row[columnMapping.tecnica] : 'PISCINA TERMAL';

                    reservations.push({
                        fecha_reserva: fechaReserva,
                        hora_reserva: horaNormal,
                        cliente: String(clienteVal).trim(),
                        habitacion: columnMapping.hab !== -1 ? String(row[columnMapping.hab] || '').trim() : null,
                        cantidad: columnMapping.cant !== -1 ? parseInt(row[columnMapping.cant]) || 1 : 1,
                        tecnica: String(tecnicaVal || '').trim(),
                        duracion_minutos: getDuracionFromTecnica(tecnicaVal),
                        categoria: getCategoriaFromTecnica(tecnicaVal),
                        // Campos adicionales si existen en el Excel
                        telefono: columnMapping.tel !== -1 ? String(row[columnMapping.tel] || '').trim() : null,
                        adultos: columnMapping.adultos !== -1 ? parseInt(row[columnMapping.adultos]) || 0 : 0,
                        ninos: columnMapping.ninos !== -1 ? parseInt(row[columnMapping.ninos]) || 0 : 0,
                        importe: columnMapping.importe !== -1 ? parseFloat(row[columnMapping.importe]) || 0 : 0,
                        estado_pago: columnMapping.pago !== -1 ? String(row[columnMapping.pago] || '').trim() : null,
                        detalles: columnMapping.detalles !== -1 ? String(row[columnMapping.detalles] || '').trim() : null
                    });
                }

                console.log(`Parseo finalizado:`);
                console.log(`- Encabezado en fila: ${headerRowIndex}`);
                console.log(`- Filas revisadas: ${jsonData.length - headerRowIndex - 1}`);
                console.log(`- Filas con datos válidos: ${filasConDatos}`);
                console.log(`- Filas saltadas: ${filasSaltadas}`);
                console.log(`- Reservas procesadas: ${reservations.length}`);
                if (primerasFilasSaltadas.length > 0) {
                    console.log(`- Primeras filas saltadas:`, primerasFilasSaltadas);
                }
                if (reservations.length > 0) {
                    console.log(`- Primera reserva procesada: Fila ~${headerRowIndex + 1}, ${reservations[0].cliente} a las ${reservations[0].hora_reserva}`);
                    console.log(`- Última reserva procesada: ${reservations[reservations.length - 1].cliente} a las ${reservations[reservations.length - 1].hora_reserva}`);
                }

                if (reservations.length === 0) {
                    throw new Error('No se encontraron filas de reservas válidas después del encabezado.');
                }

                resolve({
                    fecha: fechaReserva,
                    reservations
                });

            } catch (error) {
                console.error('Error en parsePoolReservationsFile:', error);
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Error al leer el archivo Excel.'));
        reader.readAsArrayBuffer(file);
    });
}
