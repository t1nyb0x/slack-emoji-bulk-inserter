const API_TOKEN_PATTERN = /"?api_token"?\s*:\s*"([^"]+)"/;

/**
 * ページ内の<script>タグからSlackのapi_tokenを抽出する。
 * boot_dataに含まれるxoxs-セッショントークンを正規表現で取得する。
 */
export function extractApiToken(): string | null {
  const scripts = document.querySelectorAll('script[type="text/javascript"]');

  for (const script of Array.from(scripts)) {
    const text = script.textContent;
    if (!text) {
      continue;
    }

    const match = API_TOKEN_PATTERN.exec(text);
    if (!match?.[1]) {
      continue;
    }

    return match[1];
  }

  return null;
}
