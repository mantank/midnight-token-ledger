"use strict";
const Pricing = (() => {
  // Costs are integer units of 10^-16 USD: rate (6 decimals), percent
  // (basis points), and price per million tokens each supply one factor.
  const scale = 10n ** 16n;
  const fields = {
    count: { digits: 15, decimals: 0, message: "请输入最多 15 位的非负整数" },
    hit: { digits: 3, decimals: 2, message: "请输入 0 至 100，最多两位小数" },
    rate: {
      digits: 6,
      decimals: 6,
      message: "请输入非负单价，整数和小数各最多 6 位",
    },
  };
  function parseField(raw, kind) {
    const { digits, decimals, message } = fields[kind];
    if (
      typeof raw !== "string" ||
      !raw ||
      raw.length > digits + decimals + 1 ||
      /[^0-9.]/u.test(raw)
    )
      throw new RangeError(message);
    const [whole, fraction, extra] = raw.split(".");
    if (
      !whole ||
      whole.length > digits ||
      extra !== undefined ||
      (fraction !== undefined && (!fraction || fraction.length > decimals))
    )
      throw new RangeError(message);
    const scaled = BigInt(whole + (fraction || "").padEnd(decimals, "0"));
    if (kind === "hit" && scaled > 10000n) throw new RangeError(message);
    return scaled;
  }
  function calculate(usage, rates) {
    const input = parseField(usage.input, "count");
    const hit = parseField(usage.hit, "hit");
    const normal = input * (10000n - hit) * parseField(rates.input, "rate");
    const cached = input * hit * parseField(rates.cached, "rate");
    const output =
      parseField(usage.output, "count") *
      10000n *
      parseField(rates.output, "rate");
    return { normal, cached, output, total: normal + cached + output };
  }
  function fullDollars(value) {
    const whole = (value / scale).toLocaleString("en-US");
    const fraction = (value % scale)
      .toString()
      .padStart(16, "0")
      .replace(/0+$/, "")
      .padEnd(4, "0");
    return "$" + whole + "." + fraction;
  }
  function dollars(value) {
    const digits = value > 0n && value < scale / 100n ? 4 : 2;
    const factor = 10n ** BigInt(digits);
    const step = scale / factor;
    const rounded = (value + step / 2n) / step;
    return (
      "$" +
      (rounded / factor).toLocaleString("en-US") +
      "." +
      (rounded % factor).toString().padStart(digits, "0")
    );
  }

  // Normalized input already includes cache reads and writes. Writes are
  // valued at the base input rate; no provider-specific write surcharge here.
  function bill(rows, lookup) {
    const grouped = new Map();
    for (const row of rows) {
      const name = row.model;
      const item = grouped.get(name) || {
        name,
        input: 0n,
        cached: 0n,
        output: 0n,
        tools: new Set(),
      };
      for (const key of ["input", "cached", "output"]) {
        if (!Number.isSafeInteger(row[key]) || row[key] < 0)
          throw new RangeError("无效的用量记录");
        item[key] += BigInt(row[key]);
      }
      if (row.cached > row.input) throw new RangeError("缓存读取超过输入总量");
      item.tools.add(row.tool);
      grouped.set(name, item);
    }
    let total = 0n,
      missing = 0;
    const items = [...grouped.values()];
    for (const item of items) {
      const rates = lookup(item.name);
      item.total = null;
      if (!rates) {
        missing++;
        continue;
      }
      item.total =
        10000n *
        ((item.input - item.cached) * parseField(rates.input, "rate") +
          item.cached * parseField(rates.cached, "rate") +
          item.output * parseField(rates.output, "rate"));
      total += item.total;
    }
    items.sort((a, b) =>
      a.total === b.total
        ? a.name.localeCompare(b.name)
        : a.total === null || (b.total !== null && a.total < b.total)
          ? 1
          : -1,
    );
    return { items, total, missing };
  }
  function compare(a, b) {
    return a.total === b.total ? 0 : a.total < b.total ? -1 : 1;
  }
  return { parseField, calculate, dollars, fullDollars, bill, compare };
})();
if (typeof module !== "undefined") module.exports = Pricing;
