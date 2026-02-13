"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/app-context";
import { usePhraseSetStore } from "@/store/phrase-sets-store";
import { useRouter } from "next/navigation";
import { Plus, BookOpen, ChevronRight } from "lucide-react";
import { CreateKanjiSetModal } from "@/components/CreateKanjiSetModal";
import { AddKanjiModal } from "@/components/AddKanjiModal";
import styles from "./page.module.css";

export default function KanjiHanjaPage() {
    const router = useRouter();
    const { user, activeLanguageCode, nativeLanguage } = useAppStore();
    const { phraseSets, fetchPhraseSets, createPhraseSet } = usePhraseSetStore();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddKanjiModal, setShowAddKanjiModal] = useState(false);
    const [selectedSetId, setSelectedSetId] = useState<string>('');

    useEffect(() => {
        if (user && activeLanguageCode === 'ko') {
            fetchPhraseSets(user.id, activeLanguageCode);
        }
    }, [user, activeLanguageCode]);

    // Filter for kanji-hanja sets only
    const kanjiSets = phraseSets.filter(set =>
        (set as any).set_type === 'kanji_hanja'
    );

    const handleCreateSet = async (name: string, description: string, color: string) => {
        if (!user) return;

        // Create phrase set with set_type: 'kanji_hanja'
        const newSet = await createPhraseSet(user.id, 'ko', name, {
            description,
            color,
            set_type: 'kanji_hanja'
        });

        if (newSet) {
            console.log('Created kanji-hanja set:', newSet.id);
        }
    };

    const handleOpenSet = (setId: string) => {
        setSelectedSetId(setId);
        setShowAddKanjiModal(true);
    };

    const handleStartReview = (setId: string) => {
        router.push(`/app/kanji-hanja/review/${setId}`);
    };

    if (activeLanguageCode !== 'ko' || nativeLanguage !== 'ja') {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <BookOpen size={48} />
                    <h2>漢字→한자 학습은 일본어 모어 화자 전용입니다</h2>
                    <p>この機能は日本語が母語で韓国語を学習している方向けです</p>
                    <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-2)' }}>
                        韓国語を学習言語として選択し、母語設定を日本語にしてください
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>漢字で韓国語を学ぶ</h1>
                    <p className={styles.subtitle}>
                        知っている漢字から韓国語の漢字語（한자어）を効率的に習得
                    </p>
                </div>
                <button onClick={() => setShowCreateModal(true)} className={styles.createBtn}>
                    <Plus size={20} />
                    新しいセットを作成
                </button>
            </header>

            {kanjiSets.length === 0 ? (
                <div className={styles.emptyState}>
                    <BookOpen size={48} />
                    <h2>まだ学習セットがありません</h2>
                    <p>漢字セットを作成して、韓国語の語彙学習を始めましょう</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className={styles.emptyCreateBtn}
                    >
                        <Plus size={20} />
                        最初のセットを作成
                    </button>
                </div>
            ) : (
                <div className={styles.setsGrid}>
                    {kanjiSets.map(set => (
                        <div key={set.id} className={styles.setCard}>
                            <div
                                className={styles.setIcon}
                                style={{
                                    backgroundColor: (set as any).color || '#3b82f6'
                                }}
                            >
                                <BookOpen size={24} />
                            </div>
                            <div className={styles.setInfo}>
                                <h3 className={styles.setName}>{set.name}</h3>
                                {(set as any).description && (
                                    <p className={styles.setDescription}>
                                        {(set as any).description}
                                    </p>
                                )}
                                <div className={styles.setStats}>
                                    <span>{set.phrase_count}個の漢字</span>
                                </div>
                            </div>
                            <div className={styles.setActions}>
                                <button
                                    onClick={() => handleOpenSet(set.id)}
                                    className={styles.addBtn}
                                >
                                    <Plus size={16} />
                                    漢字を追加
                                </button>
                                <button
                                    onClick={() => handleStartReview(set.id)}
                                    className={styles.reviewBtn}
                                >
                                    復習する
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showCreateModal && (
                <CreateKanjiSetModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreateSet}
                />
            )}

            {showAddKanjiModal && selectedSetId && (
                <AddKanjiModal
                    setId={selectedSetId}
                    onClose={() => {
                        setShowAddKanjiModal(false);
                        setSelectedSetId('');
                    }}
                />
            )}
        </div>
    );
}
