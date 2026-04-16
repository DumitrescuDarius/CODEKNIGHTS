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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Analyze this ${language} code and return ONLY this JSON structure, no markdown:
{"timeComplexity":"O(n)","spaceComplexity":"O(n)","scores":{"efficiency":80,"readability":80,"maintainability":80,"security":80},"feedback":"Good implementation"}

CODE:
${code}

Return only valid JSON, starting with {.`;

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
    
    const errorMessage = err.message || "";
    if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("quota")) {
      return NextResponse.json({ 
        error: "API quota exceeded",
        details: "Gemini API free tier limit reached. Please try again later or use a different API key with available quota."
      }, { status: 429 });
    }
    
    return NextResponse.json({ 
      error: "Failed to analyze code", 
      details: err.message 
    }, { status: 500 });
  }
}
