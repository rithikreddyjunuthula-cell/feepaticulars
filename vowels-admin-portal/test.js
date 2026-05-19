fetch("http://localhost:3000/api/students", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Testing", class: "1", section: "A", totalFee: 1000, dueFee: 500 })
}).then(res => res.json()).then(console.log).catch(console.error);
