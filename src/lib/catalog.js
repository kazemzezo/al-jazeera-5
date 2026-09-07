// أصناف تباع بالطن (لها سعر موحد باليومية يظهر في شريط الأسعار)
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

// أصناف تباع بنظام لوط (سعر إجمالي ثابت لكل لوط يحدده الأدمن عند الإضافة)
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

// أصناف تباع بالقطعة (سعر ثابت للقطعة يحدده الأدمن)
export const PIECE_CATEGORIES = [
  "تانكات سعة 1000 لتر",
  "براميل سعة 200 لتر",
  "براميل سعة 100 لتر",
  "كاوتش سيارات 70%",
];

export const SALE_TYPES = {
  TON: "ton",
  LOT: "lot",
  PIECE: "piece",
};

export function categoriesForSaleType(saleType) {
  if (saleType === SALE_TYPES.TON) return TON_CATEGORIES;
  if (saleType === SALE_TYPES.LOT) return LOT_CATEGORIES;
  if (saleType === SALE_TYPES.PIECE) return PIECE_CATEGORIES;
  return [];
}

export const LOCATIONS = {
  DOCK: "dock", // الرصيف البحري
  YARD: "yard", // ساحة الجزيره
};

export const SITE_MAINTENANCE_FEE = {
  [LOCATIONS.DOCK]: 200,
  [LOCATIONS.YARD]: 300,
};
