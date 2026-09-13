import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  generateUniqueCode,
  generateCodeWithSameNumber,
  logCodeChange,
} from "./codes";
import { getSettings, getMinBalance } from "./settings";

/* ============================================
   قراءة محفظة تاجر (live)
   ============================================ */
export function subscribeWallet(uid, callback, onError) {
  if (!uid) {
    callback(null);
    return () => {};
  }
  return onSnapshot(
    doc(db, "wallets", uid),
    (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() });
      } else {
        callback(null);
      }
    },
    (err) => {
      console.error("فشل تحميل المحفظة:", err);
      callback(null);
      if (onError) onError(err);
    }
  );
}

/* ============================================
   قراءة كل المحافظ (للأدمن)
   ============================================ */
export function subscribeAllWallets(callback, onError) {
  return onSnapshot(
    collection(db, "wallets"),
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() || 0;
        const tb = b.createdAt?.toMillis?.() || 0;
        return tb - ta;
      });
      callback(items);
    },
    onError
  );
}

/* ============================================
   قراءة المحفظة (مرة واحدة)
   ============================================ */
export async function getWallet(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, "wallets", uid));
  if (snap.exists()) return { id: snap.id, ...snap.data() };
  return null;
}

/* ============================================
   إنشاء محفظة جديدة (وقت الموافقة على التوثيق)
   ============================================ */
export async function createWallet(uid, type, adminUid) {
  const settings = await getSettings();
  const initialBalance = type === "dock" ? settings.dockFee : settings.yardFee;
  const code = await generateUniqueCode(type);

  const walletRef = doc(db, "wallets", uid);
  const existing = await getDoc(walletRef);

  if (existing.exists()) {
    throw new Error("التاجر عنده محفظة بالفعل");
  }

  await setDoc(walletRef, {
    uid,
    balance: initialBalance,
    type,
    code,
    status: "active",
    previousCodes: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // تسجيل العملية
  await addWalletTransaction({
    uid,
    type: "deposit",
    amount: initialBalance,
    reason: `أمانة توثيق (${type === "dock" ? "رصيف" : "ساحة"})`,
    adminUid,
  });

  // تسجيل الكود في السجل
  await addDoc(collection(db, "verification_codes_history"), {
    uid,
    code,
    status: "active",
    type,
    createdAt: serverTimestamp(),
    reason: "توليد أول كود",
  });

  return { code, balance: initialBalance };
}

/* ============================================
   تغيير نوع التوثيق (ترقية / تعديل)
   ============================================ */
export async function changeWalletType(uid, newType, adminUid, reason) {
  const walletRef = doc(db, "wallets", uid);
  const snap = await getDoc(walletRef);
  if (!snap.exists()) throw new Error("المحفظة غير موجودة");

  const wallet = snap.data();
  const oldType = wallet.type;

  if (oldType === newType) {
    throw new Error("النوع نفسه — مفيش تغيير");
  }

  const settings = await getSettings();
  const oldFee = oldType === "dock" ? settings.dockFee : settings.yardFee;
  const newFee = newType === "dock" ? settings.dockFee : settings.yardFee;
  const diff = newFee - oldFee;

  // توليد كود جديد بنفس الرقم (أو رقم جديد لو في تعارض)
  const newCode = await generateCodeWithSameNumber(newType, wallet.code);

  // حساب الرصيد الجديد
  let newBalance = wallet.balance;
  let reasonText = "";

  if (diff > 0) {
    // ترقية: نفترض إنه دفع الفرق بره النظام
    newBalance = wallet.balance + diff;
    reasonText = `ترقية من ${
      oldType === "dock" ? "رصيف" : "ساحة"
    } إلى ${newType === "dock" ? "رصيف" : "ساحة"} (+${diff}ج)`;
  } else {
    // تخفيض: الفرق يُرجّع في المحفظة
    reasonText = `تغيير نوع من ${
      oldType === "dock" ? "رصيف" : "ساحة"
    } إلى ${
      newType === "dock" ? "رصيف" : "ساحة"
    } (الرصيد نفسه)`;
  }

  // تسجيل الكود القديم
  if (wallet.code && wallet.code !== newCode) {
    await logCodeChange(uid, wallet.code, newCode, reason || reasonText);
  }

  // تحديث المحفظة
  const previousCodes = wallet.previousCodes || [];
  if (wallet.code && wallet.code !== newCode) {
    previousCodes.push(wallet.code);
  }

  await updateDoc(walletRef, {
    type: newType,
    code: newCode,
    balance: newBalance,
    previousCodes,
    updatedAt: serverTimestamp(),
  });

  // تسجيل العملية
  await addWalletTransaction({
    uid,
    type: diff > 0 ? "deposit" : "adjustment",
    amount: Math.abs(diff),
    reason: reasonText,
    adminUid,
  });

  // تسجيل الكود الجديد
  await addDoc(collection(db, "verification_codes_history"), {
    uid,
    code: newCode,
    status: "active",
    type: newType,
    createdAt: serverTimestamp(),
    reason: reason || "تغيير نوع التوثيق",
  });

  return { code: newCode, balance: newBalance, diff };
}

/* ============================================
   إضافة رصيد (من الأدمن)
   ============================================ */
export async function addToWallet(uid, amount, reason, adminUid) {
  if (!amount || amount <= 0) throw new Error("المبلغ غير صحيح");

  const walletRef = doc(db, "wallets", uid);
  const snap = await getDoc(walletRef);
  if (!snap.exists()) throw new Error("المحفظة غير موجودة");

  const wallet = snap.data();
  const newBalance = wallet.balance + Number(amount);

  await updateDoc(walletRef, {
    balance: newBalance,
    updatedAt: serverTimestamp(),
  });

  await addWalletTransaction({
    uid,
    type: "deposit",
    amount: Number(amount),
    reason: reason || "إضافة رصيد",
    adminUid,
  });

  return newBalance;
}

/* ============================================
   خصم من الرصيد (من الأدمن)
   ============================================ */
export async function deductFromWallet(uid, amount, reason, adminUid) {
  if (!amount || amount <= 0) throw new Error("المبلغ غير صحيح");

  const walletRef = doc(db, "wallets", uid);
  const snap = await getDoc(walletRef);
  if (!snap.exists()) throw new Error("المحفظة غير موجودة");

  const wallet = snap.data();
  const newBalance = Math.max(0, wallet.balance - Number(amount));

  await updateDoc(walletRef, {
    balance: newBalance,
    updatedAt: serverTimestamp(),
  });

  await addWalletTransaction({
    uid,
    type: "deduction",
    amount: Number(amount),
    reason: reason || "خصم",
    adminUid,
  });

  return newBalance;
}

/* ============================================
   تعليق المحفظة
   ============================================ */
export async function suspendWallet(uid, reason, adminUid) {
  const walletRef = doc(db, "wallets", uid);
  await updateDoc(walletRef, {
    status: "suspended",
    suspendedAt: serverTimestamp(),
    suspendedReason: reason || "",
    updatedAt: serverTimestamp(),
  });

  await addWalletTransaction({
    uid,
    type: "suspend",
    amount: 0,
    reason: reason || "تعليق المحفظة",
    adminUid,
  });
}

/* ============================================
   تفعيل المحفظة
   ============================================ */
export async function activateWallet(uid, adminUid) {
  const walletRef = doc(db, "wallets", uid);
  await updateDoc(walletRef, {
    status: "active",
    suspendedAt: null,
    suspendedReason: "",
    updatedAt: serverTimestamp(),
  });

  await addWalletTransaction({
    uid,
    type: "activate",
    amount: 0,
    reason: "تفعيل المحفظة",
    adminUid,
  });
}

/* ============================================
   تسجيل عملية في سجل العمليات
   ============================================ */
async function addWalletTransaction({
  uid,
  type,
  amount,
  reason,
  adminUid,
  relatedReservationId = null,
}) {
  await addDoc(collection(db, "wallet_transactions"), {
    uid,
    type,
    amount: Number(amount),
    reason,
    adminUid: adminUid || null,
    relatedReservationId,
    createdAt: serverTimestamp(),
  });
}

/* ============================================
   قراءة عمليات تاجر معين
   ============================================ */
export function subscribeWalletTransactions(uid, callback, onError) {
  if (!uid) {
    callback([]);
    return () => {};
  }
  const q = query(
    collection(db, "wallet_transactions"),
    where("uid", "==", uid)
  );
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() || 0;
        const tb = b.createdAt?.toMillis?.() || 0;
        return tb - ta;
      });
      callback(items);
    },
    (err) => {
      console.error("فشل تحميل عمليات المحفظة:", err);
      callback([]);
      if (onError) onError(err);
    }
  );
}

/* ============================================
   قراءة كل عمليات المحفظة (للأدمن)
   ============================================ */
export function subscribeAllWalletTransactions(callback, onError) {
  return onSnapshot(
    collection(db, "wallet_transactions"),
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() || 0;
        const tb = b.createdAt?.toMillis?.() || 0;
        return tb - ta;
      });
      callback(items);
    },
    onError
  );
}

/* ============================================
   فحص: هل التاجر يقدر يحجز؟
   ============================================ */
export async function canTraderReserve(uid) {
  const wallet = await getWallet(uid);
  if (!wallet) {
    return {
      allowed: false,
      reason: "لا يوجد محفظة — لازم توثيق أولاً",
    };
  }

  if (wallet.status === "suspended") {
    return {
      allowed: false,
      reason: "المحفظة معلّقة — تواصل مع الإدارة",
    };
  }

  const settings = await getSettings();
  const minBalance = getMinBalance(wallet.type, settings);

  if (wallet.balance < minBalance) {
    return {
      allowed: false,
      reason: `رصيدك ${wallet.balance.toLocaleString(
        "ar-EG"
      )}ج أقل من الحد الأدنى (${minBalance.toLocaleString("ar-EG")}ج)`,
      balance: wallet.balance,
      minRequired: minBalance,
    };
  }

  return {
    allowed: true,
    balance: wallet.balance,
    type: wallet.type,
  };
}

/* ============================================
   إضافة مبلغ للرصيد عند نقص الوزن
   ============================================ */
export async function addWeightRefund(
  uid,
  amount,
  reservationId,
  adminUid,
  reason
) {
  const newBalance = await addToWallet(
    uid,
    amount,
    reason || "تعويض عن نقص الوزن",
    adminUid
  );
  return newBalance;
}
