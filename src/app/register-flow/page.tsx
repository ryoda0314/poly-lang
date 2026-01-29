"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Check, User, Mail, Lock, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supa-client";
import { LANGUAGES } from "@/lib/data";
import { translations, NativeLanguage } from "@/lib/translations";
import s from "./page.module.css";

/* ─── Constants ─── */
const NATIVE_LANGUAGES = [
  { code: "en", label: "English", icon: "🇺🇸" },
  { code: "ja", label: "日本語", icon: "🇯🇵" },
  { code: "ko", label: "한국어", icon: "🇰🇷" },
];

const FLAG_MAP: Record<string, string> = {
  en: "🇺🇸", ja: "🇯🇵", ko: "🇰🇷", zh: "🇨🇳", es: "🇪🇸",
  fr: "🇫🇷", ru: "🇷🇺", it: "🇮🇹", de: "🇩🇪", nl: "🇳🇱",
  sv: "🇸🇪", pl: "🇵🇱", pt: "🇧🇷", vi: "🇻🇳", id: "🇮🇩",
  tr: "🇹🇷", ar: "🇸🇦", hi: "🇮🇳", th: "🇹🇭",
};

const GENDERS = [
  { value: "male", en: "Male", ja: "男性", ko: "남성" },
  { value: "female", en: "Female", ja: "女性", ko: "여성" },
  { value: "other", en: "Other", ja: "その他", ko: "기타" },
  { value: "unspecified", en: "Prefer not to say", ja: "指定しない", ko: "지정하지 않음" },
];

const TOTAL_SCENES = 6;

/* ─── Scene 1: Welcome ─── */
function SceneWelcome({ onComplete }: { onComplete: () => void }) {
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
            Start your journey
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Scene 2: Native Language ─── */
function SceneNativeLanguage({
  onSelect,
}: {
  onSelect: (lang: NativeLanguage) => void;
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
        What&apos;s your language?
      </motion.h2>

      <div className={s.langCards}>
        {NATIVE_LANGUAGES.map((lang, i) => (
          <motion.button
            key={lang.code}
            className={`${s.langCard} ${selected === lang.code ? s.langCardActive : ""}`}
            onClick={() => handleSelect(lang.code as NativeLanguage)}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1, duration: 0.5, type: "spring", stiffness: 150 }}
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
  getText,
}: {
  nativeLanguage: NativeLanguage;
  onSelect: (lang: string) => void;
  getText: (en: string, ja: string, ko: string) => string;
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
        {getText("I want to learn...", "学びたいのは...", "배우고 싶은 언어는...")}
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

/* ─── Scene 4: Profile ─── */
function SceneProfile({
  username,
  setUsername,
  gender,
  onGenderSelect,
  getText,
}: {
  username: string;
  setUsername: (v: string) => void;
  gender: string;
  onGenderSelect: (v: string) => void;
  getText: (en: string, ja: string, ko: string) => string;
}) {
  const handleGenderSelect = (value: string) => {
    onGenderSelect(value);
  };

  const getGenderLabel = (g: (typeof GENDERS)[0]) => {
    return getText(g.en, g.ja, g.ko);
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
        {getText("Tell us about you", "あなたについて", "당신에 대해")}
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
            {getText("Username (optional)", "ユーザー名（任意）", "사용자 이름 (선택)")}
          </label>
          <div className={s.inputWrapper}>
            <User size={18} className={s.inputIcon} />
            <input
              type="text"
              className={s.input}
              placeholder={getText("Enter username", "ユーザー名を入力", "사용자 이름 입력")}
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
            {getText("Gender", "性別", "성별")}
          </label>
          <div className={s.pillGroup}>
            {GENDERS.map((g, i) => (
              <motion.button
                key={g.value}
                className={`${s.pill} ${gender === g.value ? s.pillActive : ""}`}
                onClick={() => handleGenderSelect(g.value)}
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
  getText,
}: {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  loading: boolean;
  error: string | null;
  onSubmit: () => void;
  getText: (en: string, ja: string, ko: string) => string;
}) {
  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const canSubmit = isValidEmail(email) && password.length >= 6 && !loading;

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
        {getText("Create your account", "アカウント作成", "계정 만들기")}
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
              placeholder={getText("Email", "メールアドレス", "이메일")}
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
                {getText("Please enter a valid email", "有効なメールアドレスを入力してください", "유효한 이메일을 입력하세요")}
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
              placeholder={getText("Password (6+ chars)", "パスワード（6文字以上）", "비밀번호 (6자 이상)")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
            />
          </div>
          <AnimatePresence>
            {password && password.length < 6 && (
              <motion.p
                className={s.validationError}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                {getText("Password must be at least 6 characters", "パスワードは6文字以上必要です", "비밀번호는 6자 이상이어야 합니다")}
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
            getText("Create Account", "アカウント作成", "계정 만들기")
          )}
        </motion.button>

        <motion.p
          className={s.loginLink}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {getText("Already have an account?", "アカウントをお持ちですか？", "이미 계정이 있으신가요?")}{" "}
          <a href="/login">{getText("Log in", "ログイン", "로그인")}</a>
        </motion.p>
      </div>
    </motion.div>
  );
}

/* ─── Scene 6: Complete ─── */
function SceneComplete({
  getText,
}: {
  getText: (en: string, ja: string, ko: string) => string;
}) {
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowSuccess(true), 1500);
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
                {getText("Welcome!", "ようこそ！", "환영합니다!")}
              </motion.h2>
              <motion.p
                className={s.completeSubtitle}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                {getText(
                  "Check your email to verify your account",
                  "メールを確認してアカウントを認証してください",
                  "이메일을 확인하여 계정을 인증하세요"
                )}
              </motion.p>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─── Main Page ─── */
export default function RegisterFlowPage() {
  const router = useRouter();
  const supabase = createClient();

  const [scene, setScene] = useState(0);
  const [nativeLanguage, setNativeLanguage] = useState<NativeLanguage | null>(null);
  const [learningLanguage, setLearningLanguage] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getText = useCallback(
    (en: string, ja: string, ko: string) => {
      if (nativeLanguage === "ja") return ja;
      if (nativeLanguage === "ko") return ko;
      return en;
    },
    [nativeLanguage]
  );

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
        await supabase.from("profiles").upsert({
          id: authData.user.id,
          username: username || null,
          gender: gender || "unspecified",
          native_language: nativeLanguage,
          learning_language: learningLanguage,
        });
      }

      // Move to success scene
      setScene(5);

      // Redirect after animation
      setTimeout(() => {
        router.push(`/register/verify?lang=${nativeLanguage}`);
      }, 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : getText("Registration failed", "登録に失敗しました", "가입에 실패했습니다");
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
        return <SceneWelcome key={0} onComplete={() => setScene(1)} />;
      case 1:
        return (
          <SceneNativeLanguage
            key={1}
            onSelect={(lang) => {
              setNativeLanguage(lang);
              setScene(2);
            }}
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
            getText={getText}
          />
        );
      case 3:
        return (
          <SceneProfile
            key={3}
            username={username}
            setUsername={setUsername}
            gender={gender}
            onGenderSelect={(g) => {
              setGender(g);
              setTimeout(() => setScene(4), 500);
            }}
            getText={getText}
          />
        );
      case 4:
        return (
          <SceneAccount
            key={4}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            loading={loading}
            error={error}
            onSubmit={handleRegister}
            getText={getText}
          />
        );
      case 5:
        return <SceneComplete key={5} getText={getText} />;
      default:
        return null;
    }
  };

  return (
    <div className={s.container}>
      {/* Back button */}
      {scene > 1 && scene < 5 && (
        <motion.button
          className={s.backButton}
          onClick={handleBack}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <ChevronLeft size={18} />
          {getText("Back", "戻る", "뒤로")}
        </motion.button>
      )}

      {/* Scene */}
      <AnimatePresence mode="wait">{renderScene()}</AnimatePresence>

      {/* Progress dots */}
      {scene < 5 && (
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
