"use client";

import Link from "next/link";
import { useMemo } from "react";
import { translations } from "@/lib/translations";
import { detectBrowserLanguage } from "@/lib/detect-browser-language";
import styles from "./PublicFooter.module.css";

export default function PublicFooter() {
    const t = useMemo(() => {
        const lang = detectBrowserLanguage();
        return translations[lang] || translations.ja;
    }, []);

    return (
        <footer className={styles.footer}>
            <div className={styles.inner}>
                <nav className={styles.links}>
                    <Link href="/terms">{t.termsOfService}</Link>
                    <Link href="/privacy">{t.privacyPolicy}</Link>
                    <Link href="/tokushoho">{t.tokushoho}</Link>
                </nav>
                <p className={styles.copyright}>&copy; 2026 PolyLinga</p>
            </div>
        </footer>
    );
}
