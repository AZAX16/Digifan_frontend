import electricMotorImage from '../../assets/storefront/electric-motor-hero.png'
import industrialFanImage from '../../assets/storefront/industrial-fan-hero.png'
import pressureTankImage from '../../assets/storefront/pressure-tank.webp'
import waterPumpImage from '../../assets/storefront/water-pump.webp'

export type CategoryProductsVariant =
  | 'industrial-fans'
  | 'electric-motors'
  | 'water-pumps'
  | 'accessories'

export interface CategoryProductsConfig {
  key: CategoryProductsVariant
  route: string
  title: string
  menuLabel: string
  categorySlug: string
  description: string
  supportingText: string
  heroImage: string
  heroImageAlt: string
  heroImageClassName?: string
  showProductCount?: boolean
  fallbackProductCount: number
  subcategories: string[]
  mockProductNames: string[]
}

export const categoryProductsConfigs: Record<
  CategoryProductsVariant,
  CategoryProductsConfig
> = {
  'industrial-fans': {
    key: 'industrial-fans',
    route: '#/category/industrial-fans',
    title: 'هواکش‌های صنعتی',
    menuLabel: 'هواکش صنعتی',
    categorySlug: 'industrial-fans',
    description: 'انواع هواکش‌های صنعتی، معدنی، سانتریفیوژ و مکنده',
    supportingText: 'بیش از ۳۳۰ محصول از برندهای معتبر',
    heroImage: industrialFanImage,
    heroImageAlt: 'هواکش صنعتی با پروانه آبی',
    heroImageClassName: 'scale-[1.05] lg:-translate-y-2',
    showProductCount: true,
    fallbackProductCount: 330,
    subcategories: [
      'هواکش خانگی',
      'هواکش شهری',
      'هواکش صنعتی',
      'هواکش بین کانالی',
      'هواکش سانتریفیوژ',
      'هواکش سقفی',
      'هواکش سردخانه‌ای',
      'هواکش سرچاهی',
      'هواکش مرغداری و گلخانه‌ای',
    ],
    mockProductNames: [
      'هواکش صنعتی محوری مدل AX-500',
      'هواکش سانتریفیوژ دوطرفه',
      'هواکش بین کانالی کم‌صدا',
      'فن سقفی صنعتی مدل VF-40',
      'اگزاست فن مرغداری',
      'هواکش سردخانه‌ای پرقدرت',
      'هواکش خانگی فلزی',
      'فن مکنده کارگاهی',
      'هواکش ضد انفجار صنعتی',
      'فن دمنده سانتریفیوژ',
      'هواکش محوری سه‌فاز',
      'فن تهویه تابلو برق',
    ],
  },
  'electric-motors': {
    key: 'electric-motors',
    route: '#/category/electric-motors',
    title: 'الکتروموتور',
    menuLabel: 'الکتروموتور',
    categorySlug: 'electric-motors',
    description: 'انواع الکتروموتورهای سه‌فاز و تک‌فاز',
    supportingText: 'بیش از ۷۸ محصول از برندهای معتبر',
    heroImage: electricMotorImage,
    heroImageAlt: 'الکتروموتور صنعتی',
    heroImageClassName: 'scale-[1.08] lg:-translate-y-1',
    showProductCount: true,
    fallbackProductCount: 78,
    subcategories: [
      'الکتروموتور تک‌فاز',
      'الکتروموتور سه‌فاز (پوسته آلومینیوم)',
      'الکتروموتور سه‌فاز (پوسته چدن)',
    ],
    mockProductNames: [
      'الکتروموتور سه‌فاز ۳ کیلووات',
      'الکتروموتور تک‌فاز ۲ اسب',
      'الکتروموتور پوسته چدن صنعتی',
      'الکتروموتور پوسته آلومینیوم',
      'موتور الکتریکی دور بالا',
      'الکتروموتور ترمزدار',
      'الکتروموتور ضد انفجار',
      'موتور سه‌فاز فلنج‌دار',
      'الکتروموتور گیربکس‌دار',
      'موتور تک‌فاز خازن‌دار',
      'الکتروموتور صنعتی IE3',
      'موتور الکتریکی دائم‌کار',
    ],
  },
  'water-pumps': {
    key: 'water-pumps',
    route: '#/category/water-pumps',
    title: 'پمپ آب',
    menuLabel: 'پمپ آب',
    categorySlug: 'water-pump',
    description: 'انواع پمپ آب خانگی، صنعتی، سانتریفیوژ و تقویت فشار',
    supportingText: 'بیش از ۲۳۰ محصول از برندهای معتبر',
    heroImage: waterPumpImage,
    heroImageAlt: 'پمپ آب صنعتی آبی',
    fallbackProductCount: 230,
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
    mockProductNames: [
      'پمپ آب بشقابی مدل CM100',
      'پمپ آب محیطی مدل PM80',
      'پمپ جتی یک اسب مدل JET100',
      'پمپ دو پروانه صنعتی',
      'پمپ آب نیم‌اسب خانگی',
      'پمپ آب کشاورزی دو اینچ',
      'پمپ سانتریفیوژ صنعتی',
      'بوستر پمپ تقویت فشار',
      'پمپ آب استخری کم‌صدا',
      'کف‌کش دو اینچ',
      'لجن‌کش سه‌فاز',
      'موتور پمپ بنزینی',
    ],
  },
  accessories: {
    key: 'accessories',
    route: '#/category/accessories',
    title: 'تجهیزات جانبی',
    menuLabel: 'تجهیزات جانبی',
    categorySlug: 'accessories',
    description: 'مجموعه کامل تجهیزات جانبی سیستم‌های پمپاژ، کنترل و انتقال سیالات',
    supportingText: 'محصولات باکیفیت از برندهای معتبر صنعتی',
    heroImage: pressureTankImage,
    heroImageAlt: 'مخزن تحت فشار قرمز',
    heroImageClassName: 'scale-[0.94]',
    fallbackProductCount: 120,
    subcategories: [
      'لوله خرطومی',
      'ست کنترل',
      'مخزن تحت فشار',
      'اینورتر',
      'تصفیه آب',
    ],
    mockProductNames: [
      'مخزن تحت فشار ۲۴ لیتری',
      'ست کنترل دیجیتال پمپ',
      'اینورتر کنترل دور موتور',
      'فیلتر تصفیه آب صنعتی',
      'کلید اتوماتیک فشار',
      'منبع انبساط ۵۰ لیتری',
      'شلنگ خرطومی تقویت‌شده',
      'گیج فشار روغنی',
      'پنج‌راهی برنجی پمپ',
      'شیر یک‌طرفه صنعتی',
      'تابلو کنترل بوستر پمپ',
      'کابل شناور ضد آب',
    ],
  },
}

export const categoryNavigationItems = Object.values(categoryProductsConfigs).map(
  ({ key, route, menuLabel }) => ({ key, route, label: menuLabel }),
)

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
