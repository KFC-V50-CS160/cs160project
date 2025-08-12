
import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import FloatingNav from "../components/FloatingNav";
import AudioAssistant from "../components/AudioAssistant";
import "../cooking.css";
import "../audio-assistant.css";

// Fallback demo instructions (used only if nothing in state or storage)
const FALLBACK_INSTRUCTIONS = [
  "Preheat the oven to 350°F (175°C).",
  "Mix flour and sugar in a bowl.",
  "Add eggs and whisk until smooth.",
  "Pour batter into a greased pan.",
  "Bake for 30 minutes.",
  "Let cool before serving."
];

const STORAGE_KEY = "cookingSession:v1"; // versioned in case schema changes later

export function meta() {
  return [{ title: "Cooking" }];
}

export default function Cooking() {
  const handleBack = () => {
    window.history.back();
  };
  const [currentStep, setCurrentStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const [recipeTitle, setRecipeTitle] = useState<string>("Recipe Title");
  const [steps, setSteps] = useState<string[]>(FALLBACK_INSTRUCTIONS);
  const [hasSession, setHasSession] = useState(false); // true when a recipe has been chosen before
  const [audioTranscript, setAudioTranscript] = useState<string>('');
  const [audioResponse, setAudioResponse] = useState<string>('');
  const [stepChangeFlash, setStepChangeFlash] = useState(false);

  // Function to handle step changes from AI
  const handleStepChange = (stepChange: number) => {
    if (stepChange !== 0) {
      setCurrentStep((prev) => {
        const newStep = prev + stepChange;
        // Ensure step stays within bounds
        return Math.max(0, Math.min(newStep, steps.length - 1));
      });

      // Clear the transcript for step changes to keep UI clean
      setAudioTranscript('');

      // Brief flash effect to indicate step change
      setStepChangeFlash(true);
      setTimeout(() => setStepChangeFlash(false), 500);
    }
  };

  // On mount decide source of truth: navigation state (fresh) or localStorage (resume)
  useEffect(() => {
    const navState = location.state as any;
    if (navState && Array.isArray(navState.instructions)) {
      // Prefer freshly passed in data; normalise and persist
      const normalized = navState.instructions.map((s: any) => s?.instruction || s).filter(Boolean);
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
        // non-fatal
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
            setSteps(parsed.instructions.map((s: any) => s?.instruction || s));
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
        setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      } else if (["ArrowLeft", "ArrowUp"].includes(e.key)) {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [steps.length]);

  // Button handlers
  const handleSkip = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  const handleRewind = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  // Only show 5 steps at a time, centered around currentStep
  const visibleCount = 5;
  const half = Math.floor(visibleCount / 2);
  let start = Math.max(0, currentStep - half);
  let end = Math.min(steps.length, start + visibleCount);
  if (end - start < visibleCount) {
    start = Math.max(0, end - visibleCount);
  }
  const visibleSteps = steps.slice(start, end);

  if (!hasSession) {
    return (
      <div className="cooking-page">
        <div className="cooking-content">
          <div className="cooking-header">
            <button className="control-btn back-btn-abs" onClick={handleBack} aria-label="Back">⬅️</button>
          </div>
          <div className="main-align-container" style={{ flex: 1, marginTop: '88px' }}>
            <div style={{ height: '33vh', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <p className="choose-recipe-message">Let's choose a recipe first!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                return (
                  <div
                    key={actualIdx}
                    className={`lyric-step ${distClass}${actualIdx === currentStep ? " selected" : ""}${actualIdx === currentStep && stepChangeFlash ? " step-flash" : ""}`}
                    onClick={() => setCurrentStep(actualIdx)}
                  >
                    {step}
                  </div>
                );
              })}
            </div>
            <div className="lyric-instructions-cutout lyric-instructions-cutout-bottom" />
          </div>
        </div>
        <FloatingNav />

        {/* Audio Interaction Display - Only show for actual Q&A, not step changes */}
        {audioResponse && !audioTranscript.includes('skip') && !audioTranscript.includes('next') && !audioTranscript.includes('back') && !audioTranscript.includes('previous') && (
          <div className="audio-interaction-display">
            {audioTranscript && (
              <div className="audio-transcript">
                <strong>You asked:</strong> {audioTranscript}
              </div>
            )}
            <div className="audio-response">
              <strong>Assistant:</strong> {audioResponse}
            </div>
          </div>
        )}

        <div className="controls custom-controls-layout controls-above-nav">
          <div className="controls-left">
            <button className="control-btn" onClick={handleRewind} aria-label="Rewind">⏪</button>
          </div>
          <div className="controls-center">
            <AudioAssistant
              onTranscript={setAudioTranscript}
              onResponse={setAudioResponse}
              onStepChange={handleStepChange}
              recipeDetails={`Recipe: ${recipeTitle}\nSteps: ${steps.join('\n')}`}
            />
          </div>
          <div className="controls-right">
            <button className="control-btn" onClick={handleSkip} aria-label="Skip">⏩</button>
          </div>
        </div>
      </div>
    </div>
  );
}
