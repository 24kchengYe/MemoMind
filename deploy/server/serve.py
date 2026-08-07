"""MemoMind production HTTP/MCP server."""
import logging
import os

LLM_API_KEY = os.environ.get("SUB2API_MEMOMIND_KEY", "")
LLM_BASE_URL = os.environ.get("MEMOMIND_LLM_BASE_URL", "http://sub2api:8080/v1")
LLM_MODEL = os.environ.get("MEMOMIND_LLM_MODEL", "gpt-5.6")
if not LLM_API_KEY:
    raise RuntimeError("SUB2API_MEMOMIND_KEY is not configured")

PG_URL = os.environ.get("MEMOMIND_PG_URL", "postgresql://hindsight@pg:5432/hindsight")
HOST = "0.0.0.0"
PORT = int(os.environ.get("MEMOMIND_PORT", "19999"))

for _name in ("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"):
    os.environ.pop(_name, None)
os.environ["NO_PROXY"] = "localhost,127.0.0.1,::1,sub2api,pg"
os.environ.setdefault("HF_HOME", "/models")
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["HINDSIGHT_API_EMBEDDINGS_LOCAL_MODEL"] = "BAAI/bge-m3"
os.environ["HINDSIGHT_API_RERANKER_LOCAL_FORCE_CPU"] = "1"
os.environ["HINDSIGHT_API_RERANKER_LOCAL_MAX_CONCURRENT"] = "1"
os.environ["HINDSIGHT_API_RERANKER_MAX_CANDIDATES"] = "50"
os.environ["HINDSIGHT_API_SKIP_LLM_VERIFICATION"] = "true"
if os.path.isdir("/app/tiktoken_cache"):
    os.environ["TIKTOKEN_CACHE_DIR"] = "/app/tiktoken_cache"
os.environ["HINDSIGHT_API_LLM_PROVIDER"] = "openai"
os.environ["HINDSIGHT_API_LLM_MODEL"] = LLM_MODEL
os.environ["HINDSIGHT_API_LLM_API_KEY"] = LLM_API_KEY
os.environ["HINDSIGHT_API_LLM_BASE_URL"] = LLM_BASE_URL
os.environ["HINDSIGHT_API_CONSOLIDATION_LLM_PROVIDER"] = "openai"
os.environ["HINDSIGHT_API_CONSOLIDATION_LLM_MODEL"] = LLM_MODEL
os.environ["HINDSIGHT_API_CONSOLIDATION_LLM_API_KEY"] = LLM_API_KEY
os.environ["HINDSIGHT_API_CONSOLIDATION_LLM_BASE_URL"] = LLM_BASE_URL

import uvicorn
from hindsight_api import MemoryEngine
from hindsight_api.api import create_app
from hindsight_api.extensions import DefaultExtensionContext, TenantExtension, load_extension

tenant_extension = load_extension("TENANT", TenantExtension)
if tenant_extension:
    logging.info("Loaded tenant extension: %s", tenant_extension.__class__.__name__)

memory = MemoryEngine(
    db_url=PG_URL,
    memory_llm_provider="openai",
    memory_llm_api_key=LLM_API_KEY,
    memory_llm_model=LLM_MODEL,
    memory_llm_base_url=LLM_BASE_URL,
    retain_llm_provider="openai",
    retain_llm_api_key=LLM_API_KEY,
    retain_llm_model=LLM_MODEL,
    retain_llm_base_url=LLM_BASE_URL,
    reflect_llm_provider="openai",
    reflect_llm_api_key=LLM_API_KEY,
    reflect_llm_model=LLM_MODEL,
    reflect_llm_base_url=LLM_BASE_URL,
    consolidation_llm_provider="openai",
    consolidation_llm_api_key=LLM_API_KEY,
    consolidation_llm_model=LLM_MODEL,
    consolidation_llm_base_url=LLM_BASE_URL,
    tenant_extension=tenant_extension,
)

if tenant_extension:
    tenant_extension.set_context(DefaultExtensionContext(database_url=PG_URL, memory_engine=memory))

app = create_app(memory=memory, mcp_api_enabled=True, initialize_memory=True)

if __name__ == "__main__":
    print(f"[MemoMind] Starting on {HOST}:{PORT} (model: {LLM_MODEL})", flush=True)
    uvicorn.run(app, host=HOST, port=PORT, log_level="info")
