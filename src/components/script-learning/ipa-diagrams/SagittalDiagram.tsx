'use client';

import { useMemo } from 'react';
import type { IPAFeatures } from '@/lib/ipa/ipa-features';
import { SAGITTAL_FIXED, getTonguePath, getVoicingMarker, getSagittalLips } from '@/lib/ipa/svg-generators';

interface Props {
    features: IPAFeatures;
    size: number;
    showLabels?: boolean;
}

export default function SagittalDiagram({ features, size, showLabels }: Props) {
    const tongue = useMemo(() => getTonguePath(features), [features]);
    const voicing = useMemo(() => getVoicingMarker(features), [features]);
    const lips = useMemo(() => getSagittalLips(features), [features]);

    return (
        <svg
            viewBox="0 0 100 100"
            width={size}
            height={size}
            role="img"
            aria-label="Sagittal cross-section diagram"
            style={{ display: 'block' }}
        >
            {/* Head outline */}
            <path
                d={SAGITTAL_FIXED.headOutline}
                fill="none"
                stroke="var(--color-text-secondary, #888)"
                strokeWidth="1.2"
                strokeLinecap="round"
            />

            {/* Lower jaw */}
            <path
                d={SAGITTAL_FIXED.jaw}
                fill="none"
                stroke="var(--color-text-secondary, #888)"
                strokeWidth="1.2"
                strokeLinecap="round"
            />

            {/* Teeth */}
            <path
                d={SAGITTAL_FIXED.teeth}
                fill="none"
                stroke="var(--color-text-secondary, #888)"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d={SAGITTAL_FIXED.lowerTeeth}
                fill="none"
                stroke="var(--color-text-secondary, #888)"
                strokeWidth="2"
                strokeLinecap="round"
            />

            {/* Tongue — main dynamic element */}
            <path
                d={tongue}
                fill="var(--color-primary, #e74c5a)"
                fillOpacity="0.25"
                stroke="var(--color-primary, #e74c5a)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Lips (sagittal) */}
            <path
                d={lips.upper}
                fill="none"
                stroke="var(--color-text-secondary, #888)"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <path
                d={lips.lower}
                fill="none"
                stroke="var(--color-text-secondary, #888)"
                strokeWidth="1.5"
                strokeLinecap="round"
            />

            {/* Voicing indicator */}
            {voicing.show && (
                <g transform={`translate(${voicing.x},${voicing.y})`}>
                    <path
                        d="M -4,0 Q -2,-3 0,0 Q 2,3 4,0"
                        fill="none"
                        stroke="var(--color-primary, #e74c5a)"
                        strokeWidth="1.2"
                    />
                </g>
            )}

            {/* Aspiration indicator */}
            {features.type === 'consonant' && features.aspiration && (
                <g transform="translate(16,52)">
                    <text
                        fontSize="6"
                        fill="var(--color-text-secondary, #888)"
                        textAnchor="middle"
                    >
                        ʰ
                    </text>
                </g>
            )}

            {/* Labels */}
            {showLabels && features.type === 'consonant' && (
                <text
                    x="50"
                    y="96"
                    fontSize="5"
                    fill="var(--color-text-tertiary, #aaa)"
                    textAnchor="middle"
                >
                    {features.place}
                </text>
            )}
            {showLabels && features.type === 'vowel' && (
                <text
                    x="50"
                    y="96"
                    fontSize="5"
                    fill="var(--color-text-tertiary, #aaa)"
                    textAnchor="middle"
                >
                    {features.height} {features.backness}
                </text>
            )}
        </svg>
    );
}
