# MemoMind

**Give your AI agent a brain that remembers.**

MemoMind is a fully local memory system for Claude Code and AI coding assistants. It runs entirely on your machine — no cloud uploads, no data leaks, no subscription fees. Your AI autonomously extracts knowledge from conversations and recalls it in future sessions, getting smarter over time.

> See also: [**Recall**](https://github.com/24kchengYe/Recall) — the human-facing counterpart that lets *you* browse, search, and manage your AI conversation history.

## The Problem

AI coding assistants forget everything between sessions. You explain your project architecture, your coding preferences, your team conventions — next session, it's all gone. You repeat yourself. Every. Single. Time.

## The Solution

MemoMind gives your AI persistent memory. It automatically:

1. **Extracts** key facts from your conversations (preferences, decisions, context)
2. **Stores** them locally in a knowledge graph with vector embeddings
3. **Recalls** relevant memories before responding in future sessions
4. **Reflects** across all memories for deep reasoning when needed

You don't do anything — the AI handles it all.

```
You: "Let's use FastAPI instead of Express for this project"

Claude Code internally:
  → retain("Project migrating from Express to FastAPI")  # auto-stores

Next week, new session:
  → recall("project tech stack")                          # auto-retrieves
  → "Based on your previous decision, I'll use FastAPI..."
```

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

## Memory Types

| Type | Example | How It's Used |
|------|---------|---------------|
| **World** | "User prefers Python over R" | Shapes recommendations |
| **Experience** | "Last session we debugged auth module" | Provides continuity |
| **Observation** | "User consistently uses functional style" | Auto-synthesized from patterns |

## Three Core Operations

| Operation | What It Does | When AI Calls It |
|-----------|-------------|------------------|
| **retain** | Extract facts from conversation, store in vector DB | After learning something new about you |
| **recall** | 4-way hybrid search (semantic + BM25 + graph + temporal) | Before responding, to check relevant history |
| **reflect** | Deep reasoning across all memories | For complex questions requiring synthesis |

## Key Features

- **100% local** — PostgreSQL + embedding models in WSL2, nothing leaves your machine
- **Zero manual effort** — AI autonomously decides what to remember and recall
- **GPU-accelerated** — uses your NVIDIA GPU for fast local embeddings and reranking
- **Dirt cheap** — fact extraction via OpenRouter costs < $0.01/day
- **4-way hybrid retrieval** — semantic similarity + BM25 keyword + knowledge graph + temporal search
- **Reflect capability** — AI can reason across all memories, not just retrieve
- **Auto-start** — systemd service + Windows startup script, works after reboot

## Quick Start

### Prerequisites

- Windows 10/11 with WSL2 + Ubuntu
- NVIDIA GPU (optional but recommended for local embeddings)
- [OpenRouter](https://openrouter.ai/) API key (free tier works, ~$0.01/day)

### Installation

```bash
# 1. Clone this repo
git clone https://github.com/24kchengYe/MemoMind.git
cd MemoMind

# 2. Run the installer in WSL2 Ubuntu
wsl -d Ubuntu
sudo bash install.sh

# 3. Configure your API key
cp serve.py.template /opt/memomind-env/serve.py
nano /opt/memomind-env/serve.py  # Add your OpenRouter key

# 4. Start the service
sudo systemctl start memomind

# 5. Register MCP in Claude Code (two options):

# Option A: stdio mode (recommended, no port forwarding needed)
claude mcp add --scope user --transport stdio memomind \
  -- wsl -d Ubuntu -u hindsight -e /opt/memomind-env/bin/python3 /opt/memomind-env/mcp_stdio.py

# Option B: SSE mode (requires admin port forwarding)
# powershell -ExecutionPolicy Bypass -File update-portproxy.ps1
# claude mcp add --scope user --transport sse memomind "http://127.0.0.1:8888/mcp/"

# 6. (Optional) Auto-start on boot
cp keep-wsl-alive.vbs "$APPDATA/Microsoft/Windows/Start Menu/Programs/Startup/"
```

### Verify

```bash
# Check service status
wsl -d Ubuntu -e systemctl status memomind

# Test health endpoint (from inside WSL)
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

## China Users

- Embedding models download from `hf-mirror.com` automatically — no VPN needed
- OpenRouter works without proxy for most models (avoid Google Gemini series)

## How It Compares

| Feature | MemoMind | Memori | Mem0 | Claude Code built-in |
|---------|----------|--------|------|---------------------|
| Privacy | 100% local | Cloud required | Configurable | Local files |
| Memory type | Facts + knowledge graph | 8 categories | Flat facts | Markdown notes |
| Retrieval | 4-way hybrid | Semantic + BM25 | Semantic only | Full file load |
| Auto-extract | LLM-powered | LLM-powered | LLM-powered | Manual |
| Reflect/reason | Yes | No | No | No |
| Cost | ~$0.01/day | Free tier limited | Free tier limited | Free |

## Troubleshooting

**MCP not connecting:**
```bash
wsl -d Ubuntu -e systemctl status memomind  # Check service
wsl -d Ubuntu -e ss -tlnp | grep 8888       # Check port
```

**WSL shuts down automatically:**
- Ensure `keep-wsl-alive.vbs` is in your Windows Startup folder
- Or: `wsl -d Ubuntu -e bash -c "sleep infinity" &`

**Models fail to download:**
```bash
export HF_ENDPOINT=https://hf-mirror.com  # Use China mirror
```

## Credits

- Core memory engine powered by [Hindsight](https://github.com/vectorize-io/hindsight) (MIT)
- LLM routing via [OpenRouter](https://openrouter.ai/)
- China mirror by [hf-mirror.com](https://hf-mirror.com/)

## License

MIT

---

![Visitors](https://visitor-badge.laobi.icu/badge?page_id=24kchengYe.MemoMind)

[![Star History Chart](https://api.star-history.com/svg?repos=24kchengYe/MemoMind&type=Date)](https://star-history.com/#24kchengYe/MemoMind&Date)
