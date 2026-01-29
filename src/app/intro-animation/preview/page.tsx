"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import s from "../page.module.css";

export default function PreviewPage() {
  const [step, setStep] = useState(0);
  const [key, setKey] = useState(0);

  const CYCLE_ITEMS = ["探索", "推測", "アウトプット", "修正"];

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 800),   // 探索
      setTimeout(() => setStep(2), 1800),  // 推測
      setTimeout(() => setStep(3), 2800),  // アウトプット
      setTimeout(() => setStep(4), 3800),  // 修正
      setTimeout(() => setStep(5), 5000),  // Connect & start cycling
      setTimeout(() => setStep(6), 8000),  // Start converge (3 rotations @ 1s = 3s)
      setTimeout(() => setStep(7), 9500),  // Message
    ];
    return () => timers.forEach(clearTimeout);
  }, [key]);

  const restart = () => {
    setStep(0);
    setKey((k) => k + 1);
  };

  // Positions for cardinal points (top, right, bottom, left)
  const positions = [
    { x: 0, y: -100 },   // 探索 (top)
    { x: 100, y: 0 },    // 推測 (right)
    { x: 0, y: 100 },    // アウトプット (bottom)
    { x: -100, y: 0 },   // 修正 (left)
  ];

  // Smooth cubic-bezier for natural deceleration
  const smoothEase = [0.16, 1, 0.3, 1] as const;

  return (
    <div className={s.container}>
      <div className={s.squareFrame}>
        <motion.div
          key={key}
          className={s.scene}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className={s.practiceContent}>
            <AnimatePresence mode="wait">
              {step >= 1 && step < 7 && (
                <motion.div
                  className={s.refinedFlow}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{
                    opacity: 0,
                    scale: 0.95,
                    filter: "blur(12px)",
                    transition: { duration: 1.2, ease: smoothEase }
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  {/* Ambient glow */}
                  <motion.div
                    className={s.refinedAmbient}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{
                      opacity: [0.1, 0.25, 0.1],
                      scale: [0.95, 1.05, 0.95],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />

                  {/* Orbital ring */}
                  <motion.div
                    className={s.refinedRing}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{
                      opacity: step >= 4 ? 0.4 : 0.15,
                      scale: 1,
                    }}
                    transition={{ duration: 1.5, ease: smoothEase }}
                  />

                  {/* Flowing particle - orbits multiple times */}
                  <AnimatePresence>
                    {step >= 5 && step < 6 && (
                      <motion.div
                        className={s.refinedOrbit}
                        initial={{ opacity: 0, rotate: 0 }}
                        animate={{
                          opacity: 1,
                          rotate: 360,
                        }}
                        exit={{
                          opacity: 0,
                          transition: { duration: 0.8, ease: "easeInOut" }
                        }}
                        transition={{
                          opacity: { duration: 0.5, ease: "easeOut" },
                          rotate: {
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          },
                        }}
                      >
                        <motion.div
                          className={s.refinedParticle}
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.8, 1, 0.8],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Cycle items */}
                  {CYCLE_ITEMS.map((item, i) => {
                    const isVisible = step >= i + 1;
                    const isConverging = step >= 6;
                    const pos = positions[i];

                    return (
                      <motion.div
                        key={item}
                        className={s.refinedItem}
                        initial={{
                          opacity: 0,
                          scale: 0.8,
                          x: 0,
                          y: 0,
                        }}
                        animate={{
                          opacity: isConverging ? 0 : isVisible ? 1 : 0,
                          scale: isConverging ? 0.7 : isVisible ? 1 : 0.8,
                          x: isConverging ? 0 : isVisible ? pos.x : 0,
                          y: isConverging ? 0 : isVisible ? pos.y : 0,
                        }}
                        transition={{
                          duration: 1.2,
                          ease: smoothEase,
                        }}
                      >
                        <motion.span
                          animate={{
                            opacity: step >= 5 && step < 6 ? [1, 0.7, 1] : 1,
                          }}
                          transition={{
                            duration: 3,
                            repeat: step >= 5 && step < 6 ? Infinity : 0,
                            delay: i * 0.75,
                            ease: "easeInOut",
                          }}
                        >
                          {item}
                        </motion.span>
                      </motion.div>
                    );
                  })}

                  {/* Connection arcs - circular path between items */}
                  <svg className={s.refinedLines} viewBox="0 0 260 260">
                    {[0, 1, 2, 3].map((i) => {
                      const cx = 130;
                      const cy = 130;
                      const r = 100;

                      // Arc from one item to the next along the circle
                      const startAngle = -90 + i * 90 + 12;
                      const endAngle = -90 + i * 90 + 78;

                      const startRad = (startAngle * Math.PI) / 180;
                      const endRad = (endAngle * Math.PI) / 180;

                      const x1 = cx + r * Math.cos(startRad);
                      const y1 = cy + r * Math.sin(startRad);
                      const x2 = cx + r * Math.cos(endRad);
                      const y2 = cy + r * Math.sin(endRad);

                      const isLineVisible = step >= i + 2 && step < 6;

                      return (
                        <motion.path
                          key={i}
                          d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                          fill="none"
                          stroke="var(--color-accent)"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{
                            pathLength: isLineVisible ? 1 : 0,
                            opacity: isLineVisible ? 0.3 : 0,
                          }}
                          transition={{
                            duration: 1.2,
                            ease: smoothEase,
                          }}
                        />
                      );
                    })}
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message - appears after convergence */}
            <AnimatePresence>
              {step >= 7 && (
                <motion.div
                  className={s.practiceMessageWrap}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                >
                  <motion.p
                    className={s.practiceMessage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, ease: smoothEase }}
                  >
                    言葉が、感覚になる。
                  </motion.p>
                  <motion.p
                    className={s.practiceSubMessage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8, ease: smoothEase }}
                  >
                    母語を話すように、第二言語を。
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <button
          onClick={restart}
          style={{
            position: "absolute",
            top: 24,
            right: 28,
            padding: "10px 18px",
            borderRadius: "9999px",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            fontSize: "0.95rem",
            fontWeight: 600,
            color: "var(--color-fg-muted)",
            zIndex: 100,
          }}
        >
          Restart
        </button>
      </div>
    </div>
  );
}
