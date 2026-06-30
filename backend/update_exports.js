import fs from 'fs';
import path from 'path';

const dir = 'c:\\Users\\IdeaPad 1\\Documents\\GitHub\\casatuti-app\\src\\features\\admin\\tabs\\reports';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace import
  content = content.replace(/import \{ exportToCSV \} from '\.\.\/\.\.\/\.\.\/\.\.\/utils\/exportToCSV';/g, "import { exportToExcel } from '../../../../utils/exportToExcel';");
  
  // Replace calls
  content = content.replace(/exportToCSV\(/g, 'exportToExcel(');

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});
