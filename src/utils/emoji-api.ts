import type { EmojiAddResponse } from "../types";

const EMOJI_ADD_PATH = "/api/emoji.add";

/**
 * Slack内部API /api/emoji.add を呼び出して絵文字を登録する。
 * Content Scriptから同一オリジンでfetchするためCORS問題なし。
 */
export async function addEmoji(
  apiToken: string,
  emojiName: string,
  imageFile: File,
): Promise<EmojiAddResponse> {
  const formData = buildFormData(apiToken, emojiName, imageFile);
  const response = await fetchEmojiAdd(formData);

  return parseResponse(response);
}

function buildFormData(
  apiToken: string,
  emojiName: string,
  imageFile: File,
): FormData {
  const formData = new FormData();
  formData.append("token", apiToken);
  formData.append("name", emojiName);
  formData.append("mode", "data");
  formData.append("image", imageFile);

  return formData;
}

async function fetchEmojiAdd(formData: FormData): Promise<Response> {
  return fetch(EMOJI_ADD_PATH, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
}

async function parseResponse(response: Response): Promise<EmojiAddResponse> {
  if (response.status === 429) {
    return { ok: false, error: "ratelimited" };
  }

  const json: unknown = await response.json();

  if (!isEmojiAddResponse(json)) {
    return { ok: false, error: "unexpected_response" };
  }

  return json;
}

function isEmojiAddResponse(value: unknown): value is EmojiAddResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return (
    "ok" in value && typeof (value as Record<string, unknown>).ok === "boolean"
  );
}
