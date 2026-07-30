import pressureTankImage from '../../assets/storefront/pressure-tank.webp'
import waterPumpImage from '../../assets/storefront/water-pump.webp'

export type CategoryProductsVariant = 'water-pumps' | 'accessories'

export interface CategoryProductsConfig {
  key: CategoryProductsVariant
  title: string
  categorySlug: string
  description: string
  supportingText: string
  heroImage: string
  heroImageAlt: string
  subcategories: string[]
}

export const categoryProductsConfigs: Record<
  CategoryProductsVariant,
  CategoryProductsConfig
> = {
  'water-pumps': {
    key: 'water-pumps',
    title: 'پمپ آب',
    categorySlug: 'water-pump',
    description: 'انواع پمپ آب خانگی، صنعتی، سانتریفیوژ و تقویت فشار',
    supportingText: 'بیش از ۲۳۰ محصول از برندهای معتبر',
    heroImage: waterPumpImage,
    heroImageAlt: 'پمپ آب صنعتی آبی',
    subcategories: [
      'پمپ آب خانگی',
      'پمپ محیطی',
      'پمپ جتی',
      'پمپ دو پروانه',
      'پمپ آب کشاورزی',
      'پمپ آب نیم‌اسب',
      'پمپ آب استخری',
      'موتور پمپ',
    ],
  },
  accessories: {
    key: 'accessories',
    title: 'تجهیزات جانبی',
    categorySlug: 'accessories',
    description: 'مجموعه کامل تجهیزات جانبی سیستم‌های پمپاژ، کنترل و انتقال سیالات',
    supportingText: 'محصولات باکیفیت از برندهای معتبر صنعتی',
    heroImage: pressureTankImage,
    heroImageAlt: 'مخزن تحت فشار قرمز',
    subcategories: [
      'لوله خرطومی',
      'ست کنترل',
      'مخزن تحت فشار',
      'اینورتر',
      'تصفیه آب',
    ],
  },
}

export const mockProductNames = [
  'پمپ آب بشقابی مدل CM100',
  'پمپ آب محیطی مدل PM80',
  'پمپ جتی یک اسب مدل JET100',
  'پمپ دو پروانه صنعتی',
  'مخزن تحت فشار ۲۴ لیتری',
  'ست کنترل دیجیتال پمپ',
  'اینورتر کنترل دور موتور',
  'فیلتر تصفیه آب صنعتی',
  'پمپ آب نیم اسب خانگی',
  'پمپ آب کشاورزی دو اینچ',
  'کلید اتوماتیک فشار',
  'منبع انبساط ۵۰ لیتری',
] as const

export const mockBrands = [
  { name: 'EBARA', slug: 'ebara' },
  { name: 'VORTICE', slug: 'vortice' },
  { name: 'پمپیران', slug: 'pumpiran' },
  { name: 'Wilo', slug: 'wilo' },
  { name: 'Volt', slug: 'volt' },
  { name: 'LEO', slug: 'leo' },
  { name: 'WAT', slug: 'wat' },
  { name: 'Calmo', slug: 'calmo' },
] as const

export const technicalFilters = [
  'نوع هواکش',
  'توان موتور (اسب بخار)',
  'قطر پروانه (سانتیمتر)',
  'دبی هوا (متر مکعب بر ساعت)',
  'ولتاژ (ولت)',
  'جنس بدنه',
  'موجودی',
] as const
