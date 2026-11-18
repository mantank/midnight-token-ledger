"use strict";
const importedDashboard = document.documentElement.dataset.public === "true";
const $ = (id) => document.getElementById(id);
const format = (n) => n.toLocaleString("zh-CN");
function compact(n) {
  if (n >= 1e8) return +(n / 1e8).toFixed(1) + "亿";
  if (n >= 1e4) return +(n / 1e4).toFixed(1) + "万";
  return format(n);
}
function node(tag, text, cls = "") {
  const el = document.createElement(tag);
  el.textContent = text;
  el.className = cls;
  return el;
}
const now = new Date();
const today = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, "0"),
  String(now.getDate()).padStart(2, "0"),
].join("-");
let month = today.slice(0, 7),
  selected = today,
  view = "calendar",
  rows = [],
  activeRows = [],
  plotted = [],
  lastUpdate = null;
const toolNames = {
  "claude-code": "Claude Code",
  codex: "Codex",
  cursor: "Cursor",
  opencode: "OpenCode",
  workbuddy: "WorkBuddy",
  hermes: "Hermes",
  kimi: "Kimi",
  "copilot-cli": "Copilot CLI",
  antigravity: "Antigravity",
  openclaw: "OpenClaw",
  "roo-code": "Roo Code",
};
const toolName = (key) => toolNames[key] || key;
const modelName = (key) => (key === "unknown" ? "未知模型" : key);
const amount = (row) => row.input + row.output;
const sum = (list, fn) => list.reduce((a, b) => a + fn(b), 0);
function dateKey(d) {
  return month + "-" + String(d).padStart(2, "0");
}
function bestDay(day, monthRows) {
  return monthRows.filter((r) => r.date === day);
}
function renderDetails(monthRows) {
  activeRows = selected ? bestDay(selected, monthRows) : monthRows;
  $("period").textContent =
    (selected || month) + " · " + format(sum(activeRows, amount)) + " Token";
  $("whole").disabled = !selected;
  if (lastUpdate) {
    const bill = Billing.details($("breakdown"), activeRows, toolName);
    Billing.summary($("day-bill"), bill);
  } else {
    $("breakdown").textContent = "正在等待读取用量…";
  }
  const hasUsage = activeRows.some(row => amount(row) > 0);
  $("use").disabled = !hasUsage;
  if ($("share-usage-card")) $("share-usage-card").disabled = !hasUsage;
}
function pick(day) {
  selected = day;
  render();
  document
    .querySelector(
      (view === "calendar" ? "#calendar" : "#trend") +
        ' [data-day="' +
        day +
        '"]',
    )
    ?.focus({ preventScroll: true });
}
function calendar(days, first) {
  const week = node("div", "", "weekday"),
    grid = node("div", "", "days");
  for (const w of "一二三四五六日") week.append(node("span", w));
  for (let i = 0; i < (first + 6) % 7; i++) grid.append(node("span", ""));
  const ordered = days
    .filter((d) => d.tokens > 0)
    .map((d) => d.tokens)
    .sort((a, b) => a - b);
  for (const d of days) {
    const level = d.tokens
      ? 1 +
        Math.floor(
          (4 * ordered.indexOf(d.tokens)) / Math.max(1, ordered.length - 1),
        )
      : 0;
    const b = node("button", String(d.number), "day level" + level);
    b.append(node("small", d.tokens ? compact(d.tokens) : ""));
    dayButton(b, d);
    grid.append(b);
  }
  $("calendar").replaceChildren(week, grid);
}
function dayButton(b, d) {
  b.dataset.day = d.key;
  b.title = d.key + " · " + format(d.tokens) + " Token";
  b.setAttribute("aria-label", b.title);
  b.setAttribute("aria-pressed", String(selected === d.key));
  b.disabled = d.key > today;
  b.onclick = () => pick(d.key);
}
function paint() {
  const canvas = $("lineCanvas");
  if (!canvas || !canvas.clientWidth || !plotted.length) return;
  const w = canvas.clientWidth,
    h = canvas.clientHeight,
    scale = Math.min(devicePixelRatio, 2);
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  const max = Math.max(1, ...plotted.map((d) => d.tokens));
  const points = plotted.map((d, i) => [
    ((i + 0.5) * w) / plotted.length,
    h - 5 - (d.tokens / max) * (h - 16),
  ]);
  const current = points.filter((_, i) => plotted[i].key <= today);
  if (!current.length) return;
  ctx.beginPath();
  current.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.lineWidth = 2.5;
  const palette = getComputedStyle(document.documentElement);
  const line = palette.getPropertyValue("--accent").trim();
  ctx.strokeStyle = line;
  ctx.stroke();
  ctx.lineTo(current.at(-1)[0], h);
  ctx.lineTo(current[0][0], h);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#10B98145");
  g.addColorStop(1, "#10B98103");
  ctx.fillStyle = g;
  ctx.fill();
  current.forEach(([x, y], i) => {
    ctx.beginPath();
    ctx.arc(x, y, plotted[i].key === selected ? 5 : 2.5, 0, Math.PI * 2);
    ctx.fillStyle =
      plotted[i].key === selected
        ? palette.getPropertyValue("--highlight").trim()
        : line;
    ctx.fill();
  });
}
function trend(days) {
  plotted = days;
  const chart = node("div", "", "plot"),
    canvas = node("canvas", ""),
    hits = node("div", "", "plot-hits");
  canvas.id = "lineCanvas";
  canvas.setAttribute("aria-hidden", "true");
  for (const d of days) {
    const b = node("button", "");
    dayButton(b, d);
    hits.append(b);
  }
  chart.append(canvas, hits);
  const ticks = node("div", "", "ticks");
  [1, 8, 15, 22, days.length].forEach((d) =>
    ticks.append(node("span", d + "日")),
  );
  const peak = Math.max(...days.map((d) => d.tokens));
  $("trend").replaceChildren(
    node("small", "单日峰值 " + format(peak) + " Token"),
    chart,
    ticks,
  );
  paint();
}
function render() {
  const [y, m] = month.split("-").map(Number);
  const subset = rows.filter(
    (r) =>
      r.date.startsWith(month + "-") &&
      (!$("tool").value || r.tool === $("tool").value),
  );
  const days = Array.from({ length: new Date(y, m, 0).getDate() }, (_, i) => ({
    number: i + 1,
    key: dateKey(i + 1),
    tokens: 0,
  }));
  for (const row of subset)
    days[Number(row.date.slice(8)) - 1].tokens += amount(row);
  $("month").value = month;
  $("next").disabled = month >= today.slice(0, 7);
  $("grand").textContent = lastUpdate ? format(sum(subset, amount)) : "—";
  $("active").textContent = days.filter((d) => d.tokens).length + " 天";
  $("modelCount").textContent =
    new Set(subset.filter((r) => r.model !== "unknown").map((r) => r.model))
      .size + " 个";
  const input = sum(subset, (r) => r.input);
  $("cacheRatio").textContent = input
    ? ((sum(subset, (r) => r.cached) * 100) / input).toFixed(1) + "%"
    : "—";
  const cal = view === "calendar";
  $("calendarTab").setAttribute("aria-pressed", String(cal));
  $("trendTab").setAttribute("aria-pressed", String(!cal));
  $("calendar").hidden = !cal;
  $("trend").hidden = cal;
  if (cal) calendar(days, new Date(y, m - 1, 1).getDay());
  else trend(days);
  $("chart-note").textContent = cal
    ? "颜色越亮，当天用量越高。点选日期可查看模型明细。"
    : "折线显示每日总量，点选数据点可查看当天明细。";
  renderDetails(subset);
}
function switchMonth(next) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(next) || next > today.slice(0, 7)) {
    $("month").value = month;
    return;
  }
  month = next;
  selected = null;
  render();
}
function move(offset) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + offset, 1);
  switchMonth(
    d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"),
  );
}
$("month").max = today.slice(0, 7);
$("month").onchange = (e) => switchMonth(e.target.value);
$("prev").onclick = () => move(-1);
$("next").onclick = () => move(1);
$("calendarTab").onclick = () => {
  view = "calendar";
  render();
};
$("trendTab").onclick = () => {
  view = "trend";
  render();
};
$("whole").onclick = () => {
  selected = null;
  render();
};
$("tool").onchange = render;
window.addEventListener("resize", paint);
$("use").onclick = () => {
  const input = sum(activeRows, (r) => r.input),
    output = sum(activeRows, (r) => r.output),
    cached = sum(activeRows, (r) => r.cached);
  const data = new URLSearchParams({
    period: selected || month,
    tool: $("tool").value,
    input: String(input),
    output: String(output),
    hit: input ? ((cached / input) * 100).toFixed(2) : "0",
  });
  location.href = "index.html#" + data;
};
function sources() {
  const sourceDates = new Map();
  for (const r of rows)
    if (!sourceDates.has(r.tool) || r.date > sourceDates.get(r.tool))
      sourceDates.set(r.tool, r.date);
  const selectedTool = $("tool").value;
  $("tool").replaceChildren(new Option("全部工具", ""));
  $("sources").replaceChildren();
  for (const [tool, day] of [...sourceDates].sort()) {
    $("tool").add(new Option(toolName(tool), tool));
    $("sources").append(node("span", toolName(tool) + " · " + day));
  }
  $("tool").value = selectedTool;
}
async function sync() {
  try {
    const res = await fetch("/api/usage", { cache: "no-store" });
    if (!res.ok) throw Error();
    const data = await res.json();
    $("warning").textContent = data.warnings.join(" · ");
    $("warning").hidden = !data.warnings.length;
    if (data.updated && data.updated !== lastUpdate) {
      lastUpdate = data.updated;
      rows = data.rows;
      const focused = document.activeElement?.dataset.day;
      sources();
      render();
      if (focused)
        document
          .querySelector(
            (view === "calendar" ? "#calendar" : "#trend") +
              ' [data-day="' +
              focused +
              '"]',
          )
          ?.focus({ preventScroll: true });
    }
    $("sync").textContent = lastUpdate
      ? "本机同步 · " +
        new Date(lastUpdate).toLocaleTimeString("zh-CN", { hour12: false })
      : "首次读取本机历史用量…";
  } catch {
    $("sync").textContent =
      "采集器未连接 · 双击「启动用量看板.command」恢复同步";
  }
  setTimeout(sync, 4000);
}
window.addEventListener("themechange", paint);
window.addEventListener("billrateschange", render);
if (importedDashboard) {
  rows = UsageImport.load().filter(row => row.date <= today && amount(row) > 0);
  const latest = rows.reduce((last,row) => row.date > last ? row.date : last, "");
  if (latest) {
    month = latest.slice(0, 7);
    selected = latest;
  }
  lastUpdate = new Date().toISOString();
  $("sync").textContent = latest ? "本标签页已导入用量" : "请返回主页导入用量";
  sources();
  const dialog = $("usage-card-preview");
  $("close-usage-card").onclick = () => dialog.close();
  $("share-usage-card").onclick = () => {
    if (!activeRows.some(row => amount(row) > 0)) return;
    const tool = $("tool").value;
    const period = selected || month;
    const through = selected || (month === today.slice(0,7) ? today :
      dateKey(new Date(Number(month.slice(0,4)),Number(month.slice(5)),0).getDate()));
    const history = rows.filter(row => !tool || row.tool === tool);
    const bill = Pricing.bill(activeRows, Billing.lookup);
    const url = UsageCard.makeCard({period, through, active:activeRows, history, bill, toolName});
    $("usage-card-image").src = url;
    $("save-usage-card").href = url;
    dialog.showModal();
  };
  render();
} else {
  render();
  sync();
}
