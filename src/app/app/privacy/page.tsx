"use client";

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
                <p className={styles.lastUpdated}>最終更新日: 2026年1月30日</p>

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
                    <p>本サービスは以下の情報を収集します：</p>

                    <h3>アカウント・プロフィール情報</h3>
                    <ul>
                        <li>メールアドレス、ユーザー名、パスワード（暗号化済み）</li>
                        <li>学習言語、母語、性別（任意）</li>
                        <li>サブスクリプションプラン、コイン残高</li>
                    </ul>

                    <h3>学習データ</h3>
                    <ul>
                        <li>学習したフレーズ、保存したフレーズコレクション</li>
                        <li>気付きメモ（単語の理解度、復習スケジュール）</li>
                        <li>学習イベントログ（フレーズ閲覧、音声再生、添削リクエスト等）</li>
                        <li>XP、レベル、ストリーク、バッジ等の進捗データ</li>
                    </ul>

                    <h3>機能利用時に収集するデータ</h3>
                    <ul>
                        <li>
                            <strong>音声機能：</strong>
                            発音評価のために録音した音声データ、発音スコア
                        </li>
                        <li>
                            <strong>画像抽出機能：</strong>
                            アップロードされた画像（フレーズ抽出のため）
                        </li>
                        <li>
                            <strong>添削機能：</strong>
                            添削のために送信されたテキスト
                        </li>
                    </ul>

                    <h3>利用情報</h3>
                    <ul>
                        <li>各機能の日次使用回数</li>
                        <li>ログイン日、最終アクティビティ日時</li>
                        <li>デバイスの種類（発音評価時、任意）</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>3. 第三者サービスへのデータ送信</h2>
                    <p>
                        本サービスの機能を提供するため、以下の第三者サービスにデータを送信します：
                    </p>
                    <ul>
                        <li>
                            <strong>OpenAI：</strong>
                            テキスト添削、文法解説、関連フレーズ生成、画像からのフレーズ抽出、
                            発音評価（Whisper）のために、テキスト・音声・画像データを送信
                        </li>
                        <li>
                            <strong>Google (Gemini)：</strong>
                            音声合成（テキスト読み上げ）のためにテキストを送信
                        </li>
                        <li>
                            <strong>Supabase：</strong>
                            認証およびデータベースサービスとして、全ユーザーデータを保存
                        </li>
                    </ul>
                    <p>
                        これらのサービスは各社のプライバシーポリシーに従ってデータを処理します。
                        AIサービスに送信されたデータはAI機能の処理のみに使用されます。
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>4. 情報の利用目的</h2>
                    <p>収集した情報は以下の目的で使用されます：</p>
                    <ul>
                        <li>語学学習サービスの提供（添削、音声合成、発音評価等）</li>
                        <li>学習進捗の追跡と分析</li>
                        <li>パーソナライズされた学習体験の提供</li>
                        <li>利用制限の管理（日次使用回数の確認）</li>
                        <li>サービスに関する重要なお知らせの送信</li>
                        <li>不正利用の防止およびセキュリティの維持</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>5. 情報の共有</h2>
                    <p>
                        お客様の個人情報は、以下の場合を除き、第三者と共有されることはありません：
                    </p>
                    <ul>
                        <li>上記「第三者サービスへのデータ送信」に記載のサービス提供者</li>
                        <li>法令に基づく開示要求があった場合</li>
                        <li>お客様の同意がある場合</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>6. データの保護</h2>
                    <p>
                        お客様のデータを保護するため、以下のセキュリティ対策を実施しています：
                    </p>
                    <ul>
                        <li>SSL/TLS暗号化による通信の保護</li>
                        <li>パスワードの暗号化保存</li>
                        <li>行レベルセキュリティ（RLS）による他ユーザーデータへのアクセス制限</li>
                        <li>入力値のサニタイズ処理（文字数制限、不正文字の除去）</li>
                        <li>ファイルサイズ制限（音声ファイル: 10MB）</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>7. Cookie（クッキー）の使用</h2>
                    <p>
                        本サービスでは、ログイン状態の維持のためにCookieを使用しています。
                        外部の広告トラッキングサービスは使用していません。
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>8. お客様の権利</h2>
                    <p>お客様には以下の権利があります：</p>
                    <ul>
                        <li>個人情報へのアクセス権</li>
                        <li>情報の訂正を求める権利</li>
                        <li>アカウントの削除を求める権利</li>
                    </ul>
                    <p>
                        これらの権利を行使する場合は、設定画面またはサポートまでお問い合わせください。
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>9. 子どもの個人情報</h2>
                    <p>
                        本サービスは、13歳未満のお子様からの個人情報を意図的に収集することは
                        ありません。13歳未満のお子様がサービスを利用する場合は、保護者の
                        同意が必要です。
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>10. ポリシーの変更</h2>
                    <p>
                        本プライバシーポリシーは、必要に応じて更新されることがあります。
                        重要な変更がある場合は、サービス内でお知らせします。
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>11. お問い合わせ</h2>
                    <p>
                        本プライバシーポリシーに関するご質問がある場合は、
                        設定画面の「サポートへ連絡」からお問い合わせください。
                    </p>
                </section>
            </div>
        </div>
    );
}
