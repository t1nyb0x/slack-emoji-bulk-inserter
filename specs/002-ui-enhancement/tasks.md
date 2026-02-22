# タスク: UI改修 — エラーメッセージ・サムネイル・重複検知

**入力**: `/specs/002-ui-enhancement/` からの設計ドキュメント
**前提条件**: plan.md（必須）、spec.md（ユーザーストーリーに必須）、research.md、data-model.md、contracts/

**テスト**: 仕様でテストは要求されていないため、テストタスクは含まれていません。

**整理**: タスクはユーザーストーリーごとにグループ化されており、各ストーリーの独立した実装とテストを可能にしています。

## 形式: `[ID] [P?] [Story] 説明`

- **[P]**: 並列実行可能（異なるファイル、依存関係なし）
- **[Story]**: このタスクが属するユーザーストーリー（例: US1、US2、US3）
- 説明に正確なファイルパスを含めること

## パス規約

- **単一プロジェクト**: リポジトリルートの `src/`
- ビルド出力: `dist/`
- 設定ファイル: リポジトリルート

---

## フェーズ1: 基盤（ブロッキング前提条件）

**目的**: 全ユーザーストーリーが依存する型変更

**⚠️ 重要**: このフェーズが完了するまでユーザーストーリーの作業は開始不可

- [ ] T001 [US3] `src/types.ts` の `EmojiStatus` に `Skipped: "skipped"` を追加（data-model.mdに基づく）

**チェックポイント**: 型定義更新完了 — ユーザーストーリーの実装を開始可能

---

## フェーズ2: ユーザーストーリー1 — 登録失敗時のエラーメッセージ表示（優先度: P1）🎯

**目標**: 登録失敗時に ❌ アイコンの横にエラー原因を日本語テキストで表示する

**独立テスト**: 既に存在する絵文字名で画像をドロップし、日本語エラーメッセージが表示されることを確認する

- [ ] T002 [US1] `src/ui/error-messages.ts` を新規作成し、`getErrorMessage(errorCode: string | null): string` 関数を実装。`Record<string, string>` でエラーコード→日本語メッセージのマッピングを定義（data-model.mdのマッピング表に基づく。対象: `error_name_taken`, `error_name_taken_i18n`, `too_many_emoji`, `not_authed`, `invalid_auth`, `ratelimited`, `network_error`, `no_image_uploaded`, `invalid_name`, `duplicate_in_queue`）。未知のエラーコードには `"登録に失敗しました（エラーコード: {code}）"` を返す
- [ ] T003 [US1] `src/ui/status-list.ts` の `buildItemRow()` に `<span data-role="error">` を追加（初期状態は空テキスト、スタイル: `color: #D32F2F; font-size: 12px; margin-left: 4px`。contracts/status-list-ui.mdに基づく）
- [ ] T004 [US1] `src/ui/status-list.ts` の `updateItemStatus()` を修正し、`Failed` / `Skipped` ステータス時に `getErrorMessage(item.errorCode)` の結果を `[data-role="error"]` span に表示する

**チェックポイント**: エラーメッセージ表示が動作 — 失敗した絵文字の横に日本語テキストが表示される

---

## フェーズ3: ユーザーストーリー2 — サムネイルプレビュー表示（優先度: P2）

**目標**: リスト行にドロップされた画像の24×24pxサムネイルを表示する

**独立テスト**: 画像ドロップ後、各行に小さなプレビュー画像が表示されることを確認する

- [ ] T005 [US2] `src/ui/status-list.ts` の `buildItemRow()` に `<img data-role="thumbnail">` を追加。`URL.createObjectURL(item.file)` でsrc設定、24×24px固定サイズ、`object-fit: contain; border-radius: 2px; flex-shrink: 0;`。`img.onload` で `URL.revokeObjectURL(img.src)` を実行してメモリ解放（contracts/status-list-ui.mdに基づく）。レイアウト順序: `[status] [thumbnail] [:emoji_name:] [error]`

**チェックポイント**: サムネイル表示が動作 — 各行に画像プレビューが表示される

---

## フェーズ4: ユーザーストーリー3 — ドロップ時の重複絵文字名検知（優先度: P2）

**目標**: 同じファイル名を2回ドロップした場合に2回目をスキップし、不要なAPI呼び出しを防ぐ

**独立テスト**: 同じファイル名の画像を2回ドロップし、2回目が ⚠️ 付きでスキップされることを確認する

- [ ] T006 [US3] `src/content.ts` に `isDuplicateInQueue(emojiName: string): boolean` 関数を追加。`registrationQueue` 内に同じ `emojiName` を持つアイテムが存在するか `Array.some()` でチェックする
- [ ] T007 [US3] `src/content.ts` の `filesToRegistrationItems()` を修正。正規化後に `isDuplicateInQueue()` を呼び出し、重複がある場合は `status: EmojiStatus.Skipped, errorCode: "duplicate_in_queue"` でアイテムを作成する
- [ ] T008 [US3] `src/ui/status-list.ts` の `getStatusIcon()` に `skipped: "⚠️"` を追加
- [ ] T009 [US3] `src/ui/status-list.ts` の `showSummary()` を修正し、`Skipped` ステータスのカウントを追加。サマリーテキストを `"完了: ✅ {n}件成功 / ❌ {n}件失敗 / ⚠️ {n}件スキップ"` に更新。背景色ロジック: 失敗あり→`#FFF3CD`、失敗なしスキップあり→`#FFF3CD`、全件成功→`#D4EDDA`

**チェックポイント**: 重複検知が動作 — 同じファイルを2回ドロップすると2回目がスキップされる

---

## フェーズ5: 仕上げ

**目的**: ビルド確認とコンスティテューション遵守の最終検証

- [ ] T010 `npm run build` を実行し、TypeScriptコンパイル + esbuild バンドルがエラーなく完了することを確認。全ファイルが50行制限・早期リターン・単一責任・any禁止を遵守していることをセルフレビューする
