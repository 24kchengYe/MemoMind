# MemoMind 服务器部署（腾讯云 SG /opt/memomind）

2026-08-06 起 MemoMind 生产实例运行在腾讯云新加坡服务器，wolf 本机服务已停用（数据保留可回滚）。

## 架构

- `memomind-pg`：pgvector/pgvector:pg17，内部网络，数据卷 `./pgdata`
- `memomind-api`：hindsight-api（`serve.py`），绑 Tailscale `100.101.110.113:19999`
- `memomind-dashboard`：Web UI（`dashboard_server.py`），绑 Tailscale `100.101.110.113:9999`
- LLM 走内网 sub2api（`http://sub2api:8080/v1`，memomind 分组）
- 模型（bge-m3 / ms-marco-MiniLM-L-6-v2）烤进镜像，`HF_HOME=/models` 在镜像内，**不要挂卷覆盖**

## 客户端怎么连

| 用途 | 地址 | 认证 |
|------|------|------|
| HTTP API（retain/recall/reflect） | Tailscale：`http://100.101.110.113:19999`；公网：`https://memomind.duqi.top/v1/...` | 内网免认证；公网 `Authorization: Bearer <访问密码>`（与主密码同值，加密包 `MEMOMIND_MCP_TOKEN`） |
| Dashboard 网页 | `https://memomind.duqi.top` 或 Tailscale `http://100.101.110.113:9999` | 登录页：575860760@qq.com / 同 sub2api 管理员密码 |
| MCP（kimi/Claude 等 AI 客户端） | `https://memomind.duqi.top/mcp` | Bearer 访问密码（同上） |

公网双层鉴权模型：Dashboard 用网站账号登录（会话 Cookie）；API/MCP 用访问密码（Bearer）。无 Bearer 的 /v1 请求会回落到 Dashboard 检查会话 Cookie，浏览器与脚本两种客户端都兼容。不能上 Tailscale 的设备直接走公网即可。

kimi-cli `~/.kimi/mcp.json` 配置示例：

```json
"memomind": {
  "url": "https://memomind.duqi.top/mcp",
  "transport": "http",
  "headers": {"Authorization": "Bearer <MEMOMIND_MCP_TOKEN>"}
}
```

## 部署

```bash
cd /opt/memomind
docker compose build   # 首次约 10 分钟（torch CPU + 模型 ~2.4GB）
docker compose up -d
```

`.env` 需要：`PG_PASSWORD`、`SUB2API_MEMOMIND_KEY`（memomind 分组 key）、`MEMOMIND_MCP_TOKEN`。

## 注意

- compose 服务名必须带项目前缀（`memomind-api` 而非 `api`）——共享网络 caddy_web 上服务名即全局 DNS 名，通用名会劫持其他项目（2026-08-06 实测 duqi.top 因此 502）
- 数据迁移用 `pg_dump -Fc` → 空库 `pg_restore`（不要 --clean 到已有 schema）
- Dashboard 的 `/vault` 代理回指 wolf 的 NoteDiscovery（`100.101.229.33:9998`，知识语料留在 wolf）
