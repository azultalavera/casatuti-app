import fs from 'fs';

let content = fs.readFileSync('server.js', 'utf8');

content = content.replace(
`    res.status(201).json({ success: true, fecha, nombre: valNombre, tipo: valTipo, motivo: valNombre });
  } catch (error) {
    console.error('Error al registrar pago manual:', error);
    res.status(500).json({ error: 'Error al registrar el pago manual.' });
  }
});

// Solicitar pago pendiente (por parte de la alumna)`,
`    res.status(201).json({ success: true, fecha, nombre: valNombre, tipo: valTipo, motivo: valNombre });
  } catch (error) {
    console.error('Error al guardar día no laboral:', error);
    res.status(500).json({ error: 'Error al registrar día no laboral.' });
  }
});

// Solicitar pago pendiente (por parte de la alumna)`
);

fs.writeFileSync('server.js', content);
console.log("Fixed server.js");
