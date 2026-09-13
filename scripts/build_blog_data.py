#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 data/_staging/blog/*.json（54 篇博客）与 blog_hub/*.json（6 篇文档子页）
重建成两份产物：

  1) data/blog.json
     轻量列表，字段与原有实现保持一致（categories 为字符串数组、
     posts 含 slug/title/excerpt/category/date/author/readTime/cover/tags/accent），
     保证 pages/blog/index.vue 与 BlogCard.vue 无需改动即可工作。

  2) data/blogContentIndex.json
     每篇的完整正文（HTML）、FAQ、目录、schemaOrg、作者信息。
     仅供服务端 API 静态引用，避免约 3MB 正文进入客户端 bundle。

注意：目标站的正文 content 是 **HTML 字符串**（不像文档页那样是 DD* 组件树），
直接 v-html 渲染即可；重抓时运行 scripts/fetch_blog_api.py 重新生成 staging。
"""
import glob
import json
import os
import re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BLOG_DIR = os.path.join(ROOT, "data", "_staging", "blog")
HUB_DIR = os.path.join(ROOT, "data", "_staging", "blog_hub")
OUT_LIST = os.path.join(ROOT, "data", "blog.json")
OUT_INDEX = os.path.join(ROOT, "data", "blogContentIndex.json")

TAG_STRIP = re.compile(r"<[^>]+>")


def to_date(s: str) -> str:
    """'2026-08-24 09:00:00' -> '2026-08-24'"""
    return (s or "").split(" ")[0]


def short_time(read_minutes) -> str:
    try:
        n = int(read_minutes)
    except (TypeError, ValueError):
        return ""
    return f"{n} min read" if n else ""


def build():
    index, posts_meta = {}, []

    for path in sorted(glob.glob(os.path.join(BLOG_DIR, "*.json"))):
        p = json.load(open(path, encoding="utf-8"))
        cat = p.get("category") or {}
        cat_slug, cat_name = cat.get("slug"), cat.get("name")
        slug = p.get("slug")
        if not slug:
            continue
        # 目标站偶有同名 slug 落在不同分类下，故索引用 cat/slug 复合键
        key = f"{cat_slug or 'uncategorized'}/{slug}"
        author = p.get("author") or {}

        index[key] = {
            "type": "blog",
            "categorySlug": cat_slug,
            "slug": slug,
            "content": p.get("content") or "",
            "faq": p.get("faq"),
            "toc": p.get("table_of_contents") or [],
            "schemaOrg": p.get("schema_org") or [],
            "meta": p.get("meta") or {},
            "cover": p.get("cover_url"),
            "publishedAt": p.get("published_at"),
            "readingTime": p.get("reading_time"),
            "views": p.get("views"),
            "ratingAverage": p.get("rating_average"),
            "ratingCount": p.get("rating_count"),
            "author": author,
            "reviewer": p.get("reviewer"),
        }

        posts_meta.append({
            "slug": slug,
            "title": p.get("title") or "",
            "excerpt": p.get("excerpt") or "",
            "category": cat_name or "",
            "categorySlug": cat_slug or "",
            "date": to_date(p.get("published_at")),
            "author": author.get("name") or "",
            "readTime": short_time(p.get("reading_time")),
            "tags": [],
            "cover": p.get("cover_url"),
            "accent": "primary",
            "views": p.get("views") or 0,
            "ratingAverage": p.get("rating_average"),
            "ratingCount": p.get("rating_count") or 0,
            "body": "",  # 正文不进列表，改由 /api 按需下发
        })

    # —— 文档子页（hub） ——
    hub_count = 0
    for path in sorted(glob.glob(os.path.join(HUB_DIR, "*.json"))):
        blob = json.load(open(path, encoding="utf-8"))
        p = blob.get("post") or {}
        doc = blob.get("placement_doc")
        sub = blob.get("placement_slug") or p.get("slug")
        if not doc or not sub:
            continue
        author = p.get("author") or {}
        key = f"hub/{doc}/{sub}"
        index[key] = {
            "type": "hub",
            "documentSlug": doc,
            "slug": sub,
            "content": p.get("content") or "",
            "faq": p.get("faq"),
            "toc": p.get("table_of_contents") or [],
            "schemaOrg": blob.get("schemaOrg") or p.get("schema_org") or [],
            "meta": p.get("meta") or {},
            "cover": p.get("cover_url"),
            "publishedAt": p.get("published_at"),
            "readingTime": p.get("reading_time"),
            "views": p.get("views"),
            "ratingAverage": p.get("rating_average"),
            "ratingCount": p.get("rating_count"),
            "author": author,
            "reviewer": p.get("reviewer"),
            "document": blob.get("document"),
        }
        hub_count += 1

    posts_meta.sort(key=lambda x: x.get("date") or "", reverse=True)
    categories = []
    for pm in posts_meta:
        if pm["category"] and pm["category"] not in categories:
            categories.append(pm["category"])

    with open(OUT_LIST, "w", encoding="utf-8") as f:
        json.dump({"categories": categories, "posts": posts_meta}, f,
                  ensure_ascii=False, indent=1)
    with open(OUT_INDEX, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, separators=(",", ":"))

    print(f"写入 {OUT_LIST}")
    print(f"   posts {len(posts_meta)} 篇，categories {categories}")
    print(f"写入 {OUT_INDEX}")
    print(f"   索引 {len(index)} 条（博客 {len(index)-hub_count} + hub {hub_count}），"
          f"{os.path.getsize(OUT_INDEX)/1048576:.2f} MB")


if __name__ == "__main__":
    build()
