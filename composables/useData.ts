import countriesRaw from '~/data/countries.json'
import documentsRaw from '~/data/documents.json'
import faqRaw from '~/data/faq.json'
import blogRaw from '~/data/blog.json'

export interface Country {
  code: string
  name: string
  flag: string
  region: string
}

export interface DocSize {
  inch: string
  mm: string
  cm: string
  px: string
  w: number
  h: number
}

export interface PhotoDoc {
  slug: string
  country: string
  countryName: string
  name: string
  title: string
  category: string
  popular?: boolean
  quickLink?: boolean
  size: DocSize
  headHeight: string
  eyesLevel: string
  background: string
  format: string
  dpi: number
  fileSize: string
  glasses: boolean
  expression: string
  year: number
  source: string
  verified: boolean
  color?: string
  attire?: string
  printable?: boolean
  onlineSubmission?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const countries = (countriesRaw as any).countries as Country[]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const documentsMap = (documentsRaw as any).documents as Record<string, PhotoDoc>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const categories = (documentsRaw as any).categories as string[]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const faq = (faqRaw as any)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const blog = (blogRaw as any)

const documents = Object.values(documentsMap)

const countriesByCode: Record<string, Country> = Object.fromEntries(
  countries.map((c) => [c.code, c])
)

const categoryLabels: Record<string, string> = {
  passport: 'Passport',
  visa: 'Visa',
  id: 'ID Card',
  driving: 'Driving License',
  other: 'Other'
}

export const useData = () => {
  const getDocument = (slug: string): PhotoDoc | undefined => documentsMap[slug]
  const getCountry = (code: string): Country | undefined => countriesByCode[code]

  const documentsForCountry = (code: string): PhotoDoc[] =>
    documents.filter((d) => d.country === code)

  const popularDocuments = (): PhotoDoc[] =>
    documents.filter((d) => d.popular)

  const quickLinks = (): PhotoDoc[] => documents.filter((d) => d.quickLink)

  const searchDocuments = (q: string): PhotoDoc[] => {
    const term = q.trim().toLowerCase()
    if (!term) return documents
    return documents.filter((d) => {
      return (
        d.name.toLowerCase().includes(term) ||
        d.countryName.toLowerCase().includes(term) ||
        d.category.toLowerCase().includes(term) ||
        d.slug.toLowerCase().includes(term)
      )
    })
  }

  const filterByCategory = (cat: string): PhotoDoc[] =>
    cat && cat !== 'all'
      ? documents.filter((d) => d.category === cat)
      : documents

  const groupedByCountry = (): Record<string, PhotoDoc[]> => {
    const map: Record<string, PhotoDoc[]> = {}
    for (const d of documents) {
      ;(map[d.country] ||= []).push(d)
    }
    return map
  }

  // ---- FAQ ----
  const faqCategories = (): { id: string; title: string; emoji: string }[] =>
    (faq.categories as any[]) || []
  const faqItems = (): { category: string; q: string; a: string }[] =>
    (faq.items as any[]) || []

  // ---- Blog ----
  const blogPosts = (): any[] => (blog.posts as any[]) || []
  const blogCategories = (): string[] => (blog.categories as string[]) || []
  const getPost = (slug: string): any | undefined =>
    (blog.posts as any[]).find((p) => p.slug === slug)
  const relatedPosts = (slug: string, n = 3): any[] => {
    const cur = getPost(slug)
    if (!cur) return (blog.posts as any[]).slice(0, n)
    const sameCat = (blog.posts as any[]).filter(
      (p) => p.slug !== slug && p.category === cur.category
    )
    const others = (blog.posts as any[]).filter(
      (p) => p.slug !== slug && p.category !== cur.category
    )
    return [...sameCat, ...others].slice(0, n)
  }

  return {
    countries,
    countriesByCode,
    documents,
    categories,
    categoryLabels,
    getDocument,
    getCountry,
    documentsForCountry,
    popularDocuments,
    quickLinks,
    searchDocuments,
    filterByCategory,
    groupedByCountry,
    faqCategories,
    faqItems,
    blogPosts,
    blogCategories,
    getPost,
    relatedPosts
  }
}
