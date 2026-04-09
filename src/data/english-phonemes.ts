// Shared English phoneme reference data
// Extracted from src/app/app/ipa-guide/page.tsx for reuse in PhonemeEncyclopedia

export type PhonemeCategory =
    | 'short-vowel' | 'long-vowel' | 'diphthong'
    | 'stop' | 'fricative' | 'affricate' | 'nasal' | 'liquid' | 'glide';

export interface EnglishPhoneme {
    symbol: string;
    example: string;
    ipa: string;
    approx: string;
    tip: string;
    hard?: boolean;
    voiced?: boolean;
    category: PhonemeCategory;
}

export const PHONEME_CATEGORIES: { key: PhonemeCategory; label: string; labelJa: string }[] = [
    { key: 'short-vowel', label: 'Short Vowels', labelJa: '短母音' },
    { key: 'long-vowel', label: 'Long Vowels', labelJa: '長母音' },
    { key: 'diphthong', label: 'Diphthongs', labelJa: '二重母音' },
    { key: 'stop', label: 'Stops', labelJa: '破裂音' },
    { key: 'fricative', label: 'Fricatives', labelJa: '摩擦音' },
    { key: 'affricate', label: 'Affricates', labelJa: '破擦音' },
    { key: 'nasal', label: 'Nasals', labelJa: '鼻音' },
    { key: 'liquid', label: 'Liquids', labelJa: '流音' },
    { key: 'glide', label: 'Glides', labelJa: '半母音' },
];

export const ENGLISH_PHONEMES: EnglishPhoneme[] = [
    // ── Short Vowels ──
    { symbol: "ɪ", example: "sit", ipa: "/sɪt/", approx: "イ", tip: "日本語の「イ」より短く、口をあまり横に引かない。力を抜いた「イ」。", category: 'short-vowel' },
    { symbol: "ɛ", example: "bed", ipa: "/bɛd/", approx: "エ", tip: "日本語の「エ」とほぼ同じ。やや口を大きく開ける。", category: 'short-vowel' },
    { symbol: "æ", example: "cat", ipa: "/kæt/", approx: "アとエの中間", tip: "「エ」の口の形で「ア」と言う。日本語にない音。口を横に広げて下顎を下げる。", hard: true, category: 'short-vowel' },
    { symbol: "ʌ", example: "cup", ipa: "/kʌp/", approx: "ア", tip: "日本語の「ア」に近いが、もっと短く鋭い。口はあまり開けない。", category: 'short-vowel' },
    { symbol: "ʊ", example: "book", ipa: "/bʊk/", approx: "ウ", tip: "日本語の「ウ」より唇を丸める。短くリラックスした音。", category: 'short-vowel' },
    { symbol: "ə", example: "about", ipa: "/əˈbaʊt/", approx: "弱いア", tip: "シュワー。英語で最も多い母音。力を完全に抜いた曖昧な「ア」。強勢のない音節に現れる。", hard: true, category: 'short-vowel' },
    { symbol: "ɚ", example: "butter", ipa: "/ˈbʌtɚ/", approx: "弱いアー", tip: "シュワーに /r/ が加わった音。舌先を軽く巻く。-er, -or などの語尾に現れる。", category: 'short-vowel' },

    // ── Long Vowels ──
    { symbol: "iː", example: "see", ipa: "/siː/", approx: "イー", tip: "日本語の「イー」に近い。口を横に引いて長く伸ばす。", category: 'long-vowel' },
    { symbol: "ɑː", example: "father", ipa: "/ˈfɑːðɚ/", approx: "アー", tip: "口を大きく開けて奥で響かせる。日本語の「ア」より口の奥を広げる。", hard: true, category: 'long-vowel' },
    { symbol: "ɔː", example: "law", ipa: "/lɔː/", approx: "オー", tip: "唇を丸くして「オー」。日本語の「オ」より唇を突き出す。", category: 'long-vowel' },
    { symbol: "uː", example: "food", ipa: "/fuːd/", approx: "ウー", tip: "唇を丸く突き出して長く伸ばす。日本語の「ウ」より唇を使う。", category: 'long-vowel' },
    { symbol: "ɜːr", example: "bird", ipa: "/bɜːrd/", approx: "アーr", tip: "口を半開きにして舌を巻きながら「アー」。日本語にない音。girl, world, nurse など。", hard: true, category: 'long-vowel' },

    // ── Diphthongs ──
    { symbol: "eɪ", example: "say", ipa: "/seɪ/", approx: "エイ", tip: "「エ」から「イ」へ滑らかに移動。day, make, rain など。", category: 'diphthong' },
    { symbol: "aɪ", example: "my", ipa: "/maɪ/", approx: "アイ", tip: "「ア」から「イ」へ。time, like, buy など。", category: 'diphthong' },
    { symbol: "ɔɪ", example: "boy", ipa: "/bɔɪ/", approx: "オイ", tip: "「オ」から「イ」へ。toy, coin, noise など。", category: 'diphthong' },
    { symbol: "oʊ", example: "go", ipa: "/ɡoʊ/", approx: "オウ", tip: "「オ」から唇を丸めて「ウ」へ。home, know, boat など。日本語話者は「オー」にしがち。", hard: true, category: 'diphthong' },
    { symbol: "aʊ", example: "now", ipa: "/naʊ/", approx: "アウ", tip: "「ア」から「ウ」へ。how, about, house など。", category: 'diphthong' },

    // ── Stops ──
    { symbol: "p", example: "pen", ipa: "/pɛn/", approx: "プ", tip: "唇を閉じて息を一気に出す。語頭では強い息（帯気音）。", voiced: false, category: 'stop' },
    { symbol: "b", example: "bed", ipa: "/bɛd/", approx: "ブ", tip: "/p/ の有声音。声帯を振動させる。", voiced: true, category: 'stop' },
    { symbol: "t", example: "ten", ipa: "/tɛn/", approx: "トゥ", tip: "舌先を歯茎につけて離す。日本語の「タ行」より強い息。", voiced: false, category: 'stop' },
    { symbol: "d", example: "dog", ipa: "/dɒɡ/", approx: "ドゥ", tip: "/t/ の有声音。舌の位置は同じ。", voiced: true, category: 'stop' },
    { symbol: "k", example: "cat", ipa: "/kæt/", approx: "ク", tip: "舌の後部を上あごにつけて離す。語頭では強い息。", voiced: false, category: 'stop' },
    { symbol: "ɡ", example: "go", ipa: "/ɡoʊ/", approx: "グ", tip: "/k/ の有声音。日本語の「ガ行」に近い。", voiced: true, category: 'stop' },

    // ── Fricatives ──
    { symbol: "f", example: "five", ipa: "/faɪv/", approx: "フ", tip: "上の歯を下唇に軽く当てて息を出す。日本語の「フ」と違い歯を使う。", voiced: false, hard: true, category: 'fricative' },
    { symbol: "v", example: "very", ipa: "/ˈvɛri/", approx: "ヴ", tip: "/f/ の有声音。歯を下唇に当てたまま声を出す。日本語にない音。", voiced: true, hard: true, category: 'fricative' },
    { symbol: "θ", example: "think", ipa: "/θɪŋk/", approx: "（スに近い）", tip: "舌先を上下の歯の間に挟んで息を出す。日本語にない音。bath, math, three など。", voiced: false, hard: true, category: 'fricative' },
    { symbol: "ð", example: "this", ipa: "/ðɪs/", approx: "（ズに近い）", tip: "/θ/ の有声音。舌先を歯に挟んだまま声を出す。the, that, mother など。", voiced: true, hard: true, category: 'fricative' },
    { symbol: "s", example: "see", ipa: "/siː/", approx: "ス", tip: "日本語の「ス」とほぼ同じ。舌先を歯茎に近づけて息を出す。", voiced: false, category: 'fricative' },
    { symbol: "z", example: "zoo", ipa: "/zuː/", approx: "ズ", tip: "/s/ の有声音。日本語の「ズ」に近い。", voiced: true, category: 'fricative' },
    { symbol: "ʃ", example: "she", ipa: "/ʃiː/", approx: "シュ", tip: "日本語の「シ」に近いが、唇をやや丸める。ship, fish, nation など。", voiced: false, category: 'fricative' },
    { symbol: "ʒ", example: "vision", ipa: "/ˈvɪʒən/", approx: "ジュ", tip: "/ʃ/ の有声音。measure, pleasure, garage など。日本語にない音。", voiced: true, hard: true, category: 'fricative' },
    { symbol: "h", example: "he", ipa: "/hiː/", approx: "ハ", tip: "息だけで出す音。日本語の「ハ行」に近い。", voiced: false, category: 'fricative' },

    // ── Affricates ──
    { symbol: "tʃ", example: "church", ipa: "/tʃɜːrtʃ/", approx: "チ", tip: "/t/ + /ʃ/ を素早く続けて発音。日本語の「チ」に近い。", voiced: false, category: 'affricate' },
    { symbol: "dʒ", example: "just", ipa: "/dʒʌst/", approx: "ヂ / ジ", tip: "/tʃ/ の有声音。job, bridge, page など。", voiced: true, category: 'affricate' },

    // ── Nasals ──
    { symbol: "m", example: "man", ipa: "/mæn/", approx: "ム", tip: "唇を閉じて鼻から音を出す。日本語の「マ行」に近い。", category: 'nasal' },
    { symbol: "n", example: "no", ipa: "/noʊ/", approx: "ヌ", tip: "舌先を歯茎につけて鼻から音を出す。日本語の「ナ行」に近い。", category: 'nasal' },
    { symbol: "ŋ", example: "sing", ipa: "/sɪŋ/", approx: "ング", tip: "舌の後部を上あごにつけて鼻から音を出す。「ん」の一種。king, long, think など。語頭には来ない。", hard: true, category: 'nasal' },

    // ── Liquids ──
    { symbol: "l", example: "let", ipa: "/lɛt/", approx: "ル", tip: "舌先を歯茎の裏につけたまま声を出す。日本語の「ラ行」と全く違う音。舌先を上につけたまま。", hard: true, category: 'liquid' },
    { symbol: "r", example: "red", ipa: "/rɛd/", approx: "ゥル", tip: "舌先をどこにもつけず、舌を軽く巻く（または盛り上げる）。日本語の「ラ行」と全く違う。", hard: true, category: 'liquid' },

    // ── Glides ──
    { symbol: "w", example: "we", ipa: "/wiː/", approx: "ウ", tip: "唇を丸く突き出してから次の母音に移る半母音。water, away, question など。", category: 'glide' },
    { symbol: "j", example: "yes", ipa: "/jɛs/", approx: "ヤ行", tip: "日本語の「ヤ行」に近い半母音。year, you, use など。注意: IPAの /j/ は英語の「j」ではない。", category: 'glide' },
];

// Lookup map by symbol
export const PHONEME_BY_SYMBOL = new Map(ENGLISH_PHONEMES.map(p => [p.symbol, p]));

// Get phonemes by category
export function getPhonemesByCategory(category: PhonemeCategory): EnglishPhoneme[] {
    return ENGLISH_PHONEMES.filter(p => p.category === category);
}
