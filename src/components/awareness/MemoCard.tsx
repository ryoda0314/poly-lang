import React, { useState } from "react";
import { Database } from "@/types/supabase";

type Memo = Database['public']['Tables']['awareness_memos']['Row'];

const CONFIDENCE_COLORS: Record<string, string> = {
    high: "var(--color-success)",
    medium: "var(--color-warning)",
    low: "var(--color-destructive)",
    default: "var(--color-info)"
};

interface MemoCardProps {
    memo: Memo;
}

export default function MemoCard({ memo }: MemoCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const confidence = memo.confidence || 'low';
    const color = CONFIDENCE_COLORS[confidence] || CONFIDENCE_COLORS.default;

    return (
        <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
            transition: 'box-shadow 0.2s ease',
            position: 'relative'
        }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
        >
            {/* Status Indicator Line */}
            <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '4px',
                background: color
            }} />

            <div style={{ padding: '16px 20px 16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h4 style={{
                            margin: 0,
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            color: 'var(--color-fg)',
                            lineHeight: 1.2
                        }}>
                            {memo.token_text}
                        </h4>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                            <span style={{
                                fontSize: '0.7rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: `color-mix(in srgb, ${color} 15%, transparent)`,
                                color: color,
                                fontWeight: 600,
                                textTransform: 'uppercase'
                            }}>
                                {confidence}
                            </span>
                            {memo.usage_count > 0 && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--color-fg-muted)', display: 'flex', alignItems: 'center' }}>
                                    Used {memo.usage_count}x
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Memo Content / Context */}
                {memo.memo && (
                    <div style={{
                        fontSize: '0.95rem',
                        color: 'var(--color-fg-muted)',
                        lineHeight: 1.5,
                        marginTop: '4px',
                        display: '-webkit-box',
                        WebkitLineClamp: isExpanded ? 'unset' : 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        cursor: 'pointer'
                    }}
                        onClick={() => setIsExpanded(!isExpanded)}
                        title="Click to expand"
                    >
                        {memo.memo}
                    </div>
                )}

                {/* Meta footer */}
                <div style={{
                    borderTop: '1px solid var(--color-surface-hover)',
                    marginTop: '8px',
                    paddingTop: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: 'var(--color-fg-muted)'
                }}>
                    <span>
                        {memo.next_review_at
                            ? `Review due: ${new Date(memo.next_review_at).toLocaleDateString()}`
                            : `Created: ${new Date(memo.created_at || Date.now()).toLocaleDateString()}`
                        }
                    </span>
                </div>
            </div>
        </div>
    );
}
