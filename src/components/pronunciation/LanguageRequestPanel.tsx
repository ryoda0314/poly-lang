"use client";

import { useEffect, useState } from "react";
import { Mic, Send, CheckCircle } from "lucide-react";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import styles from "./LanguageRequestPanel.module.css";

export function LanguageRequestPanel() {
    const { activeLanguageCode, activeLanguage, nativeLanguage } = useAppStore();
    const t = translations[nativeLanguage] as Record<string, string>;
    const [message, setMessage] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    const langName = activeLanguage?.nativeName ?? activeLanguage?.name ?? activeLanguageCode;

    useEffect(() => {
        fetch("/api/pronunciation/request-language")
            .then(r => r.json())
            .then(data => {
                if ((data.requestedCodes ?? []).includes(activeLanguageCode)) {
                    setSubmitted(true);
                }
            })
            .catch(() => {})
            .finally(() => setChecking(false));
    }, [activeLanguageCode]);

    async function handleSubmit() {
        if (loading) return;
        setLoading(true);
        try {
            const res = await fetch("/api/pronunciation/request-language", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    languageCode: activeLanguageCode,
                    languageName: activeLanguage?.name ?? activeLanguageCode,
                    message: message.trim() || null,
                }),
            });
            if (res.ok) setSubmitted(true);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }

    if (checking) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.dot} />
                    <div className={styles.dot} />
                    <div className={styles.dot} />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.inner}>
                <div className={styles.iconWrap}>
                    <Mic size={32} className={styles.icon} />
                </div>

                <h1 className={styles.title}>{t.pronHomeTitle}</h1>
                <p className={styles.subtitle}>
                    <span className={styles.langBadge}>{langName}</span>
                    {t.pronUnsupported}
                </p>
                <p className={styles.desc}>
                    {t.pronEnglishOnly}<br />
                    {t.pronCanRequest}
                </p>

                {submitted ? (
                    <div className={styles.successCard}>
                        <CheckCircle size={20} className={styles.successIcon} />
                        <div>
                            <p className={styles.successTitle}>{t.pronRequestSent}</p>
                            <p className={styles.successDesc}>
                                {langName} {t.pronRequestThanks}<br />
                                {t.pronRequestFuture}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className={styles.formCard}>
                        <p className={styles.formLabel}>{t.pronMessageLabel}</p>
                        <textarea
                            className={styles.textarea}
                            placeholder={t.pronMessagePlaceholder}
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            rows={3}
                            maxLength={500}
                        />
                        <button
                            className={styles.submitBtn}
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            <Send size={15} />
                            {loading ? t.pronSending : `${langName} ${t.pronRequestButton}`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}