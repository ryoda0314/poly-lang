# テスター向けクレジット配布 計画書

## 現状

### 既存の配布機能（Distribution Events）が実装済み

管理画面の「Distributions」タブから配布イベントを作成・管理できる仕組みが完成している。

| 要素 | ファイル | 概要 |
|------|---------|------|
| DB テーブル | `supabase/migrations/20260129_create_distribution_events.sql` | `distribution_events` + `distribution_claims` |
| RPC 関数 | 同上 | `claim_distribution(p_event_id, p_user_id)` — FOR UPDATE排他制御付き |
| 管理画面 | `src/app/admin/dashboard-data/AdminConsole.tsx` (L1601〜) | Distributions タブ（CRUD + Publish/Cancel） |
| 管理アクション | `src/app/admin/dashboard-data/actions.ts` (L1093〜) | `createDistributionEvent`, `publishDistributionEvent`, `cancelDistributionEvent` 等 |
| 一覧API | `src/app/api/distributions/available/route.ts` | アクティブなイベント一覧（クレーム済み除外、i18n対応） |
| クレームAPI | `src/app/api/distributions/claim/route.ts` | RPC呼び出し + エラーハンドリング |
| ダッシュボードUI | `src/app/app/dashboard/ClaimableRewards.tsx` | カード型で報酬表示 + 「受け取る」ボタン |
| ギフトボタン | `src/components/dashboard/GiftButton.tsx` | ナビにギフトアイコン + ドロップダウンで受取 |

### 既存機能でできること

- **rewards (JSONB)** で coins + 各種クレジットを自由に指定
- **recurrence**: `once`（1回限り）/ `daily` / `weekly` / `monthly`
- **scheduled_at / expires_at** で配布期間を制御
- **status**: `draft` → `active` → `cancelled` のワークフロー
- **claim_count** で配布実績を確認
- ユーザーごとに1回（period_keyで管理）の重複防止

---

## 方法A: 既存のDistribution機能を使う（追加実装なし）

### 手順

1. 管理画面 → Distributions タブ → 「New Distribution」
2. 設定例：
   - **Title**: `ベータテスト報酬`
   - **Rewards**: `[{type: "coins", amount: 500}, {type: "audio_credits", amount: 100}]`
   - **Recurrence**: `once`
   - **Scheduled at**: 即時（現在日時）
   - **Expires at**: テスト期間終了日
3. 「Publish」でアクティブ化
4. テスターがログインすると、ダッシュボードにギフトカードが表示される
5. テスターが「受け取る」をタップしてクレジット取得

### メリット
- 追加実装不要、すぐに使える
- 管理画面でclaim数を確認できる

### デメリット
- 全ログインユーザーに表示される（テスター限定にできない）
- ユーザーが自発的に受け取る必要がある

### 注意: rewardsのtype名
現在のRPCで許可されているカラム名を確認すること。
`claim_distribution` RPC内の `v_valid_columns` に含まれるもののみ指定可能。

---

## 方法B: プロモコード機能を新規実装

テスターだけにコードを共有し、コード入力でクレジットを受け取る仕組み。

### 必要な実装

#### 1. DB マイグレーション
**新規**: `supabase/migrations/20260222_create_promo_codes.sql`

```sql
-- promo_codes テーブル
CREATE TABLE promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,          -- "BETA100" など
  title TEXT NOT NULL,                -- 管理用ラベル
  description TEXT,
  rewards JSONB NOT NULL,             -- [{type:"coins",amount:500},{type:"extra_audio_credits",amount:100}]
  max_claims INTEGER,                 -- NULL = 無制限
  claim_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','expired','cancelled')),
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- promo_claims テーブル
CREATE TABLE promo_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rewards_granted JSONB,
  claimed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(promo_id, user_id)           -- 1人1回制限
);

-- redeem_promo_code RPC（SECURITY DEFINER、FOR UPDATE排他制御）
-- コード検索は UPPER(code) = UPPER(TRIM(p_code)) で大文字小文字無視
-- v_valid_columns allowlist でSQLi防止
-- extra_*_credits に加算（サブスク更新でリセットされない）
```

#### 2. サーバーアクション

| ファイル | 関数 | 概要 |
|---------|------|------|
| `src/app/admin/dashboard-data/actions.ts` | `getPromoCodes()` | 一覧取得（ページネーション、ステータスフィルタ） |
| 同上 | `createPromoCode()` | 作成（コード自動大文字化、英数字のみ、rewards検証） |
| 同上 | `cancelPromoCode()` | active → cancelled |
| `src/app/app/settings/actions.ts`（新規） | `redeemPromoCode()` | RPC呼び出し、レート制限（1時間5回）、エラーマッピング |

#### 3. 管理画面UI

| ファイル | 変更 |
|---------|------|
| `AdminSidebar.tsx` | menuItemsに `{ id: "promo_codes", label: "Promo Codes", icon: Ticket }` 追加 |
| `AdminConsole.tsx` | promo_codesタブ追加（一覧テーブル + 作成モーダル + キャンセルボタン） |

#### 4. ユーザーUI

| ファイル | 変更 |
|---------|------|
| `src/app/app/settings/page.tsx` | Accountセクション後に「プロモコード」セクション追加 |

- テキスト入力（大文字、monospace） + 「適用」ボタン
- 成功/エラーメッセージ表示
- 成功時に `refreshProfile()` でクレジット反映

#### 5. 翻訳キー（12キー × 10言語）

`src/lib/translations.ts` に追加:
`promoCode`, `promoCodeInput`, `promoCodeDesc`, `promoRedeem`, `promoSuccess`,
`promoInvalidCode`, `promoCodeInactive`, `promoCodeExpired`, `promoCodeMaxClaims`,
`promoAlreadyClaimed`, `promoRateLimited`, `promoUnknownError`

### 設計ポイント

- **クレジット先**: `extra_*_credits`（購入クレジット列）に加算 → サブスク更新でリセットされない
- **セキュリティ**: RPC `SECURITY DEFINER` → ユーザーはpromo_codesテーブル直接参照不可
- **排他制御**: `FOR UPDATE` + `UNIQUE(promo_id, user_id)` 制約
- **レート制限**: 1時間に5回まで（総当たり防止）
- **コード正規化**: 大文字・英数字のみ、3〜50文字

### メリット
- テスター限定で配布可能（コードを知っている人だけ）
- SNSやメールで簡単に共有
- 使用回数上限を設定可能

### デメリット
- 新規実装が必要（DB + API + 管理UI + ユーザーUI + 翻訳）

---

## 比較まとめ

| 観点 | 方法A: 既存Distribution | 方法B: プロモコード |
|------|------------------------|-------------------|
| 実装コスト | なし | 中〜大 |
| テスター限定 | 不可（全ユーザー対象） | 可能（コード共有のみ） |
| 配布方法 | ダッシュボードに自動表示 | コード入力 |
| 管理 | 既存UIで完結 | 新規タブ追加 |
| 即時利用 | 可能 | 実装後 |

---

## 推奨

- **今すぐテスター配布したい場合** → 方法Aで即実行
- **テスター限定で配りたい / 長期運用したい場合** → 方法Bを実装
