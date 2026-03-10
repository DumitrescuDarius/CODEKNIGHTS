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
    
    console.log("Analyze API: Gemini Raw Response length:", text.length);

    // Robust JSON extraction: look for the first '{' and the last '}'
    let jsonStr = "";
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = text.substring(firstBrace, lastBrace + 1);
    } else {
      jsonStr = text;
    }
    
    try {
      // Clean up potential markdown or junk around the JSON
      const analysis = JSON.parse(jsonStr);
      console.log("Analyze API: Successfully parsed JSON");
      
      // Ensure all required fields exist
      const fallback = {
        timeComplexity: "O(N)",
        spaceComplexity: "O(N)",
        scores: { efficiency: 70, readability: 70, maintainability: 70, security: 70 },
        feedback: "Code analysis completed."
      };

      return NextResponse.json({ ...fallback, ...analysis });
    } catch (parseErr) {
      console.error("Analyze API: JSON Parse Error", parseErr, "Raw text excerpt:", text.substring(0, 100));
      return NextResponse.json({ 
        error: "Invalid response format from AI",
        details: "The AI did not return valid JSON. Please try again."
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
