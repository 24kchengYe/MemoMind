# MemoMind 介绍 PPT 详细规划方案

> 目标：向技术爱好者和 AI 开发者展示 MemoMind 的产品价值、技术深度和实际成果。
> 风格：酷、现代、有冲击力。深色科技风，类似 Dashboard 的设计语言。
> 时长：~18 分钟，20-22 页。

---

## 设计规范

- **底色**：深蓝黑 (oklch(0.11 0.015 260))，参照 Dashboard
- **强调色**：青色 (#4adeab) 用于重点数字和按钮
- **类型色**：World 绿 / Experience 紫 / Observation 金
- **字体**：标题 Fraunces（衬线），正文 DM Sans（无衬线），代码 JetBrains Mono
- **视觉风格**：磨砂玻璃卡片、发光描边、渐变光晕、知识图谱背景纹理
- **每页原则**：不超过 3 个核心信息点，宁缺毋滥

---

## P1 — 封面

**标题**：🧠 MemoMind
**副标题**：Give your AI a brain that remembers.
**底部**：100% Local · GPU-Accelerated · Knowledge Graph Memory

**视觉**：知识图谱截图 (graph-view.png) 做高斯模糊全屏背景，中央 Logo 带发光光晕。

---

## P2 — 痛点：AI 的集体失忆症

**标题**：你的 AI 什么都不记得。

三栏卡片，每栏一个痛点场景：

### 卡片 1：每天早上都是陌生人
> 你花 20 分钟解释项目架构、技术选型、命名规范。
> 会话结束。明天？
> "你好，我是 Claude。有什么可以帮你？"
> **从零开始。又一次。**

### 卡片 2：500 条 AI 对话，零价值
> ChatGPT 里讨论过的科研思路、Gemini 里的 debug 过程、Claude 里的架构决策——
> 分散在 3 个平台，无法搜索，互不连通。
> **你的知识在腐烂。**

### 卡片 3：你的人生对 AI 不可见
> 你在 DayLife 里记录了 2,400+ 天的活动。
> 你的 AI 不知道你上次做这个课题是什么时候，
> 不知道你每周花多少时间在科研上。
> **它对你一无所知。**

**底部大字**：问题不是智能——是失忆。模型在变聪明，记忆在原地踏步。

---

## P3 — 现有方案的局限

**标题**：现有方案解决了什么？没解决什么？

四列对比表：

| | CLAUDE.md | RAG / 向量数据库 | 长上下文窗口 | **MemoMind** |
|---|---|---|---|---|
| **本质** | 手写规则文件 | 文档检索工具 | 更大的阅览室 | **AI 的大脑** |
| **记忆提取** | 手动维护 | 需要预处理文档 | 无——原文塞进去 | LLM 自动提取事实 |
| **知识关联** | 无 | 无（孤立的 chunk） | 无 | 实体链接 + 知识图谱 |
| **跨源融合** | 不支持 | 按文档检索 | 受限于窗口大小 | ChatGPT + Gemini + DayLife 统一 |
| **推理能力** | 无 | 无 | 依赖模型 | `reflect` 跨记忆综合推理 |
| **时间感知** | 无 | 无 | 无 | 时序搜索 + 事件日期追踪 |
| **成本** | 免费但浪费 token | 取决于方案 | 长上下文很贵 | ~$0.01/天 |
| **扩展性** | ~200 行就膨胀 | 取决于实现 | 100K token 上限 | 已验证 8,000+ 记忆 |

**底部**：RAG 是图书馆，长上下文是更大的阅览室——MemoMind 是大脑。

---

## P4 — MemoMind 是什么

**标题**：一个活的知识图谱，越用越聪明

**中央**：一句话定义
> MemoMind 是一个 100% 本地运行、GPU 加速的 AI 记忆系统。
> 它不存储聊天记录——而是从每一次交互中提取事实，
> 构建一张持续生长的知识图谱。

**下方三个大数字（带发光效果）**：

| 8,456 | 556,672 | 4,666 |
|-------|---------|-------|
| 记忆节点 | 知识链接 | 命名实体 |

**最下方**：覆盖 2017-01 至今，跨 3 个记忆 Bank，484 MB 本地数据

---

## P5 — 系统架构

**标题**：Under the Hood

**主体**：全屏展示 `architecture-zh.svg`

**旁注标签**（指向架构图各部分）：
- Claude Code / Cursor → MCP stdio 协议
- LLM：gpt-4o-mini（事实提取 + 巩固），$0.01/天
- 嵌入：BAAI/bge-m3，RTX 3070 本地 CUDA，50ms/条
- 重排序：cross-encoder/ms-marco-MiniLM，本地 CUDA
- 存储：PostgreSQL 18.1 + pgvector + HNSW 索引
- 运行环境：WSL2 Ubuntu，systemd 托管，开机自启

---

## P6 — 三大核心操作

**标题**：retain · recall · reflect

**主体**：使用 `operations-zh.svg`

三栏详细说明：

### retain（存储）
> 用户对话 → LLM 提取结构化事实 → 向量化 → 入图谱
> 自动识别实体、时间、分类
> 异步处理，不阻塞对话

### recall（召回）
> 查询 → **4 路并行检索** → 重排序 → 返回最相关记忆
> 平均响应：关键词 20ms / 语义 400ms
> 只返回相关片段，不浪费 token

### reflect（反思）
> 综合多条记忆，进行跨知识推理
> "基于你过去的决策和经验，分析这个方案的风险"
> 不只是检索——是推理

---

## P7 — 4 路混合检索（技术深入）

**标题**：不只是向量搜索——4 路混合检索

**视觉**：四条路径从左侧"查询"汇聚到右侧"结果"，中间经过 reranker

### 路径 1：语义相似度
- BAAI/bge-m3（1024维向量），支持 100+ 语言
- HNSW 索引，O(log n) 查询
- 理解同义词、跨语言关联

### 路径 2：BM25 关键词
- PostgreSQL GIN 索引全文搜索
- 精确术语匹配（代码名、文件路径）
- 20ms 响应

### 路径 3：知识图谱遍历
- 47 万 entity links + 3.5 万 semantic links
- 实体共现关系：提到 "FastAPI" 的记忆 → 同时提到 "Express" 的记忆
- 发现隐含关联

### 路径 4：时序搜索
- 4.8 万 temporal links
- "最近一周的决策" / "2024年3月的活动"
- 时间衰减权重

**底部**：cross-encoder/ms-marco-MiniLM 最终重排序，确保最相关的排最前

---

## P8 — 四种记忆类型

**标题**：仿生记忆分类——像人脑一样组织知识

四张色彩卡片：

| 类型 | 数量 | 占比 | 什么是 | 示例 |
|------|------|------|--------|------|
| **World**（绿） | 7,546 | 89% | 客观事实 | "用户的专业是城市规划" / "项目用 FastAPI" |
| **Observation**（金） | 908 | 11% | 自动归纳的模式 | "用户经常在周二做科研" / "偏好函数式风格" |
| **Experience**（紫） | 2 | <1% | 参与过的事件 | "上次调试了 auth 模块" |
| **Mental Model** | 0 | — | 复杂主题理解 | "这个代码库遵循六边形架构" |

**右侧**：Dashboard 类型筛选截图（filter-observation.png）

**底部**：Observation 由 Consolidation 引擎自动生成——不是你写的，是 AI 自己发现的模式。

---

## P9 — 记忆进化引擎

**标题**：记忆不堆积——会合并、更新、进化

**主体**：使用 `evolution-zh.svg`

**进化流程**：
1. 新事实进入 → 与已有记忆对比
2. 重复？→ 合并，增加置信度
3. 矛盾？→ 保留最新版本
4. 多条相关事实 → 自动归纳为 Observation
5. Observation 持续精炼，proof_count 递增

**实际案例**（来自 life bank）：
> **5 条原始事实**：
> - "2024-03-25 参加了全球城镇化的学习"
> - "2024-03-26 参加了全球城镇化工作"
> - "2024-04-01 全球城镇化合并数据"
> ...
>
> **AI 自动归纳的 Observation**：
> "用户已完成了 paddleOCR 通道工作" (proof_count=3)

**底部**：当前 908 条 Observation，由引擎从 7,546 条 World facts 中自动归纳

---

## P10 — 三个记忆 Bank

**标题**：三个 Bank，三维人生

三栏全屏，每栏一张代表性截图：

### default — AI 协作记忆（2,050 节点）
- Claude Code 实时记忆：项目决策、用户偏好、技术经验
- 541 条 ChatGPT + Gemini 对话导入
- 实体 Top 5：用户、Python、BSAS、CIM、CityGML
- 时间跨度：2017-01 至今

### life — 生活轨迹（6,361 节点）
- DayLife 5,490 条日常事件
- 时间跨度：2019-08-26 至 2026-03-26（2,400+ 天）
- 859 条 AI 自动归纳的 Observation
- 实体 Top 5：科研、鬼城、GitHub、英语、Python

### docs — 技术笔记（45 节点）
- API 文档、框架使用技巧、踩坑记录
- Claude Code 协作中实时积累

---

## P11 — 亮点功能 ①：AI 对话导入 + 溯源

**标题**：你的 500 条 AI 对话，从墓地变成金矿

**上半**：导入流程图
```
ChatGPT 网页端 ──→ chatgpt-exporter (浏览器控制台) ──→ JSON
Gemini 网页端  ──→ gemini-exporter (Chrome 扩展)    ──→ JSON
                                                         ↓
                                              import_ai_chats.py
                                                         ↓
                                          MemoMind 知识图谱 (default bank)
```

**下半**：两张截图并排
- 左：AI 记忆时间线（ai-chat-timeline.png），标注 "2,000+ 条记忆，按时间排列"
- 右：原始对话弹窗（original-chat-modal.png），标注 "点击 💬 追溯到原始 Gemini 对话"

**底部数据**：
- 541 条对话 → 2,050 条记忆节点 → 2,093 个命名实体 → 144,426 条知识链接
- 支持对话溯源：每条记忆都能追溯到来源对话

**配套开源工具**：
- [chatgpt-exporter](https://github.com/24kchengYe/chatgpt-exporter)
- [gemini-exporter](https://github.com/24kchengYe/gemini-exporter)

---

## P12 — 亮点功能 ②：DayLife 生活可视化

**标题**：从 2019 到 2026——你的每一天，AI 都记得

**左半**：DayLife 应用截图（daylife-app.png）
- 标注："DayLife——你的每日规划器，支持分类、计时、CSV 导入"

**右半**：MemoMind 生活时间线（daylife-timeline.png）
- 标注："5,490 条事件变成可搜索、可分析的记忆"

**中间箭头**：import_daylife.py + sync_daylife_smart.py

**示例事件格式**：
```
2024年3月15日 [📔科研] 写论文第三章 已完成 (9:00-12:30, 210分钟)
2024年3月15日 [🏃运动] 跑步 5km 已完成 (18:00-18:45, 45分钟)
2019年8月26日 [📚学习] ps for 2h 已完成
```

**智能同步特性**：
- 每天凌晨 3:00 自动同步（Windows 定时任务）
- marker 文件记录上次同步日期
- 电脑关机一周？重新开机自动补齐所有缺失天数
- 不重复导入

**底部**：配合 DayLife 的 CSV 导入功能，把 Excel 里的历史记录一键导入 → 一键可视化你的整个人生

---

## P13 — 亮点功能 ③：双搜索 + 无限滚动

**标题**：关键词秒搜 + 语义深度召回

**上半**：搜索模式对比
| | 关键词搜索（默认） | 语义召回 |
|---|---|---|
| **速度** | 20-33ms | 235-430ms |
| **原理** | PostgreSQL GIN 全文索引 | bge-m3 向量 + HNSW + reranker |
| **适合** | 精确术语：文件名、技术词、人名 | 模糊概念："我之前做过类似的项目" |
| **切换** | Dashboard 一键 Toggle | |

**下半**：无限滚动
- Stream 视图：每次渲染 50 条，IntersectionObserver 触底加载
- Timeline 视图：每次渲染 30 天，滚动加载
- 8,000+ 条记忆也流畅浏览

---

## P14 — Dashboard 全景

**标题**：你的记忆，一目了然

**四格截图 2x2 拼版**（每格带标注）：

| Dashboard 概览 | 知识图谱 (WebGL) |
|---|---|
| dashboard-overview.png | graph-view.png |
| 实时统计 + 搜索 + 过滤 | sigma.js 渲染，支持 50,000+ 节点 |

| 时间线视图 | AI 对话溯源 |
|---|---|
| ai-chat-timeline.png | original-chat-modal.png |
| 按日期浏览所有记忆 | 点击 💬 查看原始对话 |

**底部功能列表**：暗/亮主题 · 类型过滤 · 时间过滤 · Recency boost · 隐私标记 · JSON 导出 · Bank 管理

---

## P15 — 竞品深度对比

**标题**：How It Compares

| 维度 | **MemoMind** | MemoryLake | MemOS | Mem0 | Claude Code 内置 |
|------|-------------|------------|-------|------|-----------------|
| **定位** | MCP 编程 Agent | 企业级 SaaS | 通用 Agent 记忆 | 通用 LLM 应用 | 内置文件 |
| **部署** | 100% 本地 | 云端 | 云或本地 | 云为主 | 本地文件 |
| **隐私** | 数据不出机器 | 云端加密 | 可选 | 可配置 | 本地 |
| **检索** | **4 路混合** | 多跳推理 | FTS5 + 向量 | 仅语义 | 全文加载 |
| **知识图谱** | pgvector + entity linking | 时序知识图谱 | 有 | 无 | 无 |
| **推理** | reflect 跨记忆 | 多跳关联 | 无 | 无 | 无 |
| **多模态** | 文本 | 文本+图片+音视频 | 文本+图片+工具 | 文本 | 文本 |
| **GPU 加速** | 本地 CUDA | 云端 | 可选 | 无 | 无 |
| **对话溯源** | 原始对话追溯 | 无 | 无 | 无 | 无 |
| **生活数据集成** | DayLife 导入 | 无 | 无 | 无 | 无 |
| **成本** | ~$0.01/天 | 企业付费 | 免费/付费 | 免费额度有限 | 免费 |
| **开源** | MIT | 商业 | Apache-2.0 | 部分开源 | N/A |

**底部总结**：
- vs MemoryLake：他们做企业级 SaaS 多跳推理，我们做**本地化+隐私优先+生态集成**
- vs MemOS：他们做通用 Agent 多模态，我们做**MCP 编程 Agent 深度优化**
- 独特优势：**AI 对话溯源 + DayLife 生活集成 + 4 路混合检索 + 100% 本地**

---

## P16 — 核心技术亮点

**标题**：Technical Deep Dive

六个技术亮点，每个一张小卡片：

### 1. 知识图谱而非扁平存储
- 556,672 条链接：entity (85%) + temporal (9%) + semantic (6%)
- 实体共现推理：提到 "FastAPI" → 关联到 "Express"、"API 性能" 等
- 不是孤立的向量检索

### 2. 事实提取引擎
- LLM (gpt-4o-mini) 自动从自然语言提取：实体、关系、时间、分类
- 异步队列处理，不阻塞用户对话
- retain_mission 控制提取质量（要求包含上下文、保留术语）

### 3. Consolidation 引擎
- 自动合并重复事实、归纳 Observation
- 已生成 908 条 Observation（从 7,546 条 World facts）
- 可配置 mission 控制归纳方向

### 4. 嵌入模型本地化
- BAAI/bge-m3：1024 维，支持 100+ 语言
- RTX 3070 CUDA 加速，50ms/条
- 无需调用外部 API，零延迟零成本

### 5. 时间感知记忆
- 每条记忆带 occurred_start/occurred_end
- 引擎 patch：LLM 不设时间时自动回退到事件日期
- 支持 "最近一周"、"2024年3月" 等时间范围查询

### 6. 原始对话溯源
- 引擎 patch：retain 时保存 original_document_id
- Dashboard：chunk_id → document hash → index.json → .md 文件
- 从提取的记忆 → 一键回溯到原始对话完整内容

---

## P17 — 成本与资源

**标题**：每天不到 1 毛钱

| 组件 | 资源占用 | 成本 |
|------|---------|------|
| LLM 提取 (gpt-4o-mini via OpenRouter) | ~100 次调用/天 | ~$0.01/天 |
| 嵌入模型 (bge-m3 本地 CUDA) | ~500MB VRAM 瞬时 | $0 |
| 重排序 (ms-marco-MiniLM 本地) | ~200MB VRAM 瞬时 | $0 |
| 存储 (PostgreSQL) | 484MB 磁盘 | $0 |
| 服务进程 | ~2GB RAM (WSL2) | $0 |

**对比**：
- MemoryLake：企业定价，未公开
- Mem0 Pro：$99/月起
- MemoMind：**$0.30/月**，全部本地

---

## P18 — 已有成果

**标题**：Real Numbers, Real Usage

| 指标 | 数值 |
|------|------|
| 总记忆节点 | 8,456 |
| 知识链接 | 556,672 |
| 命名实体 | 4,666 |
| AI 对话导入 | 541 条（ChatGPT 115 + Gemini 426） |
| 生活事件导入 | 5,490 条（2019-08 至 2026-03） |
| 自动归纳 Observation | 908 条 |
| 覆盖时间跨度 | 2017-01 至今（9 年） |
| 数据库占用 | 484 MB |
| 日均 LLM 成本 | < $0.01 |
| API 响应（关键词搜索） | 20-33ms |
| API 响应（语义召回） | 235-430ms |

**底部**：这不是实验室 demo——是每天在用的生产系统。

---

## P19 — 核心理念

**标题**：记忆是新的护城河

三张浮动卡片：

### 1. 模型商品化，记忆不会
> GPT-5 比 GPT-4 便宜 97%。模型在贬值。
> 但你积累的 8,000+ 条记忆、500+ 实体关系、9 年生活轨迹——
> 任何模型替换都无法复制。

### 2. 数据可迁移，不锁定
> 开放 JSON 格式导出，含所有记忆、实体、标签、关系、来源。
> 每周自动备份到 GitHub。
> 明天出现更好的系统？带走一切。

### 3. 数字分身，时间越久越有价值
> 从今天开始积累。
> 你的 AI 明天比今天更了解你，明年比明天更了解你。
> 这就是复利。

---

## P20 — Roadmap

**标题**：What's Next

**已完成**（打勾，灰色）：
- 核心引擎 retain/recall/reflect
- 4 路混合检索 + GPU 加速
- AI 对话导入 + 原始对话溯源
- DayLife 生活轨迹集成
- Web Dashboard (Stream/Graph/Timeline)
- 每周自动备份

**下一步**（发光，青色）：
- 记忆冲突检测与版本化——矛盾事实自动标记，保留审计轨迹
- 多跳图谱推理——沿 entity 关系展开 2-3 跳，发现深层关联
- 记忆衰减机制——时间加权，低访问频率记忆自动归档
- Docker 安装——摆脱 WSL 依赖，一键部署
- 更多 MCP 客户端支持——Cursor, Windsurf, etc.

---

## P21 — 快速开始

**标题**：5 分钟，从失忆到记忆

```bash
# 1. 克隆
git clone https://github.com/24kchengYe/MemoMind.git

# 2. 安装（WSL 内执行，自动安装全部依赖）
wsl -d Ubuntu
sudo bash install.sh

# 3. 配置 LLM API（只需编辑一个文件）
sudo nano /opt/memomind-env/serve.py

# 4. 注册 MCP
claude mcp add --scope user --transport stdio memomind \
  -- wsl -d Ubuntu -u memomind -e //opt/memomind-env/mcp-entry.sh

# 5. 开始对话——AI 自动 retain/recall
```

**底部**：GitHub: https://github.com/24kchengYe/MemoMind · MIT License

---

## P22 — 尾页

**中央大字**：
🧠 Start building your digital twin's memory today.
今天开始培养你的数字分身。

**下方链接**：
- GitHub: github.com/24kchengYe/MemoMind
- Dashboard Demo: http://127.0.0.1:9999
- chatgpt-exporter: github.com/24kchengYe/chatgpt-exporter
- gemini-exporter: github.com/24kchengYe/gemini-exporter

**视觉**：知识图谱全屏模糊背景 + 中央 Logo 发光扩散

---

## 可用素材清单

### 截图（docs/demos/）
| 文件 | 用于页面 |
|------|----------|
| dashboard-overview.png | P4, P14 |
| graph-view.png | P1 背景, P14, P22 背景 |
| timeline-view.png | P14 |
| ai-chat-timeline.png | P11, P14 |
| original-chat-modal.png | P11, P14 |
| daylife-timeline.png | P12 |
| daylife-app.png | P12 |
| filter-observation.png | P8 |
| filter-world.png | P8 |
| filter-experience.png | P8 |
| add-memory.png | — |

### 架构图（docs/diagrams/）
| 文件 | 用于页面 |
|------|----------|
| architecture-zh.svg | P5 |
| operations-zh.svg | P6 |
| evolution-zh.svg | P9 |

### 实际数据（可直接引用）
| 数据 | 数值 |
|------|------|
| 总记忆节点 | 8,456 (default 2,050 + life 6,361 + docs 45) |
| 总知识链接 | 556,672 (entity 474,186 + temporal 47,887 + semantic 34,596) |
| 总命名实体 | 4,666 (default 2,093 + life 2,531 + docs 42) |
| 总文档 | 6,271 |
| Observations | 908 |
| DB 大小 | 484 MB |
| life 时间跨度 | 2019-08-26 ~ 2026-03-26 (2,400+ 天) |
| default 时间跨度 | 2017-01-01 ~ 2026-03-27 |
| default Top 实体 | 用户, Python, BSAS, CIM, CityGML, pandas, BIM, CVPR |
| life Top 实体 | 科研, 鬼城, GitHub, 英语, Python, GIS, 设计课 |
| 关键词搜索延迟 | 20-33ms |
| 语义召回延迟 | 235-430ms |
| 日均 LLM 成本 | < $0.01 |

---

## 演讲节奏建议

| 阶段 | 页面 | 时长 | 要点 |
|------|------|------|------|
| **引入痛点** | P1-P3 | 3 min | 建立共鸣：AI 失忆 → 现有方案不够 |
| **方案概览** | P4-P6 | 3 min | 什么是 MemoMind → 架构 → 三大操作 |
| **技术深入** | P7-P9 | 3 min | 4 路检索 → 记忆类型 → 进化引擎 |
| **功能亮点** | P10-P14 | 5 min | 三个 Bank → AI 对话 → DayLife → 搜索 → Dashboard |
| **对比+成本** | P15-P18 | 3 min | 竞品对比 → 技术亮点 → 成本 → 已有成果 |
| **愿景收尾** | P19-P22 | 3 min | 核心理念 → Roadmap → 快速开始 → 尾页 |
| **总计** | 22 页 | ~18 min | |
