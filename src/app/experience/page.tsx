"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Brain, Mic, Layers, Globe, Minus, Plus } from "lucide-react";
import Link from "next/link";
import s from "./page.module.css";
import { NativeLanguage } from "@/lib/translations";
import { detectBrowserLanguage } from "@/lib/detect-browser-language";

const customEase = [0.16, 1, 0.3, 1] as const; // Professional easing curve (OutExpo-like)

const NATIVE_DATA: Record<NativeLanguage, {
    grammarTerms: string[];
    rejection: string[];
    subRejection: string;
    babyWord: string;
    babySub: string;
    patternPhrases: { text: string; highlight: string; meaning: string }[];
    patternTitle: string;
    aiCorrection: { original: string; fix: string; expl: string };
    ctaTitle: string;
    ctaSub: string;
}> = {
    ja: {
        grammarTerms: ["S+V+O", "Present Perfect", "Relative Pronoun", "Infinitive", "Passive Voice", "Subjunctive Mood", "Participle", "Modal Verbs", "Transitive", "Noun Clause"],
        rejection: ["Stop learning", "language for the", "sake of grammar."],
        subRejection: "私たちは文法のルールで言葉を学んだのではありません。",
        babyWord: "ママ、まんま！",
        babySub: "あなたの最初の言葉に、文法書は必要ありませんでした。",
        patternPhrases: [
            { text: "I want to eat", highlight: "want to", meaning: "食べたい" },
            { text: "I want to go", highlight: "want to", meaning: "行きたい" },
            { text: "I want to play", highlight: "want to", meaning: "遊びたい" }
        ],
        patternTitle: "パターンと文脈。それが脳の本来の仕組みです。",
        aiCorrection: { original: "I goes to school.", fix: "I go to school.", expl: "The 1st person 'I' does not take the singular 's'." },
        ctaTitle: "The Native Way",
        ctaSub: "9言語対応・AIネイティブの次世代語学プラットフォーム"
    },
    en: {
        grammarTerms: ["S+V+O", "Present Perfect", "Relative Pronoun", "Infinitive", "Passive Voice", "Subjunctive", "Participle", "Modal Verbs", "Transitive", "Noun Clause"],
        rejection: ["Stop learning", "language for the", "sake of grammar."],
        subRejection: "We didn't learn to speak through rules and textbooks.",
        babyWord: "Mama, milk!",
        babySub: "When you spoke your first words, you didn't need a grammar book.",
        patternPhrases: [
            { text: "Je veux manger", highlight: "veux", meaning: "want to eat" },
            { text: "Je veux partir", highlight: "veux", meaning: "want to leave" },
            { text: "Je veux jouer", highlight: "veux", meaning: "want to play" }
        ],
        patternTitle: "Patterns and context. That is how the brain natively learns.",
        aiCorrection: { original: "Je veux mange", fix: "Je veux manger", expl: "The second verb should be in the infinitive form." },
        ctaTitle: "The Native Way",
        ctaSub: "Next-generation, AI-native language platform supporting 9 languages."
    },
    // English fallbacks structure but mapped strictly to requested languages
    ko: { grammarTerms: ["S+V+O", "현재완료", "관계대명사", "부정사", "수동태", "가정법", "분사구문", "조동사", "타동사", "명사절"], rejection: ["Stop learning", "language for the", "sake of grammar."], subRejection: "우리는 문법 책으로 말을 배우지 않았습니다.", babyWord: "엄마, 맘마!", babySub: "당신이 처음 말을 했을 때 문법은 필요 없었습니다.", patternPhrases: [{ text: "I want to eat", highlight: "want to", meaning: "먹고 싶어" }, { text: "I want to go", highlight: "want to", meaning: "가고 싶어" }, { text: "I want to play", highlight: "want to", meaning: "놀고 싶어" }], patternTitle: "패턴과 문맥. 그것이 뇌의 자연스러운 학습법입니다.", aiCorrection: { original: "I goes to school", fix: "I go to school", expl: "1인칭에서는 goes를 쓰지 않아요" }, ctaTitle: "The Native Way", ctaSub: "9개 국어 지원, AI 네이티브 차세대 어학 플랫폼" },
    zh: { grammarTerms: ["S+V+O", "现在完成时", "定语从句", "不定式", "被动语态", "虚拟语气", "分词", "情态动词", "及物动词", "名词性从句"], rejection: ["Stop learning", "language for the", "sake of grammar."], subRejection: "我们不是通过规则和语法书学会说话的。", babyWord: "妈妈，饭饭！", babySub: "当你开口说第一句话时，你并不需要语法书。", patternPhrases: [{ text: "I want to eat", highlight: "want to", meaning: "想吃" }, { text: "I want to go", highlight: "want to", meaning: "想去" }, { text: "I want to play", highlight: "want to", meaning: "想玩" }], patternTitle: "模式与语境。这才是大脑天生的学习方式。", aiCorrection: { original: "I goes to school", fix: "I go to school", expl: "不需要加s" }, ctaTitle: "The Native Way", ctaSub: "支持9种语言的下一代AI原生语言平台" },
    fr: { grammarTerms: ["S+V+O", "Passé Composé", "Pronom relatif", "Infinitif", "Voix passive", "Subjonctif", "Participe", "Verbe modal", "Transitif", "Proposition nominale"], rejection: ["Stop learning", "language for the", "sake of grammar."], subRejection: "Nous n'avons pas appris à parler avec des règles et des manuels.", babyWord: "Maman, lait!", babySub: "Quand vous avez prononcé vos premiers mots, vous n'aviez pas besoin d'un livre de grammaire.", patternPhrases: [{ text: "I want to eat", highlight: "want to", meaning: "veux manger" }, { text: "I want to go", highlight: "want to", meaning: "veux partir" }, { text: "I want to play", highlight: "want to", meaning: "veux jouer" }], patternTitle: "Des modèles et du contexte. C'est ainsi que le cerveau apprend naturellement.", aiCorrection: { original: "I goes to school", fix: "I go to school", expl: "Pas de 's' à la 1ère personne" }, ctaTitle: "The Native Way", ctaSub: "Plateforme linguistique nouvelle génération native de l'IA prenant en charge 9 langues." },
    es: { grammarTerms: ["S+V+O", "Pretérito Perfecto", "Pronombre Relativo", "Infinitivo", "Voz Pasiva", "Subjuntivo", "Participio", "Verbos Modales", "Transitivo", "Oración Sustantiva"], rejection: ["Stop learning", "language for the", "sake of grammar."], subRejection: "No aprendimos a hablar a través de reglas y libros de texto.", babyWord: "¡Mamá, leche!", babySub: "Cuando dijiste tus primeras palabras, no necesitabas un libro de gramática.", patternPhrases: [{ text: "I want to eat", highlight: "want to", meaning: "quiero comer" }, { text: "I want to go", highlight: "want to", meaning: "quiero ir" }, { text: "I want to play", highlight: "want to", meaning: "quiero jugar" }], patternTitle: "Patrones y contexto. Así es como el cerebro aprende de forma natural.", aiCorrection: { original: "I goes to school", fix: "I go to school", expl: "No uses 's' en 1ª persona" }, ctaTitle: "The Native Way", ctaSub: "Plataforma de idiomas de próxima generación nativa de IA que admite 9 idiomas." },
    de: { grammarTerms: ["S+V+O", "Perfekt", "Relativpronomen", "Infinitiv", "Passiv", "Konjunktiv", "Partizip", "Modalverben", "Transitiv", "Substantivsatz"], rejection: ["Stop learning", "language for the", "sake of grammar."], subRejection: "Wir haben das Sprechen nicht durch Regeln und Lehrbücher gelernt.", babyWord: "Mama, Milch!", babySub: "Als du deine ersten Worte sprachst, brauchtest du kein Grammatikbuch.", patternPhrases: [{ text: "I want to eat", highlight: "want to", meaning: "will essen" }, { text: "I want to go", highlight: "want to", meaning: "will gehen" }, { text: "I want to play", highlight: "want to", meaning: "will spielen" }], patternTitle: "Muster und Kontext. So lernt das Gehirn auf natürliche Weise.", aiCorrection: { original: "I goes to school", fix: "I go to school", expl: "Kein 's' bei der 1. Person" }, ctaTitle: "The Native Way", ctaSub: "KI-native Sprachplattform der nächsten Generation mit Unterstützung für 9 Sprachen." },
    ru: { grammarTerms: ["S+V+O", "Настоящее совершенное", "Относительное местоимение", "Инфинитив", "Пассивный залог", "Сослагательное наклонение", "Причастие", "Модальные глаголы", "Переходный", "Именное придаточное"], rejection: ["Stop learning", "language for the", "sake of grammar."], subRejection: "Мы не учились говорить по правилам и учебникам.", babyWord: "Мама, молоко!", babySub: "Когда вы произнесли свои первые слова, вам не нужен был учебник грамматики.", patternPhrases: [{ text: "I want to eat", highlight: "want to", meaning: "хочу есть" }, { text: "I want to go", highlight: "want to", meaning: "хочу пойти" }, { text: "I want to play", highlight: "want to", meaning: "хочу играть" }], patternTitle: "Шаблоны и контекст. Так мозг учится естественным образом.", aiCorrection: { original: "I goes to school", fix: "I go to school", expl: "Без 's' в 1-м лице" }, ctaTitle: "The Native Way", ctaSub: "Языковая платформа нового поколения на базе ИИ с поддержкой 9 языков." },
    vi: { grammarTerms: ["S+V+O", "Hiện tại hoàn thành", "Đại từ quan hệ", "Động từ nguyên thể", "Thể bị động", "Thức giả định", "Phân từ", "Động từ khuyết thiếu", "Ngoại động từ", "Mệnh đề danh từ"], rejection: ["Stop learning", "language for the", "sake of grammar."], subRejection: "Chúng ta không học nói qua các quy tắc và sách giáo khoa.", babyWord: "Mẹ, sữa!", babySub: "Khi bạn nói những từ đầu tiên, bạn không cần một cuốn sách ngữ pháp.", patternPhrases: [{ text: "I want to eat", highlight: "want to", meaning: "muốn ăn" }, { text: "I want to go", highlight: "want to", meaning: "muốn đi" }, { text: "I want to play", highlight: "want to", meaning: "muốn chơi" }], patternTitle: "Mẫu câu và ngữ cảnh. Đó là cách não bộ học tập tự nhiên.", aiCorrection: { original: "I goes to school", fix: "I go to school", expl: "Không dùng 's' ở ngôi thứ nhất" }, ctaTitle: "The Native Way", ctaSub: "Nền tảng ngôn ngữ AI gốc thế hệ tiếp theo hỗ trợ 9 ngôn ngữ." },
    fi: { grammarTerms: ["S+V+O", "Perfekti", "Relatiivipronomini", "Infinitiivi", "Passiivi", "Subjunktiivi", "Partisiippi", "Modaaliverbit", "Transitiivinen", "Substantiivilauseke"], rejection: ["Stop learning", "language for the", "sake of grammar."], subRejection: "Emme oppineet puhumaan sääntöjen ja oppikirjojen avulla.", babyWord: "Äiti, maitoa!", babySub: "Kun sanoit ensimmäiset sanasi, et tarvinnut kielioppikirjaa.", patternPhrases: [{ text: "I want to eat", highlight: "want to", meaning: "haluan syödä" }, { text: "I want to go", highlight: "want to", meaning: "haluan mennä" }, { text: "I want to play", highlight: "want to", meaning: "haluan leikkiä" }], patternTitle: "Mallit ja konteksti. Niin aivot oppivat luonnostaan.", aiCorrection: { original: "I goes to school", fix: "I go to school", expl: "Ei 's' päätteitä 1. persoonassa" }, ctaTitle: "The Native Way", ctaSub: "Seuraavan sukupolven tekoäly-natiivi kielialusta, joka tukee 9 kieltä." },
};

const SCENES = [
    "intro",
    "grammar",
    "rejection",
    "infant",
    "pattern",
    "ai_showcase",
    "cta"
];

export default function ExperiencePage() {
    const [lang, setLang] = useState<NativeLanguage>("en");
    const [sceneIdx, setSceneIdx] = useState(0);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setLang(detectBrowserLanguage());
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;
        const timings = [
            3500,   // intro
            5000,   // grammar
            4000,   // rejection
            4500,   // infant
            5000,   // pattern
            5500,   // ai
            Infinity// cta
        ];

        if (timings[sceneIdx] !== Infinity) {
            const t = setTimeout(() => {
                setSceneIdx(i => Math.min(i + 1, SCENES.length - 1));
            }, timings[sceneIdx]);
            return () => clearTimeout(t);
        }
    }, [sceneIdx, isClient]);

    const handleSkip = () => {
        setSceneIdx(SCENES.length - 1);
    };

    if (!isClient) return null;

    const currentScene = SCENES[sceneIdx];
    const data = NATIVE_DATA[lang] || NATIVE_DATA.en;

    // Repeat grammar terms slightly to fill a background
    const expandedGrammar = [...data.grammarTerms, ...data.grammarTerms, ...data.grammarTerms, ...data.grammarTerms, ...data.grammarTerms];

    return (
        <div className={s.container}>
            <div className={s.grain} />

            {sceneIdx < SCENES.length - 1 && (
                <button onClick={handleSkip} className={s.skipBtn}>
                    Skip
                </button>
            )}

            {/* Extreme subtle progress track */}
            <div className={s.progressTrack}>
                <motion.div
                    className={s.progressFill}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: sceneIdx / (SCENES.length - 1) }}
                    transition={{ duration: 1, ease: customEase }}
                />
            </div>

            <AnimatePresence mode="wait">

                {/* SCENE 0: INTRO - Minimalist Scale */}
                {currentScene === "intro" && (
                    <motion.div
                        key="intro"
                        className={s.scene}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: customEase }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, letterSpacing: "0.1em" }}
                            animate={{ scale: 1, letterSpacing: "0.25em" }}
                            transition={{ duration: 4, ease: "easeOut" }}
                            className={s.brandText}
                        >
                            PolyLinga
                        </motion.div>
                    </motion.div>
                )}

                {/* SCENE 1: GRAMMAR - Structured Overload */}
                {currentScene === "grammar" && (
                    <motion.div
                        key="grammar"
                        className={s.scene}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className={s.grammarGrid}>
                            {expandedGrammar.map((term, i) => (
                                <motion.div
                                    key={i}
                                    className={s.grammarItem}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{
                                        duration: 0.8,
                                        delay: Math.random() * 1.5,
                                    }}
                                >
                                    {term}
                                </motion.div>
                            ))}
                        </div>
                        <motion.div
                            className={s.grammarCenterLabel}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 2, duration: 1, ease: customEase }}
                        >
                            SYSTEM OVERLOAD
                        </motion.div>
                    </motion.div>
                )}

                {/* SCENE 2: REJECTION - Clean typography reveal */}
                {currentScene === "rejection" && (
                    <motion.div
                        key="rejection"
                        className={s.scene}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className={s.rejectionWrap}>
                            <h2 className={s.rejectionTitle}>
                                {data.rejection.map((line, i) => (
                                    <span className={s.rejectionLineWrap} key={i}>
                                        <motion.span
                                            className={s.rejectionLine}
                                            initial={{ y: "100%" }}
                                            animate={{ y: "0%" }}
                                            transition={{ delay: i * 0.2, duration: 0.8, ease: customEase }}
                                        >
                                            {line}
                                        </motion.span>
                                    </span>
                                ))}
                            </h2>
                            <motion.p
                                className={s.rejectionSub}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1, duration: 0.8, ease: customEase }}
                            >
                                {data.subRejection}
                            </motion.p>
                        </div>
                    </motion.div>
                )}

                {/* SCENE 3: THE INFANT / NATIVE WAY - Soundwave/Pulse Minimal */}
                {currentScene === "infant" && (
                    <motion.div
                        key="infant"
                        className={s.scene}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className={s.infantWrap}>
                            <div className={s.waveContainer}>
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <motion.div
                                        key={i}
                                        className={s.waveBar}
                                        animate={{ height: ["10px", "50px", "10px"] }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 0.8 + (Math.random() * 0.4),
                                            delay: i * 0.1,
                                            ease: "easeInOut"
                                        }}
                                    />
                                ))}
                            </div>
                            <motion.h3
                                className={s.infantFocusWord}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.8, ease: customEase }}
                            >
                                {data.babyWord}
                            </motion.h3>
                            <motion.p
                                className={s.infantSub}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1, duration: 1, ease: customEase }}
                            >
                                {data.babySub}
                            </motion.p>
                        </div>
                    </motion.div>
                )}

                {/* SCENE 4: PATTERN DISCOVERY - Structured list */}
                {currentScene === "pattern" && (
                    <motion.div
                        key="pattern"
                        className={s.scene}
                        initial={{ opacity: 0, filter: "blur(10px)" }}
                        animate={{ opacity: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, filter: "blur(10px)" }}
                        transition={{ duration: 0.8, ease: customEase }}
                    >
                        <div className={s.patternBox}>
                            <h3 className={s.patternTitle}>{data.patternTitle}</h3>
                            <div className={s.patternPhrases}>
                                {data.patternPhrases.map((ph, i) => (
                                    <motion.div
                                        key={i}
                                        className={s.patternRow}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 + (i * 0.15), duration: 0.8, ease: customEase }}
                                    >
                                        <div className={s.patternText}>
                                            {ph.text.split(ph.highlight).map((part, idx, arr) => (
                                                <span key={idx}>
                                                    <span className={s.patternMuted}>{part}</span>
                                                    {idx < arr.length - 1 && <span className={s.patternHighlight}>{ph.highlight}</span>}
                                                </span>
                                            ))}
                                        </div>
                                        <ArrowRight className={s.patternArrow} size={16} />
                                        <div className={s.patternMeaning}>{ph.meaning}</div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* SCENE 5: AI DEMO - Linear-style Diff */}
                {currentScene === "ai_showcase" && (
                    <motion.div
                        key="ai"
                        className={s.scene}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: customEase }}
                    >
                        <div className={s.aiCard}>
                            <div className={s.aiHeader}>
                                Processing Correction
                            </div>
                            <div className={s.aiContent}>
                                <div className={s.aiCorrectionBlock}>
                                    <motion.div
                                        className={s.diffLine}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5, duration: 0.6, ease: customEase }}
                                    >
                                        <Minus size={14} className={s.diffMinus} />
                                        <span className={s.diffMinusText}>{data.aiCorrection.original}</span>
                                    </motion.div>
                                    <motion.div
                                        className={s.diffLine}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 1.2, duration: 0.6, ease: customEase }}
                                    >
                                        <Plus size={14} className={s.diffPlus} />
                                        <span>{data.aiCorrection.fix}</span>
                                    </motion.div>
                                </div>
                                <motion.div
                                    className={s.aiTooltip}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    transition={{ delay: 2, duration: 0.6, ease: customEase }}
                                >
                                    {data.aiCorrection.expl}
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* SCENE 6: CTA / LANDING - Extreme Minimal */}
                {currentScene === "cta" && (
                    <motion.div
                        key="cta"
                        className={s.scene}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.5, ease: customEase }}
                    >
                        <div className={s.ctaContent}>
                            <motion.h1
                                className={s.ctaTitle}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 1, ease: customEase }}
                            >
                                {data.ctaTitle}
                            </motion.h1>
                            <motion.p
                                className={s.ctaSub}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.8, ease: customEase }}
                            >
                                {data.ctaSub}
                            </motion.p>

                            <motion.div
                                className={s.ctaFeatures}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8, duration: 1 }}
                            >
                                <div className={s.ctaFeature}><Globe className={s.fIcon} /> 9 Languages</div>
                                <div className={s.ctaFeature}><Mic className={s.fIcon} /> Speech Eval</div>
                                <div className={s.ctaFeature}><Brain className={s.fIcon} /> SRS Memory</div>
                                <div className={s.ctaFeature}><Layers className={s.fIcon} /> Tokenizer</div>
                            </motion.div>

                            <Link href="/app/dashboard" passHref>
                                <motion.button
                                    className={s.ctaButton}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1, duration: 0.8, ease: customEase }}
                                >
                                    Start Your Journey <ArrowRight size={16} />
                                </motion.button>
                            </Link>
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}
