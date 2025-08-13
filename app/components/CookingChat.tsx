import React, { useEffect, useImperativeHandle, useMemo, useRef, useState, forwardRef } from "react";
import { useInventory } from "../services/inventoryContext";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  ts: number;
};

export type RecipeCtx = {
  title: string;
  steps: string[];
  currentStep: number;
  stepTimes?: number[];
};

export type CookingChatHandle = {
  startListening: () => void;
  stopListening: () => void;
  isListening: () => boolean;
};

type Props = {
  recipe: RecipeCtx;
};

const CookingChat = forwardRef<CookingChatHandle, Props>(function CookingChat({ recipe }: Props, ref) {
  const { inventoryItems, dishes } = useInventory();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Expand chat only for typed questions (smooth transition via max-height)
  const [expanded, setExpanded] = useState(false);

  // Voice state
  const [listening, setListening] = useState(false);
  const [wantListen, setWantListen] = useState(false);
  const wantListenRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  useEffect(() => {
    mutedRef.current = muted;
    if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch {}
      setSpeaking(false);
    }
  }, [muted]);
  const [speaking, setSpeaking] = useState(false);

  // Preferred younger, natural female voice selection
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;
      const score = (v: SpeechSynthesisVoice) => {
        let s = 0;
        if (/^en(-US)?/i.test(v.lang)) s += 3;
        if (/neural|natural|online/i.test(v.name)) s += 3;
        if (/female|aria|jenny|zira|samantha|victoria/i.test(v.name)) s += 2;
        if (/google/i.test(v.name)) s += 1;
        if (/microsoft/i.test(v.name)) s += 1;
        return s;
      };
      const sorted = [...voices].sort((a, b) => score(b) - score(a));
      setSelectedVoice(sorted[0] || null);
    };
    pick();
    window.speechSynthesis.onvoiceschanged = pick;
    return () => {
      if (window.speechSynthesis.onvoiceschanged === pick) {
        window.speechSynthesis.onvoiceschanged = null as any;
      }
    };
  }, []);

  // Restore conversation per recipe
  useEffect(() => {
    const key = makeKey(recipe?.title);
    const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setMessages(parsed);
      } catch {}
    }
  }, [recipe?.title]);

  // Persist + auto-scroll
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    const key = makeKey(recipe?.title);
    try { localStorage.setItem(key, JSON.stringify(messages)); } catch {}
  }, [messages, recipe?.title]);

  const context = useMemo(() => ({
    recipe: {
      title: recipe.title,
      currentStep: recipe.currentStep,
      steps: recipe.steps,
      stepTimes: recipe.stepTimes ?? [],
    },
    inventory: {
      items: inventoryItems,
      dishes,
    },
  }), [recipe, inventoryItems, dishes]);

  // Send helper: typed flag differentiates voice vs typed
  const send = async (text: string, opts?: { typed?: boolean }) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (opts?.typed) setExpanded(true);
    setError(null);
    setLoading(true);
    const userMsg: ChatMessage = { role: "user", content: trimmed, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);

    try {
      const history = buildHistory(messages.concat(userMsg));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, context }),
      });
      const data = await res.json();
      if (!res.ok || data?.error) throw new Error(data?.error || `HTTP ${res.status}`);
      const concise = (data.reply || "").split(/(?<=[.!?])\s+/).slice(0, 3).join(" ");
      const assistant: ChatMessage = { role: "assistant", content: concise, ts: Date.now() };
      setMessages(prev => [...prev, assistant]);
      speak(assistant.content);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
  setMessages(prev => [...prev, { role: "assistant", content: "Sorry, Cooking Buddy had trouble connecting. Please try again.", ts: Date.now() }]);
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  // Voice input handlers
  const ensureRecognition = () => {
    if (recognitionRef.current) return recognitionRef.current;
    const SR: typeof window.SpeechRecognition | typeof window.webkitSpeechRecognition | undefined =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return null;
    const rec: SpeechRecognition = new (SR as any)();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const t = e.results?.[0]?.[0]?.transcript || "";
      if (t) {
        // Immediately stop further recognition so Cooking Buddy doesn't hear itself
        wantListenRef.current = false;
        setWantListen(false);
        try { rec.stop(); } catch {}
        setListening(false);
        send(t); // voice path: no expansion trigger
      }
    };
    rec.onstart = () => setListening(true);
    rec.onend = () => {
      // Do not auto-restart unless user explicitly re-enabled wantListen
      setListening(false);
      if (wantListenRef.current) {
        try { rec.start(); setListening(true); } catch {}
      }
    };
    rec.onerror = () => {
      setListening(false);
      if (wantListenRef.current) {
        try { rec.start(); setListening(true); } catch {}
      }
    };
    recognitionRef.current = rec;
    return rec;
  };

  const startListening = () => {
    const rec = ensureRecognition();
    if (!rec) {
      setError("This browser doesn't support speech recognition.");
      return;
    }
    try {
      setWantListen(true);
      wantListenRef.current = true;
      setListening(true);
      rec.start();
    } catch {
      setListening(false);
    }
  };

  const stopListening = () => {
    setWantListen(false);
    wantListenRef.current = false;
    try { recognitionRef.current?.stop(); } catch {}
    setListening(false);
  };

  // Speech synthesis
  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    // Always consult ref for immediate mute state (avoids stale closure or rapid toggle race)
    if (mutedRef.current) return;
    // Prevent the recognizer from picking up synthesized speech
    if (listening) {
      try { recognitionRef.current?.stop(); } catch {}
      wantListenRef.current = false;
      setWantListen(false);
      setListening(false);
    }
    try { window.speechSynthesis.cancel(); } catch {}
    const u = new SpeechSynthesisUtterance(text);
    if (selectedVoice) u.voice = selectedVoice;
    u.rate = 1.03;
    u.pitch = 1.02;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    u.onstart = () => {
      if (mutedRef.current) {
        try { window.speechSynthesis.cancel(); } catch {}
        setSpeaking(false);
      }
    };
    window.speechSynthesis.cancel();
    if (!mutedRef.current) {
      setSpeaking(true);
      window.speechSynthesis.speak(u);
    }
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  };

  // If user mutes while a response is speaking (or before next one), ensure all speech stops and none plays.
  // Mute effect handled above with mutedRef synchronization.

  useImperativeHandle(ref, () => ({
    startListening,
    stopListening,
    isListening: () => listening,
  }));

  return (
    <div className="flex flex-col gap-2">
      {(messages.length > 0 || loading || error) && (
        <>
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400"></div>
            {messages.length > 0 && (
              <button
                onClick={() => {
                  setMessages([]);
                  try { localStorage.removeItem(makeKey(recipe?.title)); } catch {}
                }}
                className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                aria-label="Clear chat"
                title="Clear chat"
              >
                Clear chat
              </button>
            )}
          </div>
          <div
            ref={listRef}
            className={`overflow-y-auto p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-[max-height] duration-200 ease-out ${expanded ? 'max-h-[320px]' : 'max-h-[200px]'} `}
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex mb-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'} max-w-[85%] px-2.5 py-2 rounded-xl whitespace-pre-wrap ${m.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-xs text-gray-500 dark:text-gray-400">Cooking Buddy is thinking…</div>
            )}
            {error && (
              <div className="text-xs text-red-700 dark:text-red-400">{error}</div>
            )}
          </div>
        </>
      )}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(input, { typed: true }); }}
          placeholder="Ask Cooking Buddy anything..."
          aria-label="Chat input"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
        />
        {/* Mic toggle */}
        <button
          onClick={() => (listening ? stopListening() : startListening())}
          aria-label={listening ? "Turn mic off" : "Turn mic on"}
          title={listening ? "Turn mic off" : "Turn mic on"}
          className={`${listening ? 'bg-green-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600'} px-3 py-2 rounded-lg transition-colors active:scale-[0.98]`}
        >
          {listening ? '🎙️' : '🎤'}
        </button>
        {/* Stop button only while speaking */}
        {speaking && (
          <button
            onClick={stopSpeaking}
            aria-label="Stop speaking"
            title="Stop speaking"
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 transition-colors hover:bg-gray-100 dark:hover:bg-gray-600 active:scale-[0.98]"
          >
            ⏹️
          </button>
        )}
        <button
          onClick={() => setMuted(m => !m)}
          aria-label={muted ? "Unmute" : "Mute"}
          title={muted ? "Unmute" : "Mute"}
          className={`px-3 py-2 rounded-lg transition-colors active:scale-[0.98] ${muted ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>
    </div>
  );
});

function buildHistory(messages: ChatMessage[]): { role: "system" | "user" | "assistant"; content: string }[] {
  return messages.map(m => ({ role: m.role, content: m.content }));
}

function makeKey(title: string) {
  return `cookingChat:${encodeURIComponent(title || "untitled")}:v1`;
}
export default CookingChat;
