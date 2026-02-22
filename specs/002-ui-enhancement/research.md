# 調査: UI改修 — エラーメッセージ・サムネイル・重複検知

**フィーチャーブランチ**: `002-ui-enhancement`
**作成日**: 2026-02-22

---

## 調査1: エラーメッセージの表示方法

### 決定事項

エラーコードから日本語メッセージへの変換関数 `getErrorMessage()` を新規作成し、`src/ui/status-list.ts` 内の `updateItemStatus()` で失敗時にテキストを追加表示する。

### 根拠

- 既存コードで `EmojiRegistrationItem.errorCode` に文字列を格納しており、マッピング関数で変換するのが最もシンプル
- 日本語メッセージは `Record<string, string>` で管理し、未知のエラーコードにはフォールバックメッセージを返す
- UI変更は `buildItemRow` への `<span data-role="error">` 追加のみで完結する

### 検討した代替案

- **i18nライブラリの導入**: 過剰。本拡張は日本語のみ対応のため不要
- **エラーコードをそのまま表示**: ユーザーにとって技術的すぎて不親切

---

## 調査2: サムネイルプレビューの実装方式

### 決定事項

`URL.createObjectURL(item.file)` で Blob URL を生成し、`<img>` タグの `src` に設定する。24×24px、`object-fit: contain`。画像ロード完了後に `URL.revokeObjectURL()` でメモリを解放する。

### 根拠

- `createObjectURL` はメモリに直接バインドするため非常に高速
- `FileReader` + Data URL よりもメモリ効率が良い
- `revokeObjectURL` のタイミングは `img.onload` で十分（表示後に解放してもブラウザのレンダリングに影響なし）

### 検討した代替案

- **FileReader.readAsDataURL**: Base64 エンコードが必要でメモリ効率が悪い。100枚以上の画像では差が顕著
- **Canvas によるリサイズ**: 24px表示のみなので `<img>` タグの `width/height` 指定で十分。不要な複雑さ

---

## 調査3: 重複絵文字名の検知タイミングと方法

### 決定事項

`filesToRegistrationItems()` 内で、新しいアイテムの `emojiName` が既存の `registrationQueue` に存在するかチェックする。重複があれば `Skipped` ステータスで追加し、`processItem()` でスキップする。

### 根拠

- 検知タイミングはドロップ時（キュー追加時）が最適。API呼び出し前に防げる
- 既存の `registrationQueue` 配列を `some()` で検索するため、追加の依存関係不要
- `EmojiStatus` に `Skipped` を追加し、既存の `processQueue` のフローを変更しない（`findNextPendingIndex` で自然にスキップされる）

### 検討した代替案

- **Set で管理**: `registrationQueue` と別に `Set<string>` を持つ方式。配列検索より高速だが、100件程度のスケールでは体感差なし。不要な状態管理の増加を避ける
- **API呼び出し直前に検知**: 重複アイテムにも「待機中→処理中」の遷移が発生し、ユーザーに紛らわしい。ドロップ時が直感的

---

## 調査4: `EmojiStatus` への `Skipped` 追加の影響範囲

### 決定事項

`EmojiStatus` オブジェクトに `Skipped: "skipped"` を追加する。影響範囲は以下に限定される。

### 根拠

- `getStatusIcon()`: `skipped: "⚠️"` を追加
- `showSummary()`: スキップ件数のカウントと表示を追加
- `processQueue()` / `findNextPendingIndex()`: `Pending` ステータスのみを処理対象とする既存ロジックで自然にスキップされるため変更不要
- 既存の型定義は `as const` + ユニオン型のため、値を追加するだけで型が自動拡張される

### 検討した代替案

- **別フラグ `isSkipped: boolean` を追加**: 型の整合性を崩し、条件分岐が複雑化する。ステータス列挙型に統合する方が一貫性がある
