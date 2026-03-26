#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
import_ai_chats.py - 将 ChatGPT 和 Gemini 对话历史导入 MemoMind

用法:
    python import_ai_chats.py                       # 导入全部
    python import_ai_chats.py --dry-run              # 仅预览，不实际调用 API
    python import_ai_chats.py --source chatgpt       # 只导入 ChatGPT
    python import_ai_chats.py --source gemini        # 只导入 Gemini
    python import_ai_chats.py --limit 10 --dry-run   # 测试前 10 条
    python import_ai_chats.py --delay 0.5            # 每次请求间隔 0.5 秒
"""

import sys
import os
import json
import time
import argparse
import urllib.request
import urllib.error

# ---------- stdout UTF-8 fix (Windows) ----------
if sys.platform == "win32":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    else:
        import io
        sys.stdout = io.TextIOWrapper(
            sys.stdout.buffer, encoding="utf-8", errors="replace"
        )

# ---------- 清除代理环境变量 ----------
for key in list(os.environ.keys()):
    if key.lower() in (
        "http_proxy", "https_proxy", "all_proxy",
        "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY",
    ):
        del os.environ[key]

# ---------- 构建无代理 opener ----------
_no_proxy_handler = urllib.request.ProxyHandler({})
_opener = urllib.request.build_opener(_no_proxy_handler)

# ---------- 常量 ----------
DATA_ROOT = r"D:\pythonPycharms\memomind-memory\ai-chat-history(chatgpt+gemini)\total memory"
INDEX_FILE = os.path.join(DATA_ROOT, "index.json")
MEMOMIND_URL = "http://127.0.0.1:19999/v1/default/banks/default/memories"
MAX_CONTENT_LEN = 3000       # 单条 retain 内容最大字符数
MAX_USER_MSGS = 20           # 最多采样的用户消息条数
MSG_PREVIEW_LEN = 200        # 每条消息截取前 N 字符


def load_index(path: str) -> list:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def extract_user_messages(messages: list) -> list[str]:
    """从 messages 数组中提取用户发的文本消息内容。"""
    user_msgs = []
    for msg in messages:
        if msg.get("role") != "user":
            continue
        content = (msg.get("content") or "").strip()
        if not content:
            continue
        # 跳过非文本类型（如图片）
        ct = msg.get("contentType", "text")
        if ct and ct not in ("text",):
            continue
        user_msgs.append(content)
    return user_msgs


def sample_messages(msgs: list[str], max_count: int) -> list[str]:
    """如果消息数超过 max_count，均匀采样。"""
    if len(msgs) <= max_count:
        return msgs
    # 均匀采样，始终包含第一条和最后一条
    step = (len(msgs) - 1) / (max_count - 1)
    indices = [round(i * step) for i in range(max_count)]
    # 去重并保持顺序
    seen = set()
    result = []
    for idx in indices:
        if idx not in seen:
            seen.add(idx)
            result.append(msgs[idx])
    return result


def build_content(entry: dict, user_msgs: list[str]) -> str:
    """构建 retain 的 content 字符串，控制在 MAX_CONTENT_LEN 以内。"""
    source = entry.get("source", "unknown")
    title = entry.get("title", "无标题")
    date = (entry.get("createdAt") or "")[:10]
    msg_count = entry.get("messageCount", 0)

    header = f"[{source}] {title} ({date}, {msg_count}条消息)"

    if not user_msgs:
        return header + "\n\n(无用户消息)"

    # 采样
    sampled = sample_messages(user_msgs, MAX_USER_MSGS)

    # 构建消息摘要行
    lines = []
    for msg in sampled:
        preview = msg[:MSG_PREVIEW_LEN]
        if len(msg) > MSG_PREVIEW_LEN:
            preview += "..."
        # 替换换行为空格，保持单行
        preview = preview.replace("\n", " ").replace("\r", "")
        lines.append(f"- {preview}")

    body = "\n".join(lines)
    content = f"{header}\n\n用户消息摘要：\n{body}"

    # 截断到 MAX_CONTENT_LEN
    if len(content) > MAX_CONTENT_LEN:
        content = content[: MAX_CONTENT_LEN - 3] + "..."

    return content


def retain(content: str, timestamp: str, document_id: str, tags: list[str],
           dry_run: bool = False) -> bool:
    """调用 MemoMind retain API。返回 True 表示成功。"""
    payload = {
        "items": [
            {
                "content": content,
                "timestamp": timestamp,
                "document_id": document_id,
                "context": "ai-chat-import",
                "tags": tags,
            }
        ],
        "async": True,
    }

    if dry_run:
        return True

    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        MEMOMIND_URL,
        data=data,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    try:
        resp = _opener.open(req, timeout=30)
        resp.read()
        return True
    except urllib.error.HTTPError as e:
        body = ""
        try:
            body = e.read().decode("utf-8", errors="replace")[:200]
        except Exception:
            pass
        print(f"  HTTP {e.code}: {body}")
        return False
    except Exception as e:
        print(f"  请求异常: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="将 AI 对话历史导入 MemoMind")
    parser.add_argument("--dry-run", action="store_true",
                        help="仅预览，不实际调用 API")
    parser.add_argument("--source", choices=["chatgpt", "gemini", "all"],
                        default="all", help="导入来源 (默认 all)")
    parser.add_argument("--delay", type=float, default=1.0,
                        help="每次请求间隔秒数 (默认 1.0)")
    parser.add_argument("--limit", type=int, default=0,
                        help="限制导入数量 (0=不限)")
    args = parser.parse_args()

    # 加载索引
    print(f"加载索引: {INDEX_FILE}")
    index = load_index(INDEX_FILE)
    print(f"索引共 {len(index)} 条对话")

    # 按 source 过滤
    if args.source != "all":
        index = [e for e in index if e.get("source") == args.source]
        print(f"过滤后 ({args.source}): {len(index)} 条")

    # limit
    if args.limit > 0:
        index = index[: args.limit]
        print(f"限制导入数量: {len(index)} 条")

    if args.dry_run:
        print("=== DRY RUN 模式 ===\n")

    ok_count = 0
    fail_count = 0
    total = len(index)

    for i, entry in enumerate(index, 1):
        conv_id = entry.get("id", "unknown")
        source = entry.get("source", "unknown")
        title = entry.get("title", "无标题")
        date = (entry.get("createdAt") or "")[:10]
        msg_count = entry.get("messageCount", 0)
        file_path = entry.get("filePath", "")

        full_path = os.path.join(DATA_ROOT, file_path)

        # 读取对话文件
        try:
            with open(full_path, "r", encoding="utf-8") as f:
                conv_data = json.load(f)
        except FileNotFoundError:
            print(f"[{i}/{total}] [{source}] {title} → 文件不存在: {file_path}")
            fail_count += 1
            continue
        except Exception as e:
            print(f"[{i}/{total}] [{source}] {title} → 读取失败: {e}")
            fail_count += 1
            continue

        messages = conv_data.get("messages", [])
        user_msgs = extract_user_messages(messages)
        content = build_content(entry, user_msgs)
        timestamp = entry.get("createdAt", "")
        tags = [source]

        if args.dry_run:
            content_preview = content[:120].replace("\n", "\\n")
            print(f"[{i}/{total}] [{source}] {title} ({date}, {msg_count} msgs, "
                  f"{len(user_msgs)} user msgs) → {len(content)} chars")
            print(f"  预览: {content_preview}...")
            ok_count += 1
            continue

        success = retain(content, timestamp, conv_id, tags, dry_run=False)
        status = "OK" if success else "FAIL"
        print(f"[{i}/{total}] [{source}] {title} ({date}, {msg_count} msgs) → {status}")

        if success:
            ok_count += 1
        else:
            fail_count += 1

        # 延迟（最后一条不延迟）
        if i < total and args.delay > 0:
            time.sleep(args.delay)

    print(f"\n完成! 成功: {ok_count}, 失败: {fail_count}, 总计: {total}")


if __name__ == "__main__":
    main()
