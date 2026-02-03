const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'MULTISELECCION.xlsx');
const workbook = XLSX.readFile(filePath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('Fecha en B6:', worksheet['B6']?.v);

// Buscar encabezado
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

console.log('Encabezado en fila:', headerRowIndex);
console.log('Columnas:', columnMapping);

let validRows = 0;
let skippedRows = 0;

for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row) continue;

    const cliente = row[columnMapping.cliente];
    const hora = row[columnMapping.hora];

    if (!cliente || hora === null || hora === undefined) {
        skippedRows++;
        continue;
    }

    validRows++;
    console.log(`Fila ${i}: ${cliente} - ${hora}`);
}

console.log('\n=== RESUMEN ===');
console.log('Filas válidas:', validRows);
console.log('Filas saltadas:', skippedRows);
