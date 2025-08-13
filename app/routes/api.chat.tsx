import type { ActionFunctionArgs } from "react-router";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: {
    messages: ChatMessage[];
    context?: Record<string, unknown>;
    model?: string;
  };

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Server missing GROQ_API_KEY. Set it in your environment." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const model = body.model || "llama-3.3-70b-versatile"; // default Groq chat model

  // Compose messages: prepend a system message for persona and context
  const systemPrompt = `You are Chef K, a friendly, encouraging cooking assistant living inside a cooking app.
You know the user's selected recipe, its steps, and their kitchen inventory. 
Be concise but warm, offer step-by-step help, safety tips, and substitutions using what's on hand.
When the user asks for timing, temperatures, or substitutions, be specific. If unsure, state assumptions.
Avoid medical or unsafe advice. Keep a helpful-chef tone.`;

  const contextBlurb = body?.context
    ? `\n\nContext JSON:\n${JSON.stringify(body.context).slice(0, 6000)}` // prevent oversized payload
    : "";

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt + contextBlurb },
    ...body.messages,
  ];

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.6,
        max_tokens: 800,
        stream: false,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errorMsg = data?.error?.message || `Groq API error: ${res.status}`;
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const reply = data?.choices?.[0]?.message?.content ?? "";
    return new Response(
      JSON.stringify({ reply, usage: data?.usage ?? null }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const loader = () => new Response("Not found", { status: 404 });
