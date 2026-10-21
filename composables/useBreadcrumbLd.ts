// BreadcrumbList 结构化数据助手
// 与 pages/documents/[slug]/index.vue 中的实现同模式：绝对 URL（origin 由请求推导，
// 多语言子目录下也正确）+ JSON-LD 注入前转义 `</` 防止提前闭合 <script>。
import { computed, type Ref } from 'vue'
import { useRequestURL } from '#imports'

export interface BreadcrumbItem {
  name: string
  /** 站内路径（可带语言前缀，如 /en/profile）或完整 URL */
  to: string
}

// JSON-LD 注入前的安全清洗：转义 `</` 避免提前闭合 <script> 标签
const escLd = (s: string) => s.replace(/</g, '\\u003c')

export function useBreadcrumbLd(trail: Ref<BreadcrumbItem[]> | BreadcrumbItem[]) {
  const url = useRequestURL()
  const origin = computed(() => url.origin)

  const items = computed(() => (Array.isArray(trail) ? trail : trail.value))

  const schema = computed(() => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.value.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: /^https?:\/\//.test(item.to) ? item.to : `${origin.value}${item.to}`
    }))
  }))

  // 可直接传给 useHead({ script })
  const scripts = computed(() => [
    {
      key: 'ld-breadcrumb',
      type: 'application/ld+json',
      innerHTML: escLd(JSON.stringify(schema.value))
    }
  ])

  return { schema, scripts }
}
