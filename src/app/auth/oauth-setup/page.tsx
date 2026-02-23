"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supa-client";
import { LANGUAGES } from "@/lib/data";
import { translations, NativeLanguage } from "@/lib/translations";
import { detectBrowserLanguage } from "@/lib/detect-browser-language";
import s from "./page.module.css";

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

type Step = "loading" | "native" | "learning";

export default function OAuthSetupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [browserLang] = useState<NativeLanguage>(
    typeof window !== "undefined" ? detectBrowserLanguage() : "en"
  );
  const [nativeLanguage, setNativeLanguage] = useState<NativeLanguage | null>(null);
  const [learningLanguage, setLearningLanguage] = useState<string | null>(null);

  const t = nativeLanguage ? translations[nativeLanguage] : translations[browserLang];

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);

      // Check for pending profile data from register flow
      const pendingRaw = sessionStorage.getItem("poly.oauth_pending_profile");
      if (pendingRaw) {
        try {
          const pending = JSON.parse(pendingRaw);
          const res = await fetch("/api/profile/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user.id, ...pending }),
          });
          sessionStorage.removeItem("poly.oauth_pending_profile");
          if (res.ok) {
            router.replace("/app");
            return;
          }
        } catch (e) {
          console.error("Auto profile creation failed:", e);
        }
      }

      // No pending data — show language selection
      setStep("native");
    }
    init();
  }, []);

  const handleNativeSelect = (code: NativeLanguage) => {
    setNativeLanguage(code);
    setTimeout(() => setStep("learning"), 400);
  };

  const handleLearningSelect = async (code: string) => {
    setLearningLanguage(code);
    if (!userId) return;

    // Create profile
    await fetch("/api/profile/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        username: null,
        gender: "unspecified",
        native_language: nativeLanguage,
        learning_language: code,
        settings: { learningGoal: "balanced" },
      }),
    });

    router.replace("/app");
  };

  const getLangName = (code: string) => {
    const lang = nativeLanguage || browserLang;
    const key = `language_${code}` as keyof (typeof translations)[typeof lang];
    return translations[lang][key] || LANGUAGES.find((l) => l.code === code)?.nativeName;
  };

  return (
    <div className={s.container}>
      <AnimatePresence mode="wait">
        {step === "loading" && (
          <motion.div
            key="loading"
            className={s.loadingContainer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 size={32} className="animate-spin" style={{ color: "var(--color-accent)" }} />
          </motion.div>
        )}

        {step === "native" && (
          <motion.div
            key="native"
            className={s.scene}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
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
                  className={`${s.langCard} ${nativeLanguage === lang.code ? s.langCardActive : ""}`}
                  onClick={() => handleNativeSelect(lang.code as NativeLanguage)}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05, duration: 0.5, type: "spring", stiffness: 150 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className={s.langCardIcon}>{lang.icon}</span>
                  <span className={s.langCardLabel}>{lang.label}</span>
                  {nativeLanguage === lang.code && (
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
        )}

        {step === "learning" && nativeLanguage && (
          <motion.div
            key="learning"
            className={s.scene}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
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
              {LANGUAGES.filter((l) => l.code !== nativeLanguage).map((lang, i) => (
                <motion.button
                  key={lang.code}
                  className={`${s.langGridItem} ${learningLanguage === lang.code ? s.langGridItemActive : ""}`}
                  onClick={() => handleLearningSelect(lang.code)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 + i * 0.03, duration: 0.4 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className={s.langGridIcon}>{FLAG_MAP[lang.code] || "🌐"}</span>
                  <span className={s.langGridName}>{getLangName(lang.code)}</span>
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
