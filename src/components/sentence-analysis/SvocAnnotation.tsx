"use client";

import { useRef, useEffect, useState } from "react";
import type { SvocElement, SvocRole } from "@/actions/sentence-analysis";
import styles from "./SvocAnnotation.module.css";

interface Props {
    elements: SvocElement[];
    originalSentence: string;
    pattern: string;
}

interface Arrow {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

const ROLE_COLORS: Record<SvocRole, string> = {
    S: "#3B82F6",
    V: "#D94528",
    O: "#10B981",
    C: "#8B5CF6",
    M: "#F59E0B",
};

const ROLE_LABELS: Record<SvocRole, string> = {
    S: "S",
    V: "V",
    O: "O",
    C: "C",
    M: "M",
};

export default function SvocAnnotation({ elements, originalSentence, pattern }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [arrows, setArrows] = useState<Arrow[]>([]);

    useEffect(() => {
        const calculateArrows = () => {
            if (!containerRef.current) return;
            const container = containerRef.current;
            const containerRect = container.getBoundingClientRect();
            const newArrows: Arrow[] = [];

            elements.forEach((elem, i) => {
                if (elem.modifiesIndex !== null && elem.modifiesIndex !== undefined) {
                    const sourceEl = container.querySelector(`[data-svoc-index="${i}"]`);
                    const targetEl = container.querySelector(`[data-svoc-index="${elem.modifiesIndex}"]`);

                    if (sourceEl && targetEl) {
                        const sRect = sourceEl.getBoundingClientRect();
                        const tRect = targetEl.getBoundingClientRect();

                        newArrows.push({
                            x1: sRect.left + sRect.width / 2 - containerRect.left,
                            y1: sRect.top - containerRect.top,
                            x2: tRect.left + tRect.width / 2 - containerRect.left,
                            y2: tRect.top - containerRect.top,
                        });
                    }
                }
            });

            setArrows(newArrows);
        };

        const timer = setTimeout(calculateArrows, 100);
        const observer = new ResizeObserver(calculateArrows);
        if (containerRef.current) observer.observe(containerRef.current);

        return () => {
            clearTimeout(timer);
            observer.disconnect();
        };
    }, [elements]);

    return (
        <div className={styles.wrapper}>
            <div className={styles.label}>SVOC分析</div>
            <div className={styles.patternBadge}>{pattern}</div>

            <div className={styles.annotationContainer} ref={containerRef}>
                {/* SVG arrows for modification relationships */}
                <svg className={styles.arrowSvg}>
                    <defs>
                        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                            <polygon points="0 0, 8 3, 0 6" fill="var(--color-fg-muted)" opacity="0.5" />
                        </marker>
                    </defs>
                    {arrows.map((arrow, i) => {
                        const midX = (arrow.x1 + arrow.x2) / 2;
                        const arcHeight = Math.min(40, Math.abs(arrow.x2 - arrow.x1) * 0.3 + 15);
                        const arcY = Math.min(arrow.y1, arrow.y2) - arcHeight;
                        return (
                            <path
                                key={i}
                                d={`M ${arrow.x1} ${arrow.y1} Q ${midX} ${arcY}, ${arrow.x2} ${arrow.y2}`}
                                className={styles.arrowPath}
                                markerEnd="url(#arrowhead)"
                            />
                        );
                    })}
                </svg>

                {/* SVOC elements */}
                <div className={styles.sentenceRow}>
                    {elements.map((elem, i) => {
                        const color = ROLE_COLORS[elem.role];
                        return (
                            <span
                                key={i}
                                className={styles.svocElement}
                                data-svoc-index={i}
                                style={{
                                    borderBottomColor: color,
                                    backgroundColor: `${color}10`,
                                }}
                                title={elem.explanation}
                            >
                                <span
                                    className={styles.roleBadge}
                                    style={{ backgroundColor: color }}
                                >
                                    {ROLE_LABELS[elem.role]}
                                </span>
                                <span className={styles.elementText}>{elem.text}</span>
                                <span className={styles.subRole} style={{ color }}>{elem.subRole}</span>
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className={styles.legend}>
                {(Object.entries(ROLE_COLORS) as [SvocRole, string][]).map(([role, color]) => (
                    <div key={role} className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ backgroundColor: color }} />
                        <span className={styles.legendLabel}>
                            {role} = {role === "S" ? "主語" : role === "V" ? "動詞" : role === "O" ? "目的語" : role === "C" ? "補語" : "修飾語"}
                        </span>
                    </div>
                ))}
            </div>

            {/* Explanations */}
            <div className={styles.explanations}>
                {elements.map((elem, i) => (
                    <div key={i} className={styles.explanationItem}>
                        <span className={styles.explanationBadge} style={{ backgroundColor: ROLE_COLORS[elem.role] }}>
                            {ROLE_LABELS[elem.role]}
                        </span>
                        <span className={styles.explanationText}>
                            <strong>{elem.text}</strong> — {elem.explanation}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
