// Organization 结构化数据（原站全站注入，@id: https://photogov.net/#organization）
// 数据来源：F4 取证 f4-jsonld.json（原站 /faq/ 页 JSON-LD 原样提取）
import { computed } from 'vue'
import { useRequestURL } from '#imports'

const AREA_SERVED = [
  'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT',
  'AU', 'AW', 'AX', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI',
  'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY',
  'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN',
  'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM',
  'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK',
  'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL',
  'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM',
  'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR',
  'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN',
  'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS',
  'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK',
  'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW',
  'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP',
  'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM',
  'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW',
  'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM',
  'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TF',
  'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW',
  'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI',
  'VN', 'VU', 'WF', 'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZW',
]

export function useOrgLd() {
  const url = useRequestURL()
  const origin = computed(() => url.origin)
  const schema = computed(() => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://photogov.net/#organization',
    description: 'PhotoGov uses advanced artificial intelligence algorithms to create photos that are tailored to meet the specifications of different embassies and authorities. Our platform allows you to upload a photo of yourself and select the type of document for which you need the photo. Our algorithms then analyze the photo and make the necessary adjustments to ensure that it meets the specific requirements for that document.',
    name: 'PhotoGov',
    sameAs: [
      'https://www.wikidata.org/wiki/Q130323976',
      'https://www.youtube.com/@Photogov',
      'https://www.trustpilot.com/review/photogov.net'
    ],
    publishingPrinciples: 'https://photogov.net/editorial-policy/',
    legalName: 'Y VISION TECHNOLOGIES LLP',
    foundingDate: '2024-02-28',
    url: 'https://photogov.net/',
    logo: {
      '@type': 'ImageObject',
      url: 'https://photogov.net/favicon/android-chrome-512x512.png'
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Stoney Works 8 Stoney Lane',
      addressLocality: 'London',
      addressRegion: 'England',
      postalCode: 'SE19 3BD',
      addressCountry: 'GB'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      url: 'https://photogov.net/support/',
      email: 'info@photogov.net',
      contactType: 'Customer Service',
      availableLanguage: ['en', 'es', 'it', 'pt', 'de', 'hi'],
      areaServed: AREA_SERVED
    }
  }))

  const scripts = computed(() => [
    {
      key: 'ld-organization',
      type: 'application/ld+json',
      innerHTML: JSON.stringify(schema.value).replace(/</g, '\\u003c')
    }
  ])

  return { schema, scripts }
}
