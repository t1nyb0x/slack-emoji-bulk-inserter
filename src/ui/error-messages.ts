/** エラーコードから日本語メッセージへのマッピング */
const ERROR_MESSAGES: Record<string, string> = {
  error_name_taken: "同名の絵文字が既に登録されています",
  error_name_taken_i18n: "同名の絵文字が既に登録されています",
  too_many_emoji: "ワークスペースの絵文字上限に達しました",
  not_authed: "認証情報が見つかりません",
  invalid_auth: "セッションが無効です。ページを再読み込みしてください",
  ratelimited: "レートリミットに達しました。しばらくお待ちください",
  network_error: "ネットワークエラーが発生しました",
  no_image_uploaded: "画像ファイルのアップロードに失敗しました",
  invalid_name: "絵文字名が無効です",
  error_bad_name_i18n: "絵文字名が無効です",
  duplicate_in_queue: "同じ名前の絵文字がキュー内に存在します",
};

/**
 * エラーコードから日本語のエラーメッセージを返す。
 * 未知のエラーコードの場合はフォールバックメッセージを返す。
 */
export function getErrorMessage(errorCode: string | null): string {
  if (!errorCode) {
    return "不明なエラーが発生しました";
  }

  return (
    ERROR_MESSAGES[errorCode] ??
    `登録に失敗しました（エラーコード: ${errorCode}）`
  );
}
