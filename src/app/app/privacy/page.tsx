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
                <p className={styles.lastUpdated}>{t.privacyLastUpdated || "最終更新日: 2026年1月30日"}</p>

                <section className={styles.section}>
                    <h2>{t.privacySection1Title || "1. はじめに"}</h2>
                    <p>{t.privacySection1Content || "PolyLinga（以下「本サービス」）は、お客様のプライバシーを尊重し、個人情報の保護に努めています。本プライバシーポリシーは、本サービスがどのようにお客様の情報を収集、使用、保護するかについて説明します。"}</p>
                </section>

                <section className={styles.section}>
                    <h2>{t.privacySection2Title || "2. 収集する情報"}</h2>
                    <p>{t.privacySection2Intro || "本サービスは以下の情報を収集します："}</p>

                    <h3>{t.privacyAccountInfoTitle || "アカウント・プロフィール情報"}</h3>
                    <ul>
                        <li>{t.privacyAccountInfo1 || "メールアドレス、ユーザー名、パスワード（暗号化済み）"}</li>
                        <li>{t.privacyAccountInfo2 || "学習言語、母語、性別（任意）"}</li>
                        <li>{t.privacyAccountInfo3 || "サブスクリプションプラン、コイン残高"}</li>
                    </ul>

                    <h3>{t.privacyLearningDataTitle || "学習データ"}</h3>
                    <ul>
                        <li>{t.privacyLearningData1 || "学習したフレーズ、保存したフレーズコレクション"}</li>
                        <li>{t.privacyLearningData2 || "気付きメモ（単語の理解度、復習スケジュール）"}</li>
                        <li>{t.privacyLearningData3 || "学習イベントログ（フレーズ閲覧、音声再生、添削リクエスト等）"}</li>
                        <li>{t.privacyLearningData4 || "XP、レベル、ストリーク、バッジ等の進捗データ"}</li>
                    </ul>

                    <h3>{t.privacyFeatureDataTitle || "機能利用時に収集するデータ"}</h3>
                    <ul>
                        <li>
                            <strong>{t.privacyVoiceFeature || "音声機能："}</strong>
                            {t.privacyVoiceData || "発音評価のために録音した音声データ、発音スコア"}
                        </li>
                        <li>
                            <strong>{t.privacyImageFeature || "画像抽出機能："}</strong>
                            {t.privacyImageData || "アップロードされた画像（フレーズ抽出のため）"}
                        </li>
                        <li>
                            <strong>{t.privacyCorrectionFeature || "添削機能："}</strong>
                            {t.privacyCorrectionData || "添削のために送信されたテキスト"}
                        </li>
                    </ul>

                    <h3>{t.privacyUsageInfoTitle || "利用情報"}</h3>
                    <ul>
                        <li>{t.privacyUsageInfo1 || "各機能の日次使用回数"}</li>
                        <li>{t.privacyUsageInfo2 || "ログイン日、最終アクティビティ日時"}</li>
                        <li>{t.privacyUsageInfo3 || "デバイスの種類（発音評価時、任意）"}</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{t.privacySection3Title || "3. 第三者サービスへのデータ送信"}</h2>
                    <p>{t.privacySection3Intro || "本サービスの機能を提供するため、以下の第三者サービスにデータを送信します："}</p>
                    <ul>
                        <li>
                            <strong>OpenAI：</strong>
                            {t.privacyOpenAI || "テキスト添削、文法解説、関連フレーズ生成、画像からのフレーズ抽出、発音評価（Whisper）のために、テキスト・音声・画像データを送信"}
                        </li>
                        <li>
                            <strong>Google (Gemini)：</strong>
                            {t.privacyGoogle || "音声合成（テキスト読み上げ）のためにテキストを送信"}
                        </li>
                        <li>
                            <strong>Supabase：</strong>
                            {t.privacySupabase || "認証およびデータベースサービスとして、全ユーザーデータを保存"}
                        </li>
                    </ul>
                    <p>{t.privacySection3Note || "これらのサービスは各社のプライバシーポリシーに従ってデータを処理します。AIサービスに送信されたデータはAI機能の処理のみに使用されます。"}</p>
                </section>

                <section className={styles.section}>
                    <h2>{t.privacySection4Title || "4. 情報の利用目的"}</h2>
                    <p>{t.privacySection4Intro || "収集した情報は以下の目的で使用されます："}</p>
                    <ul>
                        <li>{t.privacyPurpose1 || "語学学習サービスの提供（添削、音声合成、発音評価等）"}</li>
                        <li>{t.privacyPurpose2 || "学習進捗の追跡と分析"}</li>
                        <li>{t.privacyPurpose3 || "パーソナライズされた学習体験の提供"}</li>
                        <li>{t.privacyPurpose4 || "利用制限の管理（日次使用回数の確認）"}</li>
                        <li>{t.privacyPurpose5 || "サービスに関する重要なお知らせの送信"}</li>
                        <li>{t.privacyPurpose6 || "不正利用の防止およびセキュリティの維持"}</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{t.privacySection5Title || "5. 情報の共有"}</h2>
                    <p>{t.privacySection5Intro || "お客様の個人情報は、以下の場合を除き、第三者と共有されることはありません："}</p>
                    <ul>
                        <li>{t.privacySharing1 || "上記「第三者サービスへのデータ送信」に記載のサービス提供者"}</li>
                        <li>{t.privacySharing2 || "法令に基づく開示要求があった場合"}</li>
                        <li>{t.privacySharing3 || "お客様の同意がある場合"}</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{t.privacySection6Title || "6. データの保護"}</h2>
                    <p>{t.privacySection6Intro || "お客様のデータを保護するため、以下のセキュリティ対策を実施しています："}</p>
                    <ul>
                        <li>{t.privacyProtection1 || "SSL/TLS暗号化による通信の保護"}</li>
                        <li>{t.privacyProtection2 || "パスワードの暗号化保存"}</li>
                        <li>{t.privacyProtection3 || "行レベルセキュリティ（RLS）による他ユーザーデータへのアクセス制限"}</li>
                        <li>{t.privacyProtection4 || "入力値のサニタイズ処理（文字数制限、不正文字の除去）"}</li>
                        <li>{t.privacyProtection5 || "ファイルサイズ制限（音声ファイル: 10MB）"}</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{t.privacySection7Title || "7. Cookie（クッキー）の使用"}</h2>
                    <p>{t.privacySection7Content || "本サービスでは、ログイン状態の維持のためにCookieを使用しています。外部の広告トラッキングサービスは使用していません。"}</p>
                </section>

                <section className={styles.section}>
                    <h2>{t.privacySection8Title || "8. お客様の権利"}</h2>
                    <p>{t.privacySection8Intro || "お客様には以下の権利があります："}</p>
                    <ul>
                        <li>{t.privacyRights1 || "個人情報へのアクセス権"}</li>
                        <li>{t.privacyRights2 || "情報の訂正を求める権利"}</li>
                        <li>{t.privacyRights3 || "アカウントの削除を求める権利"}</li>
                    </ul>
                    <p>{t.privacySection8Note || "これらの権利を行使する場合は、設定画面またはサポートまでお問い合わせください。"}</p>
                </section>

                <section className={styles.section}>
                    <h2>{t.privacySection9Title || "9. 子どもの個人情報"}</h2>
                    <p>{t.privacySection9Content || "本サービスは、13歳未満のお子様からの個人情報を意図的に収集することはありません。13歳未満のお子様がサービスを利用する場合は、保護者の同意が必要です。"}</p>
                </section>

                <section className={styles.section}>
                    <h2>{t.privacySection10Title || "10. ポリシーの変更"}</h2>
                    <p>{t.privacySection10Content || "本プライバシーポリシーは、必要に応じて更新されることがあります。重要な変更がある場合は、サービス内でお知らせします。"}</p>
                </section>

                <section className={styles.section}>
                    <h2>{t.privacySection11Title || "11. お問い合わせ"}</h2>
                    <p>{t.privacySection11Content || "本プライバシーポリシーに関するご質問がある場合は、設定画面の「サポートへ連絡」からお問い合わせください。"}</p>
                </section>
            </div>
        </div>
    );
}
