const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'MULTISELECCION.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('--- BUSCANDO CABECERAS ---');

jsonData.forEach((row, i) => {
    if (!row) return;
    const rowStr = row.join(' | ').toLowerCase();
    if (rowStr.includes('cliente') || rowStr.includes('hora') || rowStr.includes('hab')) {
        console.log(`POSIBLE CABECERA EN FILA ${i}:`);
        console.log(JSON.stringify(row));
    }
});

console.log('--- MUESTRA DE DATOS (Fila 13-20) ---');
for (let i = 13; i <= 20; i++) {
    if (jsonData[i]) {
        console.log(`Fila ${i}:`, JSON.stringify(jsonData[i]));
    }
}
