import { useEffect, useState } from "react";

const LOGO = "https://i.postimg.cc/bvDgd9Wp/Annadatha-AI-Agricultural-Emblem-2.png";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 100);
    const t2 = setTimeout(() => setPhase("exit"), 2600);
    const t3 = setTimeout(() => onDone(), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      aria-label="Loading Annadatha AI"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, oklch(0.14 0.055 158), oklch(0.22 0.065 155) 50%, oklch(0.17 0.06 140))",
        transition: "opacity 0.6s cubic-bezier(0.4,0,0.2,1)",
        opacity: phase === "exit" ? 0 : 1,
        pointerEvents: phase === "exit" ? "none" : "auto",
      }}
    >
      {/* Radial ambient glow */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse 70% 60% at 50% 50%, oklch(0.55 0.18 140 / 0.18), transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Animated ring pulses */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              borderRadius: "50%",
              border: "1px solid oklch(0.8 0.16 130 / 0.15)",
              width: `${220 + i * 90}px`,
              height: `${220 + i * 90}px`,
              animation: `splashRing 3s ease-out ${i * 0.4}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "28px",
        transform: phase === "enter" ? "scale(0.82) translateY(24px)" : "scale(1) translateY(0)",
        opacity: phase === "enter" ? 0 : 1,
        transition: "transform 0.7s cubic-bezier(0.34,1.56,0.64,1), opacity 0.5s ease",
      }}>
        {/* Logo with glow */}
        <div style={{ position: "relative" }}>
          <div style={{
            position: "absolute",
            inset: "-12px",
            borderRadius: "50%",
            background: "radial-gradient(circle, oklch(0.8 0.16 130 / 0.35), transparent 70%)",
            filter: "blur(16px)",
            animation: "splashGlow 2s ease-in-out infinite alternate",
          }} />
          <img
            src={LOGO}
            alt="Annadatha AI logo"
            style={{
              width: "112px",
              height: "112px",
              borderRadius: "50%",
              objectFit: "cover",
              position: "relative",
              zIndex: 1,
              boxShadow: "0 0 0 3px oklch(0.8 0.16 130 / 0.5), 0 20px 60px oklch(0.15 0.06 155 / 0.8)",
            }}
          />
        </div>

        {/* App name */}
        <div style={{ textAlign: "center" }}>
          <h1 style={{
            fontFamily: "'Sora', system-ui, sans-serif",
            fontSize: "clamp(1.8rem, 5vw, 2.6rem)",
            fontWeight: 700,
            letterSpacing: "0.04em",
            color: "transparent",
            background: "linear-gradient(135deg, oklch(0.95 0.06 130), oklch(0.8 0.18 130), oklch(0.9 0.12 90))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            margin: 0,
            lineHeight: 1.1,
          }}>
            ANNADATHA AI
          </h1>
          <p style={{
            fontFamily: "'Manrope', system-ui, sans-serif",
            fontSize: "0.82rem",
            fontWeight: 500,
            letterSpacing: "0.18em",
            color: "oklch(0.8 0.12 130 / 0.7)",
            marginTop: "8px",
            textTransform: "uppercase",
          }}>
            AI-Powered Smart Agriculture
          </p>
        </div>

        {/* Progress bar */}
        <div style={{
          width: "180px",
          height: "3px",
          borderRadius: "99px",
          background: "oklch(0.8 0.16 130 / 0.15)",
          overflow: "hidden",
          marginTop: "8px",
        }}>
          <div style={{
            height: "100%",
            borderRadius: "99px",
            background: "linear-gradient(90deg, oklch(0.7 0.18 140), oklch(0.88 0.14 90))",
            animation: "splashProgress 2.4s ease-out forwards",
          }} />
        </div>

        {/* Tagline */}
        <p style={{
          fontFamily: "'Manrope', system-ui, sans-serif",
          fontSize: "0.78rem",
          color: "oklch(0.7 0.08 140 / 0.65)",
          marginTop: "4px",
          animation: "splashFadeUp 0.8s ease 0.5s both",
        }}>
          From Field to Insight ✦ Snap a leaf, get a diagnosis
        </p>
      </div>

      <style>{`
        @keyframes splashRing {
          0%   { opacity: 0.6; transform: scale(0.85); }
          60%  { opacity: 0.15; }
          100% { opacity: 0;   transform: scale(1.18); }
        }
        @keyframes splashGlow {
          from { opacity: 0.6; transform: scale(0.95); }
          to   { opacity: 1;   transform: scale(1.08); }
        }
        @keyframes splashProgress {
          0%   { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes splashFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
