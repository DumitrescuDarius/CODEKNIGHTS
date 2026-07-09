import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  console.log("[api/agent] POST request received");
  try {
    const body = await req.json();
    console.log("[api/agent] Body parsed");
    const messages = body.messages || []; // Array of { role: 'user' | 'assistant', content: string }
    const language = body.language || "";

    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const googleKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const googleModel = process.env.GOOGLE_MODEL || "gemini-2.0-flash";
    const providerOverride = process.env.AI_PROVIDER?.toLowerCase();

    if (!openrouterKey && !openaiKey && !googleKey && !groqKey) {
      return NextResponse.json({ error: "No AI API key configured" }, { status: 500 });
    }

    const useGoogle = providerOverride === 'google' ? true : (!providerOverride && !!googleKey);
    const useOpenAI = providerOverride === 'openai' ? true : (!providerOverride && !googleKey && !!openaiKey);
    const useGroq = providerOverride === 'groq' ? true : (!providerOverride && !googleKey && !openaiKey && !!groqKey);
    const useOpenRouter = providerOverride === 'openrouter' ? true : (!providerOverride && !googleKey && !openaiKey && !groqKey && !!openrouterKey);

    const googleEndpointBase = process.env.GOOGLE_ENDPOINT || `https://generativelanguage.googleapis.com/v1beta`;
    
    const authKey = useGoogle ? googleKey : useOpenAI ? openaiKey : useGroq ? groqKey : openrouterKey;
    let providerName = useGoogle ? 'Google' : useOpenAI ? 'OpenAI' : useGroq ? 'Groq' : 'OpenRouter';

    let resp: Response;
    let selectedModel: string | null = null;
    const googleFallbackModels = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-2.0-flash'];

    const listModels = async () => {
      const endpoint = `${googleEndpointBase}/models?key=${googleKey}`;
      try {
        const r = await fetch(endpoint);
        const data = await r.json();
        console.log(`[api/agent] Available models:`, JSON.stringify(data));
      } catch (e) {
        console.error(`[api/agent] Failed to list models: ${e}`);
      }
    };

    const callGoogleWithModel = async (model: string) => {
      const endpoint = `${googleEndpointBase}/models/${model}:generateContent?key=${googleKey}`;
      
      let contents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content || "" }]
      }));

      // Sanitize contents for Gemini (must strictly alternate user/model, no empty texts)
      const sanitizedContents: any[] = [];
      let lastRole = null;
      for (const m of contents) {
        if (!m.parts[0].text || m.parts[0].text.trim() === '') continue;
        if (m.role === lastRole) {
          sanitizedContents[sanitizedContents.length - 1].parts[0].text += '\n\n' + m.parts[0].text;
        } else {
          sanitizedContents.push(m);
          lastRole = m.role;
        }
      }
      contents = sanitizedContents;

      // ensure first message is user
      if (contents.length > 0 && contents[0].role !== 'user') {
        contents.unshift({ role: 'user', parts: [{ text: "Hello" }] });
      }

      if (contents.length > 0 && contents[0].role === 'user') {
        contents[0].parts[0].text = `You are an assistant that helps solve programming problems. Provide concise working solutions in the requested language (${language}) and include brief explanations.\n\nProblem:\n${contents[0].parts[0].text}`;
      }

      const requestBody = JSON.stringify({ 
        contents,
        generationConfig: { temperature: 0.2, maxOutputTokens: 4096 }
      });
      try {
        const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: requestBody });
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
    };

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
         let friendlyError = 'All Google models failed';
         let statusCode = 500;
         let includeDebug = true;
         
         if (result?.responseText?.includes('RESOURCE_EXHAUSTED') || result?.responseText?.includes('Quota exceeded') || result?.resp?.status === 429) {
             if (result?.responseText?.includes('GenerateRequestsPerDay')) {
                 friendlyError = 'Google AI Daily Quota Exceeded! You have reached the maximum number of requests allowed for today on the Free Tier.';
             } else {
                 friendlyError = 'Google AI Rate Limit Exceeded. Please wait 15-30 seconds before trying again.';
             }
             statusCode = 429;
             includeDebug = false; // Do not dump massive Google JSON if it's just a quota error
         } else if (result?.responseText?.includes('NOT_FOUND')) {
             friendlyError = 'The requested AI model was not found or is disabled for your API key.';
             includeDebug = false;
         }
         
         return NextResponse.json({ error: friendlyError, debug: includeDebug ? (result?.responseText || 'Check server logs for detailed error') : undefined }, { status: statusCode });
      }
    } else {
        let url = "https://api.openai.com/v1/chat/completions";
        let defaultModel = "gpt-4o-mini";
        
        if (useOpenRouter) {
            url = "https://api.openrouter.ai/v1/chat/completions";
        } else if (useGroq) {
            url = "https://api.groq.com/openai/v1/chat/completions";
            defaultModel = "llama-3.1-8b-instant";
        }

        selectedModel = defaultModel;

        const requestBody = JSON.stringify({ 
          model: defaultModel, 
          messages: [ 
            { role: "system", content: `You are a programming assistant helping with ${language}.` }, 
            ...messages.map((m: any) => ({ role: m.role, content: m.content }))
          ], 
          max_tokens: 1500, 
          temperature: 0.2, 
        });
        resp = await fetch(url, {
          method: "POST",
          headers: { "Authorization": `Bearer ${authKey}`, "Content-Type": "application/json" },
          body: requestBody,
        });
        
        const parsed = await resp.json();
        if (!resp.ok) {
           return NextResponse.json({ error: parsed.error?.message || 'AI Provider Error', debug: JSON.stringify(parsed) }, { status: resp.status });
        }
        (resp as any)._parsed = parsed;
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
