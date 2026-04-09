# OpenAI API 教訓メモ

## 問題: モデル変更後に翻訳が動かなくなった

### 症状
- `gpt-4o-mini` → `gpt-5.2` に変更後、400エラーが発生
- エラーメッセージ: `Unsupported parameter: 'max_tokens' is not supported with this model`

### 原因
OpenAIの新しいモデルでは、パラメータ名が変更されている。

| パラメータ | 対応モデル |
|-----------|-----------|
| `max_tokens` | gpt-4o, gpt-4o-mini, gpt-4, gpt-3.5-turbo |
| `max_completion_tokens` | o1, gpt-5.x 系 |

### 解決策
```typescript
// 古いモデル用
await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 500,  // OK
});

// 新しいモデル用
await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 500,  // これを使う
});
```

## 教訓

### 1. 詳細なエラーログを出力する
```typescript
// Bad: 原因がわからない
catch (error) {
    return { error: "翻訳に失敗しました" };
}

// Good: 原因がすぐわかる
catch (error: any) {
    console.error("Error details:", error?.message, error?.status, error?.code);
    return { error: `翻訳に失敗しました: ${error?.message}` };
}
```

### 2. モデル変更時はAPIドキュメントを確認
- 同じOpenAI APIでもモデルによってサポートするパラメータが異なる
- 新しいモデルは特に注意が必要

### 3. トークン制限を設定していないファイルは問題なし
- `max_tokens` / `max_completion_tokens` を設定していない場合、デフォルト値が使われるのでエラーにならない

## 該当ファイル一覧（このプロジェクト）

| ファイル | モデル | 設定 |
|----------|--------|------|
| `src/app/api/extension/translate/route.ts` | gpt-5.2 | `max_completion_tokens: 500` |
| `src/app/api/extension/smart-save/route.ts` | gpt-5.2 | `max_completion_tokens: 1000` |
| `src/actions/image-extract.ts` | gpt-5.2 | `max_completion_tokens: 4096` |
| その他の actions | gpt-5.2 | 未設定（問題なし） |
| `src/actions/furigana.ts` | gpt-4o-mini | 未設定（問題なし） |

---
*2024年 デバッグセッションより*
