import Link from "next/link";
import styles from "./PublicFooter.module.css";

export default function PublicFooter() {
    return (
        <footer className={styles.footer}>
            <div className={styles.inner}>
                <nav className={styles.links}>
                    <Link href="/terms">利用規約</Link>
                    <Link href="/privacy">プライバシーポリシー</Link>
                    <Link href="/tokushoho">特定商取引法に基づく表記</Link>
                </nav>
                <p className={styles.copyright}>&copy; 2026 PolyLinga</p>
            </div>
        </footer>
    );
}
