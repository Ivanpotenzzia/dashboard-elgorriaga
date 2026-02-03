const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'MULTISELECCION.xlsx');
const workbook = XLSX.readFile(filePath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('='.repeat(60));
console.log('ANÁLISIS COMPLETO DEL ARCHIVO MULTISELECCION.xlsx');
console.log('='.repeat(60));

// Encontrar encabezado
let headerRowIndex = -1;
let columnMapping = { cliente: -1, hora: -1, hab: -1, cant: -1, tecnica: -1 };

for (let i = 0; i < 50; i++) {
    const row = jsonData[i];
    if (!row) continue;

    row.forEach((cell, j) => {
        if (!cell) return;
        const cellStr = String(cell).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

        if (cellStr.includes('cliente')) columnMapping.cliente = j;
        else if (cellStr.includes('hora')) columnMapping.hora = j;
        else if (cellStr.includes('hab')) columnMapping.hab = j;
        else if (cellStr.includes('cant')) columnMapping.cant = j;
        else if (cellStr.includes('tecnica')) columnMapping.tecnica = j;
    });

    if (columnMapping.cliente !== -1 && columnMapping.hora !== -1) {
        headerRowIndex = i;
        break;
    }
}

let reservasPiscinaTermal = 0;
let reservasPiscinaImserso = 0;
let personasPiscinaTermal = 0;
let personasPiscinaImserso = 0;

for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row) continue;

    const cliente = row[columnMapping.cliente];
    const hora = row[columnMapping.hora];
    const tecnica = row[columnMapping.tecnica];
    const cantidad = parseInt(row[columnMapping.cant]) || 1;

    if (!cliente || hora === null || hora === undefined) continue;

    const tecnicaStr = String(tecnica || '').toUpperCase();

    if (tecnicaStr.includes('IMS') || tecnicaStr.includes('25')) {
        reservasPiscinaImserso++;
        personasPiscinaImserso += cantidad;
    } else {
        reservasPiscinaTermal++;
        personasPiscinaTermal += cantidad;
    }
}

console.log('\nPISCINA TERMAL (60 minutos):');
console.log(`  - Reservas: ${reservasPiscinaTermal}`);
console.log(`  - Personas: ${personasPiscinaTermal}`);

console.log('\nPISCINA IMSERSO (30 minutos):');
console.log(`  - Reservas: ${reservasPiscinaImserso}`);
console.log(`  - Personas: ${personasPiscinaImserso}`);

console.log('\nTOTAL:');
console.log(`  - Reservas: ${reservasPiscinaTermal + reservasPiscinaImserso}`);
console.log(`  - Personas: ${personasPiscinaTermal + personasPiscinaImserso}`);

console.log('\n' + '='.repeat(60));
