# 如何把本仓库推送到 GitHub

沙箱环境（`networkEnvironment: "internal"`）对 github.com 的出站连接在 TLS 握手阶段被透明代理重置，**无法从此环境直接 `git push`**（两个 PAT 均命中同样的连接重置，非 token 问题）。

已将完整仓库打包为自包含的 git bundle 文件：`photogov-i18n.bundle`（约 244K，含全部提交历史，已 `git bundle verify` 通过）。

## 在任意可访问 GitHub 的机器上推送

**方式 A：直接用 bundle 克隆后推送**

```bash
git clone /path/to/photogov-i18n.bundle photogov-clone
cd photogov-clone
git push https://x-access-token:***REMOVED_GITHUB_TOKEN***@github.com/wotiler-star/photogov-clone.git main
```

**方式 B：已有仓库，fetch bundle 后推送**

```bash
cd /path/to/existing-photogov-clone
git fetch /path/to/photogov-i18n.bundle main:main
git push origin main
```

（如使用新 token，把上面 URL 中的 token 换为 `***REMOVED_GITHUB_TOKEN***` 即可。）

## 本次待推送的提交

- `915367e` feat: add multi-language (en/zh/es/fr) support with @nuxtjs/i18n
- `ed473cf` perf(i18n): flag icons, localized country names, copy polish

> 注：bundle 不含 `node_modules/` 与 `.output/`（已在 `.gitignore` 中），推送后正常 `npm install && npm run build` 即可。
