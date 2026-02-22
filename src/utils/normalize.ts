/**
 * ファイル名から絵文字名を正規化する。
 *
 * 5ステップ:
 * 1. 拡張子を除去
 * 2. 大文字を小文字に変換
 * 3. 空白・ドットを _ に置換
 * 4. 英小文字・数字・ハイフン・アンダースコア・日本語文字（ひらがな・カタカナ・漢字）以外を除去
 * 5. 空文字列チェック（空の場合はnullを返す）
 */
export function normalizeEmojiName(fileName: string): string | null {
  const withoutExtension = removeExtension(fileName);
  const lowered = withoutExtension.toLowerCase();
  const spacesAndDotsReplaced = lowered.replace(/[\s.]+/g, "_");
  const sanitized = spacesAndDotsReplaced.replace(
    /[^a-z0-9\-_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/g,
    "",
  );

  if (sanitized === "") {
    return null;
  }

  return sanitized;
}

function removeExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex <= 0) {
    return fileName;
  }

  return fileName.substring(0, lastDotIndex);
}
