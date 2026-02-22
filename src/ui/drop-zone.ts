const ACCEPTED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/gif"]);

const DROP_ZONE_ID = "slack-emoji-bulk-drop-zone";

/**
 * ページ上部にドロップゾーン固定パネルを挿入し、
 * ドラッグ＆ドロップイベントを処理する。
 */
export function createDropZone(
  onFilesDropped: (files: File[]) => void,
): HTMLElement {
  const container = buildContainer();
  const label = buildLabel();
  container.appendChild(label);

  attachDragEvents(container, label, onFilesDropped);
  insertIntoPage(container);

  return container;
}

function buildContainer(): HTMLDivElement {
  const container = document.createElement("div");
  container.id = DROP_ZONE_ID;
  Object.assign(container.style, {
    position: "relative",
    width: "100%",
    padding: "24px",
    marginBottom: "16px",
    border: "2px dashed #ccc",
    borderRadius: "8px",
    backgroundColor: "#fafafa",
    textAlign: "center",
    boxSizing: "border-box",
    transition: "border-color 0.2s, background-color 0.2s",
  });

  return container;
}

function buildLabel(): HTMLParagraphElement {
  const label = document.createElement("p");
  label.textContent =
    "🎨 絵文字画像をここにドラッグ＆ドロップしてください（PNG, JPEG, GIF）";
  Object.assign(label.style, {
    margin: "0",
    fontSize: "14px",
    color: "#666",
    pointerEvents: "none",
  });

  return label;
}

function attachDragEvents(
  container: HTMLDivElement,
  label: HTMLParagraphElement,
  onFilesDropped: (files: File[]) => void,
): void {
  container.addEventListener("dragenter", (e) => {
    e.preventDefault();
    applyHighlight(container, label);
  });

  container.addEventListener("dragover", (e) => {
    e.preventDefault();
    applyHighlight(container, label);
  });

  container.addEventListener("dragleave", (e) => {
    e.preventDefault();
    removeHighlight(container, label);
  });

  container.addEventListener("drop", (e) => {
    e.preventDefault();
    removeHighlight(container, label);
    const files = extractImageFiles(e);
    if (files.length > 0) {
      onFilesDropped(files);
    }
  });
}

function applyHighlight(
  container: HTMLDivElement,
  label: HTMLParagraphElement,
): void {
  container.style.borderColor = "#4A9CFF";
  container.style.backgroundColor = "#EBF5FF";
  label.textContent = "📂 ここにドロップ！";
}

function removeHighlight(
  container: HTMLDivElement,
  label: HTMLParagraphElement,
): void {
  container.style.borderColor = "#ccc";
  container.style.backgroundColor = "#fafafa";
  label.textContent =
    "🎨 絵文字画像をここにドラッグ＆ドロップしてください（PNG, JPEG, GIF）";
}

function extractImageFiles(event: DragEvent): File[] {
  if (!event.dataTransfer) {
    return [];
  }

  return Array.from(event.dataTransfer.files).filter((file) =>
    ACCEPTED_MIME_TYPES.has(file.type),
  );
}

function insertIntoPage(container: HTMLDivElement): void {
  const targetParent =
    document.querySelector("#page_contents") ?? document.body;
  targetParent.insertBefore(container, targetParent.firstChild);
}
