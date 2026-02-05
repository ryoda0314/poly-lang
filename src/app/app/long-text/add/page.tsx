"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/store/app-context";
import { createLongText } from "@/actions/long-text";
import type { DifficultyLevel } from "@/types/long-text";
import styles from "./page.module.css";

export default function AddLongTextPage() {
    const router = useRouter();
    const { activeLanguageCode } = useAppStore();

    const [title, setTitle] = useState("");
    const [titleTranslation, setTitleTranslation] = useState("");
    const [fullText, setFullText] = useState("");
    const [difficulty, setDifficulty] = useState<DifficultyLevel | "">("");
    const [category, setCategory] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!title.trim()) {
            setError("タイトルを入力してください");
            return;
        }
        if (!fullText.trim()) {
            setError("本文を入力してください");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await createLongText(
                title.trim(),
                fullText.trim(),
                activeLanguageCode || "en",
                {
                    titleTranslation: titleTranslation.trim() || undefined,
                    difficultyLevel: difficulty || undefined,
                    category: category.trim() || undefined,
                }
            );

            if (result.success && result.textId) {
                router.push(`/app/long-text/${result.textId}`);
            } else {
                setError(result.error || "作成に失敗しました");
            }
        } catch (err) {
            console.error(err);
            setError("エラーが発生しました");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Preview sentence count
    const previewSentences = fullText.trim()
        ? fullText.split(/[。！？.!?\n]+/).filter(s => s.trim()).length
        : 0;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link href="/app/long-text" className={styles.backBtn}>
                    <ArrowLeft size={20} />
                </Link>
                <h1 className={styles.title}>長文を追加</h1>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                {error && (
                    <div className={styles.error}>{error}</div>
                )}

                <div className={styles.field}>
                    <label className={styles.label}>タイトル *</label>
                    <input
                        type="text"
                        className={styles.input}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="例: 星の王子さま 第1章"
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>タイトル (翻訳)</label>
                    <input
                        type="text"
                        className={styles.input}
                        value={titleTranslation}
                        onChange={(e) => setTitleTranslation(e.target.value)}
                        placeholder="例: Le Petit Prince - Chapitre 1"
                    />
                </div>

                <div className={styles.row}>
                    <div className={styles.field}>
                        <label className={styles.label}>難易度</label>
                        <select
                            className={styles.select}
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value as DifficultyLevel | "")}
                        >
                            <option value="">選択なし</option>
                            <option value="beginner">初級</option>
                            <option value="intermediate">中級</option>
                            <option value="advanced">上級</option>
                        </select>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>カテゴリ</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="例: 文学、ニュース"
                        />
                    </div>
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>
                        本文 *
                        {previewSentences > 0 && (
                            <span className={styles.sentenceCount}>
                                約 {previewSentences} 文
                            </span>
                        )}
                    </label>
                    <textarea
                        className={styles.textarea}
                        value={fullText}
                        onChange={(e) => setFullText(e.target.value)}
                        placeholder="長文をここに貼り付けてください。&#10;&#10;ピリオドや句点で自動的に文に分割されます。"
                        rows={12}
                    />
                </div>

                <div className={styles.hint}>
                    <FileText size={16} />
                    <span>句点（。）やピリオド（.）で自動的に文に分割されます</span>
                </div>

                <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 size={18} className={styles.spinner} />
                            作成中...
                        </>
                    ) : (
                        "長文を作成"
                    )}
                </button>
            </form>
        </div>
    );
}
