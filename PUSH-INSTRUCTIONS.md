# 如何把本仓库推送到 GitHub

> ⚠️ **沙箱无法直连 GitHub**：本环境对 `github.com` 的出站连接在 TLS 握手阶段被透明代理重置（`curl` 直连与 `git push` 都报 `gnutls_handshake() failed: The TLS connection was non-properly terminated`），**与 token 无关**。因此无法从此环境直接 `git push`，只能用下面的离线 git bundle 方式交付，再在你本机 push。

## 交付物

- 最新 bundle：`photogov-clone.bundle`（约 605K，已 `git bundle verify` 通过）
- 包含的最新提交：`0b9d3ff`（在 `0b9d3ff` 之前的全部历史都已在内，是**自包含完整仓库**）

## 在任意能访问 GitHub 的机器上推送

目标仓库：`https://github.com/wotiler-star/photogov-clone.git`

**方式 A：用 bundle 克隆后推送（干净全新）**

```bash
git clone /path/to/photogov-clone.bundle photogov-clone
cd photogov-clone
git push https://<YOUR_NEW_PAT>@github.com/wotiler-star/photogov-clone.git main
```

**方式 B：已有仓库，fetch bundle 后推送**

```bash
cd /path/to/existing-photogov-clone
git fetch /path/to/photogov-clone.bundle main:main
git push origin main
```

> 把 `<YOUR_NEW_PAT>` 换成你新生成的个人访问令牌（PAT）。**不要复用对话里出现过的旧 token，它们已泄露，请立即到 GitHub → Settings → Developer settings → Personal access tokens 吊销。**

## 最近几个待推送的提交（节选）

- `0b9d3ff` feat: SMTP mailer, plan comparison/annual discount, real My Photos & My Orders data
- `6ccd7a6` feat(membership): email verification, password recovery, and subscription plans (free/premium) with full i18n
- `4b06abe` feat(membership): real member auth — scrypt-hashed register/login/logout/me v1 API
- `7e86647` feat(frontend): migrate documents/passports/visas + [slug] pages to v1 /api/app/v1 via useApi composable

> 注：bundle 不含 `node_modules/` 与 `.output/`（已在 `.gitignore` 中），推送后正常 `npm install && npm run build` 即可。
