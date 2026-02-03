const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'MULTISELECCION.xlsx');
const workbook = XLSX.readFile(filePath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('--- DETALLE DE FILAS 6 A 15 ---');
for (let i = 6; i <= 15; i++) {
    console.log(`Fila ${i}:`, JSON.stringify(jsonData[i]));
}
