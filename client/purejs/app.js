const apiUrl = window.__API_URL__ || "http://localhost:5000";

const formatButton = document.getElementById("format-btn");
const selectionIndicator = document.getElementById("selection-indicator");
const errorEl = document.getElementById("error");
const contentSection = document.getElementById("content");
const titleEl = document.getElementById("article-title");
const textEl = document.getElementById("article-text");

let selectedText = "";
let formatting = false;

function setError(message) {
  if (message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  } else {
    errorEl.textContent = "";
    errorEl.hidden = true;
  }
}

function updateControls() {
  formatButton.disabled = !selectedText || formatting;
  if (selectedText) {
    const preview =
      selectedText.length > 30 ? `${selectedText.slice(0, 30)}...` : selectedText;
    selectionIndicator.textContent = `Selected: "${preview}"`;
  } else {
    selectionIndicator.textContent = "";
  }
}

function isSelectionInsideText(selection) {
  if (!selection || selection.rangeCount === 0) return false;
  if (!textEl.contains(selection.anchorNode)) return false;
  if (!textEl.contains(selection.focusNode)) return false;
  return true;
}

function handleSelectionChange() {
  const selection = window.getSelection();
  const text = selection?.toString().trim() || "";

  if (text && isSelectionInsideText(selection)) {
    selectedText = text;
  } else {
    selectedText = "";
  }

  updateControls();
}

async function loadArticle() {
  setError("");
  try {
    const res = await fetch(`${apiUrl}/wikipedia`);
    if (!res.ok) throw new Error("Failed to fetch data from API");

    const data = await res.json();
    titleEl.textContent = data.title || "Article";
    textEl.textContent = data.extract || "";
    contentSection.hidden = false;
  } catch (err) {
    setError(err.message || "Failed to load article");
  }
}

async function formatText() {
  if (!selectedText) return;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  formatting = true;
  updateControls();
  setError("");

  try {
    const res = await fetch(`${apiUrl}/format`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedText }),
    });

    if (!res.ok) throw new Error("Failed to format text");

    const { formattedText, color } = await res.json();
    const range = selection.getRangeAt(0);

    if (textEl) {
      const containerRange = document.createRange();
      containerRange.selectNodeContents(textEl);

      if (range.compareBoundaryPoints(Range.START_TO_START, containerRange) < 0) {
        range.setStart(containerRange.startContainer, containerRange.startOffset);
      }
      if (range.compareBoundaryPoints(Range.END_TO_END, containerRange) > 0) {
        range.setEnd(containerRange.endContainer, containerRange.endOffset);
      }
    }

    const span = document.createElement("span");
    span.className = "highlight";
    span.style.backgroundColor = color;
    span.textContent = formattedText;

    range.deleteContents();
    range.insertNode(span);

    selection.removeAllRanges();
    selectedText = "";
    updateControls();
  } catch (err) {
    setError(err.message || "Failed to format text");
  } finally {
    formatting = false;
    updateControls();
  }
}

formatButton.addEventListener("click", formatText);
document.addEventListener("selectionchange", handleSelectionChange);

loadArticle();
