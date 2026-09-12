#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
对比 本地生成的文档详情页 与 目标站 photogov.net 对应页面的结构差异。

用法（本地服务需先启动：node .output/server/index.mjs）：
    python3 scripts/compare_doc.py us-passport-photo
    python3 scripts/compare_doc.py us-passport-photo at-passport-photo --locale en

关注点：
  - H1 是否逐字一致
  - H2/H3 章节集合是否有缺失/多余（内容覆盖度的核心指标）
  - 要求表格行数、FAQ 条数、图片数等结构性指标
"""
import argparse
import re
import sys

import requests
from bs4 import BeautifulSoup

TARGET_TPL = "https://photogov.net/documents/{slug}/"


def fetch_html(url: str) -> str:
    r = requests.get(url, timeout=40, headers={
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        "Accept-Language": "en",
    })
    r.raise_for_status()
    return r.text


def headings(html: str, tag: str):
    soup = BeautifulSoup(html, "html.parser")
    out = []
    for el in soup.find_all(tag):
        t = re.sub(r"\s+", " ", el.get_text(" ", strip=True))
        if t:
            out.append(t)
    return out


def metrics(html: str):
    soup = BeautifulSoup(html, "html.parser")
    for bad in soup(["script", "style", "noscript"]):
        bad.decompose()
    return {
        "h1": len(soup.find_all("h1")),
        "h2": len(soup.find_all("h2")),
        "h3": len(soup.find_all("h3")),
        "p": len(soup.find_all("p")),
        "li": len(soup.find_all("li")),
        "table": len(soup.find_all("table")),
        "tr": len(soup.find_all("tr")),
        "img": len(soup.find_all("img")),
        "details": len(soup.find_all("details")),
        "text_len": len(re.sub(r"\s+", " ", soup.get_text(" ", strip=True))),
    }


def compare(slug: str, base: str, locale: str):
    local_url = f"{base.rstrip('/')}/{locale}/documents/{slug}"
    target_url = TARGET_TPL.format(slug=slug)

    t_html, l_html = fetch_html(target_url), fetch_html(local_url)
    t_m, l_m = metrics(t_html), metrics(l_html)
    t_h1, l_h1 = headings(t_html, "h1"), headings(l_html, "h1")
    t_h2, l_h2 = headings(t_html, "h2"), headings(l_html, "h2")

    print(f"\n{'='*72}\n{slug}\n{'='*72}")
    print(f"{'指标':<12}{'目标站':>10}{'本地':>10}{'差值':>10}")
    for k in t_m:
        d = l_m[k] - t_m[k]
        flag = "" if d == 0 else ("  <<<" if abs(d) > max(3, t_m[k] * 0.3) else "")
        print(f"{k:<12}{t_m[k]:>10}{l_m[k]:>10}{d:>+10}{flag}")

    print("\nH1 目标站:", t_h1[:1])
    print("H1 本地  :", l_h1[:1])
    print("H1 逐字一致:", "是" if t_h1[:1] == l_h1[:1] else "否")

    ts, ls = set(t_h2), set(l_h2)
    missing, extra = sorted(ts - ls), sorted(ls - ts)
    print(f"\nH2 章节：目标 {len(ts)} 个 / 本地 {len(ls)} 个")
    if missing:
        print(f"  本地缺失 {len(missing)} 个：")
        for h in missing[:15]:
            print(f"    - {h[:100]}")
    if extra:
        print(f"  本地多余 {len(extra)} 个：")
        for h in extra[:10]:
            print(f"    + {h[:100]}")
    if not missing and not extra:
        print("  H2 章节集合完全一致")
    return len(missing), len(extra)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slugs", nargs="+")
    ap.add_argument("--base", default="http://localhost:3000")
    ap.add_argument("--locale", default="en")
    args = ap.parse_args()

    bad = 0
    for s in args.slugs:
        try:
            m, e = compare(s, args.base, args.locale)
            bad += m
        except Exception as exc:  # noqa: BLE001
            print(f"\n{s}: 失败 -> {type(exc).__name__}: {exc}")
            bad += 1
    print(f"\n>>> 合计缺失/失败项: {bad}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
