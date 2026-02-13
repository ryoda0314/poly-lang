"use client";

import React, { useState } from "react";
import { lookupKanjiHanja } from "@/actions/kanji-hanja";
import { usePhraseSetStore } from "@/store/phrase-sets-store";
import { containsKanji } from "@/lib/furigana";
import { Loader2, X, AlertCircle } from "lucide-react";
import styles from "./AddKanjiModal.module.css";

interface Props {
    setId: string;
    onClose: () => void;
    initialKanji?: string;
}

export function AddKanjiModal({ setId, onClose, initialKanji }: Props) {
    const [kanji, setKanji] = useState(initialKanji || '');
    const [wordType, setWordType] = useState<'character' | 'compound'>('compound');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { addPhrases } = usePhraseSetStore();

    const handleAdd = async () => {
        setError(null);

        if (!kanji.trim()) {
            setError('漢字を入力してください');
            return;
        }

        if (!containsKanji(kanji)) {
            setError('漢字が含まれていません');
            return;
        }

        setIsLoading(true);
        try {
            const mapping = await lookupKanjiHanja(kanji, wordType);

            if (!mapping) {
                setError('漢字語の取得に失敗しました');
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
            setError(err.message || '追加に失敗しました');
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
                    <h2>漢字を追加</h2>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="kanji-input">漢字を入力</label>
                        <input
                            id="kanji-input"
                            type="text"
                            value={kanji}
                            onChange={(e) => setKanji(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="例: 電話、学校、友達"
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
                            <span>個別の漢字（一文字）</span>
                        </label>
                        <label className={styles.radioLabel}>
                            <input
                                type="radio"
                                checked={wordType === 'compound'}
                                onChange={() => setWordType('compound')}
                                disabled={isLoading}
                            />
                            <span>熟語（複数の漢字）</span>
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
                        キャンセル
                    </button>
                    <button
                        onClick={handleAdd}
                        className={styles.addBtn}
                        disabled={isLoading || !kanji.trim()}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className={styles.spinner} size={16} />
                                追加中...
                            </>
                        ) : (
                            '追加'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
