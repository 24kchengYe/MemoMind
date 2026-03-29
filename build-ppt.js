const pptxgen = require("pptxgenjs");
const path = require("path");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fs = require("fs");

// ============================================================
// MemoMind Presentation — Dark Tech Theme
// ============================================================

const DOCS = path.join(__dirname, "docs");
const DEMOS = path.join(DOCS, "demos");
const DIAGRAMS = path.join(DOCS, "diagrams");

// Colors (no # prefix)
const C = {
  bg: "0D1117",        // deep blue-black
  bgCard: "161B22",    // card background
  bgCard2: "1C2333",   // lighter card
  accent: "4ADEAB",    // cyan-green accent
  accentDim: "2A8B6A", // dimmer accent
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

// Icon rendering helpers
function renderIconSvg(svgContent, color, size = 256) {
  return svgContent;
}

async function svgToBase64Png(svgString, size = 256) {
  const pngBuffer = await sharp(Buffer.from(svgString))
    .resize(size, size)
    .png()
    .toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

// Generate simple geometric icons as SVG
function makeCircleIcon(color, size = 256) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size/2}" cy="${size/2}" r="${size*0.4}" fill="#${color}" opacity="0.9"/>
  </svg>`;
}

function makeBrainIcon(color, size = 256) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9.5 2a2.5 2.5 0 0 1 2.5 2.5v0a2.5 2.5 0 0 1-2.5 2.5h0a2.5 2.5 0 0 1-2.5-2.5v0A2.5 2.5 0 0 1 9.5 2z"/>
    <path d="M14.5 2a2.5 2.5 0 0 1 2.5 2.5v0a2.5 2.5 0 0 1-2.5 2.5"/>
    <path d="M6 7a2.5 2.5 0 0 0-2.5 2.5v0A2.5 2.5 0 0 0 6 12"/>
    <path d="M18 7a2.5 2.5 0 0 1 2.5 2.5v0A2.5 2.5 0 0 1 18 12"/>
    <path d="M6 12a2.5 2.5 0 0 0-2.5 2.5v0A2.5 2.5 0 0 0 6 17"/>
    <path d="M18 12a2.5 2.5 0 0 1 2.5 2.5v0A2.5 2.5 0 0 1 18 17"/>
    <path d="M9 17a3 3 0 0 0 3 3v0a3 3 0 0 0 3-3"/>
    <path d="M12 7v13"/>
  </svg>`;
}

function makeCheckIcon(color, size = 256) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="#${color}">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
  </svg>`;
}

function makeStarIcon(color, size = 256) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="#${color}">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>`;
}

// Helper: create a "glow card" background shape
function addGlowCard(slide, pres, x, y, w, h, fillColor = C.bgCard) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    fill: { color: fillColor, transparency: 15 },
    line: { color: C.border, width: 0.75 },
    rectRadius: 0.12,
    shadow: { type: "outer", blur: 12, offset: 0, color: C.accent, opacity: 0.06, angle: 0 },
  });
}

// Helper: add slide number
function addSlideNumber(slide, num, total = 22) {
  slide.addText(`${num} / ${total}`, {
    x: 8.5, y: 5.2, w: 1.2, h: 0.3,
    fontSize: 9, color: C.textMuted, align: "right",
    fontFace: "Consolas",
  });
}

// Helper: slide title
function addTitle(slide, title, subtitle) {
  slide.addText(title, {
    x: 0.6, y: 0.25, w: 8.8, h: 0.55,
    fontSize: 28, fontFace: "Georgia", color: C.textPrimary, bold: true, margin: 0,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.6, y: 0.8, w: 8.8, h: 0.35,
      fontSize: 13, fontFace: "Calibri", color: C.textSecondary, margin: 0,
    });
  }
}

// Helper: add bottom bar
function addBottomBar(slide, text) {
  slide.addShape(slide._slideLayout ? slide._slideLayout : "rect", {});
  // Simple bottom text
  slide.addText(text, {
    x: 0.6, y: 5.0, w: 8.8, h: 0.35,
    fontSize: 11, fontFace: "Calibri", color: C.accent, italic: true, margin: 0,
  });
}

async function buildPresentation() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "24kchengYe";
  pres.title = "MemoMind — Give your AI a brain that remembers";

  // Define slide master for dark bg
  pres.defineSlideMaster({
    title: "DARK_BG",
    background: { color: C.bg },
  });

  // ============================================================
  // P1 — Cover
  // ============================================================
  let slide = pres.addSlide({ masterName: "DARK_BG" });

  // Background image (graph-view blurred)
  const TOTAL_SLIDES = 23;
  const graphPath = path.join(DEMOS, "graph-view.png");
  if (fs.existsSync(graphPath)) {
    slide.addImage({
      path: graphPath,
      x: 0, y: 0, w: 10, h: 5.625,
      transparency: 75,
    });
  }

  // Dark overlay
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 5.625,
    fill: { color: C.bg, transparency: 30 },
  });

  // Glow circle behind title
  slide.addShape(pres.shapes.OVAL, {
    x: 3.5, y: 0.8, w: 3, h: 3,
    fill: { color: C.accent, transparency: 88 },
  });

  slide.addText("MemoMind", {
    x: 0, y: 1.4, w: 10, h: 1.0,
    fontSize: 52, fontFace: "Georgia", color: C.white, bold: true,
    align: "center", margin: 0,
  });

  slide.addText("Give your AI a brain that remembers.", {
    x: 0, y: 2.4, w: 10, h: 0.6,
    fontSize: 20, fontFace: "Calibri", color: C.accent,
    align: "center", margin: 0, italic: true,
  });

  slide.addText("100% Local  ·  GPU-Accelerated  ·  Knowledge Graph Memory", {
    x: 0, y: 3.3, w: 10, h: 0.4,
    fontSize: 13, fontFace: "Consolas", color: C.textSecondary,
    align: "center", margin: 0,
  });

  slide.addText("github.com/24kchengYe/MemoMind", {
    x: 0, y: 4.8, w: 10, h: 0.4,
    fontSize: 11, fontFace: "Consolas", color: C.textMuted,
    align: "center", margin: 0,
  });

  // ============================================================
  // P2 — Pain Points
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 2, TOTAL_SLIDES);
  addTitle(slide, "Your AI remembers nothing.");

  const painCards = [
    {
      title: "Every morning: a stranger",
      lines: [
        "You spend 20 min explaining your project.",
        "Session ends. Tomorrow?",
        '"Hi, I\'m Claude. How can I help?"',
        "Start over. Again.",
      ],
    },
    {
      title: "500 AI chats, zero value",
      lines: [
        "Research ideas in ChatGPT,",
        "debug logs in Gemini,",
        "architecture in Claude —",
        "scattered, unsearchable, disconnected.",
        "Your knowledge is decaying.",
      ],
    },
    {
      title: "Your life is invisible to AI",
      lines: [
        "2,400+ days of activities in DayLife.",
        "Your AI doesn't know when you last",
        "worked on this topic, or how you",
        "spend your time.",
        "It knows nothing about you.",
      ],
    },
  ];

  painCards.forEach((card, i) => {
    const x = 0.4 + i * 3.15;
    addGlowCard(slide, pres, x, 1.2, 2.95, 3.2);
    slide.addText(card.title, {
      x: x + 0.2, y: 1.35, w: 2.55, h: 0.45,
      fontSize: 14, fontFace: "Georgia", color: C.red, bold: true, margin: 0,
    });
    const textParts = card.lines.map((line, li) => ({
      text: line,
      options: { breakLine: li < card.lines.length - 1, fontSize: 11, color: C.textSecondary },
    }));
    slide.addText(textParts, {
      x: x + 0.2, y: 1.85, w: 2.55, h: 2.4,
      fontFace: "Calibri", margin: 0, valign: "top",
    });
  });

  slide.addText("The problem isn't intelligence — it's amnesia. Models get smarter, memory stays at zero.", {
    x: 0.6, y: 4.6, w: 8.8, h: 0.4,
    fontSize: 13, fontFace: "Calibri", color: C.accent, bold: true, margin: 0, align: "center",
  });

  // ============================================================
  // P3 — Existing Solutions Limitations
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 3, TOTAL_SLIDES);
  addTitle(slide, "Existing solutions fall short.");

  const compHeaders = [
    { text: "", options: { fill: { color: C.tableHeaderBg }, color: C.textMuted, bold: true } },
    { text: "CLAUDE.md", options: { fill: { color: C.tableHeaderBg }, color: C.textSecondary, bold: true } },
    { text: "RAG", options: { fill: { color: C.tableHeaderBg }, color: C.textSecondary, bold: true } },
    { text: "Long Context", options: { fill: { color: C.tableHeaderBg }, color: C.textSecondary, bold: true } },
    { text: "MemoMind", options: { fill: { color: C.tableHeaderBg }, color: C.accent, bold: true } },
  ];

  const compRows = [
    ["Essence", "Manual rules file", "Doc retrieval", "Bigger reading room", "AI's Brain"],
    ["Extraction", "Manual", "Pre-process docs", "None — raw input", "LLM auto-extract"],
    ["Knowledge Links", "None", "None (isolated chunks)", "None", "Entity linking + graph"],
    ["Cross-source", "No", "Per-document", "Window limited", "ChatGPT+Gemini+DayLife"],
    ["Reasoning", "None", "None", "Model-dependent", "reflect: cross-memory"],
    ["Time-aware", "No", "No", "No", "Temporal search + date"],
    ["Cost", "Free but token-wasteful", "Varies", "Expensive", "~$0.01/day"],
    ["Scale", "~200 lines max", "Depends", "100K token limit", "8,000+ memories verified"],
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
    fontFace: "Calibri",
    fontSize: 9,
    rowH: [0.32, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
  });

  slide.addText("RAG is a library. Long context is a bigger reading room. MemoMind is a brain.", {
    x: 0.6, y: 4.7, w: 8.8, h: 0.4,
    fontSize: 12, fontFace: "Calibri", color: C.accent, italic: true, align: "center", margin: 0,
  });

  // ============================================================
  // P4 — What is MemoMind
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 4, TOTAL_SLIDES);
  addTitle(slide, "A living knowledge graph that gets smarter over time.");

  addGlowCard(slide, pres, 0.6, 1.2, 8.8, 1.5);
  slide.addText([
    { text: "MemoMind is a 100% local, GPU-accelerated AI memory system.\n", options: { fontSize: 14, color: C.textPrimary, bold: true, breakLine: true } },
    { text: "It doesn't store chat logs — it extracts facts from every interaction\nand builds a continuously growing knowledge graph.", options: { fontSize: 12, color: C.textSecondary } },
  ], {
    x: 0.9, y: 1.35, w: 8.2, h: 1.2, fontFace: "Calibri", margin: 0, valign: "middle",
  });

  // Big numbers
  const bigNums = [
    { num: "8,456", label: "Memory Nodes" },
    { num: "556,672", label: "Knowledge Links" },
    { num: "4,666", label: "Named Entities" },
  ];

  bigNums.forEach((item, i) => {
    const x = 0.8 + i * 3.1;
    addGlowCard(slide, pres, x, 3.0, 2.8, 1.6);
    slide.addText(item.num, {
      x: x, y: 3.1, w: 2.8, h: 0.8,
      fontSize: 36, fontFace: "Consolas", color: C.accent, bold: true,
      align: "center", margin: 0,
    });
    slide.addText(item.label, {
      x: x, y: 3.85, w: 2.8, h: 0.4,
      fontSize: 12, fontFace: "Calibri", color: C.textSecondary,
      align: "center", margin: 0,
    });
  });

  slide.addText("Spanning 2017-01 to today · 3 Memory Banks · 484 MB local data", {
    x: 0, y: 4.8, w: 10, h: 0.35,
    fontSize: 11, fontFace: "Consolas", color: C.textMuted, align: "center", margin: 0,
  });

  // ============================================================
  // P5 — Architecture
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 5, TOTAL_SLIDES);
  addTitle(slide, "Under the Hood");

  // Insert architecture SVG
  const archPath = path.join(DIAGRAMS, "architecture-zh.svg");
  if (fs.existsSync(archPath)) {
    slide.addImage({
      path: archPath,
      x: 0.3, y: 1.15, w: 6.2, h: 4.2,
    });
  }

  // Side notes
  const archNotes = [
    { label: "MCP Protocol", desc: "Claude Code / Cursor → stdio" },
    { label: "LLM", desc: "gpt-4o-mini · $0.01/day" },
    { label: "Embedding", desc: "bge-m3 · RTX 3070 CUDA · 50ms" },
    { label: "Reranker", desc: "ms-marco-MiniLM · local CUDA" },
    { label: "Storage", desc: "PostgreSQL 17 + pgvector 0.8 + HNSW" },
    { label: "Runtime", desc: "Windows native or WSL2/Linux · auto-start" },
  ];

  archNotes.forEach((note, i) => {
    const y = 1.2 + i * 0.65;
    slide.addText([
      { text: note.label, options: { bold: true, color: C.accent, fontSize: 10, breakLine: true } },
      { text: note.desc, options: { color: C.textSecondary, fontSize: 9 } },
    ], {
      x: 6.7, y, w: 3.0, h: 0.55,
      fontFace: "Calibri", margin: 0, valign: "middle",
    });
  });

  // ============================================================
  // P6 — Core Operations
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 6, TOTAL_SLIDES);
  addTitle(slide, "retain · recall · reflect");

  const ops = [
    {
      name: "retain",
      color: C.worldGreen,
      desc: "Conversation → LLM extracts structured facts → vectorize → into graph",
      detail: "Auto-detect entities, time, categories. Async — never blocks dialogue.",
    },
    {
      name: "recall",
      color: C.accent,
      desc: "Query → 4-way parallel retrieval → reranker → most relevant memories",
      detail: "Keyword 20ms / Semantic 400ms. Returns only relevant fragments.",
    },
    {
      name: "reflect",
      color: C.expPurple,
      desc: "Synthesize multiple memories for cross-knowledge reasoning",
      detail: '"Based on your past decisions, analyze the risks of this approach."',
    },
  ];

  ops.forEach((op, i) => {
    const x = 0.4 + i * 3.15;
    addGlowCard(slide, pres, x, 1.2, 2.95, 3.8);

    slide.addText(op.name, {
      x: x + 0.15, y: 1.35, w: 2.65, h: 0.5,
      fontSize: 22, fontFace: "Consolas", color: op.color, bold: true, margin: 0,
    });

    slide.addText(op.desc, {
      x: x + 0.15, y: 2.0, w: 2.65, h: 1.2,
      fontSize: 12, fontFace: "Calibri", color: C.textPrimary, margin: 0, valign: "top",
    });

    slide.addText(op.detail, {
      x: x + 0.15, y: 3.3, w: 2.65, h: 1.2,
      fontSize: 10, fontFace: "Calibri", color: C.textSecondary, italic: true, margin: 0, valign: "top",
    });
  });

  // ============================================================
  // P7 — 4-Way Hybrid Retrieval
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 7, TOTAL_SLIDES);
  addTitle(slide, "Not just vector search — 4-way hybrid retrieval");

  const paths = [
    {
      name: "Semantic Similarity",
      color: C.accent,
      items: ["bge-m3 (1024-dim), 100+ languages", "HNSW index, O(log n) query", "Synonyms & cross-lingual"],
    },
    {
      name: "BM25 Keywords",
      color: C.worldGreen,
      items: ["PostgreSQL GIN full-text index", "Exact terms: code names, file paths", "20ms response"],
    },
    {
      name: "Knowledge Graph Traversal",
      color: C.expPurple,
      items: ["470K entity links + 35K semantic links", "Co-occurrence: 'FastAPI' → 'Express'", "Discover hidden connections"],
    },
    {
      name: "Temporal Search",
      color: C.obsGold,
      items: ["48K temporal links", '"Decisions this week" / "March 2024"', "Time-decay weighting"],
    },
  ];

  paths.forEach((p, i) => {
    const x = 0.3 + i * 2.4;
    addGlowCard(slide, pres, x, 1.15, 2.25, 3.3);

    slide.addText(p.name, {
      x: x + 0.12, y: 1.3, w: 2.0, h: 0.45,
      fontSize: 12, fontFace: "Georgia", color: p.color, bold: true, margin: 0,
    });

    const bulletItems = p.items.map((item, idx) => ({
      text: item,
      options: { bullet: true, breakLine: idx < p.items.length - 1, fontSize: 10, color: C.textSecondary },
    }));
    slide.addText(bulletItems, {
      x: x + 0.12, y: 1.85, w: 2.0, h: 2.4,
      fontFace: "Calibri", margin: 0, valign: "top",
    });
  });

  slide.addText("Final reranking: cross-encoder/ms-marco-MiniLM ensures best results surface first", {
    x: 0.6, y: 4.65, w: 8.8, h: 0.35,
    fontSize: 11, fontFace: "Calibri", color: C.accent, italic: true, align: "center", margin: 0,
  });

  // ============================================================
  // P8 — Memory Types
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 8, TOTAL_SLIDES);
  addTitle(slide, "Bionic memory classification — organized like a human brain");

  const memTypes = [
    { type: "World", color: C.worldGreen, count: "7,546", pct: "89%", desc: "Objective facts", example: '"User majors in Urban Planning" / "Project uses FastAPI"' },
    { type: "Observation", color: C.obsGold, count: "908", pct: "11%", desc: "Auto-inferred patterns", example: '"User often does research on Tuesdays" / "Prefers functional style"' },
    { type: "Experience", color: C.expPurple, count: "2", pct: "<1%", desc: "Participated events", example: '"Debugged the auth module last time"' },
    { type: "Mental Model", color: C.mentalBlue, count: "0", pct: "—", desc: "Complex topic understanding", example: '"This codebase follows hexagonal architecture"' },
  ];

  memTypes.forEach((mt, i) => {
    const y = 1.15 + i * 1.05;
    addGlowCard(slide, pres, 0.4, y, 9.2, 0.92);

    // Color dot
    slide.addShape(pres.shapes.OVAL, {
      x: 0.6, y: y + 0.28, w: 0.35, h: 0.35,
      fill: { color: mt.color },
    });

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
      fontSize: 12, fontFace: "Calibri", color: C.textPrimary, bold: true, margin: 0,
    });

    slide.addText(mt.example, {
      x: 2.7, y: y + 0.45, w: 6.7, h: 0.35,
      fontSize: 10, fontFace: "Calibri", color: C.textSecondary, italic: true, margin: 0,
    });
  });

  slide.addText("Observations are auto-generated by the Consolidation Engine — AI discovers patterns, not you.", {
    x: 0.6, y: 5.0, w: 8.8, h: 0.3,
    fontSize: 11, fontFace: "Calibri", color: C.obsGold, italic: true, align: "center", margin: 0,
  });

  // ============================================================
  // P9 — Memory Evolution Engine
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 9, TOTAL_SLIDES);
  addTitle(slide, "Memories don't pile up — they merge, update, and evolve");

  // Evolution flow
  const evoSteps = [
    { num: "1", text: "New fact enters → compare with existing memories" },
    { num: "2", text: "Duplicate? → Merge, increase confidence" },
    { num: "3", text: "Contradiction? → Keep latest version" },
    { num: "4", text: "Multiple related facts → Auto-infer Observation" },
    { num: "5", text: "Observations refine over time, proof_count++" },
  ];

  evoSteps.forEach((step, i) => {
    const y = 1.2 + i * 0.55;
    slide.addShape(pres.shapes.OVAL, {
      x: 0.6, y: y + 0.05, w: 0.35, h: 0.35,
      fill: { color: C.accent },
    });
    slide.addText(step.num, {
      x: 0.6, y: y + 0.05, w: 0.35, h: 0.35,
      fontSize: 12, fontFace: "Consolas", color: C.bg, bold: true, align: "center", valign: "middle", margin: 0,
    });
    slide.addText(step.text, {
      x: 1.1, y: y, w: 4.0, h: 0.45,
      fontSize: 12, fontFace: "Calibri", color: C.textPrimary, margin: 0, valign: "middle",
    });
  });

  // Real example card
  addGlowCard(slide, pres, 5.4, 1.2, 4.2, 3.8);
  slide.addText("Real Example (life bank)", {
    x: 5.6, y: 1.3, w: 3.8, h: 0.4,
    fontSize: 13, fontFace: "Georgia", color: C.accent, bold: true, margin: 0,
  });

  slide.addText([
    { text: "5 raw facts:\n", options: { bold: true, color: C.textSecondary, fontSize: 10, breakLine: true } },
    { text: '"2024-03-25 attended global urbanization study"\n', options: { fontSize: 9, color: C.textMuted, breakLine: true } },
    { text: '"2024-03-26 global urbanization work"\n', options: { fontSize: 9, color: C.textMuted, breakLine: true } },
    { text: '"2024-04-01 merge urbanization data"\n', options: { fontSize: 9, color: C.textMuted, breakLine: true } },
    { text: "...\n\n", options: { fontSize: 9, color: C.textMuted, breakLine: true } },
    { text: "AI auto-inferred Observation:\n", options: { bold: true, color: C.obsGold, fontSize: 10, breakLine: true } },
    { text: '"User has completed the paddleOCR pipeline work" (proof_count=3)', options: { fontSize: 10, color: C.obsGold, italic: true } },
  ], {
    x: 5.6, y: 1.8, w: 3.8, h: 3.0,
    fontFace: "Calibri", margin: 0, valign: "top",
  });

  slide.addText("Currently 908 Observations, auto-inferred from 7,546 World facts", {
    x: 0.6, y: 5.0, w: 8.8, h: 0.3,
    fontSize: 11, fontFace: "Calibri", color: C.accent, italic: true, align: "center", margin: 0,
  });

  // ============================================================
  // P10 — Three Memory Banks
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 10, TOTAL_SLIDES);
  addTitle(slide, "Three Banks, three dimensions of life");

  const banks = [
    {
      name: "default",
      subtitle: "AI Collaboration Memory",
      color: C.accent,
      count: "2,050 nodes",
      lines: ["Claude Code real-time: decisions, preferences, experience", "541 ChatGPT + Gemini imports", "Top entities: User, Python, BSAS, CIM, CityGML", "Span: 2017-01 to now"],
    },
    {
      name: "life",
      subtitle: "Life Trajectory",
      color: C.obsGold,
      count: "6,361 nodes",
      lines: ["5,490 DayLife daily events", "Span: 2019-08-26 to 2026-03-26 (2,400+ days)", "859 auto-inferred Observations", "Top entities: Research, GhostCity, GitHub, English"],
    },
    {
      name: "docs",
      subtitle: "Technical Notes",
      color: C.mentalBlue,
      count: "45 nodes",
      lines: ["API docs, framework tips, gotcha records", "Accumulated during Claude Code sessions", "Quick lookup for known pitfalls"],
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
      x: x + 0.15, y: 1.65, w: 2.65, h: 0.3,
      fontSize: 11, fontFace: "Calibri", color: C.textSecondary, margin: 0,
    });
    slide.addText(bank.count, {
      x: x + 0.15, y: 2.0, w: 2.65, h: 0.35,
      fontSize: 13, fontFace: "Consolas", color: bank.color, margin: 0,
    });

    const bulletItems = bank.lines.map((line, idx) => ({
      text: line,
      options: { bullet: true, breakLine: idx < bank.lines.length - 1, fontSize: 10, color: C.textSecondary },
    }));
    slide.addText(bulletItems, {
      x: x + 0.15, y: 2.4, w: 2.65, h: 2.4,
      fontFace: "Calibri", margin: 0, valign: "top",
    });
  });

  // ============================================================
  // P11 — AI Chat Import + Tracing
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 11, TOTAL_SLIDES);
  addTitle(slide, "Your 500 AI chats: from graveyard to goldmine");

  // Flow
  slide.addText([
    { text: "ChatGPT ", options: { color: C.worldGreen, bold: true, fontSize: 11, breakLine: false } },
    { text: "→ chatgpt-exporter → JSON\n", options: { color: C.textSecondary, fontSize: 10, breakLine: true } },
    { text: "Gemini  ", options: { color: C.mentalBlue, bold: true, fontSize: 11, breakLine: false } },
    { text: "→ gemini-exporter  → JSON\n", options: { color: C.textSecondary, fontSize: 10, breakLine: true } },
    { text: "                              ↓\n", options: { color: C.textMuted, fontSize: 10, breakLine: true } },
    { text: "              import_ai_chats.py\n", options: { color: C.accent, fontSize: 11, bold: true, breakLine: true } },
    { text: "                              ↓\n", options: { color: C.textMuted, fontSize: 10, breakLine: true } },
    { text: "         MemoMind Knowledge Graph", options: { color: C.accent, fontSize: 11, bold: true } },
  ], {
    x: 0.5, y: 1.1, w: 4.5, h: 2.2,
    fontFace: "Consolas", margin: 0, valign: "top",
  });

  // Screenshots
  const aiTimeline = path.join(DEMOS, "ai-chat-timeline.png");
  const origChat = path.join(DEMOS, "original-chat-modal.png");
  if (fs.existsSync(aiTimeline)) {
    slide.addImage({ path: aiTimeline, x: 5.2, y: 1.1, w: 4.5, h: 2.0,
      sizing: { type: "contain", w: 4.5, h: 2.0 } });
  }
  if (fs.existsSync(origChat)) {
    slide.addImage({ path: origChat, x: 5.2, y: 3.2, w: 4.5, h: 1.8,
      sizing: { type: "contain", w: 4.5, h: 1.8 } });
  }

  // Stats
  addGlowCard(slide, pres, 0.5, 3.5, 4.5, 1.5);
  slide.addText([
    { text: "541 conversations → 2,050 memory nodes → 2,093 entities → 144,426 links\n", options: { fontSize: 11, color: C.accent, bold: true, breakLine: true } },
    { text: "Full traceability: every memory links back to its source conversation\n\n", options: { fontSize: 10, color: C.textSecondary, breakLine: true } },
    { text: "Open-source tools:\n", options: { fontSize: 10, color: C.textSecondary, bold: true, breakLine: true } },
    { text: "github.com/24kchengYe/chatgpt-exporter\n", options: { fontSize: 9, color: C.textMuted, breakLine: true } },
    { text: "github.com/24kchengYe/gemini-exporter", options: { fontSize: 9, color: C.textMuted } },
  ], {
    x: 0.65, y: 3.6, w: 4.2, h: 1.3,
    fontFace: "Calibri", margin: 0, valign: "top",
  });

  // ============================================================
  // P12 — DayLife Integration
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 12, TOTAL_SLIDES);
  addTitle(slide, "From 2019 to 2026 — your AI remembers every day");

  // Screenshots
  const daylifeApp = path.join(DEMOS, "daylife-app.png");
  const daylifeTl = path.join(DEMOS, "daylife-timeline.png");
  if (fs.existsSync(daylifeApp)) {
    slide.addImage({ path: daylifeApp, x: 0.4, y: 1.15, w: 4.4, h: 2.5,
      sizing: { type: "contain", w: 4.4, h: 2.5 } });
  }
  if (fs.existsSync(daylifeTl)) {
    slide.addImage({ path: daylifeTl, x: 5.2, y: 1.15, w: 4.4, h: 2.5,
      sizing: { type: "contain", w: 4.4, h: 2.5 } });
  }

  // Labels
  slide.addText("DayLife — Your daily planner", {
    x: 0.4, y: 3.7, w: 4.4, h: 0.3,
    fontSize: 10, fontFace: "Calibri", color: C.textMuted, align: "center", margin: 0,
  });
  slide.addText("5,490 events → searchable memories", {
    x: 5.2, y: 3.7, w: 4.4, h: 0.3,
    fontSize: 10, fontFace: "Calibri", color: C.textMuted, align: "center", margin: 0,
  });

  // Smart sync features
  addGlowCard(slide, pres, 0.4, 4.05, 9.2, 1.2);
  slide.addText([
    { text: "Smart Sync: ", options: { bold: true, color: C.accent, fontSize: 11 } },
    { text: "Auto-sync daily at 3:00 AM (Windows Task Scheduler) · Marker file tracks last sync date · ", options: { color: C.textSecondary, fontSize: 10 } },
    { text: "PC off for a week? Auto-backfills all missing days on reboot · No duplicates", options: { color: C.textSecondary, fontSize: 10 } },
  ], {
    x: 0.6, y: 4.15, w: 8.8, h: 1.0,
    fontFace: "Calibri", margin: 0, valign: "middle",
  });

  // ============================================================
  // P13 — Dual Search + Infinite Scroll
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 13, TOTAL_SLIDES);
  addTitle(slide, "Keyword instant search + Semantic deep recall");

  // Search comparison table
  const searchHeaders = [
    { text: "", options: { fill: { color: C.tableHeaderBg }, color: C.textMuted, bold: true } },
    { text: "Keyword Search", options: { fill: { color: C.tableHeaderBg }, color: C.worldGreen, bold: true } },
    { text: "Semantic Recall", options: { fill: { color: C.tableHeaderBg }, color: C.expPurple, bold: true } },
  ];

  const searchRows = [
    ["Speed", "20-33ms", "235-430ms"],
    ["How", "PostgreSQL GIN full-text", "bge-m3 vector + HNSW + reranker"],
    ["Best for", "Exact terms: filenames, tech words", 'Fuzzy concepts: "similar project I did"'],
    ["Toggle", "Dashboard one-click switch", ""],
  ];

  const searchTable = [searchHeaders];
  searchRows.forEach((row, ri) => {
    searchTable.push(row.map((cell, ci) => ({
      text: cell,
      options: {
        fill: { color: ri % 2 === 0 ? C.tableRowBg : C.tableRowAlt },
        color: ci === 0 ? C.textMuted : C.textPrimary,
        bold: ci === 0,
        fontSize: 11,
      },
    })));
  });

  slide.addTable(searchTable, {
    x: 0.5, y: 1.2, w: 9.0,
    colW: [1.5, 3.5, 4.0],
    border: { pt: 0.5, color: C.border },
    fontFace: "Calibri",
    rowH: [0.38, 0.38, 0.38, 0.52, 0.38],
  });

  // Infinite scroll
  addGlowCard(slide, pres, 0.5, 3.6, 9.0, 1.5);
  slide.addText("Infinite Scroll", {
    x: 0.7, y: 3.7, w: 2.0, h: 0.4,
    fontSize: 16, fontFace: "Georgia", color: C.accent, bold: true, margin: 0,
  });
  slide.addText([
    { text: "Stream view: ", options: { bold: true, color: C.textPrimary, fontSize: 11 } },
    { text: "50 items per batch, IntersectionObserver triggers loading\n", options: { color: C.textSecondary, fontSize: 10, breakLine: true } },
    { text: "Timeline view: ", options: { bold: true, color: C.textPrimary, fontSize: 11 } },
    { text: "30 days per batch, scroll to load more\n", options: { color: C.textSecondary, fontSize: 10, breakLine: true } },
    { text: "8,000+ memories browsed smoothly", options: { color: C.accent, fontSize: 11, bold: true } },
  ], {
    x: 0.7, y: 4.15, w: 8.5, h: 0.9,
    fontFace: "Calibri", margin: 0, valign: "top",
  });

  // ============================================================
  // P14 — Dashboard Overview
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 14, TOTAL_SLIDES);
  addTitle(slide, "Your memories at a glance");

  // 2x2 screenshots
  const screenshots = [
    { file: "dashboard-overview.png", label: "Dashboard Overview", x: 0.3, y: 1.15 },
    { file: "graph-view.png", label: "Knowledge Graph (WebGL)", x: 5.15, y: 1.15 },
    { file: "ai-chat-timeline.png", label: "Timeline View", x: 0.3, y: 3.1 },
    { file: "original-chat-modal.png", label: "Original Chat Tracing", x: 5.15, y: 3.1 },
  ];

  screenshots.forEach((ss) => {
    const ssPath = path.join(DEMOS, ss.file);
    if (fs.existsSync(ssPath)) {
      slide.addImage({
        path: ssPath,
        x: ss.x, y: ss.y, w: 4.6, h: 1.7,
        sizing: { type: "contain", w: 4.6, h: 1.7 },
      });
    }
    slide.addText(ss.label, {
      x: ss.x, y: ss.y + 1.72, w: 4.6, h: 0.25,
      fontSize: 9, fontFace: "Calibri", color: C.textMuted, align: "center", margin: 0,
    });
  });

  slide.addText("Dark/Light theme · Type filter · Time filter · Recency boost · Privacy flags · JSON export · Bank management", {
    x: 0.3, y: 5.15, w: 9.4, h: 0.3,
    fontSize: 9, fontFace: "Calibri", color: C.textMuted, align: "center", margin: 0,
  });

  // ============================================================
  // P15 — Competitor Comparison (expanded with deep research)
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 15, TOTAL_SLIDES);
  addTitle(slide, "How It Compares — The Full Landscape");

  const compHeaders2 = ["", "MemoMind", "Mem0", "Graphiti/Zep", "Letta", "Cognee", "Hindsight"].map((h, i) => ({
    text: h,
    options: { fill: { color: C.tableHeaderBg }, color: i === 1 ? C.accent : C.textSecondary, bold: true, fontSize: 7 },
  }));

  const compData2 = [
    ["GitHub Stars",  "—",           "51.2K",         "24.3K / 4.3K",   "21.8K",         "14.7K",       "6.5K"],
    ["Funding",       "Self-funded",  "$24M (YC)",     "—",              "$10M",          "$7.5M",       "$3.5M"],
    ["Architecture",  "KG + pgvector","Vector + Graph", "Temporal KG",   "OS 3-tier",     "ECL + KG",    "4-network"],
    ["Retrieval",     "4-way hybrid", "Semantic + graph","Sem+BM25+graph","Agent-driven",  "14 modes",    "4 parallel"],
    ["Knowledge Graph","pgvector + EL","Pro only $249", "Core (Neo4j)",  "No",            "Yes (all)",   "Yes"],
    ["Temporal Model","Yes (native)", "No",            "Yes (bi-temp)",  "No",            "Partial",     "Yes"],
    ["Deployment",    "100% local",   "Cloud / OSS",   "Cloud / OSS",   "Cloud / OSS",   "Local / Cloud","Local"],
    ["Privacy",       "Never leaves", "Cloud default",  "Cloud / BYOC",  "Self-host opt", "Local default","Local"],
    ["GPU Accel",     "Local CUDA",   "No",            "No",            "No",            "No",          "No"],
    ["Chat Tracing",  "Full trace",   "No",            "No",            "No",            "No",          "No"],
    ["Life Data",     "DayLife",      "No",            "No",            "No",            "No",          "No"],
    ["LongMemEval",   "—",           "49.0%",         "—",             "—",             "—",           "91.4%"],
    ["Cost",          "$0.01/day",    "Free~$249/mo",  "Free~$475/mo",  "Free~$200/mo",  "Free~$200/mo","Free (OSS)"],
    ["License",       "MIT",          "Apache-2.0",    "Apache-2.0",    "Apache-2.0",    "Apache-2.0",  "MIT"],
  ];

  const compTable2 = [compHeaders2];
  compData2.forEach((row, ri) => {
    compTable2.push(row.map((cell, ci) => ({
      text: cell,
      options: {
        fill: { color: ri % 2 === 0 ? C.tableRowBg : C.tableRowAlt },
        color: ci === 1 ? C.accent : (ci === 0 ? C.textMuted : C.textPrimary),
        bold: ci <= 1,
        fontSize: 6.5,
      },
    })));
  });

  slide.addTable(compTable2, {
    x: 0.15, y: 1.05, w: 9.7,
    colW: [1.05, 1.25, 1.25, 1.25, 1.15, 1.15, 1.15],
    border: { pt: 0.4, color: C.border },
    fontFace: "Calibri",
    rowH: [0.26, 0.26, 0.26, 0.26, 0.26, 0.26, 0.26, 0.26, 0.26, 0.26, 0.26, 0.26, 0.26, 0.26, 0.26],
  });

  slide.addText("Also evaluated: MemOS (7.9K stars), Memvid (13.6K), LangMem (1.4K, 59s P95 latency), MemoryLake (closed-source enterprise)", {
    x: 0.2, y: 5.0, w: 9.6, h: 0.25,
    fontSize: 8, fontFace: "Calibri", color: C.textMuted, align: "center", margin: 0,
  });

  // ============================================================
  // P15b — Key Competitive Insights
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 16, TOTAL_SLIDES);
  addTitle(slide, "Key Competitive Insights");

  const insights = [
    {
      title: "Mem0: Popular but shallow",
      text: "51K stars, $24M raised, AWS exclusive memory provider.\nBut: graph features paywalled ($249/mo), no temporal model,\nindependent LongMemEval accuracy only 49.0%.",
      color: C.red,
    },
    {
      title: "Graphiti/Zep: Best temporal model",
      text: "Bi-temporal tracking (event time + ingestion time), hybrid retrieval.\nBut: requires Neo4j infra, Zep cloud-only for full platform,\ncredit-based pricing confusing ($475/mo for moderate use).",
      color: C.expPurple,
    },
    {
      title: "Hindsight: Highest benchmark accuracy",
      text: "91.4% on LongMemEval (vs Mem0's 49%). Four-network architecture\n(world/experience/entity/belief) mirrors MemoMind's memory types.\nBut: young project (6.5K stars), less production-proven.",
      color: C.obsGold,
    },
    {
      title: "MemoMind's unique position",
      text: "Only system combining: 100% local + GPU-accelerated + knowledge graph\n+ 4-way retrieval + AI chat tracing + life data integration + MCP native.\nNo competitor covers all six. Cost: $0.30/month vs $99-475/month.",
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
      fontSize: 13, fontFace: "Georgia", color: ins.color, bold: true, margin: 0,
    });
    slide.addText(ins.text, {
      x: x + 0.15, y: y + 0.55, w: 4.2, h: 1.25,
      fontSize: 10, fontFace: "Calibri", color: C.textSecondary, margin: 0, valign: "top",
    });
  });

  // ============================================================
  // P17 — Technical Highlights
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 17, TOTAL_SLIDES);
  addTitle(slide, "Technical Deep Dive");

  const techCards = [
    { title: "Knowledge Graph, Not Flat Storage", desc: "556,672 links: entity (85%) + temporal (9%) + semantic (6%). Entity co-occurrence reasoning discovers hidden connections.", color: C.accent },
    { title: "Fact Extraction Engine", desc: "gpt-4o-mini auto-extracts entities, relations, time, categories. Async queue — never blocks conversations.", color: C.worldGreen },
    { title: "Consolidation Engine", desc: "Auto-merge duplicates, infer Observations. 908 Observations from 7,546 World facts. Configurable mission control.", color: C.obsGold },
    { title: "Local Embeddings", desc: "bge-m3: 1024-dim, 100+ languages. RTX 3070 CUDA, 50ms/item. Zero API calls, zero latency, zero cost.", color: C.expPurple },
    { title: "Time-Aware Memory", desc: "Every memory has occurred_start/end. Engine patches auto-fallback to event date. Supports temporal range queries.", color: C.mentalBlue },
    { title: "Original Chat Tracing", desc: "Engine patch saves original_document_id on retain. Dashboard: chunk_id → doc hash → index.json → .md file.", color: C.red },
  ];

  techCards.forEach((tc, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.35 + col * 3.15;
    const y = 1.15 + row * 2.15;

    addGlowCard(slide, pres, x, y, 2.95, 1.95);
    slide.addText(tc.title, {
      x: x + 0.15, y: y + 0.1, w: 2.65, h: 0.45,
      fontSize: 12, fontFace: "Georgia", color: tc.color, bold: true, margin: 0,
    });
    slide.addText(tc.desc, {
      x: x + 0.15, y: y + 0.6, w: 2.65, h: 1.2,
      fontSize: 10, fontFace: "Calibri", color: C.textSecondary, margin: 0, valign: "top",
    });
  });

  // ============================================================
  // P18 — Cost & Resources
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 18, TOTAL_SLIDES);
  addTitle(slide, "Less than $0.01 per day");

  const costHeaders = ["Component", "Resource Usage", "Cost"].map(h => ({
    text: h, options: { fill: { color: C.tableHeaderBg }, color: C.textSecondary, bold: true, fontSize: 12 },
  }));

  const costRows = [
    ["LLM extraction (gpt-4o-mini via OpenRouter)", "~100 calls/day", "~$0.01/day"],
    ["Embedding model (bge-m3 local CUDA)", "~500MB VRAM transient", "$0"],
    ["Reranker (ms-marco-MiniLM local)", "~200MB VRAM transient", "$0"],
    ["Storage (PostgreSQL)", "484MB disk", "$0"],
    ["Service process", "~2GB RAM", "$0"],
  ];

  const costTable = [costHeaders];
  costRows.forEach((row, ri) => {
    costTable.push(row.map((cell, ci) => ({
      text: cell,
      options: {
        fill: { color: ri % 2 === 0 ? C.tableRowBg : C.tableRowAlt },
        color: ci === 2 ? C.accent : C.textPrimary,
        bold: ci === 2,
        fontSize: 11,
      },
    })));
  });

  slide.addTable(costTable, {
    x: 0.5, y: 1.2, w: 9.0,
    colW: [4.0, 2.5, 2.5],
    border: { pt: 0.5, color: C.border },
    fontFace: "Calibri",
    rowH: [0.4, 0.4, 0.4, 0.4, 0.4, 0.4],
  });

  // Comparison
  addGlowCard(slide, pres, 0.5, 3.8, 9.0, 1.4);
  slide.addText("Cost Comparison", {
    x: 0.7, y: 3.9, w: 3.0, h: 0.4,
    fontSize: 14, fontFace: "Georgia", color: C.accent, bold: true, margin: 0,
  });
  slide.addText([
    { text: "MemoryLake: ", options: { bold: true, color: C.textPrimary, fontSize: 12 } },
    { text: "Enterprise pricing, undisclosed\n", options: { color: C.textSecondary, fontSize: 11, breakLine: true } },
    { text: "Mem0 Pro: ", options: { bold: true, color: C.textPrimary, fontSize: 12 } },
    { text: "$99/month+\n", options: { color: C.textSecondary, fontSize: 11, breakLine: true } },
    { text: "MemoMind: ", options: { bold: true, color: C.accent, fontSize: 13 } },
    { text: "$0.30/month, everything local", options: { color: C.accent, fontSize: 12, bold: true } },
  ], {
    x: 0.7, y: 4.3, w: 8.5, h: 0.8,
    fontFace: "Calibri", margin: 0, valign: "top",
  });

  // ============================================================
  // P19 — Results
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 19, TOTAL_SLIDES);
  addTitle(slide, "Real Numbers, Real Usage");

  const stats = [
    ["Total memory nodes", "8,456"],
    ["Knowledge links", "556,672"],
    ["Named entities", "4,666"],
    ["AI chat imports", "541 (ChatGPT 115 + Gemini 426)"],
    ["Life events imported", "5,490 (2019-08 to 2026-03)"],
    ["Auto-inferred Observations", "908"],
    ["Time span covered", "2017-01 to present (9 years)"],
    ["Database size", "484 MB"],
    ["Daily LLM cost", "< $0.01"],
    ["Keyword search latency", "20-33ms"],
    ["Semantic recall latency", "235-430ms"],
  ];

  stats.forEach((stat, i) => {
    const col = i < 6 ? 0 : 1;
    const row = i < 6 ? i : i - 6;
    const x = 0.4 + col * 4.8;
    const y = 1.15 + row * 0.7;

    slide.addText(stat[0], {
      x: x, y, w: 2.8, h: 0.35,
      fontSize: 11, fontFace: "Calibri", color: C.textSecondary, margin: 0, align: "right",
    });
    slide.addText(stat[1], {
      x: x + 2.9, y, w: 1.8, h: 0.35,
      fontSize: 12, fontFace: "Consolas", color: C.accent, bold: true, margin: 0,
    });

    // Subtle line
    slide.addShape(pres.shapes.LINE, {
      x: x, y: y + 0.38, w: 4.5, h: 0,
      line: { color: C.border, width: 0.5 },
    });
  });

  slide.addText("This is not a lab demo — it's a production system used every day.", {
    x: 0, y: 4.9, w: 10, h: 0.4,
    fontSize: 13, fontFace: "Calibri", color: C.accent, bold: true, align: "center", margin: 0,
  });

  // ============================================================
  // P20 — Core Philosophy
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 20, TOTAL_SLIDES);
  addTitle(slide, "Memory is the new moat");

  const philosophies = [
    {
      title: "Models commoditize, memory doesn't",
      text: "GPT-5 is 97% cheaper than GPT-4. Models depreciate.\nBut your 8,000+ memories, 500+ entity relationships, 9-year life trajectory —\nno model swap can replicate that.",
      color: C.accent,
    },
    {
      title: "Data is portable, no lock-in",
      text: "Open JSON export with all memories, entities, tags, relations, sources.\nWeekly auto-backup to GitHub.\nBetter system tomorrow? Take everything with you.",
      color: C.worldGreen,
    },
    {
      title: "Digital twin — more valuable over time",
      text: "Start accumulating today.\nYour AI knows you better tomorrow than today, better next year than tomorrow.\nThat's compound interest.",
      color: C.expPurple,
    },
  ];

  philosophies.forEach((ph, i) => {
    const y = 1.15 + i * 1.45;
    addGlowCard(slide, pres, 0.5, y, 9.0, 1.3);

    slide.addText(ph.title, {
      x: 0.7, y: y + 0.1, w: 8.5, h: 0.4,
      fontSize: 15, fontFace: "Georgia", color: ph.color, bold: true, margin: 0,
    });
    slide.addText(ph.text, {
      x: 0.7, y: y + 0.5, w: 8.5, h: 0.7,
      fontSize: 11, fontFace: "Calibri", color: C.textSecondary, margin: 0, valign: "top",
    });
  });

  // ============================================================
  // P21 — Roadmap
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 21, TOTAL_SLIDES);
  addTitle(slide, "What's Next");

  // Completed items
  slide.addText("Completed", {
    x: 0.6, y: 1.15, w: 4.0, h: 0.4,
    fontSize: 14, fontFace: "Georgia", color: C.textMuted, bold: true, margin: 0,
  });

  const done = [
    "Core engine: retain / recall / reflect",
    "4-way hybrid retrieval + GPU acceleration",
    "AI chat import + original chat tracing",
    "DayLife life trajectory integration",
    "Web Dashboard (Stream / Graph / Timeline)",
    "Weekly auto-backup",
    "Windows native support (no WSL needed)",
  ];

  const doneParts = done.map((item, i) => ({
    text: "  " + item,
    options: { bullet: true, breakLine: i < done.length - 1, fontSize: 11, color: C.textMuted },
  }));
  slide.addText(doneParts, {
    x: 0.6, y: 1.6, w: 4.2, h: 3.2,
    fontFace: "Calibri", margin: 0, valign: "top",
  });

  // Next steps
  slide.addText("Next Up", {
    x: 5.2, y: 1.15, w: 4.0, h: 0.4,
    fontSize: 14, fontFace: "Georgia", color: C.accent, bold: true, margin: 0,
  });

  const next = [
    "Memory conflict detection & versioning",
    "Multi-hop graph reasoning (2-3 hops)",
    "Memory decay mechanism (time-weighted archival)",
    "Docker install — one-command deployment",
    "More MCP clients: Cursor, Windsurf, etc.",
  ];

  const nextParts = next.map((item, i) => ({
    text: "  " + item,
    options: { bullet: true, breakLine: i < next.length - 1, fontSize: 11, color: C.accent },
  }));
  slide.addText(nextParts, {
    x: 5.2, y: 1.6, w: 4.5, h: 3.2,
    fontFace: "Calibri", margin: 0, valign: "top",
  });

  // Divider line
  slide.addShape(pres.shapes.LINE, {
    x: 5.0, y: 1.15, w: 0, h: 3.8,
    line: { color: C.border, width: 1 },
  });

  // ============================================================
  // P22 — Quick Start
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });
  addSlideNumber(slide, 22, TOTAL_SLIDES);
  addTitle(slide, "5 minutes: from amnesia to memory");

  addGlowCard(slide, pres, 0.4, 1.15, 9.2, 3.9);

  const codeLines = [
    "# 1. Clone",
    "git clone https://github.com/24kchengYe/MemoMind.git",
    "",
    "# 2. Install — choose your platform:",
    "#    Windows: python -m venv memomind-env && pip install hindsight-api-slim",
    "#    Linux/WSL: sudo bash install.sh",
    "",
    "# 3. Configure LLM API key in serve.py",
    "",
    "# 4. Register MCP",
    "#    Windows: claude mcp add memomind -- python.exe mcp_stdio.py",
    "#    Linux:   claude mcp add memomind -- /opt/.../mcp_stdio.py",
    "",
    "# 5. Start chatting — AI auto-retains and recalls",
  ];

  slide.addText(codeLines.join("\n"), {
    x: 0.7, y: 1.35, w: 8.6, h: 3.5,
    fontSize: 10, fontFace: "Consolas", color: C.worldGreen, margin: 0.1, valign: "top",
  });

  slide.addText("GitHub: github.com/24kchengYe/MemoMind  ·  MIT License", {
    x: 0, y: 5.1, w: 10, h: 0.3,
    fontSize: 11, fontFace: "Consolas", color: C.textMuted, align: "center", margin: 0,
  });

  // ============================================================
  // P23 — Closing
  // ============================================================
  slide = pres.addSlide({ masterName: "DARK_BG" });

  // Background
  if (fs.existsSync(graphPath)) {
    slide.addImage({
      path: graphPath,
      x: 0, y: 0, w: 10, h: 5.625,
      transparency: 80,
    });
  }

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 5.625,
    fill: { color: C.bg, transparency: 25 },
  });

  // Glow
  slide.addShape(pres.shapes.OVAL, {
    x: 3, y: 1.0, w: 4, h: 3,
    fill: { color: C.accent, transparency: 90 },
  });

  slide.addText("Start building your digital twin's memory today.", {
    x: 0, y: 1.5, w: 10, h: 0.8,
    fontSize: 26, fontFace: "Georgia", color: C.white, bold: true,
    align: "center", margin: 0,
  });

  slide.addText("今天开始培养你的数字分身。", {
    x: 0, y: 2.3, w: 10, h: 0.6,
    fontSize: 18, fontFace: "Calibri", color: C.accent,
    align: "center", margin: 0, italic: true,
  });

  const links = [
    "GitHub: github.com/24kchengYe/MemoMind",
    "Dashboard: 127.0.0.1:9999",
    "chatgpt-exporter: github.com/24kchengYe/chatgpt-exporter",
    "gemini-exporter: github.com/24kchengYe/gemini-exporter",
  ];

  slide.addText(links.join("\n"), {
    x: 0, y: 3.3, w: 10, h: 1.5,
    fontSize: 11, fontFace: "Consolas", color: C.textMuted,
    align: "center", margin: 0, paraSpaceAfter: 6,
  });

  addSlideNumber(slide, 23, TOTAL_SLIDES);

  // ============================================================
  // Write file
  // ============================================================
  const outPath = path.join(__dirname, "MemoMind-Presentation.pptx");
  await pres.writeFile({ fileName: outPath });
  console.log(`Presentation saved to: ${outPath}`);
}

buildPresentation().catch(err => {
  console.error("Error building presentation:", err);
  process.exit(1);
});
