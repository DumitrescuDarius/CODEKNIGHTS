require('dotenv').config({path: '.env'});
async function test() {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  
  const r = await fetch(endpoint);
  const data = await r.json();
  console.log("Models:", JSON.stringify(data, null, 2));
}
test();
