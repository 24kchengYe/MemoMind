# MemoMind 服务器部署（Docker）

MemoMind 生产实例以 Docker Compose 运行在云服务器上（`/opt/memomind`）。本目录包含全部部署文件；**任何 IP、账号、密码、token 都不入库**——真实值只存在于服务器的 `.env` 和各设备的 secrets 目录。

## 架构

- `memomind-pg`：pgvector/pgvector:pg17，内部网络，数据卷 `./pgdata`
- `memomind-api`：hindsight-api（`serve.py`），绑 Tailscale IP（`.env` 的 `BIND_IP`）
- `memomind-dashboard`：Web UI（`dashboard_server.py`），带登录页（PBKDF2 + HMAC 会话）
- LLM 走内网 sub2api（`http://sub2api:8080/v1`）
- 模型（bge-m3 / ms-marco-MiniLM-L-6-v2）烤进镜像，`HF_HOME=/models` 在镜像内，**不要挂卷覆盖**

## 客户端怎么连

| 用途 | 地址 | 认证 |
|------|------|------|
| HTTP API（retain/recall/reflect） | Tailscale：`http://<SERVER_TAILSCALE_IP>:19999`；公网：`https://<DOMAIN>/v1/...` | 内网免认证；公网 `Authorization: Bearer <访问密码>` |
| Dashboard 网页 | `https://<DOMAIN>` 或 Tailscale `http://<SERVER_TAILSCALE_IP>:9999` | 登录页（账号密码见私有 secrets） |
| MCP（kimi/Claude 等 AI 客户端） | `https://<DOMAIN>/mcp` | Bearer 访问密码（同上） |

公网双层鉴权：Dashboard 用网站账号登录（会话 Cookie）；API/MCP 用访问密码（Bearer）。无 Bearer 的 /v1 请求回落到 Dashboard 检查会话 Cookie，浏览器与脚本两种客户端都兼容。不能上 Tailscale 的设备直接走公网。

kimi-cli `~/.kimi/mcp.json` 配置示例：

```json
"memomind": {
  "url": "https://<DOMAIN>/mcp",
  "transport": "http",
  "headers": {"Authorization": "Bearer <访问密码>"}
}
```

## 部署

```bash
cd /opt/memomind
docker compose build   # 首次约 10 分钟（torch CPU + 模型 ~2.4GB）
docker compose up -d
```

`.env` 需要：`PG_PASSWORD`、`SUB2API_MEMOMIND_KEY`、`MEMOMIND_MCP_TOKEN`、`BIND_IP`、`MEMOMIND_AUTH_*`（登录页）、`VAULT_BACKEND_URL`（可选，指回知识库设备）。

## 注意

- compose 服务名必须带项目前缀（`memomind-api` 而非 `api`）——共享网络 caddy_web 上服务名即全局 DNS 名，通用名会劫持其他项目
- 数据迁移用 `pg_dump -Fc` → 空库 `pg_restore`（不要 --clean 到已有 schema）
- Dashboard 的 `/vault` 代理回指知识库设备（NoteDiscovery），由 `VAULT_BACKEND_URL` 注入
