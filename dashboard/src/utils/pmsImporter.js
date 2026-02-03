import * as XLSX from 'xlsx';

/**
 * Parses the PMS Excel file
 * @param {File} file 
 * @returns {Promise<Array>} Array of reservation objects
 */
export const parsePmsReport = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Assume first sheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                resolve(processData(jsonData));
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};

const processData = (rawData) => {
    // Map fields flexibly (looking for keywords if column names change)
    // Structure: Habitación | Nombre | Adultos | Niños | Franja Circuito ...

    return rawData.map(row => {
        // Normalize keys to lowercase for searching
        const keys = Object.keys(row);
        const getVal = (keyPart) => {
            const key = keys.find(k => k.toLowerCase().includes(keyPart));
            return key ? row[key] : null;
        };

        const hora = getVal('franja') || getVal('hora');
        // Ensure hora is HH:MM formatted (Excel might give decimals or full dates)
        // This part requires robust parsing if Excel format varies. 
        // For now assuming string "10:00" or similar.

        return {
            habitacion: getVal('habita'),
            nombre: getVal('nombre'),
            adultos: parseInt(getVal('adulto')) || 0,
            ninos: parseInt(getVal('niño')) || 0,
            hora_reserva: normalizeTime(hora),
            servicio_comida: !!getVal('comida'), // Basic check
            servicio_cena: !!getVal('cena')
        };
    }).filter(r => r.hora_reserva); // Filter rows without time
};

const normalizeTime = (val) => {
    if (!val) return null;
    // If excel returns serial number for time (e.g. 0.41666) -> convert
    if (typeof val === 'number') {
        const totalMinutes = Math.round(val * 24 * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }
    // If string, try to keep HH:MM
    const str = String(val).trim();
    const match = str.match(/\d{1,2}:\d{2}/);
    return match ? match[0] : null;
};
