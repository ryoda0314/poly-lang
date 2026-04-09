# CSS Flexbox で要素が消える問題

## 現象

モバイル表示時にアイコンが突然消えた。デスクトップでは表示される。

## 原因

```css
/* 親要素 */
.container {
    display: flex;
    flex-direction: column;
}

/* 問題のある子要素 */
.previewCard {
    flex: 1;          /* デスクトップ: 残り空間を埋める */
    min-height: 0;    /* スクロール対応のため */
}

/* モバイル用の上書き */
@media (max-width: 600px) {
    .previewCard {
        flex: 0;      /* ← これが原因 */
    }
}
```

## なぜ消えたか

| プロパティ | 展開形 | 意味 |
|-----------|--------|------|
| `flex: 0` | `flex: 0 1 0%` | 初期サイズ0、縮小可能 |
| `flex: 1` | `flex: 1 1 0%` | 初期サイズ0、拡大可能 |
| `flex: none` | `flex: 0 0 auto` | 初期サイズ自動、固定 |

`flex: 0` + `min-height: 0` = **高さ0に潰れる** → 中身が見えなくなる

## 解決策

```css
@media (max-width: 600px) {
    .previewCard {
        flex: none;   /* 自然なサイズを保持 */
    }
}
```

## 教訓

- `flex: 0` は「サイズ0から始めて縮小も許可」という意味
- 要素を「伸縮させない」なら `flex: none` を使う
- デバッグ時は開発者ツールで要素の高さを確認する
