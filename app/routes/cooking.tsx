
import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import CookingChat from "../components/CookingChat";
import "../cooking.css";

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
  const [stepTimes, setStepTimes] = useState<number[]>([]);
  const [hasSession, setHasSession] = useState(false); // true when a recipe has been chosen before
  const [stepChangeFlash, setStepChangeFlash] = useState(false);
  // Chat ref no longer needed; mic is embedded in CookingChat controls

  // Timers
  const totalDurationSec = React.useMemo(() => (stepTimes && stepTimes.length ? stepTimes.reduce((a, b) => a + (b || 0), 0) * 60 : 0), [stepTimes]);
  const stepDurationSec = React.useMemo(() => ((stepTimes?.[currentStep] || 0) * 60), [stepTimes, currentStep]);
  const [isCooking, setIsCooking] = useState(false);
  const [totalLeftSec, setTotalLeftSec] = useState<number>(0);
  const [stepLeftSec, setStepLeftSec] = useState<number>(0);
  const [lastTick, setLastTick] = useState<number | null>(null);

  // Function to handle step changes from AI
  const handleStepChange = (stepChange: number) => {
    if (stepChange !== 0) {
      setCurrentStep((prev) => {
        const newStep = prev + stepChange;
        // Ensure step stays within bounds
        return Math.max(0, Math.min(newStep, steps.length - 1));
      });



      // Brief flash effect to indicate step change
      setStepChangeFlash(true);
      setTimeout(() => setStepChangeFlash(false), 500);
    }
  };

  // Initialize timers when data changes
  useEffect(() => {
    setTotalLeftSec(totalDurationSec);
    setStepLeftSec(stepDurationSec);
  }, [totalDurationSec, stepDurationSec]);

  // Tick timers when running
  useEffect(() => {
    if (!isCooking) return;
    let id: any;
    const tick = () => {
      const now = Date.now();
      const last = lastTick ?? now;
      const delta = (now - last) / 1000;
      setTotalLeftSec(v => Math.max(0, v - delta));
      setStepLeftSec(v => Math.max(0, v - delta));
      setLastTick(now);
    };
    id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [isCooking, lastTick]);

  // Stop when total elapsed
  useEffect(() => {
    if (isCooking && totalLeftSec <= 0) {
      setIsCooking(false);
      setLastTick(null);
    }
  }, [isCooking, totalLeftSec]);

  // When step changes, reset that step timer
  useEffect(() => {
    setStepLeftSec(stepDurationSec);
    if (isCooking) setLastTick(Date.now());
  }, [currentStep]);

  const toggleCooking = () => {
    if (isCooking) {
      setIsCooking(false);
      setLastTick(null);
    } else {
      // If timers are uninitialized, reset them
      if (!totalLeftSec) setTotalLeftSec(totalDurationSec);
      if (!stepLeftSec) setStepLeftSec(stepDurationSec);
      setIsCooking(true);
      setLastTick(Date.now());
    }
  };

  const resetCooking = () => {
    setIsCooking(false);
    setTotalLeftSec(totalDurationSec);
    setStepLeftSec(stepDurationSec);
    setLastTick(null);
  };

  const fmt = (s: number) => {
    const sec = Math.max(0, Math.floor(s));
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const ss = (sec % 60).toString().padStart(2, '0');
    return `${m}:${ss}`;
  };

  // On mount decide source of truth: navigation state (fresh) or localStorage (resume)
  useEffect(() => {
    const navState = location.state as any;
    if (navState && Array.isArray(navState.instructions)) {
      // Handle both old format (string[]) and new format (Step[])
      let normalizedSteps: string[] = [];
      let normalizedTimes: number[] = [];

      if (navState.instructions.length > 0) {
        const firstItem = navState.instructions[0];
        if (typeof firstItem === 'string') {
          // Old format: string[]
          normalizedSteps = navState.instructions.filter(Boolean);
          normalizedTimes = new Array(normalizedSteps.length).fill(0);
        } else if (firstItem && typeof firstItem === 'object' && 'instruction' in firstItem) {
          // New format: Step[]
          normalizedSteps = navState.instructions.map((s: any) => s?.instruction || '').filter(Boolean);
          normalizedTimes = navState.instructions.map((s: any) => s?.time || 0);
        }
      }

      if (normalizedSteps.length > 0) {
        setSteps(normalizedSteps);
        setStepTimes(normalizedTimes);
      }

      if (navState.title) setRecipeTitle(navState.title);

      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            t: Date.now(),
            title: navState.title || "Recipe Title",
            instructions: navState.instructions,
            stepTimes: normalizedTimes
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
            let normalizedSteps: string[] = [];
            let normalizedTimes: number[] = [];

            if (typeof parsed.instructions[0] === 'string') {
              // Old format
              normalizedSteps = parsed.instructions.filter(Boolean);
              normalizedTimes = parsed.stepTimes || new Array(normalizedSteps.length).fill(0);
            } else if (parsed.instructions[0] && typeof parsed.instructions[0] === 'object' && 'instruction' in parsed.instructions[0]) {
              // New format
              normalizedSteps = parsed.instructions.map((s: any) => s?.instruction || '').filter(Boolean);
              normalizedTimes = parsed.instructions.map((s: any) => s?.time || 0);
            }

            setSteps(normalizedSteps);
            setStepTimes(normalizedTimes);

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

  // Show all steps; scrolling will be handled by the container

  if (!hasSession) {
    return (
      <div className="cooking-page">
        <div className="cooking-content">
          <div className="cooking-header">
            <button className="back-icon-btn" onClick={handleBack} aria-label="Back" title="Back">⬅️</button>
          </div>
          <div className="main-align-container" style={{ flex: 1 }}>
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
          <div className="header-box">
            <button className="control-btn back-btn-abs" onClick={handleBack} aria-label="Back">⬅️</button>
            <h1 className="recipe-title" style={{ margin: '0' }}>{recipeTitle}</h1>
            <div className="total-progress-row">
              <div
                className={`total-progress-container${isCooking ? ' running' : ''}`}
                role="button"
                tabIndex={0}
                onClick={toggleCooking}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCooking(); } }}
                aria-label={isCooking ? 'Pause total recipe timer' : 'Start total recipe timer'}
                title={isCooking ? 'Pause total recipe timer' : 'Start total recipe timer'}
              >
                <span className="progress-icon" aria-hidden="true">⏱</span>
                <div className="total-progress-bar" aria-hidden="true">
                  <div
                    className="total-progress-fill"
                    style={{ width: `${totalDurationSec > 0 ? Math.min(100, Math.max(0, (1 - (totalLeftSec / totalDurationSec)) * 100)) : 0}%` }}
                  />
                </div>
                <span className="total-time-label">{fmt(totalLeftSec || totalDurationSec)}</span>
              </div>
              <button
                className={`control-btn play-pause-btn${isCooking ? ' running' : ''}`}
                onClick={toggleCooking}
                aria-label={isCooking ? 'Pause total timer' : 'Start total timer'}
                title={isCooking ? 'Pause total timer' : 'Start total timer'}
              >
                {isCooking ? '⏸' : '▶'}
              </button>
              <button className="control-btn reset-btn" onClick={resetCooking} aria-label="Reset timers" title="Reset timers">⟲</button>
            </div>
          </div>
        </div>
        <div className="main-align-container">
          <div className="lyric-instructions-wrapper" style={{ marginTop: '0', textAlign: 'left' }}>
            <div className="lyric-instructions" ref={containerRef}>
              {steps.map((step, idx) => {
                let distClass: string;
                if (idx < currentStep) {
                  distClass = 'dist-4'; // past steps
                } else if (idx === currentStep) {
                  distClass = 'dist-0'; // selected
                } else {
                  distClass = 'dist-2'; // future steps
                }
                const durMin = stepTimes[idx] || 0;
                const isSelected = idx === currentStep;
                const durSec = (durMin || 0) * 60;
                const stepLeft = isSelected ? stepLeftSec : durSec;
                const pct = durSec > 0 && isSelected ? Math.min(100, Math.max(0, (1 - stepLeftSec / durSec) * 100)) : 0;
                return (
                  <div
                    key={idx}
                    className={`lyric-step ${distClass}${idx === currentStep ? " selected" : ""}${idx === currentStep && stepChangeFlash ? " step-flash" : ""}`}
                    onClick={() => setCurrentStep(idx)}
                  >
                    <div className="step-left">
                      <span className="step-index">{idx + 1}.</span>
                      <span className="step-content">{step}</span>
                    </div>
                    <div className="step-time-col">
                      {durSec > 0 ? (
                        isSelected ? (
                          <>
                            <span className={isCooking ? 'running' : ''}>{fmt(stepLeft)}</span>
                            <div className="step-progress-bar">
                              <div className="step-progress-fill" style={{ width: `${pct}%` }} />
                            </div>
                          </>
                        ) : (
                          <span>{durMin} min</span>
                        )
                      ) : (
                        <span>-</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* Chat assistant centered, sticky above bottom nav */}
        <div className="main-align-container chat-input-row" style={{ padding: '12px 0', marginTop: '8px' }}>
          <div style={{ width: '100%', margin: '0 auto' }}>
            <CookingChat
              recipe={{
                title: recipeTitle,
                steps,
                currentStep,
                stepTimes,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
