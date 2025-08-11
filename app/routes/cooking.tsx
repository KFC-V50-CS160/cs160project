
import React, { useState, useRef, useEffect } from "react";
import FloatingNav from "../components/FloatingNav";
import "../cooking.css";

const instructions = [
  "Preheat the oven to 350°F (175°C).",
  "Mix flour and sugar in a bowl.",
  "Add eggs and whisk until smooth.",
  "Pour batter into a greased pan.",
  "Bake for 30 minutes.",
  "Let cool before serving."
];

export function meta() {
  return [{ title: "Cooking" }];
}

export default function Cooking() {
  const [currentStep, setCurrentStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Center the selected lyric line
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const selected = container.querySelector(".lyric-step.selected");
    if (selected) {
      selected.scrollIntoView({ block: "center", behavior: "smooth" });
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
  }, []);

  // Button handlers
  const handleSkip = () => setCurrentStep((prev) => Math.min(prev + 1, instructions.length - 1));
  const handleRewind = () => setCurrentStep((prev) => Math.max(prev - 1, 0));
  const handleAsk = () => {
    alert("Ask me anything!");
  };

  return (
    <div className="cooking-page">
      <div className="cooking-content">
        <h1 className="recipe-title">Recipe Title</h1>
        <div className="lyric-instructions" ref={containerRef}>
          {instructions.map((step, idx) => (
            <div
              key={idx}
              className={`lyric-step${idx === currentStep ? " selected" : ""}`}
              onClick={() => setCurrentStep(idx)}
            >
              {step}
            </div>
          ))}
        </div>
        <div className="controls">
          <button className="control-btn" onClick={handleRewind} aria-label="Rewind">
            ⏪
          </button>
          <button className="control-btn ask-btn" onClick={handleAsk} aria-label="Ask me anything">
            <span role="img" aria-label="microphone">🎤</span> Ask me anything
          </button>
          <button className="control-btn" onClick={handleSkip} aria-label="Skip">
            ⏩
          </button>
        </div>
      </div>
      <FloatingNav />
    </div>
  );
}
