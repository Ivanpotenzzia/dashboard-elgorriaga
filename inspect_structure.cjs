const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'MULTISELECCION.xlsx');
const workbook = XLSX.readFile(filePath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('=== ESTRUCTURA DETALLADA FILAS 0-75 ===\n');

for (let i = 0; i <= 75; i++) {
    const row = jsonData[i];
    if (!row || row.length === 0) {
        console.log(`Fila ${i}: [vacía]`);
    } else {
        const preview = JSON.stringify(row).substring(0, 100);
        const hasCliente = row[0] && String(row[0]).trim().length > 0;
        const hasHora = row[1] !== null && row[1] !== undefined;
        console.log(`Fila ${i}: ${hasCliente ? '✓' : ' '} ${hasHora ? '✓' : ' '} ${preview}`);
    }
}
