"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { TreeNode } from "@/actions/etymology";
import EtymologyTreeNode from "./EtymologyTreeNode";
import styles from "./EtymologyTree.module.css";

interface Props {
    tree: TreeNode;
    onNodeSelect?: (node: TreeNode) => void;
}

interface Line {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export default function EtymologyTree({ tree, onNodeSelect }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [lines, setLines] = useState<Line[]>([]);
    const [selectedWord, setSelectedWord] = useState<string | null>(null);

    const handleSelect = useCallback((node: TreeNode) => {
        setSelectedWord(node.word);
        onNodeSelect?.(node);
    }, [onNodeSelect]);

    // Calculate connector lines after render
    useEffect(() => {
        const calculateLines = () => {
            if (!containerRef.current) return;

            const container = containerRef.current;
            const containerRect = container.getBoundingClientRect();
            const newLines: Line[] = [];

            // Find all parent-child pairs via data attributes
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

        // Small delay to ensure DOM is rendered
        const timer = setTimeout(calculateLines, 100);

        const observer = new ResizeObserver(calculateLines);
        if (containerRef.current) observer.observe(containerRef.current);

        return () => {
            clearTimeout(timer);
            observer.disconnect();
        };
    }, [tree]);

    const renderNode = (node: TreeNode, depth: number, parentId: string | null): React.ReactNode => {
        const nodeId = `${depth}-${node.word}-${node.language}`;

        return (
            <div key={nodeId} className={styles.nodeGroup}>
                <div
                    className={styles.nodeWrapper}
                    data-tree-id={nodeId}
                    data-tree-parent={parentId}
                >
                    <EtymologyTreeNode
                        node={node}
                        depth={depth}
                        isSelected={selectedWord === node.word}
                        onSelect={handleSelect}
                    />
                </div>
                {node.children && node.children.length > 0 && (
                    <div className={styles.childrenRow}>
                        {node.children.map((child) => renderNode(child, depth + 1, nodeId))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.label}>語源の家系図</div>
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
                    {renderNode(tree, 0, null)}
                </div>
            </div>
        </div>
    );
}
