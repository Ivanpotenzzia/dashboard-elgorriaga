/**
 * Pool Reservation Parser V5
 * Parsea archivos MULTISELECCION.xlsx con datos de reservas de piscina
 * Soporta archivos diarios y quincenales (múltiples fechas)
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
 * Detecta el tipo de archivo: diario o quincenal
 */
function detectFileType(jsonData) {
    let dateMarkers = 0;
    for (let i = 0; i < Math.min(100, jsonData.length); i++) {
        const row = jsonData[i];
        if (row && row[0] === 'Día :') {
            dateMarkers++;
            if (dateMarkers > 1) return 'QUINCENAL';
        }
    }
    return 'DIARIO';
}

/**
 * Busca el índice de columna para los campos de encabezado
 */
function findColumnMapping(row) {
    const mapping = {
        cliente: -1, hora: -1, hab: -1, cant: -1, tecnica: -1,
        tel: -1, adultos: -1, ninos: -1, importe: -1, pago: -1, detalles: -1
    };

    if (!row || !Array.isArray(row)) return { mapping, found: false };

    row.forEach((cell, j) => {
        if (cell === null || cell === undefined) return;

        const cellStr = String(cell).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

        if (cellStr.includes('cliente') || cellStr.includes('nombre')) { mapping.cliente = j; }
        else if (cellStr.includes('hora')) { mapping.hora = j; }
        else if (cellStr.includes('hab')) { mapping.hab = j; }
        else if (cellStr.includes('cant')) { mapping.cant = j; }
        else if (cellStr.includes('tecnica')) { mapping.tecnica = j; }
        else if (cellStr.includes('tel')) { mapping.tel = j; }
    });

    return { mapping, found: mapping.cliente !== -1 && mapping.hora !== -1 };
}

/**
 * Parsea una fila de datos y devuelve un objeto de reserva
 */
function parseDataRow(row, columnMapping, currentDate) {
    const clienteVal = row[columnMapping.cliente];
    const horaRaw = row[columnMapping.hora];

    if (!clienteVal || horaRaw === null || horaRaw === undefined) {
        return null;
    }

    const horaNormal = normalizeHora(horaRaw);
    if (!horaNormal) {
        return null;
    }

    const tecnicaVal = columnMapping.tecnica !== -1 ? row[columnMapping.tecnica] : 'PISCINA TERMAL';

    return {
        fecha_reserva: currentDate,
        hora_reserva: horaNormal,
        cliente: String(clienteVal).trim(),
        habitacion: columnMapping.hab !== -1 ? String(row[columnMapping.hab] || '').trim() : null,
        cantidad: columnMapping.cant !== -1 ? parseInt(row[columnMapping.cant]) || 1 : 1,
        tecnica: String(tecnicaVal || '').trim(),
        duracion_minutos: getDuracionFromTecnica(tecnicaVal)
    };
}

/**
 * Parsea el archivo MULTISELECCION.xlsx
 * Detecta automáticamente si es diario o quincenal
 */
export async function parsePoolReservationsFile(file) {
    console.log('Iniciando parseo de archivo de piscina:', file.name);

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                console.log('--- EXCEL PARSER V5 (Multi-día) ---');

                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                console.log('Total filas en la hoja:', jsonData.length);

                const fileType = detectFileType(jsonData);
                console.log('Tipo de archivo detectado:', fileType);

                if (fileType === 'QUINCENAL') {
                    // Parseo multi-día: buscar marcadores "Día :" y agrupar por fecha
                    const reservationsByDate = {};
                    let currentDate = null;
                    let columnMapping = null;
                    let totalReservations = 0;

                    for (let i = 0; i < jsonData.length; i++) {
                        const row = jsonData[i];
                        if (!row || !Array.isArray(row)) continue;

                        // Detectar cambio de fecha con "Día :"
                        if (row[0] === 'Día :' && row[1]) {
                            const newDate = normalizeFecha(row[1]);
                            if (newDate) {
                                currentDate = newDate;
                                columnMapping = null; // Resetear para buscar nuevo encabezado
                                if (!reservationsByDate[currentDate]) {
                                    reservationsByDate[currentDate] = [];
                                }
                                console.log(`📅 Nueva fecha detectada: ${currentDate}`);
                            }
                            continue;
                        }

                        // Buscar encabezado si no lo tenemos
                        if (!columnMapping) {
                            const { mapping, found } = findColumnMapping(row);
                            if (found) {
                                columnMapping = mapping;
                                continue;
                            }
                        }

                        // Parsear fila de datos si tenemos fecha y encabezado
                        if (currentDate && columnMapping) {
                            const reservation = parseDataRow(row, columnMapping, currentDate);
                            if (reservation) {
                                reservationsByDate[currentDate].push(reservation);
                                totalReservations++;
                            }
                        }
                    }

                    const fechas = Object.keys(reservationsByDate);
                    console.log(`Parseo quincenal finalizado:`);
                    console.log(`- Fechas encontradas: ${fechas.length}`);
                    console.log(`- Total reservas: ${totalReservations}`);
                    fechas.forEach(f => {
                        console.log(`  · ${f}: ${reservationsByDate[f].length} reservas`);
                    });

                    if (totalReservations === 0) {
                        throw new Error('No se encontraron reservas válidas en el archivo quincenal.');
                    }

                    resolve({
                        isMultiDate: true,
                        fechas,
                        reservationsByDate,
                        totalReservations
                    });

                } else {
                    // Parseo diario (lógica original)
                    let headerRowIndex = -1;
                    let columnMapping = {
                        cliente: -1, hora: -1, hab: -1, cant: -1, tecnica: -1
                    };

                    // Extraer fecha de celda B6
                    const fechaCell = worksheet['B6'];
                    if (!fechaCell) {
                        throw new Error('No se encontró fecha en la celda B6 del Excel.');
                    }

                    const fechaReserva = normalizeFecha(fechaCell.v);
                    if (!fechaReserva) {
                        throw new Error(`Formato de fecha inválido en B6: ${fechaCell.v}`);
                    }

                    console.log('Fecha de reserva extraída:', fechaReserva);

                    // Buscar el encabezado
                    for (let i = 0; i < Math.min(50, jsonData.length); i++) {
                        const { mapping, found } = findColumnMapping(jsonData[i]);
                        if (found) {
                            headerRowIndex = i;
                            columnMapping = mapping;
                            console.log(`Encabezado encontrado en fila ${i}:`, columnMapping);
                            break;
                        }
                    }

                    if (headerRowIndex === -1) {
                        throw new Error('No se pudo encontrar el encabezado con las columnas "Cliente" y "Hora".');
                    }

                    const reservations = [];

                    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
                        const row = jsonData[i];
                        if (!row || !Array.isArray(row)) continue;

                        const reservation = parseDataRow(row, columnMapping, fechaReserva);
                        if (reservation) {
                            reservations.push(reservation);
                        }
                    }

                    console.log(`Parseo diario finalizado:`);
                    console.log(`- Reservas procesadas: ${reservations.length}`);

                    if (reservations.length === 0) {
                        throw new Error('No se encontraron filas de reservas válidas.');
                    }

                    resolve({
                        isMultiDate: false,
                        fecha: fechaReserva,
                        reservations
                    });
                }

            } catch (error) {
                console.error('Error en parsePoolReservationsFile:', error);
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Error al leer el archivo Excel.'));
        reader.readAsArrayBuffer(file);
    });
}
