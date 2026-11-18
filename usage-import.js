"use strict";
const UsageImport = (() => {
  const key = "midnight-ledger.import.v1";
  const limit = 1500000;
  const textField = (value, length) =>
    typeof value === "string" && value.trim() && value.length <= length &&
    !/[\u0000-\u001f\u007f]/.test(value);
  function parse(text) {
    if (text.length > limit) throw new Error("数据太大，请让 AI 缩短统计区间后重试。");
    const cleaned = text.trim().replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/i, "$1");
    let document;
    try { document = JSON.parse(cleaned); }
    catch { throw new Error("请粘贴 AI 返回的完整 JSON 数据，保留开头和结尾的大括号。"); }
    if (document?.version !== 1 || !Array.isArray(document.rows))
      throw new Error("数据格式应为版本 1，包含 rows 用量列表。");
    if (!document.rows.length) throw new Error("没有可导入的记录，请确认 AI 找到了本机用量日志。");
    const entries = new Set();
    let total = 0;
    const rows = document.rows.map((row, index) => {
      const fail = () => new Error("第 " + (index + 1) + " 条用量记录的日期、模型或计数无效。");
      if (!Array.isArray(row) || row.length !== 7) throw fail();
      const [date, tool, model, input, output, cached, written] = row;
      const day = new Date(date + "T00:00:00Z");
      if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
          !Number.isFinite(day.valueOf()) || day.toISOString().slice(0, 10) !== date ||
          !textField(tool, 60) || !textField(model, 128) ||
          ![input,output,cached,written].every(n => Number.isSafeInteger(n) && n >= 0) ||
          input < cached || input - cached < written) throw fail();
      const identity = [date,tool.trim(),model.trim()].join("\t");
      if (entries.has(identity)) throw new Error("日期、工具和模型有重复，请让 AI 合并后再导入。");
      entries.add(identity);
      total += input + output;
      if (!Number.isSafeInteger(total)) throw fail();
      return {date,tool:tool.trim(),model:model.trim(),input,output,cached,written};
    });
    if (!total) throw new Error("没有非零用量记录可导入。");
    return rows;
  }
  function save(text) {
    const rows = parse(text);
    sessionStorage.setItem(key, JSON.stringify(rows));
  }
  function load() {
    if(Array.isArray(globalThis.ledgerSnapshot)) return globalThis.ledgerSnapshot;
    try { return JSON.parse(sessionStorage.getItem(key)) || []; }
    catch { return []; }
  }
  return {parse,save,load};
})();
if (typeof module !== "undefined") module.exports = UsageImport;
