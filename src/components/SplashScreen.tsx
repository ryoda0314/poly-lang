"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2000);

    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.5s ease-out",
        pointerEvents: fadeOut ? "none" : "auto",
      }}
    >
      <Image
        src="/icons/splash-icon.png"
        alt="PolyLinga"
        width={160}
        height={160}
        priority
        style={{
          animation: "pulse 2s ease-in-out infinite",
        }}
      />
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}