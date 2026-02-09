// IPA symbol → articulatory features mapping
// Covers all symbols used across th/ko/ru/hi/ar script data files

export interface ConsonantFeatures {
    type: 'consonant';
    place: 'bilabial' | 'labiodental' | 'dental' | 'alveolar' | 'postalveolar'
        | 'retroflex' | 'alveolopalatal' | 'palatal' | 'velar' | 'uvular' | 'pharyngeal' | 'glottal';
    manner: 'stop' | 'fricative' | 'affricate' | 'nasal' | 'trill' | 'tap' | 'lateral' | 'approximant';
    voicing: 'voiced' | 'voiceless';
    aspiration?: boolean;
    breathy?: boolean;
}

export interface VowelFeatures {
    type: 'vowel';
    height: 'close' | 'near-close' | 'close-mid' | 'mid' | 'open-mid' | 'open';
    backness: 'front' | 'central' | 'back';
    rounding: 'rounded' | 'unrounded';
    long?: boolean;
}

export type IPAFeatures = ConsonantFeatures | VowelFeatures;

// ── Consonant mappings ──────────────────────────────────────────────

const C = (
    place: ConsonantFeatures['place'],
    manner: ConsonantFeatures['manner'],
    voicing: ConsonantFeatures['voicing'],
    opts?: { aspiration?: boolean; breathy?: boolean },
): ConsonantFeatures => ({
    type: 'consonant', place, manner, voicing, ...opts,
});

// ── Vowel mappings ──────────────────────────────────────────────────

const V = (
    height: VowelFeatures['height'],
    backness: VowelFeatures['backness'],
    rounding: VowelFeatures['rounding'],
    long?: boolean,
): VowelFeatures => ({
    type: 'vowel', height, backness, rounding, ...(long ? { long: true } : {}),
});

// ── Master map: IPA symbol → features ───────────────────────────────

export const IPA_MAP: Record<string, IPAFeatures> = {
    // ── Bilabial ────────────────────────────────
    'p':  C('bilabial', 'stop', 'voiceless'),
    'pʰ': C('bilabial', 'stop', 'voiceless', { aspiration: true }),
    'b':  C('bilabial', 'stop', 'voiced'),
    'bʱ': C('bilabial', 'stop', 'voiced', { breathy: true }),
    'm':  C('bilabial', 'nasal', 'voiced'),
    'w':  C('bilabial', 'approximant', 'voiced'),

    // ── Labiodental ─────────────────────────────
    'f':  C('labiodental', 'fricative', 'voiceless'),
    'v':  C('labiodental', 'fricative', 'voiced'),
    'ʋ':  C('labiodental', 'approximant', 'voiced'),

    // ── Dental ──────────────────────────────────
    'θ':  C('dental', 'fricative', 'voiceless'),
    'ð':  C('dental', 'fricative', 'voiced'),
    't̪':  C('dental', 'stop', 'voiceless'),
    't̪ʰ': C('dental', 'stop', 'voiceless', { aspiration: true }),
    'd̪':  C('dental', 'stop', 'voiced'),
    'd̪ʱ': C('dental', 'stop', 'voiced', { breathy: true }),
    'n̪':  C('dental', 'nasal', 'voiced'),

    // ── Alveolar ────────────────────────────────
    't':  C('alveolar', 'stop', 'voiceless'),
    'tʰ': C('alveolar', 'stop', 'voiceless', { aspiration: true }),
    'd':  C('alveolar', 'stop', 'voiced'),
    'n':  C('alveolar', 'nasal', 'voiced'),
    's':  C('alveolar', 'fricative', 'voiceless'),
    'z':  C('alveolar', 'fricative', 'voiced'),
    'ts': C('alveolar', 'affricate', 'voiceless'),
    'r':  C('alveolar', 'trill', 'voiced'),
    'ɾ':  C('alveolar', 'tap', 'voiced'),
    'l':  C('alveolar', 'lateral', 'voiced'),

    // ── Postalveolar ────────────────────────────
    'ʃ':  C('postalveolar', 'fricative', 'voiceless'),
    'ʒ':  C('postalveolar', 'fricative', 'voiced'),
    'dʒ': C('postalveolar', 'affricate', 'voiced'),

    // ── Retroflex ───────────────────────────────
    'ʈ':  C('retroflex', 'stop', 'voiceless'),
    'ʈʰ': C('retroflex', 'stop', 'voiceless', { aspiration: true }),
    'ɖ':  C('retroflex', 'stop', 'voiced'),
    'ɖʱ': C('retroflex', 'stop', 'voiced', { breathy: true }),
    'ɳ':  C('retroflex', 'nasal', 'voiced'),
    'ʂ':  C('retroflex', 'fricative', 'voiceless'),
    'ʐ':  C('retroflex', 'fricative', 'voiced'),

    // ── Alveolo-palatal ─────────────────────────
    'tɕ':  C('alveolopalatal', 'affricate', 'voiceless'),
    'tɕʰ': C('alveolopalatal', 'affricate', 'voiceless', { aspiration: true }),
    'dʑ':  C('alveolopalatal', 'affricate', 'voiced'),
    'dʑʱ': C('alveolopalatal', 'affricate', 'voiced', { breathy: true }),
    'ɕ':   C('alveolopalatal', 'fricative', 'voiceless'),
    'ɕː':  C('alveolopalatal', 'fricative', 'voiceless'),

    // ── Palatal ─────────────────────────────────
    'j':  C('palatal', 'approximant', 'voiced'),
    'ɲ':  C('palatal', 'nasal', 'voiced'),

    // ── Velar ───────────────────────────────────
    'k':  C('velar', 'stop', 'voiceless'),
    'kʰ': C('velar', 'stop', 'voiceless', { aspiration: true }),
    'g':  C('velar', 'stop', 'voiced'),
    'gʱ': C('velar', 'stop', 'voiced', { breathy: true }),
    'ŋ':  C('velar', 'nasal', 'voiced'),
    'x':  C('velar', 'fricative', 'voiceless'),
    'ɣ':  C('velar', 'fricative', 'voiced'),

    // ── Uvular ──────────────────────────────────
    'q':  C('uvular', 'stop', 'voiceless'),

    // ── Pharyngeal ──────────────────────────────
    'ħ':  C('pharyngeal', 'fricative', 'voiceless'),
    'ʕ':  C('pharyngeal', 'fricative', 'voiced'),

    // ── Glottal ─────────────────────────────────
    'ʔ':  C('glottal', 'stop', 'voiceless'),
    'h':  C('glottal', 'fricative', 'voiceless'),
    'ɦ':  C('glottal', 'fricative', 'voiced'),

    // ── Combined consonant clusters (Hindi) ─────
    'kʂ':  C('retroflex', 'affricate', 'voiceless'),
    't̪ɾ': C('alveolar', 'tap', 'voiced'),
    'gɲ':  C('palatal', 'nasal', 'voiced'),

    // ── Vowels ──────────────────────────────────
    // Close front
    'i':   V('close', 'front', 'unrounded'),
    'iː':  V('close', 'front', 'unrounded', true),
    'ɪ':   V('near-close', 'front', 'unrounded'),

    // Close-mid front
    'e':   V('close-mid', 'front', 'unrounded'),
    'eː':  V('close-mid', 'front', 'unrounded', true),

    // Open-mid front
    'ɛ':   V('open-mid', 'front', 'unrounded'),
    'ɛː':  V('open-mid', 'front', 'unrounded', true),

    // Open
    'a':   V('open', 'central', 'unrounded'),
    'aː':  V('open', 'central', 'unrounded', true),

    // Mid central
    'ə':   V('mid', 'central', 'unrounded'),

    // Close central
    'ɨ':   V('close', 'central', 'unrounded'),

    // Close back unrounded
    'ɯ':   V('close', 'back', 'unrounded'),
    'ɯː':  V('close', 'back', 'unrounded', true),

    // Close-mid back unrounded
    'ɤ':   V('close-mid', 'back', 'unrounded'),
    'ɤː':  V('close-mid', 'back', 'unrounded', true),

    // Close back rounded
    'u':   V('close', 'back', 'rounded'),
    'uː':  V('close', 'back', 'rounded', true),
    'ʊ':   V('near-close', 'back', 'rounded'),

    // Close-mid back rounded
    'o':   V('close-mid', 'back', 'rounded'),
    'oː':  V('close-mid', 'back', 'rounded', true),

    // Open-mid back rounded
    'ɔ':   V('open-mid', 'back', 'rounded'),
    'ɔː':  V('open-mid', 'back', 'rounded', true),

    // Russian iotized (treat as vowel for diagram purposes)
    'je':  V('close-mid', 'front', 'unrounded'),
    'jo':  V('close-mid', 'back', 'rounded'),
    'ju':  V('close', 'back', 'rounded'),
    'ja':  V('open', 'central', 'unrounded'),
};
