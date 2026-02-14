"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "./page.module.css";

// --- DATA ---

const SHORT_VOWELS = [
    { symbol: "ɪ", example: "sit", ipa: "/sɪt/", approx: "イ", tip: "日本語の「イ」より短く、口をあまり横に引かない。力を抜いた「イ」。" },
    { symbol: "ɛ", example: "bed", ipa: "/bɛd/", approx: "エ", tip: "日本語の「エ」とほぼ同じ。やや口を大きく開ける。" },
    { symbol: "æ", example: "cat", ipa: "/kæt/", approx: "アとエの中間", tip: "「エ」の口の形で「ア」と言う。日本語にない音。口を横に広げて下顎を下げる。", hard: true },
    { symbol: "ʌ", example: "cup", ipa: "/kʌp/", approx: "ア", tip: "日本語の「ア」に近いが、もっと短く鋭い。口はあまり開けない。" },
    { symbol: "ʊ", example: "book", ipa: "/bʊk/", approx: "ウ", tip: "日本語の「ウ」より唇を丸める。短くリラックスした音。" },
    { symbol: "ə", example: "about", ipa: "/əˈbaʊt/", approx: "弱いア", tip: "シュワー。英語で最も多い母音。力を完全に抜いた曖昧な「ア」。強勢のない音節に現れる。", hard: true },
    { symbol: "ɚ", example: "butter", ipa: "/ˈbʌtɚ/", approx: "弱いアー", tip: "シュワーに /r/ が加わった音。舌先を軽く巻く。-er, -or などの語尾に現れる。" },
];

const LONG_VOWELS = [
    { symbol: "iː", example: "see", ipa: "/siː/", approx: "イー", tip: "日本語の「イー」に近い。口を横に引いて長く伸ばす。" },
    { symbol: "ɑː", example: "father", ipa: "/ˈfɑːðɚ/", approx: "アー", tip: "口を大きく開けて奥で響かせる。日本語の「ア」より口の奥を広げる。", hard: true },
    { symbol: "ɔː", example: "law", ipa: "/lɔː/", approx: "オー", tip: "唇を丸くして「オー」。日本語の「オ」より唇を突き出す。" },
    { symbol: "uː", example: "food", ipa: "/fuːd/", approx: "ウー", tip: "唇を丸く突き出して長く伸ばす。日本語の「ウ」より唇を使う。" },
    { symbol: "ɜːr", example: "bird", ipa: "/bɜːrd/", approx: "アーr", tip: "口を半開きにして舌を巻きながら「アー」。日本語にない音。girl, world, nurse など。", hard: true },
];

const DIPHTHONGS = [
    { symbol: "eɪ", example: "say", ipa: "/seɪ/", approx: "エイ", tip: "「エ」から「イ」へ滑らかに移動。day, make, rain など。" },
    { symbol: "aɪ", example: "my", ipa: "/maɪ/", approx: "アイ", tip: "「ア」から「イ」へ。time, like, buy など。" },
    { symbol: "ɔɪ", example: "boy", ipa: "/bɔɪ/", approx: "オイ", tip: "「オ」から「イ」へ。toy, coin, noise など。" },
    { symbol: "oʊ", example: "go", ipa: "/ɡoʊ/", approx: "オウ", tip: "「オ」から唇を丸めて「ウ」へ。home, know, boat など。日本語話者は「オー」にしがち。", hard: true },
    { symbol: "aʊ", example: "now", ipa: "/naʊ/", approx: "アウ", tip: "「ア」から「ウ」へ。how, about, house など。" },
];

const STOP_CONSONANTS = [
    { symbol: "p", example: "pen", ipa: "/pɛn/", approx: "プ", tip: "唇を閉じて息を一気に出す。語頭では強い息（帯気音）。", voiced: false },
    { symbol: "b", example: "bed", ipa: "/bɛd/", approx: "ブ", tip: "/p/ の有声音。声帯を振動させる。", voiced: true },
    { symbol: "t", example: "ten", ipa: "/tɛn/", approx: "トゥ", tip: "舌先を歯茎につけて離す。日本語の「タ行」より強い息。", voiced: false },
    { symbol: "d", example: "dog", ipa: "/dɒɡ/", approx: "ドゥ", tip: "/t/ の有声音。舌の位置は同じ。", voiced: true },
    { symbol: "k", example: "cat", ipa: "/kæt/", approx: "ク", tip: "舌の後部を上あごにつけて離す。語頭では強い息。", voiced: false },
    { symbol: "ɡ", example: "go", ipa: "/ɡoʊ/", approx: "グ", tip: "/k/ の有声音。日本語の「ガ行」に近い。", voiced: true },
];

const FRICATIVE_CONSONANTS = [
    { symbol: "f", example: "five", ipa: "/faɪv/", approx: "フ", tip: "上の歯を下唇に軽く当てて息を出す。日本語の「フ」と違い歯を使う。", voiced: false, hard: true },
    { symbol: "v", example: "very", ipa: "/ˈvɛri/", approx: "ヴ", tip: "/f/ の有声音。歯を下唇に当てたまま声を出す。日本語にない音。", voiced: true, hard: true },
    { symbol: "θ", example: "think", ipa: "/θɪŋk/", approx: "（スに近い）", tip: "舌先を上下の歯の間に挟んで息を出す。日本語にない音。bath, math, three など。", voiced: false, hard: true },
    { symbol: "ð", example: "this", ipa: "/ðɪs/", approx: "（ズに近い）", tip: "/θ/ の有声音。舌先を歯に挟んだまま声を出す。the, that, mother など。", voiced: true, hard: true },
    { symbol: "s", example: "see", ipa: "/siː/", approx: "ス", tip: "日本語の「ス」とほぼ同じ。舌先を歯茎に近づけて息を出す。", voiced: false },
    { symbol: "z", example: "zoo", ipa: "/zuː/", approx: "ズ", tip: "/s/ の有声音。日本語の「ズ」に近い。", voiced: true },
    { symbol: "ʃ", example: "she", ipa: "/ʃiː/", approx: "シュ", tip: "日本語の「シ」に近いが、唇をやや丸める。ship, fish, nation など。", voiced: false },
    { symbol: "ʒ", example: "vision", ipa: "/ˈvɪʒən/", approx: "ジュ", tip: "/ʃ/ の有声音。measure, pleasure, garage など。日本語にない音。", voiced: true, hard: true },
    { symbol: "h", example: "he", ipa: "/hiː/", approx: "ハ", tip: "息だけで出す音。日本語の「ハ行」に近い。", voiced: false },
];

const AFFRICATE_CONSONANTS = [
    { symbol: "tʃ", example: "church", ipa: "/tʃɜːrtʃ/", approx: "チ", tip: "/t/ + /ʃ/ を素早く続けて発音。日本語の「チ」に近い。", voiced: false },
    { symbol: "dʒ", example: "just", ipa: "/dʒʌst/", approx: "ヂ / ジ", tip: "/tʃ/ の有声音。job, bridge, page など。", voiced: true },
];

const NASAL_CONSONANTS = [
    { symbol: "m", example: "man", ipa: "/mæn/", approx: "ム", tip: "唇を閉じて鼻から音を出す。日本語の「マ行」に近い。" },
    { symbol: "n", example: "no", ipa: "/noʊ/", approx: "ヌ", tip: "舌先を歯茎につけて鼻から音を出す。日本語の「ナ行」に近い。" },
    { symbol: "ŋ", example: "sing", ipa: "/sɪŋ/", approx: "ング", tip: "舌の後部を上あごにつけて鼻から音を出す。「ん」の一種。king, long, think など。語頭には来ない。", hard: true },
];

const LIQUID_CONSONANTS = [
    { symbol: "l", example: "let", ipa: "/lɛt/", approx: "ル", tip: "舌先を歯茎の裏につけたまま声を出す。日本語の「ラ行」と全く違う音。舌先を上につけたまま。", hard: true },
    { symbol: "r", example: "red", ipa: "/rɛd/", approx: "ゥル", tip: "舌先をどこにもつけず、舌を軽く巻く（または盛り上げる）。日本語の「ラ行」と全く違う。", hard: true },
];

const GLIDE_CONSONANTS = [
    { symbol: "w", example: "we", ipa: "/wiː/", approx: "ウ", tip: "唇を丸く突き出してから次の母音に移る半母音。water, away, question など。" },
    { symbol: "j", example: "yes", ipa: "/jɛs/", approx: "ヤ行", tip: "日本語の「ヤ行」に近い半母音。year, you, use など。注意: IPAの /j/ は英語の「j」ではない。" },
];

const STRESS_MARKERS = [
    { symbol: "ˈ", name: "第一強勢", desc: "最も強く発音する音節の前に置く。単語の中で一番目立つ部分。", example: "about → /əˈbaʊt/", tip: "この記号の直後の音節を強く・高く・長めに発音する。" },
    { symbol: "ˌ", name: "第二強勢", desc: "2番目に強い音節の前に置く。長い単語で現れる。", example: "information → /ˌɪnfɚˈmeɪʃən/", tip: "第一強勢ほどではないが、弱音節より明瞭に発音する。" },
    { symbol: "ː", name: "長音記号", desc: "直前の母音を長く伸ばす。", example: "see → /siː/", tip: "この記号があると約2倍の長さで発音する。" },
    { symbol: ".", name: "音節の区切り", desc: "音節の境目を示す（任意）。", example: "happy → /ˈhæ.pi/", tip: "音節の切れ目を明示する場合に使用。" },
];

const CONNECTED_PHENOMENA = [
    {
        title: "リダクション (Reduction)",
        desc: "機能語（to, for, can など）がストレスを受けず、短く弱い音に変化します。自然な英語では頻繁に起こります。",
        examples: [
            { from: "want to", to: "/ˈwɒnə/", note: "wanna" },
            { from: "going to", to: "/ˈɡɒnə/", note: "gonna" },
            { from: "have to", to: "/ˈhæftə/", note: "hafta" },
            { from: "kind of", to: "/ˈkaɪndə/", note: "kinda" },
        ],
    },
    {
        title: "リンキング (Linking)",
        desc: "語尾の子音と次の語頭の母音がつながって、まるで1つの単語のように発音されます。",
        examples: [
            { from: "an apple", to: "/ə.ˈnæpəl/", note: "n+a がつながる" },
            { from: "pick it up", to: "/ˈpɪ.kɪ.ˈtʌp/", note: "子音+母音が連続" },
            { from: "go away", to: "/ɡoʊ.wə.ˈweɪ/", note: "母音+母音に /w/ が入る" },
        ],
    },
    {
        title: "同化 (Assimilation)",
        desc: "隣り合う音の影響で、ある音が別の音に変わる現象です。発音しやすくするための自然な変化。",
        examples: [
            { from: "ten boys", to: "/tem bɔɪz/", note: "n → m（後続の b に合わせて）" },
            { from: "good girl", to: "/ɡʊɡ ɡɜːrl/", note: "d → ɡ（後続の g に合わせて）" },
            { from: "in Paris", to: "/ɪm ˈpærɪs/", note: "n → m（後続の p に合わせて）" },
        ],
    },
    {
        title: "脱落 (Elision)",
        desc: "特定の子音が省略されて発音されます。特に /t/ と /d/ が子音の間で脱落しやすい。",
        examples: [
            { from: "next day", to: "/nɛks deɪ/", note: "t が脱落" },
            { from: "last night", to: "/lɑːs naɪt/", note: "t が脱落" },
            { from: "hand bag", to: "/hæn bæɡ/", note: "d が脱落" },
        ],
    },
    {
        title: "弱形 (Weak Forms)",
        desc: "冠詞・前置詞・助動詞などの機能語は、文中でストレスを受けないとき弱い形で発音されます。",
        examples: [
            { from: "the (弱)", to: "/ðə/", note: "強形は /ðiː/" },
            { from: "a (弱)", to: "/ə/", note: "強形は /eɪ/" },
            { from: "to (弱)", to: "/tə/", note: "強形は /tuː/" },
            { from: "can (弱)", to: "/kən/", note: "強形は /kæn/" },
        ],
    },
    {
        title: "フラッピング (Flapping)",
        desc: "アメリカ英語で、母音に挟まれた /t/ や /d/ が軽い弾き音 /ɾ/ に変わります。日本語の「ラ行」に近い音。",
        examples: [
            { from: "water", to: "/ˈwɔːɾɚ/", note: "t → ɾ" },
            { from: "butter", to: "/ˈbʌɾɚ/", note: "t → ɾ" },
            { from: "better", to: "/ˈbɛɾɚ/", note: "t → ɾ" },
        ],
    },
];

// --- COMPONENT ---

function SymbolCard({ symbol, example, ipa, approx, tip, hard, voiced }: {
    symbol: string; example: string; ipa: string; approx: string; tip: string;
    hard?: boolean; voiced?: boolean;
}) {
    return (
        <div className={styles.symbolCard}>
            <div className={styles.symbolCardHeader}>
                <span className={styles.symbolLarge}>{symbol}</span>
                {hard && <span className={styles.hardBadge}>注意</span>}
                {voiced !== undefined && (
                    <span className={styles.voicedBadge}>{voiced ? "有声" : "無声"}</span>
                )}
            </div>
            <div className={styles.symbolCardExample}>
                <span className={styles.symbolWord}>{example}</span>
                <span className={styles.symbolIPA}>{ipa}</span>
            </div>
            <div className={styles.symbolApprox}>
                <span className={styles.approxLabel}>近似:</span> {approx}
            </div>
            <div className={styles.symbolTip}>{tip}</div>
        </div>
    );
}

export default function IPAGuidePage() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/app/settings" className={styles.backButton}>
                    <ArrowLeft size={20} />
                </Link>
                <h1 className={styles.title}>IPA 発音記号ガイド</h1>
            </header>

            <div className={styles.content}>
                <p className={styles.intro}>
                    IPA（International Phonetic Alphabet / 国際音声記号）は、世界中の言語の発音を正確に表記するための記号体系です。
                    英語の発音をカタカナではなくIPAで学ぶことで、よりネイティブに近い発音を身につけることができます。
                </p>
                <p className={styles.intro}>
                    <span className={styles.hardBadge}>注意</span> マークがついた音は日本語にない音、または日本語話者が間違いやすい音です。重点的に練習しましょう。
                </p>

                {/* How to use */}
                <div className={styles.section}>
                    <h2>使い方</h2>
                    <div className={styles.howToStep}>
                        <div className={styles.stepNumber}>1</div>
                        <div className={styles.stepContent}>
                            <div className={styles.stepTitle}>IPAボタンをタップ</div>
                            <div className={styles.stepDesc}>
                                英文の横にある「IPA」ボタンまたはアイコンをタップすると、発音記号が表示されます。
                            </div>
                        </div>
                    </div>
                    <div className={styles.howToStep}>
                        <div className={styles.stepNumber}>2</div>
                        <div className={styles.stepContent}>
                            <div className={styles.stepTitle}>長押しでモード切替</div>
                            <div className={styles.stepDesc}>
                                IPAボタンを長押しすると、「単語ごと」モードと「つながり」モードを切り替えられます。設定ページからも変更できます。
                            </div>
                        </div>
                    </div>
                    <div className={styles.howToStep}>
                        <div className={styles.stepNumber}>3</div>
                        <div className={styles.stepContent}>
                            <div className={styles.stepTitle}>もう一度タップで非表示</div>
                            <div className={styles.stepDesc}>
                                同じボタンをもう一度タップすると、IPA表示を隠します。
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mode comparison */}
                <div className={styles.section}>
                    <h2>2つのモード</h2>
                    <div className={styles.modeComparison}>
                        <div className={styles.modeCard}>
                            <div className={styles.modeTitle}>単語ごと (W)</div>
                            <div className={styles.modeDesc}>
                                各単語の辞書的な発音を表示。個々の単語の正しい発音を学ぶのに最適。
                            </div>
                            <div className={styles.modeExample}>/wɒnt tuː ɡoʊ/</div>
                        </div>
                        <div className={styles.modeCard}>
                            <div className={styles.modeTitle}>つながり (C)</div>
                            <div className={styles.modeDesc}>
                                自然な会話での発音を表示。リダクションやリンキングを反映。
                            </div>
                            <div className={styles.modeExample}>/ˈwɒnə ɡoʊ/</div>
                        </div>
                    </div>

                    <div className={styles.exampleCard}>
                        <div className={styles.exampleLabel}>例文</div>
                        <div className={styles.exampleText}>&quot;I want to go to the store&quot;</div>
                        <div className={styles.exampleIPA} style={{ marginBottom: 4 }}>
                            単語: /aɪ wɒnt tuː ɡoʊ tuː ðə stɔːr/
                        </div>
                        <div className={styles.exampleIPA}>
                            つながり: /aɪ ˈwɒnə ɡoʊ tə ðə stɔːr/
                        </div>
                    </div>
                </div>

                {/* Stress markers */}
                <div className={styles.section}>
                    <h2>補助記号</h2>
                    <p>IPA表記で使われる補助記号です。発音記号を読む上で欠かせません。</p>
                    {STRESS_MARKERS.map((m, i) => (
                        <div key={i} className={styles.stressCard}>
                            <div className={styles.stressHeader}>
                                <span className={styles.symbolLarge}>{m.symbol}</span>
                                <span className={styles.stressName}>{m.name}</span>
                            </div>
                            <div className={styles.stressDesc}>{m.desc}</div>
                            <div className={styles.stressExample}>
                                <span className={styles.symbolIPA}>{m.example}</span>
                            </div>
                            <div className={styles.symbolTip}>{m.tip}</div>
                        </div>
                    ))}
                </div>

                {/* ===== VOWELS ===== */}
                <div className={styles.section}>
                    <h2>母音 ー 短母音 (Short Vowels)</h2>
                    <p>ストレスのある音節で短く発音される母音です。長母音との区別が重要。</p>
                    <div className={styles.symbolGrid}>
                        {SHORT_VOWELS.map((v, i) => (
                            <SymbolCard key={i} {...v} />
                        ))}
                    </div>
                </div>

                <div className={styles.section}>
                    <h2>母音 ー 長母音 (Long Vowels)</h2>
                    <p>ːの記号がつき、短母音より長く伸ばして発音します。</p>
                    <div className={styles.symbolGrid}>
                        {LONG_VOWELS.map((v, i) => (
                            <SymbolCard key={i} {...v} />
                        ))}
                    </div>
                </div>

                <div className={styles.section}>
                    <h2>母音 ー 二重母音 (Diphthongs)</h2>
                    <p>2つの母音が滑らかにつながった音です。始めの母音から終わりの母音へ口の形を変えながら発音します。</p>
                    <div className={styles.symbolGrid}>
                        {DIPHTHONGS.map((v, i) => (
                            <SymbolCard key={i} {...v} />
                        ))}
                    </div>
                </div>

                {/* ===== CONSONANTS ===== */}
                <div className={styles.section}>
                    <h2>子音 ー 破裂音 (Stops)</h2>
                    <p>空気の流れを完全に止めてから一気に解放する音です。無声/有声のペアがあります。</p>
                    <div className={styles.symbolGrid}>
                        {STOP_CONSONANTS.map((c, i) => (
                            <SymbolCard key={i} {...c} />
                        ))}
                    </div>
                </div>

                <div className={styles.section}>
                    <h2>子音 ー 摩擦音 (Fricatives)</h2>
                    <p>空気の通り道を狭めて、擦れる音を出します。/θ/ /ð/ /f/ /v/ は日本語にない音なので特に注意。</p>
                    <div className={styles.symbolGrid}>
                        {FRICATIVE_CONSONANTS.map((c, i) => (
                            <SymbolCard key={i} {...c} />
                        ))}
                    </div>
                </div>

                <div className={styles.section}>
                    <h2>子音 ー 破擦音 (Affricates)</h2>
                    <p>破裂音と摩擦音を素早く続けて出す音です。</p>
                    <div className={styles.symbolGrid}>
                        {AFFRICATE_CONSONANTS.map((c, i) => (
                            <SymbolCard key={i} {...c} />
                        ))}
                    </div>
                </div>

                <div className={styles.section}>
                    <h2>子音 ー 鼻音 (Nasals)</h2>
                    <p>口を閉じて鼻から息を出す音です。</p>
                    <div className={styles.symbolGrid}>
                        {NASAL_CONSONANTS.map((c, i) => (
                            <SymbolCard key={i} {...c} />
                        ))}
                    </div>
                </div>

                <div className={styles.section}>
                    <h2>子音 ー 流音 (Liquids)</h2>
                    <p>/l/ と /r/ の区別は日本語話者にとって最大の課題の一つです。IPAを見て違いを意識しましょう。</p>
                    <div className={styles.symbolGrid}>
                        {LIQUID_CONSONANTS.map((c, i) => (
                            <SymbolCard key={i} {...c} />
                        ))}
                    </div>
                    <div className={styles.lrCompare}>
                        <div className={styles.lrTitle}>/l/ と /r/ の違い</div>
                        <div className={styles.lrRow}>
                            <div className={styles.lrItem}>
                                <span className={styles.symbolLarge}>l</span>
                                <span className={styles.lrDesc}>舌先を歯茎の裏に<strong>つける</strong></span>
                            </div>
                            <span className={styles.lrVs}>vs</span>
                            <div className={styles.lrItem}>
                                <span className={styles.symbolLarge}>r</span>
                                <span className={styles.lrDesc}>舌先をどこにも<strong>つけない</strong></span>
                            </div>
                        </div>
                        <div className={styles.lrExamples}>
                            <div><span className={styles.symbolIPA}>light /laɪt/</span> vs <span className={styles.symbolIPA}>right /raɪt/</span></div>
                            <div><span className={styles.symbolIPA}>led /lɛd/</span> vs <span className={styles.symbolIPA}>red /rɛd/</span></div>
                            <div><span className={styles.symbolIPA}>collect /kəˈlɛkt/</span> vs <span className={styles.symbolIPA}>correct /kəˈrɛkt/</span></div>
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <h2>子音 ー 半母音 (Glides)</h2>
                    <p>母音のように滑らかで、子音の役割を果たす音です。</p>
                    <div className={styles.symbolGrid}>
                        {GLIDE_CONSONANTS.map((c, i) => (
                            <SymbolCard key={i} {...c} />
                        ))}
                    </div>
                </div>

                {/* Connected speech phenomena */}
                <div className={styles.section}>
                    <h2>連結音声の現象</h2>
                    <p>「つながり」モードで反映される、自然な英語に現れる音声変化。教科書通りに読むのではなく、実際の会話でどう変わるかを理解しましょう。</p>
                    {CONNECTED_PHENOMENA.map((p, i) => (
                        <div key={i} className={styles.phenomenonCard}>
                            <div className={styles.phenomenonTitle}>{p.title}</div>
                            <div className={styles.phenomenonDesc}>{p.desc}</div>
                            <div className={styles.phenomenonExamples}>
                                {p.examples.map((ex, j) => (
                                    <div key={j} className={styles.phenomenonExRow}>
                                        <span className={styles.phenomenonFrom}>{ex.from}</span>
                                        <span className={styles.phenomenonArrow}>{"\u2192"}</span>
                                        <span className={styles.phenomenonTo}>{ex.to}</span>
                                        {ex.note && <span className={styles.phenomenonNote}>{ex.note}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tips */}
                <div className={styles.section}>
                    <h2>日本語話者のための学習ポイント</h2>
                    <ul>
                        <li><strong>/æ/</strong>（cat）と <strong>/ɑː/</strong>（father）と <strong>/ʌ/</strong>（cup）：日本語では全て「ア」に聞こえますが、IPAでは3つの異なる音です。口の開け方と舌の位置が違います。</li>
                        <li><strong>/l/</strong> と <strong>/r/</strong>：日本語の「ラ行」はどちらにも聞こえるため混同しやすい。IPAを見て舌の位置を意識しましょう。</li>
                        <li><strong>/θ/</strong>（think）と <strong>/s/</strong>（see）：日本語話者は両方とも「ス」に聞こえがちですが、/θ/ は舌を歯の間に出します。</li>
                        <li><strong>/f/</strong> と <strong>/h/</strong>：日本語の「フ」は /h/ に近いですが、英語の /f/ は歯を使います。fun と hun は違う音です。</li>
                        <li><strong>/ə/</strong>（シュワー）：英語で最も頻出する母音。ストレスのない音節はほぼすべてこの曖昧な音になります。banana = /bəˈnænə/ のように。</li>
                        <li><strong>二重母音の終わり</strong>：/oʊ/（go）を「ゴー」ではなく「ゴウ」、/eɪ/（say）を「セー」ではなく「セイ」と意識しましょう。</li>
                        <li><strong>語末の子音</strong>：日本語では子音の後に必ず母音がつきますが、英語では「cup = /kʌp/」のように子音で終わります。余計な母音を足さないよう注意。</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
