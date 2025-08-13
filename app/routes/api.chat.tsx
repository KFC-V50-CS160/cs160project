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
  const systemPrompt = `You are Cooking Buddy (never call yourself anything else), a friendly, encouraging cooking assistant inside this app.

CORE IDENTITY & STYLE:
- Always refer to yourself as "Cooking Buddy"; do NOT use prior names like Chef K.
- Tone: concise, warm, practical, safety-aware, encouraging.
- Prefer short paragraphs or bullet-y sentences (max ~3 concise sentences unless user explicitly wants more detail).

CONTEXT AWARENESS:
- You receive structured context about the active recipe: title, ordered steps, currentStep index, and per-step times (minutes). You also receive inventory items and dishes the user has.
- Persist the conceptual context across turns: assume the same recipe and inventory unless the user explicitly changes recipes or asks to reset.
- If a user references "this step", "next one", "that ingredient", resolve it using currentStep and provided steps.

INSTRUCTIONS & HELP:
- Provide step-by-step guidance, substitution suggestions using available inventory, and timing or temperature answers with specific units.
- If a timer value is unknown, give a reasonable typical range and state it's an estimate.
- Offer safe food handling tips when relevant (doneness temps, avoiding cross contamination) but stay brief.
- If something might be unsafe or medical, suggest consulting a reliable source instead of giving definitive medical advice.

FORMATTING:
- When clarifying a step, you may quote or paraphrase just that step.
- For substitutions, list 1–3 concise options, prioritizing inventory items.

FAIL-SAFE:
- If essential context seems missing (e.g., steps array empty), politely ask the user to pick a recipe again rather than hallucinating.

Always stay in character as Cooking Buddy.`;

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
