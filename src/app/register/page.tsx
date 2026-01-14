"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supa-client";
import { Loader2, ChevronLeft, ChevronRight, Check, User, Mail, Lock } from "lucide-react";
import { LANGUAGES } from "@/lib/data";
import { translations, NativeLanguage } from "@/lib/translations";
import styles from "./page.module.css";

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
    { value: "male", labelEn: "Male", labelJa: "男性", labelKo: "남성" },
    { value: "female", labelEn: "Female", labelJa: "女性", labelKo: "여성" },
    { value: "other", labelEn: "Other", labelJa: "その他", labelKo: "기타" },
    { value: "unspecified", labelEn: "Prefer not to say", labelJa: "指定しない", labelKo: "지정하지 않음" },
];

export default function RegisterPage() {
    const router = useRouter();
    const supabase = createClient();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [nativeLanguage, setNativeLanguage] = useState<NativeLanguage | null>(null);
    const [learningLanguage, setLearningLanguage] = useState<string | null>(null);
    const [username, setUsername] = useState("");
    const [gender, setGender] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const canProceed = () => {
        switch (step) {
            case 1: return nativeLanguage !== null;
            case 2: return learningLanguage !== null;
            case 3: return email.trim() !== "" && password.length >= 6 && gender !== "";
            default: return false;
        }
    };

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
        else handleRegister();
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleRegister = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { username, gender: gender || "unspecified", native_language: nativeLanguage, learning_language: learningLanguage }
                }
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
            router.push(`/register/verify?lang=${nativeLanguage}`);
        } catch (err: any) {
            setError(err.message || getText("Registration failed", "登録に失敗しました", "가입에 실패했습니다"));
        } finally {
            setLoading(false);
        }
    };

    const getGenderLabel = (g: typeof GENDERS[0]) => {
        if (!nativeLanguage || nativeLanguage === "en") return g.labelEn;
        if (nativeLanguage === "ja") return g.labelJa;
        if (nativeLanguage === "ko") return g.labelKo;
        return g.labelEn;
    };

    const getText = (en: string, ja: string, ko: string) => {
        if (nativeLanguage === "ja") return ja;
        if (nativeLanguage === "ko") return ko;
        return en;
    };

    const getLangName = (code: string) => {
        if (!nativeLanguage) return LANGUAGES.find(l => l.code === code)?.nativeName;
        // @ts-ignore
        const key = `language_${code}`;
        // @ts-ignore
        return translations[nativeLanguage][key] || LANGUAGES.find(l => l.code === code)?.nativeName;
    };

    return (
        <div className={styles.container}>
            <motion.div
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                {/* Logo */}
                <h1 className={styles.logo}>Poly.</h1>

                {/* Progress */}
                <div className={styles.progress}>
                    {[1, 2, 3].map(s => (
                        <div
                            key={s}
                            className={`${styles.progressStep} ${s <= step ? styles.progressStepActive : ""}`}
                        />
                    ))}
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}
                        className={styles.stepContent}
                    >
                        {/* Step 1: Native Language */}
                        {step === 1 && (
                            <>
                                <h2 className={styles.title}>Select your language</h2>
                                <div className={styles.langList}>
                                    {NATIVE_LANGUAGES.map((lang) => (
                                        <button
                                            key={lang.code}
                                            className={`${styles.langBtn} ${nativeLanguage === lang.code ? styles.langBtnActive : ""}`}
                                            onClick={() => setNativeLanguage(lang.code as NativeLanguage)}
                                        >
                                            <span className={styles.langIcon}>{lang.icon}</span>
                                            <span className={styles.langName}>{lang.label}</span>
                                            {nativeLanguage === lang.code && <Check size={18} className={styles.checkIcon} />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Step 2: Learning Language */}
                        {step === 2 && (
                            <>
                                <h2 className={styles.title}>{getText("I want to learn...", "学びたい言語は...", "배우고 싶은 언어는...")}</h2>
                                <div className={styles.langGrid}>
                                    {LANGUAGES.filter(l => l.code !== nativeLanguage).map((lang) => (
                                        <button
                                            key={lang.code}
                                            className={`${styles.langGridBtn} ${learningLanguage === lang.code ? styles.langGridBtnActive : ""}`}
                                            onClick={() => setLearningLanguage(lang.code)}
                                        >
                                            <span className={styles.langGridIcon}>{FLAG_MAP[lang.code] || "🌐"}</span>
                                            <span className={styles.langGridName}>{getLangName(lang.code)}</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Step 3: Account Info */}
                        {step === 3 && (
                            <>
                                <h2 className={styles.title}>{getText("Create account", "アカウント作成", "계정 만들기")}</h2>
                                <div className={styles.form}>
                                    <div className={styles.inputWrap}>
                                        <User size={18} className={styles.inputIcon} />
                                        <input
                                            type="text"
                                            className={styles.input}
                                            placeholder={getText("Username (optional)", "ユーザー名（任意）", "사용자 이름 (선택)")}
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                        />
                                    </div>
                                    <select
                                        className={styles.select}
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        style={{ color: gender === "" ? "var(--color-fg-muted)" : "var(--color-fg)" }}
                                    >
                                        <option value="" disabled hidden>
                                            {getText("Select gender", "性別を選択", "성별 선택")}
                                        </option>
                                        {GENDERS.map(g => (
                                            <option key={g.value} value={g.value} style={{ color: "var(--color-fg)" }}>
                                                {getGenderLabel(g)}
                                            </option>
                                        ))}
                                    </select>
                                    <div className={styles.inputWrap}>
                                        <Mail size={18} className={styles.inputIcon} />
                                        <input
                                            type="email"
                                            className={styles.input}
                                            placeholder={getText("Email", "メールアドレス", "이메일")}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className={styles.inputWrap}>
                                        <Lock size={18} className={styles.inputIcon} />
                                        <input
                                            type="password"
                                            className={styles.input}
                                            placeholder={getText("Password (6+ chars)", "パスワード（6文字以上）", "비밀번호 (6자 이상)")}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className={styles.nav}>
                    {step > 1 && (
                        <button className={styles.backBtn} onClick={handleBack}>
                            <ChevronLeft size={20} />
                            {getText("Back", "戻る", "뒤로")}
                        </button>
                    )}
                    <button
                        className={styles.nextBtn}
                        onClick={handleNext}
                        disabled={!canProceed() || loading}
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                {step === 3
                                    ? getText("Sign Up", "登録", "가입")
                                    : getText("Next", "次へ", "다음")}
                                <ChevronRight size={20} />
                            </>
                        )}
                    </button>
                </div>

                {/* Footer */}
                <p className={styles.footer}>
                    {getText("Already have an account?", "アカウントをお持ちですか？", "이미 계정이 있으신가요?")}{" "}
                    <a href="/login">{getText("Log in", "ログイン", "로그인")}</a>
                </p>
            </motion.div>
        </div>
    );
}
