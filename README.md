# MemoFinal

**Give your AI agent a brain that remembers.**

MemoFinal is a turnkey local memory system for Claude Code and other AI coding assistants. It runs entirely on your machine — no cloud uploads, no data leaks, no subscription fees. Your conversations become persistent knowledge that makes your AI smarter over time.

> Built on [Hindsight](https://github.com/vectorize-io/hindsight) by Vectorize.io, optimized for Windows + WSL2 + Claude Code.

## Why MemoFinal?

AI coding assistants forget everything between sessions. You explain your project architecture, your coding preferences, your team conventions — and next session, it's all gone.

MemoFinal fixes this:

- **Your AI remembers you** — preferences, decisions, project context persist across all sessions
- **100% local** — PostgreSQL + embedding models run in WSL2, nothing leaves your machine
- **Zero manual effort** — AI autonomously decides what to remember and what to recall
- **GPU-accelerated** — uses your NVIDIA GPU for fast local embeddings
- **Dirt cheap** — fact extraction via OpenRouter costs < $0.01/day

## How It Works

```
You: "Let's use FastAPI instead of Express for this project"

Claude Code internally:
  → retain("Project migrating from Express to FastAPI")  # auto-stores

Next week, new session:
  → recall("project tech stack")                          # auto-retrieves
  → "Based on your previous decision, I'll use FastAPI..."
```

### Architecture

```
Claude Code ──MCP──→ 127.0.0.1:8888 ──netsh──→ WSL2:8888
                                                   │
                                          ┌────────┴────────┐
                                          │   Hindsight API  │
                                          ├─────────────────┤
                                          │ PostgreSQL (pg0) │ ← memories
                                          │ BAAI/bge-small   │ ← embeddings (GPU)
                                          │ cross-encoder    │ ← reranking (GPU)
                                          │ OpenRouter API   │ ← fact extraction
                                          └─────────────────┘
```

### Memory Types

| Type | Example | How It's Used |
|------|---------|---------------|
| **World** | "User prefers Python over R" | Shapes recommendations |
| **Experience** | "Last session we debugged auth module" | Provides continuity |
| **Observation** | "User consistently uses functional style" | Auto-synthesized from patterns |

### Three Core Operations

| Operation | What It Does | When AI Calls It |
|-----------|-------------|------------------|
| **retain** | Extract facts from conversation, store in vector DB | After learning something new about you |
| **recall** | 4-way hybrid search (semantic + BM25 + graph + temporal) | Before responding, to check relevant history |
| **reflect** | Deep reasoning across all memories | For complex questions requiring synthesis |

## Quick Start

### Prerequisites

- Windows 10/11 with WSL2 + Ubuntu
- NVIDIA GPU (for local embeddings, optional but recommended)
- [OpenRouter](https://openrouter.ai/) API key (free tier works, ~$0.01/day)

### Installation

```bash
# 1. In WSL2 Ubuntu, run the installer
sudo bash install.sh

# 2. Configure your API key
cp serve.py.template /opt/hindsight-env/serve.py
nano /opt/hindsight-env/serve.py  # Add your OpenRouter key

# 3. Start the service
sudo systemctl start hindsight

# 4. On Windows (PowerShell as Admin), set up port forwarding
powershell -ExecutionPolicy Bypass -File update-portproxy.ps1

# 5. Register MCP in Claude Code
claude mcp add --scope user --transport sse hindsight "http://127.0.0.1:8888/mcp/"

# 6. (Optional) Auto-start on boot - copy to Windows Startup folder
cp keep-wsl-alive.vbs "$APPDATA/Microsoft/Windows/Start Menu/Programs/Startup/"
```

### Verify

```bash
# Check service status
wsl -d Ubuntu -e systemctl status hindsight

# Test health
curl --noproxy '*' http://127.0.0.1:8888/health
# → {"status":"healthy","database":"connected"}

# Test memory CLI
wsl -d Ubuntu -u hindsight -- /opt/hindsight-env/hindsight-cli.sh memory retain default "Test memory"
wsl -d Ubuntu -u hindsight -- /opt/hindsight-env/hindsight-cli.sh memory recall default "What was stored?"
```

## Configuration

### Recommended Models (via OpenRouter)

| Model | Cost (per 1M tokens) | Best For |
|-------|---------------------|----------|
| `qwen/qwen3.5-9b` | $0.05 in / $0.15 out | **Default** — cheapest, good JSON output |
| `deepseek/deepseek-chat` | $0.14 / $0.28 | Best Chinese language support |
| `openai/gpt-4.1-nano` | $0.10 / $0.40 | Most reliable structured output |

### China Users

Models are downloaded from HuggingFace mirror (`hf-mirror.com`) automatically. No VPN needed for model download.

OpenRouter API works in China without proxy for most models (avoid Google Gemini series).

### File Structure

```
D:\pythonPycharms\hindsight\          # Windows side
├── README.md
├── install.sh                        # One-click WSL installer
├── serve.py.template                 # Server config template (fill in API key)
├── hindsight-cli.sh.template         # CLI wrapper template
├── hindsight.service                 # systemd service unit
├── keep-wsl-alive.vbs                # Windows startup script
├── update-portproxy.ps1              # Port forwarding updater
├── .gitignore
├── data/                             # (gitignored) PG data
└── wsl/                              # (gitignored) WSL virtual disk

WSL: /opt/hindsight-env/              # Linux side
├── serve.py                          # Running server (with real API key)
├── hindsight-cli.sh                  # CLI wrapper (with real API key)
├── bin/, lib/                        # Python venv
└── ...

WSL: /home/hindsight/
├── .pg0/                             # PostgreSQL data
└── .cache/huggingface/               # Embedding models (~216MB)
```

## Resource Usage

| Component | Idle | Active |
|-----------|------|--------|
| WSL2 + PostgreSQL | ~200MB RAM | ~200MB RAM |
| Hindsight Server | ~600MB RAM | ~800MB RAM |
| GPU (embeddings) | 0 | ~500MB VRAM (burst) |
| Disk (WSL vhdx) | ~14GB | Grows with memories |
| Network | 0 | OpenRouter API calls on retain |

## Troubleshooting

**MCP not connecting in Claude Code:**
```bash
# Check service is running
wsl -d Ubuntu -e systemctl status hindsight
# Check port forwarding
netsh interface portproxy show all
# Update port forwarding (WSL IP may have changed)
powershell -ExecutionPolicy Bypass -File update-portproxy.ps1
```

**WSL shuts down automatically:**
- Make sure `keep-wsl-alive.vbs` is in your Windows Startup folder
- Or manually run: `wsl -d Ubuntu -e bash -c "sleep infinity" &`

**Models fail to download:**
```bash
# Use China mirror
export HF_ENDPOINT=https://hf-mirror.com
```

## How It Compares

| Feature | MemoFinal (local) | Memori (cloud) | Mem0 (hybrid) | Claude Code built-in |
|---------|-----------------|----------------|---------------|---------------------|
| Privacy | 100% local | Cloud upload required | Configurable | Local files |
| Memory type | Structured facts + knowledge graph | 8 categories | Flat facts | Markdown notes |
| Retrieval | 4-way hybrid (semantic+BM25+graph+temporal) | Semantic + BM25 | Semantic only | Full file load |
| Auto-extract | LLM-powered | LLM-powered | LLM-powered | Manual |
| Reflect/reason | Yes | No | No | No |
| Cost | ~$0.01/day | Free tier limited | Free tier limited | Free |
| Setup | 10 min | 1 min | 5 min | 0 |

## Credits

- [Hindsight](https://github.com/vectorize-io/hindsight) by Vectorize.io — the core memory engine
- [OpenRouter](https://openrouter.ai/) — affordable LLM API routing
- [hf-mirror.com](https://hf-mirror.com/) — HuggingFace mirror for China users

## License

MIT — same as Hindsight.

---

![Visitors](https://visitor-badge.laobi.icu/badge?page_id=24kchengYe.MemoFinal)

[![Star History Chart](https://api.star-history.com/svg?repos=24kchengYe/MemoFinal&type=Date)](https://star-history.com/#24kchengYe/MemoFinal&Date)
