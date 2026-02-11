"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Clause, SvocElement, SvocRole } from "@/actions/sentence-analysis";
import styles from "./SvocAnnotation.module.css";

interface Props {
    clauses: Clause[];
    pattern: string;
    sentencePattern?: number;
    sentencePatternLabel?: string;
}

const ROLE_COLORS: Record<SvocRole, string> = {
    S: "#3B82F6",
    V: "#D94528",
    Oi: "#06B6D4",
    Od: "#10B981",
    C: "#8B5CF6",
    M: "#F59E0B",
    Comp: "#EC4899",
    Insert: "#78716C",
    Compz: "#94A3B8",
};

const ROLE_NAMES: Record<SvocRole, string> = {
    S: "主語",
    V: "動詞",
    Oi: "間接目的語",
    Od: "直接目的語",
    C: "補語",
    M: "修飾語",
    Comp: "補部",
    Insert: "挿入句",
    Compz: "補文標識",
};

export default function SvocAnnotation({ clauses, pattern, sentencePattern, sentencePatternLabel }: Props) {
    const [expandedClauses, setExpandedClauses] = useState<Set<string>>(new Set());
    const [advancedMode, setAdvancedMode] = useState(false);

    if (!clauses || !Array.isArray(clauses) || clauses.length === 0) {
        return null;
    }

    const mainClause = clauses.find(c => c.clauseId === "main");
    const clauseMap = new Map(clauses.map(c => [c.clauseId, c]));

    const toggleClause = (clauseId: string) => {
        setExpandedClauses(prev => {
            const next = new Set(prev);
            if (next.has(clauseId)) next.delete(clauseId);
            else next.add(clauseId);
            return next;
        });
    };

    return (
        <div className={styles.wrapper}>
            {/* Header */}
            <div className={styles.headerRow}>
                <div className={styles.sectionLabel}>SVOC分析</div>
                <button
                    className={`${styles.modeToggle} ${advancedMode ? styles.modeActive : ""}`}
                    onClick={() => setAdvancedMode(!advancedMode)}
                >
                    {advancedMode ? "上級" : "初級"}
                </button>
            </div>

            {/* Sentence pattern */}
            <div className={styles.patternRow}>
                {sentencePatternLabel && (
                    <span className={styles.patternBadge}>{sentencePatternLabel}</span>
                )}
                <span className={styles.svocFormula}>{pattern}</span>
            </div>

            {/* Main clause */}
            {mainClause && (
                <div className={styles.mainClauseCard}>
                    <ClauseElements
                        clause={mainClause}
                        clauseMap={clauseMap}
                        expandedClauses={expandedClauses}
                        onToggle={toggleClause}
                        advancedMode={advancedMode}
                        depth={0}
                    />
                </div>
            )}

            {/* Legend */}
            <div className={styles.legend}>
                {(Object.entries(ROLE_COLORS) as [SvocRole, string][]).map(([role, color]) => (
                    <div key={role} className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ backgroundColor: color }} />
                        <span className={styles.legendLabel}>
                            {role} = {ROLE_NAMES[role]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Arrow data ──
interface ArrowDatum {
    x1: number;
    x2: number;
    label: string;
    color: string;
}

// ── Single element renderer ──

function renderElement(
    elem: SvocElement,
    i: number,
    expandedClauses: Set<string>,
    onToggle: (id: string) => void,
    advancedMode: boolean,
) {
    const isExpandable = !!elem.expandsTo;
    const isExpanded = elem.expandsTo ? expandedClauses.has(elem.expandsTo) : false;
    const color = ROLE_COLORS[elem.role];

    const isModifier = elem.role === "M";
    const isInsert = elem.role === "Insert";
    const isComp = elem.role === "Comp";
    const isCompz = elem.role === "Compz";
    const isElided = elem.text.startsWith("(") && elem.text.endsWith(")");

    return (
        <div
            key={i}
            data-elem-idx={i}
            className={`${styles.elementColumn} ${isModifier ? styles.modifierColumn : ""} ${isInsert ? styles.insertColumn : ""} ${isCompz ? styles.compzColumn : ""} ${isElided ? styles.elidedColumn : ""}`}
        >
            {isInsert && (
                <span className={styles.insertBadge}>挿入</span>
            )}
            <button
                className={`${styles.svocElement} ${isModifier ? styles.modifierElement : ""} ${isInsert ? styles.insertElement : ""} ${isComp ? styles.compElement : ""} ${isCompz ? styles.compzElement : ""} ${isExpandable ? styles.expandable : ""} ${isExpanded ? styles.expanded : ""} ${isElided ? styles.elidedElement : ""}`}
                onClick={isExpandable && elem.expandsTo ? () => onToggle(elem.expandsTo!) : undefined}
                disabled={!isExpandable}
                title={elem.explanation}
            >
                <span className={styles.roleTag} style={{ color }}>{elem.role}</span>
                <span className={styles.elementText}>{elem.text}</span>
                <span className={styles.elementBar} style={{ backgroundColor: color }} />
                <span className={styles.labelText}>
                    {advancedMode ? elem.advancedLabel : elem.beginnerLabel}
                </span>
            </button>

            {isExpandable && (
                <span
                    className={styles.expandHint}
                    onClick={elem.expandsTo ? () => onToggle(elem.expandsTo!) : undefined}
                >
                    {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                    {isExpanded ? "閉じる" : "展開"}
                </span>
            )}
        </div>
    );
}

// ── Recursive clause elements renderer ──

function ClauseElements({
    clause,
    clauseMap,
    expandedClauses,
    onToggle,
    advancedMode,
    depth,
}: {
    clause: Clause;
    clauseMap: Map<string, Clause>;
    expandedClauses: Set<string>;
    onToggle: (id: string) => void;
    advancedMode: boolean;
    depth: number;
}) {
    const rowRef = useRef<HTMLDivElement>(null);
    const [arrowState, setArrowState] = useState<{
        arrows: ArrowDatum[];
        width: number;
        height: number;
    }>({ arrows: [], width: 0, height: 0 });

    const computeArrows = useCallback(() => {
        const row = rowRef.current;
        if (!row) return;

        const result: ArrowDatum[] = [];
        const rowRect = row.getBoundingClientRect();

        clause.elements.forEach((elem, i) => {
            if (!elem.arrowType || elem.modifiesIndex == null) return;
            if (elem.arrowType === "insertion") return;
            if (elem.modifiesIndex === i) return;

            const fromEl = row.querySelector(`[data-elem-idx="${i}"]`) as HTMLElement | null;
            const toEl = row.querySelector(`[data-elem-idx="${elem.modifiesIndex}"]`) as HTMLElement | null;
            if (!fromEl || !toEl) return;

            const fromRect = fromEl.getBoundingClientRect();
            const toRect = toEl.getBoundingClientRect();

            result.push({
                x1: fromRect.left + fromRect.width / 2 - rowRect.left,
                x2: toRect.left + toRect.width / 2 - rowRect.left,
                label: elem.arrowType === "modifies" ? "修飾"
                    : elem.arrowType === "complement" ? "補語関係"
                        : "照応",
                color: ROLE_COLORS[elem.role] ?? "#999",
            });
        });

        if (result.length > 0) {
            const maxArc = Math.max(...result.map(a => Math.min(44, Math.abs(a.x2 - a.x1) * 0.25 + 14)));
            setArrowState({
                arrows: result,
                width: row.scrollWidth,
                height: maxArc + 22,
            });
        } else {
            setArrowState({ arrows: [], width: 0, height: 0 });
        }
    }, [clause.elements]);

    useEffect(() => {
        const rafId = requestAnimationFrame(computeArrows);
        const row = rowRef.current;
        if (!row) return () => cancelAnimationFrame(rafId);

        const observer = new ResizeObserver(computeArrows);
        observer.observe(row);
        return () => {
            cancelAnimationFrame(rafId);
            observer.disconnect();
        };
    }, [computeArrows]);

    const { arrows, width: svgWidth, height: svgHeight } = arrowState;

    return (
        <div className={styles.clauseBlock}>
            {/* Sub-clause header */}
            {depth > 0 && (
                <div className={styles.subClauseHeader}>
                    <span className={styles.subClauseLabel}>{clause.typeLabel}</span>
                    {clause.sentencePatternLabel && (
                        <span className={styles.subPatternBadge}>{clause.sentencePatternLabel}</span>
                    )}
                    {clause.modifierScope && (
                        <span className={styles.scopeBadge}>
                            {clause.modifierScope === "noun_phrase" ? "名詞修飾"
                                : clause.modifierScope === "verb_phrase" ? "動詞修飾"
                                    : "文修飾"}
                        </span>
                    )}
                </div>
            )}

            {/* Elements row + SVG arrows */}
            <div className={styles.elementsSection}>
                <div className={styles.elementsRow} ref={rowRef}>
                    {(() => {
                        // Build V-complex groups: elements sharing a vChainId (+ bridging elements between)
                        const vcGroups = new Map<string, number[]>();
                        clause.elements.forEach((elem, i) => {
                            if (elem.vChainId) {
                                const arr = vcGroups.get(elem.vChainId) ?? [];
                                arr.push(i);
                                vcGroups.set(elem.vChainId, arr);
                            }
                        });
                        // Include bridging elements by sentence position (startIndex range)
                        // LLM may output elements out of sentence order, so array indices are unreliable
                        for (const indices of vcGroups.values()) {
                            if (indices.length < 2) continue;
                            const minStart = Math.min(...indices.map(idx => clause.elements[idx].startIndex ?? Infinity));
                            const maxEnd = Math.max(...indices.map(idx => clause.elements[idx].endIndex ?? -1));
                            clause.elements.forEach((elem, k) => {
                                if (indices.includes(k)) return;
                                if (elem.startIndex == null || elem.startIndex < 0) return;
                                if (elem.startIndex >= minStart && (elem.endIndex ?? elem.startIndex) <= maxEnd) {
                                    indices.push(k);
                                }
                            });
                            // Sort by sentence position
                            indices.sort((a, b) => (clause.elements[a].startIndex ?? 0) - (clause.elements[b].startIndex ?? 0));
                        }
                        // Only keep groups with 2+ members
                        const groupedIndices = new Set<number>();
                        const groupByIndex = new Map<number, string>();
                        for (const [vcId, indices] of vcGroups) {
                            if (indices.length < 2) continue;
                            for (const idx of indices) {
                                groupedIndices.add(idx);
                                groupByIndex.set(idx, vcId);
                            }
                        }

                        // Build render items
                        type RenderItem = { type: "solo"; idx: number } | { type: "group"; vcId: string; indices: number[] };
                        const items: RenderItem[] = [];
                        const handled = new Set<number>();
                        for (let i = 0; i < clause.elements.length; i++) {
                            if (handled.has(i)) continue;
                            const vcId = groupByIndex.get(i);
                            if (vcId) {
                                const indices = vcGroups.get(vcId)!;
                                items.push({ type: "group", vcId, indices });
                                indices.forEach(idx => handled.add(idx));
                            } else {
                                items.push({ type: "solo", idx: i });
                                handled.add(i);
                            }
                        }

                        // Sort render items by sentence position
                        items.sort((a, b) => {
                            const aIdx = a.type === "solo" ? a.idx : a.indices[0];
                            const bIdx = b.type === "solo" ? b.idx : b.indices[0];
                            const aStart = clause.elements[aIdx]?.startIndex ?? 0;
                            const bStart = clause.elements[bIdx]?.startIndex ?? 0;
                            return aStart - bStart;
                        });

                        return items.map((item, gi) => {
                            if (item.type === "solo") {
                                return renderElement(clause.elements[item.idx], item.idx, expandedClauses, onToggle, advancedMode);
                            }
                            return (
                                <div key={`vc-${gi}`} className={styles.vComplexGroup}>
                                    {item.indices.map(idx =>
                                        renderElement(clause.elements[idx], idx, expandedClauses, onToggle, advancedMode),
                                    )}
                                </div>
                            );
                        });
                    })()}
                </div>

                {/* SVG modifier arrows */}
                {arrows.length > 0 && (() => {
                    return (
                        <svg
                            className={styles.arrowSvg}
                            width={svgWidth}
                            height={svgHeight}
                        >
                            <defs>
                                {arrows.map((a, i) => (
                                    <marker
                                        key={`n-${i}`}
                                        id={`ah-${clause.clauseId}-n${i}`}
                                        markerWidth="8"
                                        markerHeight="6"
                                        refX="7"
                                        refY="3"
                                        orient="auto"
                                    >
                                        <polygon points="0 0, 8 3, 0 6" fill={a.color} />
                                    </marker>
                                ))}
                            </defs>
                            {arrows.map((a, i) => {
                                const midX = (a.x1 + a.x2) / 2;
                                const dist = Math.abs(a.x2 - a.x1);
                                const arcY = Math.min(44, dist * 0.25 + 14);
                                const baseY = 2;

                                return (
                                    <g key={`norm-${i}`}>
                                        <path
                                            d={`M ${a.x1},${baseY} Q ${midX},${baseY + arcY} ${a.x2},${baseY}`}
                                            fill="none"
                                            stroke={a.color}
                                            strokeWidth={1.5}
                                            strokeDasharray="4 2"
                                            markerEnd={`url(#ah-${clause.clauseId}-n${i})`}
                                        />
                                        <text
                                            x={midX}
                                            y={baseY + arcY + 14}
                                            textAnchor="middle"
                                            className={styles.arrowSvgLabel}
                                            fill={a.color}
                                        >
                                            {a.label}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                    );
                })()}
            </div>

            {/* Expanded sub-clause panels — below the row */}
            {clause.elements.map((elem, i) => {
                if (!elem.expandsTo) return null;
                const isExpanded = expandedClauses.has(elem.expandsTo);
                const subClause = clauseMap.get(elem.expandsTo);
                if (!isExpanded || !subClause) return null;

                const parentColor = ROLE_COLORS[elem.role];
                const truncated = elem.text.length > 30
                    ? elem.text.slice(0, 30) + "…"
                    : elem.text;

                return (
                    <div
                        key={`panel-${i}`}
                        className={styles.expandedPanel}
                        style={{
                            borderLeftColor: parentColor,
                            "--clause-depth": depth,
                        } as React.CSSProperties}
                    >
                        <div className={styles.panelOrigin}>
                            <span
                                className={styles.panelOriginTag}
                                style={{ backgroundColor: parentColor }}
                            >
                                {elem.role}
                            </span>
                            <span className={styles.panelOriginText}>
                                {truncated}
                            </span>
                            <span className={styles.panelOriginArrow}>の内部構造</span>
                        </div>
                        <ClauseElements
                            clause={subClause}
                            clauseMap={clauseMap}
                            expandedClauses={expandedClauses}
                            onToggle={onToggle}
                            advancedMode={advancedMode}
                            depth={depth + 1}
                        />
                    </div>
                );
            })}
        </div>
    );
}
