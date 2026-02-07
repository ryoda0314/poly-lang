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

    return (
        <motion.button
            className={`${styles.node} ${isSelected ? styles.selected : ""}`}
            style={{ borderColor: isSelected ? "var(--color-accent)" : color }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: depth * 0.1, duration: 0.3 }}
            onClick={() => onSelect?.(node)}
        >
            <span className={styles.word}>{node.word}</span>
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
