# PhotoGov 复刻站 — 部署说明

Nuxt 3 SSR 站点（四语 en/zh/es/fr，前缀策略）。生产构建产物在 `.output/`。

## 1. 环境要求

- **Node.js 22.x**（必须，三处部署配置已锁定 22）
- 至少 256MB 内存（SSR 渲染）；建议 512MB+

## 2. 必填环境变量（上线前设置）

| 变量 | 作用 |
|---|---|
| `NUXT_PUBLIC_SITE_URL` | **最关键**。真实域名（如 `https://photogov.example.com`）。未设则页面内 canonical/hreflang/OG 指向 `photogov.net`（SEO 事故）。sitemap/robots 取请求域名，不受此变量影响 |
| `SESSION_SECRET` | 会话 cookie 签名，生产必须替换为长随机串 |
| `PAYMENT_DEMO_TOKEN` | Demo 收银台回调签名，生产必须替换 |
| `PAYMENT_DEMO_MODE` | `1`=走内置 Demo 收银台；接 Stripe 后设 `0` |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | 真实支付（可选） |

## 3. 部署方式

### 方式 A：Docker（推荐自托管）

镜像已构建为 `photogov-clone:latest`（或由仓库 Dockerfile 自行构建）：

```bash
docker run -d --name photogov \
  -p 3000:3000 \
  -e NUXT_PUBLIC_SITE_URL=https://你的域名 \
  -e SESSION_SECRET=你的长随机串 \
  -e PAYMENT_DEMO_TOKEN=你的令牌 \
  -e PAYMENT_DEMO_MODE=1 \
  photogov-clone:latest
```

### 方式 B：裸 Node 自托管（本压缩包）

```bash
tar -xzf photogov-clone-deploy.tar.gz
cd photogov-clone-deploy
PORT=3000 HOST=0.0.0.0 ./start.sh
# 或用进程管理器（pm2 / systemd）守护
```

### 方式 C：Vercel / Netlify / Render（从 Git 构建）

这些平台从 Git 仓库构建，**需先把代码推送到 GitHub 远程**（当前本地领先 2 个提交未推送）。
配置见 `DEPLOY-CHECKLIST.md`：`vercel.json` / `netlify.toml` / `render.yaml` 已就绪。

## 4. 上线后验证

- `GET /` → 200（重定向到 `/en` 属正常）
- `/en` `/zh` `/es` `/fr` 均 200，且 `<title>` 为对应语言
- 页面 `<link rel="canonical">` 与 hreflang 域名为**自己的域名**
- `GET /sitemap.xml` 约 1036 条（259×4 四语，含 hreflang + x-default）
- `GET /robots.txt` 已 Disallow 私有区（`/admin` `/profile` `/payment` 等）
- `GET /en/admin` 含 `noindex,nofollow`
- HTTPS 强制、证书有效；DNS 解析到平台

## 5. 已知事项

- 无语言前缀路径（如 `域名/documents`）按 i18n `redirectOn: 'root'` 仅根路径 `/` 自动跳转 `/en`；其余会 404。所有真实链接均带前缀，不影响 SEO 与用户访问。如需让任意无前缀路径也跳转，可将 `nuxt.config.ts` 的 `detectBrowserLanguage.redirectOn` 改为 `'all'`。
- 后台 `/en/admin` 已 `noindex`，不会被收录。
