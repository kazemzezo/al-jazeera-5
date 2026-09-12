// ============================================
// catalog.js — تصنيفات الأصناف وأنواع البيع
// ============================================

// أنواع البيع
export const SALE_TYPES = {
  TON: "ton",       // يُباع بالطن
  PIECE: "piece",   // يُباع بالعدد
  DEAL: "deal",     // صفقة (سعر ثابت، كمية غير قابلة للتعديل)
};

export const SALE_TYPES_LABELS = {
  [SALE_TYPES.TON]: "بالطن",
  [SALE_TYPES.PIECE]: "بالعدد",
  [SALE_TYPES.DEAL]: "صفقة",
};

// الوحدات المقترحة لكل نوع
export const SALE_TYPE_UNIT = {
  [SALE_TYPES.TON]: "طن",
  [SALE_TYPES.PIECE]: "قطعة",
  [SALE_TYPES.DEAL]: "صفقة",
};

// الأصناف الافتراضية (Fallback — بتُستخدم لحد ما الأدمن يضيف أصنافه)
export const TON_CATEGORIES = [
  "حديد",
  "نحاس",
  "الومونيوم",
  "ظهر",
  "اخشاب",
  "صفائح",
  "كاوتش وفندر",
  "بلاستيك",
  "قطع غيار مختلفه",
];

export const LOT_CATEGORIES = [
  "اجهزه كهربائيه",
  "معدات بحريه",
  "معدات كهربائيه",
  "مركبات بحريه",
  "سيارات",
  "معدات ورش",
  "ماكينات بحريه",
  "كابلات مختلفه",
  "ألواح صاج",
];

export const PIECE_CATEGORIES = [
  "تانكات سعة 1000 لتر",
  "براميل سعة 200 لتر",
  "براميل سعة 100 لتر",
  "كاوتش سيارات 70%",
];

export function categoriesForSaleType(saleType) {
  if (saleType === SALE_TYPES.TON) return TON_CATEGORIES;
  if (saleType === SALE_TYPES.PIECE) return PIECE_CATEGORIES;
  if (saleType === SALE_TYPES.DEAL) return LOT_CATEGORIES;
  return [];
}

// المواقع
export const LOCATIONS = {
  DOCK: "dock",
  YARD: "yard",
};

export const SITE_MAINTENANCE_FEE = {
  [LOCATIONS.DOCK]: 200,
  [LOCATIONS.YARD]: 300,
};
