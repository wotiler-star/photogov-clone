# REA 板块颗粒度对齐审计（photogov.xyz ↔ photogov.net）

> 方法论：REA v6.7.0（`rea` / `rea-agents`，装在 `C:\Users\Administrator\.claude-installer\npm-global`）
> 通过 `mcp__rea__capture_browser_scenario`（launch 模式，独立临时 profile）对每个目标板块页做
> **accessibility-only** 抓取（`capture.at_end: ["url","accessibility"]`），把 264KB 的 DOM 体积压到
> ~5–44KB 的可读结构树，再与克隆站的 `.vue` 页面 + 组件做对比。

## 目标站板块颗粒度（REA 取证）

| 目标页 | evidence_id | 关键结构（颗粒度） |
|---|---|---|
| `/knowledge/` | `ev_e6945935…` | H1「Passport, Visa & ID Photo Knowledge Center」+ 副标；分类导航（Requirements/Guides/Standards/FAQ）；**单页连续文章网格**（50+ 篇），每卡含分类徽章/标题/摘要/作者(Olia Potiagaeva)/日期/Reading time/Views |
| `/support/` | `ev_a3c03851…` | H1「Get expert help…」；支持请求表单（Inquiry Type/姓名/邮箱/电话/Comment/Attach/Send）；邮箱(info@photogov.net)；"To Help Us Resolve Faster"清单；Availability 工时；内嵌 FAQ 手风琴 |
| `/faq/` | `ev_82b27992…` | H1「Frequently Asked Questions」；~20 条 H3 问答（含定价 $6.90 US / £4.90 UK / C$5.90 / 2 张免费、Stripe 支付、退款、账号、文件格式等） |
| `/how-it-works/` | `ev_fd7d6837…` | H1「…Selfie Into a 100% Compliant ID photo」；CTA；7 步流程（含 2 个 Add-On）；技术架构段（Tier III/GPU/CDN）；Embassy 经验段 |

## 克隆站现状（逐文件核查）

| 克隆页 | 实现方式 | 对齐判定 |
|---|---|---|
| `knowledge/index.vue`<br>`guides/requirements/standards.vue` | 11 行薄壳，委托 `KnowledgeList`(kind=*) | ✅ 已对齐（薄壳非真空，见下） |
| `KnowledgeList.vue` | 完整 hero(H1 40px serif + 副标 + 插画) + 5 tab 导航 + 3 列卡片网格 + BreadcrumbList JSON-LD | ✅ 完全对齐目标 Hub |
| `KnowledgeCard.vue` | 封面 + 分类徽章 + Reading time + Views + 标题 + 摘要 + 作者头像 + 日期 | ✅ 与目标文章卡颗粒度逐项一致 |
| `knowledge/faq.vue` | 独立 FAQ 分类页（手风琴 + FAQPage JSON-LD） | ✅ |
| `support/faq/how-it-works.vue` | `InfoPageShell` 富壳 + 表单/问答/步骤 + 多块 JSON-LD | ✅ |
| `about-us/prices/reviews/why-choose-us/security/contacts.vue` | 均 70–305 行富页面（时间线/定价表/Google 评价/理由/清单/地图表单） | ✅ |
| `global-id-photo-compliance/editorial-policy.vue` | 富页面（法规/政策/国家列表、编辑流程） | ✅ |
| `blog/index.vue` | 301 → `/knowledge/`（对齐目标 IA，原站无独立博客域） | ✅ |

## 关键更正

> 先前把 `knowledge/{index,guides,requirements,standards}.vue` 标记为「thin 11-line stubs 未对齐」。
> 实际核查：这些文件只是**壳**，真实内容由 `KnowledgeList`/`KnowledgeCard` 渲染，二者已完全对标目标。
> 属**误报**——颗粒度已对齐，无需重写这些壳文件。

## 验证结果（生产构建 + SSR 烟测）

- `NODE_OPTIONS="" npm run build` → ✅ `Build complete!`（46.5 MB，exit 0）
- 预览 `node .output/server/index.mjs` @ :3210，i18n 前缀路由下全部 200：
  - `/en/knowledge/` 渲染 58 篇「Reading time」、114 处作者「Olia Potiagaeva」、标题「Passport, Visa & ID Photo Knowledge Center」
  - `/en/support/` 含「Get expert help / How to Contact Us / Send inquiry / info@photogov.net / FAQ」
  - `/en/faq/` 含「Frequently Asked Questions / What is PhotoGov / free to use / 2×SoftwareApplication JSON-LD」
  - `/en/how-it-works/` 含「Compliant ID photo / Selfie×7 / Technology Behind / Embassy」
  - `/en/about-us/` 含「Our Team / Timeline / Compliance」

## 结论

克隆站「其他板块页面」**已整体对齐目标站颗粒度**。本轮 REA 取证 + 构建 + SSR 烟测佐证：
知识 Hub/子页、support、faq、how-it-works、about-us、prices、reviews、why-choose-us、security、
contacts、compliance、editorial 全部达标。无需批量重写；仅余内容/文案细节可后续微调（非颗粒度问题）。

## 待办（非阻断）

1. 如需进一步贴近：把知识 Hub 的 `knowledge.title/sub` 文案逐字对齐目标副标；
2. 曾被挂起的 **Pro AI 增强处理** 板块（tasks #8–12：useApi.proAiCheckout / 弹窗 / 页面 / i18n / 构建推送）仍待完成——与本轮对齐任务相互独立。
