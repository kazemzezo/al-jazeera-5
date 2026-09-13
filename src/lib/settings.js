import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";

/* ============================================
   القيم الافتراضية
   ============================================ */
export const DEFAULT_SETTINGS = {
  // أمانة التوثيق
  dockFee: 3000,
  yardFee: 10000,

  // بيانات الدفع
  instapay: "popoflop@instapay",
  instapayLink: "https://ipn.eg/S/popoflop/instapay/2XUZ3C",
  vodafoneCash: "01005885938",

  // قايمة الخصومات
  deductions: [
    { id: "d1", reason: "تأخير 30 دقيقة", amount: 100 },
    { id: "d2", reason: "تأخير ساعة", amount: 250 },
    { id: "d3", reason: "تأخير 3 ساعات", amount: 500 },
    { id: "d4", reason: "إتلاف صغير", amount: 500 },
    { id: "d5", reason: "إتلاف متوسط", amount: 1500 },
    { id: "d6", reason: "إتلاف كبير", amount: 5000 },
  ],

  // رسوم الدفع الناقص
  missingPaymentFee: {
    per: 1000,
    amount: 20,
  },
};

const SETTINGS_DOC_ID = "config";

/* ============================================
   قراءة الإعدادات (live)
   ============================================ */
export function subscribeSettings(callback, onError) {
  const ref = doc(db, "settings", SETTINGS_DOC_ID);
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        callback({ ...DEFAULT_SETTINGS, ...snap.data() });
      } else {
        callback(DEFAULT_SETTINGS);
      }
    },
    (err) => {
      console.error("فشل تحميل الإعدادات:", err);
      callback(DEFAULT_SETTINGS);
      if (onError) onError(err);
    }
  );
}

/* ============================================
   قراءة الإعدادات مرة واحدة
   ============================================ */
export async function getSettings() {
  const ref = doc(db, "settings", SETTINGS_DOC_ID);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { ...DEFAULT_SETTINGS, ...snap.data() };
  }
  return DEFAULT_SETTINGS;
}

/* ============================================
   حفظ الإعدادات
   ============================================ */
export async function updateSettings(updates, uid) {
  const ref = doc(db, "settings", SETTINGS_DOC_ID);
  await setDoc(
    ref,
    {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    },
    { merge: true }
  );
}

/* ============================================
   إنشاء الإعدادات الافتراضية لو مش موجودة
   ============================================ */
export async function ensureSettingsExist(uid) {
  const ref = doc(db, "settings", SETTINGS_DOC_ID);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      ...DEFAULT_SETTINGS,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    });
    return { created: true };
  }
  return { created: false };
}

/* ============================================
   حساب رسوم الدفع الناقص
   ============================================
   القاعدة: كل 1,000ج (أو جزء منها) = 20ج رسوم
   مثال: 1,200ج ناقص → 2 × 20 = 40ج
   ============================================ */
export function calcMissingPaymentFee(
  missingAmount,
  settings = DEFAULT_SETTINGS
) {
  const fee = settings.missingPaymentFee || DEFAULT_SETTINGS.missingPaymentFee;
  const { per, amount } = fee;
  if (missingAmount <= 0 || per <= 0) return 0;
  return Math.ceil(missingAmount / per) * amount;
}

/* ============================================
   الحصول على رسوم التوثيق حسب النوع
   ============================================ */
export function getVerificationFee(type, settings = DEFAULT_SETTINGS) {
  if (type === "dock") return settings.dockFee;
  if (type === "yard") return settings.yardFee;
  return 0;
}

/* ============================================
   الحد الأدنى للمحفظة (نفس الرسوم)
   ============================================ */
export function getMinBalance(type, settings = DEFAULT_SETTINGS) {
  return getVerificationFee(type, settings);
}
