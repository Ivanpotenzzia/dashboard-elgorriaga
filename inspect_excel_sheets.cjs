const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'MULTISELECCION.xlsx');
const workbook = XLSX.readFile(filePath);
console.log('Hojas disponibles:', workbook.SheetNames);

workbook.SheetNames.forEach(name => {
    const sheet = workbook.Sheets[name];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`Hoja "${name}": ${data.length} filas`);
    if (data.length > 0) {
        console.log(`Primera fila de "${name}":`, JSON.stringify(data[0]));
    }
});
