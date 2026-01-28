"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, Send, Mic, Globe, Sparkles, Volume2 } from "lucide-react";
import Link from "next/link";
import s from "./page.module.css";

/* ─── Data ─── */
const GRAMMAR_WORDS = [
  { word: "I", label: "Subject", sub: "1st person" },
  { word: "eat", label: "Verb", sub: "Transitive" },
  { word: "sushi", label: "Object", sub: "Uncountable" },
];

const SCATTERED_RULES = [
  { text: "S + V + O", x: "18%", y: "22%", rotate: -3 },
  { text: "eat → ate → eaten", x: "75%", y: "20%", rotate: 2 },
  { text: "Present Simple", x: "10%", y: "55%", rotate: -4 },
  { text: "a / an / the / ∅", x: "82%", y: "52%", rotate: 3 },
  { text: "Active ↔ Passive", x: "22%", y: "75%", rotate: -2 },
  { text: "Past · Present · Future", x: "72%", y: "78%", rotate: 4 },
  { text: "S + V(s/es) + O", x: "45%", y: "15%", rotate: -1 },
  { text: "Infinitive · Gerund", x: "50%", y: "82%", rotate: 1 },
  { text: "Modal Verbs", x: "8%", y: "35%", rotate: 5 },
  { text: "Countable / Uncountable", x: "85%", y: "38%", rotate: -3 },
];

const SOUND_DOTS = [
  { x: "20%", y: "30%" }, { x: "45%", y: "22%" }, { x: "72%", y: "35%" },
  { x: "15%", y: "55%" }, { x: "50%", y: "48%" }, { x: "82%", y: "52%" },
  { x: "30%", y: "72%" }, { x: "62%", y: "68%" }, { x: "85%", y: "25%" },
  { x: "38%", y: "40%" }, { x: "58%", y: "58%" }, { x: "25%", y: "42%" },
];

const PIVOT_SYLLABLES = [
  { text: "ま", x: "40%", y: "43%" },
  { text: "ま", x: "56%", y: "40%" },
  { text: "み", x: "30%", y: "58%" },
  { text: "る", x: "65%", y: "52%" },
  { text: "く", x: "48%", y: "62%" },
];

const PIVOT_WORDS = [
  { text: "ミルク", x: "30%", y: "35%", size: "1.5rem" },
  { text: "ほしい", x: "68%", y: "58%", size: "1.4rem" },
  { text: "いぬ", x: "25%", y: "65%", size: "1.6rem" },
  { text: "どこ", x: "72%", y: "30%", size: "1.3rem" },
];

const PHRASE_LANGS = [
  { code: "EN", text: "I want to eat sushi" },
  { code: "JA", text: "お寿司が食べたい" },
  { code: "KO", text: "초밥을 먹고 싶어요" },
  { code: "ZH", text: "我想吃寿司" },
  { code: "FR", text: "Je veux manger des sushis" },
  { code: "ES", text: "Quiero comer sushi" },
  { code: "DE", text: "Ich will Sushi essen" },
  { code: "RU", text: "Хочу есть суши" },
  { code: "VI", text: "Tôi muốn ăn sushi" },
];

const ALL_LANG_CODES = ["EN", "JA", "KO", "ZH", "FR", "ES", "DE", "RU", "VI"];

const DISCOVERY_PHRASES = [
  { before: "寿司を", highlight: "食べたい", translation: "I want to eat sushi" },
  { before: "家に", highlight: "帰りたい", translation: "I want to go home" },
  { before: "フランス語を", highlight: "学びたい", translation: "I want to learn French" },
];

const SCENE_DURATIONS = [4000, 13500, 10500, 11500, 7000, 10500, 8500, Infinity];
const TOTAL_SCENES = SCENE_DURATIONS.length;

/* ─── Scene Components ─── */

function SceneOpening() {
  const [showTitle, setShowTitle] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowTitle(true), 1400);
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
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            Poly<span style={{ color: "var(--color-accent)" }}>.</span>
          </motion.h1>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SceneGrammarRejection() {
  const [step, setStep] = useState(0);
  // 0: sentence fades in
  // 1: grammar labels appear under each word
  // 2: rules scatter across screen
  // 3: strike-through + everything dims
  // 4: rejection message

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1200),
      setTimeout(() => setStep(2), 2500),
      setTimeout(() => setStep(3), 5000),
      setTimeout(() => setStep(4), 6200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const isDimmed = step >= 3;

  return (
    <motion.div
      className={s.scene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <AnimatePresence mode="wait">
        {step < 4 ? (
          <motion.div
            key="grammar"
            className={s.grammarStage}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
          >
            {/* Centered sentence with labels */}
            <div className={s.grammarSentence}>
              {GRAMMAR_WORDS.map((gw, i) => {
                const fallDrift = [-35, 8, 45][i];
                const fallRotate = [-18, 4, 22][i];
                return (
                  <motion.div
                    key={gw.word}
                    className={s.grammarWord}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{
                      opacity: isDimmed ? 0 : 1,
                      y: isDimmed ? 650 : 0,
                      x: isDimmed ? fallDrift : 0,
                      rotate: isDimmed ? fallRotate : 0,
                      filter: isDimmed ? "blur(2px)" : "blur(0px)",
                    }}
                    transition={
                      isDimmed
                        ? { duration: 0.9, delay: i * 0.06, ease: [0.42, 0, 1, 1] }
                        : { duration: 0.5, delay: i * 0.15 }
                    }
                  >
                    <span className={s.grammarWordText}>{gw.word}</span>
                    <motion.span
                      className={s.grammarBracket}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{
                        opacity: step >= 1 ? (isDimmed ? 0.15 : 1) : 0,
                        y: 0,
                      }}
                      transition={{ delay: i * 0.12, duration: 0.4 }}
                    >
                      {gw.label}
                    </motion.span>
                    <motion.span
                      className={s.grammarBracketSub}
                      initial={{ opacity: 0, y: -3 }}
                      animate={{
                        opacity: step >= 1 ? (isDimmed ? 0.1 : 0.6) : 0,
                        y: 0,
                      }}
                      transition={{ delay: 0.3 + i * 0.12, duration: 0.35 }}
                    >
                      {gw.sub}
                    </motion.span>
                  </motion.div>
                );
              })}
            </div>

            {/* Scattered rules across the screen */}
            {SCATTERED_RULES.map((rule, i) => (
              <motion.div
                key={rule.text}
                className={s.scatteredRule}
                style={{
                  left: rule.x,
                  top: rule.y,
                  rotate: rule.rotate,
                }}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{
                  opacity: step >= 2 ? (isDimmed ? 0 : 0.85) : 0,
                  scale: step >= 2 ? 1 : 0.7,
                  y: isDimmed ? 500 : 0,
                  filter: isDimmed ? "blur(3px)" : "blur(0px)",
                }}
                transition={
                  isDimmed
                    ? { duration: 0.8, delay: i * 0.04, ease: [0.42, 0, 1, 1] }
                    : { duration: 0.45, delay: step === 2 ? i * 0.08 : 0 }
                }
              >
                {rule.text}
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.p
            key="rejection"
            className={s.rejectionMessage}
            initial={{ opacity: 0, scale: 1.1, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.0 }}
          >
            もっと自然に、
            <br />
            学べるはず。
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ScenePivot() {
  const [step, setStep] = useState(0);
  // 0: sound dots pulse (hearing)
  // 1: syllables emerge (recognizing sounds)
  // 2: ママ forms (first word!)
  // 3: more words appear (vocabulary grows)
  // 4: words combine → first phrase
  // 5: second phrase forms
  // 6: closing message

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1000),
      setTimeout(() => setStep(2), 2200),
      setTimeout(() => setStep(3), 3800),
      setTimeout(() => setStep(4), 6000),
      setTimeout(() => setStep(5), 8200),
      setTimeout(() => setStep(6), 10000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className={s.scene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className={s.pivotStage}>
        {/* Sound dots — what a baby hears */}
        {SOUND_DOTS.map((dot, i) => (
          <motion.div
            key={`dot-${i}`}
            className={s.soundDot}
            style={{ left: dot.x, top: dot.y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: step < 2 ? 0.4 : 0,
              scale: step < 2 ? 1 : 0,
            }}
            transition={{ delay: step === 0 ? i * 0.06 : 0, duration: 0.5 }}
          >
            <motion.div
              className={s.soundDotPulse}
              animate={{ scale: [1, 2.5, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2 + i * 0.15, repeat: Infinity, ease: "easeOut" }}
            />
          </motion.div>
        ))}

        {/* Syllables — baby recognizes sounds */}
        {PIVOT_SYLLABLES.map((syl, i) => (
          <motion.div
            key={`syl-${i}`}
            className={s.pivotSyllable}
            style={{ left: syl.x, top: syl.y }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: step === 1 ? 0.7 : 0,
              scale: step === 1 ? 1 : 0.5,
            }}
            transition={{ delay: step === 1 ? i * 0.15 : 0, duration: 0.4 }}
          >
            {syl.text}
          </motion.div>
        ))}

        {/* ママ — first word forms, fades when phrases begin */}
        <AnimatePresence>
          {step >= 2 && step < 4 && (
            <motion.div
              className={s.pivotFirstWord}
              style={{ left: "50%", top: "45%" }}
              initial={{ opacity: 0, scale: 2, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.5 } }}
              transition={{ duration: 0.7, type: "spring", stiffness: 150, damping: 20 }}
            >
              <motion.span
                style={{ display: "block" }}
                animate={{ y: [0, -6, 0] }}
                transition={{ delay: 0.7, duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                ママ
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* More words — vocabulary grows, fades when phrases begin */}
        {PIVOT_WORDS.map((w, i) => (
          <AnimatePresence key={w.text}>
            {step >= 3 && step < 4 && (
              <motion.div
                className={s.pivotWord}
                style={{ left: w.x, top: w.y, fontSize: w.size }}
                initial={{ opacity: 0, scale: 0.5, filter: "blur(6px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.5 } }}
                transition={{ delay: i * 0.2, duration: 0.6 }}
              >
                <motion.span
                  style={{ display: "block" }}
                  animate={{ y: [0, -6, 0] }}
                  transition={{
                    delay: i * 0.2 + 0.6,
                    duration: 2.5 + i * 0.3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {w.text}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        ))}

        {/* First phrase — words combine into a sentence */}
        <AnimatePresence>
          {step >= 4 && step < 6 && (
            <motion.div
              className={s.pivotPhrase}
              style={{ top: "42%" }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.5 } }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {["ママ、", "ミルク ", "ほしい"].map((word, i) => (
                <motion.span
                  key={word}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.25, duration: 0.5 }}
                >
                  {word}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Second phrase — another sentence forms */}
        <AnimatePresence>
          {step >= 5 && step < 6 && (
            <motion.div
              className={s.pivotPhrase}
              style={{ top: "55%" }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.5 } }}
              transition={{ duration: 0.8 }}
            >
              {["いぬ、", "どこ？"].map((word, i) => (
                <motion.span
                  key={word}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.25, duration: 0.5 }}
                >
                  {word}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Closing message */}
        <AnimatePresence>
          {step >= 6 && (
            <motion.p
              className={s.pivotMessage}
              initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.0, delay: 0.3 }}
            >
              ルールより先に、言葉があった。
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function SceneAICorrection() {
  const [step, setStep] = useState(0);
  const [charCount, setCharCount] = useState(0);
  // 0: typing, 1: typed complete, 2: assessment card, 3: score animate,
  // 4: loading, 5: solution card, 6: label

  const INPUT_TEXT = "I want eat sushi";

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 2200),
      setTimeout(() => setStep(2), 3200),
      setTimeout(() => setStep(3), 4200),
      setTimeout(() => setStep(4), 5600),
      setTimeout(() => setStep(5), 6900),
      setTimeout(() => setStep(6), 8900),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Typing effect
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < INPUT_TEXT.length; i++) {
      timers.push(setTimeout(() => setCharCount(i + 1), 400 + i * 100));
    }
    return () => timers.forEach(clearTimeout);
  }, []);

  const STARS = [1, 2, 3, 4, 5];

  return (
    <motion.div
      className={s.scene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className={s.correctionContent}>
        {/* Text input phase */}
        <AnimatePresence mode="wait">
          {step < 2 && (
            <motion.div
              key="input"
              className={s.inputBar}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className={s.inputText}>
                {INPUT_TEXT.slice(0, charCount)}
                {step < 1 && <span className={s.inputCursor}>|</span>}
              </div>
              <motion.div
                className={s.sendButton}
                animate={step >= 1 ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Send size={18} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Assessment card */}
        <AnimatePresence>
          {step >= 2 && (
            <motion.div
              className={s.mockCard}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 160, damping: 22 }}
            >
              <div className={s.cardLabel}>あなたの発言</div>
              <div className={s.cardText}>
                I want{" "}
                <span className={step >= 5 ? s.diffDelete : ""}>eat</span>{" "}
                sushi
              </div>

              {/* Score section */}
              <AnimatePresence>
                {step >= 3 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className={s.cardDivider} />
                    <div className={s.scoreLabel}>自然さスコア</div>
                    <div className={s.scoreRow}>
                      <div className={s.starRating}>
                        {STARS.map((star) => (
                          <motion.span
                            key={star}
                            className={star <= 3 ? s.starFilled : s.starEmpty}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                              delay: star * 0.1,
                              duration: 0.3,
                              type: "spring",
                              stiffness: 300,
                            }}
                          >
                            ★
                          </motion.span>
                        ))}
                      </div>
                      <motion.span
                        className={s.scoreValue}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.4 }}
                      >
                        68
                      </motion.span>
                    </div>
                    <motion.p
                      className={s.scoreSummary}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.4 }}
                    >
                      前置詞が抜けています
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading dots */}
        <AnimatePresence>
          {step === 4 && (
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
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25 }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connector arrow */}
        <AnimatePresence>
          {step >= 5 && (
            <motion.div
              className={s.connector}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <ArrowDown size={22} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Solution card */}
        <AnimatePresence>
          {step >= 5 && (
            <motion.div
              className={`${s.mockCard} ${s.mockCardAccent}`}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 160, damping: 22 }}
            >
              <div className={s.cardLabel}>より自然な表現</div>
              <div className={s.cardText}>
                I want <span className={s.diffInsert}>to</span> eat sushi
              </div>
              <div className={s.cardTranslation}>お寿司が食べたい</div>
              <div className={s.whyBetter}>
                <div className={s.whyBetterTitle}>ここがポイント</div>
                <p className={s.whyBetterText}>
                  want + <strong>to</strong> + verb の形が自然です
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feature label */}
        <AnimatePresence>
          {step >= 6 && (
            <motion.div
              className={s.correctionFeatureLabel}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className={s.featureLabel}>AIが、そっと正してくれる。</span>
              <span className={s.featureSubtitle}>伝えて、気づいて、自然になる。</span>
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
    }, 900);
    const t = setTimeout(() => setShowLabel(true), 5000);
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
      transition={{ duration: 0.8 }}
    >
      <div className={s.multilingualContent}>
        {/* Phrase card with language morphing */}
        <motion.div
          className={s.phraseCardMorph}
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 160, damping: 22 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={current.code}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              <span className={s.morphLangCode}>{current.code}</span>
              <span className={s.morphText}>{current.text}</span>
            </motion.div>
          </AnimatePresence>

          {/* Play button */}
          <motion.div
            className={s.playPulse}
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Volume2 size={20} />
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
              transition={{ duration: 0.8 }}
            >
              <span className={s.featureLabel}>9言語。ネイティブの発音で。</span>
              <span className={s.featureSubtitle}>本物の声を聴いて、そのまま真似る。</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function SceneAwareness() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [highlightOn, setHighlightOn] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setVisibleCount(1), 600),
      setTimeout(() => setVisibleCount(2), 1800),
      setTimeout(() => setVisibleCount(3), 3000),
      setTimeout(() => setHighlightOn(true), 4800),
      setTimeout(() => setShowDiscovery(true), 6400),
      setTimeout(() => setShowLabel(true), 7800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className={s.scene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className={s.discoveryContent}>
        {/* Phrase rows */}
        <div className={s.discoveryPhrases}>
          {DISCOVERY_PHRASES.map((phrase, i) => (
            <AnimatePresence key={i}>
              {visibleCount > i && (
                <motion.div
                  className={s.discoveryRow}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.55, type: "spring", stiffness: 140, damping: 20 }}
                >
                  <span className={s.discoveryBefore}>{phrase.before}</span>
                  <span
                    className={`${s.discoveryHighlight} ${highlightOn ? s.discoveryHighlightActive : ""}`}
                  >
                    {phrase.highlight}
                  </span>
                  <span className={s.discoveryTranslation}>{phrase.translation}</span>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>

        {/* Connection lines + discovery card */}
        <AnimatePresence>
          {highlightOn && (
            <motion.div
              className={s.discoveryConnector}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showDiscovery && (
            <motion.div
              className={s.discoveryCard}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 150, damping: 20 }}
            >
              <span className={s.discoveryPattern}>〜たい</span>
              <span className={s.discoveryMeaning}>= 〜したい（want to ~）</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feature label */}
        <AnimatePresence>
          {showLabel && (
            <motion.div
              className={s.correctionFeatureLabel}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className={s.featureLabel}>自分で気づく。だから身につく。</span>
              <span className={s.featureSubtitle}>比べて、見つけて、理解する。</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function SceneTryIt() {
  const [step, setStep] = useState(0);
  // 0: 〜たい pattern callback
  // 1: 食べたい appears
  // 2: attempt in English floats up
  // 3: bridge message

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 2200),
      setTimeout(() => setStep(3), 4200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const ATTEMPT_WORDS = ["I", "want", "eat", "sushi..."];

  return (
    <motion.div
      className={s.scene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className={s.tryItContent}>
        {/* Pattern callback badge */}
        <motion.div
          className={s.tryItPattern}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: step < 3 ? 1 : 0,
            scale: 1,
            y: step >= 2 ? -20 : 0,
          }}
          transition={{ duration: 0.6 }}
        >
          〜たい
        </motion.div>

        {/* 食べたい with meaning */}
        <AnimatePresence>
          {step >= 1 && step < 3 && (
            <motion.div
              className={s.tryItWord}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              transition={{ duration: 0.6 }}
            >
              <span className={s.tryItWordMain}>食べたい</span>
              <span className={s.tryItWordSub}>= want to eat</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* English attempt */}
        <AnimatePresence>
          {step >= 2 && step < 3 && (
            <motion.div
              className={s.tryItAttempt}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {ATTEMPT_WORDS.map((word, i) => (
                <motion.span
                  key={word}
                  className={s.tryItAttemptWord}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.3, duration: 0.4 }}
                >
                  {word}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bridge message */}
        <AnimatePresence>
          {step >= 3 && (
            <motion.p
              className={s.tryItMessage}
              initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.0, delay: 0.2 }}
            >
              気づいたら、伝えてみよう。
            </motion.p>
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
      setTimeout(() => setStep(1), 1200),
      setTimeout(() => setStep(2), 2200),
      setTimeout(() => setStep(3), 3200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const FEATURES = [
    { icon: Sparkles, label: "Awareness" },
    { icon: Mic, label: "AI Correction" },
    { icon: Globe, label: "9 Languages" },
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
              transition={{ duration: 0.9 }}
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
                  <f.icon size={16} />
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
  ScenePivot,
  SceneGrammarRejection,
  SceneAwareness,
  SceneTryIt,
  SceneAICorrection,
  SceneMultilingual,
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
