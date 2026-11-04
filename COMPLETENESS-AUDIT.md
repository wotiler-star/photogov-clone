# PhotoGov 克隆站 — 完整性与实践落地审计报告

审计日期：2026-11-04
范围：`photogov.xyz`（Nuxt 3 / Vue 3 / Tailwind / Nitro），全站页面、API、i18n、核心业务链路
方法：静态交叉比对 + 生产构建 + 4 语言全路由探测 + 端到端 API 用户旅程 + 逐项复测

---

## 一、结论速览

| 维度 | 结果 |
|---|---|
| 页面路由 | 50 个页面，4 语言 × 40 静态路由 = **160/160 返回 200**（另有 5 条有意 301） |
| 服务端 API | 60+ 路由，`useApi` 的 32 处调用 **0 缺失端点** |
| i18n | en/es/fr/zh 各 **1278 键，0 缺失 / 0 多余**，无原始 key 泄漏 |
| 核心业务链路 | 37 项端到端检查，34 项直接通过；3 项经复测确认是测试输入问题，实际全部通过 |
| 生产构建 | `NODE_OPTIONS="" npm run build` 通过，46.5 MB |
| **本次修复** | **9 类真实缺陷 / 12 个文件** |

**总体判断：核心商业模型已闭环**（上传 → 处理 → 结账门控 → 解锁下载；注册 → 登录 → 会员中心 → 订阅/订单/照片管理；订阅 checkout → demo 收银台 → webhook 履约 → 状态回写）。审计前存在若干**用户可见的断点**（死链、三语翻译缺失、密码规则前后端不一致、CTA 无动作），本轮已全部修复并验证。

---

## 二、已闭环的核心链路（实测通过）

1. **证件照工具**：上传 / 拍照 / 拖拽 / 粘贴 / 示例图 / HEIC → 裁剪缩放旋转 → 亮度对比度、6 种背景（含 MediaPipe AI 抠图）→ 人脸检测居中、合规校验 → JPG/PNG/PDF/排版页/批量 ZIP 导出。
2. **付费下载门控**：`PhotoTool.requireUnlock()` → `PhotoCheckout` 弹窗（未登录内联注册/登录）→ `photoCheckout` → `onCheckoutSuccess` → 自动执行原下载动作；订阅 CTA 跳 `/prices`。**每张照片一次解锁**，换图重置。
3. **账户体系**：注册（自动建会话 + 发验证邮件）→ 登录 → 邮箱验证 → 资料修改 → 改密 → 软删除/取消删除 → 登出。
4. **支付/订阅**：`/profile/subscription` → `subscription/checkout` → demo 收银台 `/payment/simulate` → `demo-pay`（走与真实 webhook 相同的验签履约链）→ `/payment/return` 轮询 → `me` 立即反映 Premium → 订阅记录 / 自动续费 / 取消订阅。
5. **订单与照片**：`photo-checkout`、`pro-ai-checkout` 均落盘，`order/my` 可见；上传落 `.uploads`，`photo/file/[id]` 可取回，`photo/save` → `photo/my` → 删除闭环。
6. **Pro AI 板块**：`/pro-ai` 板块页 → `ProAICheckout` → `pro-ai-checkout`（$6.90，demo 即时付费）→ 订单可见。
7. **内容站**：`/knowledge`、`/documents/...`、hub 子页、博客/作者页 — 真实数据动态路由均 200；`blogContentIndex`（60 篇）、`docContentIndex`（126 篇）供 API 取正文。
8. **i18n 与 SEO**：4 语言前缀路由、hreflang / sitemap / robots / JSON-LD 齐备；`/blog`、`/forgot-password` 等 301 为对齐原站 IA 的有意设计。

---

## 三、审计发现并修复的缺陷（9 类）

| # | 严重度 | 问题 | 修复 |
|---|---|---|---|
| 1 | 高 | **es/fr/zh 缺 15 个 `documents.*` 键**，`/es\|fr\|zh/documents` 实测有 26 处原始 key 直接暴露给用户 | 补齐三语忠实译文（含「不隶属于任何使领馆」免责声明，避免合规误导）；4 语 1278 键完全对齐 |
| 2 | 高 | **`verify-email.vue` 验证成功后跳 `/en/account` → 404**；`nuxt.config` 的 `/account` 重定向只覆盖裸路径 | 改 `localePath('/profile')`；routeRules 补齐 4 个语言前缀重定向，旧书签不再 404 |
| 3 | 高 | **`sign-in.vue` 三处硬编码 `/account`**，经 307 绕到 `/en/profile`，会强制把 es/fr/zh 用户切成英文 | 全部改 `localePath('/profile')`，保持当前语言 |
| 4 | 高 | **密码规则前后端不一致**：注册 API 仅校验长度≥8（弱密码 `abcdefgh` 实测可注册），改密/重置却要求大小写+数字+符号；3 个前端注册入口同样只校验长度 | 服务端 `register`/`reset-password` 统一调用 `validatePasswordStrength`；`sign-in`、两个结账弹窗、重置页统一正则；新增 `passwordTooWeak`/`weakPassword` 四语文案与错误映射 |
| 5 | 中 | **`checkout.payFail` 四语全缺**，支付失败时 2 个弹窗显示原始 key | 补齐四语 |
| 6 | 中 | **`proAi.payBtn` 键不存在**（我上轮引入：定义 `buyBtn` 却调用 `payBtn`），Pro AI 支付按钮显示原始 key | 复用四语已有的 `checkout.payBtn` |
| 7 | 中 | **Pro AI 弹窗「或订阅」CTA 只关窗不跳转**（与 `PhotoTool.onSubscribe → /prices` 不一致） | 新增 `onSubscribe()` 跳 `/prices` |
| 8 | 中 | **`pro-ai.vue` 的 `features`/`priceLabel` 在 setup 顶层求值**，切换语言不更新 | 改为 `computed`，随 i18n 响应式更新 |
| 9 | 中 | **`reset-password` 的「返回忘记密码」指向 `/forgot-password`**（301 到登录页默认视图），用户无法回到重置表单 | 改指向 `/sign-in?view=reset`；`sign-in` 新增 query 支持直接进入重置视图 |

附带清理：`pro-ai.vue` 移除了冗余的未登录分支（弹窗自带内联登录）。

---

## 四、需要部署侧配合的事项（非代码缺陷，但影响"完全闭环"）

1. **SMTP 必须配置，否则邮箱验证 / 密码重置链路不可用。**
   - 实测：生产构建下 `NODE_ENV=production` → `EMAIL_DEBUG=false`，`register` / `resend-verification` / `forgot-password` 均返回 `ok:true` 但**不返回 devLink**；未配 SMTP 时 `sendMail` 仅打印到服务端控制台。
   - 后果：用户点「忘记密码」看到「已发送指引」，实际永远收不到邮件，也无法完成重置/验证。
   - 代码本身已正确实现（含验签、1 小时过期、避免账号枚举），只需在 Hostinger 配置 `SMTP_HOST/PORT/USER/PASS/MAIL_FROM`。`DEPLOY-CHECKLIST.md` 已列出这些变量。
   - 本地演示可设 `EMAIL_DEBUG=1` 让接口回传 devLink。
   - 另注：`emailVerified` 字段目前全站**没有任何功能门控**（未验证也能使用全部功能）。若目标是复刻原站的账户激活策略，需追加门控；若只是演示站，当前行为可接受。

2. **支付为 demo 模式**：`photo-checkout` / `pro-ai-checkout` 即时标记 paid，`subscription` 走 demo 收银台。接入真实 Stripe 等网关需配置密钥（代码已预留 webhook 验签履约链）。

3. **AI 能力依赖运行时 CDN**：MediaPipe（抠图 / 人脸检测）、heic2any（HEIC 解码）从 jsdelivr 动态加载，代码已做失败降级，但离线/被墙环境下这些增强功能不可用；基础裁剪导出不受影响。

4. **本地状态文件**：`data/users.json`、`orders.json`、`payments.json`、`photos.json` 及 `.uploads/` 为运行时数据，已被 `.gitignore` 排除；审计过程写入的测试记录不会进入仓库，但线上需确保这些路径**可写且持久化**（容器重启会丢数据），正式环境建议换数据库/对象存储。

---

## 五、验证记录

- 构建：`NODE_OPTIONS="" npm run build` → `✨ Build complete!`（exit 0）
- 路由：4 语言 × 40 静态路由 = 160/160 → 200；`/account` 5 个形态全部 3xx；3 条有意 301 正常；3 条真实动态路由 200
- i18n 泄漏：es/fr/zh `/documents` 原始 key 数 **26 → 0**
- 最终断言脚本：**15 PASS / 0 FAIL**
- API 旅程（注册/验证/改密/上传/存图/取图/删图/两种结账/订单/订阅全链/目录内容/删除账户/登出/匿名拦截）：原始 33/37，其中 4 项为测试输入问题（弱密码、编造 slug、用错 imageId、生产无 devLink），用正确输入复测后全部通过；修复后 34/37（剩余 3 项同上，非产品缺陷）

---

## 六、仍可优化（未做，非阻塞）

- 知识中心 Hub 缺目标站顶部的「featured article」推荐块（上一轮 REA 审计记录的唯一颗粒度差异）。
- 专家人工审核（`tool.expertTitle` 卡片）目前是演示 UI，点击仅显示提示文案，未接 `$4.90 Human Verification` 服务。
- 移动端抽屉、页脚链接矩阵已覆盖主要页面；`admin` 面板为独立裸路径。
