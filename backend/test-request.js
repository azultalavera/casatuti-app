async function run() {
  try {
    const resUsers = await fetch('http://127.0.0.1:5000/api/users');
    const users = await resUsers.json();
    const student = users.find(u => u.role === 'ALUMNO');
    
    if (!student) {
      console.log("No student found");
      return;
    }
    
    console.log("Found student:", student.name, student.id);
    
    const resReq = await fetch('http://127.0.0.1:5000/api/payments/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: student.id,
        amount: 8000,
        creditsToAdd: 4
      })
    });
    
    const result = await resReq.json();
    console.log("Payment request result:", result);
    
    const resPay = await fetch('http://127.0.0.1:5000/api/payments');
    const payments = await resPay.json();
    const pending = payments.filter(p => p.status === 'PENDING');
    console.log("Pending payments:", pending);
    
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
