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
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | **激活闭环必填**。Hostinger：`smtp.hostinger.com` + `465`（SSL，`SMTP_SECURE=true`），或 `587`（STARTTLS，`SMTP_SECURE=false`） |
| `SMTP_USER` / `SMTP_PASS` | **必填**。域名邮箱账号与密码（或应用专用密码） |
| `MAIL_FROM` | **必填**。发件地址，须与 `SMTP_USER` 同域，否则会被服务商拒发 |
| `EMAIL_DEBUG` | 生产**不要设置**。设 `1` 会把含 token 的验证/重置链接回传给客户端；仅本地演示使用 |
| `NODE_ENV` | 生产固定 `production`。`start.sh` / Dockerfile / compose 均已默认；若直接 `node .output/server/index.mjs` 需自行指定 |

> ⚠️ **Nitro 生产运行时不会自动读取 `.env` 文件**，只读 `process.env`。
> 因此光把变量写进 `.env` 不会生效——必须通过平台面板的环境变量、
> `./start.sh`（已内置 `node --env-file=.env`）、`docker compose` 的 `env_file`，
> 或 `docker run --env-file .env` 注入。**SMTP 是运行时变量，改完重启进程即可，无需重新构建**。

## 3. 部署方式

### 方式 A：Docker（推荐自托管）

镜像已构建为 `photogov-clone:latest`（或由仓库 Dockerfile 自行构建）。
先 `cp .env.example .env` 填好 SMTP_* 等变量，再启动：

```bash
docker run -d --name photogov \
  -p 3000:3000 \
  --env-file .env \
  -e NODE_ENV=production \
  photogov-clone:latest
# 或：docker compose up -d   （docker-compose.yml 已配置 env_file，.env 可选）
```

### 方式 B：裸 Node 自托管（本压缩包）

```bash
tar -xzf photogov-clone-deploy.tar.gz
cd photogov-clone-deploy
cp .env.example .env      # 填入 SMTP_* / SESSION_SECRET / 站点域名
PORT=3000 HOST=0.0.0.0 sh ./start.sh
# start.sh 会自动加载 .env 并固定 NODE_ENV=production
# 用 sh 调用可绕开可执行位问题（部分镜像里 checkout 出来是 100644）
# 或用进程管理器（pm2 / systemd）守护；pm2 需确保 cwd 含 .env
```

### 方式 C：Vercel / Netlify / Render（从 Git 构建）

这些平台从 Git 仓库构建，代码已推送到 GitHub `main`。
配置见 `DEPLOY-CHECKLIST.md`：`vercel.json` / `netlify.toml` / `render.yaml` 已就绪。
**SMTP 变量必须在平台面板的 Environment Variables 里逐个添加**（这些平台不会读取仓库里的 `.env`）；
`render.yaml` 目前只声明了 `HOST` / `PORT` / `NODE_ENV`，其余变量在 Render 面板添加。

## 4. SMTP 配置与自检（上线必做）

激活策略依赖真实邮件。生产构建下 `EMAIL_DEBUG=false`，未配 SMTP 时 `sendMail` 只打控制台日志、
**不回 devLink**，验证/重置邮件永远不会送达。此时服务端会 **fail-open**（跳过结账门控）以免锁死账户，
前端也会明确显示「邮件服务当前不可用，未发送任何邮件」，不再谎称「已发送」——但功能仍未闭环。

以 Hostinger 为例：

1. hPanel → **Emails → 创建邮箱**，例如 `no-reply@你的域名`，记下密码。
2. 在部署环境注入 5 个变量（见第 2 节；参数示例见 `.env.example`）：
   `SMTP_HOST=smtp.hostinger.com`、`SMTP_PORT=465`、`SMTP_SECURE=true`、
   `SMTP_USER` / `SMTP_PASS` 为该邮箱、`MAIL_FROM` 与 `SMTP_USER` 同域。
3. 在服务器项目根目录执行自检：

   ```bash
   node scripts/check-smtp.mjs --to 你的收件邮箱@example.com
   ```

   看到 `[OK] SMTP 连接与认证成功` + `[OK] 测试邮件已发送`，且邮箱真的收到信，才算配置完成。
   脚本会指出缺哪个变量、认证失败或端口/SSL 不匹配，**不打印密码**。
4. **重启服务**（运行时变量，无需重新构建）。启动日志不应再出现
   `[auth] SMTP unset and EMAIL_DEBUG=0: email verification gate disabled (fail-open)`。
5. 端到端复验：注册 → 收到验证邮件 → 点链接 → 结账可用；忘记密码 → 收到重置邮件 → 改密成功。

| 状态 | 结账门控 | 邮件 | 前端提示 |
|---|---|---|---|
| 配好 SMTP | 强制验证 | 真实送达 | 正常验证引导 |
| 未配 SMTP（生产） | fail-open 放行 | 只打日志、不回 devLink | 「邮件服务不可用」警告 |
| `EMAIL_DEBUG=1`（仅本地） | 强制验证 | 只打日志、回传 devLink | 「打开验证链接（演示）」 |

## 5. 上线后验证

- `GET /` → 200（重定向到 `/en` 属正常）
- `/en` `/zh` `/es` `/fr` 均 200，且 `<title>` 为对应语言
- 页面 `<link rel="canonical">` 与 hreflang 域名为**自己的域名**
- `GET /sitemap.xml` 约 1036 条（259×4 四语，含 hreflang + x-default）
- `GET /robots.txt` 已 Disallow 私有区（`/admin` `/profile` `/payment` 等）
- `GET /en/admin` 含 `noindex,nofollow`
- `node scripts/check-smtp.mjs` 通过；启动日志无 fail-open 警告
- 注册 → 收到验证邮件 → 点链接激活 → 结账可用
- 忘记密码 → 收到重置邮件 → 改密成功
- HTTPS 强制、证书有效；DNS 解析到平台

## 6. 已知事项

- 无语言前缀路径（如 `域名/documents`）按 i18n `redirectOn: 'root'` 仅根路径 `/` 自动跳转 `/en`；其余会 404。所有真实链接均带前缀，不影响 SEO 与用户访问。如需让任意无前缀路径也跳转，可将 `nuxt.config.ts` 的 `detectBrowserLanguage.redirectOn` 改为 `'all'`。
- 后台 `/en/admin` 已 `noindex`，不会被收录。
