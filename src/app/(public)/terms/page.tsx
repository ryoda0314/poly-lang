import Link from "next/link";
import styles from "./page.module.css";

export const metadata = {
    title: "利用規約 | PolyLinga",
};

export default function PublicTermsPage() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/" className={styles.backButton}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </Link>
                <h1 className={styles.title}>利用規約</h1>
            </header>

            <div className={styles.content}>
                <p className={styles.lastUpdated}>最終更新日: 2026年2月21日</p>

                <section className={styles.section}>
                    <h2>第1条（適用）</h2>
                    <p>本利用規約（以下「本規約」）は、PolyLinga（以下「本サービス」）の利用条件を定めるものです。ユーザーの皆様は、本規約に同意の上、本サービスをご利用ください。</p>
                </section>

                <section className={styles.section}>
                    <h2>第2条（利用登録）</h2>
                    <ul>
                        <li>登録希望者は、本規約に同意の上、所定の方法により利用登録を申請するものとします。</li>
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
                        <li>ユーザーは、自己の責任においてアカウント情報を適切に管理するものとします。</li>
                        <li>アカウント情報の管理不十分、第三者の使用などによる損害の責任はユーザーが負うものとします。</li>
                        <li>アカウント情報が第三者に使用されていることが判明した場合、直ちに運営に連絡し、指示に従ってください。</li>
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
                        <li>自動化ツールを使用した大量のAPIリクエスト</li>
                        <li>本サービスのコンテンツを無断で複製、転載、配布する行為</li>
                        <li>その他、運営が不適切と判断する行為</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>第5条（サービスの内容）</h2>
                    <p>本サービスは、以下の語学学習機能を提供します：</p>
                    <ul>
                        <li>フレーズ学習・保存機能</li>
                        <li>音声合成（テキスト読み上げ）</li>
                        <li>発音評価</li>
                        <li>文章添削</li>
                        <li>文法解説</li>
                        <li>画像からのフレーズ抽出</li>
                        <li>関連フレーズ生成</li>
                    </ul>
                    <p>各機能には日次の使用回数制限があり、プランによって上限が異なります。</p>
                </section>

                <section className={styles.section}>
                    <h2>第6条（AI機能について）</h2>
                    <ul>
                        <li>本サービスの添削、文法解説、発音評価等の機能はAI（人工知能）を使用しています。</li>
                        <li>AIによる結果は参考情報であり、100%の正確性を保証するものではありません。</li>
                        <li>重要な場面での使用については、ネイティブスピーカーや専門家への確認を推奨します。</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>第7条（サービスの提供）</h2>
                    <ul>
                        <li>本サービスは、現状有姿で提供されます。運営は、サービスの完全性、正確性、確実性、有用性等について保証するものではありません。</li>
                        <li>
                            運営は、以下の場合にサービスの全部または一部を停止できるものとします：
                            <ul className={styles.subList}>
                                <li>システムの保守点検を行う場合</li>
                                <li>火災、停電、天災等の不可抗力により運営が困難な場合</li>
                                <li>第三者サービス（AI API等）の障害や仕様変更があった場合</li>
                                <li>その他、運営が停止を必要と判断した場合</li>
                            </ul>
                        </li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>第8条（プランと料金）</h2>
                    <ul>
                        <li>本サービスには、無料プランと有料サブスクリプションプランがあります。各プランの料金および内容は、サービス内の「ショップ」画面に表示される情報に基づきます。</li>
                        <li>サブスクリプションは月額制で、解約手続きが行われない限り毎月自動更新されます。</li>
                        <li>コインパックを購入することで、アプリ内コインを取得できます。コインはクレジットの追加購入に使用できます。</li>
                        <li>決済はStripe, Inc.のサービスを通じて処理されます。クレジットカードおよびデビットカードでのお支払いが可能です。カード情報は本サービスのサーバーには保存されず、Stripeが安全に管理します。</li>
                        <li>サブスクリプションの解約は、アプリ内の請求管理画面からいつでも行えます。解約後も、支払い済みの請求期間の終了日まで有料機能をご利用いただけます。日割り返金は行いません。</li>
                        <li>購入済みのコインおよびコインで購入したクレジットについては、原則として返金いたしません。</li>
                        <li>料金の改定を行う場合は、事前にサービス内でお知らせします。</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>第9条（知的財産権）</h2>
                    <ul>
                        <li>本サービスに関する著作権、商標権その他の知的財産権は、運営または正当な権利者に帰属します。</li>
                        <li>ユーザーが本サービスを利用して作成したコンテンツ（保存フレーズ、メモ等）の権利はユーザーに帰属します。</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>第10条（利用制限・登録抹消）</h2>
                    <ul>
                        <li>運営は、ユーザーが本規約に違反した場合、事前の通知なく、サービスの利用を制限し、またはアカウントを削除することができます。</li>
                        <li>運営は、本条に基づく措置によりユーザーに生じた損害について、一切の責任を負いません。</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>第11条（免責事項）</h2>
                    <ul>
                        <li>運営は、本サービスに事実上または法律上の瑕疵がないことを保証するものではありません。</li>
                        <li>運営は、本サービスに起因してユーザーに生じたあらゆる損害について、運営の故意または重過失による場合を除き、一切の責任を負いません。</li>
                        <li>本サービスは語学学習の補助を目的としており、学習成果を保証するものではありません。</li>
                        <li>AI機能の結果に基づく判断や行動については、ユーザーの自己責任とします。</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>第12条（退会）</h2>
                    <ul>
                        <li>ユーザーは、サポートへ連絡することにより、いつでも退会を申請することができます。</li>
                        <li>有料プランに加入中の場合は、退会前に請求管理画面からサブスクリプションを解約してください。</li>
                        <li>退会時に購入済みのクレジットやコインが残っている場合でも、返金は行われません。</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>第13条（規約の変更）</h2>
                    <p>運営は、必要と判断した場合には、本規約を変更することができるものとします。変更後の規約は、本サービス内に掲示した時点から効力を生じるものとします。重要な変更がある場合は、サービス内でお知らせします。</p>
                </section>

                <section className={styles.section}>
                    <h2>第14条（準拠法・管轄裁判所）</h2>
                    <ul>
                        <li>本規約の解釈には、日本法を準拠法とします。</li>
                        <li>本サービスに関して紛争が生じた場合には、運営の本店所在地を管轄する裁判所を専属的合意管轄とします。</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>お問い合わせ</h2>
                    <p>本規約に関するご質問は、learnguages.poly@gmail.com までお問い合わせください。</p>
                </section>
            </div>
        </div>
    );
}
