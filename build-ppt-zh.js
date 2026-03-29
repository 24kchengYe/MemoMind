const pptxgen = require("pptxgenjs");
const path = require("path");
const fs = require("fs");

// ============================================================
// MemoMind 演示文稿 — 深色科技风（中文版）
// ============================================================

const DOCS = path.join(__dirname, "docs");
const DEMOS = path.join(DOCS, "demos");
const DIAGRAMS = path.join(DOCS, "diagrams");

// Colors (no # prefix)
const C = {
  bg: "0D1117",
  bgCard: "161B22",
  bgCard2: "1C2333",
  accent: "4ADEAB",
  accentDim: "2A8B6A",
  white: "FFFFFF",
  textPrimary: "E6EDF3",
  textSecondary: "8B949E",
  textMuted: "6E7681",
  worldGreen: "4ADE80",
  expPurple: "C084FC",
  obsGold: "FBBF24",
  mentalBlue: "60A5FA",
  border: "30363D",
  red: "F87171",
  tableHeaderBg: "21262D",
  tableRowBg: "161B22",
  tableRowAlt: "0D1117",
};

function addGlowCard(slide, pres, x, y, w, h, fillColor = C.bgCard) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    fill: { color: fillColor, transparency: 15 },
    line: { color: C.border, width: 0.75 },
    rectRadius: 0.12,
    shadow: { type: "outer", blur: 12, offset: 0, color: C.accent, opacity: 0.06, angle: 0 },
  });
}

function addSlideNumber(slide, num, total = 22) {
  slide.addText(`${num} / ${total}`, {
    x: 8.5, y: 5.2, w: 1.2, h: 0.3,
    fontSize: 9, color: C.textMuted, align: "right", fontFace: "Consolas",
  });
}

function addTitle(slide, title, subtitle) {
  slide.addText(title, {
    x: 0.6, y: 0.25, w: 8.8, h: 0.55,
    fontSize: 28, fontFace: "Microsoft YaHei", color: C.textPrimary, bold: true, margin: 0,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.6, y: 0.8, w: 8.8, h: 0.35,
      fontSize: 13, fontFace: "Microsoft YaHei", color: C.textSecondary, margin: 0,
    });
  }
}

async function buildPresentation() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "24kchengYe";
  pres.title = "MemoMind \u2014 \u7ED9\u4F60\u7684 AI \u4E00\u4E2A\u80FD\u8BB0\u4F4F\u7684\u5927\u8111";

  pres.defineSlideMaster({
    title: "DARK_BG",
    background: { color: C.bg },
  });

  const TOTAL_SLIDES = 23;
  const graphPath = path.join(DEMOS, "graph-view.png");

  // ============================================================
  // P1 \u2014 \u5C01\u9762
  // ============================================================
  let slide = pres.addSlide({ masterName: "DARK_BG" });

  if (fs.existsSync(graphPath)) {
    slide.addImage({ path: graphPath, x: 0, y: 0, w: 10, h: 5.625, transparency: 75 });
  }
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.bg, transparency: 30 },
  });
  slide.addShape(pres.shapes.OVAL, {
    x: 3.5, y: 0.8, w: 3, h: 3, fill: { color: C.accent, transparency: 88 },
  });

  slide.addText("MemoMind", {
    x: 0, y: 1.4, w: 10, h: 1.0,
    fontSize: 52, fontFace: "Georgia", color: C.white, bold: true, align: "center", margin: 0,
  });
  slide.addText("\u7ED9\u4F60\u7684 AI \u4E00\u4E2A\u80FD\u8BB0\u4F4F\u7684\u5927\u8111\u3002", {
    x: 0, y: 2.4, w: 10, h: 0.6,
    fontSize: 20, fontFace: "Microsoft YaHei", color: C.accent, align: "center", margin: 0, italic: true,
  });
  slide.addText("100% \u672C\u5730\u90E8\u7F72  \u00B7  GPU \u52A0\u901F  \u00B7  \u77E5\u8BC6\u56FE\u8C31\u8BB0\u5FC6", {
    x: 0, y: 3.3, w: 10, h: 0.4,
    fontSize: 13, fontFace: "Consolas", color: C.textSecondary, align: "center", margin: 0,
  });
  slide.addText("github.com/24kchengYe/MemoMind", {
    x: 0, y: 4.8, w: 10, h: 0.4,
    fontSize: 11, fontFace: "Consolas", color: C.textMuted, align: "center", margin: 0,
  });

  // ============================================================
  // P2 \u2014 \u75DB\u70B9
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 2, TOTAL_SLIDES);
  addTitle(slide, "\u4F60\u7684 AI \u4EC0\u4E48\u90FD\u4E0D\u8BB0\u5F97\u3002");

  const painCards = [
    {
      title: "\u6BCF\u5929\u65E9\u4E0A\u90FD\u662F\u964C\u751F\u4EBA",
      lines: [
        "\u4F60\u82B1 20 \u5206\u949F\u89E3\u91CA\u9879\u76EE\u67B6\u6784\u3001\u6280\u672F\u9009\u578B\u3001\u547D\u540D\u89C4\u8303\u3002",
        "\u4F1A\u8BDD\u7ED3\u675F\u3002\u660E\u5929\uFF1F",
        "\u201C\u4F60\u597D\uFF0C\u6211\u662F Claude\u3002\u6709\u4EC0\u4E48\u53EF\u4EE5\u5E2E\u4F60\uFF1F\u201D",
        "\u4ECE\u96F6\u5F00\u59CB\u3002\u53C8\u4E00\u6B21\u3002",
      ],
    },
    {
      title: "500 \u6761 AI \u5BF9\u8BDD\uFF0C\u96F6\u4EF7\u503C",
      lines: [
        "ChatGPT \u91CC\u8BA8\u8BBA\u7684\u79D1\u7814\u601D\u8DEF\u3001",
        "Gemini \u91CC\u7684 debug \u8FC7\u7A0B\u3001",
        "Claude \u91CC\u7684\u67B6\u6784\u51B3\u7B56\u2014\u2014",
        "\u5206\u6563\u5728 3 \u4E2A\u5E73\u53F0\uFF0C\u65E0\u6CD5\u641C\u7D22\uFF0C\u4E92\u4E0D\u8FDE\u901A\u3002",
        "\u4F60\u7684\u77E5\u8BC6\u5728\u8150\u70C2\u3002",
      ],
    },
    {
      title: "\u4F60\u7684\u4EBA\u751F\u5BF9 AI \u4E0D\u53EF\u89C1",
      lines: [
        "\u4F60\u5728 DayLife \u91CC\u8BB0\u5F55\u4E86 2,400+ \u5929\u7684\u6D3B\u52A8\u3002",
        "\u4F60\u7684 AI \u4E0D\u77E5\u9053\u4F60\u4E0A\u6B21\u505A\u8FD9\u4E2A\u8BFE\u9898\u662F\u4EC0\u4E48\u65F6\u5019\uFF0C",
        "\u4E0D\u77E5\u9053\u4F60\u6BCF\u5468\u82B1\u591A\u5C11\u65F6\u95F4\u5728\u79D1\u7814\u4E0A\u3002",
        "\u5B83\u5BF9\u4F60\u4E00\u65E0\u6240\u77E5\u3002",
      ],
    },
  ];

  painCards.forEach((card, i) => {
    const x = 0.4 + i * 3.15;
    addGlowCard(slide, pres, x, 1.2, 2.95, 3.2);
    slide.addText(card.title, {
      x: x + 0.2, y: 1.35, w: 2.55, h: 0.45,
      fontSize: 14, fontFace: "Microsoft YaHei", color: C.red, bold: true, margin: 0,
    });
    const textParts = card.lines.map((line, li) => ({
      text: line,
      options: { breakLine: li < card.lines.length - 1, fontSize: 11, color: C.textSecondary },
    }));
    slide.addText(textParts, {
      x: x + 0.2, y: 1.85, w: 2.55, h: 2.4,
      fontFace: "Microsoft YaHei", margin: 0, valign: "top",
    });
  });

  slide.addText("\u95EE\u9898\u4E0D\u662F\u667A\u80FD\u2014\u2014\u662F\u5931\u5FC6\u3002\u6A21\u578B\u5728\u53D8\u806A\u660E\uFF0C\u8BB0\u5FC6\u5728\u539F\u5730\u8E0F\u6B65\u3002", {
    x: 0.6, y: 4.6, w: 8.8, h: 0.4,
    fontSize: 13, fontFace: "Microsoft YaHei", color: C.accent, bold: true, margin: 0, align: "center",
  });

  // ============================================================
  // P3 \u2014 \u73B0\u6709\u65B9\u6848\u7684\u5C40\u9650
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 3, TOTAL_SLIDES);
  addTitle(slide, "\u73B0\u6709\u65B9\u6848\u89E3\u51B3\u4E86\u4EC0\u4E48\uFF1F\u6CA1\u89E3\u51B3\u4EC0\u4E48\uFF1F");

  const compHeaders = [
    { text: "", options: { fill: { color: C.tableHeaderBg }, color: C.textMuted, bold: true } },
    { text: "CLAUDE.md", options: { fill: { color: C.tableHeaderBg }, color: C.textSecondary, bold: true } },
    { text: "RAG / \u5411\u91CF\u6570\u636E\u5E93", options: { fill: { color: C.tableHeaderBg }, color: C.textSecondary, bold: true } },
    { text: "\u957F\u4E0A\u4E0B\u6587\u7A97\u53E3", options: { fill: { color: C.tableHeaderBg }, color: C.textSecondary, bold: true } },
    { text: "MemoMind", options: { fill: { color: C.tableHeaderBg }, color: C.accent, bold: true } },
  ];

  const compRows = [
    ["\u672C\u8D28", "\u624B\u5199\u89C4\u5219\u6587\u4EF6", "\u6587\u6863\u68C0\u7D22\u5DE5\u5177", "\u66F4\u5927\u7684\u9605\u89C8\u5BA4", "AI \u7684\u5927\u8111"],
    ["\u8BB0\u5FC6\u63D0\u53D6", "\u624B\u52A8\u7EF4\u62A4", "\u9700\u8981\u9884\u5904\u7406\u6587\u6863", "\u65E0\u2014\u2014\u539F\u6587\u585E\u8FDB\u53BB", "LLM \u81EA\u52A8\u63D0\u53D6\u4E8B\u5B9E"],
    ["\u77E5\u8BC6\u5173\u8054", "\u65E0", "\u65E0\uFF08\u5B64\u7ACB chunk\uFF09", "\u65E0", "\u5B9E\u4F53\u94FE\u63A5 + \u77E5\u8BC6\u56FE\u8C31"],
    ["\u8DE8\u6E90\u878D\u5408", "\u4E0D\u652F\u6301", "\u6309\u6587\u6863\u68C0\u7D22", "\u53D7\u9650\u4E8E\u7A97\u53E3\u5927\u5C0F", "ChatGPT+Gemini+DayLife \u7EDF\u4E00"],
    ["\u63A8\u7406\u80FD\u529B", "\u65E0", "\u65E0", "\u4F9D\u8D56\u6A21\u578B", "reflect \u8DE8\u8BB0\u5FC6\u7EFC\u5408\u63A8\u7406"],
    ["\u65F6\u95F4\u611F\u77E5", "\u65E0", "\u65E0", "\u65E0", "\u65F6\u5E8F\u641C\u7D22 + \u4E8B\u4EF6\u65E5\u671F\u8FFD\u8E2A"],
    ["\u6210\u672C", "\u514D\u8D39\u4F46\u6D6A\u8D39 token", "\u53D6\u51B3\u4E8E\u65B9\u6848", "\u957F\u4E0A\u4E0B\u6587\u5F88\u8D35", "~$0.01/\u5929"],
    ["\u6269\u5C55\u6027", "~200 \u884C\u5C31\u81A8\u80C0", "\u53D6\u51B3\u4E8E\u5B9E\u73B0", "100K token \u4E0A\u9650", "\u5DF2\u9A8C\u8BC1 8,000+ \u8BB0\u5FC6"],
  ];

  const tableData = [compHeaders];
  compRows.forEach((row, ri) => {
    tableData.push(row.map((cell, ci) => ({
      text: cell,
      options: {
        fill: { color: ri % 2 === 0 ? C.tableRowBg : C.tableRowAlt },
        color: ci === 4 ? C.accent : (ci === 0 ? C.textSecondary : C.textPrimary),
        bold: ci === 0 || ci === 4,
        fontSize: 9,
      },
    })));
  });

  slide.addTable(tableData, {
    x: 0.3, y: 1.15, w: 9.4,
    colW: [1.2, 1.8, 1.8, 1.8, 2.2],
    border: { pt: 0.5, color: C.border },
    fontFace: "Microsoft YaHei",
    fontSize: 9,
    rowH: [0.32, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
  });

  slide.addText("RAG \u662F\u56FE\u4E66\u9986\uFF0C\u957F\u4E0A\u4E0B\u6587\u662F\u66F4\u5927\u7684\u9605\u89C8\u5BA4\u2014\u2014MemoMind \u662F\u5927\u8111\u3002", {
    x: 0.6, y: 4.7, w: 8.8, h: 0.4,
    fontSize: 12, fontFace: "Microsoft YaHei", color: C.accent, italic: true, align: "center", margin: 0,
  });

  // ============================================================
  // P4 \u2014 MemoMind \u662F\u4EC0\u4E48
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 4, TOTAL_SLIDES);
  addTitle(slide, "\u4E00\u4E2A\u6D3B\u7684\u77E5\u8BC6\u56FE\u8C31\uFF0C\u8D8A\u7528\u8D8A\u806A\u660E");

  addGlowCard(slide, pres, 0.6, 1.2, 8.8, 1.5);
  slide.addText([
    { text: "MemoMind \u662F\u4E00\u4E2A 100% \u672C\u5730\u8FD0\u884C\u3001GPU \u52A0\u901F\u7684 AI \u8BB0\u5FC6\u7CFB\u7EDF\u3002\n", options: { fontSize: 14, color: C.textPrimary, bold: true, breakLine: true } },
    { text: "\u5B83\u4E0D\u5B58\u50A8\u804A\u5929\u8BB0\u5F55\u2014\u2014\u800C\u662F\u4ECE\u6BCF\u4E00\u6B21\u4EA4\u4E92\u4E2D\u63D0\u53D6\u4E8B\u5B9E\uFF0C\n\u6784\u5EFA\u4E00\u5F20\u6301\u7EED\u751F\u957F\u7684\u77E5\u8BC6\u56FE\u8C31\u3002", options: { fontSize: 12, color: C.textSecondary } },
  ], {
    x: 0.9, y: 1.35, w: 8.2, h: 1.2, fontFace: "Microsoft YaHei", margin: 0, valign: "middle",
  });

  const bigNums = [
    { num: "8,456", label: "\u8BB0\u5FC6\u8282\u70B9" },
    { num: "556,672", label: "\u77E5\u8BC6\u94FE\u63A5" },
    { num: "4,666", label: "\u547D\u540D\u5B9E\u4F53" },
  ];

  bigNums.forEach((item, i) => {
    const x = 0.8 + i * 3.1;
    addGlowCard(slide, pres, x, 3.0, 2.8, 1.6);
    slide.addText(item.num, {
      x: x, y: 3.1, w: 2.8, h: 0.8,
      fontSize: 36, fontFace: "Consolas", color: C.accent, bold: true, align: "center", margin: 0,
    });
    slide.addText(item.label, {
      x: x, y: 3.85, w: 2.8, h: 0.4,
      fontSize: 12, fontFace: "Microsoft YaHei", color: C.textSecondary, align: "center", margin: 0,
    });
  });

  slide.addText("\u8DE8\u8D8A 2017-01 \u81F3\u4ECA \u00B7 3 \u4E2A\u8BB0\u5FC6 Bank \u00B7 484 MB \u672C\u5730\u6570\u636E", {
    x: 0, y: 4.8, w: 10, h: 0.35,
    fontSize: 11, fontFace: "Consolas", color: C.textMuted, align: "center", margin: 0,
  });

  // ============================================================
  // P5 \u2014 \u7CFB\u7EDF\u67B6\u6784
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 5, TOTAL_SLIDES);
  addTitle(slide, "\u7CFB\u7EDF\u67B6\u6784");

  const archPath = path.join(DIAGRAMS, "architecture-zh.svg");
  if (fs.existsSync(archPath)) {
    slide.addImage({ path: archPath, x: 0.3, y: 1.15, w: 6.2, h: 4.2 });
  }

  const archNotes = [
    { label: "MCP \u534F\u8BAE", desc: "Claude Code / Cursor \u2192 stdio" },
    { label: "LLM", desc: "gpt-4o-mini \u00B7 $0.01/\u5929" },
    { label: "\u5D4C\u5165\u6A21\u578B", desc: "bge-m3 \u00B7 RTX 3070 CUDA \u00B7 50ms" },
    { label: "\u91CD\u6392\u5E8F", desc: "ms-marco-MiniLM \u00B7 \u672C\u5730 CUDA" },
    { label: "\u5B58\u50A8", desc: "PostgreSQL 17 + pgvector 0.8 + HNSW" },
    { label: "\u8FD0\u884C\u73AF\u5883", desc: "Windows \u539F\u751F \u6216 WSL2/Linux \u00B7 \u5F00\u673A\u81EA\u542F" },
  ];

  archNotes.forEach((note, i) => {
    const y = 1.2 + i * 0.65;
    slide.addText([
      { text: note.label, options: { bold: true, color: C.accent, fontSize: 10, breakLine: true } },
      { text: note.desc, options: { color: C.textSecondary, fontSize: 9 } },
    ], { x: 6.7, y, w: 3.0, h: 0.55, fontFace: "Microsoft YaHei", margin: 0, valign: "middle" });
  });

  // ============================================================
  // P6 \u2014 \u4E09\u5927\u6838\u5FC3\u64CD\u4F5C
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 6, TOTAL_SLIDES);
  addTitle(slide, "retain \u00B7 recall \u00B7 reflect");

  const ops = [
    {
      name: "retain\uFF08\u5B58\u50A8\uFF09",
      color: C.worldGreen,
      desc: "\u7528\u6237\u5BF9\u8BDD \u2192 LLM \u63D0\u53D6\u7ED3\u6784\u5316\u4E8B\u5B9E \u2192 \u5411\u91CF\u5316 \u2192 \u5165\u56FE\u8C31",
      detail: "\u81EA\u52A8\u8BC6\u522B\u5B9E\u4F53\u3001\u65F6\u95F4\u3001\u5206\u7C7B\u3002\u5F02\u6B65\u5904\u7406\uFF0C\u4E0D\u963B\u585E\u5BF9\u8BDD\u3002",
    },
    {
      name: "recall\uFF08\u53EC\u56DE\uFF09",
      color: C.accent,
      desc: "\u67E5\u8BE2 \u2192 4 \u8DEF\u5E76\u884C\u68C0\u7D22 \u2192 \u91CD\u6392\u5E8F \u2192 \u8FD4\u56DE\u6700\u76F8\u5173\u8BB0\u5FC6",
      detail: "\u5173\u952E\u8BCD 20ms / \u8BED\u4E49 400ms\u3002\u53EA\u8FD4\u56DE\u76F8\u5173\u7247\u6BB5\uFF0C\u4E0D\u6D6A\u8D39 token\u3002",
    },
    {
      name: "reflect\uFF08\u53CD\u601D\uFF09",
      color: C.expPurple,
      desc: "\u7EFC\u5408\u591A\u6761\u8BB0\u5FC6\uFF0C\u8FDB\u884C\u8DE8\u77E5\u8BC6\u63A8\u7406",
      detail: "\u201C\u57FA\u4E8E\u4F60\u8FC7\u53BB\u7684\u51B3\u7B56\u548C\u7ECF\u9A8C\uFF0C\u5206\u6790\u8FD9\u4E2A\u65B9\u6848\u7684\u98CE\u9669\u201D",
    },
  ];

  ops.forEach((op, i) => {
    const x = 0.4 + i * 3.15;
    addGlowCard(slide, pres, x, 1.2, 2.95, 3.8);
    slide.addText(op.name, {
      x: x + 0.15, y: 1.35, w: 2.65, h: 0.5,
      fontSize: 18, fontFace: "Microsoft YaHei", color: op.color, bold: true, margin: 0,
    });
    slide.addText(op.desc, {
      x: x + 0.15, y: 2.0, w: 2.65, h: 1.2,
      fontSize: 12, fontFace: "Microsoft YaHei", color: C.textPrimary, margin: 0, valign: "top",
    });
    slide.addText(op.detail, {
      x: x + 0.15, y: 3.3, w: 2.65, h: 1.2,
      fontSize: 10, fontFace: "Microsoft YaHei", color: C.textSecondary, italic: true, margin: 0, valign: "top",
    });
  });

  // ============================================================
  // P7 \u2014 4 \u8DEF\u6DF7\u5408\u68C0\u7D22
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 7, TOTAL_SLIDES);
  addTitle(slide, "\u4E0D\u53EA\u662F\u5411\u91CF\u641C\u7D22\u2014\u20144 \u8DEF\u6DF7\u5408\u68C0\u7D22");

  const paths = [
    {
      name: "\u8BED\u4E49\u76F8\u4F3C\u5EA6",
      color: C.accent,
      items: ["bge-m3\uFF081024\u7EF4\uFF09\uFF0C\u652F\u6301 100+ \u8BED\u8A00", "HNSW \u7D22\u5F15\uFF0CO(log n) \u67E5\u8BE2", "\u7406\u89E3\u540C\u4E49\u8BCD\u3001\u8DE8\u8BED\u8A00\u5173\u8054"],
    },
    {
      name: "BM25 \u5173\u952E\u8BCD",
      color: C.worldGreen,
      items: ["PostgreSQL GIN \u7D22\u5F15\u5168\u6587\u641C\u7D22", "\u7CBE\u786E\u672F\u8BED\u5339\u914D\uFF1A\u4EE3\u7801\u540D\u3001\u6587\u4EF6\u8DEF\u5F84", "20ms \u54CD\u5E94"],
    },
    {
      name: "\u77E5\u8BC6\u56FE\u8C31\u904D\u5386",
      color: C.expPurple,
      items: ["47\u4E07 entity links + 3.5\u4E07 semantic links", "\u5B9E\u4F53\u5171\u73B0\uFF1A\u201CFastAPI\u201D \u2192 \u201CExpress\u201D", "\u53D1\u73B0\u9690\u542B\u5173\u8054"],
    },
    {
      name: "\u65F6\u5E8F\u641C\u7D22",
      color: C.obsGold,
      items: ["4.8\u4E07 temporal links", "\u201C\u6700\u8FD1\u4E00\u5468\u7684\u51B3\u7B56\u201D / \u201C2024\u5E743\u6708\u201D", "\u65F6\u95F4\u8870\u51CF\u6743\u91CD"],
    },
  ];

  paths.forEach((p, i) => {
    const x = 0.3 + i * 2.4;
    addGlowCard(slide, pres, x, 1.15, 2.25, 3.3);
    slide.addText(p.name, {
      x: x + 0.12, y: 1.3, w: 2.0, h: 0.45,
      fontSize: 12, fontFace: "Microsoft YaHei", color: p.color, bold: true, margin: 0,
    });
    const bulletItems = p.items.map((item, idx) => ({
      text: item,
      options: { bullet: true, breakLine: idx < p.items.length - 1, fontSize: 10, color: C.textSecondary },
    }));
    slide.addText(bulletItems, {
      x: x + 0.12, y: 1.85, w: 2.0, h: 2.4,
      fontFace: "Microsoft YaHei", margin: 0, valign: "top",
    });
  });

  slide.addText("cross-encoder/ms-marco-MiniLM \u6700\u7EC8\u91CD\u6392\u5E8F\uFF0C\u786E\u4FDD\u6700\u76F8\u5173\u7684\u6392\u6700\u524D", {
    x: 0.6, y: 4.65, w: 8.8, h: 0.35,
    fontSize: 11, fontFace: "Microsoft YaHei", color: C.accent, italic: true, align: "center", margin: 0,
  });

  // ============================================================
  // P8 \u2014 \u56DB\u79CD\u8BB0\u5FC6\u7C7B\u578B
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 8, TOTAL_SLIDES);
  addTitle(slide, "\u4EFF\u751F\u8BB0\u5FC6\u5206\u7C7B\u2014\u2014\u50CF\u4EBA\u8111\u4E00\u6837\u7EC4\u7EC7\u77E5\u8BC6");

  const memTypes = [
    { type: "World", color: C.worldGreen, count: "7,546", pct: "89%", desc: "\u5BA2\u89C2\u4E8B\u5B9E", example: "\u201C\u7528\u6237\u7684\u4E13\u4E1A\u662F\u57CE\u5E02\u89C4\u5212\u201D / \u201C\u9879\u76EE\u7528 FastAPI\u201D" },
    { type: "Observation", color: C.obsGold, count: "908", pct: "11%", desc: "\u81EA\u52A8\u5F52\u7EB3\u7684\u6A21\u5F0F", example: "\u201C\u7528\u6237\u7ECF\u5E38\u5728\u5468\u4E8C\u505A\u79D1\u7814\u201D / \u201C\u504F\u597D\u51FD\u6570\u5F0F\u98CE\u683C\u201D" },
    { type: "Experience", color: C.expPurple, count: "2", pct: "<1%", desc: "\u53C2\u4E0E\u8FC7\u7684\u4E8B\u4EF6", example: "\u201C\u4E0A\u6B21\u8C03\u8BD5\u4E86 auth \u6A21\u5757\u201D" },
    { type: "Mental Model", color: C.mentalBlue, count: "0", pct: "\u2014", desc: "\u590D\u6742\u4E3B\u9898\u7406\u89E3", example: "\u201C\u8FD9\u4E2A\u4EE3\u7801\u5E93\u9075\u5FAA\u516D\u8FB9\u5F62\u67B6\u6784\u201D" },
  ];

  memTypes.forEach((mt, i) => {
    const y = 1.15 + i * 1.05;
    addGlowCard(slide, pres, 0.4, y, 9.2, 0.92);
    slide.addShape(pres.shapes.OVAL, { x: 0.6, y: y + 0.28, w: 0.35, h: 0.35, fill: { color: mt.color } });
    slide.addText(mt.type, {
      x: 1.1, y: y + 0.08, w: 1.4, h: 0.4,
      fontSize: 15, fontFace: "Georgia", color: mt.color, bold: true, margin: 0,
    });
    slide.addText(`${mt.count}  (${mt.pct})`, {
      x: 1.1, y: y + 0.48, w: 1.4, h: 0.3,
      fontSize: 10, fontFace: "Consolas", color: C.textMuted, margin: 0,
    });
    slide.addText(mt.desc, {
      x: 2.7, y: y + 0.08, w: 2.0, h: 0.35,
      fontSize: 12, fontFace: "Microsoft YaHei", color: C.textPrimary, bold: true, margin: 0,
    });
    slide.addText(mt.example, {
      x: 2.7, y: y + 0.45, w: 6.7, h: 0.35,
      fontSize: 10, fontFace: "Microsoft YaHei", color: C.textSecondary, italic: true, margin: 0,
    });
  });

  slide.addText("Observation \u7531 Consolidation \u5F15\u64CE\u81EA\u52A8\u751F\u6210\u2014\u2014\u4E0D\u662F\u4F60\u5199\u7684\uFF0C\u662F AI \u81EA\u5DF1\u53D1\u73B0\u7684\u6A21\u5F0F\u3002", {
    x: 0.6, y: 5.0, w: 8.8, h: 0.3,
    fontSize: 11, fontFace: "Microsoft YaHei", color: C.obsGold, italic: true, align: "center", margin: 0,
  });

  // ============================================================
  // P9 \u2014 \u8BB0\u5FC6\u8FDB\u5316\u5F15\u64CE
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 9, TOTAL_SLIDES);
  addTitle(slide, "\u8BB0\u5FC6\u4E0D\u5806\u79EF\u2014\u2014\u4F1A\u5408\u5E76\u3001\u66F4\u65B0\u3001\u8FDB\u5316");

  const evoSteps = [
    { num: "1", text: "\u65B0\u4E8B\u5B9E\u8FDB\u5165 \u2192 \u4E0E\u5DF2\u6709\u8BB0\u5FC6\u5BF9\u6BD4" },
    { num: "2", text: "\u91CD\u590D\uFF1F\u2192 \u5408\u5E76\uFF0C\u589E\u52A0\u7F6E\u4FE1\u5EA6" },
    { num: "3", text: "\u77DB\u76FE\uFF1F\u2192 \u4FDD\u7559\u6700\u65B0\u7248\u672C" },
    { num: "4", text: "\u591A\u6761\u76F8\u5173\u4E8B\u5B9E \u2192 \u81EA\u52A8\u5F52\u7EB3\u4E3A Observation" },
    { num: "5", text: "Observation \u6301\u7EED\u7CBE\u70BC\uFF0Cproof_count++" },
  ];

  evoSteps.forEach((step, i) => {
    const y = 1.2 + i * 0.55;
    slide.addShape(pres.shapes.OVAL, { x: 0.6, y: y + 0.05, w: 0.35, h: 0.35, fill: { color: C.accent } });
    slide.addText(step.num, {
      x: 0.6, y: y + 0.05, w: 0.35, h: 0.35,
      fontSize: 12, fontFace: "Consolas", color: C.bg, bold: true, align: "center", valign: "middle", margin: 0,
    });
    slide.addText(step.text, {
      x: 1.1, y: y, w: 4.0, h: 0.45,
      fontSize: 12, fontFace: "Microsoft YaHei", color: C.textPrimary, margin: 0, valign: "middle",
    });
  });

  addGlowCard(slide, pres, 5.4, 1.2, 4.2, 3.8);
  slide.addText("\u5B9E\u9645\u6848\u4F8B\uFF08life bank\uFF09", {
    x: 5.6, y: 1.3, w: 3.8, h: 0.4,
    fontSize: 13, fontFace: "Microsoft YaHei", color: C.accent, bold: true, margin: 0,
  });
  slide.addText([
    { text: "5 \u6761\u539F\u59CB\u4E8B\u5B9E\uFF1A\n", options: { bold: true, color: C.textSecondary, fontSize: 10, breakLine: true } },
    { text: "\u201C2024-03-25 \u53C2\u52A0\u4E86\u5168\u7403\u57CE\u9547\u5316\u7684\u5B66\u4E60\u201D\n", options: { fontSize: 9, color: C.textMuted, breakLine: true } },
    { text: "\u201C2024-03-26 \u53C2\u52A0\u4E86\u5168\u7403\u57CE\u9547\u5316\u5DE5\u4F5C\u201D\n", options: { fontSize: 9, color: C.textMuted, breakLine: true } },
    { text: "\u201C2024-04-01 \u5168\u7403\u57CE\u9547\u5316\u5408\u5E76\u6570\u636E\u201D\n", options: { fontSize: 9, color: C.textMuted, breakLine: true } },
    { text: "...\n\n", options: { fontSize: 9, color: C.textMuted, breakLine: true } },
    { text: "AI \u81EA\u52A8\u5F52\u7EB3\u7684 Observation\uFF1A\n", options: { bold: true, color: C.obsGold, fontSize: 10, breakLine: true } },
    { text: "\u201C\u7528\u6237\u5DF2\u5B8C\u6210\u4E86 paddleOCR \u901A\u9053\u5DE5\u4F5C\u201D (proof_count=3)", options: { fontSize: 10, color: C.obsGold, italic: true } },
  ], { x: 5.6, y: 1.8, w: 3.8, h: 3.0, fontFace: "Microsoft YaHei", margin: 0, valign: "top" });

  slide.addText("\u5F53\u524D 908 \u6761 Observation\uFF0C\u7531\u5F15\u64CE\u4ECE 7,546 \u6761 World facts \u4E2D\u81EA\u52A8\u5F52\u7EB3", {
    x: 0.6, y: 5.0, w: 8.8, h: 0.3,
    fontSize: 11, fontFace: "Microsoft YaHei", color: C.accent, italic: true, align: "center", margin: 0,
  });

  // ============================================================
  // P10 \u2014 \u4E09\u4E2A\u8BB0\u5FC6 Bank
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 10, TOTAL_SLIDES);
  addTitle(slide, "\u4E09\u4E2A Bank\uFF0C\u4E09\u7EF4\u4EBA\u751F");

  const banks = [
    {
      name: "default",
      subtitle: "AI \u534F\u4F5C\u8BB0\u5FC6\uFF082,050 \u8282\u70B9\uFF09",
      color: C.accent,
      lines: ["Claude Code \u5B9E\u65F6\u8BB0\u5FC6\uFF1A\u9879\u76EE\u51B3\u7B56\u3001\u7528\u6237\u504F\u597D\u3001\u6280\u672F\u7ECF\u9A8C", "541 \u6761 ChatGPT + Gemini \u5BF9\u8BDD\u5BFC\u5165", "\u5B9E\u4F53 Top 5\uFF1A\u7528\u6237\u3001Python\u3001BSAS\u3001CIM\u3001CityGML", "\u65F6\u95F4\u8DE8\u5EA6\uFF1A2017-01 \u81F3\u4ECA"],
    },
    {
      name: "life",
      subtitle: "\u751F\u6D3B\u8F68\u8FF9\uFF086,361 \u8282\u70B9\uFF09",
      color: C.obsGold,
      lines: ["DayLife 5,490 \u6761\u65E5\u5E38\u4E8B\u4EF6", "\u65F6\u95F4\u8DE8\u5EA6\uFF1A2019-08-26 \u81F3 2026-03-26\uFF082,400+ \u5929\uFF09", "859 \u6761 AI \u81EA\u52A8\u5F52\u7EB3\u7684 Observation", "\u5B9E\u4F53 Top 5\uFF1A\u79D1\u7814\u3001\u9B3C\u57CE\u3001GitHub\u3001\u82F1\u8BED\u3001Python"],
    },
    {
      name: "docs",
      subtitle: "\u6280\u672F\u7B14\u8BB0\uFF0845 \u8282\u70B9\uFF09",
      color: C.mentalBlue,
      lines: ["API \u6587\u6863\u3001\u6846\u67B6\u4F7F\u7528\u6280\u5DE7\u3001\u8E29\u5751\u8BB0\u5F55", "Claude Code \u534F\u4F5C\u4E2D\u5B9E\u65F6\u79EF\u7D2F", "\u5FEB\u901F\u67E5\u627E\u5DF2\u77E5\u95EE\u9898"],
    },
  ];

  banks.forEach((bank, i) => {
    const x = 0.35 + i * 3.15;
    addGlowCard(slide, pres, x, 1.15, 2.95, 3.9);
    slide.addText(bank.name, {
      x: x + 0.15, y: 1.25, w: 2.65, h: 0.4,
      fontSize: 18, fontFace: "Consolas", color: bank.color, bold: true, margin: 0,
    });
    slide.addText(bank.subtitle, {
      x: x + 0.15, y: 1.65, w: 2.65, h: 0.35,
      fontSize: 11, fontFace: "Microsoft YaHei", color: C.textSecondary, margin: 0,
    });
    const bulletItems = bank.lines.map((line, idx) => ({
      text: line,
      options: { bullet: true, breakLine: idx < bank.lines.length - 1, fontSize: 10, color: C.textSecondary },
    }));
    slide.addText(bulletItems, {
      x: x + 0.15, y: 2.1, w: 2.65, h: 2.7,
      fontFace: "Microsoft YaHei", margin: 0, valign: "top",
    });
  });

  // ============================================================
  // P11 \u2014 AI \u5BF9\u8BDD\u5BFC\u5165 + \u6EAF\u6E90
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 11, TOTAL_SLIDES);
  addTitle(slide, "\u4F60\u7684 500 \u6761 AI \u5BF9\u8BDD\uFF0C\u4ECE\u5893\u5730\u53D8\u6210\u91D1\u77FF");

  slide.addText([
    { text: "ChatGPT ", options: { color: C.worldGreen, bold: true, fontSize: 11 } },
    { text: "\u2192 chatgpt-exporter \u2192 JSON\n", options: { color: C.textSecondary, fontSize: 10, breakLine: true } },
    { text: "Gemini  ", options: { color: C.mentalBlue, bold: true, fontSize: 11 } },
    { text: "\u2192 gemini-exporter  \u2192 JSON\n", options: { color: C.textSecondary, fontSize: 10, breakLine: true } },
    { text: "                              \u2193\n", options: { color: C.textMuted, fontSize: 10, breakLine: true } },
    { text: "              import_ai_chats.py\n", options: { color: C.accent, fontSize: 11, bold: true, breakLine: true } },
    { text: "                              \u2193\n", options: { color: C.textMuted, fontSize: 10, breakLine: true } },
    { text: "         MemoMind \u77E5\u8BC6\u56FE\u8C31", options: { color: C.accent, fontSize: 11, bold: true } },
  ], { x: 0.5, y: 1.1, w: 4.5, h: 2.2, fontFace: "Consolas", margin: 0, valign: "top" });

  const aiTimeline = path.join(DEMOS, "ai-chat-timeline.png");
  const origChat = path.join(DEMOS, "original-chat-modal.png");
  if (fs.existsSync(aiTimeline)) {
    slide.addImage({ path: aiTimeline, x: 5.2, y: 1.1, w: 4.5, h: 2.0, sizing: { type: "contain", w: 4.5, h: 2.0 } });
  }
  if (fs.existsSync(origChat)) {
    slide.addImage({ path: origChat, x: 5.2, y: 3.2, w: 4.5, h: 1.8, sizing: { type: "contain", w: 4.5, h: 1.8 } });
  }

  addGlowCard(slide, pres, 0.5, 3.5, 4.5, 1.5);
  slide.addText([
    { text: "541 \u6761\u5BF9\u8BDD \u2192 2,050 \u6761\u8BB0\u5FC6 \u2192 2,093 \u4E2A\u5B9E\u4F53 \u2192 144,426 \u6761\u94FE\u63A5\n", options: { fontSize: 11, color: C.accent, bold: true, breakLine: true } },
    { text: "\u5B8C\u6574\u6EAF\u6E90\uFF1A\u6BCF\u6761\u8BB0\u5FC6\u90FD\u80FD\u8FFD\u6EAF\u5230\u6765\u6E90\u5BF9\u8BDD\n\n", options: { fontSize: 10, color: C.textSecondary, breakLine: true } },
    { text: "\u914D\u5957\u5F00\u6E90\u5DE5\u5177\uFF1A\n", options: { fontSize: 10, color: C.textSecondary, bold: true, breakLine: true } },
    { text: "github.com/24kchengYe/chatgpt-exporter\n", options: { fontSize: 9, color: C.textMuted, breakLine: true } },
    { text: "github.com/24kchengYe/gemini-exporter", options: { fontSize: 9, color: C.textMuted } },
  ], { x: 0.65, y: 3.6, w: 4.2, h: 1.3, fontFace: "Microsoft YaHei", margin: 0, valign: "top" });

  // ============================================================
  // P12 \u2014 DayLife \u96C6\u6210
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 12, TOTAL_SLIDES);
  addTitle(slide, "\u4ECE 2019 \u5230 2026\u2014\u2014\u4F60\u7684\u6BCF\u4E00\u5929\uFF0CAI \u90FD\u8BB0\u5F97");

  const daylifeApp = path.join(DEMOS, "daylife-app.png");
  const daylifeTl = path.join(DEMOS, "daylife-timeline.png");
  if (fs.existsSync(daylifeApp)) {
    slide.addImage({ path: daylifeApp, x: 0.4, y: 1.15, w: 4.4, h: 2.5, sizing: { type: "contain", w: 4.4, h: 2.5 } });
  }
  if (fs.existsSync(daylifeTl)) {
    slide.addImage({ path: daylifeTl, x: 5.2, y: 1.15, w: 4.4, h: 2.5, sizing: { type: "contain", w: 4.4, h: 2.5 } });
  }

  slide.addText("DayLife\u2014\u2014\u4F60\u7684\u6BCF\u65E5\u89C4\u5212\u5668", {
    x: 0.4, y: 3.7, w: 4.4, h: 0.3,
    fontSize: 10, fontFace: "Microsoft YaHei", color: C.textMuted, align: "center", margin: 0,
  });
  slide.addText("5,490 \u6761\u4E8B\u4EF6 \u2192 \u53EF\u641C\u7D22\u3001\u53EF\u5206\u6790\u7684\u8BB0\u5FC6", {
    x: 5.2, y: 3.7, w: 4.4, h: 0.3,
    fontSize: 10, fontFace: "Microsoft YaHei", color: C.textMuted, align: "center", margin: 0,
  });

  addGlowCard(slide, pres, 0.4, 4.05, 9.2, 1.2);
  slide.addText([
    { text: "\u667A\u80FD\u540C\u6B65\uFF1A", options: { bold: true, color: C.accent, fontSize: 11 } },
    { text: "\u6BCF\u5929\u51CC\u6668 3:00 \u81EA\u52A8\u540C\u6B65\uFF08Windows \u5B9A\u65F6\u4EFB\u52A1\uFF09\u00B7 marker \u6587\u4EF6\u8BB0\u5F55\u4E0A\u6B21\u540C\u6B65\u65E5\u671F \u00B7 ", options: { color: C.textSecondary, fontSize: 10 } },
    { text: "\u7535\u8111\u5173\u673A\u4E00\u5468\uFF1F\u91CD\u65B0\u5F00\u673A\u81EA\u52A8\u8865\u9F50\u6240\u6709\u7F3A\u5931\u5929\u6570 \u00B7 \u4E0D\u91CD\u590D\u5BFC\u5165", options: { color: C.textSecondary, fontSize: 10 } },
  ], { x: 0.6, y: 4.15, w: 8.8, h: 1.0, fontFace: "Microsoft YaHei", margin: 0, valign: "middle" });

  // ============================================================
  // P13 \u2014 \u53CC\u641C\u7D22 + \u65E0\u9650\u6EDA\u52A8
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 13, TOTAL_SLIDES);
  addTitle(slide, "\u5173\u952E\u8BCD\u79D2\u641C + \u8BED\u4E49\u6DF1\u5EA6\u53EC\u56DE");

  const searchHeaders = [
    { text: "", options: { fill: { color: C.tableHeaderBg }, color: C.textMuted, bold: true } },
    { text: "\u5173\u952E\u8BCD\u641C\u7D22\uFF08\u9ED8\u8BA4\uFF09", options: { fill: { color: C.tableHeaderBg }, color: C.worldGreen, bold: true } },
    { text: "\u8BED\u4E49\u53EC\u56DE", options: { fill: { color: C.tableHeaderBg }, color: C.expPurple, bold: true } },
  ];

  const searchRows = [
    ["\u901F\u5EA6", "20-33ms", "235-430ms"],
    ["\u539F\u7406", "PostgreSQL GIN \u5168\u6587\u7D22\u5F15", "bge-m3 \u5411\u91CF + HNSW + reranker"],
    ["\u9002\u5408", "\u7CBE\u786E\u672F\u8BED\uFF1A\u6587\u4EF6\u540D\u3001\u6280\u672F\u8BCD\u3001\u4EBA\u540D", "\u6A21\u7CCA\u6982\u5FF5\uFF1A\u201C\u6211\u4E4B\u524D\u505A\u8FC7\u7C7B\u4F3C\u7684\u9879\u76EE\u201D"],
    ["\u5207\u6362", "Dashboard \u4E00\u952E Toggle", ""],
  ];

  const searchTable = [searchHeaders];
  searchRows.forEach((row, ri) => {
    searchTable.push(row.map((cell, ci) => ({
      text: cell,
      options: {
        fill: { color: ri % 2 === 0 ? C.tableRowBg : C.tableRowAlt },
        color: ci === 0 ? C.textMuted : C.textPrimary,
        bold: ci === 0, fontSize: 11,
      },
    })));
  });

  slide.addTable(searchTable, {
    x: 0.5, y: 1.2, w: 9.0,
    colW: [1.5, 3.5, 4.0],
    border: { pt: 0.5, color: C.border },
    fontFace: "Microsoft YaHei",
    rowH: [0.38, 0.38, 0.38, 0.52, 0.38],
  });

  addGlowCard(slide, pres, 0.5, 3.6, 9.0, 1.5);
  slide.addText("\u65E0\u9650\u6EDA\u52A8", {
    x: 0.7, y: 3.7, w: 2.0, h: 0.4,
    fontSize: 16, fontFace: "Microsoft YaHei", color: C.accent, bold: true, margin: 0,
  });
  slide.addText([
    { text: "Stream \u89C6\u56FE\uFF1A", options: { bold: true, color: C.textPrimary, fontSize: 11 } },
    { text: "\u6BCF\u6B21\u6E32\u67D3 50 \u6761\uFF0CIntersectionObserver \u89E6\u5E95\u52A0\u8F7D\n", options: { color: C.textSecondary, fontSize: 10, breakLine: true } },
    { text: "Timeline \u89C6\u56FE\uFF1A", options: { bold: true, color: C.textPrimary, fontSize: 11 } },
    { text: "\u6BCF\u6B21\u6E32\u67D3 30 \u5929\uFF0C\u6EDA\u52A8\u52A0\u8F7D\n", options: { color: C.textSecondary, fontSize: 10, breakLine: true } },
    { text: "8,000+ \u6761\u8BB0\u5FC6\u4E5F\u6D41\u7545\u6D4F\u89C8", options: { color: C.accent, fontSize: 11, bold: true } },
  ], { x: 0.7, y: 4.15, w: 8.5, h: 0.9, fontFace: "Microsoft YaHei", margin: 0, valign: "top" });

  // ============================================================
  // P14 \u2014 Dashboard \u5168\u666F
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 14, TOTAL_SLIDES);
  addTitle(slide, "\u4F60\u7684\u8BB0\u5FC6\uFF0C\u4E00\u76EE\u4E86\u7136");

  const screenshots = [
    { file: "dashboard-overview.png", label: "Dashboard \u6982\u89C8", x: 0.3, y: 1.15 },
    { file: "graph-view.png", label: "\u77E5\u8BC6\u56FE\u8C31 (WebGL)", x: 5.15, y: 1.15 },
    { file: "ai-chat-timeline.png", label: "\u65F6\u95F4\u7EBF\u89C6\u56FE", x: 0.3, y: 3.1 },
    { file: "original-chat-modal.png", label: "\u539F\u59CB\u5BF9\u8BDD\u6EAF\u6E90", x: 5.15, y: 3.1 },
  ];

  screenshots.forEach((ss) => {
    const ssPath = path.join(DEMOS, ss.file);
    if (fs.existsSync(ssPath)) {
      slide.addImage({ path: ssPath, x: ss.x, y: ss.y, w: 4.6, h: 1.7, sizing: { type: "contain", w: 4.6, h: 1.7 } });
    }
    slide.addText(ss.label, {
      x: ss.x, y: ss.y + 1.72, w: 4.6, h: 0.25,
      fontSize: 9, fontFace: "Microsoft YaHei", color: C.textMuted, align: "center", margin: 0,
    });
  });

  slide.addText("\u6697/\u4EAE\u4E3B\u9898 \u00B7 \u7C7B\u578B\u8FC7\u6EE4 \u00B7 \u65F6\u95F4\u8FC7\u6EE4 \u00B7 \u65F6\u95F4\u52A0\u6743 \u00B7 \u9690\u79C1\u6807\u8BB0 \u00B7 JSON \u5BFC\u51FA \u00B7 Bank \u7BA1\u7406", {
    x: 0.3, y: 5.15, w: 9.4, h: 0.3,
    fontSize: 9, fontFace: "Microsoft YaHei", color: C.textMuted, align: "center", margin: 0,
  });

  // ============================================================
  // P15 — 竞品全景对比（深度调研版）
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 15, TOTAL_SLIDES);
  addTitle(slide, "\u7ADE\u54C1\u5168\u666F\u5BF9\u6BD4");

  const compHeaders2 = ["", "MemoMind", "Mem0", "Graphiti/Zep", "Letta", "Cognee", "Hindsight"].map((h, i) => ({
    text: h,
    options: { fill: { color: C.tableHeaderBg }, color: i === 1 ? C.accent : C.textSecondary, bold: true, fontSize: 7 },
  }));

  const compData2 = [
    ["GitHub Stars",  "\u2014",           "51.2K",         "24.3K / 4.3K",   "21.8K",         "14.7K",       "6.5K"],
    ["\u878D\u8D44",       "\u81EA\u8D44",  "$24M (YC)",     "\u2014",              "$10M",          "$7.5M",       "$3.5M"],
    ["\u67B6\u6784",  "KG + pgvector","\u5411\u91CF + \u56FE\u8C31", "\u65F6\u5E8F\u77E5\u8BC6\u56FE\u8C31",   "OS \u4E09\u5C42\u5185\u5B58",     "ECL + KG",    "\u56DB\u7F51\u7EDC"],
    ["\u68C0\u7D22\u65B9\u5F0F",     "4 \u8DEF\u6DF7\u5408", "\u8BED\u4E49 + \u56FE\u8C31","\u8BED\u4E49+BM25+\u56FE\u8C31","Agent \u81EA\u9A71\u52A8",  "14 \u79CD\u6A21\u5F0F",    "4 \u8DEF\u5E76\u884C"],
    ["\u77E5\u8BC6\u56FE\u8C31","pgvector + EL","Pro\u624D\u6709 $249/\u6708", "\u6838\u5FC3\u529F\u80FD (Neo4j)",  "\u65E0",            "\u5168\u5C42\u7EA7\u5F00\u653E",   "\u6709"],
    ["\u65F6\u5E8F\u6A21\u578B","\u539F\u751F\u652F\u6301", "\u65E0",            "\u53CC\u65F6\u5E8F\u6A21\u578B",  "\u65E0",            "\u90E8\u5206",     "\u6709"],
    ["\u90E8\u7F72\u65B9\u5F0F",    "100% \u672C\u5730",   "\u4E91\u7AEF / \u5F00\u6E90",   "\u4E91\u7AEF / \u5F00\u6E90",   "\u4E91\u7AEF / \u5F00\u6E90",   "\u672C\u5730 / \u4E91\u7AEF","\u672C\u5730"],
    ["\u9690\u79C1\u4FDD\u62A4",       "\u6570\u636E\u4E0D\u51FA\u673A\u5668", "\u4E91\u7AEF\u4E3A\u4E3B",  "\u4E91\u7AEF / BYOC",  "\u53EF\u81EA\u6258\u7BA1", "\u672C\u5730\u4E3A\u4E3B","\u672C\u5730"],
    ["GPU \u52A0\u901F",     "\u672C\u5730 CUDA",   "\u65E0",            "\u65E0",            "\u65E0",            "\u65E0",          "\u65E0"],
    ["\u5BF9\u8BDD\u6EAF\u6E90",  "\u5B8C\u6574\u6EAF\u6E90",   "\u65E0",            "\u65E0",            "\u65E0",            "\u65E0",          "\u65E0"],
    ["\u751F\u6D3B\u6570\u636E",     "DayLife",      "\u65E0",            "\u65E0",            "\u65E0",            "\u65E0",          "\u65E0"],
    ["LongMemEval",   "\u2014",           "49.0%",         "\u2014",             "\u2014",             "\u2014",           "91.4%"],
    ["\u6210\u672C",          "$0.01/\u5929",    "\u514D\u8D39~$249/\u6708",  "\u514D\u8D39~$475/\u6708",  "\u514D\u8D39~$200/\u6708",  "\u514D\u8D39~$200/\u6708","\u514D\u8D39 (OSS)"],
    ["\u8BB8\u53EF\u8BC1",       "MIT",          "Apache-2.0",    "Apache-2.0",    "Apache-2.0",    "Apache-2.0",  "MIT"],
  ];

  const compTable2 = [compHeaders2];
  compData2.forEach((row, ri) => {
    compTable2.push(row.map((cell, ci) => ({
      text: cell,
      options: {
        fill: { color: ri % 2 === 0 ? C.tableRowBg : C.tableRowAlt },
        color: ci === 1 ? C.accent : (ci === 0 ? C.textMuted : C.textPrimary),
        bold: ci <= 1, fontSize: 6.5,
      },
    })));
  });

  slide.addTable(compTable2, {
    x: 0.15, y: 1.05, w: 9.7,
    colW: [1.05, 1.25, 1.25, 1.25, 1.15, 1.15, 1.15],
    border: { pt: 0.4, color: C.border },
    fontFace: "Microsoft YaHei",
    rowH: [0.26, 0.26, 0.26, 0.26, 0.26, 0.26, 0.26, 0.26, 0.26, 0.26, 0.26, 0.26, 0.26, 0.26, 0.26],
  });

  slide.addText("\u53E6\u8BC4\u4F30\uFF1AMemOS (7.9K stars)\u3001Memvid (13.6K)\u3001LangMem (1.4K\uFF0CP95 \u5EF6\u8FDF 59\u79D2)\u3001MemoryLake (\u95ED\u6E90\u4F01\u4E1A\u7EA7)", {
    x: 0.2, y: 5.0, w: 9.6, h: 0.25,
    fontSize: 8, fontFace: "Microsoft YaHei", color: C.textMuted, align: "center", margin: 0,
  });

  // ============================================================
  // P15b — 竞品关键洞察
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 16, TOTAL_SLIDES);
  addTitle(slide, "\u7ADE\u54C1\u5173\u952E\u6D1E\u5BDF");

  const insights = [
    {
      title: "Mem0\uFF1A\u6D41\u91CF\u6700\u5927\uFF0C\u4F46\u6DF1\u5EA6\u4E0D\u8DB3",
      text: "51K star\uFF0C$24M \u878D\u8D44\uFF0CAWS \u72EC\u5BB6\u5185\u5B58\u63D0\u4F9B\u5546\u3002\n\u4F46\uFF1A\u56FE\u8C31\u529F\u80FD\u9501 $249/\u6708\u3001\u65E0\u65F6\u5E8F\u6A21\u578B\u3001\n\u72EC\u7ACB LongMemEval \u8BC4\u6D4B\u51C6\u786E\u7387\u4EC5 49.0%\u3002",
      color: C.red,
    },
    {
      title: "Graphiti/Zep\uFF1A\u6700\u4F73\u65F6\u5E8F\u6A21\u578B",
      text: "\u53CC\u65F6\u5E8F\u8FFD\u8E2A\uFF08\u4E8B\u4EF6\u65F6\u95F4 + \u5165\u5E93\u65F6\u95F4\uFF09\uFF0C\u6DF7\u5408\u68C0\u7D22\u3002\n\u4F46\uFF1A\u9700 Neo4j \u8FD0\u7EF4\uFF0CZep \u5168\u5E73\u53F0\u4EC5\u4E91\u7AEF\uFF0C\n\u4FE1\u7528\u5236\u8BA1\u8D39\u590D\u6742\uFF08\u4E2D\u5EA6\u4F7F\u7528 $475/\u6708\uFF09\u3002",
      color: C.expPurple,
    },
    {
      title: "Hindsight\uFF1A\u57FA\u51C6\u6D4B\u8BD5\u51C6\u786E\u7387\u6700\u9AD8",
      text: "LongMemEval \u8FBE 91.4%\uFF08vs Mem0 \u7684 49%\uFF09\u3002\u56DB\u7F51\u7EDC\u67B6\u6784\n\uFF08world/experience/entity/belief\uFF09\u4E0E MemoMind \u8BB0\u5FC6\u5206\u7C7B\u601D\u8DEF\u76F8\u4F3C\u3002\n\u4F46\uFF1A\u8F83\u65B0\u9879\u76EE\uFF086.5K star\uFF09\uFF0C\u751F\u4EA7\u9A8C\u8BC1\u8F83\u5C11\u3002",
      color: C.obsGold,
    },
    {
      title: "MemoMind \u7684\u72EC\u7279\u5B9A\u4F4D",
      text: "\u552F\u4E00\u540C\u65F6\u5177\u5907\uFF1A100% \u672C\u5730 + GPU \u52A0\u901F + \u77E5\u8BC6\u56FE\u8C31\n+ 4 \u8DEF\u68C0\u7D22 + AI \u5BF9\u8BDD\u6EAF\u6E90 + \u751F\u6D3B\u6570\u636E\u96C6\u6210 + MCP \u539F\u751F\u3002\n\u65E0\u7ADE\u54C1\u540C\u65F6\u8986\u76D6\u6240\u6709\u516D\u9879\u3002\u6210\u672C\uFF1A$0.30/\u6708 vs $99-475/\u6708\u3002",
      color: C.accent,
    },
  ];

  insights.forEach((ins, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.35 + col * 4.75;
    const y = 1.15 + row * 2.15;
    addGlowCard(slide, pres, x, y, 4.5, 1.95);
    slide.addText(ins.title, {
      x: x + 0.15, y: y + 0.1, w: 4.2, h: 0.4,
      fontSize: 13, fontFace: "Microsoft YaHei", color: ins.color, bold: true, margin: 0,
    });
    slide.addText(ins.text, {
      x: x + 0.15, y: y + 0.55, w: 4.2, h: 1.25,
      fontSize: 10, fontFace: "Microsoft YaHei", color: C.textSecondary, margin: 0, valign: "top",
    });
  });

  // ============================================================
  // P16 \u2014 \u6838\u5FC3\u6280\u672F\u4EAE\u70B9
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 17, TOTAL_SLIDES);
  addTitle(slide, "\u6280\u672F\u6DF1\u5165");

  const techCards = [
    { title: "\u77E5\u8BC6\u56FE\u8C31\u800C\u975E\u6241\u5E73\u5B58\u50A8", desc: "556,672 \u6761\u94FE\u63A5\uFF1Aentity (85%) + temporal (9%) + semantic (6%)\u3002\u5B9E\u4F53\u5171\u73B0\u63A8\u7406\u53D1\u73B0\u9690\u542B\u5173\u8054\u3002", color: C.accent },
    { title: "\u4E8B\u5B9E\u63D0\u53D6\u5F15\u64CE", desc: "gpt-4o-mini \u81EA\u52A8\u63D0\u53D6\u5B9E\u4F53\u3001\u5173\u7CFB\u3001\u65F6\u95F4\u3001\u5206\u7C7B\u3002\u5F02\u6B65\u961F\u5217\u5904\u7406\uFF0C\u4E0D\u963B\u585E\u5BF9\u8BDD\u3002", color: C.worldGreen },
    { title: "\u5408\u5E76\u5F52\u7EB3\u5F15\u64CE", desc: "\u81EA\u52A8\u5408\u5E76\u91CD\u590D\u4E8B\u5B9E\u3001\u5F52\u7EB3 Observation\u3002\u5DF2\u751F\u6210 908 \u6761 Observation\uFF08\u4ECE 7,546 \u6761 World facts\uFF09\u3002", color: C.obsGold },
    { title: "\u5D4C\u5165\u6A21\u578B\u672C\u5730\u5316", desc: "bge-m3\uFF1A1024 \u7EF4\uFF0C100+ \u8BED\u8A00\u3002RTX 3070 CUDA \u52A0\u901F\uFF0C50ms/\u6761\u3002\u96F6 API \u8C03\u7528\u3001\u96F6\u5EF6\u8FDF\u3001\u96F6\u6210\u672C\u3002", color: C.expPurple },
    { title: "\u65F6\u95F4\u611F\u77E5\u8BB0\u5FC6", desc: "\u6BCF\u6761\u8BB0\u5FC6\u5E26 occurred_start/end\u3002LLM \u4E0D\u8BBE\u65F6\u95F4\u65F6\u81EA\u52A8\u56DE\u9000\u5230\u4E8B\u4EF6\u65E5\u671F\u3002\u652F\u6301\u65F6\u95F4\u8303\u56F4\u67E5\u8BE2\u3002", color: C.mentalBlue },
    { title: "\u539F\u59CB\u5BF9\u8BDD\u6EAF\u6E90", desc: "retain \u65F6\u4FDD\u5B58 original_document_id\u3002Dashboard\uFF1Achunk_id \u2192 doc hash \u2192 index.json \u2192 .md \u6587\u4EF6\u3002", color: C.red },
  ];

  techCards.forEach((tc, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.35 + col * 3.15;
    const y = 1.15 + row * 2.15;
    addGlowCard(slide, pres, x, y, 2.95, 1.95);
    slide.addText(tc.title, {
      x: x + 0.15, y: y + 0.1, w: 2.65, h: 0.45,
      fontSize: 12, fontFace: "Microsoft YaHei", color: tc.color, bold: true, margin: 0,
    });
    slide.addText(tc.desc, {
      x: x + 0.15, y: y + 0.6, w: 2.65, h: 1.2,
      fontSize: 10, fontFace: "Microsoft YaHei", color: C.textSecondary, margin: 0, valign: "top",
    });
  });

  // ============================================================
  // P17 \u2014 \u6210\u672C\u4E0E\u8D44\u6E90
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 18, TOTAL_SLIDES);
  addTitle(slide, "\u6BCF\u5929\u4E0D\u5230 1 \u6BDB\u94B1");

  const costHeaders = ["\u7EC4\u4EF6", "\u8D44\u6E90\u5360\u7528", "\u6210\u672C"].map(h => ({
    text: h, options: { fill: { color: C.tableHeaderBg }, color: C.textSecondary, bold: true, fontSize: 12 },
  }));

  const costRows = [
    ["LLM \u63D0\u53D6 (gpt-4o-mini via OpenRouter)", "~100 \u6B21\u8C03\u7528/\u5929", "~$0.01/\u5929"],
    ["\u5D4C\u5165\u6A21\u578B (bge-m3 \u672C\u5730 CUDA)", "~500MB VRAM \u77AC\u65F6", "$0"],
    ["\u91CD\u6392\u5E8F (ms-marco-MiniLM \u672C\u5730)", "~200MB VRAM \u77AC\u65F6", "$0"],
    ["\u5B58\u50A8 (PostgreSQL)", "484MB \u78C1\u76D8", "$0"],
    ["\u670D\u52A1\u8FDB\u7A0B", "~2GB RAM", "$0"],
  ];

  const costTable = [costHeaders];
  costRows.forEach((row, ri) => {
    costTable.push(row.map((cell, ci) => ({
      text: cell,
      options: {
        fill: { color: ri % 2 === 0 ? C.tableRowBg : C.tableRowAlt },
        color: ci === 2 ? C.accent : C.textPrimary,
        bold: ci === 2, fontSize: 11,
      },
    })));
  });

  slide.addTable(costTable, {
    x: 0.5, y: 1.2, w: 9.0,
    colW: [4.0, 2.5, 2.5],
    border: { pt: 0.5, color: C.border },
    fontFace: "Microsoft YaHei",
    rowH: [0.4, 0.4, 0.4, 0.4, 0.4, 0.4],
  });

  addGlowCard(slide, pres, 0.5, 3.8, 9.0, 1.4);
  slide.addText("\u6210\u672C\u5BF9\u6BD4", {
    x: 0.7, y: 3.9, w: 3.0, h: 0.4,
    fontSize: 14, fontFace: "Microsoft YaHei", color: C.accent, bold: true, margin: 0,
  });
  slide.addText([
    { text: "MemoryLake\uFF1A", options: { bold: true, color: C.textPrimary, fontSize: 12 } },
    { text: "\u4F01\u4E1A\u5B9A\u4EF7\uFF0C\u672A\u516C\u5F00\n", options: { color: C.textSecondary, fontSize: 11, breakLine: true } },
    { text: "Mem0 Pro\uFF1A", options: { bold: true, color: C.textPrimary, fontSize: 12 } },
    { text: "$99/\u6708\u8D77\n", options: { color: C.textSecondary, fontSize: 11, breakLine: true } },
    { text: "MemoMind\uFF1A", options: { bold: true, color: C.accent, fontSize: 13 } },
    { text: "$0.30/\u6708\uFF0C\u5168\u90E8\u672C\u5730", options: { color: C.accent, fontSize: 12, bold: true } },
  ], { x: 0.7, y: 4.3, w: 8.5, h: 0.8, fontFace: "Microsoft YaHei", margin: 0, valign: "top" });

  // ============================================================
  // P18 \u2014 \u5DF2\u6709\u6210\u679C
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 19, TOTAL_SLIDES);
  addTitle(slide, "\u771F\u5B9E\u6570\u636E\uFF0C\u771F\u5B9E\u4F7F\u7528");

  const stats = [
    ["\u603B\u8BB0\u5FC6\u8282\u70B9", "8,456"],
    ["\u77E5\u8BC6\u94FE\u63A5", "556,672"],
    ["\u547D\u540D\u5B9E\u4F53", "4,666"],
    ["AI \u5BF9\u8BDD\u5BFC\u5165", "541 (ChatGPT 115 + Gemini 426)"],
    ["\u751F\u6D3B\u4E8B\u4EF6\u5BFC\u5165", "5,490 (2019-08 \u81F3 2026-03)"],
    ["\u81EA\u52A8\u5F52\u7EB3 Observation", "908"],
    ["\u8986\u76D6\u65F6\u95F4\u8DE8\u5EA6", "2017-01 \u81F3\u4ECA\uFF089 \u5E74\uFF09"],
    ["\u6570\u636E\u5E93\u5360\u7528", "484 MB"],
    ["\u65E5\u5747 LLM \u6210\u672C", "< $0.01"],
    ["\u5173\u952E\u8BCD\u641C\u7D22\u5EF6\u8FDF", "20-33ms"],
    ["\u8BED\u4E49\u53EC\u56DE\u5EF6\u8FDF", "235-430ms"],
  ];

  stats.forEach((stat, i) => {
    const col = i < 6 ? 0 : 1;
    const row = i < 6 ? i : i - 6;
    const x = 0.4 + col * 4.8;
    const y = 1.15 + row * 0.7;

    slide.addText(stat[0], {
      x: x, y, w: 2.8, h: 0.35,
      fontSize: 11, fontFace: "Microsoft YaHei", color: C.textSecondary, margin: 0, align: "right",
    });
    slide.addText(stat[1], {
      x: x + 2.9, y, w: 1.8, h: 0.35,
      fontSize: 12, fontFace: "Consolas", color: C.accent, bold: true, margin: 0,
    });
    slide.addShape(pres.shapes.LINE, {
      x: x, y: y + 0.38, w: 4.5, h: 0, line: { color: C.border, width: 0.5 },
    });
  });

  slide.addText("\u8FD9\u4E0D\u662F\u5B9E\u9A8C\u5BA4 demo\u2014\u2014\u662F\u6BCF\u5929\u5728\u7528\u7684\u751F\u4EA7\u7CFB\u7EDF\u3002", {
    x: 0, y: 4.9, w: 10, h: 0.4,
    fontSize: 13, fontFace: "Microsoft YaHei", color: C.accent, bold: true, align: "center", margin: 0,
  });

  // ============================================================
  // P19 \u2014 \u6838\u5FC3\u7406\u5FF5
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 20, TOTAL_SLIDES);
  addTitle(slide, "\u8BB0\u5FC6\u662F\u65B0\u7684\u62A4\u57CE\u6CB3");

  const philosophies = [
    {
      title: "\u6A21\u578B\u5546\u54C1\u5316\uFF0C\u8BB0\u5FC6\u4E0D\u4F1A",
      text: "GPT-5 \u6BD4 GPT-4 \u4FBF\u5B9C 97%\u3002\u6A21\u578B\u5728\u8D2C\u503C\u3002\n\u4F46\u4F60\u79EF\u7D2F\u7684 8,000+ \u6761\u8BB0\u5FC6\u3001500+ \u5B9E\u4F53\u5173\u7CFB\u30019 \u5E74\u751F\u6D3B\u8F68\u8FF9\u2014\u2014\n\u4EFB\u4F55\u6A21\u578B\u66FF\u6362\u90FD\u65E0\u6CD5\u590D\u5236\u3002",
      color: C.accent,
    },
    {
      title: "\u6570\u636E\u53EF\u8FC1\u79FB\uFF0C\u4E0D\u9501\u5B9A",
      text: "\u5F00\u653E JSON \u683C\u5F0F\u5BFC\u51FA\uFF0C\u542B\u6240\u6709\u8BB0\u5FC6\u3001\u5B9E\u4F53\u3001\u6807\u7B7E\u3001\u5173\u7CFB\u3001\u6765\u6E90\u3002\n\u6BCF\u5468\u81EA\u52A8\u5907\u4EFD\u5230 GitHub\u3002\n\u660E\u5929\u51FA\u73B0\u66F4\u597D\u7684\u7CFB\u7EDF\uFF1F\u5E26\u8D70\u4E00\u5207\u3002",
      color: C.worldGreen,
    },
    {
      title: "\u6570\u5B57\u5206\u8EAB\uFF0C\u65F6\u95F4\u8D8A\u4E45\u8D8A\u6709\u4EF7\u503C",
      text: "\u4ECE\u4ECA\u5929\u5F00\u59CB\u79EF\u7D2F\u3002\n\u4F60\u7684 AI \u660E\u5929\u6BD4\u4ECA\u5929\u66F4\u4E86\u89E3\u4F60\uFF0C\u660E\u5E74\u6BD4\u660E\u5929\u66F4\u4E86\u89E3\u4F60\u3002\n\u8FD9\u5C31\u662F\u590D\u5229\u3002",
      color: C.expPurple,
    },
  ];

  philosophies.forEach((ph, i) => {
    const y = 1.15 + i * 1.45;
    addGlowCard(slide, pres, 0.5, y, 9.0, 1.3);
    slide.addText(ph.title, {
      x: 0.7, y: y + 0.1, w: 8.5, h: 0.4,
      fontSize: 15, fontFace: "Microsoft YaHei", color: ph.color, bold: true, margin: 0,
    });
    slide.addText(ph.text, {
      x: 0.7, y: y + 0.5, w: 8.5, h: 0.7,
      fontSize: 11, fontFace: "Microsoft YaHei", color: C.textSecondary, margin: 0, valign: "top",
    });
  });

  // ============================================================
  // P20 \u2014 Roadmap
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 21, TOTAL_SLIDES);
  addTitle(slide, "\u4E0B\u4E00\u6B65");

  slide.addText("\u5DF2\u5B8C\u6210", {
    x: 0.6, y: 1.15, w: 4.0, h: 0.4,
    fontSize: 14, fontFace: "Microsoft YaHei", color: C.textMuted, bold: true, margin: 0,
  });

  const done = [
    "\u6838\u5FC3\u5F15\u64CE\uFF1Aretain / recall / reflect",
    "4 \u8DEF\u6DF7\u5408\u68C0\u7D22 + GPU \u52A0\u901F",
    "AI \u5BF9\u8BDD\u5BFC\u5165 + \u539F\u59CB\u5BF9\u8BDD\u6EAF\u6E90",
    "DayLife \u751F\u6D3B\u8F68\u8FF9\u96C6\u6210",
    "Web Dashboard (Stream / Graph / Timeline)",
    "\u6BCF\u5468\u81EA\u52A8\u5907\u4EFD",
    "Windows \u539F\u751F\u652F\u6301\uFF08\u65E0\u9700 WSL\uFF09",
  ];
  slide.addText(done.map((item, i) => ({
    text: "  " + item,
    options: { bullet: true, breakLine: i < done.length - 1, fontSize: 11, color: C.textMuted },
  })), { x: 0.6, y: 1.6, w: 4.2, h: 3.2, fontFace: "Microsoft YaHei", margin: 0, valign: "top" });

  slide.addText("\u4E0B\u4E00\u6B65", {
    x: 5.2, y: 1.15, w: 4.0, h: 0.4,
    fontSize: 14, fontFace: "Microsoft YaHei", color: C.accent, bold: true, margin: 0,
  });

  const next = [
    "\u8BB0\u5FC6\u51B2\u7A81\u68C0\u6D4B\u4E0E\u7248\u672C\u5316",
    "\u591A\u8DF3\u56FE\u8C31\u63A8\u7406\uFF082-3 \u8DF3\uFF09",
    "\u8BB0\u5FC6\u8870\u51CF\u673A\u5236\uFF08\u65F6\u95F4\u52A0\u6743\u5F52\u6863\uFF09",
    "Docker \u5B89\u88C5\u2014\u2014\u4E00\u952E\u90E8\u7F72",
    "\u66F4\u591A MCP \u5BA2\u6237\u7AEF\uFF1ACursor, Windsurf \u7B49",
  ];
  slide.addText(next.map((item, i) => ({
    text: "  " + item,
    options: { bullet: true, breakLine: i < next.length - 1, fontSize: 11, color: C.accent },
  })), { x: 5.2, y: 1.6, w: 4.5, h: 3.2, fontFace: "Microsoft YaHei", margin: 0, valign: "top" });

  slide.addShape(pres.shapes.LINE, {
    x: 5.0, y: 1.15, w: 0, h: 3.8, line: { color: C.border, width: 1 },
  });

  // ============================================================
  // P21 \u2014 \u5FEB\u901F\u5F00\u59CB
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 22, TOTAL_SLIDES);
  addTitle(slide, "5 \u5206\u949F\uFF0C\u4ECE\u5931\u5FC6\u5230\u8BB0\u5FC6");

  addGlowCard(slide, pres, 0.4, 1.15, 9.2, 3.9);

  const codeLines = [
    "# 1. \u514B\u9686",
    "git clone https://github.com/24kchengYe/MemoMind.git",
    "",
    "# 2. \u5B89\u88C5\u2014\u2014\u9009\u62E9\u4F60\u7684\u5E73\u53F0\uFF1A",
    "#    Windows: python -m venv memomind-env && pip install hindsight-api-slim",
    "#    Linux/WSL: sudo bash install.sh",
    "",
    "# 3. \u914D\u7F6E LLM API \u5BC6\u94A5 (serve.py)",
    "",
    "# 4. \u6CE8\u518C MCP",
    "#    Windows: claude mcp add memomind -- python.exe mcp_stdio.py",
    "#    Linux:   claude mcp add memomind -- /opt/.../mcp_stdio.py",
    "",
    "# 5. \u5F00\u59CB\u5BF9\u8BDD\u2014\u2014AI \u81EA\u52A8 retain/recall",
  ];

  slide.addText(codeLines.join("\n"), {
    x: 0.7, y: 1.35, w: 8.6, h: 3.5,
    fontSize: 10, fontFace: "Consolas", color: C.worldGreen, margin: 0.1, valign: "top",
  });

  slide.addText("GitHub: github.com/24kchengYe/MemoMind  \u00B7  MIT License", {
    x: 0, y: 5.1, w: 10, h: 0.3,
    fontSize: 11, fontFace: "Consolas", color: C.textMuted, align: "center", margin: 0,
  });

  // ============================================================
  // P22 \u2014 \u5C3E\u9875
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });

  if (fs.existsSync(graphPath)) {
    slide.addImage({ path: graphPath, x: 0, y: 0, w: 10, h: 5.625, transparency: 80 });
  }
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.bg, transparency: 25 },
  });
  slide.addShape(pres.shapes.OVAL, {
    x: 3, y: 1.0, w: 4, h: 3, fill: { color: C.accent, transparency: 90 },
  });

  slide.addText("\u4ECA\u5929\u5F00\u59CB\u57F9\u517B\u4F60\u7684\u6570\u5B57\u5206\u8EAB\u3002", {
    x: 0, y: 1.5, w: 10, h: 0.8,
    fontSize: 28, fontFace: "Microsoft YaHei", color: C.white, bold: true, align: "center", margin: 0,
  });

  slide.addText("Start building your digital twin's memory today.", {
    x: 0, y: 2.3, w: 10, h: 0.6,
    fontSize: 16, fontFace: "Georgia", color: C.accent, align: "center", margin: 0, italic: true,
  });

  const links = [
    "GitHub: github.com/24kchengYe/MemoMind",
    "Dashboard: 127.0.0.1:9999",
    "chatgpt-exporter: github.com/24kchengYe/chatgpt-exporter",
    "gemini-exporter: github.com/24kchengYe/gemini-exporter",
  ];
  slide.addText(links.join("\n"), {
    x: 0, y: 3.3, w: 10, h: 1.5,
    fontSize: 11, fontFace: "Consolas", color: C.textMuted, align: "center", margin: 0, paraSpaceAfter: 6,
  });

  addSlideNumber(slide, 23, TOTAL_SLIDES);

  // Write
  const outPath = path.join(__dirname, "MemoMind-Presentation-ZH.pptx");
  await pres.writeFile({ fileName: outPath });
  console.log(`\u4E2D\u6587\u7248\u5DF2\u4FDD\u5B58\u5230\uFF1A ${outPath}`);
}

buildPresentation().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
