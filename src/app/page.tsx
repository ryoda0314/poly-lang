import Link from "next/link";
import PublicFooter from "@/components/PublicFooter";
import AuthRedirect from "./AuthRedirect";
import styles from "./page.module.css";

export default function HomePage() {
    return (
        <div className={styles.container}>
            <AuthRedirect />

            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <h1 className={styles.logo}>PolyLinga</h1>
                    <nav className={styles.headerNav}>
                        <Link href="/login" className={styles.loginLink}>ログイン</Link>
                        <Link href="/register" className={styles.registerButton}>無料で始める</Link>
                    </nav>
                </div>
            </header>

            {/* Hero */}
            <section className={styles.hero}>
                <h2 className={styles.heroTitle}>AIで、語学学習を革新する</h2>
                <p className={styles.heroSub}>
                    PolyLingaは、AIを活用した革新的な語学学習アプリです。<br />
                    多言語対応で、あなたに最適な学習体験を提供します。
                </p>
                <Link href="/register" className={styles.heroCta}>今すぐ無料で始める</Link>
            </section>

            {/* Features */}
            <section className={styles.features}>
                <h3 className={styles.sectionTitle}>主な機能</h3>
                <div className={styles.featureGrid}>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>&#128218;</div>
                        <h4>フレーズ学習</h4>
                        <p>日常会話から専門用語まで、多彩なフレーズを学習・保存できます。</p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>&#127908;</div>
                        <h4>音声合成</h4>
                        <p>ネイティブに近い自然な発音でフレーズを読み上げます。</p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>&#127897;</div>
                        <h4>発音評価</h4>
                        <p>AIがあなたの発音を分析し、改善ポイントをフィードバックします。</p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>&#9998;</div>
                        <h4>文章添削</h4>
                        <p>書いた文章をAIが添削し、自然な表現を提案します。</p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>&#128214;</div>
                        <h4>文法解説</h4>
                        <p>フレーズの文法構造を分かりやすく解説します。</p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>&#128247;</div>
                        <h4>画像からフレーズ抽出</h4>
                        <p>写真や画像からテキストを読み取り、学習フレーズに変換します。</p>
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section className={styles.pricing}>
                <h3 className={styles.sectionTitle}>プラン・料金</h3>
                <p className={styles.pricingIntro}>無料プランで始めて、必要に応じてアップグレードできます。</p>
                <div className={styles.planGrid}>
                    <div className={styles.planCard}>
                        <h4>無料プラン</h4>
                        <p className={styles.planPrice}>¥0</p>
                        <p>基本機能を毎日の回数制限内で利用可能</p>
                    </div>
                    <div className={styles.planCard}>
                        <h4>会話強化プラン</h4>
                        <p className={styles.planPrice}>¥980<span>/月</span></p>
                        <p>会話に関連する機能の使用回数が大幅アップ</p>
                    </div>
                    <div className={styles.planCard}>
                        <h4>アウトプット強化プラン</h4>
                        <p className={styles.planPrice}>¥980<span>/月</span></p>
                        <p>添削・作文に特化した機能が充実</p>
                    </div>
                    <div className={styles.planCard}>
                        <h4>インプット強化プラン</h4>
                        <p className={styles.planPrice}>¥1,480<span>/月</span></p>
                        <p>リーディング・リスニング機能が充実</p>
                    </div>
                    <div className={styles.planCard}>
                        <h4>受験対策プラン</h4>
                        <p className={styles.planPrice}>¥1,480<span>/月</span></p>
                        <p>試験対策に特化した学習プラン</p>
                    </div>
                    <div className={styles.planCard + " " + styles.planHighlight}>
                        <h4>Proプラン</h4>
                        <p className={styles.planPrice}>¥2,980<span>/月</span></p>
                        <p>全機能が使い放題のプレミアムプラン</p>
                    </div>
                </div>
                <p className={styles.pricingNote}>
                    コインパック（100円〜5,000円）で追加クレジットも購入可能です。<br />
                    決済はStripeにより安全に処理されます。
                </p>
            </section>

            {/* About */}
            <section className={styles.about}>
                <h3 className={styles.sectionTitle}>運営情報</h3>
                <dl className={styles.aboutList}>
                    <dt>サービス名</dt>
                    <dd>PolyLinga</dd>
                    <dt>運営</dt>
                    <dd>POLYLINGA</dd>
                    <dt>お問い合わせ</dt>
                    <dd>learnguages.poly@gmail.com</dd>
                </dl>
            </section>

            <PublicFooter />
        </div>
    );
}
