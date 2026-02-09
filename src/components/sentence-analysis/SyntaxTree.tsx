"use client";

import { useRef, useEffect, useState } from "react";
import type { SyntaxTreeNode } from "@/actions/sentence-analysis";
import styles from "./SyntaxTree.module.css";

interface Props {
    tree: SyntaxTreeNode;
}

interface Line {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export default function SyntaxTree({ tree }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [lines, setLines] = useState<Line[]>([]);

    useEffect(() => {
        const calculateLines = () => {
            if (!containerRef.current) return;
            const container = containerRef.current;
            const containerRect = container.getBoundingClientRect();
            const newLines: Line[] = [];

            const nodes = container.querySelectorAll("[data-tree-id]");
            nodes.forEach((parentEl) => {
                const parentId = parentEl.getAttribute("data-tree-id");
                const children = container.querySelectorAll(`[data-tree-parent="${parentId}"]`);

                children.forEach((childEl) => {
                    const pRect = parentEl.getBoundingClientRect();
                    const cRect = childEl.getBoundingClientRect();

                    newLines.push({
                        x1: pRect.left + pRect.width / 2 - containerRect.left,
                        y1: pRect.bottom - containerRect.top,
                        x2: cRect.left + cRect.width / 2 - containerRect.left,
                        y2: cRect.top - containerRect.top,
                    });
                });
            });

            setLines(newLines);
        };

        const timer = setTimeout(calculateLines, 100);
        const observer = new ResizeObserver(calculateLines);
        if (containerRef.current) observer.observe(containerRef.current);

        return () => {
            clearTimeout(timer);
            observer.disconnect();
        };
    }, [tree]);

    const renderNode = (node: SyntaxTreeNode, depth: number, index: number, parentId: string | null): React.ReactNode => {
        const nodeId = `${depth}-${index}-${node.label}`;
        const isLeaf = !node.children || node.children.length === 0;

        return (
            <div key={nodeId} className={styles.nodeGroup}>
                <div
                    className={styles.nodeWrapper}
                    data-tree-id={nodeId}
                    data-tree-parent={parentId}
                >
                    <div className={`${styles.node} ${isLeaf ? styles.leafNode : styles.phraseNode}`}>
                        <span className={styles.nodeLabel}>{node.label}</span>
                        {!isLeaf && (
                            <span className={styles.nodeLabelJa}>{node.labelJa}</span>
                        )}
                        {isLeaf && (
                            <span className={styles.nodeText}>{node.text}</span>
                        )}
                    </div>
                </div>
                {!isLeaf && (
                    <div className={styles.childrenRow}>
                        {node.children.map((child, i) => renderNode(child, depth + 1, i, nodeId))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.label}>構文ツリー</div>
            <div className={styles.scrollWrapper}>
                <div className={styles.treeContainer} ref={containerRef}>
                    <svg className={styles.connectorSvg}>
                        {lines.map((line, i) => {
                            const midY = (line.y1 + line.y2) / 2;
                            return (
                                <path
                                    key={i}
                                    d={`M ${line.x1} ${line.y1} C ${line.x1} ${midY}, ${line.x2} ${midY}, ${line.x2} ${line.y2}`}
                                    className={styles.connector}
                                />
                            );
                        })}
                    </svg>
                    {renderNode(tree, 0, 0, null)}
                </div>
            </div>
        </div>
    );
}
