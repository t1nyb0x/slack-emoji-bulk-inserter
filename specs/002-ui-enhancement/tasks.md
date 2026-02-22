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

**目的**: 全ユーザーストーリーが依存する型定義の変更

**⚠️ 重要**: このフェーズが完了するまでユーザーストーリーの作業は開始不可

- [x] T001 `src/types.ts` の `EmojiStatus` オブジェクトに `Skipped: "skipped"` を追加する（data-model.mdに基づく）。既存の `as const` + ユニオン型により型は自動拡張される

**チェックポイント**: 型定義更新完了 — ユーザーストーリーの実装を開始可能

---

## フェーズ2: ユーザーストーリー1 — 登録失敗時のエラーメッセージ表示（優先度: P1）🎯

**目標**: 登録失敗時に ❌ アイコンの横にエラー原因を日本語テキストで表示する

**独立テスト**: 既に存在する絵文字名で画像をドロップし、日本語エラーメッセージが表示されることを確認する

- [x] T002 [P] [US1] `src/ui/error-messages.ts` を新規作成し、`getErrorMessage(errorCode: string | null): string` 関数をexportする。`Record<string, string>` でエラーコード→日本語メッセージのマッピングを定義する（data-model.mdのマッピング表に基づく。対象: `error_name_taken`, `error_name_taken_i18n`, `too_many_emoji`, `not_authed`, `invalid_auth`, `ratelimited`, `network_error`, `no_image_uploaded`, `invalid_name`, `duplicate_in_queue`）。未知のエラーコードには `"登録に失敗しました（エラーコード: {code}）"` を返し、`null` には `"不明なエラーが発生しました"` を返す
- [x] T003 [P] [US1] `src/ui/status-list.ts` の `buildItemRow()` に `<span data-role="error">` を追加する。初期状態は空テキスト。スタイル: `color: #D32F2F; font-size: 12px; margin-left: 4px`（contracts/status-list-ui.mdに基づく）。既存のレイアウトは `[status] [name]` → `[status] [name] [error]` に変更
- [x] T004 [US1] `src/ui/status-list.ts` の `updateItemStatus()` を修正する。`Failed` または `Skipped` ステータス時に `getErrorMessage(item.errorCode)` の結果を `[data-role="error"]` span の `textContent` に設定する。`getErrorMessage` は `src/ui/error-messages.ts` からimportする（T002, T003に依存）

**チェックポイント**: エラーメッセージ表示が動作 — 失敗した絵文字の横に日本語テキストが表示される

---

## フェーズ3: ユーザーストーリー2 — サムネイルプレビュー表示（優先度: P2）

**目標**: リスト行にドロップされた画像の24×24pxサムネイルを表示する

**独立テスト**: 画像ドロップ後、各行に小さなプレビュー画像が表示されることを確認する

- [x] T005 [US2] `src/ui/status-list.ts` に `buildThumbnail(file: File, emojiName: string): HTMLImageElement` ヘルパー関数を追加する。`URL.createObjectURL(file)` でsrc設定、width=24・height=24固定、`object-fit: contain; border-radius: 2px; flex-shrink: 0;` のスタイル設定、`alt=":{emojiName}:"` を設定する。`img.onload` で `URL.revokeObjectURL(img.src)` を実行してメモリを解放する（FR-107, contracts/status-list-ui.mdに基づく）
- [x] T006 [US2] `src/ui/status-list.ts` の `buildItemRow()` を修正し、`buildThumbnail()` で生成した `<img>` を `statusSpan` と `nameSpan` の間に挿入する。レイアウト順序を `[status] [thumbnail] [name] [error]` とする（contracts/status-list-ui.mdに基づく。T005に依存）

**チェックポイント**: サムネイル表示が動作 — 各行に画像プレビューが表示される

---

## フェーズ4: ユーザーストーリー3 — ドロップ時の重複絵文字名検知（優先度: P2）

**目標**: 同じファイル名を2回ドロップした場合に2回目をスキップし、不要なAPI呼び出しを防ぐ

**独立テスト**: 同じファイル名の画像を2回ドロップし、2回目が ⚠️ 付きでスキップされることを確認する

- [x] T007 [P] [US3] `src/content.ts` に `isDuplicateInQueue(emojiName: string): boolean` 関数を追加する。`registrationQueue` 内に同じ `emojiName` を持つアイテムが存在するか `Array.some()` でチェックする
- [x] T008 [P] [US3] `src/ui/status-list.ts` の `getStatusIcon()` に `skipped: "⚠️"` エントリを追加する
- [x] T009 [US3] `src/content.ts` の `filesToRegistrationItems()` を修正する。正規化後に (1) `isDuplicateInQueue(emojiName)` で既存キューとの重複をチェック、(2) 同一バッチ内の `items` 配列に同じ `emojiName` が存在するかチェック。いずれかで重複がある場合は `status: EmojiStatus.Skipped, errorCode: "duplicate_in_queue"` でアイテムを作成する（明確化事項「バッチ内も重複検知する」に基づく。T007に依存）
- [x] T010 [US3] `src/ui/status-list.ts` の `showSummary()` と `buildSummaryElement()` を修正する。`EmojiStatus.Skipped` のカウントを追加し、サマリーテキストを `"完了: ✅ {n}件成功 / ❌ {n}件失敗 / ⚠️ {n}件スキップ"` に更新する。`buildSummaryElement` の引数に `skippedCount` を追加する。背景色ロジック: 失敗あり→`#FFF3CD`、失敗なしスキップあり→`#FFF3CD`、全件成功→`#D4EDDA`（contracts/status-list-ui.mdに基づく）

**チェックポイント**: 重複検知が動作 — 同じファイルを2回ドロップすると2回目がスキップされる

---

## フェーズ5: 仕上げ

**目的**: ビルド確認とコンスティテューション遵守の最終検証

- [x] T011 `npm run build` を実行し、TypeScriptコンパイル + esbuild バンドルがエラーなく完了することを確認する。全ファイルが50行制限・早期リターン・単一責任・any禁止を遵守していることをセルフレビューする

---

## 依存関係と実行順序

### フェーズの依存関係

- **基盤（フェーズ1）**: 依存なし — すぐに開始可能
- **US1（フェーズ2）**: T001完了後に開始可能
- **US2（フェーズ3）**: T001完了後に開始可能。ただし `buildItemRow()` をT003と共有するため、T003完了後が望ましい
- **US3（フェーズ4）**: T001完了後に開始可能
- **仕上げ（フェーズ5）**: 全ユーザーストーリー完了後に実行

### ユーザーストーリーの依存関係

- **US1（P1）**: 基盤（T001）後に開始可能。他のストーリーへの依存なし
- **US2（P2）**: 基盤（T001）後に開始可能。`buildItemRow` をUS1のT003と共有するため、T003完了後が推奨
- **US3（P2）**: 基盤（T001）後に開始可能。US1・US2への依存なし

### 推奨実行順序

```
T001 → T002 ─┐
         T003 ─┤→ T004 → T005 → T006 → T007 ─┐
              │                          T008 ─┤→ T009 → T010 → T011
              │                                │
              └────────────────────────────────┘
```

### 並列実行の機会

- T002 と T003 は並列実行可能（異なるファイル/関数を対象）
- T007 と T008 は並列実行可能（異なるファイルを対象）

---

## 実装戦略

- **MVPスコープ**: US1（エラーメッセージ表示）のみでもユーザーに価値を提供可能
- **インクリメンタルデリバリー**: 各フェーズ完了時に動作確認可能な状態を維持
- **リスク**: `buildItemRow()` が複数フェーズで修正されるため、T003 → T005/T006 の順序を厳守すること
