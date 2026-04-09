// ── 助動詞 ──
export const AUX_VERBS = new Set([
    "am", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had",
    "do", "does", "did",
    "can", "could", "will", "would", "shall", "should",
    "may", "might", "must",
]);

export function isAux(word: string): boolean {
    return AUX_VERBS.has(word.toLowerCase());
}

// ── リンク動詞 (SVC を取る) ──
export const LINKING_VERBS = new Set([
    "be", "become", "remain", "seem", "appear",
    "look", "feel", "sound", "taste", "smell",
    "stay", "prove", "turn", "grow", "get",
    "keep", "go", "come", "run", "fall",
]);

// 活用形 → lemma のマップ (頻出のみ)
const LINKING_INFLECTIONS: Record<string, string> = {
    am: "be", is: "be", are: "be", was: "be", were: "be",
    been: "be", being: "be",
    becomes: "become", became: "become",
    remains: "remain", remained: "remain",
    seems: "seem", seemed: "seem",
    appears: "appear", appeared: "appear",
    looks: "look", looked: "look",
    feels: "feel", felt: "feel",
    sounds: "sound", sounded: "sound",
    tastes: "taste", tasted: "taste",
    smells: "smell", smelled: "smell",
    stays: "stay", stayed: "stay",
    proves: "prove", proved: "prove", proven: "prove",
    turns: "turn", turned: "turn",
    grows: "grow", grew: "grow", grown: "grow",
    gets: "get", got: "get", gotten: "get",
    keeps: "keep", kept: "keep",
    goes: "go", went: "go", gone: "go",
    comes: "come", came: "come",
    runs: "run", ran: "run",
    falls: "fall", fell: "fall", fallen: "fall",
};

export function isLinkingVerb(word: string): boolean {
    const w = word.toLowerCase();
    return LINKING_VERBS.has(w) || LINKING_VERBS.has(LINKING_INFLECTIONS[w] ?? "");
}

export function getLemma(word: string): string {
    const w = word.toLowerCase();
    // 1. Known linking-verb inflections (most accurate)
    if (LINKING_INFLECTIONS[w]) return LINKING_INFLECTIONS[w];
    // 2. 3rd person singular: -ies → -y (carries → carry)
    if (w.endsWith("ies") && w.length > 4) return w.slice(0, -3) + "y";
    // 3. 3rd person singular: -shes/-ches/-sses/-xes/-zes → strip -es
    if (w.length > 4 && (w.endsWith("shes") || w.endsWith("ches") || w.endsWith("sses") || w.endsWith("xes") || w.endsWith("zes"))) {
        return w.slice(0, -2);
    }
    // 4. 3rd person singular: general -s (skip -ss/-us/-is and short words)
    if (w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("us") && !w.endsWith("is") && w.length > 3) {
        return w.slice(0, -1);
    }
    return w;
}

// ── 二重目的語動詞 (SVOO) ──
export const DITRANSITIVE_VERBS = new Set([
    "give", "send", "show", "tell", "buy",
    "offer", "teach", "bring", "lend", "pay",
    "write", "read", "pass", "hand", "throw",
    "award", "grant", "promise", "wish", "owe",
]);

// ── 複合他動詞 (SVOC) ──
export const COMPLEX_TRANSITIVE_VERBS = new Set([
    "make", "find", "consider", "call", "keep",
    "leave", "think", "believe", "declare", "prove",
    "elect", "name", "appoint", "render", "drive",
    "paint", "dye", "turn", "get", "want",
]);

// ── that 補文動詞 (noun clause を O に取る) ──
export const THAT_COMPLEMENT_VERBS = new Set([
    "think", "believe", "know", "say", "tell",
    "hope", "wish", "assume", "suppose", "claim",
    "suggest", "insist", "demand", "recommend",
    "feel", "realize", "understand", "notice",
    "expect", "fear", "doubt", "imagine",
    "acknowledge", "admit", "agree", "announce",
    "argue", "complain", "confirm", "decide",
    "deny", "discover", "explain", "forget",
    "guess", "hear", "imply", "indicate",
    "learn", "mean", "mention", "predict",
    "promise", "prove", "recall", "recognize",
    "remember", "report", "reveal", "show",
    "state", "suspect", "warn", "find",
]);

// ── 同格 that 節を取る名詞 ──
export const APPOSITIVE_NOUNS = new Set([
    "fact", "idea", "belief", "claim", "hope",
    "thought", "notion", "assumption", "conclusion",
    "discovery", "evidence", "feeling", "news",
    "observation", "opinion", "possibility",
    "proof", "proposal", "realization", "report",
    "rumor", "sign", "suggestion", "suspicion",
    "theory", "truth", "understanding", "view",
    "warning", "wish", "knowledge", "doubt",
    "impression", "likelihood", "principle",
    "recognition", "requirement", "revelation",
    "risk", "sense", "statement",
]);

// ── to不定詞を O に取る動詞 ──
export const TO_INF_OBJECT_VERBS = new Set([
    "want", "need", "hope", "wish", "expect",
    "plan", "decide", "choose", "agree", "refuse",
    "offer", "promise", "threaten", "attempt",
    "fail", "manage", "learn", "afford", "tend",
    "pretend", "claim", "demand", "desire",
    "intend", "prepare", "strive", "swear",
    "volunteer", "vow", "arrange", "endeavor",
]);

// ── Raising 動詞 ──
export const RAISING_VERBS = new Set([
    "seem", "appear", "happen", "prove", "tend", "chance",
]);

// ── 知覚動詞 ──
export const PERCEPTION_VERBS = new Set([
    "see", "hear", "watch", "feel", "notice", "observe",
]);

// ── 使役動詞 ──
export const CAUSATIVE_VERBS = new Set([
    "make", "let", "have", "get", "force",
    "cause", "allow", "permit", "enable",
]);

// ── be + 形容詞パターン (SVC の C 判定用) ──
export const COPULAR_ADJ_SET = new Set([
    "bound", "likely", "unlikely", "ready", "able", "unable",
    "supposed", "willing", "apt", "certain", "sure", "afraid",
    "capable", "inclined", "prone", "destined", "meant", "set",
    "about", "due", "important", "necessary", "possible",
    "impossible", "difficult", "easy", "hard",
]);

// ── Bridge verbs (allow long-distance extraction from complement clauses) ──
export const BRIDGE_VERBS = new Set([
    "claim", "think", "say", "believe", "report",
    "argue", "assume", "feel", "suggest", "know",
    "suppose", "hope", "imagine", "expect", "fear",
    "declare", "assert", "maintain", "state", "predict",
    "acknowledge", "admit", "announce", "confirm",
    "deny", "discover", "explain", "find", "hear",
    "learn", "mean", "mention", "notice", "realize",
    "remember", "reveal", "show", "suspect", "understand",
    "warn", "wish",
]);

// ── Passive + to-inf で to-inf が PURPOSE (M) になる動詞 (allowlist) ──
// これらの動詞のみ、受動態 + to不定詞 = 目的の不定詞 (M)
// e.g., "was built to last" → M:"to last" (purpose)
// それ以外は C のまま維持 (e.g., "is believed to be", "was made to confess", "was forced to leave")
// NOTE: "design" は省略不可の補部 ("was designed to protect" ≠ "was designed in order to protect")
//       → COPULAR_PASSIVE_ADJ_VERBS (sentence-pattern.ts) に移動済み
export const PASSIVE_PURPOSE_TO_INF_VERBS = new Set([
    "build", "create", "develop", "construct",
    "establish", "organize", "plan", "arrange",
    "use", "employ", "utilize", "deploy",
    "introduce", "implement", "install", "prepare",
    "configure", "train", "equip", "adapt", "modify",
    "program", "engineer", "craft", "tailor", "optimize",
]);

// ── 相動詞 (aspectual verbs): V + to-inf が述語として一体化する動詞 ──
// "come to be used", "get to know", "grow to love" — to-inf は述語の一部 (complement)
export const ASPECTUAL_TO_VERBS = new Set([
    "come", "get", "grow", "live",
]);

// ── 不規則過去分詞 → 原形 マップ ──
const IRREGULAR_PP: Record<string, string> = {
    made: "make", driven: "drive", led: "lead",
    meant: "mean", thought: "think", known: "know",
    found: "find", said: "say", told: "tell",
    shown: "show", sent: "send", built: "build",
    left: "leave", held: "hold", brought: "bring",
    caught: "catch", taught: "teach", bought: "buy",
    lent: "lend", paid: "pay", thrown: "throw",
    chosen: "choose", written: "write", given: "give",
    taken: "take", spoken: "speak", hidden: "hide",
    beaten: "beat", broken: "break", sworn: "swear",
    forgiven: "forgive", forbidden: "forbid",
    stolen: "steal", shaken: "shake", woken: "wake",
    worn: "wear", torn: "tear", born: "bear", borne: "bear",
    drawn: "draw", begun: "begin", sung: "sing",
    rung: "ring", drunk: "drunk", swum: "swim",
};

/**
 * Check if a word (possibly inflected) matches any entry in a verb set.
 * Handles -ed past tense (including doubled consonant and base-e patterns)
 * and irregular past participles.
 */
export function matchesVerbSet(word: string, set: Set<string>): boolean {
    const w = word.toLowerCase();
    if (set.has(w)) return true;
    const lemma = getLemma(w);
    if (set.has(lemma)) return true;
    // Irregular past participle lookup
    const irregularBase = IRREGULAR_PP[w];
    if (irregularBase && set.has(irregularBase)) return true;
    if (w.endsWith("ed") && w.length > 3) {
        const stripped = w.slice(0, -2); // strip -ed: "claimed" → "claim"
        if (set.has(stripped)) return true;
        // doubled consonant: "admitted" → "admitt" → "admit"
        if (stripped.length >= 2 && stripped[stripped.length - 1] === stripped[stripped.length - 2]) {
            if (set.has(stripped.slice(0, -1))) return true;
        }
        // base-e words: "acknowledged" → "acknowledge" (strip just -d)
        if (set.has(w.slice(0, -1))) return true;
    }
    return false;
}

export function isBridgeVerb(word: string): boolean {
    return matchesVerbSet(word, BRIDGE_VERBS);
}
