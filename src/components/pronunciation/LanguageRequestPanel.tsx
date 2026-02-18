"use client";

import { useEffect, useState } from "react";
import { Mic, Send, CheckCircle } from "lucide-react";
import { useAppStore } from "@/store/app-context";
import styles from "./LanguageRequestPanel.module.css";

export function LanguageRequestPanel() {
    const { activeLanguageCode, activeLanguage } = useAppStore();
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

                <h1 className={styles.title}>発音練習</h1>
                <p className={styles.subtitle}>
                    <span className={styles.langBadge}>{langName}</span>
                    の発音練習は現在未対応です
                </p>
                <p className={styles.desc}>
                    現在、英語のみ発音評価に対応しています。<br />
                    対応希望の言語をリクエストすることができます。
                </p>

                {submitted ? (
                    <div className={styles.successCard}>
                        <CheckCircle size={20} className={styles.successIcon} />
                        <div>
                            <p className={styles.successTitle}>リクエストを送信しました</p>
                            <p className={styles.successDesc}>
                                {langName} の発音練習への対応をご希望いただきました。<br />
                                今後の開発の参考にさせていただきます。
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className={styles.formCard}>
                        <p className={styles.formLabel}>メッセージ（任意）</p>
                        <textarea
                            className={styles.textarea}
                            placeholder="どんな機能を求めているか、どう使いたいかなど自由にお書きください"
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
                            {loading ? "送信中..." : `${langName} の対応をリクエスト`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}