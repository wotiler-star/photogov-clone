"""从 photogov.net 抓取 knowledge 详情页内容，生成 data/knowledge.json"""
import subprocess, json, time, re, os, sys
from bs4 import BeautifulSoup

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
CATS = ['faq', 'guides', 'requirements', 'standards']

def fetch(url):
    for attempt in range(3):
        r = subprocess.run(['curl', '-sL', '--max-time', '25', '-H', f'User-Agent: {UA}', url],
                           capture_output=True, text=True)
        if r.stdout and len(r.stdout) > 3000:
            return r.stdout
        time.sleep(1.2 * (attempt + 1))
    return ''

def parse(html):
    s = BeautifulSoup(html, 'html.parser')
    for t in s(['script', 'style', 'noscript', 'svg']): t.decompose()
    for t in s(['header', 'footer', 'nav']): t.decompose()
    secs = []
    cur = None
    for el in s.find_all(['h1', 'h2', 'h3', 'p', 'li']):
        if el.find_parent(['li', 'p']): continue
        tag = el.name
        tx = ' '.join(el.get_text(' ', strip=True).split())
        if not tx: continue
        if tag in ('h1', 'h2', 'h3'):
            cur = {'level': tag, 'title': tx, 'items': []}
            secs.append(cur)
        elif cur is not None:
            cur['items'].append(tx)
    h1 = secs[0]['title'] if secs and secs[0]['level'] == 'h1' else ''
    return h1, secs

def main():
    out = {}
    total = 0
    for cat in CATS:
        idx_url = f'https://www.photogov.net/knowledge/{cat}/'
        html = fetch(idx_url)
        if not html:
            print(f'[{cat}] 列表抓取失败', flush=True)
            continue
        s = BeautifulSoup(html, 'html.parser')
        links = set()
        for a in s.find_all('a', href=True):
            h = a['href']
            m = re.match(rf'^/knowledge/{cat}/([a-z0-9-]+)/?$', h)
            if m: links.add(m.group(1))
        print(f'[{cat}] 发现 {len(links)} 篇', flush=True)
        for slug in sorted(links):
            key = f'{cat}/{slug}'
            url = f'https://www.photogov.net/knowledge/{cat}/{slug}/'
            html = fetch(url)
            if not html:
                print(f'   ✗ {key} 抓取失败', flush=True)
                continue
            h1, secs = parse(html)
            n = sum(len(x['items']) for x in secs)
            if n < 3:
                print(f'   ✗ {key} 内容过少({n})，跳过', flush=True)
                continue
            out[key] = {'cat': cat, 'slug': slug, 'h1': h1, 'sections': secs}
            total += 1
            print(f'   ✓ {key}  H1={h1[:55]}  节点={n}', flush=True)
            time.sleep(0.35)
    json.dump(out, open('data/knowledge.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'\n完成：抓取 {total} 篇 → data/knowledge.json', flush=True)

if __name__ == '__main__':
    main()
