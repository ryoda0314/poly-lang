"use client";

import { DiffItem } from "@/types/pronunciation";

interface DiffHighlightProps {
    expectedText: string;
    asrText: string;
    diffs: DiffItem[];
}

export function DiffHighlight({ diffs }: DiffHighlightProps) {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', lineHeight: 1.8 }}>
            {diffs.sort((a, b) => a.position - b.position).map((diff, i) => {
                if (diff.type === 'match') {
                    return (
                        <span key={i} style={{ color: 'var(--color-fg)', padding: '2px 0' }}>
                            {diff.expected}
                        </span>
                    );
                } else if (diff.type === 'missing') {
                    return (
                        <span key={i} style={{
                            color: 'var(--color-fg-sub)',
                            textDecoration: 'line-through',
                            textDecorationColor: '#ef4444',
                            textDecorationThickness: '2px',
                            opacity: 0.6
                        }}>
                            {diff.expected}
                        </span>
                    );
                } else if (diff.type === 'substitution') {
                    return (
                        <div key={i} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{diff.actual}</span>
                            <span style={{ fontSize: '0.7em', color: 'var(--color-fg-muted)', textDecoration: 'line-through' }}>{diff.expected}</span>
                        </div>
                    );
                } else if (diff.type === 'insertion') {
                    return (
                        <span key={i} style={{ color: '#ef4444', fontStyle: 'italic' }}>
                            {diff.actual}
                        </span>
                    );
                }
                return null;
            })}
        </div>
    );
}
