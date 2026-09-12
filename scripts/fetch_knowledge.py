"""从 photogov.net 抓取 knowledge 详情页 → data/knowledge.json

保留文章结构：h1/h2/h3、段落、列表，以及**表格（行/列）**。
用法：python3 scripts/fetch_knowledge.py [清单文件]
清单文件每行形如 requirements/us-passport-photo-requirements；缺省则自动从 sitemap 获取。
"""
import subprocess, json, time, re, sys
from bs4 import BeautifulSoup

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
CATS = ['faq', 'guides', 'requirements', 'standards']
SITEMAP = 'https://photogov.net/__sitemap__/blog.xml'


def fetch(url, tries=3):
    for a in range(tries):
        r = subprocess.run(['curl', '-sL', '--max-time', '25', '-H', f'User-Agent: {UA}', url],
                           capture_output=True, text=True)
        if r.stdout and len(r.stdout) > 3000:
            return r.stdout
        time.sleep(1.2 * (a + 1))
    return ''


def text_of(el):
    return ' '.join(el.get_text(' ', strip=True).split())


def parse_table(tb):
    rows = []
    for tr in tb.find_all('tr'):
        cells = [text_of(c) for c in tr.find_all(['td', 'th'])]
        if cells and any(cells):
            rows.append(cells)
    return rows


def parse(html):
    """返回 sections：{level:'h1'|'h2'|'h3'|'p'|'li'|'table', title, items|rows}"""
    s = BeautifulSoup(html, 'html.parser')
    for t in s(['script', 'style', 'noscript', 'svg']): t.decompose()
    for t in s(['header', 'footer', 'nav']): t.decompose()

    secs = []
    cur = None

    # 表格要先于文本节点处理，避免其内部 <p>/<li> 被重复采集
    for tb in s.find_all('table'):
        rows = parse_table(tb)
        if rows:
            tb.replace_with(s.new_tag('pg-table-slot'))

    for el in s.find_all(['h1', 'h2', 'h3', 'p', 'li', 'pg-table-slot']):
        if el.name in ('p', 'li') and el.find_parent(['table', 'pg-table-slot']):
            continue
        if el.name == 'pg-table-slot':
            cur = None  # 表格独立成节，不再向其追加文本
            continue
        if el.find_parent(['li', 'p']) and el.name in ('p', 'li'):
            continue
        tag = el.name
        tx = text_of(el)
        if tag in ('h1', 'h2', 'h3'):
            cur = {'level': tag, 'title': tx, 'items': []}
            secs.append(cur)
        elif cur is not None and tx:
            cur['items'].append(tx)

    return secs


def parse_with_tables(html):
    """两遍：先用占位符顺序插值表格，最终产出含 rows 的 sections"""
    s = BeautifulSoup(html, 'html.parser')
    for t in s(['script', 'style', 'noscript', 'svg']): t.decompose()
    for t in s(['header', 'footer', 'nav']): t.decompose()

    # 收集表格并替换为带序号标记的占位标签
    tables = []
    for tb in s.find_all('table'):
        rows = parse_table(tb)
        idx = len(tables)
        tables.append(rows)
        slot = s.new_tag(f'pgtable{idx}')
        tb.replace_with(slot)

    secs = []
    cur = None
    for el in s.find_all(['h1', 'h2', 'h3', 'p', 'li'] + [f'pgtable{i}' for i in range(len(tables))]):
        name = el.name
        if name in ('p', 'li'):
            if el.find_parent(['li', 'p']):
                continue
        if name.startswith('pgtable'):
            idx = int(name.replace('pgtable', ''))
            rows = tables[idx]
            if rows:
                secs.append({'level': 'table', 'title': '', 'items': [], 'rows': rows})
            cur = None
            continue
        tx = text_of(el)
        if name in ('h1', 'h2', 'h3'):
            cur = {'level': name, 'title': tx, 'items': []}
            secs.append(cur)
        elif cur is not None and tx:
            cur['items'].append(tx)
    return secs


def slugs_from_sitemap():
    xml = fetch(SITEMAP)
    out = set()
    if xml:
        for loc in re.findall(r'<loc>([^<]+)</loc>', xml):
            m = re.search(r'photogov\.net/knowledge/(faq|guides|requirements|standards)/([a-z0-9-]+)/?$', loc)
            if m:
                out.add(f'{m.group(1)}/{m.group(2)}')
    return out


def main():
    if len(sys.argv) > 1 and sys.argv[1].endswith('.txt'):
        want = [l.strip() for l in open(sys.argv[1]) if l.strip()]
    else:
        want = sorted(slugs_from_sitemap())
    print(f'待抓 {len(want)} 篇', flush=True)

    out = {}
    for i, key in enumerate(want, 1):
        cat, slug = key.split('/', 1)
        url = f'https://www.photogov.net/knowledge/{cat}/{slug}/'
        html = fetch(url)
        if not html:
            print(f'  ✗ [{i}/{len(want)}] {key} 失败', flush=True)
            continue
        secs = parse_with_tables(html)
        n = sum(len(x['items']) for x in secs) + sum(len(x.get('rows', [])) for x in secs)
        ntables = len([x for x in secs if x['level'] == 'table'])
        if n < 3:
            print(f'  ✗ [{i}/{len(want)}] {key} 过少({n})', flush=True)
            continue
        h1 = secs[0]['title'] if secs and secs[0]['level'] == 'h1' else ''
        out[key] = {'cat': cat, 'slug': slug, 'h1': h1, 'sections': secs}
        print(f'  ✓ [{i}/{len(want)}] {key}  节点={n} 表格={ntables}', flush=True)
        time.sleep(0.3)

    json.dump(out, open('data/knowledge.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    total_t = sum(len(x.get('rows', [])) for e in out.values() for x in e['sections'])
    ntab = len([1 for e in out.values() for x in e['sections'] if x['level'] == 'table'])
    print(f'\n完成 {len(out)} 篇，其中 {ntab} 个表格（共 {total_t} 行）→ data/knowledge.json', flush=True)


if __name__ == '__main__':
    main()
