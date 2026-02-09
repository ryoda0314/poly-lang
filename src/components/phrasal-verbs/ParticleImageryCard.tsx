"use client";

import type { ParticleImagery } from "@/actions/phrasal-verbs";
import { ArrowRight } from "lucide-react";
import styles from "./ParticleImageryCard.module.css";

interface Props {
    imagery: ParticleImagery;
    expressionMeaningsCount: number;
}

/** Direction-specific emoji for quick visual recognition */
const DIRECTION_EMOJI: Record<string, string> = {
    up: "⬆", down: "⬇", out: "↗", in: "↙",
    off: "⤴", on: "⊙", over: "⤵", through: "→",
    away: "↝", back: "↩", around: "↻", about: "↻",
    along: "→", other: "◆",
};

export default function ParticleImageryCard({ imagery }: Props) {
    const emoji = DIRECTION_EMOJI[imagery.direction] || "◆";

    return (
        <div className={styles.card}>
            {/* Visual hero: large particle with direction */}
            <div className={styles.heroRow}>
                <div className={`${styles.directionBubble} ${styles[`dir_${imagery.direction}`]}`}>
                    <span className={styles.directionEmoji}>{emoji}</span>
                </div>
                <div className={styles.heroText}>
                    <div className={styles.particleName}>{imagery.particle}</div>
                    <div className={styles.coreLabel}>{imagery.coreImage}</div>
                </div>
            </div>

            {/* Core image explanation */}
            <p className={styles.coreExplanation}>{imagery.coreImageDetail}</p>

            {/* Derivation flow */}
            {imagery.meaningDerivations.length > 0 && (
                <div className={styles.derivations}>
                    <div className={styles.subheader}>この表現での派生</div>
                    {imagery.meaningDerivations.map((d, i) => (
                        <div key={i} className={styles.derivRow}>
                            <div className={styles.derivIcon}>
                                <ArrowRight size={12} />
                            </div>
                            <div className={styles.derivBody}>
                                <span className={styles.derivMeaning}>{d.meaning}</span>
                                <span className={styles.derivConn}>{d.connection}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Same particle pattern */}
            {imagery.sameParticleExamples.length > 0 && (
                <div className={styles.patternSection}>
                    <div className={styles.subheader}>
                        「{imagery.particle}」の同パターン
                    </div>
                    <div className={styles.patternGrid}>
                        {imagery.sameParticleExamples.map((ex, i) => (
                            <div key={i} className={styles.patternChip}>
                                <span className={styles.patternExpr}>{ex.expression}</span>
                                <span className={styles.patternMean}>{ex.meaning}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
