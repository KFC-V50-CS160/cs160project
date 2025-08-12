
import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import FloatingNav from "../components/FloatingNav";
import "../cooking.css";

<<<<<<< Updated upstream
<<<<<<< Updated upstream
const instructions = [
  "Preheat the oven to 350°F (175°C).",
  "Mix flour and sugar in a bowl.",
  "Add eggs and whisk until smooth.",
  "Pour batter into a greased pan.",
  "Bake for 30 minutes.",
  "Let cool before serving."
=======
// Local step shape (time optional for backward compatibility)
interface LocalStep { instruction: string; time?: number }
=======
// Local step shape (time optional for backward compatibility)
interface LocalStep { instruction: string; time?: number }

// Fallback demo instructions (used only if nothing in state or storage)
const FALLBACK_INSTRUCTIONS: LocalStep[] = [
  { instruction: "Preheat the oven to 350°F (175°C).", time: 5 },
  { instruction: "Mix flour and sugar in a bowl.", time: 3 },
  { instruction: "Add eggs and whisk until smooth.", time: 4 },
  { instruction: "Pour batter into a greased pan.", time: 2 },
  { instruction: "Bake for 30 minutes.", time: 30 },
  { instruction: "Let cool before serving.", time: 10 }
];
>>>>>>> Stashed changes

// Fallback demo instructions (used only if nothing in state or storage)
const FALLBACK_INSTRUCTIONS: LocalStep[] = [
  { instruction: "Preheat the oven to 350°F (175°C).", time: 5 },
  { instruction: "Mix flour and sugar in a bowl.", time: 3 },
  { instruction: "Add eggs and whisk until smooth.", time: 4 },
  { instruction: "Pour batter into a greased pan.", time: 2 },
  { instruction: "Bake for 30 minutes.", time: 30 },
  { instruction: "Let cool before serving.", time: 10 }
>>>>>>> Stashed changes
];

export function meta() {
  return [{ title: "Cooking" }];
}

export default function Cooking() {
  const handleBack = () => {
    window.history.back();
  };
  const [currentStep, setCurrentStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  // Get instructions and title from route state
  const location = useLocation();
<<<<<<< Updated upstream
  let instructions: string[] = [
    "Preheat the oven to 350°F (175°C).",
    "Mix flour and sugar in a bowl.",
    "Add eggs and whisk until smooth.",
    "Pour batter into a greased pan.",
    "Bake for 30 minutes.",
    "Let cool before serving."
  ];
  let recipeTitle = "Recipe Title";
  if (location.state && Array.isArray(location.state.instructions)) {
    instructions = location.state.instructions.map((step: any) => step.instruction || step);
    recipeTitle = location.state.title || recipeTitle;
  }
=======

  const [recipeTitle, setRecipeTitle] = useState<string>("Recipe Title");
  const [steps, setSteps] = useState<LocalStep[]>(FALLBACK_INSTRUCTIONS);
  const [hasSession, setHasSession] = useState(false); // true when a recipe has been chosen before

  // On mount decide source of truth: navigation state (fresh) or localStorage (resume)
  useEffect(() => {
    const navState = location.state as any;
    if (navState && Array.isArray(navState.instructions)) {
      // Prefer freshly passed in data; normalize to LocalStep objects and persist
      const normalized: LocalStep[] = navState.instructions
        .map((s: any): LocalStep | null => {
          if (!s) return null;
          if (typeof s === 'string') return { instruction: s };
          if (typeof s === 'object') {
            const instruction = s.instruction || s.text || s.step || '';
            if (!instruction) return null;
            let time: number | undefined = undefined;
            if (Number.isFinite(s.time)) time = Number(s.time);
            return { instruction, time };
          }
          return null;
        })
        .filter(Boolean) as LocalStep[];
      if (normalized.length > 0) {
        setSteps(normalized);
      }
      if (navState.title) setRecipeTitle(navState.title);
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            t: Date.now(),
            title: navState.title || "Recipe Title",
            instructions: normalized.length > 0 ? normalized : FALLBACK_INSTRUCTIONS
          })
        );
      } catch (e) {
        console.warn("[Cooking] failed to persist session", e);
      }
      setHasSession(true);
    } else {
      // Attempt to resume from storage
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.instructions) && parsed.instructions.length) {
            const restored: LocalStep[] = parsed.instructions.map((s: any) => {
              if (typeof s === 'string') return { instruction: s };
              if (s && typeof s === 'object') {
                const instr = s.instruction || s.text || s.step || '';
                const time = Number.isFinite(s.time) ? Number(s.time) : undefined;
                return { instruction: instr, time };
              }
              return { instruction: '' };
            }).filter((s: LocalStep) => s.instruction);
            setSteps(restored.length ? restored : FALLBACK_INSTRUCTIONS);
            if (typeof parsed.title === "string" && parsed.title.trim()) {
              setRecipeTitle(parsed.title);
            }
            setHasSession(true);
          }
        }
      } catch (e) {
        console.warn("[Cooking] failed to read previous session", e);
      }
    }
  }, [location.state]);
>>>>>>> Stashed changes

  // Center the selected lyric line
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const selected = container.querySelector<HTMLElement>(".lyric-step.selected");
    if (!selected) return;

    // Manually compute target scrollTop so the selected line is vertically centered
    const containerHeight = container.clientHeight;
    const selectedOffsetTop = selected.offsetTop; // relative to container because selected is a direct child
    const selectedHeight = selected.offsetHeight;

    // Center position = selected top + half its height - half container height
    let targetScrollTop = selectedOffsetTop + selectedHeight / 2 - containerHeight / 2;

    // Clamp within scroll bounds
    const maxScroll = container.scrollHeight - containerHeight;
    if (targetScrollTop < 0) targetScrollTop = 0;
    if (targetScrollTop > maxScroll) targetScrollTop = maxScroll;

    // Only scroll if difference is meaningful to avoid tiny jitter
    const diff = Math.abs(container.scrollTop - targetScrollTop);
    if (diff > 4) {
      container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
    }
  }, [currentStep]);

  // Keyboard controls for skip/rewind
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "ArrowDown", " ", "Spacebar"].includes(e.key)) {
        setCurrentStep((prev) => Math.min(prev + 1, instructions.length - 1));
      } else if (["ArrowLeft", "ArrowUp"].includes(e.key)) {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [instructions.length]);

  // Button handlers
  const handleSkip = () => setCurrentStep((prev) => Math.min(prev + 1, instructions.length - 1));
  const handleRewind = () => setCurrentStep((prev) => Math.max(prev - 1, 0));
  const handleAsk = () => {
    alert("Ask me anything!");
  };

  // Only show 5 steps at a time, centered around currentStep
  const visibleCount = 5;
  const half = Math.floor(visibleCount / 2);
  let start = Math.max(0, currentStep - half);
  let end = Math.min(instructions.length, start + visibleCount);
  if (end - start < visibleCount) {
    start = Math.max(0, end - visibleCount);
  }
  const visibleSteps = instructions.slice(start, end);

  return (
    <div className="cooking-page">
      <div className="cooking-content">
        <div className="cooking-header">
          <button className="control-btn back-btn-abs" onClick={handleBack} aria-label="Back">⬅️</button>
          <h1 className="recipe-title" style={{ margin: '0', textAlign: 'left' }}>{recipeTitle}</h1>
        </div>
  <div className="main-align-container">
          <div className="lyric-instructions-wrapper" style={{ marginTop: '0', textAlign: 'left' }}>
            <div className="lyric-instructions-cutout lyric-instructions-cutout-top" />
            <div className="lyric-instructions" ref={containerRef}>
              {visibleSteps.map((step, idx) => {
                const actualIdx = start + idx; // actual index in full instructions
                let distClass: string;
                if (actualIdx < currentStep) {
                  distClass = 'dist-4'; // past steps
                } else if (actualIdx === currentStep) {
                  distClass = 'dist-0'; // selected
                } else {
                  distClass = 'dist-2'; // all future steps uniform fade
                }
                const timeText = Number.isFinite(step.time) ? `${(step.time as number)} min.` : undefined;
                return (
                  <div
                    key={actualIdx}
                    className={`lyric-step ${distClass}${actualIdx === currentStep ? " selected" : ""}`}
                    onClick={() => setCurrentStep(actualIdx)}
                  >
                    {step.instruction}
                    {timeText && (
                      <span className="step-time"> &nbsp;- <em>{timeText}</em></span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="lyric-instructions-cutout lyric-instructions-cutout-bottom" />
          </div>
        </div>
        <FloatingNav />
        {/* Bottom controls relocated to sit just above the floating nav */}
        <div className="controls custom-controls-layout controls-above-nav">
          <div className="controls-left">
            <button className="control-btn" onClick={handleRewind} aria-label="Rewind">
              ⏪
            </button>
          </div>
          <div className="controls-center">
            <button className="control-btn ask-btn" onClick={handleAsk} aria-label="Ask me anything">
              <span role="img" aria-label="microphone">🎤</span> Ask me anything
            </button>
          </div>
          <div className="controls-right">
            <button className="control-btn" onClick={handleSkip} aria-label="Skip">
              ⏩
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
