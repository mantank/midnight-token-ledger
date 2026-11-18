"use strict";
const byId = (id) => document.getElementById(id);
function el(tag, text = "", cls = "") {
  const node = document.createElement(tag);
  node.textContent = text;
  node.className = cls;
  return node;
}
const keys = ["input", "output", "hit"];
const rateNames = { input: "普通输入", cached: "缓存读取", output: "输出" };
const rates = models.map((m) => ({ ...Billing.lookup(m.name) }));
let scene = presets[0].name;
let report = null;
let expanded = null;
function validate(field, kind, error) {
  try {
    Pricing.parseField(field.value, kind);
    field.setAttribute("aria-invalid", "false");
    error.textContent = "";
    return true;
  } catch (e) {
    field.setAttribute("aria-invalid", "true");
    error.textContent = e.message;
    return false;
  }
}
function selectScene(preset) {
  scene = preset.name;
  keys.forEach((key) => {
    byId(key).value = preset[key];
  });
  update();
}
for (const preset of presets) {
  const btn = el("button", preset.name);
  btn.onclick = () => {
    setMode(false);
    selectScene(preset);
  };
  byId("presets").append(btn);
}
for (const key of keys) {
  byId(key).oninput = () => {
    setMode(false);
    scene = "自定义";
    update();
  };
}
byId("slider").oninput = () => {
  byId("hit").value = byId("slider").value;
  setMode(false);
  scene = "自定义";
  update();
};
function showRates(show) {
  byId("ratePanel").hidden = !show;
  byId("costPanel").hidden = show;
  document.querySelector(".legend").hidden = show;
  byId("rateTab").setAttribute("aria-pressed", String(show));
  byId("costTab").setAttribute("aria-pressed", String(!show));
}
byId("costTab").onclick = () => showRates(false);
byId("rateTab").onclick = () => showRates(true);
function makeRateRow(model, i) {
  const row = el("div", "", "rate-row");
  const head = el("div", "", "rate-head");
  head.append(el("strong", model.name));
  const source = el(
    "a",
    model.family === "DeepSeek" ? "低峰参考价 ↗" : "公开参考价 ↗",
  );
  source.href = providers[model.family][1];
  source.target = "_blank";
  source.rel = "noopener";
  const prices = el("div", "", "prices");
  for (const [key, name] of Object.entries(rateNames)) {
    const label = el("label", name);
    const field = el("input");
    field.id = "price-" + i + "-" + key;
    field.setAttribute("aria-label", model.name + " " + name + "单价");
    field.value = rates[i][key];
    field.inputMode = "decimal";
    field.maxLength = 24;
    field.readOnly = !model.editable;
    field.setAttribute("aria-describedby", field.id + "-error");
    const error = el("span", "", "rate-error");
    error.id = field.id + "-error";
    field.oninput = () => {
      rates[i][key] = field.value;
      if (Billing.valid(rates[i])) Billing.save(model.name, rates[i]);
      update();
    };
    label.append(field, error);
    prices.append(label);
  }
  if (model.editable) {
    const reset = el("button", "恢复参考价");
    reset.onclick = () => {
      Billing.save(model.name, null);
      rates[i] = { ...model.defaults };
      for (const key of Object.keys(rateNames))
        byId("price-" + i + "-" + key).value = rates[i][key];
      update();
    };
    head.append(reset);
  }
  row.append(head, source, prices);
  return row;
}
models.forEach((m, i) => byId("rateRows").append(makeRateRow(m, i)));
for (const [name, url] of Object.values(providers)) {
  const link = el("a", name);
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener";
  byId("sources").append(link);
}
function costRow(q) {
  const tr = el("tr");
  const title = el("td");
  const button = el("button", "", "model");
  const symbols = { GPT: "◎", Gemini: "✦", Claude: "✳", DeepSeek: "≈" };
  const icon = el("span", symbols[q.family], "logo " + q.family);
  icon.setAttribute("aria-hidden", "true");
  const name = el("span", q.name);
  name.append(
    el("small", providers[q.family][0] + (q.custom ? " · 自定义价" : "")),
  );
  button.append(icon, name);
  button.setAttribute("aria-expanded", String(expanded === q.name));
  button.onclick = () => {
    expanded = expanded === q.name ? null : q.name;
    renderQuotes(report.quotes);
    [...byId("rows").querySelectorAll("button")]
      .find((b) => b.dataset.name === q.name)
      .focus();
  };
  button.dataset.name = q.name;
  title.append(button);
  const mix = el("td", "", "mix");
  mix.append(costBar(q));
  tr.append(title, mix, Billing.money(el("td", "", "money"), q.total));
  return tr;
}
function costBar(q) {
  const bar = el("div", "", "bar");
  for (const part of [q.normal, q.cached, q.output]) {
    const segment = el("span");
    segment.style.width =
      (q.total ? Number((part * 10000n) / q.total) / 100 : 0) + "%";
    bar.append(segment);
  }
  return bar;
}
function renderQuotes(quotes) {
  const rows = byId("rows");
  rows.replaceChildren();
  for (const q of quotes) {
    rows.append(costRow(q));
    if (expanded === q.name) {
      const detail = el("tr", "", "detail");
      const parts = [
        ["普通输入", q.normal],
        ["缓存读取", q.cached],
        ["输出", q.output],
      ];
      const cell = el("td");
      for (const [label, amount] of parts) {
        const percent = q.total
          ? Number((amount * 1000n + q.total / 2n) / q.total) / 10
          : 0;
        const span = el(
          "span",
          label + " " + Pricing.dollars(amount) + "（" + percent + "%）",
        );
        span.title = Pricing.fullDollars(amount);
        cell.append(span);
      }
      cell.append(costBar(q));
      cell.colSpan = 3;
      detail.append(cell);
      rows.append(detail);
    }
  }
}
function clearResults() {
  report = null;
  byId("share").disabled = true;
  for (const id of ["best", "spread", "tokens"]) {
    byId(id).textContent = "—";
    byId(id).removeAttribute("title");
  }
  byId("winner").textContent = "请检查用量或模型单价";
  const row = el("tr");
  const cell = el("td", "输入有效数值后更新报价");
  cell.colSpan = 3;
  row.append(cell);
  byId("rows").replaceChildren(row);
}
function update() {
  const usage = Object.fromEntries(keys.map((key) => [key, byId(key).value]));
  const valid = keys.map((key) =>
    validate(byId(key), key === "hit" ? "hit" : "count", byId(key + "-error")),
  );
  models.forEach((model, i) => {
    for (const key of Object.keys(rateNames)) {
      const id = "price-" + i + "-" + key;
      valid.push(validate(byId(id), "rate", byId(id + "-error")));
    }
  });
  [...byId("presets").children].forEach((btn) =>
    btn.setAttribute("aria-pressed", String(scene === btn.textContent)),
  );
  byId("custom").hidden = !["实际用量", "自定义"].includes(scene);
  byId("custom").textContent =
    scene === "实际用量" ? "已载入实际用量" : "当前为自定义场景";
  if (byId("hit").getAttribute("aria-invalid") === "false")
    byId("slider").value = usage.hit;
  if (valid.includes(false)) return clearResults();
  const quotes = models
    .map((model, i) => ({
      ...model,
      ...Pricing.calculate(usage, rates[i]),
      custom: Object.keys(rateNames).some(
        (key) =>
          Pricing.parseField(rates[i][key], "rate") !==
          Pricing.parseField(model.defaults[key], "rate"),
      ),
    }))
    .sort(Pricing.compare);
  report = { scene, usage, quotes };
  const best = quotes[0];
  const ties = quotes.filter((q) => q.total === best.total).length;
  Billing.money(byId("best"), best.total);
  byId("winner").textContent =
    ties > 1 ? best.name + " 等 " + ties + " 个模型并列" : best.name;
  Billing.money(byId("spread"), quotes.at(-1).total - best.total);
  byId("tokens").textContent = (
    BigInt(usage.input) + BigInt(usage.output)
  ).toLocaleString("en-US");
  byId("share").disabled = false;
  renderQuotes(quotes);
}
byId("share").onclick = () => {
  const data = actualMode ? actualReport : report;
  if (!data) return;
  const url = makePoster(data);
  byId("shareTitle").textContent = actualMode ? "真实账单分享图" : "对比分享图";
  byId("poster").alt = actualMode ? "所选范围的逐模型账单及定价覆盖情况" : "当前场景下的七模型费用对比";
  byId("poster").src = url;
  byId("download").href = url;
  byId("preview").showModal();
};
byId("close").onclick = () => byId("preview").close();
function drawTerrain() {
  const canvas = byId("terrain");
  const w = canvas.clientWidth,
    h = canvas.clientHeight;
  const dpi = Math.min(devicePixelRatio, 2);
  canvas.width = w * dpi;
  canvas.height = h * dpi;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpi, dpi);
  const gradient = ctx.createLinearGradient(w * 0.6, 0, w, 0);
  gradient.addColorStop(0, "transparent");
  gradient.addColorStop(1, "#10B98170");
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 1;
  for (let row = -10; row < 40; row++) {
    ctx.beginPath();
    for (let x = Math.floor(w * 0.55); x <= w + 3; x += 3) {
      const t = x / w;
      const y =
        row * 6 +
        50 +
        Math.sin(t * 18 + row * 0.035) * 37 +
        Math.sin(t * 25 - row * 0.058) * 28;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}
let actualMode = false,
  actualReport = null,
  actualRows = null,
  billStatus = "";
const actualUsage = new URLSearchParams(location.hash.slice(1));
const localToday = new Date().toLocaleDateString("sv-SE");
const requestedPeriod = actualUsage.get("period");
const legacyTotals = !requestedPeriod && keys.every(key => actualUsage.has(key));
const period = /^\d{4}-\d{2}(-\d{2})?$/.test(requestedPeriod || "")
  ? requestedPeriod
  : localToday;
const toolFilter = actualUsage.get("tool") || "";
const scope = period + (toolFilter ? " · " + toolFilter : " · 全部工具");
function renderBill() {
  byId("billPeriod").textContent = scope + (legacyTotals ? " · 旧链接仅含汇总用量，真实账单显示今天；原用量保留在假设全切对比中。" : "");
  if (actualRows === null) {
    byId("calcBill").textContent = billStatus || "正在读取本机用量…";
    byId("heroBillScope").textContent = byId("calcBill").textContent;
    if (actualMode) byId("share").disabled = true;
    return;
  }
  const bill = Billing.details(byId("billRows"), actualRows);
  Billing.summary(byId("calcBill"), bill);
  const known = bill.items.length - bill.missing;
  byId("heroBillLabel").textContent = bill.missing
    ? "已定价小计"
    : "当前实际总花费";
  if (!known && bill.missing) {
    byId("heroBillAmount").textContent = "—";
    byId("heroBillAmount").removeAttribute("title");
  } else Billing.money(byId("heroBillAmount"), bill.total);
  byId("heroBillScope").textContent =
    scope + (bill.missing ? " · " + bill.missing + " 个模型未配置单价" : "");
  if (billStatus) byId("billPeriod").textContent += " · " + billStatus;
  actualReport = { bill, scope };
  if (actualMode) byId("share").disabled = !bill.items.length;
}
function setMode(actual) {
  actualMode = actual;
  for (const id of ["billPanel", "billHero"]) byId(id).hidden = !actual;
  for (const id of ["comparePanel", "compareHero", "compareStats"])
    byId(id).hidden = actual;
  byId("billMode").setAttribute("aria-pressed", String(actual));
  byId("compareMode").setAttribute("aria-pressed", String(!actual));
  if (actual) renderBill();
  else update();
}
byId("billMode").onclick = () => setMode(true);
byId("compareMode").onclick = () => setMode(false);
window.addEventListener("billrateschange", () => {
  models.forEach((m, i) => {
    rates[i] = { ...Billing.lookup(m.name) };
    for (const key of Object.keys(rateNames))
      byId("price-" + i + "-" + key).value = rates[i][key];
  });
  update();
  renderBill();
});
async function syncBill() {
  if (location.protocol === "file:") {
    billStatus = "请从顶部「实际用量」打开本机看板以读取账单。";
    renderBill();
    return;
  }
  try {
    const res = await fetch("/api/usage", { cache: "no-store" });
    if (!res.ok) throw Error();
    const data = await res.json();
    if (data.updated) {
      actualRows = data.rows.filter(
        (row) =>
          (row.date === period || row.date.startsWith(period + "-")) &&
          (!toolFilter || row.tool === toolFilter),
      );
    }
    if (actualMode && actualRows !== null && !legacyTotals) {
      const totals = actualRows.reduce(
        (a, r) => ({
          input: a.input + BigInt(r.input),
          output: a.output + BigInt(r.output),
          cached: a.cached + BigInt(r.cached),
        }),
        { input: 0n, output: 0n, cached: 0n },
      );
      const hit = totals.input
        ? Number((totals.cached * 10000n + totals.input / 2n) / totals.input) /
          100
        : 0;
      selectScene({
        name: "实际用量",
        input: String(totals.input),
        output: String(totals.output),
        hit: String(hit),
      });
    }
    billStatus = (data.warnings || []).join(" · ");
  } catch {
    billStatus = actualRows
      ? "连接中断，显示上次读取的数据"
      : "无法读取本机用量，请启动用量看板。";
  }
  if (actualMode) renderBill();
  setTimeout(syncBill, actualRows === null ? 4000 : 15000);
}
new ResizeObserver(drawTerrain).observe(byId("terrain"));
update();

// Keep the selected usage available for the hypothetical comparison.
if (keys.every((key) => actualUsage.has(key))) {
  selectScene({
    name: "实际用量",
    ...Object.fromEntries(keys.map((key) => [key, actualUsage.get(key)])),
  });
  byId("custom").hidden = false;
  byId("custom").textContent = "已载入实际用量";
}

const publicSite = document.documentElement.dataset.public === "true";
setMode(!publicSite && location.protocol !== "file:");
if (!publicSite) syncBill();
