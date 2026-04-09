"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, CheckCircle } from "lucide-react";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import styles from "./page.module.css";

export default function ContactPage() {
    const { nativeLanguage, user } = useAppStore();
    const t = translations[nativeLanguage] as any;

    const [category, setCategory] = useState("general");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSubmitting(true);

        try {
            const res = await fetch("/api/support", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "contact",
                    category,
                    message,
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
                    <h1 className={styles.title}>{t.contactSupport || "サポートへ連絡"}</h1>
                </header>

                <div className={styles.successContainer}>
                    <div className={styles.successIcon}>
                        <CheckCircle size={48} />
                    </div>
                    <h2 className={styles.successTitle}>
                        {t.contactSuccessTitle || "送信完了"}
                    </h2>
                    <p className={styles.successMessage}>
                        {t.contactSuccessMessage || "お問い合わせありがとうございます。内容を確認し、必要に応じてご連絡いたします。"}
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
                <h1 className={styles.title}>{t.contactSupport || "サポートへ連絡"}</h1>
            </header>

            <div className={styles.content}>
                <p className={styles.description}>
                    {t.contactDescription || "ご質問、ご要望、不具合の報告などお気軽にお問い合わせください。"}
                </p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label className={styles.label}>
                            {t.contactCategory || "カテゴリ"}
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className={styles.select}
                        >
                            <option value="general">{t.categoryGeneral || "一般的な質問"}</option>
                            <option value="bug">{t.categoryBug || "不具合の報告"}</option>
                            <option value="feature">{t.categoryFeature || "機能のリクエスト"}</option>
                            <option value="account">{t.categoryAccount || "アカウントについて"}</option>
                            <option value="payment">{t.categoryPayment || "支払いについて"}</option>
                            <option value="other">{t.categoryOther || "その他"}</option>
                        </select>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>
                            {t.contactMessage || "メッセージ"}
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className={styles.textarea}
                            placeholder={t.contactPlaceholder || "お問い合わせ内容を入力してください..."}
                            rows={6}
                            maxLength={2000}
                        />
                        <div className={styles.charCount}>
                            {message.length} / 2000
                        </div>
                    </div>

                    <div className={styles.infoBox}>
                        <p>
                            {t.contactInfo || "※ ご登録のメールアドレス宛に返信する場合があります。"}
                        </p>
                        {user?.email && (
                            <p className={styles.email}>
                                {t.registeredEmail || "登録メール"}: {user.email}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={!message.trim() || isSubmitting}
                    >
                        {isSubmitting ? (
                            <span>{t.sending || "送信中..."}</span>
                        ) : (
                            <>
                                <Send size={18} />
                                <span>{t.send || "送信"}</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
