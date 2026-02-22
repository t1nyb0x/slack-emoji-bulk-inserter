# 実装計画: 日本語絵文字名対応（ひらがな・カタカナ・漢字）

**ブランチ**: `003-japanese-emoji-name` | **日付**: 2026-02-22 | **仕様**: [spec.md](spec.md)
**入力**: `/specs/003-japanese-emoji-name/spec.md` からのフィーチャー仕様

## サマリー

現在の `normalizeEmojiName()` 関数は、ファイル名のサニタイズステップで `/[^a-z0-9\-_]/g` の正規表現を使用しており、日本語文字（ひらがな・カタカナ・漢字）を含むすべての非ASCII文字を除去している。

本改修では、この正規表現に日本語文字のUnicode範囲（ひらがな U+3040-U+309F、カタカナ U+30A0-U+30FF、CJK統合漢字 U+4E00-U+9FFF、CJK拡張A U+3400-U+4DBF、CJK互換漢字 U+F900-U+FAFF）を追加し、日本語文字を保持したまま絵文字名をAPIに送信可能にする。

**アプローチ**: 日本語文字をそのまま保持してSlack APIに送信し、判定をAPIに委ねる。Slackが受け入れれば成功、拒否された場合は既存のエラーメッセージ表示機構で「絵文字名が無効です」と表示する。

**変更規模**: `src/utils/normalize.ts` の1行（sanitize regex）の修正・正規化コメントの更新、および `src/ui/error-messages.ts` への `error_bad_name_i18n` マッピング追加（計2ファイル）。

## 技術コンテキスト

**言語/バージョン**: TypeScript 5.x（strict mode）
**主要な依存関係**: 変更なし（esbuild、@types/chrome）
**ストレージ**: N/A
**テスト**: N/A（仕様でテストは要求されていない）
**ターゲットプラットフォーム**: Chrome拡張機能（Manifest V3）— chrome120+ ターゲット
**プロジェクトタイプ**: single（既存構成を維持）
**パフォーマンス目標**: 既存と同等
**制約**: 50行制限・早期リターン・単一責任を維持
**スケール/スコープ**: 1ファイル・1行の正規表現修正

## コンスティテューションチェック

_ゲート: フェーズ0の調査前にパスする必要あり。フェーズ1の設計後に再チェック。_

| 原則                          | 設計前  | 設計後  | 備考                                                      |
| ----------------------------- | ------- | ------- | --------------------------------------------------------- |
| I. クリーンコード             | ✅ PASS | ✅ PASS | Unicode範囲をJSDoc + インラインコメントで自己説明的に     |
| II. 早期リターン              | ✅ PASS | ✅ PASS | 既存のガード節を維持                                      |
| III. メソッド行数制限（50行） | ✅ PASS | ✅ PASS | `normalizeEmojiName` は行数変化なし（正規表現の修正のみ） |
| IV. 単一責任メソッド          | ✅ PASS | ✅ PASS | `normalizeEmojiName` の責務は変わらない                   |
| TypeScript必須                | ✅ PASS | ✅ PASS | TypeScript維持                                            |
| any型禁止                     | ✅ PASS | ✅ PASS | any未使用                                                 |

**ゲート結果**: すべてパス。違反なし。

## プロジェクト構造

### ドキュメント（このフィーチャー）

```text
specs/003-japanese-emoji-name/
├── plan.md              # このファイル
├── spec.md              # フィーチャー仕様
├── research.md          # 調査結果
├── data-model.md        # データモデル（変更なし確認）
├── quickstart.md        # ビルド・確認手順
└── contracts/
    └── normalize-api.md # 正規化関数のAPIコントラクト
```

### ソースコード（変更対象）

```text
src/
├── utils/
│   └── normalize.ts     # 🔧 修正: sanitize regex に日本語Unicode範囲を追加
└── ui/
    └── error-messages.ts  # 🔧 修正: error_bad_name_i18n マッピングを追加
```

**構造の決定**: 変更は2ファイルのみ。新規ファイルの追加なし。既存のモジュール構造をそのまま維持する。

## 変更詳細

### 改修A: sanitize regex の拡張（`src/utils/normalize.ts`）

**変更対象**: `src/utils/normalize.ts`

1. ステップ4の sanitize regex `/[^a-z0-9\-_]/g` を、日本語Unicode範囲を許可する形に更新
2. JSDocコメントのステップ説明を更新（「英小文字・数字・ハイフン・アンダースコア以外」→「英小文字・数字・ハイフン・アンダースコア・日本語文字以外」）

**修正前**:

```typescript
const sanitized = spacesAndDotsReplaced.replace(/[^a-z0-9\-_]/g, "");
```

**修正後**:

```typescript
const sanitized = spacesAndDotsReplaced.replace(
  /[^a-z0-9\-_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/g,
  "",
);
```

### 変換例

| 入力ファイル名   | 正規化後     | 説明                                     |
| ---------------- | ------------ | ---------------------------------------- |
| `笑顔.png`       | `笑顔`       | 漢字のみ → 保持                          |
| `おはよう.png`   | `おはよう`   | ひらがなのみ → 保持                      |
| `ネコ.png`       | `ネコ`       | カタカナのみ → 保持                      |
| `Hello_世界.png` | `hello_世界` | 混合 → ASCII小文字化 + 日本語保持        |
| `ラーメン.png`   | `ラーメン`   | 長音符（U+30FC）はカタカナ範囲内 → 保持  |
| `test.png`       | `test`       | ASCIIのみ → 既存動作と同じ               |
| `My Emoji.png`   | `my_emoji`   | ASCIIのみ → 既存動作と同じ               |
| `😀.png`         | `null`       | 絵文字はUnicode範囲外 → 除去 → 空 → null |

### 改修B: error_bad_name_i18n マッピング追加（`src/ui/error-messages.ts`）

**変更対象**: `src/ui/error-messages.ts`

1. `ERROR_MESSAGES` の `Record<string, string>` に `error_bad_name_i18n: "絵文字名が無効です"` を追加
2. 既存の `invalid_name` と同じ日本語メッセージを使用（意味が同一のため）

**修正前**:

```typescript
const ERROR_MESSAGES: Record<string, string> = {
  error_name_taken: "同名の絵文字が既に登録されています",
  error_name_taken_i18n: "同名の絵文字が既に登録されています",
  // ...
  invalid_name: "絵文字名が無効です",
  // error_bad_name_i18n は未登録
```

**修正後**:

```typescript
const ERROR_MESSAGES: Record<string, string> = {
  error_name_taken: "同名の絵文字が既に登録されています",
  error_name_taken_i18n: "同名の絵文字が既に登録されています",
  // ...
  invalid_name: "絵文字名が無効です",
  error_bad_name_i18n: "絵文字名が無効です",  // ← 追加
```

## 複雑性の追跡

> コンスティテューションチェックに正当化が必要な違反がないため、このセクションは空。
