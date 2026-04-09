"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import styles from "./EtymologyStory.module.css";

interface Props {
    story: string;
}

export default function EtymologyStory({ story }: Props) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!story) return null;

    const isLong = story.length > 150;
    const displayText = isLong && !isExpanded ? story.slice(0, 150) + "..." : story;

    return (
        <div className={styles.container}>
            <button className={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
                <BookOpen size={16} className={styles.icon} />
                <span className={styles.title}>語源ストーリー</span>
                {isLong && (
                    isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                )}
            </button>
            <p className={styles.text}>{displayText}</p>
        </div>
    );
}
