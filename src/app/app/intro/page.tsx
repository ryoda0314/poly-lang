"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, HelpCircle, Sparkles } from 'lucide-react';

const WORDS = [
    { id: 'jalan', word: 'jalan', meaning: '道', type: 'root' },
    { id: 'berjalan', word: 'berjalan', meaning: '歩く', root: 'jalan', prefix: 'ber-', type: 'derived' },
    { id: 'berkeringat', word: 'berkeringat', meaning: '汗をかく', root: 'keringat', prefix: 'ber-', type: 'derived' },
    { id: 'keringatan', word: 'keringatan', meaning: '汗びっしょり', root: 'keringat', suffix: '-an', type: 'derived' },
    { id: 'nafas', word: 'nafas', meaning: '息', type: 'root' },
    { id: 'duri', word: 'duri', meaning: 'とげ', type: 'root' },
];

export default function IntroPage() {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const selectedWord = WORDS.find(w => w.id === selectedId);

    return (
        <div style={{ padding: 'var(--space-6)', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '10px', background: 'var(--color-accent)', borderRadius: '12px', color: 'white' }}>
                    <Sparkles size={24} />
                </div>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, lineHeight: 1 }}>Morphology Demo</h1>
                    <p style={{ color: 'var(--color-fg-muted)', margin: '4px 0 0' }}>Explore the structure of Indonesian words</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {/* List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h3 style={{ color: 'var(--color-fg-muted)', marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vocabulary List</h3>
                    {WORDS.map(w => (
                        <button
                            key={w.id}
                            onClick={() => setSelectedId(w.id)}
                            style={{
                                display: 'flex', justifyContent: 'space-between', padding: '16px',
                                background: selectedId === w.id ? 'var(--color-bg-sub)' : 'var(--color-surface)',
                                border: selectedId === w.id ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                                borderRadius: '12px',
                                color: 'var(--color-fg)', cursor: 'pointer', textAlign: 'left',
                                transition: 'all 0.2s',
                                transform: selectedId === w.id ? 'translateX(4px)' : 'none'
                            }}
                        >
                            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{w.word}</span>
                            <span style={{ color: 'var(--color-fg-muted)' }}>{w.meaning}</span>
                        </button>
                    ))}
                </div>

                {/* Visualizer */}
                <div style={{ flex: 1 }}>
                    <h3 style={{ color: 'var(--color-fg-muted)', marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Analysis</h3>
                    <div style={{
                        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                        borderRadius: '24px', padding: '2rem', minHeight: '300px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        position: 'relative', overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute', inset: 0, opacity: 0.5,
                            background: 'radial-gradient(circle at 50% 50%, var(--color-bg-sub) 0%, transparent 70%)',
                            pointerEvents: 'none'
                        }} />

                        <AnimatePresence mode='wait'>
                            {selectedWord ? (
                                <MorphVisualizer key={selectedWord.id} word={selectedWord} />
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    style={{ textAlign: 'center', color: 'var(--color-fg-muted)' }}
                                >
                                    <HelpCircle size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                                    <p>Select a word to see its structure</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Quiz Section */}
            <div style={{ marginTop: '4rem' }}>
                <QuizController />
            </div>
        </div>
    );
}

function MorphVisualizer({ word }: { word: any }) {
    const root = WORDS.find(w => w.word === word.root);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', zIndex: 1, width: '100%' }}
        >
            {/* Main Word Decomposed */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '2.5rem', fontWeight: 800 }}>
                {word.prefix && (
                    <motion.span
                        initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                        style={{ color: '#ec4899' }}
                    >
                        {word.prefix}
                    </motion.span>
                )}
                <span style={{ color: 'var(--color-fg)' }}>
                    {word.root || word.word}
                </span>
                {word.suffix && (
                    <motion.span
                        initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                        style={{ color: '#8b5cf6' }}
                    >
                        {word.suffix}
                    </motion.span>
                )}
            </div>

            <div style={{ fontSize: '1.2rem', color: 'var(--color-fg-muted)' }}>
                {word.meaning}
            </div>

            {/* Connection Line & Root */}
            {word.type === 'derived' && root && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    style={{ marginTop: '1rem', padding: '1rem 2rem', background: 'var(--color-bg-sub)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px dashed var(--color-border)' }}
                >
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-fg-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Derived from Root</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{root.word}</div>
                    <div style={{ fontSize: '1rem' }}>{root.meaning}</div>
                </motion.div>
            )}

            {/* Explanation */}
            {word.prefix === 'ber-' && (
                <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#ec4899', background: 'rgba(236, 72, 153, 0.1)', padding: '8px 16px', borderRadius: '20px' }}>
                    Prefix <b>ber-</b> often indicates "to have" or "to do"
                </div>
            )}
        </motion.div>
    );
}

function QuizController() {
    const [step, setStep] = useState(0);
    const [completed, setCompleted] = useState(false);

    const checkAnswer = (correct: boolean) => {
        if (correct) {
            if (step < 2) {
                setTimeout(() => setStep(s => s + 1), 1000);
            } else {
                setCompleted(true);
            }
        } else {
            alert('Try again!');
        }
    };

    if (completed) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--color-success-bg)', borderRadius: '24px', color: 'var(--color-success-fg)' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎉 Excellent!</h2>
                <p>You have mastered the basics of Indonesian morphology.</p>
                <button onClick={() => { setStep(0); setCompleted(false); }} style={{ marginTop: '1rem', padding: '10px 20px', background: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, color: 'var(--color-success-fg)' }}>Start Again</button>
            </div>
        );
    }

    return (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '24px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0 }}>Practice Quiz</h2>
                <span style={{ color: 'var(--color-fg-muted)' }}>Step {step + 1} / 3</span>
            </div>

            <AnimatePresence mode='wait'>
                {step === 0 && (
                    <QuizStep
                        key="q1"
                        question="What is likely the meaning of 'keringat'?"
                        hint="(derived from berkeringat / keringatan)"
                        options={[
                            { label: "Water", correct: false },
                            { label: "Sweat (汗)", correct: true },
                            { label: "Hot", correct: false }
                        ]}
                        onAnswer={checkAnswer}
                    />
                )}
                {step === 1 && (
                    <QuizStep
                        key="q2"
                        question="How do you say 'To Breathe' (Breath: nafas)?"
                        hint="Use the prefix for 'doing' / 'having'"
                        options={[
                            { label: "bernafas", correct: true },
                            { label: "menafas", correct: false },
                            { label: "nafasan", correct: false }
                        ]}
                        onAnswer={checkAnswer}
                    />
                )}
                {step === 2 && (
                    <QuizStep
                        key="q3"
                        question="How do you say 'Thorny / Has thorns' (Thorn: duri)?"
                        hint="Same pattern as berjalan"
                        options={[
                            { label: "durian", correct: false },
                            { label: "berduri", correct: true },
                            { label: "duri-duri", correct: false }
                        ]}
                        onAnswer={checkAnswer}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function QuizStep({ question, hint, options, onAnswer }: { question: string, hint: string, options: any[], onAnswer: (c: boolean) => void }) {
    const [selected, setSelected] = useState<number | null>(null);

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{question}</h3>
            <p style={{ color: 'var(--color-fg-muted)', marginBottom: '2rem' }}>{hint}</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {options.map((opt, i) => (
                    <button
                        key={i}
                        onClick={() => {
                            setSelected(i);
                            onAnswer(opt.correct);
                        }}
                        style={{
                            padding: '1.5rem',
                            fontSize: '1.2rem',
                            fontWeight: 600,
                            background: selected === i
                                ? (opt.correct ? 'var(--color-success-bg)' : '#fee2e2')
                                : 'var(--color-bg-alt)',
                            color: selected === i
                                ? (opt.correct ? 'var(--color-success-fg)' : '#b91c1c')
                                : 'var(--color-fg)',
                            border: '2px solid transparent',
                            borderColor: selected === i ? 'currentColor' : 'transparent',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            textAlign: 'center'
                        }}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </motion.div>
    );
}
