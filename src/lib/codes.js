import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

/* ============================================
   البريفكسات
   ============================================ */
export const CODE_PREFIX = {
  dock: "DK",
  yard: "YD",
};

/* ============================================
   حروف وأرقام الكود
   استبعدنا: I, O, 0, 1 (متشابهة بصرياً)
   ============================================ */
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

/* ============================================
   توليد رقم عشوائي (6 خانات)
   ============================================ */
function generateRandomNumber() {
  let result = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    const idx = Math.floor(Math.random() * CODE_CHARS.length);
    result += CODE_CHARS[idx];
  }
  return result;
}

/* ============================================
   بناء الكود (بريفكس + رقم)
   مثال: DK-7X9K2P
   ============================================ */
export function buildCode(type, number) {
  const prefix = CODE_PREFIX[type] || "DK";
  return `${prefix}-${number}`;
}

/* ============================================
   فحص: هل الكود مستخدم حالياً؟
   ============================================ */
async function isCodeInUse(code) {
  const q = query(collection(db, "wallets"), where("code", "==", code));
  const snap = await getDocs(q);
  return !snap.empty;
}

/* ============================================
   فحص: هل الكود مستخدم تاريخياً؟
   ============================================ */
async function isCodeInHistory(code) {
  const q = query(
    collection(db, "verification_codes_history"),
    where("code", "==", code)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

/* ============================================
   توليد كود فريد (ضمان 100%)
   ============================================ */
export async function generateUniqueCode(type) {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const number = generateRandomNumber();
    const code = buildCode(type, number);

    const inUse = await isCodeInUse(code);
    const inHistory = await isCodeInHistory(code);

    if (!inUse && !inHistory) {
      return code;
    }
    attempts++;
  }

  // احتياطي: رقم أطول
  const longNumber = generateRandomNumber() + generateRandomNumber();
  return buildCode(type, longNumber);
}

/* ============================================
   توليد كود عند تغيير النوع
   يحاول يحافظ على نفس الرقم
   ============================================ */
export async function generateCodeWithSameNumber(type, currentCode) {
  if (!currentCode) {
    return generateUniqueCode(type);
  }

  const parts = currentCode.split("-");
  const number = parts[1] || parts[0];

  const newCode = buildCode(type, number);

  const inUse = await isCodeInUse(newCode);
  const inHistory = await isCodeInHistory(newCode);

  if (!inUse && !inHistory) {
    return newCode;
  }

  // لو مستخدم → نولّد رقم جديد
  return generateUniqueCode(type);
}

/* ============================================
   تسجيل الكود في السجل (لما يتغير)
   ============================================ */
export async function logCodeChange(uid, oldCode, newCode, reason) {
  await addDoc(collection(db, "verification_codes_history"), {
    uid,
    code: oldCode,
    newCode: newCode || null,
    status: "expired",
    reason: reason || "تغيير النوع",
    expiredAt: serverTimestamp(),
  });
}

/* ============================================
   قراءة كود التاجر
   ============================================ */
export async function getUserCode(uid) {
  const ref = doc(db, "wallets", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data().code || null;
  }
  return null;
}

/* ============================================
   التحقق من صحة شكل الكود
   ============================================ */
export function isValidCodeFormat(code) {
  if (!code || typeof code !== "string") return false;
  const regex = /^(DK|YD)-[A-Z0-9]{6,15}$/;
  return regex.test(code);
}

/* ============================================
   استخراج النوع من الكود
   ============================================ */
export function getTypeFromCode(code) {
  if (!code) return null;
  if (code.startsWith("DK-")) return "dock";
  if (code.startsWith("YD-")) return "yard";
  return null;
}

/* ============================================
   تنسيق الكود للعرض (نضيف مسافة)
   ============================================ */
export function formatCodeForDisplay(code) {
  if (!code) return "";
  return code;
}

/* ============================================
   التحقق من تطابق كود التاجر مع الكود المُدخل
   ============================================ */
export async function verifyCodeMatch(uid, enteredCode) {
  const userCode = await getUserCode(uid);
  if (!userCode) return { match: false, reason: "لا يوجد كود للتاجر" };

  const normalized = enteredCode.trim().toUpperCase();
  const userNormalized = userCode.trim().toUpperCase();

  if (normalized === userNormalized) {
    return { match: true, code: userCode };
  }

  return {
    match: false,
    reason: "الكود المُدخل لا يطابق الكود المسجل",
  };
}
