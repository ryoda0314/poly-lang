"use client";

import React, { useState } from "react";
import { lookupKanjiHanja } from "@/actions/kanji-hanja";
import { usePhraseSetStore } from "@/store/phrase-sets-store";
import { containsKanji } from "@/lib/furigana";
import { Loader2, X, AlertCircle } from "lucide-react";
import styles from "./AddKanjiModal.module.css";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";

interface Props {
    setId: string;
    onClose: () => void;
    initialKanji?: string;
}

export function AddKanjiModal({ setId, onClose, initialKanji }: Props) {
    const { nativeLanguage } = useAppStore();
    const t = translations[nativeLanguage] as Record<string, string>;
    const [kanji, setKanji] = useState(initialKanji || '');
    const [wordType, setWordType] = useState<'character' | 'compound'>('compound');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { addPhrases } = usePhraseSetStore();

    const handleAdd = async () => {
        setError(null);

        if (!kanji.trim()) {
            setError(t.kanjiInputRequired);
            return;
        }

        if (!containsKanji(kanji)) {
            setError(t.kanjiNoKanji);
            return;
        }

        setIsLoading(true);
        try {
            const mapping = await lookupKanjiHanja(kanji, wordType);

            if (!mapping) {
                setError(t.kanjiFetchFailed);
                return;
            }

            // Add to phrase set
            await addPhrases(setId, [{
                target_text: mapping.kanji,
                translation: mapping.koreanReading,
                tokens: [],
                // Extended kanji-hanja fields
                kanji_text: mapping.kanji,
                hanja_text: mapping.hanja,
                korean_reading: mapping.koreanReading,
                hanja_meaning: mapping.hanjaMeaning,
                word_type: wordType
            }]);

            onClose();
        } catch (err: any) {
            console.error('Failed to add kanji:', err);
            setError(err.message || t.kanjiAddFailed);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isLoading) {
            handleAdd();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>{t.kanjiAddTitle}</h2>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="kanji-input">{t.kanjiInputLabel}</label>
                        <input
                            id="kanji-input"
                            type="text"
                            value={kanji}
                            onChange={(e) => setKanji(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t.kanjiInputPlaceholder}
                            className={styles.input}
                            autoFocus
                            disabled={isLoading}
                        />
                    </div>

                    <div className={styles.typeSelector}>
                        <label className={styles.radioLabel}>
                            <input
                                type="radio"
                                checked={wordType === 'character'}
                                onChange={() => setWordType('character')}
                                disabled={isLoading}
                            />
                            <span>{t.kanjiSingleChar}</span>
                        </label>
                        <label className={styles.radioLabel}>
                            <input
                                type="radio"
                                checked={wordType === 'compound'}
                                onChange={() => setWordType('compound')}
                                disabled={isLoading}
                            />
                            <span>{t.kanjiCompound}</span>
                        </label>
                    </div>

                    {error && (
                        <div className={styles.error}>
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    <button
                        onClick={onClose}
                        className={styles.cancelBtn}
                        disabled={isLoading}
                    >
                        {t.cancel}
                    </button>
                    <button
                        onClick={handleAdd}
                        className={styles.addBtn}
                        disabled={isLoading || !kanji.trim()}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className={styles.spinner} size={16} />
                                {t.kanjiAdding}
                            </>
                        ) : (
                            t.kanjiAdd
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
