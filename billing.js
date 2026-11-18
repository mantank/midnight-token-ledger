"use strict";
const Billing = (() => {
  const key = "token-ledger.model-rates.v1";
  const fields = { input: "普通输入", cached: "缓存读取", output: "输出" };
  const id = (name) => name.trim().toLowerCase().replace(/[ .]+/g, "-");
  const aliases = new Map([["deepseek-flash", "deepseek-v4-1-flash"]]);
  const canonical = (name) => aliases.get(id(name)) || id(name);
  const builtins = new Map(models.map((m) => [canonical(m.name), m]));
  const overrides = new Map();
  function valid(rates) {
    try {
      for (const k of Object.keys(fields)) Pricing.parseField(rates[k], "rate");
      return true;
    } catch {
      return false;
    }
  }
  function load() {
    try {
      const entries = JSON.parse(localStorage.getItem(key) || "[]");
      overrides.clear();
      for (const [name, rates] of entries)
        if (typeof name === "string" && valid(rates))
          overrides.set(name, rates);
    } catch {
      /* Browser storage can be unavailable for local files. */
    }
  }
  function save(name, rates) {
    if (rates && !valid(rates)) throw new RangeError("单价无效");
    const model = canonical(name);
    if (rates) overrides.set(model, { ...rates });
    else overrides.delete(model);
    try {
      localStorage.setItem(key, JSON.stringify([...overrides]));
    } catch {
      /* Keep the rates for this page. */
    }
  }
  const lookup = (name) =>
    overrides.get(canonical(name)) || builtins.get(canonical(name))?.defaults;
  function element(tag, text, cls) {
    const e = document.createElement(tag);
    e.textContent = text;
    if (cls) e.className = cls;
    return e;
  }
  function money(e, value) {
    e.textContent = Pricing.dollars(value);
    e.title = Pricing.fullDollars(value);
    return e;
  }
  function summary(e, bill) {
    e.replaceChildren(
      element("span", bill.missing ? "已定价小计" : "当前实际总花费"),
    );
    if (bill.items.length && bill.missing === bill.items.length)
      e.append(element("strong", "—"));
    else e.append(money(element("strong", ""), bill.total));
    if (bill.missing)
      e.append(
        element("small", bill.missing + " 个模型未配置单价，总额待补全"),
      );
  }
  function edit(name) {
    const dialog = element("dialog", "");
    dialog.className = "bill-editor";
    const form = element("form", "");
    const title = element("h2", "配置模型单价");
    title.id = "bill-price-title";
    dialog.setAttribute("aria-labelledby", title.id);
    form.append(title, element("p", name + " · 美元／百万 Token", "unit"));
    const inputs = {};
    for (const [k, label] of Object.entries(fields)) {
      const wrap = element("label", label),
        input = element("input", "");
      input.inputMode = "decimal";
      input.maxLength = 24;
      input.required = true;
      input.value = lookup(name)?.[k] ?? "";
      inputs[k] = input;
      wrap.append(input);
      form.append(wrap);
    }
    const err = element("p", "", "rate-error");
    err.setAttribute("role", "alert");
    const cancel = element("button", "取消"),
      submit = element("button", "保存单价", "primary");
    cancel.type = "button";
    cancel.onclick = () => dialog.close();
    submit.type = "submit";
    form.append(err, cancel, submit);
    form.onsubmit = (e) => {
      e.preventDefault();
      const rates = Object.fromEntries(
        Object.entries(inputs).map(([k, v]) => [k, v.value]),
      );
      if (!valid(rates)) {
        err.textContent = "请输入非负单价，最多 6 位整数和 6 位小数。";
        return;
      }
      save(name, rates);
      dialog.close();
      window.dispatchEvent(new Event("billrateschange"));
    };
    dialog.onclose = () => dialog.remove();
    dialog.append(form);
    document.body.append(dialog);
    dialog.showModal();
  }
  function details(target, rows, toolLabel = (t) => t) {
    const normalized = rows.map(row => ({
      ...row,
      model: builtins.get(canonical(row.model))?.name || row.model.toLowerCase()
    }));
    const b = Pricing.bill(normalized, lookup),
      fragment = document.createDocumentFragment();
    for (const item of b.items) {
      const line = element("div", "", "model-line bill-line"),
        left = element("div", "");
      left.append(
        element("strong", item.name === "unknown" ? "未知模型" : item.name),
        element("small", [...item.tools].map(toolLabel).join(" · ")),
      );
      const counts =
        "输入 " +
        item.input.toLocaleString() +
        " · 其中缓存读取 " +
        item.cached.toLocaleString() +
        " · 输出 " +
        item.output.toLocaleString();
      left.append(element("small", counts));
      const right = element("div", "", "bill-values");
      if (item.total !== null)
        right.append(money(element("b", ""), item.total));
      const editable =
        !builtins.has(canonical(item.name)) ||
        builtins.get(canonical(item.name)).editable;
      if (editable) {
        const btn = element(
          "button",
          item.total === null ? "未配置单价" : "修改单价",
          "bill-rate",
        );
        btn.setAttribute("aria-label", item.name + " " + btn.textContent);
        btn.onclick = () => edit(item.name);
        right.append(btn);
      }
      right.append(
        element(
          "small",
          (item.input + item.output).toLocaleString() + " Token",
        ),
      );
      line.append(left, right);
      fragment.append(line);
    }
    if (!b.items.length)
      fragment.append(element("p", "当前范围没有用量记录。", "unit"));
    target.replaceChildren(fragment);
    return b;
  }
  load();
  window.addEventListener("storage", (e) => {
    if (e.key === key || e.key === null) {
      load();
      window.dispatchEvent(new Event("billrateschange"));
    }
  });
  return { lookup, save, summary, details, money, valid };
})();
