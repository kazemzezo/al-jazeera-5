import { SALE_TYPES, LOCATIONS } from "./catalog";

export const DEMO_TON_PRICES = {
  "حديد": { name: "حديد", pricePerTon: 20000 },
  "نحاس": { name: "نحاس", pricePerTon: 300000 },
  "الومونيوم": { name: "الومونيوم", pricePerTon: 20000 },
  "ظهر": { name: "ظهر", pricePerTon: 8000 },
  "اخشاب": { name: "اخشاب", pricePerTon: 3000 },
  "صفائح": { name: "صفائح", pricePerTon: 15000 },
  "كاوتش وفندر": { name: "كاوتش وفندر", pricePerTon: 6000 },
  "بلاستيك": { name: "بلاستيك", pricePerTon: 7000 },
  "قطع غيار مختلفه": { name: "قطع غيار مختلفه", pricePerTon: 10000 },
};

export const DEMO_LISTINGS = [
  { id: "demo-1", location: LOCATIONS.DOCK, saleType: SALE_TYPES.TON, category: "حديد", quantity: 8, reservedQty: 0, demo: true },
  { id: "demo-2", location: LOCATIONS.DOCK, saleType: SALE_TYPES.TON, category: "نحاس", quantity: 5, reservedQty: 0, demo: true },
  { id: "demo-3", location: LOCATIONS.DOCK, saleType: SALE_TYPES.LOT, category: "كابلات مختلفه", lotPrice: 45000, reservedQty: 0, demo: true },
  { id: "demo-4", location: LOCATIONS.DOCK, saleType: SALE_TYPES.PIECE, category: "براميل سعة 200 لتر", quantity: 40, piecePrice: 150, reservedQty: 0, demo: true },
  { id: "demo-5", location: LOCATIONS.YARD, saleType: SALE_TYPES.TON, category: "حديد", quantity: 400, reservedQty: 0, demo: true },
  { id: "demo-6", location: LOCATIONS.YARD, saleType: SALE_TYPES.LOT, category: "سيارات", lotPrice: 1200000, reservedQty: 0, demo: true },
  { id: "demo-7", location: LOCATIONS.YARD, saleType: SALE_TYPES.TON, category: "نحاس", quantity: 120, reservedQty: 0, demo: true },
];

export const DEMO_ANNOUNCEMENTS = {
  [LOCATIONS.DOCK]: [
    { id: "a1", text: "يوجد 10 طن حديد و5 طن نحاس و20 طن متنوعات متاحة غدًا بالرصيف البحري" },
  ],
  [LOCATIONS.YARD]: [
    { id: "a2", text: "لوط سيارات جديد بساحة الجزيره - التفاصيل بالأسفل" },
  ],
};
