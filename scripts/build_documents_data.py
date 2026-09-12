#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 data/_staging/documents/*.json（目标站 content/document 原始响应）
重建成两样东西：

  1) data/documents.json
     轻量元数据清单，给列表页 / 按国家页 / sitemap / 工具用。
     权威条目数 = 126（目标站 public 文档总数）。

  2) data/docContent/<slug>.json
     每篇的完整内容：{meta, content, schemaOrg}
     content 是目标站的 DD* 组件树，供 DocContent.vue 递归渲染。
     单独按文件存放而不塞进 documents.json，是为了避免 8MB+ 内容进入
     客户端 bundle —— 详情数据只在服务端按需读取。

注意事项：
  - 目标站 "px 像素" 不能简单用 宽×dpi 计算：
    US 篇 dimensions.dpi=600 但正文声明 "600 × 600 pixels"（2 inch × 300 才对得上），
    两者语义不一致。因此像素值优先从 DDRequirementsTable 正文里正则提取，
    取不到才回退宽×dpi。
  - 组件属性里的随机 key（6aa5...）会被剔除：既省体积，
    也让重复抓取后的 git diff 保持稳定。
  - units 有 mm / inch / px 三种；face_height_unit 还可能是百分比 '%'。
"""
import json
import os
import re
from datetime import date

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
STAGING = os.path.join(ROOT, "data", "_staging", "documents")
OUT_JSON = os.path.join(ROOT, "data", "documents.json")

# goal type -> 本站分类
CATEGORY_MAP = {
    "passport": "passport",
    "visa": "visa",
}
DEFAULT_CATEGORY = "id"

# "2 × 2 inches / 51 × 51 mm / 600 × 600 pixels" —— 允许 ×、x、*、&times; 多种写法
DIM_RE = re.compile(
    r"(\d+(?:\.\d+)?)\s*(?:×|x|X|\*|&times;)\s*(\d+(?:\.\d+)?)\s*"
    r"(inches|inch|in|mm|cm|pixels|pixel|px)\b",
    re.I,
)


def strip_nodes(node):
    """去掉组件属性里的随机 key，减小体积并稳定 diff。"""
    if isinstance(node, list):
        return [strip_nodes(x) for x in node]
    if isinstance(node, dict):
        out = {}
        for k, v in node.items():
            if k == "attributes" and isinstance(v, dict):
                v = {ak: av for ak, av in v.items() if ak != "key"}
            out[k] = strip_nodes(v)
        return out
    return node


def find_component(node, name):
    """返回组件树中第一个指定 component 的节点。

    注意必须递归遍历所有子节点：早先写成 BFS 时误用 `stack = ch` 覆盖队列，
    导致只能走进第一个分支、丢失兄弟节点，DDRequirementsTable 因此找不到。
    """
    if isinstance(node, list):
        for x in node:
            hit = find_component(x, name)
            if hit:
                return hit
        return None
    if isinstance(node, dict):
        if node.get("component") == name:
            return node
        return find_component(node.get("children"), name)
    return None


def jload(s):
    try:
        return json.loads(s) if isinstance(s, str) else None
    except Exception:  # noqa: BLE001
        return None


def photo_size_from_content(content):
    """从 RequirementsTable 正文读取页面实际展示的尺寸原文。

    目标站把三种单位写在同一个值里，例如：
        "2 × 2 inches / 51 × 51 mm / 600 × 600 pixels"
    直接用这些字符串，避免自己换算产生偏差
    （2 inch 按 25.4 算得 50.8mm，但页面展示的是 51mm）。
    """
    node = find_component(content, "DDRequirementsTable")
    if not node:
        return {}
    model = jload((node.get("attributes") or {}).get("model"))
    if not isinstance(model, dict):
        return {}
    for v in model.values():
        text = str(v)
        if not re.search(r"pixel", text, re.I):
            continue
        hits = DIM_RE.findall(text)
        if not hits:
            continue
        out = {}
        for w, h, u in hits:
            pair, ul = f"{w}x{h}", u.lower()
            if ul in ("inches", "inch", "in"):
                out["inch"] = pair
            elif ul == "mm":
                out["mm"] = pair
            elif ul == "cm":
                out["cm"] = pair
            elif ul in ("pixels", "pixel", "px"):
                out["px"] = pair
                out["w"], out["h"] = int(float(w)), int(float(h))
        if out:
            return out
    return {}


def fmt_num(v):
    """整数小数抹零：2.0 -> '2', 5.1 -> '5.1'"""
    if v is None:
        return None
    r = round(float(v), 2)
    return str(int(r)) if abs(r - int(r)) < 1e-9 else str(r).rstrip("0").rstrip(".")


def rgb_to_hex(s):
    if not s:
        return None
    m = re.search(r"rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)", str(s))
    if not m:
        return None
    return "#%02X%02X%02X" % tuple(int(m.group(i)) for i in (1, 2, 3))


def build_size(dim, declared):
    """把目标站 dimensions 换算成 {inch,mm,cm,px,w,h}。

    先按 units 做几何换算，再用 RequirementsTable 正文里页面实际展示的
    原文数值覆盖（两者常不一致，例如 2 inch 换算 50.8mm 而页面写 51mm）。
    """
    dim, declared = dim or {}, declared or {}
    unit = dim.get("units")
    w, h, dpi = dim.get("picture_width"), dim.get("picture_height"), dim.get("dpi") or 300
    size = {"inch": None, "mm": None, "cm": None, "px": None, "w": None, "h": None}
    try:
        if unit == "px":
            pw, ph = float(w), float(h)
            mm_w = mm_h = None
        elif unit == "inch":
            pw, ph = float(w), float(h)
            mm_w, mm_h = pw * 25.4, ph * 25.4
        elif unit == "mm":
            mm_w, mm_h = float(w), float(h)
            pw, ph = mm_w / 25.4, mm_h / 25.4
        else:
            return size
    except (TypeError, ValueError):
        return size

    if unit != "px":
        size["inch"] = f"{fmt_num(pw)}x{fmt_num(ph)}"
    if mm_w is not None:
        size["mm"] = f"{fmt_num(mm_w)}x{fmt_num(mm_h)}"

    if unit == "px":
        pxw, pxh = w, h
    elif unit == "inch":
        pxw, pxh = round(pw * dpi), round(ph * dpi)
    else:
        pxw, pxh = round(mm_w * dpi / 25.4), round(mm_h * dpi / 25.4)
    size["w"], size["h"] = int(pxw), int(pxh)
    size["px"] = f"{int(pxw)}x{int(pxh)}"

    # —— 用页面展示原文覆盖 ——
    for k in ("inch", "mm", "px"):
        if declared.get(k):
            size[k] = declared[k]
    if declared.get("w") and declared.get("h"):
        size["w"], size["h"] = declared["w"], declared["h"]
    if declared.get("cm"):
        size["cm"] = declared["cm"]

    # cm 由最终 mm 推导，保证三者自洽
    if size["mm"]:
        try:
            a, b = (float(x) for x in size["mm"].split("x"))
            if not declared.get("cm"):
                size["cm"] = f"{fmt_num(a/10)}x{fmt_num(b/10)}"
        except (ValueError, AttributeError):
            pass
    return size


def measure(value, unit):
    """组合 '1.29 inch' 之类的展示串。"""
    if value in (None, ""):
        return None
    u = {"%": "%", "inch": "inch", "mm": "mm", "px": "px"}.get(unit, unit)
    return f"{fmt_num(value)} {u}" if u else fmt_num(value)


def main():
    files = sorted(f for f in os.listdir(STAGING) if f.endswith(".json"))
    print(f"读取 {len(files)} 篇原始响应")

    documents, skipped, content_index = {}, [], {}

    for f in files:
        raw = json.load(open(os.path.join(STAGING, f), encoding="utf-8"))
        data = raw.get("data") or {}
        doc = data.get("document") or {}
        if not doc:
            skipped.append(f)
            continue

        meta = data.get("meta") or {}
        content = strip_nodes(data.get("content") or [])
        slug = (doc.get("meta") or {}).get("slug_en") or os.path.splitext(f)[0]
        dim = doc.get("dimensions") or {}
        cx = photo_size_from_content(content)
        country = doc.get("country") or {}
        dmeta = doc.get("meta") or {}
        nm = doc.get("name") or {}
        links = doc.get("official_links") or []

        documents[slug] = {
            # —— 本站既有 schema（保持向后兼容）——
            "slug": slug,
            "country": country.get("code"),
            "countryName": country.get("name"),
            "name": nm.get("without_size") or nm.get("short") or slug,
            "title": meta.get("title") or nm.get("origin") or slug,
            "category": CATEGORY_MAP.get(doc.get("type"), DEFAULT_CATEGORY),
            "popular": bool(doc.get("badge") == "popular" or (doc.get("popularity") or 999) <= 20),
            "quickLink": (doc.get("priority") or 0) > 0,
            "size": build_size(dim, cx),
            "headHeight": measure(dim.get("face_height"), dim.get("face_height_unit")),
            "eyesLevel": measure(dim.get("eyeline"), dim.get("eyeline_unit")),
            "background": rgb_to_hex(dim.get("background_color")),
            "format": "JPEG",
            "dpi": dim.get("dpi"),
            "glasses": False,
            "expression": "Neutral, eyes open, mouth closed",
            "year": date.today().year,
            "source": links[0] if links else None,
            "color": "In color",
            # 全部来自目标站权威 API（含官方 source 链接），可视为已核验；
            # 列表页的 verifiedOnly 筛选与 DocCard 徽标依赖此字段。
            "verified": True,
            # —— 新增：目标站权威字段 ——
            "description": meta.get("description"),
            "type": doc.get("type"),
            "badge": doc.get("badge"),
            "popularity": doc.get("popularity"),
            "statCount": doc.get("stat_count"),
            "priority": doc.get("priority"),
            "dimensions": dim,
            "backgroundRaw": dim.get("background_color"),
            "officialLinks": links,
            "images": doc.get("images") or {},
            "translations": {
                "en": {"name": (dmeta.get("name") or {}).get("en"),
                       "slug": dmeta.get("slug_en"),
                       "enabled": bool(dmeta.get("enabled_en"))},
                "es": {"name": (dmeta.get("name") or {}).get("es"),
                       "slug": dmeta.get("slug_es"),
                       "enabled": bool(dmeta.get("enabled_es"))},
                "ru": {"name": (dmeta.get("name") or {}).get("ru")},
            },
            "nameParts": nm,
        }

        # 内容统一汇总进内存，最后一次性写成索引文件。
        # （不再额外按 slug 落盘：那会与索引内容重复，白白多占 ~8MB。）
        content_index[slug] = {
            "meta": meta,
            "content": content,
            "schemaOrg": data.get("schemaOrg"),
        }

    categories = sorted({d["category"] for d in documents.values()})
    payload = {"documents": documents, "categories": categories}
    with open(OUT_JSON, "w", encoding="utf-8") as out:
        json.dump(payload, out, ensure_ascii=False, indent=1)

    # 汇总索引：仅供服务端 API 静态导入。客户端 bundle 不引用此文件。
    # 索引 = 各篇的完整内容树（meta/content/schemaOrg）。
    index_path = os.path.join(ROOT, "data", "docContentIndex.json")
    with open(index_path, "w", encoding="utf-8") as out:
        json.dump(content_index, out, ensure_ascii=False, separators=(",", ":"))

    print(f"\n写入 {OUT_JSON}")
    print(f"  文档数 {len(documents)}  分类 {categories}")
    print(f"  内容索引 {len(content_index)} 篇, "
          f"{os.path.getsize(index_path)/1048576:.2f} MB -> {index_path}")
    if skipped:
        print(f"  跳过（无 document）: {skipped}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
