async function run() {
  const res = await fetch('http://127.0.0.1:5005/api/users');
  const users = await res.json();
  
  const teachers = users.filter(u => u.role === 'PROFE');
  console.log('Teachers before filter:', teachers.length);
  
  const searchTerm = '';
  const selectedBranch = 'ALL';
  const selectedStatus = 'ACTIVE';
  const blockedTeacherIds = [];
  
  const filteredTeachers = teachers.filter(tc => {
    const isBlocked = blockedTeacherIds.includes(tc.id);
    const matchesSearch = tc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tc.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = selectedBranch === 'ALL' || (tc.sucursal || 'CENTRO').toUpperCase() === selectedBranch;
    const matchesStatus = selectedStatus === 'ACTIVE' ? !isBlocked : isBlocked;
    return matchesSearch && matchesBranch && matchesStatus;
  });
  
  console.log('Filtered teachers:', filteredTeachers.length);
}

run();
