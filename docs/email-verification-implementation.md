# メール認証実装ガイド

Supabase + Next.js + PWA + Resendでのカスタムメール認証実装。

## なぜSupabaseの自動メールを使わないか

1. **カスタムテンプレート**: Supabaseの組み込みメールテンプレートは制限がある
2. **多言語対応**: ユーザーの言語に応じたメールを送りたい
3. **ブランディング**: 独自ドメイン（no-reply@polylinga.app）からの送信
4. **信頼性**: Resendは高いdeliverability（到達率）を持つ

## 環境変数

```env
# Resend API Key
RESEND_API_KEY=re_xxxxxxxxxx

# アプリのURL（Vercelのプロダクション環境）
NEXT_PUBLIC_APP_URL=https://www.polylinga.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx  # Admin API用
```

## Resendのセットアップ

1. [Resend](https://resend.com)でアカウント作成
2. ドメインを追加・検証（DNS設定）
3. API Keyを発行
4. Vercelの環境変数に`RESEND_API_KEY`を追加

## 1. Supabaseの`email_confirmed_at`は使えない場合がある

Supabase Authの`email_confirmed_at`フィールドが存在しない/機能しない環境がある。

**解決策**: カスタムの`email_verified`カラムをprofilesテーブルに追加

```sql
ALTER TABLE profiles ADD COLUMN email_verified BOOLEAN DEFAULT false;
```

## 2. Admin APIの`generateLink`でmagic linkを使う場合

Supabaseの`action_link`経由だと、callbackにパラメータが渡されない問題がある。

**問題**:
- `action_link`をクリック → Supabaseの`/auth/v1/verify`を経由 → callbackに`code`パラメータなしでリダイレクト

**解決策**: `hashed_token`を直接callbackのURLに含める

```typescript
// send-verification/route.ts
const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: email,
});

// action_linkを使わず、直接token_hashをcallbackに渡す
const verificationUrl = `${baseUrl}/auth/callback?token_hash=${data.properties.hashed_token}&type=magiclink`;
```

```typescript
// callback/route.ts
if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as "magiclink",
    });
    // ...
}
```

## 3. ログイン前にチェックする

ログイン後にチェック→ログアウトは悪いUX（一瞬ログインされてしまう）。

**解決策**: サーバーサイドAPIで先に`email_verified`を確認してから`signInWithPassword`

```typescript
// /api/auth/login - サーバーサイドでチェック
const { data: profile } = await supabase
    .from("profiles")
    .select("email_verified")
    .eq("id", user.id)
    .single();

if (!profile?.email_verified) {
    return NextResponse.json({ error: "email_not_verified" }, { status: 403 });
}
```

```typescript
// login/page.tsx - クライアント側
const checkRes = await fetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
});

if (!checkRes.ok) {
    // エラー表示（ログインしない）
}

// チェック通過後にのみsignInWithPassword
await supabase.auth.signInWithPassword({ email, password });
```

## 4. PWAの制限

メールのリンクはブラウザで開く（PWAアプリ内では開けない）。

**解決策**: 認証完了後「アプリに戻ってログインしてください」ページを表示

```typescript
// callback成功後
return NextResponse.redirect(`${origin}/auth/open-app?lang=${lang}`);
```

## 5. デバッグのコツ

### Vercelのログでパラメータを確認

```typescript
console.log("Callback received:", {
    url: request.url,
    code: code ? "present" : "null",
    token_hash: token_hash ? "present" : "null",
    type,
    allParams: Object.fromEntries(searchParams.entries()),
});
```

### `External APIs: No outgoing requests`の意味
Vercelログでこれが表示されたら、API呼び出し前に処理が終わっている（パラメータがない等）。

## 6. Supabase Redirect URLの設定

callbackのURLをSupabase Dashboard → Authentication → URL Configuration → Redirect URLsに追加必須。

```
https://www.example.com/auth/callback
https://example.com/auth/callback
```

## 実装フロー図

```
[登録]
  ↓
profiles.email_verified = false
  ↓
[認証メール送信] → token_hash付きURL
  ↓
[リンクをクリック]
  ↓
/auth/callback?token_hash=xxx&type=magiclink
  ↓
verifyOtp() → profiles.email_verified = true
  ↓
/auth/open-app (アプリに戻ってログインしてください)
  ↓
[ログイン試行]
  ↓
/api/auth/login でemail_verified確認
  ↓
email_verified=true → signInWithPassword成功
email_verified=false → エラー表示
```

## 関連ファイル

- `src/app/api/auth/send-verification/route.ts` - 認証メール送信
- `src/app/auth/callback/route.ts` - 認証リンクのコールバック
- `src/app/api/auth/login/route.ts` - ログイン前のemail_verified確認
- `src/app/login/page.tsx` - ログインページ
- `src/app/auth/open-app/page.tsx` - 認証完了ページ
- `src/app/api/profile/create/route.ts` - プロフィール作成（email_verified: false）

## メールテンプレート構造

`send-verification/route.ts`内に多言語テンプレートを定義:

```typescript
const templates: Record<string, { subject: string; body: (url: string) => string }> = {
    en: {
        subject: "Welcome to PolyLinga!",
        body: (url: string) => `
            <h2>Welcome to PolyLinga!</h2>
            <p>Click the link below to verify your email:</p>
            <p><a href="${url}" style="...">Verify Email Address</a></p>
            ...
        `,
    },
    ja: {
        subject: "PolyLingaへようこそ！",
        body: (url: string) => `...`,
    },
    // ko, zh, fr, es, de, ru, vi...
};

// ユーザーの言語に応じてテンプレートを選択
const lang = native_language && templates[native_language] ? native_language : "en";
const template = templates[lang];

await resend.emails.send({
    from: "PolyLinga <no-reply@polylinga.app>",
    to: email,
    subject: template.subject,
    html: template.body(verificationUrl),
});
```

## Resendでのメール送信

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const { error } = await resend.emails.send({
    from: "PolyLinga <no-reply@polylinga.app>",  // 検証済みドメイン必須
    to: email,
    subject: "件名",
    html: "<h1>HTMLメール本文</h1>",
});

if (error) {
    console.error("Resend error:", error);
}
```

## トラブルシューティング

### メールが届かない
1. Resendダッシュボードでログを確認
2. ドメインのDNS設定を確認（SPF, DKIM）
3. スパムフォルダを確認

### token_hashが無効
- magic linkのトークンは一定時間（通常1時間）で期限切れ
- 一度使用したトークンは再利用不可

### callbackにパラメータがない
- Supabaseの`action_link`を使わず、直接`token_hash`をURLに含める
- Supabase Dashboardの Redirect URLs に callback URL を追加