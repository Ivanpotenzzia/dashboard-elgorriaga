const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'MULTISELECCION.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('--- ESTRUCTURA DEL EXCEL ---');
console.log('Fecha en B6:', worksheet['B6'] ? worksheet['B6'].v : 'NO ENCONTRADA');
console.log('Filas 0 a 30:');
jsonData.slice(0, 30).forEach((row, i) => {
    if (row && row.length > 0) {
        console.log(`Fila ${i}:`, row.map(c => c === null ? 'null' : (typeof c === 'string' ? `"${c}"` : c)).join(' | '));
    } else {
        console.log(`Fila ${i}: vacía`);
    }
});
