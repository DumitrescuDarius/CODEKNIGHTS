fetch("http://localhost:3000/api/agent", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ messages: [{ role: "user", content: "Hello" }], language: "cpp" })
}).then(r => r.json()).then(console.log).catch(console.error);
