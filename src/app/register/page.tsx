"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Check, User, Mail, Lock, Loader2, Mic, BookOpenText, Sprout, Rocket } from "lucide-react";
import { createClient } from "@/lib/supa-client";
import { LANGUAGES } from "@/lib/data";
import { translations, NativeLanguage } from "@/lib/translations";
import { LearningGoal } from "@/store/settings-store";
import s from "./page.module.css";

/* ─── Language Detection ─── */
function detectBrowserLanguage(): NativeLanguage {
  if (typeof window === "undefined") return "en";
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith("ja")) return "ja";
  if (browserLang.startsWith("ko")) return "ko";
  if (browserLang.startsWith("zh")) return "zh";
  if (browserLang.startsWith("fr")) return "fr";
  if (browserLang.startsWith("es")) return "es";
  if (browserLang.startsWith("de")) return "de";
  if (browserLang.startsWith("ru")) return "ru";
  if (browserLang.startsWith("vi")) return "vi";
  return "en";
}

/* ─── Constants ─── */
const NATIVE_LANGUAGES = [
  { code: "en", label: "English", icon: "🇺🇸" },
  { code: "ja", label: "日本語", icon: "🇯🇵" },
  { code: "ko", label: "한국어", icon: "🇰🇷" },
  { code: "zh", label: "中文", icon: "🇨🇳" },
  { code: "fr", label: "Français", icon: "🇫🇷" },
  { code: "es", label: "Español", icon: "🇪🇸" },
  { code: "de", label: "Deutsch", icon: "🇩🇪" },
  { code: "ru", label: "Русский", icon: "🇷🇺" },
  { code: "vi", label: "Tiếng Việt", icon: "🇻🇳" },
];

const FLAG_MAP: Record<string, string> = {
  en: "🇺🇸", ja: "🇯🇵", ko: "🇰🇷", zh: "🇨🇳", es: "🇪🇸",
  fr: "🇫🇷", ru: "🇷🇺", it: "🇮🇹", de: "🇩🇪", nl: "🇳🇱",
  sv: "🇸🇪", pl: "🇵🇱", pt: "🇧🇷", vi: "🇻🇳", id: "🇮🇩",
  tr: "🇹🇷", ar: "🇸🇦", hi: "🇮🇳", th: "🇹🇭",
};

const GENDERS = ["male", "female", "other", "unspecified"];

const TOTAL_SCENES = 7;

/* ─── Scene 1: Welcome ─── */
function SceneWelcome({ onComplete, t }: { onComplete: () => void; t: typeof translations.en }) {
  const [showTagline, setShowTagline] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowTagline(true), 1500);
    const t2 = setTimeout(() => onComplete(), 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  return (
    <motion.div
      className={s.scene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Expanding dot */}
      <motion.div
        className={s.welcomeDot}
        initial={{ scale: 1, opacity: 0.9 }}
        animate={{ scale: 60, opacity: 0.05 }}
        transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Logo */}
      <motion.h1 className={s.welcomeLogo}>
        {"PolyLinga".split("").map((char, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.5, type: "spring", stiffness: 200 }}
          >
            {char}
          </motion.span>
        ))}
      </motion.h1>

      {/* Tagline */}
      <AnimatePresence>
        {showTagline && (
          <motion.p
            className={s.welcomeTagline}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {t.startJourney}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Scene 2: Native Language ─── */
function SceneNativeLanguage({
  onSelect,
  t,
}: {
  onSelect: (lang: NativeLanguage) => void;
  t: typeof translations.en;
}) {
  const [selected, setSelected] = useState<NativeLanguage | null>(null);

  const handleSelect = (code: NativeLanguage) => {
    setSelected(code);
    setTimeout(() => onSelect(code), 500);
  };

  return (
    <motion.div
      className={s.scene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.h2
        className={s.sceneTitle}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {t.whatsYourLanguage}
      </motion.h2>

      <div className={s.langCards}>
        {NATIVE_LANGUAGES.map((lang, i) => (
          <motion.button
            key={lang.code}
            className={`${s.langCard} ${selected === lang.code ? s.langCardActive : ""}`}
            onClick={() => handleSelect(lang.code as NativeLanguage)}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.05, duration: 0.5, type: "spring", stiffness: 150 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className={s.langCardIcon}>{lang.icon}</span>
            <span className={s.langCardLabel}>{lang.label}</span>
            {selected === lang.code && (
              <motion.span
                className={s.langCardCheck}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Check size={20} />
              </motion.span>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Scene 3: Learning Language ─── */
function SceneLearningLanguage({
  nativeLanguage,
  onSelect,
  t,
}: {
  nativeLanguage: NativeLanguage;
  onSelect: (lang: string) => void;
  t: typeof translations.en;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const filteredLanguages = LANGUAGES.filter((l) => l.code !== nativeLanguage);

  const getLangName = (code: string) => {
    const key = `language_${code}` as keyof (typeof translations)[typeof nativeLanguage];
    return translations[nativeLanguage][key] || LANGUAGES.find((l) => l.code === code)?.nativeName;
  };

  const handleSelect = (code: string) => {
    setSelected(code);
    setTimeout(() => onSelect(code), 500);
  };

  return (
    <motion.div
      className={s.scene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.h2
        className={s.sceneTitle}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {t.iWantToLearn}
      </motion.h2>

      <motion.div
        className={s.langGrid}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {filteredLanguages.map((lang, i) => (
          <motion.button
            key={lang.code}
            className={`${s.langGridItem} ${selected === lang.code ? s.langGridItemActive : ""}`}
            onClick={() => handleSelect(lang.code)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 + i * 0.03, duration: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className={s.langGridIcon}>{FLAG_MAP[lang.code] || "🌐"}</span>
            <span className={s.langGridName}>{getLangName(lang.code)}</span>
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ─── Scene 4: Learning Goal (2-question diagnostic) ─── */
type DiagnosisAxis1 = "speaking" | "reading";
type DiagnosisAxis2 = "beginner" | "advanced";

const DIAGNOSIS_MAP: Record<`${DiagnosisAxis1}-${DiagnosisAxis2}`, LearningGoal> = {
  "speaking-beginner": "beginner",
  "speaking-advanced": "conversation",
  "reading-beginner": "balanced",
  "reading-advanced": "academic",
};

function SceneLearningGoal({
  onSelect,
  t,
}: {
  onSelect: (goal: LearningGoal) => void;
  t: typeof translations.en;
}) {
  const [axis1, setAxis1] = useState<DiagnosisAxis1 | null>(null);
  const [axis2, setAxis2] = useState<DiagnosisAxis2 | null>(null);

  const handleAxis1 = (val: DiagnosisAxis1) => {
    setAxis1(val);
  };

  const handleAxis2 = (val: DiagnosisAxis2) => {
    setAxis2(val);
    if (axis1) {
      const goal = DIAGNOSIS_MAP[`${axis1}-${val}`];
      setTimeout(() => onSelect(goal), 500);
    }
  };

  const q1Options: { key: DiagnosisAxis1; icon: typeof Mic; label: string; desc: string }[] = [
    { key: "speaking", icon: Mic, label: (t as any).diagnosisSpeaking || "Speaking", desc: (t as any).diagnosisSpeakingDesc || "Build conversation skills" },
    { key: "reading", icon: BookOpenText, label: (t as any).diagnosisReading || "Reading", desc: (t as any).diagnosisReadingDesc || "Strengthen reading comprehension" },
  ];

  const q2Options: { key: DiagnosisAxis2; icon: typeof Sprout; label: string; desc: string }[] = [
    { key: "beginner", icon: Sprout, label: (t as any).diagnosisBeginner || "Beginner", desc: (t as any).diagnosisBeginnerDesc || "Start with the basics" },
    { key: "advanced", icon: Rocket, label: (t as any).diagnosisAdvanced || "Advanced", desc: (t as any).diagnosisAdvancedDesc || "Go deeper" },
  ];

  return (
    <motion.div
      className={s.scene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Q1 */}
      <motion.h2
        className={s.sceneTitle}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {(t as any).diagnosisQ1 || "What do you focus on?"}
      </motion.h2>

      <div className={s.langCards}>
        {q1Options.map((opt, i) => (
          <motion.button
            key={opt.key}
            className={`${s.goalCard} ${axis1 === opt.key ? s.goalCardActive : ""}`}
            onClick={() => handleAxis1(opt.key)}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.5, type: "spring", stiffness: 150 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <opt.icon size={24} className={s.goalCardIcon} />
            <div className={s.goalCardText}>
              <span className={s.langCardLabel}>{opt.label}</span>
              <span className={s.goalCardDesc}>{opt.desc}</span>
            </div>
            {axis1 === opt.key && (
              <motion.span className={s.langCardCheck} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                <Check size={20} />
              </motion.span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Q2 - appears after Q1 is answered */}
      <AnimatePresence>
        {axis1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-3)", marginTop: "var(--space-5)" }}
          >
            <h2 className={s.sceneTitle} style={{ marginBottom: 0 }}>
              {(t as any).diagnosisQ2 || "Your level?"}
            </h2>
            <div className={s.langCards}>
              {q2Options.map((opt, i) => (
                <motion.button
                  key={opt.key}
                  className={`${s.goalCard} ${axis2 === opt.key ? s.goalCardActive : ""}`}
                  onClick={() => handleAxis2(opt.key)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4, type: "spring", stiffness: 150 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <opt.icon size={24} className={s.goalCardIcon} />
                  <div className={s.goalCardText}>
                    <span className={s.langCardLabel}>{opt.label}</span>
                    <span className={s.goalCardDesc}>{opt.desc}</span>
                  </div>
                  {axis2 === opt.key && (
                    <motion.span className={s.langCardCheck} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                      <Check size={20} />
                    </motion.span>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Scene 5: Profile ─── */
function SceneProfile({
  username,
  setUsername,
  gender,
  setGender,
  onNext,
  t,
}: {
  username: string;
  setUsername: (v: string) => void;
  gender: string;
  setGender: (v: string) => void;
  onNext: () => void;
  t: typeof translations.en;
}) {
  const getGenderLabel = (genderValue: string) => {
    switch (genderValue) {
      case "male": return t.genderMale;
      case "female": return t.genderFemale;
      case "other": return t.genderOther;
      case "unspecified": return t.genderUnspecified;
      default: return genderValue;
    }
  };

  const canProceed = username.trim().length > 0 && gender.length > 0;

  return (
    <motion.div
      className={s.scene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.h2
        className={s.sceneTitle}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {t.learningProfile}
      </motion.h2>

      <div className={s.profileContent}>
        {/* Username */}
        <motion.div
          className={s.inputGroup}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <label className={s.inputLabel}>
            {t.username}
          </label>
          <div className={s.inputWrapper}>
            <User size={18} className={s.inputIcon} />
            <input
              type="text"
              className={s.input}
              placeholder={t.setUsername}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Gender */}
        <motion.div
          className={s.inputGroup}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <label className={s.inputLabel}>
            {t.gender}
          </label>
          <div className={s.pillGroup}>
            {GENDERS.map((g, i) => (
              <motion.button
                key={g}
                className={`${s.pill} ${gender === g ? s.pillActive : ""}`}
                onClick={() => setGender(g)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.05, duration: 0.3 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {getGenderLabel(g)}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Next Button */}
        <motion.button
          className={s.submitButton}
          onClick={onNext}
          disabled={!canProceed}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          whileHover={canProceed ? { scale: 1.02 } : {}}
          whileTap={canProceed ? { scale: 0.98 } : {}}
        >
          {(t as any).nextButton || "Next"}
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ─── Scene 5: Account ─── */
function SceneAccount({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  error,
  onSubmit,
  t,
}: {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  loading: boolean;
  error: string | null;
  onSubmit: () => void;
  t: typeof translations.en;
}) {
  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const isStrongPassword = (p: string) => p.length >= 8 && /[a-zA-Z]/.test(p) && /[0-9]/.test(p);
  const canSubmit = isValidEmail(email) && isStrongPassword(password) && !loading;

  return (
    <motion.div
      className={s.scene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.h2
        className={s.sceneTitle}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {t.createAccount}
      </motion.h2>

      <div className={s.accountContent}>
        {error && (
          <motion.div
            className={s.errorMessage}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        {/* Email */}
        <motion.div
          className={s.inputGroup}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className={s.inputWrapper}>
            <Mail size={18} className={s.inputIcon} />
            <input
              type="email"
              className={s.input}
              placeholder={t.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <AnimatePresence>
            {email && !isValidEmail(email) && (
              <motion.p
                className={s.validationError}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                {t.pleaseEnterValidEmail}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Password */}
        <motion.div
          className={s.inputGroup}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className={s.inputWrapper}>
            <Lock size={18} className={s.inputIcon} />
            <input
              type="password"
              className={s.input}
              placeholder={t.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
            />
          </div>
          <AnimatePresence>
            {password && !isStrongPassword(password) && (
              <motion.p
                className={s.validationError}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                {(t as any).passwordMinChars || "Password must be at least 8 characters with letters and numbers"}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Submit */}
        <motion.button
          className={s.submitButton}
          onClick={onSubmit}
          disabled={!canSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          whileHover={canSubmit ? { scale: 1.02 } : {}}
          whileTap={canSubmit ? { scale: 0.98 } : {}}
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            t.createAccount
          )}
        </motion.button>

        <motion.p
          className={s.loginLink}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {t.alreadyHaveAccount}{" "}
          <a href="/login">{t.signIn}</a>
        </motion.p>
      </div>
    </motion.div>
  );
}

/* ─── Scene 6: Complete ─── */
function SceneComplete({
  t,
}: {
  t: typeof translations.en;
}) {
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSuccess(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className={s.scene}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className={s.completeContent}>
        <AnimatePresence mode="wait">
          {!showSuccess ? (
            <motion.div
              key="loading"
              className={s.loadingOrbit}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <div className={s.loadingRing} />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                style={{ position: "absolute", inset: 0 }}
              >
                <div className={s.loadingParticle} />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              className={s.successIcon}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <Check size={40} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSuccess && (
            <>
              <motion.h2
                className={s.completeTitle}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {(t as any).welcomeMessage || "Welcome!"}
              </motion.h2>
              <motion.p
                className={s.completeSubtitle}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                {(t as any).registerSubtitle || "Your account is ready"}
              </motion.p>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─── Main Page ─── */
export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [scene, setScene] = useState(0);
  const [browserLang, setBrowserLang] = useState<NativeLanguage>("en");
  const [nativeLanguage, setNativeLanguage] = useState<NativeLanguage | null>(null);
  const [learningLanguage, setLearningLanguage] = useState<string | null>(null);
  const [learningGoal, setLearningGoal] = useState<LearningGoal>("balanced");
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect browser language on mount
  useEffect(() => {
    setBrowserLang(detectBrowserLanguage());
  }, []);

  // Use native language if selected, otherwise use browser language
  const t = nativeLanguage ? translations[nativeLanguage] : translations[browserLang];

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            gender: gender || "unspecified",
            native_language: nativeLanguage,
            learning_language: learningLanguage,
          },
        },
      });
      if (authError) throw authError;

      if (authData.user) {
        // Use API route to bypass RLS
        const res = await fetch("/api/profile/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: authData.user.id,
            username: username || null,
            gender: gender || "unspecified",
            native_language: nativeLanguage,
            learning_language: learningLanguage,
            settings: { learningGoal },
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          console.error("Profile create error:", data.error);
        }

        // Send verification email based on native language
        const emailRes = await fetch("/api/auth/send-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            native_language: nativeLanguage,
          }),
        });
        if (!emailRes.ok) {
          const data = await emailRes.json();
          console.error("Send verification email error:", data.error);
        }

        // Sign out so user must verify email before logging in
        await supabase.auth.signOut();
      }

      // Move to success scene
      setScene(6);

      // Redirect after animation
      setTimeout(() => {
        router.push(`/register/verify?lang=${nativeLanguage}`);
      }, 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : ((t as any).errorGeneric || "An error occurred");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = useCallback(() => {
    if (scene > 1) setScene(scene - 1);
  }, [scene]);

  const renderScene = () => {
    switch (scene) {
      case 0:
        return <SceneWelcome key={0} onComplete={() => setScene(1)} t={t as any} />;
      case 1:
        return (
          <SceneNativeLanguage
            key={1}
            onSelect={(lang) => {
              setNativeLanguage(lang);
              setScene(2);
            }}
            t={t as any}
          />
        );
      case 2:
        return (
          <SceneLearningLanguage
            key={2}
            nativeLanguage={nativeLanguage!}
            onSelect={(lang) => {
              setLearningLanguage(lang);
              setScene(3);
            }}
            t={t as any}
          />
        );
      case 3:
        return (
          <SceneLearningGoal
            key={3}
            onSelect={(goal) => {
              setLearningGoal(goal);
              setScene(4);
            }}
            t={t as any}
          />
        );
      case 4:
        return (
          <SceneProfile
            key={4}
            username={username}
            setUsername={setUsername}
            gender={gender}
            setGender={setGender}
            onNext={() => setScene(5)}
            t={t as any}
          />
        );
      case 5:
        return (
          <SceneAccount
            key={5}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            loading={loading}
            error={error}
            onSubmit={handleRegister}
            t={t as any}
          />
        );
      case 6:
        return <SceneComplete key={6} t={t as any} />;
      default:
        return null;
    }
  };

  return (
    <div className={s.container}>
      {/* Back button */}
      {scene > 1 && scene < 6 && (
        <motion.button
          className={s.backButton}
          onClick={handleBack}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <ChevronLeft size={18} />
          {(t as any).backButton || "Back"}
        </motion.button>
      )}

      {/* Scene */}
      <AnimatePresence mode="wait">{renderScene()}</AnimatePresence>

      {/* Progress dots */}
      {scene < 6 && (
        <div className={s.progressDots}>
          {Array.from({ length: TOTAL_SCENES - 1 }).map((_, i) => (
            <div
              key={i}
              className={`${s.progressDot} ${i === scene ? s.progressDotActive : ""}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
