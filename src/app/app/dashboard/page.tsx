"use client";

import React from "react";
import { useAppStore } from "@/store/app-context";
import Link from "next/link";
import { ArrowRight, BookOpen, Map } from "lucide-react";
import styles from "./page.module.css"; // We'll create this next

export default function DashboardPage() {
    const { activeLanguage, profile, user } = useAppStore();

    if (!activeLanguage) return null;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Welcome back, {profile?.username || user?.email?.split("@")[0] || "Learner"}.</h1>
                <p className={styles.subtitle}>
                    <span className={styles.langName}>{activeLanguage.name}</span> is waiting for you.
                </p>
            </header>

            <h2 className={styles.sectionTitle}>Keep Going</h2>
            <div className={styles.actionsGrid}>
                <Link href="/app/phrases" className={styles.actionCard}>
                    <div className={styles.actionIcon}><Map size={24} /></div>
                    <div className={styles.actionContent}>
                        <h3>Explore phrases</h3>
                        <p>Little things you can start saying.</p>
                    </div>
                    <ArrowRight className={styles.arrow} size={20} />
                </Link>

                <Link href="/app/corrections" className={styles.actionCard}>
                    <div className={styles.actionIcon}><BookOpen size={24} /></div>
                    <div className={styles.actionContent}>
                        <h3>Say it your way</h3>
                        <p>We’ll help you say it more naturally.</p>
                    </div>
                    <ArrowRight className={styles.arrow} size={20} />
                </Link>
            </div>
        </div>
    );
}
