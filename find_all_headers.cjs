const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'MULTISELECCION.xlsx');
const workbook = XLSX.readFile(filePath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('=== BUSCANDO TODOS LOS ENCABEZADOS ===\n');

for (let i = 0; i < Math.min(80, jsonData.length); i++) {
    const row = jsonData[i];
    if (!row) continue;

    const rowStr = JSON.stringify(row).toLowerCase();
    if (rowStr.includes('cliente') && rowStr.includes('hora')) {
        console.log(`\n🔍 ENCABEZADO ENCONTRADO EN FILA ${i}:`);
        console.log(JSON.stringify(row));

        // Mostrar siguientes 3 filas de datos
        console.log('\nPrimeras 3 filas de datos después del encabezado:');
        for (let j = 1; j <= 3; j++) {
            if (jsonData[i + j]) {
                console.log(`  Fila ${i + j}:`, JSON.stringify(jsonData[i + j]).substring(0, 150));
            }
        }
    }
}

console.log('\n=== BUSCANDO SECCIONES "SALA:" ===\n');

for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row) continue;

    const rowStr = JSON.stringify(row).toLowerCase();
    if (rowStr.includes('sala')) {
        console.log(`Fila ${i}: ${JSON.stringify(row).substring(0, 100)}`);
    }
}
