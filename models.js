"use strict";
const snapshotDate = "2026-11-18";
const presets = [
  { name: "单次编码任务", input: "20000", output: "4000", hit: "40" },
  { name: "每日重度开发", input: "1000000", output: "150000", hit: "70" },
  { name: "月度账单估算", input: "30000000", output: "4500000", hit: "70" },
];
const providers = {
  GPT: ["OpenAI", "https://developers.openai.com/api/docs/pricing"],
  Gemini: ["Google", "https://aistudio.google.com/docs/pricing"],
  DeepSeek: ["DeepSeek", "https://api-docs.deepseek.com/quick_start/pricing/"],
  Claude: [
    "Anthropic",
    "https://platform.claude.com/docs/en/about-claude/pricing",
  ],
};
const models = [
  ["GPT-6.2 Sol", "GPT", "2", "0.10", "10"],
  ["GPT-6.2 Astra", "GPT", "8", "0.40", "40"],
  ["Gemini 4 Hydrogen", "Gemini", "1.50", "0.075", "7.50"],
  ["Gemini 4 Carbon", "Gemini", "2", "0.10", "10"],
  ["DeepSeek V4.1 Flash", "DeepSeek", "0.15", "0.003", "0.60"],
  ["Claude Fable 5.2", "Claude", "8", "0.20", "40"],
  ["Claude Opus 5.5", "Claude", "4", "0.20", "20"],
].map(([name, family, input, cached, output]) => ({
  name,
  family,
  defaults: { input, cached, output },
  editable: family === "Claude" || family === "DeepSeek",
}));

// Additional public API reference prices for recorded local usage.
const billingModels = [
  ["GPT-5.3 Codex", "1.75", "0.175", "14"],
  ["GPT-5.4", "2.50", "0.25", "15"],
  ["Claude Fable 5.1", "10", "0.25", "50"],
  ["Claude Fable 5", "10", "1", "50"],
  ["Claude Opus 5", "5", "0.50", "25"],
  ["Claude Opus 4.8", "5", "0.50", "25"],
  ["Claude Sonnet 5.5", "2", "0.10", "10"],
  ["Claude Sonnet 4.6", "3", "0.30", "15"],
  ["Claude Sonnet 4.5", "3", "0.30", "15"],
].map(([name,input,cached,output]) => ({name,defaults:{input,cached,output},editable:true}));
