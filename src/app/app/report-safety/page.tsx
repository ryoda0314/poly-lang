"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Send, CheckCircle } from "lucide-react";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import styles from "./page.module.css";

export default function ReportSafetyPage() {
    const { nativeLanguage, user } = useAppStore();
    const t = translations[nativeLanguage] as any;

    const [issueType, setIssueType] = useState("inappropriate");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) return;

        setIsSubmitting(true);

        try {
            const res = await fetch("/api/support", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "safety",
                    category: issueType,
                    message: description,
                }),
            });

            if (!res.ok) {
                throw new Error("送信に失敗しました");
            }

            setIsSubmitted(true);
        } catch (error) {
            console.error("Failed to submit:", error);
            alert(t.submitError || "送信に失敗しました。もう一度お試しください。");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <Link href="/app/settings" className={styles.backButton}>
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className={styles.title}>{t.reportSafety || "安全性の問題を報告"}</h1>
                </header>

                <div className={styles.successContainer}>
                    <div className={styles.successIcon}>
                        <CheckCircle size={48} />
                    </div>
                    <h2 className={styles.successTitle}>
                        {t.reportSuccessTitle || "報告を受け付けました"}
                    </h2>
                    <p className={styles.successMessage}>
                        {t.reportSuccessMessage || "ご報告ありがとうございます。内容を確認し、適切に対応いたします。"}
                    </p>
                    <Link href="/app/settings" className={styles.backLink}>
                        {t.backToSettings || "設定に戻る"}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/app/settings" className={styles.backButton}>
                    <ArrowLeft size={20} />
                </Link>
                <h1 className={styles.title}>{t.reportSafety || "安全性の問題を報告"}</h1>
            </header>

            <div className={styles.content}>
                <div className={styles.warningBox}>
                    <AlertTriangle size={20} />
                    <p>
                        {t.reportWarning || "このフォームは、不適切なコンテンツやAI出力の問題を報告するためのものです。"}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label className={styles.label}>
                            {t.issueType || "問題の種類"}
                        </label>
                        <select
                            value={issueType}
                            onChange={(e) => setIssueType(e.target.value)}
                            className={styles.select}
                        >
                            <option value="inappropriate">{t.issueInappropriate || "不適切なAI出力"}</option>
                            <option value="harmful">{t.issueHarmful || "有害なコンテンツ"}</option>
                            <option value="incorrect">{t.issueIncorrect || "著しく不正確な情報"}</option>
                            <option value="privacy">{t.issuePrivacy || "プライバシーの懸念"}</option>
                            <option value="other">{t.issueOther || "その他の安全性の問題"}</option>
                        </select>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>
                            {t.issueDescription || "問題の詳細"}
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className={styles.textarea}
                            placeholder={t.issuePlaceholder || "どのような問題が発生したか、できるだけ具体的に記述してください..."}
                            rows={6}
                            maxLength={2000}
                        />
                        <div className={styles.charCount}>
                            {description.length} / 2000
                        </div>
                    </div>

                    <div className={styles.infoBox}>
                        <h3>{t.reportInfoTitle || "報告について"}</h3>
                        <ul>
                            <li>{t.reportInfo1 || "報告内容は運営チームが確認します"}</li>
                            <li>{t.reportInfo2 || "必要に応じてAIの改善に活用されます"}</li>
                            <li>{t.reportInfo3 || "個別の返信は行わない場合があります"}</li>
                        </ul>
                    </div>

                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={!description.trim() || isSubmitting}
                    >
                        {isSubmitting ? (
                            <span>{t.sending || "送信中..."}</span>
                        ) : (
                            <>
                                <Send size={18} />
                                <span>{t.submitReport || "報告を送信"}</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
