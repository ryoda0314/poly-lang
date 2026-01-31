"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import styles from "./page.module.css";

export default function TermsOfServicePage() {
    const { nativeLanguage } = useAppStore();
    const t = translations[nativeLanguage] as any;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/app/settings" className={styles.backButton}>
                    <ArrowLeft size={20} />
                </Link>
                <h1 className={styles.title}>{t.termsOfService || "利用規約"}</h1>
            </header>

            <div className={styles.content}>
                <p className={styles.lastUpdated}>{t.termsLastUpdated || "最終更新日: 2026年1月30日"}</p>

                <section className={styles.section}>
                    <h2>{t.termsSection1Title || "第1条（適用）"}</h2>
                    <p>{t.termsSection1Content || "本利用規約（以下「本規約」）は、PolyLinga（以下「本サービス」）の利用条件を定めるものです。ユーザーの皆様は、本規約に同意の上、本サービスをご利用ください。"}</p>
                </section>

                <section className={styles.section}>
                    <h2>{t.termsSection2Title || "第2条（利用登録）"}</h2>
                    <ul>
                        <li>{t.termsSection2Item1 || "登録希望者は、本規約に同意の上、所定の方法により利用登録を申請するものとします。"}</li>
                        <li>
                            {t.termsSection2Item2 || "登録申請者が以下のいずれかに該当する場合、利用登録を承認しないことがあります："}
                            <ul className={styles.subList}>
                                <li>{t.termsSection2Sub1 || "虚偽の事項を届け出た場合"}</li>
                                <li>{t.termsSection2Sub2 || "本規約に違反したことがある者からの申請である場合"}</li>
                                <li>{t.termsSection2Sub3 || "その他、運営が利用登録を相当でないと判断した場合"}</li>
                            </ul>
                        </li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{t.termsSection3Title || "第3条（アカウント管理）"}</h2>
                    <ul>
                        <li>{t.termsSection3Item1 || "ユーザーは、自己の責任においてアカウント情報を適切に管理するものとします。"}</li>
                        <li>{t.termsSection3Item2 || "アカウント情報の管理不十分、第三者の使用などによる損害の責任はユーザーが負うものとします。"}</li>
                        <li>{t.termsSection3Item3 || "アカウント情報が第三者に使用されていることが判明した場合、直ちに運営に連絡し、指示に従ってください。"}</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{t.termsSection4Title || "第4条（禁止事項）"}</h2>
                    <p>{t.termsSection4Intro || "ユーザーは、以下の行為を行ってはなりません："}</p>
                    <ul>
                        <li>{t.termsProhibited1 || "法令または公序良俗に違反する行為"}</li>
                        <li>{t.termsProhibited2 || "犯罪行為に関連する行為"}</li>
                        <li>{t.termsProhibited3 || "運営のサーバーまたはネットワークの機能を破壊・妨害する行為"}</li>
                        <li>{t.termsProhibited4 || "サービスの運営を妨害するおそれのある行為"}</li>
                        <li>{t.termsProhibited5 || "他のユーザーに関する個人情報等を収集・蓄積する行為"}</li>
                        <li>{t.termsProhibited6 || "他のユーザーに成りすます行為"}</li>
                        <li>{t.termsProhibited7 || "不正アクセス、または不正アクセスを試みる行為"}</li>
                        <li>{t.termsProhibited8 || "自動化ツールを使用した大量のAPIリクエスト"}</li>
                        <li>{t.termsProhibited9 || "本サービスのコンテンツを無断で複製、転載、配布する行為"}</li>
                        <li>{t.termsProhibited10 || "その他、運営が不適切と判断する行為"}</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{t.termsSection5Title || "第5条（サービスの内容）"}</h2>
                    <p>{t.termsSection5Intro || "本サービスは、以下の語学学習機能を提供します："}</p>
                    <ul>
                        <li>{t.termsFeature1 || "フレーズ学習・保存機能"}</li>
                        <li>{t.termsFeature2 || "音声合成（テキスト読み上げ）"}</li>
                        <li>{t.termsFeature3 || "発音評価"}</li>
                        <li>{t.termsFeature4 || "文章添削"}</li>
                        <li>{t.termsFeature5 || "文法解説"}</li>
                        <li>{t.termsFeature6 || "画像からのフレーズ抽出"}</li>
                        <li>{t.termsFeature7 || "関連フレーズ生成"}</li>
                    </ul>
                    <p>{t.termsSection5Note || "各機能には日次の使用回数制限があり、プランによって上限が異なります。"}</p>
                </section>

                <section className={styles.section}>
                    <h2>{t.termsSection6Title || "第6条（AI機能について）"}</h2>
                    <ul>
                        <li>{t.termsSection6Item1 || "本サービスの添削、文法解説、発音評価等の機能はAI（人工知能）を使用しています。"}</li>
                        <li>{t.termsSection6Item2 || "AIによる結果は参考情報であり、100%の正確性を保証するものではありません。"}</li>
                        <li>{t.termsSection6Item3 || "重要な場面での使用については、ネイティブスピーカーや専門家への確認を推奨します。"}</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{t.termsSection7Title || "第7条（サービスの提供）"}</h2>
                    <ul>
                        <li>{t.termsSection7Item1 || "本サービスは、現状有姿で提供されます。運営は、サービスの完全性、正確性、確実性、有用性等について保証するものではありません。"}</li>
                        <li>
                            {t.termsSection7Item2 || "運営は、以下の場合にサービスの全部または一部を停止できるものとします："}
                            <ul className={styles.subList}>
                                <li>{t.termsSection7Sub1 || "システムの保守点検を行う場合"}</li>
                                <li>{t.termsSection7Sub2 || "火災、停電、天災等の不可抗力により運営が困難な場合"}</li>
                                <li>{t.termsSection7Sub3 || "第三者サービス（AI API等）の障害や仕様変更があった場合"}</li>
                                <li>{t.termsSection7Sub4 || "その他、運営が停止を必要と判断した場合"}</li>
                            </ul>
                        </li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{t.termsSection8Title || "第8条（プランと料金）"}</h2>
                    <ul>
                        <li>{t.termsSection8Item1 || "本サービスには、無料プランと有料プラン（スタンダード、プロ）があります。"}</li>
                        <li>{t.termsSection8Item2 || "有料プランの料金は、サービス内の「ショップ」画面に表示される金額とします。"}</li>
                        <li>{t.termsSection8Item3 || "追加クレジットの購入も可能です。クレジットは日次上限を超えた場合に消費されます。"}</li>
                        <li>{t.termsSection8Item4 || "アプリ内コインは、学習活動によって獲得でき、プレミアム機能の解除に使用できます。"}</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{t.termsSection9Title || "第9条（知的財産権）"}</h2>
                    <ul>
                        <li>{t.termsSection9Item1 || "本サービスに関する著作権、商標権その他の知的財産権は、運営または正当な権利者に帰属します。"}</li>
                        <li>{t.termsSection9Item2 || "ユーザーが本サービスを利用して作成したコンテンツ（保存フレーズ、メモ等）の権利はユーザーに帰属します。"}</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{t.termsSection10Title || "第10条（利用制限・登録抹消）"}</h2>
                    <ul>
                        <li>{t.termsSection10Item1 || "運営は、ユーザーが本規約に違反した場合、事前の通知なく、サービスの利用を制限し、またはアカウントを削除することができます。"}</li>
                        <li>{t.termsSection10Item2 || "運営は、本条に基づく措置によりユーザーに生じた損害について、一切の責任を負いません。"}</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{t.termsSection11Title || "第11条（免責事項）"}</h2>
                    <ul>
                        <li>{t.termsSection11Item1 || "運営は、本サービスに事実上または法律上の瑕疵がないことを保証するものではありません。"}</li>
                        <li>{t.termsSection11Item2 || "運営は、本サービスに起因してユーザーに生じたあらゆる損害について、運営の故意または重過失による場合を除き、一切の責任を負いません。"}</li>
                        <li>{t.termsSection11Item3 || "本サービスは語学学習の補助を目的としており、学習成果を保証するものではありません。"}</li>
                        <li>{t.termsSection11Item4 || "AI機能の結果に基づく判断や行動については、ユーザーの自己責任とします。"}</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{t.termsSection12Title || "第12条（退会）"}</h2>
                    <ul>
                        <li>{t.termsSection12Item1 || "ユーザーは、サポートへ連絡することにより、いつでも退会を申請することができます。"}</li>
                        <li>{t.termsSection12Item2 || "退会時に購入済みのクレジットやコインが残っている場合でも、返金は行われません。"}</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{t.termsSection13Title || "第13条（規約の変更）"}</h2>
                    <p>{t.termsSection13Content || "運営は、必要と判断した場合には、本規約を変更することができるものとします。変更後の規約は、本サービス内に掲示した時点から効力を生じるものとします。重要な変更がある場合は、サービス内でお知らせします。"}</p>
                </section>

                <section className={styles.section}>
                    <h2>{t.termsSection14Title || "第14条（準拠法・管轄裁判所）"}</h2>
                    <ul>
                        <li>{t.termsSection14Item1 || "本規約の解釈には、日本法を準拠法とします。"}</li>
                        <li>{t.termsSection14Item2 || "本サービスに関して紛争が生じた場合には、運営の本店所在地を管轄する裁判所を専属的合意管轄とします。"}</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>{t.termsContactTitle || "お問い合わせ"}</h2>
                    <p>{t.termsContactContent || "本規約に関するご質問は、設定画面の「サポートへ連絡」からお問い合わせください。"}</p>
                </section>
            </div>
        </div>
    );
}
