"use client";

import React from "react";
import { useAppStore } from "@/store/app-context";
import Link from "next/link";
import { ArrowRight, BookOpen, Map } from "lucide-react";
import styles from "./page.module.css"; // We'll create this next

export default function DashboardPage() {
    const { activeLanguage } = useAppStore();

    if (!activeLanguage) return null;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Welcome back.</h1>
                <p className={styles.subtitle}>
                    You are learning <span className={styles.langName}>{activeLanguage.name}</span>.
                </p>
            </header>

            <div className={styles.statsGrid}>
                {/* Mock Stats */}
                <div className={styles.statCard}>
                    <div className={styles.statValue}>12</div>
                    <div className={styles.statLabel}>Days Streak</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>48</div>
                    <div className={styles.statLabel}>Words Explored</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>5</div>
                    <div className={styles.statLabel}>Phrases Mastered</div>
                </div>
            </div>

            <h2 className={styles.sectionTitle}>Continue Learning</h2>
            <div className={styles.actionsGrid}>
                <Link href="/app/phrases" className={styles.actionCard}>
                    <div className={styles.actionIcon}><Map size={24} /></div>
                    <div className={styles.actionContent}>
                        <h3>Explore Phrases</h3>
                        <p>Browse useful phrases and expand your vocabulary.</p>
                    </div>
                    <ArrowRight className={styles.arrow} size={20} />
                </Link>

                <Link href="/app/corrections" className={styles.actionCard}>
                    <div className={styles.actionIcon}><BookOpen size={24} /></div>
                    <div className={styles.actionContent}>
                        <h3>AI Correction</h3>
                        <p>Write a journal entry or sentence and get instant feedback.</p>
                    </div>
                    <ArrowRight className={styles.arrow} size={20} />
                </Link>
            </div>
        </div>
    );
}
