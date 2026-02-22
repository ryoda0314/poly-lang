"use client";

import Link from "next/link";
import { useAppStore } from "@/store/app-context";
import styles from "./page.module.css";

export default function HeaderNav() {
    const { isLoggedIn, isLoading } = useAppStore();

    if (isLoading) return null;

    if (isLoggedIn) {
        return (
            <nav className={styles.headerNav}>
                <Link href="/app" className={styles.registerButton}>アプリへ</Link>
            </nav>
        );
    }

    return (
        <nav className={styles.headerNav}>
            <Link href="/login" className={styles.loginLink}>ログイン</Link>
            <Link href="/register" className={styles.registerButton}>無料で始める</Link>
        </nav>
    );
}
