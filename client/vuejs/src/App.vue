<template>
  <main>
    <h1>Telenor test</h1>

    <div style="margin-bottom: 1rem;">
      <button @click="formatText" :disabled="!selectedText || formatting">
        {{ formatting ? "Formatting..." : "Format text" }}
      </button>
      <span v-if="selectedText" style="margin-left: 1rem; color: #666;">
        Selected: "{{ selectedText.substring(0, 30) }}{{ selectedText.length > 30 ? '...' : '' }}"
      </span>
    </div>

    <p v-if="error" style="color: red;">{{ error }}</p>

    <section v-if="data">
      <h2>{{ data.title }}</h2>

      <p ref="textContainer" style="line-height: 1.6;" v-html="formattedExtract"></p>

    </section>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

const data = ref(null);
const loading = ref(false);
const formatting = ref(false);
const error = ref("");
const selectedText = ref("");
const formattedExtract = ref("");
const textContainer = ref(null);

// Track text selection
function handleSelectionChange() {
  const selection = window.getSelection();
  const text = selection?.toString().trim() || "";

  // Only track selection if it's within our text container
  if (text && textContainer.value?.contains(selection?.anchorNode)) {
    selectedText.value = text;
  } else {
    selectedText.value = "";
  }
}

async function load() {
  loading.value = true;
  error.value = "";

  try {
    const res = await fetch(`${apiUrl}/wikipedia`);
    if (!res.ok) throw new Error("Failed to fetch data from API");

    data.value = await res.json();
    formattedExtract.value = data.value.extract;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function formatText() {
  if (!selectedText.value || !data.value) return;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  formatting.value = true;
  error.value = "";

  try {
    // POST selected text to server for formatting
    const res = await fetch(`${apiUrl}/format`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedText: selectedText.value }),
    });

    if (!res.ok) {
      throw new Error("Failed to format text");
    }

    const { formattedText, color } = await res.json();

    // Get the selection range
    const range = selection.getRangeAt(0);

    // Constrain range to textContainer if it extends beyond
    if (textContainer.value) {
      const containerRange = document.createRange();
      containerRange.selectNodeContents(textContainer.value);

      if (range.compareBoundaryPoints(Range.START_TO_START, containerRange) < 0) {
        range.setStart(containerRange.startContainer, containerRange.startOffset);
      }
      if (range.compareBoundaryPoints(Range.END_TO_END, containerRange) > 0) {
        range.setEnd(containerRange.endContainer, containerRange.endOffset);
      }
    }

    // Create a span with the color from server and the capitalized text
    const span = document.createElement("span");
    span.style.backgroundColor = color;
    span.style.fontWeight = "bold";
    span.textContent = formattedText;

    // Replace the selected text with the formatted span
    range.deleteContents();
    range.insertNode(span);

    // Get the new HTML and force Vue to re-render
    const newHtml = textContainer.value.innerHTML;
    selection.removeAllRanges();
    selectedText.value = "";

    formattedExtract.value = "";
    await nextTick();
    formattedExtract.value = newHtml;
  } catch (e) {
    error.value = e.message;
  } finally {
    formatting.value = false;
  }
}

onMounted(() => {
  load();
  document.addEventListener("selectionchange", handleSelectionChange);
});

onUnmounted(() => {
  document.removeEventListener("selectionchange", handleSelectionChange);
});
</script>
