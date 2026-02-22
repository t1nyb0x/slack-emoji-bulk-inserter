/** 絵文字の登録状態 */
export const EmojiStatus = {
  Pending: "pending",
  Uploading: "uploading",
  Success: "success",
  Failed: "failed",
  Skipped: "skipped",
} as const;

export type EmojiStatus = (typeof EmojiStatus)[keyof typeof EmojiStatus];

/** ドロップされた1つの画像に対応する登録処理の単位 */
export interface EmojiRegistrationItem {
  readonly file: File;
  readonly originalFileName: string;
  readonly emojiName: string;
  status: EmojiStatus;
  errorCode: string | null;
}

/** Content Script初期化時にページから抽出する接続情報 */
export interface SlackApiConfig {
  readonly apiToken: string;
  readonly workspaceUrl: string;
}

/** emoji.add APIのレスポンス */
export interface EmojiAddResponse {
  readonly ok: boolean;
  readonly error?: string;
}
