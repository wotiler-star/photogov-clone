#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从 photogov.net 抓取全部文档的权威数据（129 = 127 文档 + 可能的别名）。

关键发现（逆向结论，勿忘）：
  1. 目标站这套 API 只接受 **URL query 传参**，POST body 会被完全忽略。
     即必须 POST <BASE>?document_slug=<slug> 而不是在 body 里放 JSON。
  2. 端点枚举藏在前端 bundle（/_nuxt/Ca1PH-2w.js）里：
        Database.Documents      = /api/app/v1/database/documents
        Content.Document        = /api/app/v1/content/document
        Content.PopularDocuments= /api/app/v1/content/popular-documents
        Content.NavLinks        = /api/app/v1/content/nav-links
  3. content/document 返回 {document, meta, content, schemaOrg}：
        - document : 元数据（country / dimensions / 多语言 name+slug / images）
        - meta     : 页面 title + description
        - content  : 该页完整组件树（DD* 组件，约 101KB/篇）
        - schemaOrg: FAQPage + Product 的 JSON-LD
  4. 目标站文档总数权威值 = popular-documents 的 count_all = **127**。

踩坑记录（都是真金白银的时间）：
  - 必须用 apex 域 https://photogov.net，不能用 www.photogov.net：
    www 会 301 跳到 apex，而 requests 跟随 301 时会把 POST 降级成 GET，
    最终拿到 405 Method Not Allowed（curl -L 则不降级，所以 curl 能过）。
  - 参数必须走 query；放 POST body 会被完全忽略，表现为"xxx 字段必填"。

用法：
    python3 scripts/fetch_documents_api.py            # 抓全部
    python3 scripts/fetch_documents_api.py --limit 5  # 试抓 5 篇
"""
import argparse
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests

BASE_URL = "https://photogov.net/api/app/v1/content/document"
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "_staging", "documents")
SLUG_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "_staging", "doc_slugs.txt")

HEADERS = {
    # 注意：Content-Type 必须带，目标站框架按内容类型做路由，
    # 缺失时即使方法是 POST 也会返回 405 Method Not Allowed。
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    "Referer": "https://www.photogov.net/",
}


def load_slugs():
    """优先用已落盘的 slug 清单，否则退化到 sitemap 缓存。"""
    if os.path.exists(SLUG_FILE):
        return [s.strip() for s in open(SLUG_FILE, encoding="utf-8") if s.strip()]
    raise SystemExit(
        f"缺少 slug 清单：{SLUG_FILE}\n"
        "请先从目标站 sitemap 提取 127 个 /documents/<slug>/ 路径。"
    )


def fetch_one(slug: str, timeout: int = 30, retries: int = 3):
    """单篇抓取，带退避重试。"""
    for attempt in range(1, retries + 1):
        try:
            r = requests.post(
                BASE_URL,
                params={"document_slug": slug},  # ← 必须走 query
                headers=HEADERS,
                data=b"{}",
                timeout=timeout,
            )
            if r.status_code == 200:
                payload = r.json()
                if payload.get("data") and payload["data"].get("document"):
                    return slug, payload, None
                return slug, None, "响应缺 data.document"
            return slug, None, f"HTTP {r.status_code}: {r.text[:120]}"
        except Exception as e:  # noqa: BLE001 - 网络类异常统一重试
            if attempt == retries:
                return slug, None, f"{type(e).__name__}: {e}"
            time.sleep(1.5 * attempt)
    return slug, None, "未知失败"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0, help="只抓前 N 篇（调试用）")
    ap.add_argument("--workers", type=int, default=4, help="并发数，别太猛避免被限流")
    args = ap.parse_args()

    slugs = load_slugs()
    if args.limit:
        slugs = slugs[: args.limit]

    os.makedirs(OUT_DIR, exist_ok=True)
    print(f"待抓 {len(slugs)} 篇 -> {os.path.abspath(OUT_DIR)}")

    ok, fail = 0, []
    t_start = time.time()

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(fetch_one, s): s for s in slugs}
        for i, fut in enumerate(as_completed(futures), 1):
            slug, payload, err = fut.result()
            if payload:
                with open(os.path.join(OUT_DIR, f"{slug}.json"), "w", encoding="utf-8") as f:
                    json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
                ok += 1
            else:
                fail.append((slug, err))
            if i % 10 == 0 or i == len(slugs):
                print(f"  ...{i}/{len(slugs)} 成功={ok} 失败={len(fail)} 用时={time.time()-t_start:.0f}s")

    print(f"\n完成：成功 {ok} / 失败 {len(fail)}")
    for s, e in fail[:20]:
        print(f"   FAIL {s}: {e}")
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
