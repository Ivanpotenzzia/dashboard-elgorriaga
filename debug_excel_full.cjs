const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'MULTISELECCION.xlsx');
const workbook = XLSX.readFile(filePath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('--- BUSCANDO ESTRUCTURA COMPLETA ---');
console.log('Fecha en B6:', worksheet['B6'] ? worksheet['B6'].v : 'NO ENCONTRADA');
console.log('\n--- Primeras 20 filas completas ---');

for (let i = 0; i < 20; i++) {
    if (jsonData[i]) {
        console.log(`\nFila ${i}:`, JSON.stringify(jsonData[i]));
    }
}

console.log('\n--- Buscando menciones de SALA e IMSERSO ---');
for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row) continue;

    const rowStr = JSON.stringify(row).toLowerCase();
    if (rowStr.includes('sala') || rowStr.includes('imserso')) {
        console.log(`Fila ${i} (contiene SALA/IMSERSO):`, JSON.stringify(row).substring(0, 200));
    }
}

console.log('\n--- Total de filas con datos ---');
let rowsWithData = 0;
for (let i = 0; i < jsonData.length; i++) {
    if (jsonData[i] && jsonData[i].length > 0) rowsWithData++;
}
console.log(`Total filas con datos: ${rowsWithData}`);
