<script lang="ts">
/**
 * DocNode —— 递归渲染 photogov.net 的内容树节点。
 *
 * 目标站 content/document 接口返回一棵 DD* 组件树（全部 126 篇共 52 类组件、
 * 24019 个节点），节点形如：
 *     { component, attributes, innerHtml, children }
 *   - component 为 HTML 标签（p/h2/ul/li/span/div…）时，正文在 innerHtml
 *   - component 为 DD* 组件时，多为容器（渲染 children）；带数据的组件把
 *     JSON 串放在 model / items / authorData 等属性里
 * 目标站用的是 Tailwind class，本站同样启用 Tailwind，因此 innerHtml 里的
 * 类名可以直接生效，这是保真的关键。
 */
import { defineComponent, h } from 'vue'
import { NuxtLink } from '#components'
import Self from './DocNode.vue'
import PhotoTool from './PhotoTool.vue'
import DocFaq from './DocFaq.vue'
import DocToc from './DocToc.vue'
import { slugifyHeading, stripTags } from '~/utils/docAnchor'

const DDikelyProps = ['attributes', 'children']

/** HTML 叶子/原生标签：正文来自 innerHtml。 */
const HTML_TAGS = new Set([
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'span', 'div', 'ul', 'ol', 'li', 'em', 'strong', 'br', 'hr', 'b', 'i',
  'article-description', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
])

const parseJson = (v: any) => {
  if (typeof v !== 'string') return v
  try {
    return JSON.parse(v)
  } catch {
    return null
  }
}

const imgOf = (m: any) => {
  const o = parseJson(m)
  return o && typeof o === 'object' ? o : null
}

/** 目标站的 link:{route,params} 映射成本站路由。 */
const ROUTE_MAP: Record<string, (p?: any) => string> = {
  Home: () => '/',
  Documents: () => '/documents',
  Passports: () => '/passports',
  Visas: () => '/visas',
  DocumentDetail: (p) => `/documents/${p?.slug || ''}`,
  Prices: () => '/prices',
  Plan: () => '/prices',
  Knowledge: () => '/knowledge',
  Blog: () => '/blog',
  Faq: () => '/faq',
  Contacts: () => '/contacts',
  AboutUs: () => '/about-us',
}

export default defineComponent({
  name: 'DocNode',
  props: {
    node: { type: Object, required: true },
  },
  setup() {
    const localePath = useLocalePath()
    return { lp: (p: string) => localePath(p) }
  },
  render() {
    const node: any = this.node
    if (!node) return null
    const name: string = node.component || 'div'
    const a = node.attributes || {}
    const kids = () => (node.children || []).map((c: any) => h(Self, { node: c }))
    const lp: (p: string) => string = (this as any).lp

    // —— 原生 HTML 叶子 ——
    if (HTML_TAGS.has(name)) {
      const props: Record<string, any> = {}
      if (a.class) props.class = a.class
      // 标题锚点：部分内容树的 h2 自带 id，其余按标题文本生成（与目录侧同一规则），
      // 否则「On this page」的锚点会跳不到目标（原站 h2 id 即标题 slug，SEEN）。
      if (a.id) {
        props.id = a.id
      } else if (name === 'h2') {
        const slug = slugifyHeading(node.innerHtml || '')
        if (slug) props.id = slug
      }
      if (node.innerHtml) props.innerHTML = node.innerHtml
      return h(
        name === 'article-description' ? 'div' : name,
        props,
        node.innerHtml ? undefined : kids(),
      )
    }

    switch (name) {
      // ——————— 布局容器 ———————
      case 'DDSpaceGroup':
        // space 是 Tailwind 间距刻度：gap-N = N * 4px
        return h('div', {
          class: ['flex flex-col', a.class].filter(Boolean).join(' '),
          style: { gap: `${Number(a.space || 4) * 4}px` },
        }, kids())

      case 'DDContainer':
        return h('div', { class: a.class, id: a.id }, kids())

      case 'DDContainerMax700':
        return h('div', { class: ['mx-auto w-full max-w-[700px]', a.class].filter(Boolean).join(' ') }, kids())

      case 'DDContainerMax800':
        return h('div', { class: ['mx-auto w-full max-w-[800px]', a.class].filter(Boolean).join(' ') }, kids())

      case 'DDCardWhite':
        return h('div', {
          class: ['rounded-xl border border-slate-200 bg-white p-5 shadow-sm', a.class].filter(Boolean).join(' '),
        }, kids())

      case 'DDCardCreatePhoto':
        return h('div', {
          id: a.id,
          class: ['rounded-xl border border-primary/20 bg-white p-5 shadow-sm', a.class].filter(Boolean).join(' '),
        }, kids())

      case 'DDContainerRoundedGrey':
        return h('div', { class: ['rounded-xl bg-slate-50 p-5', a.class].filter(Boolean).join(' ') }, kids())

      case 'DDCardWithIcon':
        return h('div', { class: 'flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4' }, [
          a.src ? h('img', { src: a.src, alt: '', class: 'mt-1 h-5 w-5 shrink-0', loading: 'lazy' }) : null,
          h('div', { class: 'min-w-0 flex-1' }, kids()),
        ])

      case 'DDContainerYellowWithIcon':
        return h('div', { class: 'flex items-start gap-3 rounded-xl bg-amber-50 p-4' }, [
          a.src ? h('img', { src: a.src, alt: '', class: 'mt-1 h-5 w-5 shrink-0', loading: 'lazy' }) : null,
          h('div', { class: 'min-w-0 flex-1' }, kids()),
        ])

      case 'DDContainerWithImage': {
        const img = imgOf(a.model)
        // 图片收进固定宽度的图框（桌面 280px / 移动全宽），避免 w-full 在
        // md:flex-row 下把整栏撑满、与 flex-1 文字争夺宽度（原站阅读栏约 700px）。
        const imgWrap = img?.src
          ? h('div', { class: 'w-full shrink-0 md:w-[280px]' }, [
              h('img', { src: img.src, alt: img.alt || '', title: img.title, class: 'w-full rounded-lg', loading: 'lazy' }),
            ])
          : null
        // direction/顺序不敏感：图文并排，窄屏堆叠
        return h('div', { id: a.id, class: 'flex flex-col gap-5 md:flex-row md:items-start' }, [
          imgWrap,
          h('div', { class: 'min-w-0 flex-1' }, kids()),
        ])
      }

      case 'DDStepper':
      case 'DDStepperContainer':
        return h('div', { class: 'grid gap-4 md:grid-cols-2' }, kids())

      // ——————— 文字/标题壳层（真正的标签在 children 里） ———————
      case 'DDHeadingH1':
      case 'DDHeadingH2':
      case 'DDHeadingH3':
      case 'DDHeadingH4':
      case 'DDTextDefault':
      case 'DDTextSmall':
      case 'DDTextLarge':
      case 'DDTextExtraSmall':
        return h('div', { class: a.class }, kids())

      case 'DDList':
        return h(a.type === 'decimal' ? 'ol' : 'ul', {
          class: ['ml-5 list-outside space-y-1', a.type === 'decimal' ? 'list-decimal' : 'list-disc', a.class]
            .filter(Boolean).join(' '),
        }, kids())

      case 'DDQuote':
        return h('blockquote', { class: 'border-l-4 border-primary/40 bg-slate-50 p-4' }, [
          a.author ? h('div', { class: 'mb-2 text-sm', innerHTML: String(a.author) }) : null,
          a.content ? h('div', { class: 'text-sm text-muted', innerHTML: String(a.content) }) : null,
          ...kids(),
        ])

      case 'DDBadgeNeutral': {
        const img = imgOf(a.model)?.img
        return h('span', { class: 'inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium' }, [
          img?.src ? h('img', { src: img.src, alt: img.alt || '', class: 'h-4 w-4', loading: 'lazy' }) : null,
          ...kids(),
        ])
      }

      // ——————— 图片 ———————
      case 'DDImg': {
        const style: Record<string, string> = {}
        if (a.aspectRatio) style.aspectRatio = String(a.aspectRatio).replace(':', '/')
        return h('img', {
          src: a.src,
          alt: a.alt || '',
          title: a.title,
          width: a.width,
          class: ['max-w-full rounded-lg', a.class].filter(Boolean).join(' '),
          style,
          loading: 'lazy',
        })
      }

      // ——————— 首屏 Hero ———————
      case 'DDCover': {
        const res = imgOf(a.resultImage)
        const doc = imgOf(a.documentImage)
        return h('div', { class: 'grid gap-6 md:grid-cols-2 md:items-center' }, [
          h('div', {}, [
            ...kids(),
            a.source ? h('p', { class: 'mt-3 text-xs text-muted', innerHTML: String(a.source) }) : null,
          ]),
          res?.src
            ? h('img', { src: res.src, alt: res.alt || '', title: res.title, class: 'mx-auto w-full max-w-xs rounded-xl', loading: 'lazy' })
            : doc?.src
              ? h('img', { src: doc.src, alt: doc.alt || '', class: 'mx-auto w-full max-w-xs rounded-xl', loading: 'lazy' })
              : null,
        ])
      }

      case 'DDCover2': {
        const res = imgOf(a.resultImg)
        const src = imgOf(a.sourceImg)
        const avatars = parseJson(a.reviewsAvatarsImg) || []
        return h('div', { class: 'grid gap-6 md:grid-cols-[1.1fr_1fr] md:items-center' }, [
          h('div', {}, [
            ...kids(),
            a.button
              ? h(NuxtLink, { to: lp('/documents'), class: 'mt-4 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white' },
                  { default: () => String(a.button) })
              : null,
            a.compliance ? h('p', { class: 'mt-2 text-xs text-muted' }, String(a.compliance)) : null,
            avatars.length
              ? h('div', { class: 'mt-3 flex items-center gap-2' },
                  avatars.slice(0, 4).map((av: any) =>
                    h('img', { src: av.src, alt: av.alt || '', class: 'h-7 w-7 rounded-full ring-2 ring-white', loading: 'lazy' })),
                )
              : null,
            a.source ? h('p', { class: 'mt-3 text-xs text-muted', innerHTML: String(a.source) }) : null,
          ]),
          h('div', { class: 'flex items-center justify-center gap-3' }, [
            src?.src ? h('img', { src: src.src, alt: src.alt || '', class: 'w-28 rounded-lg sm:w-36', loading: 'lazy' }) : null,
            res?.src ? h('img', { src: res.src, alt: res.alt || '', class: 'w-36 rounded-lg sm:w-48', loading: 'lazy' }) : null,
          ]),
        ])
      }

      case 'DDCoverNavigationItem':
        return h('a', { href: a['scroll-to'], class: 'block text-sm text-primary hover:underline' }, kids())

      // ——————— 面包屑 ———————
      case 'DDBreadcrumbs': {
        const items = parseJson(a.items) || []
        return h('nav', { class: 'mb-4 flex flex-wrap items-center gap-1 text-xs text-muted', 'aria-label': 'Breadcrumb' },
          items.map((it: any, i: number) => {
            const meta = ROUTE_MAP[it?.link?.route]
            const to = meta ? meta(it?.link?.params) : null
            const label = String(it?.name || '')
            return h('span', { class: 'flex items-center gap-1' }, [
              to
                ? h(NuxtLink, { to: lp(to), class: 'hover:text-primary hover:underline' }, { default: () => label })
                : h('span', {}, label),
              i < items.length - 1 ? h('span', { class: 'text-slate-300' }, '/') : null,
            ])
          }),
        )
      }

      // ——————— Stepper 卡片 ———————
      case 'DDStepperCard': {
        const m = parseJson(a.model) || {}
        return h('div', { class: 'rounded-xl border border-slate-200 bg-white p-5' }, [
          m.img?.src ? h('img', { src: m.img.src, alt: m.img.alt || '', class: 'mb-3 h-10 w-10', loading: 'lazy' }) : null,
          m.title ? h('h3', { class: 'font-semibold' }, String(m.title)) : null,
          m.text ? h('p', { class: 'mt-1 text-sm text-muted', innerHTML: String(m.text) }) : null,
          ...kids(),
        ])
      }

      case 'DDTextWithImage': {
        const img = imgOf(a.model)
        return h('div', { class: ['flex items-start gap-3', a.class].filter(Boolean).join(' ') }, [
          img?.src ? h('img', { src: img.src, alt: img.alt || '', title: img.title, class: 'h-6 w-6 shrink-0', loading: 'lazy' }) : null,
          h('div', { class: 'min-w-0 flex-1' }, kids()),
        ])
      }

      // ——————— 要求 / 表格 ———————
      case 'DDRequirements':
        return h('section', { id: a.id, class: 'scroll-mt-20' }, kids())

      case 'DDRequirementsTable': {
        const m = parseJson(a.model)
        if (!m || typeof m !== 'object') return null
        return h('div', { class: 'overflow-x-auto rounded-lg border border-slate-200' }, [
          h('table', { class: 'w-full border-collapse text-sm' }, [
            h('tbody', {},
              Object.entries(m).map(([k, v]) =>
                h('tr', { class: 'even:bg-slate-50/40' }, [
                  h('td', { class: 'border-b border-slate-100 px-3 py-2 font-medium', innerHTML: String(k) }),
                  h('td', { class: 'border-b border-slate-100 px-3 py-2', innerHTML: String(v ?? '') }),
                ]),
              ),
            ),
          ]),
          ...kids(),
        ])
      }

      case 'DDTable':
        return h('div', { class: ['my-4 overflow-x-auto', a.class].filter(Boolean).join(' ') },
          h('table', { class: 'w-full border-collapse text-sm' }, kids()))

      case 'DDTableHead':
        return h('thead', { class: 'bg-slate-50' }, kids())

      case 'DDTableBody':
        return h('tbody', {}, kids())

      case 'DDTableRow':
        return h('tr', { class: 'even:bg-slate-50/40' }, kids())

      case 'DDTableHeadingCell':
        return h('th', { class: ['border-b border-slate-200 px-3 py-2 text-left font-semibold', a.class].filter(Boolean).join(' ') }, kids())

      case 'DDTableCell':
        return h('td', { class: 'border-b border-slate-100 px-3 py-2' }, kids())

      // ——————— FAQ ———————
      // FAQ：原站为「信息图标 + 问题 + 加号」行 + grid-rows 高度动画（见 DocFaq.vue）
      case 'DDFaq': {
        const items = parseJson(a.model) || []
        return h('div', { class: 'mt-6' }, [h(DocFaq, { items }), ...kids()])
      }

      // ——————— 目录（On this page） ———————
      // SEEN：原站该位置渲染的是「Written by Olia Potiagaeva…」署名条 + 信任三卡 +
      // 「ON THIS PAGE:」目录，且 SSR 里 authorData（如 John Bates）并不出镜——
      // 所以此处只用 navigationList 渲染目录（署名条/信任卡由页面级 DocByline、
      // DocTrustBar 统一提供，126 篇全覆盖，且不会重复）。
      case 'DDAuthor': {
        const nav = parseJson(a.navigationList) || []
        const items = (Array.isArray(nav) ? nav : [])
          .map((n: any) => ({
            id: String(n?.to || '').replace(/^#/, ''),
            text: String(n?.text || ''),
          }))
          .filter((x: any) => x.id && x.text)
        // lastUpdate 形如 2026-09-10 → 原站目录右侧显示 09/10/2026
        const d = String(a.lastUpdate || '')
        const updated = /^\d{4}-\d{2}-\d{2}$/.test(d)
          ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`
          : ''
        return h('div', {}, [
          items.length ? h(DocToc, { items, updated }) : null,
          ...kids(),
        ])
      }

      // ——————— 相关文档 ———————
      // 同样：标题（DDHeadingH2/h2）在 children 里，卡片数据在 model 里，两边都要渲染
      case 'DDOtherDocuments': {
        const items = parseJson(a.model) || []
        const cards = items.map((it: any) => {
          const slug = it?.meta?.slug_en
          const label = it?.meta?.name?.en || it?.name?.short || slug
          if (!slug) return null
          return h(NuxtLink, {
            to: lp(`/documents/${slug}`),
            class: 'rounded-lg border border-slate-200 bg-white p-4 text-sm hover:border-primary hover:shadow-sm',
          }, { default: () => String(label) })
        }).filter(Boolean)
        return h('div', { id: a.id, class: a.class }, [
          ...kids(),
          cards.length ? h('div', { class: 'mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3' }, cards) : null,
        ])
      }

      // ——————— 照片工具 Widget ———————
      // 注意：目标站把小节标题放在 children 里（如 h2 "Get photo for: …"），
      // 只渲染 model/组件本身会丢标题，必须一并渲染子节点。
      case 'DDWidget':
        return h('div', { id: a.id, class: a.class }, [...kids(), h(PhotoTool)])

      default:
        // 未知组件：至少把子节点渲染出来，避免丢内容
        return h('div', { class: a.class, ...(a.id ? { id: a.id } : {}) }, kids())
    }
  },
})
</script>
