"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, Mic, Globe, Sparkles, Volume2, MousePointerClick } from "lucide-react";
import Link from "next/link";
import s from "./page.module.css";

/* ─── Data ─── */
const GREETINGS = [
  { text: "Bonjour", lang: "FR", x: 15, y: 18, size: 1.1 },
  { text: "こんにちは", lang: "JA", x: 68, y: 12, size: 1.2 },
  { text: "Hola", lang: "ES", x: 35, y: 72, size: 1.0 },
  { text: "안녕하세요", lang: "KO", x: 78, y: 65, size: 1.15 },
  { text: "Guten Tag", lang: "DE", x: 10, y: 55, size: 0.95 },
  { text: "你好", lang: "ZH", x: 55, y: 35, size: 1.25 },
  { text: "Xin chào", lang: "VI", x: 82, y: 40, size: 0.9 },
  { text: "Привет", lang: "RU", x: 25, y: 40, size: 1.05 },
  { text: "Hello", lang: "EN", x: 50, y: 82, size: 1.1 },
];

const PHRASE_LANGS = [
  { code: "EN", text: "I want to eat sushi" },
  { code: "JA", text: "お寿司が食べたい" },
  { code: "KO", text: "초밥을 먹고 싶어요" },
  { code: "ZH", text: "我想吃寿司" },
  { code: "FR", text: "Je veux manger des sushis" },
  { code: "ES", text: "Quiero comer sushi" },
  { code: "DE", text: "Ich will Sushi essen" },
];

const ALL_LANG_CODES = ["EN", "JA", "KO", "ZH", "FR", "ES", "DE", "RU", "VI"];

const AWARENESS_TOKENS = ["I", "often", "eat", "fresh", "sushi", "at", "the", "market"];

const SCENE_DURATIONS = [3000, 5000, 3500, 6500, 5500, 6000, Infinity];
const TOTAL_SCENES = SCENE_DURATIONS.length;

/* ─── Scene Components ─── */

function SceneOpening() {
  const [showTitle, setShowTitle] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowTitle(true), 1000);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      className={s.scene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Expanding dot / radial glow */}
      <motion.div
        className={s.openingDot}
        initial={{ scale: 1, opacity: 0.9 }}
        animate={{ scale: 80, opacity: 0.08 }}
        transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Title */}
      <AnimatePresence>
        {showTitle && (
          <motion.h1
            className={s.openingTitle}
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            Poly<span style={{ color: "var(--color-accent)" }}>.</span>
          </motion.h1>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SceneLanguageBabel() {
  const [showMessage, setShowMessage] = useState(false);
  const [blur, setBlur] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setBlur(true), 2800);
    const t2 = setTimeout(() => setShowMessage(true), 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <motion.div
      className={s.scene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={s.babelContainer}>
        {GREETINGS.map((g, i) => (
          <motion.span
            key={g.lang}
            className={s.languageParticle}
            style={{
              left: `${g.x}%`,
              top: `${g.y}%`,
              fontSize: `${g.size}rem`,
            }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{
              opacity: blur ? 0.25 : 0.85,
              scale: 1,
              x: [0, (i % 2 === 0 ? 12 : -12), 0],
              y: [0, (i % 3 === 0 ? -10 : 8), 0],
              filter: blur ? "blur(4px)" : "blur(0px)",
            }}
            transition={{
              opacity: { duration: 0.5 },
              scale: { delay: i * 0.12, duration: 0.5, type: "spring", stiffness: 200 },
              x: { duration: 4 + i * 0.3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
              y: { duration: 3.5 + i * 0.4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
              filter: { duration: 0.8 },
            }}
          >
            {g.text}
          </motion.span>
        ))}

        <div className={s.babelMessage}>
          <AnimatePresence>
            {showMessage && (
              <motion.p
                className={s.babelText}
                initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7 }}
              >
                言語学習は、
                <br />
                こうあるべきじゃない。
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function SceneWhatIf() {
  const original = "I want eat sushi";
  const [typed, setTyped] = useState("");
  const [showQuestion, setShowQuestion] = useState(false);

  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      if (idx <= original.length) {
        setTyped(original.slice(0, idx));
        idx++;
      } else {
        clearInterval(interval);
      }
    }, 70);
    const t = setTimeout(() => setShowQuestion(true), 2000);
    return () => {
      clearInterval(interval);
      clearTimeout(t);
    };
  }, []);

  return (
    <motion.div
      className={s.scene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={s.whatIfContent}>
        {/* Learner's attempt card */}
        <motion.div
          className={s.mockCard}
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        >
          <div className={s.cardLabel}>YOUR ATTEMPT</div>
          <div className={s.cardText}>
            {typed}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
              style={{ marginLeft: 1 }}
            >
              |
            </motion.span>
          </div>
        </motion.div>

        <AnimatePresence>
          {showQuestion && (
            <motion.p
              className={s.whatIfQuestion}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              もしAIが、あなたの言いたいことを
              <br />
              正確に理解してくれたら？
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function SceneAICorrection() {
  const [step, setStep] = useState(0);
  // 0: original, 1: loading, 2: corrected, 3: label

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 2500),
      setTimeout(() => setStep(3), 4000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className={s.scene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={s.correctionContent}>
        {/* Original card */}
        <motion.div
          className={s.mockCard}
          animate={{ y: step >= 1 ? -10 : 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        >
          <div className={s.cardLabel}>YOUR ATTEMPT</div>
          <div className={s.cardText}>
            I want <span className={s.diffDelete}>eat</span> sushi
          </div>
        </motion.div>

        {/* Loading dots */}
        <AnimatePresence>
          {step === 1 && (
            <motion.div
              className={s.loadingDots}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className={s.loadingDot}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connector arrow */}
        {step >= 2 && (
          <motion.div
            className={s.connector}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <ArrowDown size={20} />
          </motion.div>
        )}

        {/* Corrected card */}
        <AnimatePresence>
          {step >= 2 && (
            <motion.div
              className={`${s.mockCard} ${s.mockCardAccent}`}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
            >
              <div className={s.cardLabel}>BETTER</div>
              <div className={s.cardText}>
                I want <span className={s.diffInsert}>to</span> eat sushi
              </div>
              <div className={s.cardTranslation}>お寿司が食べたい</div>
              <div className={s.cardScore}>
                <span>★</span> 92 — Natural
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feature label */}
        <AnimatePresence>
          {step >= 3 && (
            <motion.div
              className={s.correctionFeatureLabel}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className={s.featureLabel}>AI添削ストリーム</span>
              <span className={s.featureSubtitle}>自然に話す。即座に添削。</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function SceneMultilingual() {
  const [langIdx, setLangIdx] = useState(0);
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setLangIdx((prev) => (prev + 1) % PHRASE_LANGS.length);
    }, 650);
    const t = setTimeout(() => setShowLabel(true), 3500);
    return () => {
      clearInterval(interval);
      clearTimeout(t);
    };
  }, []);

  const current = PHRASE_LANGS[langIdx];

  return (
    <motion.div
      className={s.scene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={s.multilingualContent}>
        {/* Phrase card with language morphing */}
        <motion.div
          className={s.phraseCardMorph}
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={current.code}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <span className={s.morphLangCode}>{current.code}</span>
              <span className={s.morphText}>{current.text}</span>
            </motion.div>
          </AnimatePresence>

          {/* Play button */}
          <motion.div
            className={s.playPulse}
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Volume2 size={18} />
          </motion.div>
        </motion.div>

        {/* Language badges */}
        <div className={s.languageBadges}>
          {ALL_LANG_CODES.map((code) => (
            <div
              key={code}
              className={`${s.languageBadge} ${code === current.code ? s.languageBadgeActive : ""}`}
            >
              {code}
            </div>
          ))}
        </div>

        {/* Feature label */}
        <AnimatePresence>
          {showLabel && (
            <motion.div
              className={s.correctionFeatureLabel}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className={s.featureLabel}>9言語。リアルなフレーズ。</span>
              <span className={s.featureSubtitle}>ネイティブが実際に使う表現を学ぶ。</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function SceneAwareness() {
  const [step, setStep] = useState(0);
  // 0: show sentence, 1: finger tap, 2: highlight, 3: memo card, 4: confidence progression, 5: label

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 1500),
      setTimeout(() => setStep(3), 2200),
      setTimeout(() => setStep(4), 3500),
      setTimeout(() => setStep(5), 4800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const confidenceLevel = step < 4 ? "low" : step < 5 ? "med" : "high";

  return (
    <motion.div
      className={s.scene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={s.awarenessContent}>
        {/* Tokenized sentence */}
        <motion.div
          className={s.tokenizedSentence}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {AWARENESS_TOKENS.map((token, i) => (
            <motion.span
              key={i}
              className={`${s.token} ${token === "market" && step >= 2 ? s.tokenHighlighted : ""}`}
              animate={
                token === "market" && step >= 2
                  ? { scale: 1.1 }
                  : { scale: 1 }
              }
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {token}
            </motion.span>
          ))}
        </motion.div>

        {/* Tap indicator */}
        <AnimatePresence>
          {step >= 1 && step < 3 && (
            <motion.div
              className={s.fingerIcon}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ position: "relative" }}
            >
              <MousePointerClick size={28} color="var(--color-accent)" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Memo card */}
        <AnimatePresence>
          {step >= 3 && (
            <motion.div
              className={s.memoCard}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
            >
              <div className={s.memoWord}>market</div>
              <div className={s.confidenceRow}>
                <span
                  className={`${s.confidenceBadge} ${confidenceLevel === "low" ? s.confidenceLow : ""}`}
                >
                  LOW
                </span>
                <span
                  className={`${s.confidenceBadge} ${confidenceLevel === "med" ? s.confidenceMed : ""}`}
                >
                  MED
                </span>
                <span
                  className={`${s.confidenceBadge} ${confidenceLevel === "high" ? s.confidenceHigh : ""}`}
                >
                  HIGH
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sparkle on high confidence */}
        <AnimatePresence>
          {step >= 5 && (
            <>
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={`sparkle-${i}`}
                  style={{
                    position: "absolute",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--color-success)",
                  }}
                  initial={{ opacity: 1, scale: 0 }}
                  animate={{
                    opacity: 0,
                    scale: 2.5,
                    x: [0, (i % 2 === 0 ? 30 : -30) * (i < 2 ? 1 : -0.7)],
                    y: [0, (i < 2 ? -25 : 20)],
                  }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Feature label */}
        <AnimatePresence>
          {step >= 5 && (
            <motion.div
              className={s.correctionFeatureLabel}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className={s.featureLabel}>気づきシステム</span>
              <span className={s.featureSubtitle}>発見する。追跡する。習得する。</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function SceneFinal() {
  const [step, setStep] = useState(0);
  // 0: logo, 1: tagline, 2: pills, 3: CTA

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 1400),
      setTimeout(() => setStep(3), 2000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const FEATURES = [
    { icon: Mic, label: "AI Correction" },
    { icon: Globe, label: "9 Languages" },
    { icon: Sparkles, label: "Awareness" },
  ];

  return (
    <motion.div
      className={s.scene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className={s.finalContent}>
        {/* Logo */}
        <motion.div className={s.finalLogo}>
          {"Poly".split("").map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5, type: "spring", stiffness: 200 }}
            >
              {char}
            </motion.span>
          ))}
          <motion.span
            className={s.finalLogoAccent}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.4, type: "spring", stiffness: 300 }}
          >
            .
          </motion.span>
        </motion.div>

        {/* Tagline */}
        <AnimatePresence>
          {step >= 1 && (
            <motion.p
              className={s.finalTagline}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              Language learning reimagined.
            </motion.p>
          )}
        </AnimatePresence>

        {/* Feature pills */}
        <AnimatePresence>
          {step >= 2 && (
            <motion.div
              className={s.featurePills}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.label}
                  className={s.featurePill}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12, duration: 0.4, type: "spring", stiffness: 200 }}
                >
                  <f.icon size={14} />
                  {f.label}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA Button */}
        <AnimatePresence>
          {step >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 150, damping: 20 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <motion.button
                className={s.ctaButton}
                animate={{
                  boxShadow: [
                    "0 0 0 0px rgba(217, 69, 40, 0)",
                    "0 0 0 10px rgba(217, 69, 40, 0.12)",
                    "0 0 0 0px rgba(217, 69, 40, 0)",
                  ],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => window.location.href = "/register"}
              >
                Get Started
              </motion.button>
              <p className={s.signInLink}>
                Already have an account?{" "}
                <Link href="/login">Sign in</Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─── Main Page ─── */
const SCENES = [
  SceneOpening,
  SceneLanguageBabel,
  SceneWhatIf,
  SceneAICorrection,
  SceneMultilingual,
  SceneAwareness,
  SceneFinal,
];

export default function IntroAnimationPage() {
  const [scene, setScene] = useState(0);

  // Auto-advance scenes
  useEffect(() => {
    const duration = SCENE_DURATIONS[scene];
    if (duration === Infinity) return;
    const timer = setTimeout(() => setScene((s) => s + 1), duration);
    return () => clearTimeout(timer);
  }, [scene]);

  const handleSkip = useCallback(() => {
    setScene(TOTAL_SCENES - 1);
  }, []);

  const CurrentScene = SCENES[scene];

  return (
    <div className={s.container}>
      {/* Scene */}
      <AnimatePresence mode="wait">
        <CurrentScene key={scene} />
      </AnimatePresence>

      {/* Skip button */}
      {scene < TOTAL_SCENES - 1 && (
        <motion.button
          className={s.skipButton}
          onClick={handleSkip}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
        >
          Skip
        </motion.button>
      )}

      {/* Progress dots */}
      <div className={s.progressDots}>
        {SCENES.map((_, i) => (
          <div
            key={i}
            className={`${s.progressDot} ${i === scene ? s.progressDotActive : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
