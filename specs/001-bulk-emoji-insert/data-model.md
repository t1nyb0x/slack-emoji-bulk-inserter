# データモデル: Slack絵文字一括登録

**フィーチャー**: `001-bulk-emoji-insert`
**作成日**: 2026-02-22

## エンティティ

### EmojiRegistrationItem（絵文字登録アイテム）

ドロップされた1つの画像ファイルに対応する、登録処理の単位。

| フィールド         | 型               | 説明                                                           |
| ------------------ | ---------------- | -------------------------------------------------------------- |
| `file`             | `File`           | ドロップされた画像ファイルオブジェクト                         |
| `originalFileName` | `string`         | 元のファイル名（拡張子含む）                                   |
| `emojiName`        | `string`         | 正規化後の絵文字名（拡張子除去・小文字変換・不正文字除去済み） |
| `status`           | `EmojiStatus`    | 現在の登録状態                                                 |
| `errorCode`        | `string \| null` | 失敗時のSlack APIエラーコード（成功・未処理時は`null`）        |

### EmojiStatus（絵文字ステータス列挙型）

| 値          | 説明                                               |
| ----------- | -------------------------------------------------- |
| `pending`   | 待機中（キューに入っているがまだ処理されていない） |
| `uploading` | 処理中（APIリクエスト送信中）                      |
| `success`   | 成功（Slackに正常に登録された）                    |
| `failed`    | 失敗（APIエラーまたはネットワークエラー）          |

### 状態遷移

```
pending → uploading → success
                    → failed
```

- `pending`: アイテム生成時の初期状態
- `uploading`: API呼び出し開始時に遷移
- `success`: APIレスポンスが `{ "ok": true }` の場合に遷移
- `failed`: APIレスポンスが `{ "ok": false }` またはネットワークエラーの場合に遷移
- 逆方向への遷移はない（一方向のみ）

### SlackApiConfig（Slack API設定）

Content Script初期化時にページから抽出する接続情報。

| フィールド     | 型       | 説明                                                               |
| -------------- | -------- | ------------------------------------------------------------------ |
| `apiToken`     | `string` | `boot_data`から抽出した`xoxs-`セッショントークン                   |
| `workspaceUrl` | `string` | 現在のワークスペースのベースURL（`https://{workspace}.slack.com`） |

## バリデーションルール

### 絵文字名の正規化（ファイル名 → emojiName）

1. 拡張子を除去する（例: `hello_world.png` → `hello_world`）
2. 大文字を小文字に変換する（例: `Hello_World` → `hello_world`）
3. 空白・ドットを`_`に置換する（例: `my emoji.v2` → `my_emoji_v2`）
4. 英小文字（a-z）・数字（0-9）・ハイフン（-）・アンダースコア（\_）以外の文字を除去する
5. 正規化後に空文字列になった場合はバリデーションエラーとする

### 画像ファイルのフィルタリング

- 受け付けるMIMEタイプ: `image/png`、`image/jpeg`、`image/gif`
- 上記以外のMIMEタイプのファイルは無視し、登録リストに追加しない
