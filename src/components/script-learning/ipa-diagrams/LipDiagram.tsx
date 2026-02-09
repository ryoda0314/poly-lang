'use client';

import { useMemo } from 'react';
import type { IPAFeatures } from '@/lib/ipa/ipa-features';
import { getLipShape } from '@/lib/ipa/svg-generators';

interface Props {
    features: IPAFeatures;
    size: number;
    showLabels?: boolean;
}

export default function LipDiagram({ features, size, showLabels }: Props) {
    const lipShape = useMemo(() => getLipShape(features), [features]);

    return (
        <svg
            viewBox="0 0 100 100"
            width={size}
            height={size}
            role="img"
            aria-label="Lip shape diagram"
            style={{ display: 'block' }}
        >
            {/* Face outline (simple circle) */}
            <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="var(--color-text-secondary, #888)"
                strokeWidth="0.8"
                opacity="0.3"
            />

            {/* Outer lips */}
            <path
                d={lipShape.outerPath}
                fill="var(--color-surface-raised, #f5f0eb)"
                stroke="var(--color-text-secondary, #888)"
                strokeWidth="1.2"
            />

            {/* Inner mouth opening */}
            <path
                d={lipShape.innerPath}
                fill="var(--color-primary, #e74c5a)"
                fillOpacity="0.15"
                stroke="var(--color-primary, #e74c5a)"
                strokeWidth="1.2"
            />

            {/* Labiodental: upper teeth mark */}
            {features.type === 'consonant' && features.place === 'labiodental' && (
                <g>
                    <rect
                        x="44"
                        y="44"
                        width="12"
                        height="4"
                        rx="1"
                        fill="var(--color-bg-primary, #fff)"
                        stroke="var(--color-text-secondary, #888)"
                        strokeWidth="0.8"
                    />
                </g>
            )}

            {/* Label */}
            {showLabels && (
                <text
                    x="50"
                    y="96"
                    fontSize="5"
                    fill="var(--color-text-tertiary, #aaa)"
                    textAnchor="middle"
                >
                    {features.type === 'vowel'
                        ? features.rounding
                        : features.place === 'bilabial' ? 'bilabial' : 'neutral'}
                </text>
            )}
        </svg>
    );
}
