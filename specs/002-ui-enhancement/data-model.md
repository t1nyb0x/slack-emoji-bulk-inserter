# データモデル: UI改修 — エラーメッセージ・サムネイル・重複検知

**フィーチャーブランチ**: `002-ui-enhancement`
**作成日**: 2026-02-22

---

## エンティティ変更

### EmojiStatus（変更）

既存の4ステータスに `Skipped` を追加する。

```typescript
export const EmojiStatus = {
  Pending: "pending",
  Uploading: "uploading",
  Success: "success",
  Failed: "failed",
  Skipped: "skipped", // ← 追加
} as const;
```

**ステータス遷移**:

```
ドロップ時:
  重複なし → Pending → Uploading → Success / Failed
  重複あり → Skipped（以降遷移なし）
```

### EmojiRegistrationItem（変更なし）

既存の型定義をそのまま利用する。`errorCode` フィールドはすでに `string | null` で定義されており、重複スキップ時のメッセージキーもここに格納する。

```typescript
export interface EmojiRegistrationItem {
  readonly file: File;
  readonly originalFileName: string;
  readonly emojiName: string;
  status: EmojiStatus;
  errorCode: string | null; // "duplicate_in_queue" を新たに使用
}
```

---

## 新規データ構造

### エラーメッセージマッピング

`Record<string, string>` でエラーコードから日本語メッセージへのマッピングを管理する。

| エラーコード            | 日本語メッセージ                                     |
| ----------------------- | ---------------------------------------------------- |
| `error_name_taken`      | 同名の絵文字が既に登録されています                   |
| `error_name_taken_i18n` | 同名の絵文字が既に登録されています                   |
| `too_many_emoji`        | ワークスペースの絵文字上限に達しました               |
| `not_authed`            | 認証情報が見つかりません                             |
| `invalid_auth`          | セッションが無効です。ページを再読み込みしてください |
| `ratelimited`           | レートリミットに達しました。しばらくお待ちください   |
| `network_error`         | ネットワークエラーが発生しました                     |
| `no_image_uploaded`     | 画像ファイルのアップロードに失敗しました             |
| `invalid_name`          | 絵文字名が無効です                                   |
| `duplicate_in_queue`    | 同じ名前の絵文字がキュー内に存在します               |
| （未知のコード）        | 登録に失敗しました（エラーコード: {code}）           |

---

## バリデーションルール

### 重複検知ルール

- **スコープ**: `registrationQueue` 配列内の全アイテム
- **比較対象**: `emojiName` フィールド（正規化後の文字列）
- **判定タイミング**: `filesToRegistrationItems()` 実行時（ドロップ直後）
- **判定条件**: 同じ `emojiName` を持つアイテムが `registrationQueue` に既に存在する場合
- **結果**: ステータスを `Skipped`、`errorCode` を `"duplicate_in_queue"` に設定
