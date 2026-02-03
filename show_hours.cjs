const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'MULTISELECCION.xlsx');
const workbook = XLSX.readFile(filePath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

function normalizeHora(hora) {
    if (hora === null || hora === undefined) return null;

    if (typeof hora === 'number') {
        const totalMinutes = Math.round(hora * 24 * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    const horaStr = String(hora).trim();
    if (!horaStr) return null;

    const match = horaStr.match(/(\d{1,2}):(\d{2})/);
    if (match) {
        return `${String(match[1]).padStart(2, '0')}:${String(match[2]).padStart(2, '0')}`;
    }

    return null;
}

// Buscar encabezado
let headerRowIndex = 6; // Ya sabemos que está en la fila 6
let columnMapping = { cliente: 0, hora: 1, hab: 2, cant: 3, tecnica: 4 };

const horas = [];

for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || !Array.isArray(row)) continue;

    const clienteVal = row[columnMapping.cliente];
    const horaRaw = row[columnMapping.hora];

    if (!clienteVal || horaRaw === null || horaRaw === undefined) continue;

    const horaNormal = normalizeHora(horaRaw);
    if (horaNormal) {
        horas.push(horaNormal);
    }
}

// Contar horas únicas
const horasUnicas = {};
horas.forEach(h => {
    horasUnicas[h] = (horasUnicas[h] || 0) + 1;
});

console.log('=== DISTRIBUCIÓN DE HORAS EN EL ARCHIVO ===');
Object.keys(horasUnicas).sort().forEach(hora => {
    console.log(`${hora}: ${horasUnicas[hora]} reservas`);
});

console.log('\n=== RESUMEN ===');
console.log(`Horas diferentes: ${Object.keys(horasUnicas).length}`);
console.log(`Hora mínima: ${Object.keys(horasUnicas).sort()[0]}`);
console.log(`Hora máxima: ${Object.keys(horasUnicas).sort().reverse()[0]}`);
