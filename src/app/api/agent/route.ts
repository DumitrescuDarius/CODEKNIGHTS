import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body.prompt || "";
    const language = body.language || "";

    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const googleKey = process.env.GOOGLE_API_KEY;
    const googleModel = process.env.GOOGLE_MODEL || "gemini-1.5-flash";
    const providerOverride = process.env.AI_PROVIDER?.toLowerCase();

    if (!openrouterKey && !openaiKey && !googleKey) {
      return NextResponse.json({ error: "No AI API key configured" }, { status: 500 });
    }

    const userMessage = `You are an assistant that helps solve programming problems. When the user requests code, prefer providing a concise working solution in the requested language (${language}). Problem:\n${prompt}`;

    const useGoogle = providerOverride === 'google' ? true : (!providerOverride && !!googleKey);
    const useOpenAI = providerOverride === 'openai' ? true : (!providerOverride && !googleKey && !!openaiKey);
    const useOpenRouter = providerOverride === 'openrouter' ? true : (!providerOverride && !googleKey && !openaiKey && !!openrouterKey);

    const googleEndpointBase = process.env.GOOGLE_ENDPOINT || `https://generativelanguage.googleapis.com/v1beta/models`;
    
    const authKey = useGoogle ? googleKey : useOpenAI ? openaiKey : openrouterKey;
    let providerName = useGoogle ? 'Google' : useOpenAI ? 'OpenAI' : 'OpenRouter';

    let resp: Response;
    let selectedModel: string | null = null;
    const googleFallbackModels = [googleModel, 'gemini-1.5-flash', 'gemini-1.5-pro'];

    async function callGoogleWithModel(model: string) {
      const endpoint = `${googleEndpointBase}/${model}:generateContent?key=${googleKey}`;
      const body = JSON.stringify({ 
        contents: [{ parts: [{ text: userMessage }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
      });
      try {
        const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
        const data = await r.json();
        return { resp: r, data, model };
      } catch (e) {
        return { resp: null, data: String(e), model };
      }
    }

    if (useGoogle) {
      let result: any = null;
      for (const m of googleFallbackModels) {
        result = await callGoogleWithModel(m);
        if (result && result.resp && result.resp.ok) {
          resp = result.resp;
          (resp as any)._parsed = result.data;
          selectedModel = m;
          break;
        } else {
            console.error(`[api/agent] Google model ${m} failed. Status: ${result?.resp?.status}. Data: ${JSON.stringify(result?.data)}`);
        }
      }
      if (!resp!) {
         return NextResponse.json({ error: 'All Google models failed', debug: 'Check server logs for detailed error' }, { status: 500 });
      }
    } else {
        // Fallback to OpenAI/OpenRouter (simplified for brevity, you can keep original fallback logic)
        const url = useOpenAI ? "https://api.openai.com/v1/chat/completions" : "https://api.openrouter.ai/v1/chat/completions";
        const requestBody = JSON.stringify({ model: "gpt-4o-mini", messages: [ { role: "system", content: "You are a helpful programming assistant." }, { role: "user", content: userMessage } ], max_tokens: 1500, temperature: 0.2, });
        resp = await fetch(url, {
          method: "POST",
          headers: { "Authorization": `Bearer ${authKey}`, "Content-Type": "application/json" },
          body: requestBody,
        });
        (resp as any)._parsed = await resp.json();
    }

    const data = (resp as any)._parsed;
    let answer: string | undefined;
    
    if (useGoogle) {
      answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    } else {
      answer = data?.choices?.[0]?.message?.content;
    }

    return NextResponse.json({ answer, provider: { name: providerName, model: selectedModel } });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

