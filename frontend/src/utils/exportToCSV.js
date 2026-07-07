export const exportToCSV = (dataArray, filename) => {
  if (!dataArray || !dataArray.length) {
    alert("No hay datos para exportar.");
    return;
  }

  // Extraer las cabeceras a partir de las claves del primer objeto
  const headers = Object.keys(dataArray[0]);

  // Convertir los datos a formato CSV (delimitador: punto y coma para Excel ES, o coma)
  const csvRows = [];
  
  // Fila de cabeceras
  csvRows.push(headers.join(','));

  // Filas de datos
  for (const row of dataArray) {
    const values = headers.map(header => {
      let val = row[header] === null || row[header] === undefined ? '' : row[header];
      // Escapar comillas dobles y envolver en comillas si hay comas o saltos de línea
      const strVal = String(val).replace(/"/g, '""');
      if (strVal.includes(',') || strVal.includes('\n') || strVal.includes('"')) {
        return `"${strVal}"`;
      }
      return strVal;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  // Crear un enlace temporal para forzar la descarga
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
