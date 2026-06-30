import fs from 'fs';

let content = fs.readFileSync('c:\\Users\\IdeaPad 1\\Documents\\GitHub\\casatuti-app\\src\\features\\admin\\tabs\\PaymentsTab.jsx', 'utf8');
content = content.replace(
  /: baseStudents.filter\(s => \(s.sucursal \|\| ''\).toUpperCase\(\) === selectedBranch\);/g,
  ": baseStudents.filter(s => (s.sucursal || '').toUpperCase() === selectedBranch.toUpperCase());"
);
content = content.replace(
  /return st && \(st.sucursal \|\| ''\).toUpperCase\(\) === selectedBranch;/g,
  "return st && (st.sucursal || '').toUpperCase() === selectedBranch.toUpperCase();"
);
fs.writeFileSync('c:\\Users\\IdeaPad 1\\Documents\\GitHub\\casatuti-app\\src\\features\\admin\\tabs\\PaymentsTab.jsx', content);

let contentClasses = fs.readFileSync('c:\\Users\\IdeaPad 1\\Documents\\GitHub\\casatuti-app\\src\\features\\admin\\tabs\\ClassesTab.jsx', 'utf8');
contentClasses = contentClasses.replace(
  /c => c.day === selectedDay && \(selectedBranchFilter === 'ALL' \|\| \(c.sucursal \|\| ''\).toUpperCase\(\) === selectedBranchFilter\)/g,
  "c => c.day === selectedDay && (selectedBranchFilter === 'ALL' || (c.sucursal || '').toUpperCase() === selectedBranchFilter.toUpperCase())"
);
fs.writeFileSync('c:\\Users\\IdeaPad 1\\Documents\\GitHub\\casatuti-app\\src\\features\\admin\\tabs\\ClassesTab.jsx', contentClasses);
console.log('Fixed PaymentsTab and ClassesTab');
