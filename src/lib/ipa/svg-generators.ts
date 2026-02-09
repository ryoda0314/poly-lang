import type { ConsonantFeatures, VowelFeatures, IPAFeatures } from './ipa-features';

// ── Sagittal (side-view) diagram paths ─────────────────────────────

/** Fixed anatomy paths for sagittal cross-section (viewBox 0 0 100 100) */
export const SAGITTAL_FIXED = {
    /** Head outline: nose → upper lip → hard palate → velum → pharynx wall → larynx */
    headOutline:
        'M 18,30 Q 15,32 14,35 L 14,40 Q 14,42 16,43 L 20,44' + // nose
        ' L 20,48' + // upper lip
        ' Q 22,48 24,46' + // lip corner
        ' L 28,42 Q 35,34 50,30' + // alveolar ridge → hard palate
        ' Q 62,28 70,30' + // hard palate peak
        ' Q 78,33 82,40' + // velum
        ' Q 84,48 84,58' + // uvula area
        ' L 84,75' + // pharynx wall
        ' Q 84,82 80,85' + // larynx area
        ' L 75,88',

    /** Lower jaw outline */
    jaw:
        'M 20,56 Q 22,56 24,54' + // lower lip
        ' L 30,58 Q 40,65 50,68' + // lower jaw curve
        ' Q 60,72 68,78' +
        ' L 75,88',

    /** Upper teeth */
    teeth: 'M 24,44 L 26,48',

    /** Lower teeth */
    lowerTeeth: 'M 24,52 L 26,56',

    /** Alveolar ridge marker */
    alveolarRidge: 'M 28,42 Q 30,40 32,39',
};

/** Get tongue path for consonant place of articulation */
function consonantTonguePath(place: ConsonantFeatures['place'], manner: ConsonantFeatures['manner']): string {
    // Contact/approach point varies by place; tongue body follows
    const paths: Record<string, string> = {
        bilabial:
            'M 34,68 Q 40,60 48,58 Q 56,56 64,60 Q 72,66 76,74',
        labiodental:
            'M 34,68 Q 40,60 48,58 Q 56,56 64,60 Q 72,66 76,74',
        dental:
            // Tongue tip reaches teeth
            'M 26,52 Q 30,50 34,52 Q 42,56 50,58 Q 60,62 68,68 Q 74,72 76,74',
        alveolar:
            // Tongue tip at alveolar ridge
            'M 30,46 Q 34,48 38,52 Q 44,56 52,58 Q 62,62 70,68 Q 74,72 76,74',
        postalveolar:
            // Tongue blade raised behind alveolar ridge
            'M 32,48 Q 36,44 40,44 Q 46,46 52,52 Q 60,58 68,66 Q 74,72 76,74',
        retroflex:
            // Tongue tip curled back
            'M 34,44 Q 36,40 38,40 Q 40,40 42,44 Q 48,50 54,54 Q 62,60 70,68 Q 74,72 76,74',
        alveolopalatal:
            // Tongue blade raised toward palate
            'M 32,50 Q 38,44 44,40 Q 52,38 58,42 Q 64,50 70,60 Q 74,68 76,74',
        palatal:
            // Tongue body raised to hard palate
            'M 34,54 Q 40,46 48,38 Q 56,34 62,38 Q 68,48 72,60 Q 74,68 76,74',
        velar:
            // Tongue back raised to velum
            'M 34,60 Q 40,58 46,56 Q 52,52 58,46 Q 64,38 70,36 Q 76,42 78,54',
        uvular:
            // Tongue back raised to uvula
            'M 34,60 Q 40,58 46,56 Q 54,54 60,50 Q 66,44 72,38 Q 78,40 80,50',
        pharyngeal:
            // Tongue root retracted toward pharynx
            'M 34,62 Q 42,58 50,56 Q 58,54 64,52 Q 70,50 76,46 Q 80,44 82,50',
        glottal:
            // Neutral tongue position
            'M 34,66 Q 42,60 50,58 Q 58,56 64,58 Q 70,62 74,68 Q 76,72 76,74',
    };

    let base = paths[place] || paths.alveolar;

    // For fricatives/approximants, slightly lower tongue (gap instead of contact)
    if (manner === 'fricative' || manner === 'approximant' || manner === 'tap') {
        base = base.replace(/(\d+),(\d+)/g, (_m, x, y) => {
            const yi = parseInt(y);
            // Only shift the contact-area points slightly down
            return `${x},${yi < 60 ? yi + 2 : yi}`;
        });
    }

    return base;
}

/** Get tongue path for vowel features */
function vowelTonguePath(height: VowelFeatures['height'], backness: VowelFeatures['backness']): string {
    // Tongue highest point x: front=38, central=52, back=68
    const xMap = { front: 38, central: 52, back: 68 };
    // Tongue highest point y: close=38, near-close=42, close-mid=46, mid=52, open-mid=58, open=64
    const yMap = { close: 38, 'near-close': 42, 'close-mid': 46, mid: 52, 'open-mid': 58, open: 64 };

    const peakX = xMap[backness];
    const peakY = yMap[height];

    return `M 34,66 Q ${peakX - 6},${peakY + 8} ${peakX},${peakY} Q ${peakX + 8},${peakY + 2} ${peakX + 16},${peakY + 10} Q ${peakX + 22},${peakY + 18} 76,74`;
}

/** Get tongue SVG path for any IPA features */
export function getTonguePath(features: IPAFeatures): string {
    if (features.type === 'consonant') {
        return consonantTonguePath(features.place, features.manner);
    }
    return vowelTonguePath(features.height, features.backness);
}

/** Voicing indicator position (near larynx) */
export function getVoicingMarker(features: IPAFeatures): { show: boolean; x: number; y: number } {
    const voiced = features.type === 'vowel' ||
        (features.type === 'consonant' && features.voicing === 'voiced');
    return { show: voiced, x: 78, y: 84 };
}

/** Get lip closure/narrowing for sagittal view */
export function getSagittalLips(features: IPAFeatures): { upper: string; lower: string; closed: boolean } {
    const isBilabialStop = features.type === 'consonant' &&
        features.place === 'bilabial' && features.manner === 'stop';
    const isLabiodental = features.type === 'consonant' && features.place === 'labiodental';

    if (isBilabialStop) {
        return {
            upper: 'M 18,48 Q 20,50 22,50',
            lower: 'M 18,50 Q 20,50 22,50',
            closed: true,
        };
    }
    if (isLabiodental) {
        return {
            upper: 'M 18,46 Q 20,48 24,48',
            lower: 'M 18,52 Q 20,52 22,54',
            closed: false,
        };
    }
    // Default open
    return {
        upper: 'M 18,46 Q 20,48 22,48',
        lower: 'M 18,54 Q 20,54 22,56',
        closed: false,
    };
}

// ── Lip (front-view) diagram ───────────────────────────────────────

export interface LipShape {
    /** Outer lip contour path */
    outerPath: string;
    /** Inner mouth opening path */
    innerPath: string;
}

export function getLipShape(features: IPAFeatures): LipShape {
    if (features.type === 'vowel') {
        return getVowelLipShape(features);
    }
    return getConsonantLipShape(features);
}

function getVowelLipShape(v: VowelFeatures): LipShape {
    // Lip opening width and height based on rounding + height
    // Rounded → circular opening; Unrounded → wide opening
    // Close → small; Open → large

    const heightScale: Record<VowelFeatures['height'], number> = {
        close: 0.3, 'near-close': 0.4, 'close-mid': 0.5,
        mid: 0.6, 'open-mid': 0.75, open: 1.0,
    };
    const h = heightScale[v.height];

    if (v.rounding === 'rounded') {
        // Rounded: circular-ish opening, size based on height
        const r = 6 + h * 12; // radius 6–18
        const cx = 50, cy = 50;
        return {
            outerPath: ellipsePath(cx, cy, 22, 20),
            innerPath: ellipsePath(cx, cy, r * 0.8, r),
        };
    } else {
        // Unrounded: wide horizontal opening
        const ry = 3 + h * 14; // vertical 3–17
        const rx = 12 + h * 6;  // horizontal 12–18
        const cx = 50, cy = 50;
        return {
            outerPath: ellipsePath(cx, cy, 22, 20),
            innerPath: ellipsePath(cx, cy, rx, ry),
        };
    }
}

function getConsonantLipShape(c: ConsonantFeatures): LipShape {
    const cx = 50, cy = 50;
    const outer = ellipsePath(cx, cy, 22, 20);

    if (c.place === 'bilabial' && c.manner === 'stop') {
        // Lips fully closed
        return {
            outerPath: outer,
            innerPath: `M 32,50 Q 50,50 68,50`, // thin line
        };
    }
    if (c.place === 'bilabial' && c.manner === 'nasal') {
        // Nearly closed
        return {
            outerPath: outer,
            innerPath: `M 35,50 Q 50,49 65,50`,
        };
    }
    if (c.place === 'labiodental') {
        // Upper teeth on lower lip
        return {
            outerPath: outer,
            innerPath: ellipsePath(cx, cy, 10, 4),
        };
    }
    // Default: slightly open neutral
    return {
        outerPath: outer,
        innerPath: ellipsePath(cx, cy, 10, 6),
    };
}

/** Helper: SVG path for an ellipse */
function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
    return `M ${cx - rx},${cy} A ${rx},${ry} 0 1,0 ${cx + rx},${cy} A ${rx},${ry} 0 1,0 ${cx - rx},${cy} Z`;
}
