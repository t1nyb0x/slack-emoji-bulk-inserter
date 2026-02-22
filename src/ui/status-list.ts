import type { EmojiRegistrationItem } from "../types";
import { EmojiStatus } from "../types";

const LIST_CONTAINER_ID = "slack-emoji-bulk-status-list";
const SUMMARY_ID = "slack-emoji-bulk-summary";

let listContainer: HTMLDivElement | null = null;

/**
 * ステータスリストのコンテナをドロップゾーンの下に作成する。
 */
export function createStatusList(dropZone: HTMLElement): HTMLDivElement {
  const container = document.createElement("div");
  container.id = LIST_CONTAINER_ID;
  Object.assign(container.style, {
    maxHeight: "400px",
    overflowY: "auto",
    marginBottom: "16px",
  });

  dropZone.insertAdjacentElement("afterend", container);
  listContainer = container;

  return container;
}

/**
 * リストに絵文字登録アイテムを追加する。
 * アイテムのDOM要素のIDはインデックスで管理する。
 */
export function addItemToList(
  item: EmojiRegistrationItem,
  index: number,
): void {
  if (!listContainer) {
    return;
  }

  const row = buildItemRow(item, index);
  listContainer.appendChild(row);
}

/**
 * 指定インデックスのリストアイテムのステータス表示を更新する。
 */
export function updateItemStatus(
  item: EmojiRegistrationItem,
  index: number,
): void {
  const row = document.getElementById(buildItemId(index));

  if (!row) {
    return;
  }

  const statusSpan = row.querySelector("[data-role='status']");
  if (statusSpan) {
    statusSpan.textContent = getStatusIcon(item.status);
  }
}

function buildItemRow(
  item: EmojiRegistrationItem,
  index: number,
): HTMLDivElement {
  const row = document.createElement("div");
  row.id = buildItemId(index);
  Object.assign(row.style, {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "4px 8px",
    fontSize: "13px",
    borderBottom: "1px solid #eee",
  });

  const statusSpan = document.createElement("span");
  statusSpan.setAttribute("data-role", "status");
  statusSpan.textContent = getStatusIcon(item.status);
  statusSpan.style.minWidth = "20px";

  const nameSpan = document.createElement("span");
  nameSpan.textContent = `:${item.emojiName}:`;

  row.appendChild(statusSpan);
  row.appendChild(nameSpan);

  return row;
}

function buildItemId(index: number): string {
  return `emoji-item-${index}`;
}

function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    pending: "⏳",
    uploading: "🔄",
    success: "✅",
    failed: "❌",
  };

  return icons[status] ?? "❓";
}

/**
 * 全アイテム処理完了後に成功件数・失敗件数のサマリーを表示する。
 */
export function showSummary(items: readonly EmojiRegistrationItem[]): void {
  if (!listContainer) {
    return;
  }

  removePreviousSummary();

  const successCount = items.filter(
    (item) => item.status === EmojiStatus.Success,
  ).length;
  const failedCount = items.filter(
    (item) => item.status === EmojiStatus.Failed,
  ).length;

  const summary = buildSummaryElement(successCount, failedCount);
  listContainer.insertBefore(summary, listContainer.firstChild);
}

function removePreviousSummary(): void {
  const existing = document.getElementById(SUMMARY_ID);
  existing?.remove();
}

function buildSummaryElement(
  successCount: number,
  failedCount: number,
): HTMLDivElement {
  const summary = document.createElement("div");
  summary.id = SUMMARY_ID;
  Object.assign(summary.style, {
    padding: "8px 12px",
    marginBottom: "8px",
    backgroundColor: failedCount > 0 ? "#FFF3CD" : "#D4EDDA",
    borderRadius: "4px",
    fontSize: "13px",
    fontWeight: "bold",
  });

  summary.textContent = `完了: ✅ ${successCount} 件成功 / ❌ ${failedCount} 件失敗`;

  return summary;
}
