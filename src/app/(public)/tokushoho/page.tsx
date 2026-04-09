import styles from "./page.module.css";

export const metadata = {
    title: "特定商取引法に基づく表記 | PolyLinga",
};

export default function TokushohoPage() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>特定商取引法に基づく表記</h1>
            </header>

            <div className={styles.content}>
                <table className={styles.table}>
                    <tbody>
                        <tr>
                            <th>販売業者</th>
                            <td>POLYLINGA</td>
                        </tr>
                        <tr>
                            <th>運営統括責任者</th>
                            <td>塚本諒</td>
                        </tr>
                        <tr>
                            <th>所在地</th>
                            <td>請求があった場合に遅滞なく開示いたします</td>
                        </tr>
                        <tr>
                            <th>電話番号</th>
                            <td>請求があった場合に遅滞なく開示いたします</td>
                        </tr>
                        <tr>
                            <th>メールアドレス</th>
                            <td>learnguages.poly@gmail.com</td>
                        </tr>
                        <tr>
                            <th>販売URL</th>
                            <td>https://polylinga.app</td>
                        </tr>
                        <tr>
                            <th>販売価格</th>
                            <td>
                                各プラン・商品の価格は、アプリ内「ショップ」画面に表示される金額に基づきます。
                                <br />
                                <br />
                                ■ サブスクリプションプラン（税込・月額）
                                <ul>
                                    <li>会話強化プラン：980円/月</li>
                                    <li>アウトプット強化プラン：980円/月</li>
                                    <li>インプット強化プラン：1,480円/月</li>
                                    <li>受験対策プラン：1,480円/月</li>
                                    <li>Proプラン：2,980円/月</li>
                                </ul>
                                ■ コインパック（税込・一括払い）
                                <ul>
                                    <li>100コイン：100円</li>
                                    <li>300コイン：300円</li>
                                    <li>500コイン：500円</li>
                                    <li>1,100コイン：1,000円（10%ボーナス）</li>
                                    <li>3,600コイン：3,000円（20%ボーナス）</li>
                                    <li>6,500コイン：5,000円（30%ボーナス）</li>
                                </ul>
                            </td>
                        </tr>
                        <tr>
                            <th>販売価格以外の必要料金</th>
                            <td>インターネット接続に必要な通信料はお客様のご負担となります。</td>
                        </tr>
                        <tr>
                            <th>お支払い方法</th>
                            <td>クレジットカード、デビットカード（Stripe決済）</td>
                        </tr>
                        <tr>
                            <th>お支払い時期</th>
                            <td>
                                ■ サブスクリプション：お申込み時に初回決済、以降毎月自動更新時に決済
                                <br />
                                ■ コインパック：ご購入時に即時決済
                            </td>
                        </tr>
                        <tr>
                            <th>商品の引渡し時期</th>
                            <td>決済完了後、ただちにサービスをご利用いただけます。</td>
                        </tr>
                        <tr>
                            <th>返品・キャンセルについて</th>
                            <td>
                                ■ サブスクリプション：アプリ内の請求管理画面からいつでも解約できます。解約後も、支払い済みの請求期間の終了日までサービスをご利用いただけます。日割り返金は行いません。
                                <br />
                                ■ コインパック：デジタルコンテンツという商品の性質上、購入後の返品・返金はお受けしておりません。ただし、システム障害等により正常にコインが付与されなかった場合はサポートまでお問い合わせください。
                            </td>
                        </tr>
                        <tr>
                            <th>動作環境</th>
                            <td>
                                インターネットに接続されたウェブブラウザ（PWA対応）
                                <br />
                                推奨ブラウザ：Google Chrome、Safari、Microsoft Edge（最新版）
                            </td>
                        </tr>
                        <tr>
                            <th>特記事項</th>
                            <td>
                                本サービスはAI（人工知能）を活用した語学学習サービスです。AI機能の結果は参考情報であり、100%の正確性を保証するものではありません。
                            </td>
                        </tr>
                    </tbody>
                </table>

                <p className={styles.lastUpdated}>最終更新日: 2026年2月21日</p>
            </div>
        </div>
    );
}
