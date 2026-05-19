fetch("http://localhost:3000/api/students/1", { method: "DELETE" }).then(res => res.json()).then(console.log).catch(console.error);
