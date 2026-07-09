require('dotenv').config({ path: '.env.local' });
const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
  .then(r => r.json())
  .then(data => {
    if (data.models) {
      console.log(data.models.map(m => m.name).filter(n => n.includes("gemini")).join("\n"));
    } else {
      console.log(data);
    }
  }).catch(console.error);
