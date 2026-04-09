"use client";

import { motion } from "framer-motion";
import type { CompoundTree } from "@/actions/etymology";
import { getLangColor } from "./lang-colors";
import styles from "./EtymologyPartFlow.module.css";

interface Props {
    tree: CompoundTree;
}

function CompoundNode({ node, depth = 0 }: { node: CompoundTree; depth?: number }) {
    // Leaf node (no components) — oldest ancestor
    if (!node.components || node.components.length === 0) {
        return (
            <motion.div
                className={styles.leafNode}
                style={{ borderColor: getLangColor(node.language) }}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: depth * 0.05, duration: 0.25 }}
            >
                <span className={styles.nodeForm}>{node.form}</span>
                <span className={styles.nodeLang} style={{ background: getLangColor(node.language) }}>
                    {node.language}
                </span>
                {node.meaning && <span className={styles.nodeMeaning}>{node.meaning}</span>}
            </motion.div>
        );
    }

    const count = node.components.length;

    return (
        <div className={styles.mergeGroup}>
            {/* Children (rendered recursively, side by side) */}
            <div className={styles.branches} style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
                {node.components.map((comp, i) => (
                    <div key={i} className={styles.branch}>
                        <CompoundNode node={comp} depth={(depth ?? 0) + 1} />
                    </div>
                ))}
            </div>

            {/* Connector lines */}
            {count === 1 ? (
                <div className={styles.straightLine} />
            ) : (
                <div
                    className={styles.mergeConnector}
                    style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}
                >
                    {node.components.map((_, i) => (
                        <div
                            key={i}
                            className={`${styles.connectorCell} ${
                                i === 0
                                    ? styles.connectorFirst
                                    : i === count - 1
                                      ? styles.connectorLast
                                      : styles.connectorMiddle
                            }`}
                        />
                    ))}
                </div>
            )}

            {/* Merged result node */}
            <motion.div
                className={styles.mergedNode}
                style={{ borderColor: getLangColor(node.language) }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (depth ?? 0) * 0.05 + 0.1, duration: 0.25 }}
            >
                <span className={styles.nodeFormBold}>{node.form}</span>
                <span className={styles.nodeLang} style={{ background: getLangColor(node.language) }}>
                    {node.language}
                </span>
                {node.meaning && <span className={styles.nodeMeaning}>{node.meaning}</span>}
            </motion.div>
        </div>
    );
}

export default function EtymologyPartFlow({ tree }: Props) {
    return (
        <div className={styles.container}>
            <div className={styles.label}>部品の合成</div>
            <div className={styles.scrollWrapper}>
                <div className={styles.treeArea}>
                    <CompoundNode node={tree} />
                </div>
            </div>
        </div>
    );
}
