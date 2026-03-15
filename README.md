<div align="center">

![Visitors](https://visitor-badge.laobi.icu/badge?page_id=24kchengYe.MemoMind)

# 🧠 MemoMind

**Give your AI agent a brain that remembers.**

*A fully local, GPU-accelerated memory system for Claude Code and AI coding assistants.*

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-WSL2%20%2B%20Ubuntu-orange)](https://learn.microsoft.com/en-us/windows/wsl/)
[![PostgreSQL](https://img.shields.io/badge/Storage-PostgreSQL%20%2B%20pgvector-336791)](https://github.com/pgvector/pgvector)
[![MCP](https://img.shields.io/badge/Protocol-MCP%20(stdio)-blue)](https://modelcontextprotocol.io/)
[![CUDA](https://img.shields.io/badge/GPU-CUDA%20Accelerated-76b900)](https://developer.nvidia.com/cuda-toolkit)
[![Dashboard](https://img.shields.io/badge/Dashboard-http%3A%2F%2F127.0.0.1%3A9999-ff69b4)](http://127.0.0.1:9999)

[English](#the-problem) | [中文](#问题)

</div>

---

## The Problem

You've been there. Every developer who uses AI coding assistants has been there.

- You spend **20 minutes** explaining your project's architecture — then the session ends. Tomorrow? It's a stranger again.
- You tell it "I prefer functional style" for the **fifth time this week**. It still writes classes.
- You made an important decision last Tuesday — FastAPI over Express. The AI has **zero memory** of it.
- Your coding conventions, your team's naming rules, your deployment pipeline — all gone. **Every. Single. Session.**

The most powerful AI in the world has the memory of a goldfish.

## The Solution

MemoMind gives your AI **persistent, local, intelligent memory**. It doesn't just store text — it builds a **knowledge graph** of everything it learns about you, your projects, and your preferences.

| | Without MemoMind | With MemoMind |
|---|---|---|
| **Session start** | Blank slate, zero context | Recalls your preferences, past decisions, project context |
| **Repeated explanations** | Every session, from scratch | Learned once, remembered forever |
| **Decision tracking** | Lost when chat window closes | Stored as structured facts in a knowledge graph |
| **Coding style** | Random defaults | Adapts to your established patterns |
| **Cross-session reasoning** | Impossible | `reflect` synthesizes insights across all memories |
| **Privacy** | Often cloud-based | 100% local — nothing leaves your machine |

```
You: "Let's use FastAPI instead of Express for this project"

Claude Code internally:
  → retain("Project migrating from Express to FastAPI")  # auto-stores

Next week, new session:
  → recall("project tech stack")                          # auto-retrieves
  → "Based on your previous decision, I'll use FastAPI..."
```

You don't do anything — the AI handles it all.

---

### 🎬 Demo

<div align="center">
<img src="docs/demos/dashboard.gif" width="720" alt="MemoMind Dashboard Demo"/>
</div>

---

## Architecture

```
Claude Code ──MCP (stdio)──→ WSL2
                                │
                   ┌────────────┴────────────┐
                   │     MemoMind Server      │
                   ├─────────────────────────┤
                   │  PostgreSQL + pgvector   │ ← structured memories
                   │  BAAI/bge-small (CUDA)   │ ← local embeddings
                   │  cross-encoder (CUDA)    │ ← local reranking
                   │  OpenRouter (qwen3.5-9b) │ ← fact extraction
                   └─────────────────────────┘
                              │
                   All data stays on your machine
```

## Three Core Operations

| Operation | What It Does | When AI Calls It |
|-----------|-------------|------------------|
| **retain** | Extract facts from conversation, store in vector DB | After learning something new about you |
| **recall** | 4-way hybrid search (semantic + BM25 + graph + temporal) | Before responding, to check relevant history |
| **reflect** | Deep reasoning across all memories | For complex questions requiring synthesis |

## Memory Types

MemoMind organizes knowledge into four biomimetic memory pathways — modeled after how human memory actually works:

| Type | What It Captures | Example | How It's Used |
|------|-----------------|---------|---------------|
| **World** | Objective facts about the user and environment | "User prefers Python over R" | Shapes recommendations and defaults |
| **Experience** | Events the agent participated in | "Last session we debugged the auth module" | Provides continuity across sessions |
| **Observation** | Patterns auto-synthesized from behavior | "User consistently uses functional style" | Refines understanding over time |
| **Mental Model** | Learned understanding of complex topics | "This codebase follows hexagonal architecture with ports and adapters" | Enables deeper reasoning about project context |

> Unlike flat key-value stores, these types form a **knowledge graph** — entities are linked by relationships, creating retrieval pathways that go far beyond simple keyword matching.

## Use Cases

MemoMind isn't just for remembering preferences. Here are some ways it makes your AI smarter:

- **Coding assistant** — Remembers your project architecture, coding style, naming conventions, and tech stack decisions across sessions
- **Project management** — Tracks decisions, deadlines, and blockers; reflects on project risks by synthesizing across all stored context
- **Code review** — Recalls past review feedback patterns; knows which areas of the codebase are fragile
- **Debugging** — Remembers what was tried before, what worked, what didn't — no more repeating failed approaches
- **Team onboarding** — New team member's AI instantly inherits the project's accumulated knowledge

## Key Features

- **100% local** — PostgreSQL + embedding models in WSL2, nothing leaves your machine
- **Zero manual effort** — AI autonomously decides what to remember and recall
- **GPU-accelerated** — uses your NVIDIA GPU for fast local embeddings and reranking
- **Dirt cheap** — fact extraction via OpenRouter costs < $0.01/day
- **4-way hybrid retrieval** — semantic similarity + BM25 keyword + knowledge graph + temporal search
- **Reflect capability** — AI can reason across all memories, not just retrieve
- **Mental models** — builds evolving understanding of complex topics, not just isolated facts
- **Metadata & filtering** — tag memories with custom metadata for per-project or per-user isolation
- **Multi-provider LLM** — works with OpenAI, Anthropic, Gemini, Groq, Ollama, LM Studio, and any OpenAI-compatible API via OpenRouter
- **Web Dashboard** — browse and search all memories visually at `http://127.0.0.1:9999`
- **Auto-start** — systemd service + Windows startup script, works after reboot

## How It Compares

| Feature | MemoMind | Memori | Mem0 | Claude Code built-in |
|---------|----------|--------|------|---------------------|
| Privacy | 100% local | Cloud required | Configurable | Local files |
| Memory type | Facts + knowledge graph + mental models | 8 categories | Flat facts | Markdown notes |
| Retrieval | 4-way hybrid (semantic + BM25 + graph + temporal) | Semantic + BM25 | Semantic only | Full file load |
| Auto-extract | LLM-powered | LLM-powered | LLM-powered | Manual |
| Reflect/reason | Yes — cross-memory synthesis | No | No | No |
| Mental models | Yes — evolving topic understanding | No | No | No |
| Multi-provider LLM | OpenAI, Anthropic, Gemini, Groq, Ollama, etc. | Limited | OpenAI | N/A |
| Metadata filtering | Per-user / per-project isolation | Limited | Yes | No |
| Cost | ~$0.01/day | Free tier limited | Free tier limited | Free |

## MemoMind + Recall: Two Sides of the Same Coin

AI memory has two audiences — the machine and the human. MemoMind and [Recall](https://github.com/24kchengYe/Recall) cover both:

| | MemoMind | [Recall](https://github.com/24kchengYe/Recall) |
|---|---|---|
| **Memory for** | The AI | The human |
| **Purpose** | AI remembers your preferences, decisions, context | You browse, search, and manage conversation history |
| **Format** | Structured facts + knowledge graph + vectors | Full conversation archives (human-readable JSONL) |
| **Interaction** | AI autonomously calls `retain` / `recall` / `reflect` | You manually run `/recall save` / `/recall search` / `/recall load` |
| **Storage** | PostgreSQL + pgvector (WSL) | Files + SQLite index (Windows) |
| **Key value** | AI gets smarter over time | You never lose a conversation |

**They're complementary.** Recall preserves the *full context* so you can review what happened. MemoMind distills the *essential knowledge* so the AI can act on it. Use both together for the complete experience.

---

## Quick Start

### Prerequisites

- Windows 10/11 with WSL2 + Ubuntu
- NVIDIA GPU (optional but recommended for local embeddings)
- [OpenRouter](https://openrouter.ai/) API key (free tier works, ~$0.01/day)

### Installation

**Step 1 — Clone and install**

```bash
git clone https://github.com/24kchengYe/MemoMind.git
cd MemoMind
wsl -d Ubuntu
sudo bash install.sh
```

**Step 2 — Configure your API key**

```bash
cp serve.py.template /opt/memomind-env/serve.py
nano /opt/memomind-env/serve.py  # Add your OpenRouter key
```

**Step 3 — Start the service**

```bash
sudo systemctl start memomind
```

**Step 4 — Register MCP in Claude Code**

```bash
# stdio mode (recommended, no port forwarding needed)
claude mcp add --scope user --transport stdio memomind \
  -- wsl -d Ubuntu -u hindsight -e /opt/memomind-env/bin/python3 /opt/memomind-env/mcp_stdio.py
```

<details>
<summary>Alternative: SSE mode</summary>

```bash
powershell -ExecutionPolicy Bypass -File update-portproxy.ps1
claude mcp add --scope user --transport sse memomind "http://127.0.0.1:8888/mcp/"
```

</details>

**Step 5 — (Optional) Auto-start on boot**

```bash
cp keep-wsl-alive.vbs "$APPDATA/Microsoft/Windows/Start Menu/Programs/Startup/"
```

### Verify

```bash
# Check service status
wsl -d Ubuntu -e systemctl status memomind

# Test health endpoint
wsl -d Ubuntu -e bash -c "curl -s http://localhost:8888/health"
# → {"status":"healthy","database":"connected"}

# Test memory via CLI
wsl -d Ubuntu -u hindsight -- /opt/memomind-env/memomind-cli.sh memory retain default "User prefers Python"
wsl -d Ubuntu -u hindsight -- /opt/memomind-env/memomind-cli.sh memory recall default "What language does user prefer?"
```

## Supported LLM Providers

The LLM is only used for fact extraction (not for chatting). MemoMind supports any OpenAI-compatible API. Two deployment modes:

### Mode A: China Direct (no proxy needed) — Recommended for China users

Use a domestic OpenAI-compatible API gateway. No VPN, no proxy, no extra configuration:

| Provider | Base URL | Recommended Model | Notes |
|----------|---------|-------------------|-------|
| **[MindCraft](https://www.mindcraft.com.cn/)** | `https://api.mindcraft.com.cn/v1` | `deepseek-chat`, `qwen-flash` | 200+ models, pay-per-use |
| **[DeepSeek](https://platform.deepseek.com/)** | `https://api.deepseek.com/v1` | `deepseek-chat` | Official DeepSeek API |
| **[SiliconFlow](https://siliconflow.cn/)** | `https://api.siliconflow.cn/v1` | Various open-source models | Free tier available |

```python
# In serve.py — just set these three lines:
LLM_API_KEY = "your-api-key"
LLM_BASE_URL = "https://api.mindcraft.com.cn/v1"
LLM_MODEL = "deepseek-chat"
NEEDS_PROXY = False  # No proxy needed
```

### Mode B: International APIs (proxy required)

For OpenRouter, OpenAI, Anthropic, etc. Requires a proxy bridge (`proxy-bridge.py`) to route WSL traffic through your Windows proxy:

| Provider | Base URL | Recommended Model |
|----------|---------|-------------------|
| **[OpenRouter](https://openrouter.ai/)** | `https://openrouter.ai/api/v1` | `qwen/qwen3.5-9b` ($0.05/1M tokens) |
| **OpenAI** | `https://api.openai.com/v1` | `gpt-4.1-nano` |
| **Groq** | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` (ultra-fast) |

```python
# In serve.py:
LLM_API_KEY = "sk-..."
LLM_BASE_URL = "https://openrouter.ai/api/v1"
LLM_MODEL = "qwen/qwen3.5-9b"
NEEDS_PROXY = True  # Routes through proxy-bridge.py → Clash
```

<details>
<summary>Proxy bridge setup (for Mode B only)</summary>

MemoMind includes `proxy-bridge.py` — a lightweight TCP forwarder that runs on Windows and bridges WSL to your local proxy (e.g., Clash):

```bash
# Start the bridge (binds 0.0.0.0:12080 → 127.0.0.1:2080)
pythonw proxy-bridge.py

# WSL can now reach your proxy via {Windows_IP}:12080
# This is automatically configured in serve.py when NEEDS_PROXY = True
```

The bridge is added to Windows startup automatically by `keep-wsl-alive.vbs`.

</details>

### Also supported (any OpenAI-compatible API)

Anthropic, Google Gemini, Ollama (fully local), LM Studio — set `llm_provider` accordingly in `serve.py`.

## Resource Usage

| Component | Idle | Active |
|-----------|------|--------|
| WSL2 + PostgreSQL | ~200MB RAM | ~200MB RAM |
| MemoMind Server | ~600MB RAM | ~800MB RAM |
| GPU (embeddings) | 0 | ~500MB VRAM (burst) |
| Disk (WSL vhdx) | ~14GB | Grows with memories |
| Network | 0 | OpenRouter API calls on retain |

## Troubleshooting

<details>
<summary><b>MCP not connecting</b></summary>

```bash
wsl -d Ubuntu -e systemctl status memomind  # Check service
wsl -d Ubuntu -e ss -tlnp | grep 8888       # Check port
```

</details>

<details>
<summary><b>WSL shuts down automatically</b></summary>

- Ensure `keep-wsl-alive.vbs` is in your Windows Startup folder
- Or: `wsl -d Ubuntu -e bash -c "sleep infinity" &`

</details>

<details>
<summary><b>Models fail to download</b></summary>

```bash
export HF_ENDPOINT=https://hf-mirror.com  # Use China mirror
```

</details>

<details>
<summary><b>China users</b></summary>

- Embedding models download from `hf-mirror.com` automatically — no VPN needed
- OpenRouter works without proxy for most models (avoid Google Gemini series)

</details>

## Roadmap

- [x] Core memory engine (retain / recall / reflect)
- [x] PostgreSQL + pgvector storage
- [x] Local GPU-accelerated embeddings (BAAI/bge-small)
- [x] Cross-encoder reranking
- [x] MCP stdio transport
- [x] Multi-provider LLM support (OpenAI, Anthropic, Gemini, Groq, Ollama, etc.)
- [x] Mental models — evolving topic understanding
- [x] Metadata filtering and per-user memory isolation
- [x] Web dashboard with memory stream, search, and graph view
- [x] Auto-start on boot (systemd + VBS)
- [ ] Memory import/export (JSON backup)
- [ ] Multi-agent memory sharing
- [ ] Automatic memory consolidation and pruning
- [ ] Support for more MCP clients (Cursor, Windsurf, etc.)
- [ ] Docker-based installation (no WSL dependency)

## Changelog

- **v1.2** (2026-03-15): Dashboard redesign (glassmorphism, memory cards, graph zoom/pan/tooltips, delete, animated counters, mobile responsive); README rewrite with demo GIF; dual LLM mode (China direct via MindCraft / international via proxy bridge); service renamed hindsight → memomind; retain speed 50s → 13s
- **v1.1** (2026-03-12): Web dashboard for visual memory browsing; auto-start on boot; MCP stdio transport
- **v1.0** (2026-03-09): Initial release — retain/recall/reflect, PostgreSQL + pgvector, GPU-accelerated embeddings, cross-encoder reranking

## Credits

- Core memory engine powered by [Hindsight](https://github.com/vectorize-io/hindsight) (MIT)
- LLM routing via [OpenRouter](https://openrouter.ai/)
- China mirror by [hf-mirror.com](https://hf-mirror.com/)

## Contributors

<a href="https://github.com/24kchengYe">
  <img src="https://github.com/24kchengYe.png" width="60" style="border-radius:50%" alt="zyc"/>
  <br/><sub><b>zyc</b></sub>
</a>

## License

MIT

---

<div align="center">

# 🧠 MemoMind 中文文档

**给你的 AI 助手一个会记忆的大脑。**

</div>

## 问题

每个用 AI 编程助手的开发者都经历过——

- 你花 **20 分钟** 解释项目架构，会话结束后 AI 全忘了。明天？它又是一个陌生人。
- 你第 **五次** 告诉它"我喜欢函数式风格"，它依然写 class。
- 上周二你做了一个重要决策——用 FastAPI 而不是 Express。AI 对此 **毫无记忆**。
- 你的编码规范、团队命名规则、部署流水线——**每次会话都从零开始**。

最强大的 AI，却只有金鱼的记忆力。

## 解决方案

MemoMind 赋予你的 AI **持久、本地、智能的记忆**。它不仅仅存储文本——而是构建一个**知识图谱**，记录关于你、你的项目和你的偏好的一切。

| | 没有 MemoMind | 有 MemoMind |
|---|---|---|
| **会话开始** | 一片空白，零上下文 | 自动回忆你的偏好、历史决策、项目背景 |
| **重复解释** | 每次会话，从头来过 | 学一次，永远记住 |
| **决策追踪** | 关掉聊天窗口就丢了 | 作为结构化事实存储在知识图谱中 |
| **编码风格** | 随机默认值 | 适应你已有的模式 |
| **跨会话推理** | 不可能 | `reflect` 跨所有记忆综合分析 |
| **隐私** | 通常基于云 | 100% 本地——数据不出你的电脑 |

## 四种记忆类型

| 类型 | 捕获什么 | 示例 |
|------|---------|------|
| **World（世界事实）** | 关于用户和环境的客观事实 | "用户偏好 Python 而非 R" |
| **Experience（经历）** | AI 参与过的事件 | "上次会话调试了 auth 模块" |
| **Observation（观察）** | 从行为中自动归纳的模式 | "用户一直使用函数式风格" |
| **Mental Model（心智模型）** | 对复杂主题的深层理解 | "这个代码库使用六边形架构" |

## 核心能力

- **100% 本地** — PostgreSQL + 嵌入模型运行在 WSL2，数据不出机器
- **零手动操作** — AI 自主决定记什么、什么时候回忆
- **GPU 加速** — 使用 NVIDIA GPU 加速本地嵌入和重排序
- **4 路混合检索** — 语义相似度 + BM25 关键词 + 知识图谱 + 时序搜索
- **深度反思** — `reflect` 跨所有记忆综合推理，不只是检索
- **心智模型** — 构建对复杂主题的演化理解，不只是孤立的事实
- **元数据过滤** — 为记忆添加标签，实现按项目/按用户隔离
- **多 LLM 支持** — OpenAI、Anthropic、Gemini、Groq、Ollama、LM Studio 等
- **可视化面板** — 在 `http://127.0.0.1:9999` 浏览和搜索所有记忆
- **开机自启** — systemd 服务 + Windows 启动脚本

## 快速开始

### 前置条件

- Windows 10/11 + WSL2 + Ubuntu
- NVIDIA GPU（可选，推荐用于本地嵌入）
- [OpenRouter](https://openrouter.ai/) API 密钥（免费额度够用，约 ¥0.07/天）

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/24kchengYe/MemoMind.git
cd MemoMind

# 2. 在 WSL2 Ubuntu 中运行安装脚本
wsl -d Ubuntu
sudo bash install.sh

# 3. 配置 API 密钥
cp serve.py.template /opt/memomind-env/serve.py
nano /opt/memomind-env/serve.py  # 填入你的 OpenRouter 密钥

# 4. 启动服务
sudo systemctl start memomind

# 5. 在 Claude Code 中注册 MCP
claude mcp add --scope user --transport stdio memomind \
  -- wsl -d Ubuntu -u hindsight -e /opt/memomind-env/bin/python3 /opt/memomind-env/mcp_stdio.py
```

### LLM 配置

MemoMind 支持两种部署模式，在 `serve.py` 和 `mcp_stdio.py` 中配置：

**模式 A：国内直连（推荐）**— 使用 [MindCraft](https://www.mindcraft.com.cn/)、[DeepSeek 官方](https://platform.deepseek.com/) 等国内 API，无需代理：
```python
LLM_API_KEY = "your-key"
LLM_BASE_URL = "https://api.mindcraft.com.cn/v1"
LLM_MODEL = "deepseek-chat"
NEEDS_PROXY = False
```

**模式 B：走代理**— 使用 OpenRouter 等国际 API，通过 `proxy-bridge.py` 桥接 WSL 到 Clash 代理

### 中国用户提示

- 嵌入模型自动从 `hf-mirror.com` 下载，无需 VPN
- 推荐使用模式 A（国内直连），retain 速度约 10-15 秒（vs 走代理 40-50 秒）

## 更新日志

- **v1.2** (2026-03-15): Dashboard 全面重新设计；README 重写 + demo GIF；双 LLM 模式（国内直连 MindCraft / 国际走代理桥接）；服务名 hindsight → memomind；retain 速度 50s → 13s
- **v1.1** (2026-03-12): 可视化记忆面板；开机自启；MCP stdio 传输
- **v1.0** (2026-03-09): 首次发布——retain/recall/reflect、PostgreSQL + pgvector、GPU 加速嵌入、交叉编码器重排序

---

<div align="center">

![Visitors](https://visitor-badge.laobi.icu/badge?page_id=24kchengYe.MemoMind)

[![Star History Chart](https://api.star-history.com/svg?repos=24kchengYe/MemoMind&type=Date)](https://star-history.com/#24kchengYe/MemoMind&Date)

</div>
