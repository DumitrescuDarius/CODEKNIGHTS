import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  console.log("Analyze API: Request received");
  
  if (!process.env.GEMINI_API_KEY) {
    console.error("Analyze API: Missing API Key in environment");
    return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
  }

  try {
    const { code, language, problemDescription } = await req.json();
    console.log("Analyze API: Input parsed", { 
      language, 
      codeLength: code?.length, 
      descLength: problemDescription?.length 
    });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Analyze the following ${language} code for the problem: "${problemDescription}".
      Provide a complexity analysis in JSON format. 
      The JSON must contain:
      - timeComplexity: string (e.g. "O(n log n)")
      - spaceComplexity: string (e.g. "O(n)")
      - scores: object with numbers 0-100 for:
        - efficiency: number
        - readability: number
        - maintainability: number
        - security: number
      - feedback: string (brief advice)

      Return ONLY the JSON. No markdown formatting or extra text.
      
      CODE:
      ${code}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("Analyze API: Gemini Raw Response:", text);

    // Robust JSON extraction
    let jsonStr = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    
    try {
      const analysis = JSON.parse(jsonStr);
      console.log("Analyze API: Successfully parsed JSON");
      return NextResponse.json(analysis);
    } catch (parseErr) {
      console.error("Analyze API: JSON Parse Error", parseErr);
      return NextResponse.json({ 
        error: "Invalid JSON from AI", 
        raw: text 
      }, { status: 500 });
    }
  } catch (err: any) {
    console.error("Analyze API Error:", err);
    return NextResponse.json({ 
      error: "Failed to analyze code", 
      details: err.message 
    }, { status: 500 });
  }
}
