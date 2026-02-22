# 実装計画: UI改修 — エラーメッセージ・サムネイル・重複検知

**ブランチ**: `002-ui-enhancement` | **日付**: 2026-02-22 | **仕様**: [spec.md](spec.md)
**入力**: `/specs/002-ui-enhancement/spec.md` からのフィーチャー仕様

## サマリー

001-bulk-emoji-insert で構築済みの Slack 絵文字一括登録拡張に対し、3つのUI改修を行う。

1. **エラーメッセージ表示**: 登録失敗時に ❌ の横にエラー原因を日本語テキストで表示する。エラーコード→日本語メッセージの変換関数 `getErrorMessage()` を新規作成し、`buildItemRow` と `updateItemStatus` を拡張する。
2. **サムネイルプレビュー**: リスト行に `URL.createObjectURL` で生成した画像プレビュー（24×24px）を追加する。`onload` で `revokeObjectURL` してメモリを解放する。
3. **重複絵文字名検知**: ドロップ時に `registrationQueue` 内の既存アイテムと `emojiName` を比較し、重複があれば `Skipped` ステータスでキューに追加してAPI呼び出しをスキップする。

いずれも既存モジュールの拡張が中心で、新規ファイルは `src/ui/error-messages.ts`（エラーメッセージ関数）の1つのみ。

## 技術コンテキスト

**言語/バージョン**: TypeScript 5.x（strict mode）
**主要な依存関係**: esbuild（ビルド）、@types/chrome（型定義）— 変更なし
**ストレージ**: N/A
**テスト**: N/A（仕様でテストは要求されていない）
**ターゲットプラットフォーム**: Chrome拡張機能（Manifest V3）— 変更なし
**プロジェクトタイプ**: single（既存構成を維持）
**パフォーマンス目標**: サムネイル100枚以上の表示に遅延なし
**制約**: 既存の50行制限・早期リターン・単一責任を維持
**スケール/スコープ**: 既存機能の拡張のみ。新規ファイル1つ、既存ファイル3つの修正

## コンスティテューションチェック

*ゲート: フェーズ0の調査前にパスする必要あり。フェーズ1の設計後に再チェック。*

| 原則 | 設計前 | 設計後 | 備考 |
| --- | --- | --- | --- |
| I. クリーンコード | ✅ PASS | ✅ PASS | `getErrorMessage` は Record で自己説明的。サムネイル生成も明確な関数に分離 |
| II. 早期リターン | ✅ PASS | ✅ PASS | 重複検知・null チェックでガード節を使用 |
| III. メソッド行数制限（50行） | ✅ PASS | ✅ PASS | `buildItemRow` は要素追加で行数増加するが、サムネイル生成を別関数に分離して50行以内を維持 |
| IV. 単一責任メソッド | ✅ PASS | ✅ PASS | エラーメッセージ変換は専用関数、サムネイル生成は専用関数、重複チェックは専用関数に分離 |
| TypeScript必須 | ✅ PASS | ✅ PASS | 全コードTypeScript |
| any型禁止 | ✅ PASS | ✅ PASS | strict mode 継続、any 一切不使用 |

**ゲート結果**: すべてパス。違反なし。

## プロジェクト構造

### ドキュメント（このフィーチャー）

```text
specs/002-ui-enhancement/
├── plan.md              # このファイル
├── spec.md              # フィーチャー仕様
├── research.md          # フェーズ0の調査結果
├── data-model.md        # データモデル（EmojiStatus変更、エラーマッピング）
├── quickstart.md        # ビルド・確認手順
├── contracts/
│   └── status-list-ui.md   # リスト行DOM構造・エラーメッセージ仕様
└── tasks.md             # タスク一覧
```

### ソースコード（変更対象）

```text
src/
├── content.ts               # 🔧 修正: 重複検知ロジック追加
├── types.ts                 # 🔧 修正: EmojiStatus に Skipped 追加
├── ui/
│   ├── drop-zone.ts         # 変更なし
│   ├── error-messages.ts    # 🆕 新規: エラーコード→日本語メッセージ変換
│   └── status-list.ts       # 🔧 修正: サムネイル・エラーメッセージ・サマリー拡張
└── utils/
    ├── emoji-api.ts         # 変更なし
    ├── normalize.ts         # 変更なし
    └── token.ts             # 変更なし
```

**構造の決定**: 既存の単一プロジェクト構造を維持する。新規ファイル `src/ui/error-messages.ts` のみ追加し、エラーメッセージ変換の責務を分離する。既存の3ファイル（`types.ts`、`content.ts`、`status-list.ts`）は拡張のみで、インターフェースの破壊的変更は行わない。

## 変更詳細

### 改修A: エラーメッセージ表示

**変更対象**: `src/ui/error-messages.ts`（新規）、`src/ui/status-list.ts`

1. `src/ui/error-messages.ts` にエラーコード→日本語メッセージの変換関数 `getErrorMessage(errorCode: string | null): string` を作成
2. `buildItemRow()` に `<span data-role="error">` を追加（初期状態は空テキスト）
3. `updateItemStatus()` で `Failed` / `Skipped` 時にエラーメッセージを表示

### 改修B: サムネイルプレビュー

**変更対象**: `src/ui/status-list.ts`

1. `buildItemRow()` に `<img data-role="thumbnail">` を追加
2. `URL.createObjectURL(item.file)` でプレビューURL生成
3. `img.onload` で `URL.revokeObjectURL` を実行しメモリ解放
4. レイアウト: `[status] [thumbnail] [:emoji_name:] [error]`

### 改修C: 重複絵文字名検知

**変更対象**: `src/types.ts`、`src/content.ts`、`src/ui/status-list.ts`

1. `EmojiStatus` に `Skipped: "skipped"` を追加
2. `content.ts` に `isDuplicateInQueue(emojiName)` 関数を追加
3. `filesToRegistrationItems()` で重複検知し、`Skipped` ステータスでキュー追加
4. `getStatusIcon()` に `skipped: "⚠️"` を追加
5. `showSummary()` にスキップ件数を追加

## 複雑性の追跡

> コンスティテューションチェックに正当化が必要な違反がないため、このセクションは空。
