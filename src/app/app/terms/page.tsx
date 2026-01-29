"use client";

import React from "react";
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
                <p className={styles.lastUpdated}>最終更新日: 2025年1月30日</p>

                <section className={styles.section}>
                    <h2>第1条（適用）</h2>
                    <p>
                        本利用規約（以下「本規約」）は、PolyLinga（以下「本サービス」）の
                        利用条件を定めるものです。ユーザーの皆様は、本規約に同意の上、
                        本サービスをご利用ください。
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>第2条（利用登録）</h2>
                    <ul>
                        <li>
                            登録希望者は、本規約に同意の上、所定の方法により利用登録を申請するものとします。
                        </li>
                        <li>
                            登録申請者が以下のいずれかに該当する場合、利用登録を承認しないことがあります：
                            <ul className={styles.subList}>
                                <li>虚偽の事項を届け出た場合</li>
                                <li>本規約に違反したことがある者からの申請である場合</li>
                                <li>その他、運営が利用登録を相当でないと判断した場合</li>
                            </ul>
                        </li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>第3条（アカウント管理）</h2>
                    <ul>
                        <li>
                            ユーザーは、自己の責任においてアカウント情報を適切に管理するものとします。
                        </li>
                        <li>
                            アカウント情報の管理不十分、第三者の使用などによる損害の責任は
                            ユーザーが負うものとします。
                        </li>
                        <li>
                            アカウント情報が第三者に使用されていることが判明した場合、
                            直ちに運営に連絡し、指示に従ってください。
                        </li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>第4条（禁止事項）</h2>
                    <p>ユーザーは、以下の行為を行ってはなりません：</p>
                    <ul>
                        <li>法令または公序良俗に違反する行為</li>
                        <li>犯罪行為に関連する行為</li>
                        <li>運営のサーバーまたはネットワークの機能を破壊・妨害する行為</li>
                        <li>サービスの運営を妨害するおそれのある行為</li>
                        <li>他のユーザーに関する個人情報等を収集・蓄積する行為</li>
                        <li>他のユーザーに成りすます行為</li>
                        <li>不正アクセス、または不正アクセスを試みる行為</li>
                        <li>反社会的勢力に対して利益を供与する行為</li>
                        <li>本サービスのコンテンツを無断で複製、転載、配布する行為</li>
                        <li>その他、運営が不適切と判断する行為</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>第5条（サービスの提供）</h2>
                    <ul>
                        <li>
                            本サービスは、現状有姿で提供されます。運営は、サービスの完全性、
                            正確性、確実性、有用性等について保証するものではありません。
                        </li>
                        <li>
                            運営は、以下の場合にサービスの全部または一部を停止できるものとします：
                            <ul className={styles.subList}>
                                <li>システムの保守点検を行う場合</li>
                                <li>火災、停電、天災等の不可抗力により運営が困難な場合</li>
                                <li>その他、運営が停止を必要と判断した場合</li>
                            </ul>
                        </li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>第6条（有料サービス）</h2>
                    <ul>
                        <li>
                            有料サービスの料金は、サービス内に表示される金額とします。
                        </li>
                        <li>
                            ユーザーは、所定の支払方法により料金を支払うものとします。
                        </li>
                        <li>
                            支払済みの料金は、法令に定める場合を除き、返金されません。
                        </li>
                        <li>
                            サブスクリプションは自動更新され、解約手続きを行わない限り継続します。
                        </li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>第7条（知的財産権）</h2>
                    <ul>
                        <li>
                            本サービスに関する著作権、商標権その他の知的財産権は、
                            運営または正当な権利者に帰属します。
                        </li>
                        <li>
                            ユーザーが本サービスを利用して作成したコンテンツの権利は
                            ユーザーに帰属しますが、サービス改善のために運営が利用する
                            ことに同意するものとします。
                        </li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>第8条（利用制限・登録抹消）</h2>
                    <ul>
                        <li>
                            運営は、ユーザーが本規約に違反した場合、事前の通知なく、
                            サービスの利用を制限し、またはアカウントを削除することができます。
                        </li>
                        <li>
                            運営は、本条に基づく措置によりユーザーに生じた損害について、
                            一切の責任を負いません。
                        </li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>第9条（免責事項）</h2>
                    <ul>
                        <li>
                            運営は、本サービスに事実上または法律上の瑕疵がないことを
                            保証するものではありません。
                        </li>
                        <li>
                            運営は、本サービスに起因してユーザーに生じたあらゆる損害について、
                            運営の故意または重過失による場合を除き、一切の責任を負いません。
                        </li>
                        <li>
                            本サービスは語学学習の補助を目的としており、学習成果を保証するものではありません。
                        </li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>第10条（退会）</h2>
                    <ul>
                        <li>
                            ユーザーは、設定画面から所定の手続きを行うことにより、
                            いつでも退会することができます。
                        </li>
                        <li>
                            退会時に有料サービスの契約期間が残っている場合でも、
                            返金は行われません。
                        </li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>第11条（規約の変更）</h2>
                    <p>
                        運営は、必要と判断した場合には、ユーザーに通知することなく
                        本規約を変更することができるものとします。変更後の規約は、
                        本サービス内に掲示した時点から効力を生じるものとします。
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>第12条（準拠法・管轄裁判所）</h2>
                    <ul>
                        <li>本規約の解釈には、日本法を準拠法とします。</li>
                        <li>
                            本サービスに関して紛争が生じた場合には、運営の本店所在地を
                            管轄する裁判所を専属的合意管轄とします。
                        </li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>お問い合わせ</h2>
                    <p>
                        本規約に関するご質問は、設定画面の「サポートへ連絡」からお問い合わせください。
                    </p>
                </section>
            </div>
        </div>
    );
}
