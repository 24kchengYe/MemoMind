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

| Type | Example | How It's Used |
|------|---------|---------------|
| **World** | "User prefers Python over R" | Shapes recommendations |
| **Experience** | "Last session we debugged auth module" | Provides continuity |
| **Observation** | "User consistently uses functional style" | Auto-synthesized from patterns |

## Key Features

- **100% local** — PostgreSQL + embedding models in WSL2, nothing leaves your machine
- **Zero manual effort** — AI autonomously decides what to remember and recall
- **GPU-accelerated** — uses your NVIDIA GPU for fast local embeddings and reranking
- **Dirt cheap** — fact extraction via OpenRouter costs < $0.01/day
- **4-way hybrid retrieval** — semantic similarity + BM25 keyword + knowledge graph + temporal search
- **Reflect capability** — AI can reason across all memories, not just retrieve
- **Web Dashboard** — browse and search all memories visually at `http://127.0.0.1:9999`
- **Auto-start** — systemd service + Windows startup script, works after reboot

## How It Compares

| Feature | MemoMind | Memori | Mem0 | Claude Code built-in |
|---------|----------|--------|------|---------------------|
| Privacy | 100% local | Cloud required | Configurable | Local files |
| Memory type | Facts + knowledge graph | 8 categories | Flat facts | Markdown notes |
| Retrieval | 4-way hybrid | Semantic + BM25 | Semantic only | Full file load |
| Auto-extract | LLM-powered | LLM-powered | LLM-powered | Manual |
| Reflect/reason | Yes | No | No | No |
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

## Recommended Models (via OpenRouter)

The LLM is only used for fact extraction (not for chatting). Pick the cheapest:

| Model | Cost (per 1M tokens) | Best For |
|-------|---------------------|----------|
| `qwen/qwen3.5-9b` | $0.05 / $0.15 | **Default** — cheapest, good JSON output |
| `deepseek/deepseek-chat` | $0.14 / $0.28 | Best Chinese language support |
| `openai/gpt-4.1-nano` | $0.10 / $0.40 | Most reliable structured output |

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
- [x] Web dashboard for visual memory browsing
- [x] Auto-start on boot (systemd + VBS)
- [ ] Memory import/export (JSON backup)
- [ ] Multi-agent memory sharing
- [ ] Automatic memory consolidation and pruning
- [ ] Support for more MCP clients (Cursor, Windsurf, etc.)
- [ ] Docker-based installation (no WSL dependency)
- [ ] Memory visualization graph view in dashboard

## Credits

- Core memory engine powered by [Hindsight](https://github.com/vectorize-io/hindsight) (MIT)
- LLM routing via [OpenRouter](https://openrouter.ai/)
- China mirror by [hf-mirror.com](https://hf-mirror.com/)

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

### 中国用户提示

- 嵌入模型自动从 `hf-mirror.com` 下载，无需 VPN
- OpenRouter 大部分模型无需代理（避免使用 Google Gemini 系列）

---

<div align="center">

![Visitors](https://visitor-badge.laobi.icu/badge?page_id=24kchengYe.MemoMind)

[![Star History Chart](https://api.star-history.com/svg?repos=24kchengYe/MemoMind&type=Date)](https://star-history.com/#24kchengYe/MemoMind&Date)

</div>
