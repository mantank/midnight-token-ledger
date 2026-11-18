"use strict";
function makePoster({ scene, usage, quotes, bill, scope }) {
  const canvas = document.createElement("canvas");
  canvas.width = 960;
  if (bill) quotes = bill.items;
  canvas.height = 503 + 91 * quotes.length;
  const ctx = canvas.getContext("2d");
  const palette = getComputedStyle(document.documentElement);
  const color = (name) => palette.getPropertyValue("--" + name).trim();
  function label(text, x, y, size, color, width = 860, weight = 500) {
    ctx.fillStyle = color;
    ctx.font = weight + " " + size + "px system-ui, sans-serif";
    ctx.fillText(text, x, y, width);
  }
  ctx.fillStyle = color("page");
  ctx.fillRect(0, 0, 960, canvas.height);
  ctx.fillStyle = color("surface");
  ctx.fillRect(0, 0, 960, 258);
  label("深夜开发者", 54, 55, 25, color("accent"));
  label(
    bill ? "我的真实账单" : "多模型 API 用量与花费对比",
    54,
    128,
    49,
    color("ink"),
    850,
    700,
  );
  label(
    bill
      ? scope
      : scene + "  ·  输入 " + usage.input + "  /  输出 " + usage.output,
    54,
    187,
    26,
    color("ink"),
  );
  const amountLabel =
    bill && bill.items.length === bill.missing
      ? "—"
      : bill
        ? Pricing.dollars(bill.total)
        : "";
  label(
    bill
      ? (bill.missing ? "已定价小计 " : "当前实际总花费 ") +
          amountLabel +
          (bill.missing ? " · " + bill.missing + " 个模型待定价" : "")
      : "缓存命中率 " + usage.hit + "%",
    54,
    228,
    24,
    color("muted"),
  );
  label("模型", 54, 324, 25, color("muted"));
  ctx.textAlign = "right";
  label("预估费用（美元）", 906, 324, 25, color("muted"));
  ctx.textAlign = "left";
  const highest = quotes.reduce(
    (max, q) => (q.total !== null && q.total > max ? q.total : max),
    0n,
  );
  quotes.forEach((q, i) => {
    const y = 399 + i * 91;
    label(q.name + (q.custom ? " *" : ""), 54, y, 29, color("ink"), 405, 650);
    ctx.textAlign = "right";
    label(
      q.total === null ? "未配置单价" : Pricing.dollars(q.total),
      906,
      y,
      31,
      color("ink"),
      423,
      650,
    );
    ctx.textAlign = "left";
    ctx.fillStyle = color("line");
    ctx.fillRect(54, y + 18, 852, 6);
    ctx.fillStyle = color("accent");
    ctx.fillRect(
      54,
      y + 18,
      highest && q.total !== null ? Number((q.total * 852n) / highest) : 0,
      6,
    );
  });
  label(
    "价格快照  " + snapshotDate + "   ·   横条以最高报价为 100%",
    54,
    canvas.height - 95,
    23,
    color("muted"),
  );
  label(
    bill
      ? "按实际用量与配置单价折算，未含额外费用。"
      : "仅含文本用量费用。DeepSeek 默认低峰参考价。* 表示自定义价格。",
    54,
    canvas.height - 47,
    22,
    color("muted"),
  );
  return canvas.toDataURL("image/png");
}
