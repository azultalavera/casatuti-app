const { spawn } = require('child_process');
const path = require('path');

// Lanzamos el servidor de backend en su directorio correcto para cargar las dependencias y el entorno .env
const child = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit'
});

child.on('exit', (code) => {
  process.exit(code);
});
