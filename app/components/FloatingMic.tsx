import React from "react";

type Props = {
  onToggle: (on: boolean) => void;
  listening: boolean;
};

export default function FloatingMic({ onToggle, listening }: Props) {
  return (
    <div style={{ position: 'fixed', right: 12, top: 120, zIndex: 60 }}>
    <button
        onClick={() => onToggle(!listening)}
        aria-label={listening ? 'Turn mic off' : 'Turn mic on'}
        title={listening ? 'Turn mic off' : 'Turn mic on'}
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
      background: listening ? '#16a34a' : '#1f2937',
      color: '#eaeaea',
          border: '1px solid #cbd5e1',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          transition: 'transform 120ms ease, background 150ms ease',
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
  {listening ? '🎙️' : '🎤'}
      </button>
    </div>
  );
}
