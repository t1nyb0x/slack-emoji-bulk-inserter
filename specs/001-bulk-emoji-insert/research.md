# 調査結果: Slack絵文字一括登録

**フィーチャー**: `001-bulk-emoji-insert`
**調査日**: 2026-02-22

## 決定事項

### 1. 絵文字登録API

- **決定**: Slack内部API `/api/emoji.add` を使用する
- **根拠**: Content Scriptからの`fetch`が同一オリジンとなるためCORS問題なし。ブラウザがSlackセッションCookieを自動付与するため認証も透過的に動作する
- **検討した代替案**:
  - DOM操作（カスタマイズページのフォームを操作）→ Slack UIの変更で容易に壊れるため却下
  - 公式API `admin.emoji.add` → Enterprise Grid専用・OAuthトークンが必要で一般ユーザーには使えないため却下

### 2. api_token 抽出方法

- **決定**: ページ内の`<script type="text/javascript">`タグのテキストから正規表現でapi_tokenを抽出する
- **根拠**: Content ScriptはIsolated Worldで動作するため`window.boot_data`に直接アクセスできないが、`<script>`タグの`innerText`はDOMの一部でありContent Scriptから読み取り可能。neutral-face-emoji-toolsでも同手法が実証済み
- **トークン形式**: `xoxs-` プレフィックス（セッショントークン）
- **抽出正規表現**: `/"?api_token"?\s*:\s*"([^"]+)"/`
- **検討した代替案**:
  - `<script>`タグをMAIN worldに注入して`window.boot_data`を読む → 不要に複雑で、Manifest V3では制約もあるため却下

### 3. Content Script注入方式

- **決定**: manifest.jsonの`content_scripts`で静的宣言（ページ読み込み時に自動実行）
- **根拠**: カスタマイズページを開くたびに自動実行が必要であり、動的注入のメリットがない。`scripting`パーミッションも不要
- **matchesパターン**: `"https://*.slack.com/customize/emoji*"`
- **検討した代替案**:
  - `chrome.scripting.executeScript` → 動的制御が不要なため過剰

### 4. ビルドツール

- **決定**: esbuild（シンプル構成）
- **根拠**: 本プロジェクトはContent Script 1つ + manifest.jsonの極めてシンプルな構成。WXTはService Worker・Popup・複数Content Scriptを管理するフレームワークであり、本プロジェクトのスコープに対してオーバーキル
- **検討した代替案**:
  - WXT → 機能過多で学習コスト・依存の肥大化が不要
  - webpack → 設定が複雑で小規模プロジェクトに不適
  - tscのみ → バンドルが手動になるため、esbuildの方がシンプル

### 5. Content ScriptからのAPI呼び出し

- **決定**: Content Script内から直接`fetch()`で`/api/emoji.add`を呼び出す
- **根拠**: Content Scriptは注入先ページのオリジンに属するため、`*.slack.com`への通信は同一オリジン。CORSの問題は発生しない。Service Worker経由のメッセージ中継は不要
- **Cookie**: ブラウザが自動付与するため`credentials: 'include'`を指定するだけで認証が通る

### 6. `/api/emoji.add` 仕様

- **メソッド**: POST
- **Content-Type**: `multipart/form-data`（FormData）
- **必須フィールド**: `token`（xoxs-トークン）、`name`（絵文字名）、`mode`（`"data"`固定）、`image`（画像ファイル）
- **成功レスポンス**: `{ "ok": true }`
- **失敗レスポンス**: `{ "ok": false, "error": "<error_code>" }`（HTTP 200で返る点に注意）
- **主要エラーコード**:
  - `error_name_taken` / `error_name_taken_i18n`: 同名の絵文字が既に存在
  - `too_many_emoji`: ワークスペースの絵文字上限に到達
  - `not_authed` / `invalid_auth`: 認証失敗
  - `no_image_uploaded`: 画像ファイルなし
  - `invalid_name`: 不正な絵文字名
- **レートリミット**: HTTP 429 + `Retry-After`ヘッダ

### 7. 先行プロジェクトからの知見

| プロジェクト             | 言語                      | 知見                                                                       |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------- |
| neutral-face-emoji-tools | TypeScript + Svelte + WXT | Content ScriptでのDOM解析によるトークン抽出、`emoji.add`呼び出しが実証済み |
| slack-emojinator         | Python (CLI)              | トークン抽出の正規表現、FormData構造、429エラーハンドリングが参考になる    |

## 技術的リスク

| リスク                             | 影響                     | 緩和策                                                                                    |
| ---------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| Slackが`boot_data`の構造を変更する | トークン抽出が失敗する   | 抽出ロジックを独立したモジュールに分離し、変更時の修正を容易にする                        |
| `xoxs-`トークン形式の変更          | 認証が失敗する           | トークン形式のバリデーションを緩くし、プレフィックスに依存しない                          |
| `/api/emoji.add`の仕様変更・廃止   | 絵文字登録が不可能になる | APIレスポンスのエラーハンドリングを網羅的に行い、ユーザーに明確なフィードバックを提供する |
