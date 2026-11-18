"use strict";
(() => {
  const copy = document.getElementById("copy-guide");
  const source = document.getElementById("guide-prompt");
  const status = document.getElementById("guide-status");
  const result = document.getElementById("usage-json");
  const preview = document.getElementById("prompt-details");
  document.getElementById("last-import").hidden = !UsageImport.load().length;

  fetch("ai-usage-prompt.txt").then(response => {
    if (!response.ok) throw Error();
    return response.text();
  }).then(text => {
    source.value = text;
    copy.disabled = false;
  }).catch(() => { status.textContent = "指令加载失败，请刷新网页重试。"; });

  copy.onclick = async () => {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(source.value);
        status.textContent = "已复制。粘贴给 Codex、Claude Code 等本地 AI 助手。";
        return;
      } catch { /* Use manual selection when clipboard access is unavailable. */ }
    }
    preview.open = true;
    source.focus();
    source.select();
    status.textContent = "指令已选中，请按 Ctrl/Cmd + C 复制。";
  };
  document.getElementById("usage-import-form").onsubmit = event => {
    event.preventDefault();
    try {
      UsageImport.save(result.value);
      location.href = "usage.html";
    } catch (error) {
      status.textContent = error.name === "QuotaExceededError" ?
        "浏览器存储不足，请缩短统计区间后重试。" : error.message;
      result.focus();
    }
  };
})();
