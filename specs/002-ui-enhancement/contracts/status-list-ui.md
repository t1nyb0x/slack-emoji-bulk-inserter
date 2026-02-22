# UIコントラクト: ステータスリスト行

**フィーチャー**: `002-ui-enhancement`
**作成日**: 2026-02-22

本ドキュメントは、UI改修後のステータスリスト行のDOM構造とスタイルを定義する。

---

## リスト行のDOM構造（改修後）

```
<div id="emoji-item-{index}">
  <span data-role="status">       <!-- ステータスアイコン: ⏳🔄✅❌⚠️ -->
  <img data-role="thumbnail">     <!-- サムネイルプレビュー: 24×24px -->
  <span data-role="name">         <!-- 絵文字名: :emoji_name: -->
  <span data-role="error">        <!-- エラーメッセージ（Failed/Skipped時のみ表示） -->
</div>
```

### 各要素の仕様

| 要素               | data-role   | 幅               | 表示条件         | 内容                                  |
| ------------------ | ----------- | ---------------- | ---------------- | ------------------------------------- |
| ステータスアイコン | `status`    | 20px (min-width) | 常時             | `getStatusIcon()` の戻り値            |
| サムネイル         | `thumbnail` | 24×24px (固定)   | 常時             | `URL.createObjectURL(item.file)`      |
| 絵文字名           | `name`      | auto             | 常時             | `:emojiName:` 形式                    |
| エラーメッセージ   | `error`     | auto             | Failed/Skipped時 | `getErrorMessage(errorCode)` の戻り値 |

### サムネイル `<img>` の属性

```html
<img
  data-role="thumbnail"
  src="{blobURL}"
  width="24"
  height="24"
  style="object-fit: contain; border-radius: 2px; flex-shrink: 0;"
  alt=":emoji_name:"
/>
```

- `onload` で `URL.revokeObjectURL(this.src)` を実行してメモリを解放

### エラーメッセージ `<span>` のスタイル

```css
[data-role="error"] {
  color: #d32f2f; /* 赤系テキスト */
  font-size: 12px;
  margin-left: 4px;
}
```

---

## ステータスアイコンマッピング（改修後）

| ステータス  | アイコン |
| ----------- | -------- |
| `pending`   | ⏳       |
| `uploading` | 🔄       |
| `success`   | ✅       |
| `failed`    | ❌       |
| `skipped`   | ⚠️       |

---

## サマリー表示（改修後）

```
完了: ✅ {success}件成功 / ❌ {failed}件失敗 / ⚠️ {skipped}件スキップ
```

- スキップ件数が0の場合もスキップ欄は表示する
- 背景色: 失敗ありは `#FFF3CD`（黄色系）、スキップのみは `#FFF3CD`、全件成功は `#D4EDDA`（緑系）

---

## エラーメッセージ関数シグネチャ

```typescript
/**
 * エラーコードから日本語のエラーメッセージを返す。
 * 未知のエラーコードの場合はフォールバックメッセージを返す。
 */
function getErrorMessage(errorCode: string | null): string;
```

### 入出力例

| 入力                   | 出力                                                     |
| ---------------------- | -------------------------------------------------------- |
| `"error_name_taken"`   | `"同名の絵文字が既に登録されています"`                   |
| `"network_error"`      | `"ネットワークエラーが発生しました"`                     |
| `"duplicate_in_queue"` | `"同じ名前の絵文字がキュー内に存在します"`               |
| `"unknown_code_xyz"`   | `"登録に失敗しました（エラーコード: unknown_code_xyz）"` |
| `null`                 | `"不明なエラーが発生しました"`                           |
