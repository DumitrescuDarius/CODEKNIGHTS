import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  console.log("[api/agent] POST request received");
  try {
    const body = await req.json();
    console.log("[api/agent] Body parsed");
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

    const userMessage = `You are an assistant that helps solve programming problems. Please provide a concise working solution in the requested language (${language}) and include a brief explanation of your approach. Problem:\n${prompt}`;

    const useGoogle = providerOverride === 'google' ? true : (!providerOverride && !!googleKey);
    const useOpenAI = providerOverride === 'openai' ? true : (!providerOverride && !googleKey && !!openaiKey);
    const useOpenRouter = providerOverride === 'openrouter' ? true : (!providerOverride && !googleKey && !openaiKey && !!openrouterKey);

    const googleEndpointBase = process.env.GOOGLE_ENDPOINT || `https://generativelanguage.googleapis.com/v1beta`;
    
    const authKey = useGoogle ? googleKey : useOpenAI ? openaiKey : openrouterKey;
    let providerName = useGoogle ? 'Google' : useOpenAI ? 'OpenAI' : 'OpenRouter';

    let resp: Response;
    let selectedModel: string | null = null;
    const googleFallbackModels = ['gemini-robotics-er-1.6-preview', 'gemini-2.5-computer-use-preview-10-2025'];

    async function listModels() {
      const endpoint = `${googleEndpointBase}/models?key=${googleKey}`;
      try {
        const r = await fetch(endpoint);
        const data = await r.json();
        console.log(`[api/agent] Available models:`, JSON.stringify(data));
      } catch (e) {
        console.error(`[api/agent] Failed to list models: ${e}`);
      }
    }

    async function callGoogleWithModel(model: string) {
      // Endpoint format: .../v1beta/models/<modelName>:generateContent
      const endpoint = `${googleEndpointBase}/models/${model}:generateContent?key=${googleKey}`;
      const body = JSON.stringify({ 
        contents: [{ parts: [{ text: userMessage }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 4096 }
      });
      try {
        const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
        const responseText = await r.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            data = { error: 'Failed to parse JSON', raw: responseText };
        }
        return { resp: r, data, model, responseText };
      } catch (e) {
        return { resp: null, data: String(e), model, responseText: null };
      }
    }

    if (useGoogle) {
      await listModels(); // Debug
      let result: any = null;
      for (const m of googleFallbackModels) {
        console.log(`[api/agent] Attempting Google model: ${m}`);
        result = await callGoogleWithModel(m);
        if (result && result.resp && result.resp.ok) {
          resp = result.resp;
          (resp as any)._parsed = result.data;
          selectedModel = m;
          break;
        } else {
            if (!result || !result.resp) {
                console.error(`[api/agent] Google model ${m} failed: result.resp is null/undefined. Result: ${JSON.stringify(result)}`);
            } else {
                console.error(`[api/agent] Google model ${m} failed. Status: ${result.resp.status}. Body: ${result.responseText}`);
            }
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
