import { IPA_MAP, type IPAFeatures } from './ipa-features';

/**
 * Parse an IPA pronunciation string and return articulatory features.
 *
 * Handles:
 * - Direct lookup: "k", "tɕʰ"
 * - Slash-separated alternatives: "k/g" → first match, "w/uː" → first match
 * - Hindi consonant+schwa: "kə", "kʰə" → extract consonant part
 * - Length mark stripping: "aː" tries full first, then "a"
 * - Pharyngealization: "sˤ" → tries full, then base "s"
 * - Compound symbols: longest match first
 */
export function parseIPA(pronunciation: string): IPAFeatures | null {
    if (!pronunciation) return null;

    // 1. Handle slash-separated alternatives — try each part
    if (pronunciation.includes('/')) {
        for (const part of pronunciation.split('/')) {
            const result = parseSingle(part.trim());
            if (result) return result;
        }
        return null;
    }

    return parseSingle(pronunciation);
}

function parseSingle(ipa: string): IPAFeatures | null {
    if (!ipa) return null;

    // 2. Direct lookup (full string)
    if (IPA_MAP[ipa]) return IPA_MAP[ipa];

    // 3. Strip trailing schwa for Hindi-style "kə" → "k"
    if (ipa.endsWith('ə') && ipa.length > 1) {
        const base = ipa.slice(0, -1);
        if (IPA_MAP[base]) return IPA_MAP[base];
    }

    // 4. Try longest prefix match (for compound symbols)
    //    e.g. "tɕʰ" should match before "tɕ" or "t"
    for (let len = Math.min(ipa.length, 4); len >= 1; len--) {
        const prefix = ipa.slice(0, len);
        if (IPA_MAP[prefix]) return IPA_MAP[prefix];
    }

    // 5. Strip diacritics and try again
    const stripped = ipa
        .replace(/ː/g, '')    // length
        .replace(/ˤ/g, '')    // pharyngealization
        .replace(/̪/g, '')     // dental (combining below)
        .replace(/ʰ/g, '')    // aspiration
        .replace(/ʱ/g, '')    // breathy
        .replace(/̃/g, '');    // nasalization

    if (stripped !== ipa && stripped.length > 0) {
        if (IPA_MAP[stripped]) return IPA_MAP[stripped];
        // Try longest prefix again on stripped
        for (let len = Math.min(stripped.length, 4); len >= 1; len--) {
            const prefix = stripped.slice(0, len);
            if (IPA_MAP[prefix]) return IPA_MAP[prefix];
        }
    }

    return null;
}
