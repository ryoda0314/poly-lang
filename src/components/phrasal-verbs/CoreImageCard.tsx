"use client";

import type { CoreImage } from "@/actions/phrasal-verbs";
import { ArrowRight } from "lucide-react";
import styles from "./CoreImageCard.module.css";

interface Props {
    coreImage: CoreImage;
    expression: string;
}

export default function CoreImageCard({ coreImage, expression }: Props) {
    return (
        <div className={styles.card}>
            {/* Hero: expression label + core image label */}
            <div className={styles.heroRow}>
                <div className={styles.imageBubble}>
                    <span className={styles.imageEmoji}>💡</span>
                </div>
                <div className={styles.heroText}>
                    <div className={styles.expressionLabel}>{expression}</div>
                    <div className={styles.coreLabel}>{coreImage.coreImage}</div>
                </div>
            </div>

            {/* Literal scene */}
            {coreImage.literalScene && (
                <div className={styles.sceneBox}>
                    <div className={styles.sceneLabel}>イメージの原風景</div>
                    <p className={styles.sceneText}>{coreImage.literalScene}</p>
                </div>
            )}

            {/* Core explanation — how the image connects to meanings */}
            <p className={styles.coreExplanation}>{coreImage.coreImageDetail}</p>

            {/* Derivation flow: core image → each meaning */}
            {coreImage.meaningDerivations.length > 0 && (
                <div className={styles.derivations}>
                    <div className={styles.subheader}>核イメージからの派生</div>
                    {coreImage.meaningDerivations.map((d, i) => (
                        <div key={i} className={styles.derivRow}>
                            <div className={styles.derivIcon}>
                                <ArrowRight size={12} />
                            </div>
                            <div className={styles.derivBody}>
                                <span className={styles.derivMeaning}>{d.meaning}</span>
                                <span className={styles.derivConn}>{d.fromCore}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
