#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
抓取 photogov.net 博客/知识文章的权威内容。

站点内容其实是**两套**，都走 Blog.* 接口（注意别混）：
  1. Blog.GetPosts / Blog.GetPost —— 博客文章
     /blog/<slug>/ 详情页，分类为 requirements / guides / standards / faq
  2. Blog.GetHubPost —— "hub" 文章（即本站的 knowledge 页）
     需要 post_slug + document_slug，目前尚未摸到可用取值

调用契约（与 document 接口同源，同样顽固）：
  - 必须用 apex 域 https://photogov.net，www 会 301 且 requests 跟随会把 POST 降级成 GET
  - 参数走 URL query；POST body 会被忽略（表现为"xxx 字段必填"）
  - 列表分页参数不是 page/per_page/count，而是 **limit**
      ?limit=100   -> 一次返回全部 60 篇
      ?page=2      -> 无效，始终返回第 1 页
      ?category_slug=guides -> 按分类过滤
  - 详情页必须 **slug 与 category_slug 同时给**，缺 category_slug 会返回
    "Post not found"（400），很容易误以为文章不存在

产出：
  data/_staging/blog/<category>__<slug>.json  每篇完整数据
  data/_staging/blog_list.json                列表快照
"""
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests

BASE = "https://photogov.net/api/app/v1"
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT_DIR = os.path.join(ROOT, "data", "_staging", "blog")
HUB_DIR = os.path.join(ROOT, "data", "_staging", "blog_hub")
LIST_FILE = os.path.join(ROOT, "data", "_staging", "blog_list.json")

HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    "Referer": "https://photogov.net/",
}


def get(endpoint: str, params: dict, timeout: int = 30, retries: int = 3):
    """调目标站接口：params 必须放 query。"""
    for attempt in range(1, retries + 1):
        try:
            r = requests.post(f"{BASE}/{endpoint}", params=params, headers=HEADERS,
                              data=b"{}", timeout=timeout)
            body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
            return r.status_code, body
        except Exception as e:  # noqa: BLE001
            if attempt == retries:
                return 0, {"error": True, "message": f"{type(e).__name__}: {e}"}
            time.sleep(1.5 * attempt)
    return 0, {"error": True, "message": "未知失败"}


def fetch_list(limit: int = 100):
    code, body = get("blog/get-posts", {"limit": limit})
    if code != 200 or not body.get("data"):
        raise SystemExit(f"列表抓取失败: HTTP {code} {str(body)[:200]}")
    return body["data"]


def fetch_hub(document_slug: str, post_slug: str, retries: int = 3):
    """Hub 文章（挂在文档下的子页，如 /documents/digital-passport-photo/requirements/）。

    这两种内容在目标站是分开的：
      - placement_type == 'blog'     -> Blog.GetPost（普通博客）
      - placement_type == 'document' -> Blog.GetHubPost（文档子页）
    Hub 接口必须同时给 document_slug + post_slug，缺一不可。
    """
    for attempt in range(1, retries + 1):
        code, body = get("blog/get-hub-post",
                         {"document_slug": document_slug, "post_slug": post_slug})
        if code == 200 and (body.get("data") or {}).get("post"):
            return body, None
        if attempt == retries:
            return None, f"HTTP {code} {(body.get('message') or str(body))[:120]}"
        time.sleep(1.5 * attempt)
    return None, "未知失败"


def fetch_detail(item: dict, retries: int = 3):
    slug = item.get("slug")
    cat = (item.get("category") or {}).get("slug")
    if not slug or not cat:
        return item, None, "缺少 slug 或 category_slug"
    for attempt in range(1, retries + 1):
        code, body = get("blog/get-post", {"slug": slug, "category_slug": cat})
        if code == 200 and (body.get("data") or {}).get("post"):
            return item, body, None
        if attempt == retries:
            msg = (body.get("message") or str(body))[:120]
            return item, None, f"HTTP {code} {msg}"
        time.sleep(1.5 * attempt)
    return item, None, "未知失败"


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    data = fetch_list()
    posts = data.get("posts") or []
    cats = data.get("categories") or []
    with open(LIST_FILE, "w", encoding="utf-8") as f:
        json.dump({"categories": cats, "posts": posts}, f, ensure_ascii=False, indent=1)

    print(f"列表：{len(posts)} 篇文章，{len(cats)} 个分类")
    for c in cats:
        print(f"   {c.get('slug')}: {c.get('name')}")

    # 带 document placement 的文章不是 Blog.GetPost 的对象，而是文档子页（hub），
    # 必须从普通博客抓取里剔除，否则必然 "Post not found"。
    blog_posts = [
        p for p in posts
        if not any((pl or {}).get("placement_type") == "document" for pl in (p.get("placements") or []))
    ]
    print(f"其中普通博客 {len(blog_posts)} 篇（其余为文档子页，走 hub 接口）")

    ok, fail = 0, []
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=4) as pool:
        futs = {pool.submit(fetch_detail, p): p for p in blog_posts}
        for i, fut in enumerate(as_completed(futs), 1):
            item, body, err = fut.result()
            if body:
                post = body["data"]["post"]
                cat = (item.get("category") or {}).get("slug") or "uncategorized"
                name = f"{cat}__{item.get('slug')}.json"
                with open(os.path.join(OUT_DIR, name), "w", encoding="utf-8") as f:
                    json.dump(post, f, ensure_ascii=False, separators=(",", ":"))
                ok += 1
            else:
                fail.append((item.get("slug"), err))
            if i % 10 == 0 or i == len(blog_posts):
                print(f"  ...{i}/{len(blog_posts)} 成功={ok} 失败={len(fail)} 用时={time.time()-t0:.0f}s")

    # —— 文档子页（hub 文章） ——
    hub_pairs = []
    for p in posts:
        for pl in p.get("placements") or []:
            if pl.get("placement_type") == "document" and pl.get("placement_key") and pl.get("slug"):
                hub_pairs.append((pl["placement_key"], pl["slug"], p))

    os.makedirs(HUB_DIR, exist_ok=True)
    print(f"\ndocument 子页（hub 文章）：{len(hub_pairs)} 个")
    hub_ok, hub_fail = 0, []
    for doc, sub, meta in hub_pairs:
        body, err = fetch_hub(doc, sub)
        if body:
            merged = {"placement_doc": doc, "placement_slug": sub, "list_meta": meta, **body["data"]}
            with open(os.path.join(HUB_DIR, f"{doc}__{sub}.json"), "w", encoding="utf-8") as f:
                json.dump(merged, f, ensure_ascii=False, separators=(",", ":"))
            hub_ok += 1
        else:
            hub_fail.append((f"{doc}/{sub}", err))
    print(f"  hub 成功 {hub_ok} / 失败 {len(hub_fail)}")
    for s, e in hub_fail[:10]:
        print(f"   FAIL {s}: {e}")

    print(f"\n完成：博客成功 {ok} / 失败 {len(fail)}")
    for s, e in fail[:20]:
        print(f"   FAIL {s}: {e}")
    return 1 if (fail or hub_fail) else 0


if __name__ == "__main__":
    sys.exit(main())
