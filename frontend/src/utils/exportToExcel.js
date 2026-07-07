import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const exportToExcel = async (dataArray, filename, sheetName = 'Reporte') => {
  if (!dataArray || !dataArray.length) {
    alert("No hay datos para exportar.");
    return;
  }

  // 1. Crear el Workbook y la Worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // 2. Extraer cabeceras (keys del primer objeto)
  const headers = Object.keys(dataArray[0]);
  
  // 3. Configurar las columnas en la worksheet
  worksheet.columns = headers.map(header => ({
    header: header.toUpperCase(),
    key: header,
    width: 25 // Ancho por defecto
  }));

  // 4. Agregar filas de datos
  worksheet.addRows(dataArray);

  // 5. Estilizar la cabecera (Fila 1)
  const headerRow = worksheet.getRow(1);
  headerRow.font = { name: 'Arial', family: 4, size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF455F3E' } // Verde Oliva (var(--verde-oliva) aproximado)
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  
  // 6. Estilizar todas las filas
  worksheet.eachRow((row, rowNumber) => {
    // Bordes para todas las celdas
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
      };
      // Alinear datos al centro por defecto, menos la cabecera
      if (rowNumber !== 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    });

    // Filas pares con fondo sutilmente diferente (cebra)
    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF9F9F9' }
      };
    }
  });

  // Ajustar altura de cabecera
  headerRow.height = 25;

  // 7. Escribir y guardar el archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
};
