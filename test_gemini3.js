require('dotenv').config({path: '.env'});
async function test() {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${key}`;
  
  const requestBody = JSON.stringify({ 
    contents: [{ parts: [{ text: "Hello" }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 4096 }
  });
  
  const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: requestBody });
  const text = await r.text();
  console.log("Response:", text);
}
test();
