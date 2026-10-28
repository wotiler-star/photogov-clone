# 部署检查清单（PhotoGov 复刻站）

面向生产上线的分步清单。项目为 **Nuxt 3 SSR** 站点，四语（`en` / `zh` / `es` / `fr`）采用 `prefix` 策略，
每个语言都是可抓取的子目录 URL。

---

## 1. 平台选型

| 平台 | 已有配置 | 构建/输出 | 说明 |
|---|---|---|---|
| **Vercel** | `vercel.json` | `npm run build` → `.output` | 推荐。Nuxt 官方预设，`framework: nuxt` 已声明，Node `22.x` |
| **Netlify** | `netlify.toml` | `npm run build` → `.output` | Nitro `netlify` preset 自动识别，无需额外适配器 |
| **Render** | `render.yaml` | Docker 镜像 | `healthCheckPath: /`，已设 `HOST=0.0.0.0`、`PORT=3000` |
| **Docker 自托管** | `Dockerfile` | 多阶段构建 | `node:22-alpine`，运行时 `node .output/server/index.mjs` |

统一要点：构建命令 `npm run build`，产物目录 `.output`，**Node 版本必须 22**（三处配置已一致）。

---

## 2. 环境变量（上线前必做）

| 变量 | 必填 | 说明与风险 |
|---|---|---|
| `NUXT_PUBLIC_SITE_URL` | **是** | **最关键**。未设置时 i18n `baseUrl` 回退为 `https://photogov.net`，导致页面内 **canonical / hreflang / OG** 全部指向**原站域名**，属严重 SEO 事故。设为 `https://你的真实域名`。注意：`/sitemap.xml` 与 `/robots.txt` 走 Nitro 自定义路由，取**请求域名**（`getRequestURL` origin），不依赖此变量，部署到任意域名都正确 |
| `SESSION_SECRET` | **是** | 会员会话 cookie 签名。`.env.example` 中为占位值 `change-me-to-a-long-random-string`，生产必须替换为长随机串 |
| `PAYMENT_DEMO_TOKEN` | **是** | Demo 收银台回调签名。同上，生产必须替换 |
| `PAYMENT_DEMO_MODE` | 视情况 | 未接 Stripe 时设 `1`，走内置 Demo 收银台（`/payment/simulate`）；接了 Stripe 则设 `0` |
| `STRIPE_SECRET_KEY` | 否 | 真实支付时配置。属服务端密钥，走 `runtimeConfig`，不会下发客户端 |
| `STRIPE_WEBHOOK_SECRET` | 否 | Stripe 回调验签：`POST /api/app/v1/subscription/webhook/stripe` |
| `SMTP_*` / `MAIL_FROM` | 否 | 不设时验证/重置邮件打印到服务端控制台并返回 dev 链接，仅适合本地 |
| `EMAIL_DEBUG` | 否 | 本地调试用，生产不设 |

> 安全：服务端密钥（`STRIPE_*`、`SESSION_SECRET`、`PAYMENT_DEMO_TOKEN`）只在 Nitro 侧读取，
> 切勿加 `NUXT_PUBLIC_` 前缀——该前缀的变量会进入客户端 bundle。

---

## 3. 上线前检查

- [ ] `NUXT_PUBLIC_SITE_URL` 已设为真实域名（不是默认的 `photogov.net`）
- [ ] `SESSION_SECRET`、`PAYMENT_DEMO_TOKEN` 已替换随机值
- [ ] 支付模式明确：接 Stripe 配好密钥与 Webhook，否则 `PAYMENT_DEMO_MODE=1`
- [ ] `Node 22.x`；产物目录为 `.output`
- [ ] 四语子目录均可访问：`/en`、`/zh`、`/es`、`/fr`
- [ ] `robots.txt` 可访问，已 `Disallow` 私有区（`/admin`、`/profile`、`/payment`、登录/验证页），`Sitemap:` 指向真实域名
- [ ] `sitemap.xml` 可访问，URL 前缀为真实域名（本地实测 1036 条，四语各 259，含 hreflang + x-default；已剔除 `/blog*` 等 301 重定向 URL 与认证页）
- [ ] 后台页 `/en/admin` 返回 `noindex,nofollow`（已修复）
- [ ] HTTPS 已强制，证书有效
- [ ] DNS 已解析到平台；若前置 Cloudflare，注意 SSL/TLS 模式与代理设置

---

## 4. 上线后验证步骤

| 步骤 | 验证方式 | 期望 |
|---|---|---|
| 健康检查 | `GET /` | 200（i18n 会从 `/` 重定向到 `/en`，属正常） |
| 多语言可达 | `/en` `/zh` `/es` `/fr` | 均 200，且 `<title>` 为对应语言 |
| canonical | 查看页面 `<link rel="canonical">` | 域名为**自己的域名** |
| hreflang | 查看 `<link rel="alternate" hreflang=...>` | 四语互指，域名正确 |
| sitemap | `GET /sitemap.xml` | `<loc>` 均为真实域名，约 1036 条（259×4） |
| robots | `GET /robots.txt` | `Sitemap:` 指向真实域名 |
| 后台页 | `GET /en/admin` | 含 `noindex,nofollow` |
| 支付 | 下单 → 回调 → 开通 | Webhook 端点可访问并验签通过（接 Stripe 时） |

---

## 5. 回滚

- **Vercel / Netlify**：在控制台将上一个成功 Deployment 重新 Promote（或 `git revert` 触发重新部署）
- **Render**：Redeploy 上一个成功版本
- **Docker 自托管**：保留上一个镜像 tag，回滚镜像即可

回滚后按第 4 节抽查首页与任一语言页，确认 200 且 canonical 域名正确。

---

## 6. 常见失败原因

| 症状 | 原因 |
|---|---|
| canonical / hreflang / OG 指向 `photogov.net` | 未设 `NUXT_PUBLIC_SITE_URL`（sitemap/robots 取请求域名，不受影响） |
| 构建失败、依赖报错 | Node 版本不是 22（项目锁定 22.x） |
| 部署后全站 404 | 发布目录不是 `.output`（Vercel `outputDirectory`、Netlify `publish`） |
| Docker 部署访问不到 | 未监听 `0.0.0.0` 或端口不是 3000 |
| 支付流程异常 | 未配 Stripe 且未开 `PAYMENT_DEMO_MODE=1` |
| 会话/登录异常 | `SESSION_SECRET` 仍是占位值或多实例间不一致 |
