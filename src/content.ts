import { EmojiStatus, type EmojiRegistrationItem } from "./types";
import { extractApiToken } from "./utils/token";
import { normalizeEmojiName } from "./utils/normalize";
import { addEmoji } from "./utils/emoji-api";
import { createDropZone } from "./ui/drop-zone";
import {
  createStatusList,
  addItemToList,
  updateItemStatus,
  showSummary,
} from "./ui/status-list";

const DELAY_MS = 800;

const registrationQueue: EmojiRegistrationItem[] = [];
let isProcessing = false;

function main(): void {
  const apiToken = extractApiToken();

  if (!apiToken) {
    console.error("[Slack Emoji Bulk Inserter] api_token の抽出に失敗しました");
    return;
  }

  const dropZone = createDropZone((files) =>
    handleFilesDropped(files, apiToken),
  );
  createStatusList(dropZone);
}

function handleFilesDropped(files: File[], apiToken: string): void {
  const newItems = filesToRegistrationItems(files);

  for (const item of newItems) {
    const index = registrationQueue.length;
    registrationQueue.push(item);
    addItemToList(item, index);
  }

  if (!isProcessing) {
    void processQueue(apiToken);
  }
}

function filesToRegistrationItems(files: File[]): EmojiRegistrationItem[] {
  const items: EmojiRegistrationItem[] = [];

  for (const file of files) {
    const emojiName = normalizeEmojiName(file.name);

    if (!emojiName) {
      continue;
    }

    items.push({
      file,
      originalFileName: file.name,
      emojiName,
      status: EmojiStatus.Pending,
      errorCode: null,
    });
  }

  return items;
}

async function processQueue(apiToken: string): Promise<void> {
  isProcessing = true;

  let index = findNextPendingIndex(0);

  while (index !== -1) {
    const item = registrationQueue[index];

    if (!item) {
      break;
    }

    await processItem(item, index, apiToken);
    await delay(DELAY_MS);

    index = findNextPendingIndex(index + 1);
  }

  showSummary(registrationQueue);
  isProcessing = false;
}

async function processItem(
  item: EmojiRegistrationItem,
  index: number,
  apiToken: string,
): Promise<void> {
  item.status = EmojiStatus.Uploading;
  updateItemStatus(item, index);

  try {
    const response = await addEmoji(apiToken, item.emojiName, item.file);
    applyResponseToItem(item, response);
  } catch {
    item.status = EmojiStatus.Failed;
    item.errorCode = "network_error";
  }

  updateItemStatus(item, index);
}

function applyResponseToItem(
  item: EmojiRegistrationItem,
  response: { ok: boolean; error?: string },
): void {
  if (response.ok) {
    item.status = EmojiStatus.Success;
    return;
  }

  item.status = EmojiStatus.Failed;
  item.errorCode = response.error ?? "unknown_error";
}

function findNextPendingIndex(startFrom: number): number {
  for (let i = startFrom; i < registrationQueue.length; i++) {
    if (registrationQueue[i]?.status === EmojiStatus.Pending) {
      return i;
    }
  }

  return -1;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main();
