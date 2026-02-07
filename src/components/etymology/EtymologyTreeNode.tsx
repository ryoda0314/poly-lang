"use client";

import { motion } from "framer-motion";
import type { TreeNode } from "@/actions/etymology";
import { getLangColor } from "./lang-colors";
import styles from "./EtymologyTreeNode.module.css";

interface Props {
    node: TreeNode;
    depth: number;
    isSelected?: boolean;
    onSelect?: (node: TreeNode) => void;
}

export default function EtymologyTreeNode({ node, depth, isSelected, onSelect }: Props) {
    const color = getLangColor(node.language);
    const isReconstructed = node.word.startsWith("*");
    const isTargetWord = depth === 0;

    const classNames = [
        styles.node,
        isSelected && styles.selected,
        isReconstructed && styles.reconstructed,
        isTargetWord && styles.targetWord,
    ].filter(Boolean).join(" ");

    return (
        <motion.button
            className={classNames}
            style={{ borderColor: isSelected ? "var(--color-accent)" : isTargetWord ? "var(--color-accent)" : color }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: depth * 0.08, duration: 0.25 }}
            onClick={() => onSelect?.(node)}
        >
            <span className={`${styles.word} ${isReconstructed ? styles.reconstructedWord : ""}`}>
                {node.word}
            </span>
            <span className={styles.langBadge} style={{ background: color }}>
                {node.language}
            </span>
            {node.meaning && (
                <span className={styles.meaning}>{node.meaning}</span>
            )}
            {node.relation && (
                <span className={styles.relation}>{node.relation}</span>
            )}
        </motion.button>
    );
}
