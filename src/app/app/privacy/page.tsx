"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import styles from "./page.module.css";

export default function PrivacyPolicyPage() {
    const { nativeLanguage } = useAppStore();
    const t = translations[nativeLanguage] as any;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/app/settings" className={styles.backButton}>
                    <ArrowLeft size={20} />
                </Link>
                <h1 className={styles.title}>{t.privacyPolicy || "プライバシーポリシー"}</h1>
            </header>

            <div className={styles.content}>
                <p className={styles.lastUpdated}>最終更新日: 2025年1月30日</p>

                <section className={styles.section}>
                    <h2>1. はじめに</h2>
                    <p>
                        PolyLinga（以下「本サービス」）は、お客様のプライバシーを尊重し、
                        個人情報の保護に努めています。本プライバシーポリシーは、本サービスが
                        どのようにお客様の情報を収集、使用、保護するかについて説明します。
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>2. 収集する情報</h2>
                    <p>本サービスは以下の情報を収集する場合があります：</p>
                    <ul>
                        <li>
                            <strong>アカウント情報：</strong>
                            メールアドレス、ユーザー名、パスワード（暗号化済み）
                        </li>
                        <li>
                            <strong>プロフィール情報：</strong>
                            学習言語、母語、性別（任意）
                        </li>
                        <li>
                            <strong>学習データ：</strong>
                            学習したフレーズ、進捗状況、学習履歴
                        </li>
                        <li>
                            <strong>利用情報：</strong>
                            アプリの使用状況、機能の利用回数
                        </li>
                        <li>
                            <strong>デバイス情報：</strong>
                            デバイスの種類、ブラウザの種類、IPアドレス
                        </li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>3. 情報の利用目的</h2>
                    <p>収集した情報は以下の目的で使用されます：</p>
                    <ul>
                        <li>サービスの提供および改善</li>
                        <li>パーソナライズされた学習体験の提供</li>
                        <li>学習進捗の追跡と分析</li>
                        <li>カスタマーサポートの提供</li>
                        <li>サービスに関する重要なお知らせの送信</li>
                        <li>不正利用の防止およびセキュリティの維持</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>4. 情報の共有</h2>
                    <p>
                        お客様の個人情報は、以下の場合を除き、第三者と共有されることはありません：
                    </p>
                    <ul>
                        <li>お客様の同意がある場合</li>
                        <li>法令に基づく開示要求があった場合</li>
                        <li>サービス提供に必要な業務委託先との共有（厳格な守秘義務あり）</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>5. データの保護</h2>
                    <p>
                        お客様のデータを保護するため、業界標準のセキュリティ対策を実施しています：
                    </p>
                    <ul>
                        <li>SSL/TLS暗号化による通信の保護</li>
                        <li>パスワードの暗号化保存</li>
                        <li>定期的なセキュリティ監査</li>
                        <li>アクセス制限による情報管理</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>6. Cookie（クッキー）の使用</h2>
                    <p>
                        本サービスでは、ログイン状態の維持やユーザー体験の向上のために
                        Cookieを使用しています。ブラウザの設定でCookieを無効にすることも
                        できますが、一部の機能が利用できなくなる可能性があります。
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>7. お客様の権利</h2>
                    <p>お客様には以下の権利があります：</p>
                    <ul>
                        <li>個人情報へのアクセス権</li>
                        <li>情報の訂正を求める権利</li>
                        <li>アカウントの削除を求める権利</li>
                        <li>データのエクスポートを求める権利</li>
                    </ul>
                    <p>
                        これらの権利を行使する場合は、設定画面またはサポートまでお問い合わせください。
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>8. 子どもの個人情報</h2>
                    <p>
                        本サービスは、13歳未満のお子様からの個人情報を意図的に収集することは
                        ありません。13歳未満のお子様がサービスを利用する場合は、保護者の
                        同意が必要です。
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>9. ポリシーの変更</h2>
                    <p>
                        本プライバシーポリシーは、必要に応じて更新されることがあります。
                        重要な変更がある場合は、サービス内でお知らせします。
                        定期的にこのページを確認することをお勧めします。
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>10. お問い合わせ</h2>
                    <p>
                        本プライバシーポリシーに関するご質問やご懸念がある場合は、
                        設定画面の「サポートへ連絡」からお問い合わせください。
                    </p>
                </section>
            </div>
        </div>
    );
}
