"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supa-client";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import s from "./page.module.css";

/* ─── Scene 1: Welcome ─── */
function SceneWelcome({ onComplete, t }: { onComplete: () => void; t: typeof translations.ja }) {
  const [showTagline, setShowTagline] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowTagline(true), 1200);
    const t2 = setTimeout(() => onComplete(), 2200);
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
        animate={{ scale: 50, opacity: 0.05 }}
        transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Logo */}
      <motion.h1 className={s.welcomeLogo}>
        {"PolyLinga".split("").map((char, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.06, duration: 0.4, type: "spring", stiffness: 200 }}
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
            transition={{ duration: 0.6 }}
          >
            {t.welcomeBack}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Scene 2: Login ─── */
function SceneLogin({
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
  t: typeof translations.ja;
}) {
  const canSubmit = email.trim() !== "" && password.length >= 1 && !loading;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canSubmit) {
      onSubmit();
    }
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
        {t.signIn}
      </motion.h2>

      <div className={s.loginContent}>
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
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>
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
              onKeyDown={handleKeyDown}
            />
          </div>
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
          {loading ? <Loader2 className="animate-spin" size={20} /> : t.signIn}
        </motion.button>

        <motion.p
          className={s.registerLink}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {t.newHere} <a href="/register">{t.createAccount}</a>
        </motion.p>
      </div>
    </motion.div>
  );
}

/* ─── Main Page ─── */
export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const { isLoggedIn, nativeLanguage } = useAppStore();
  const t = translations[nativeLanguage] || translations.en;

  const [scene, setScene] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      router.push("/app");
    }
  }, [isLoggedIn, router]);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;

      // Check if email is verified in profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("email_verified")
        .eq("id", data.user?.id)
        .single();

      if (!profile?.email_verified) {
        // Sign out unverified user
        await supabase.auth.signOut();
        throw new Error((t as any).emailNotVerified || "Please verify your email before logging in.");
      }

      router.push("/app");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const renderScene = () => {
    switch (scene) {
      case 0:
        return <SceneWelcome key={0} onComplete={() => setScene(1)} t={t} />;
      case 1:
        return (
          <SceneLogin
            key={1}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            loading={loading}
            error={error}
            onSubmit={handleLogin}
            t={t}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={s.container}>
      <AnimatePresence mode="wait">{renderScene()}</AnimatePresence>
    </div>
  );
}
