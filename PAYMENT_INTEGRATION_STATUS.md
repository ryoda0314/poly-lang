# 決済機能導入ステータス

## 価格設計（確定）

### 単品購入（¥100単位でクレジット購入）

| 機能 | 単価 | ¥100で | 原価 | 利益率 |
|------|------|--------|------|--------|
| Audio | ¥2 | 50回 | ¥0.15 | 92.5% |
| Explorer | ¥3 | 35回 | ¥0.04 | 98.7% |
| Correction | ¥3 | 35回 | ¥1.60 | 46.7% |
| Extract | ¥10 | 10回 | ¥0.14 | 98.6% |
| Explanation | ¥5 | 20回 | ¥1.31 | 73.8% |

### サブスクリプション

| プラン | 月額 | Audio/Explorer | Correction | Extract | Explanation |
|--------|------|----------------|------------|---------|-------------|
| 無料 | ¥0 | 5回/日 | 3回/日 | 1回/日 | 1回/日 |
| スタンダード | ¥480 | 30回/日 | 10回/日 | 月10回 | 月30回 |
| プロ | ¥980 | 100回/日 | 30回/日 | 月30回 | 月100回 |

---

## 完了したこと

### 1. Stripe決済機能の実装（ブランチに退避済み）
- **ブランチ名:** `feature/stripe-integration`
- コインパック購入（¥500 / ¥1,000 / ¥2,000）
- プレミアムサブスクリプション（¥980/月）
- Webhook処理（冪等性チェック付き）
- Stripe Customer Portalによるサブスク管理
- DBマイグレーション（stripe_customers, payment_transactions, user_subscriptions）
- ショップUI（CoinPackCard, SubscriptionCard）
- 設定画面にサブスク状態表示
- 5言語翻訳（ja, ko, en, zh, fr）

### 2. セキュリティレビュー
- Stripeの脆弱性対策5項目を確認 → 全項目対応済み
- 不正ログイン対策 → ③個人情報確認、④ログイン試行制限が該当

### 3. 決済プロバイダーの検討
- Stripe → 実装完了したが、一旦見送り（ブランチに保存）
- PAY.JP → 申請フォームの途中まで進めた（開業届が必要）

### 4. ショップUI更新（mainブランチ）
- `SinglePurchaseCard` に `usesPerHundred` プロパティ追加
- 価格表示を「¥100で〇〇回」形式に変更
- 価格設計ドキュメント更新 (`docs/pricing-analysis.md`)

---

## やるべきこと

### PAY.JPで進める場合

#### 1. 開業届の提出
- [ ] e-Tax または税務署で「個人事業の開業届出書」を提出
- [ ] 控え（受領印付き or e-Tax受信通知）を保存
- [ ] 同時に「青色申告承認申請書」の提出を検討

#### 2. PAY.JP申請の完了
- [ ] 開業届の控えをアップロード
- [ ] 申請フォームの残りの項目を記入・送信
- [ ] 審査通過を待つ

#### 3. PAY.JP実装（審査通過後）
- [ ] `payjp` パッケージのインストール
- [ ] Stripe実装を参考にPAY.JP版のAPI・Webhookを実装
  - または `feature/stripe-integration` ブランチのコードをPAY.JP用に書き換え
- [ ] テストモードで動作確認
- [ ] 本番キーに切り替え

### Stripeで進める場合
- [ ] `git merge feature/stripe-integration` でmainに統合
- [ ] `.env.local` に環境変数を設定:
  - `STRIPE_SECRET_KEY`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- [ ] `stripe-products.ts` のPrice IDを本番のものに更新
- [ ] Supabaseマイグレーションを実行
- [ ] Stripe Dashboardでの商品・価格設定
- [ ] Webhookエンドポイントの登録
- [ ] テストカード `4242 4242 4242 4242` で動作確認

### どちらの場合も必要
- [ ] 特定商取引法に基づく表記ページの作成
- [ ] プライバシーポリシーの更新（決済情報の取り扱いについて追記）
- [ ] 利用規約の更新（有料サービス・返金ポリシーについて追記）
- [ ] 確定申告の準備（開業届を出した場合）

---

## 技術メモ

### ブランチ構成
```
main                        ← 現在のブランチ（Stripe関連なし）
feature/stripe-integration  ← Stripe実装一式（コミット済み）
```

### Stripe実装のファイル一覧（feature/stripe-integrationブランチ）
```
src/app/api/stripe/create-checkout-session/route.ts
src/app/api/stripe/create-portal-session/route.ts
src/app/api/stripe/webhook/route.ts
src/app/app/shop/CoinPackCard.tsx
src/app/app/shop/SubscriptionCard.tsx
src/lib/stripe.ts
src/lib/stripe-client.ts
src/lib/stripe-products.ts
src/lib/stripe-fulfillment.ts
supabase/migrations/20260128_create_stripe_tables.sql
```

### 変更されたファイル（feature/stripe-integrationブランチ）
```
package.json              ← stripe, @stripe/stripe-js 追加
src/app/app/shop/page.tsx ← コインパック・サブスクセクション追加
src/app/app/shop/ShopProductModal.tsx ← プレミアム含有表示
src/app/app/shop/shop.module.css      ← 新スタイル追加
src/app/app/settings/page.tsx         ← サブスクセクション追加
src/lib/translations.ts               ← 決済関連の翻訳キー追加
src/types/supabase.ts                  ← 新テーブル型追加
```
