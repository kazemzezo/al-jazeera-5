import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

/* ============================================
   طلب حذف حساب
   ============================================ */
export async function requestAccountDeletion(user, profile) {
  if (!user) throw new Error("لازم تسجل دخول الأول");

  // امنع التكرار: لو فيه طلب معلق موجود
  const q = query(
    collection(db, "deletion_requests"),
    where("uid", "==", user.uid),
    where("status", "==", "pending")
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    throw new Error(
      "لديك طلب حذف قيد المراجعة بالفعل. سيتم التواصل معك قريبًا."
    );
  }

  await addDoc(collection(db, "deletion_requests"), {
    uid: user.uid,
    email: user.email || "",
    name: profile?.name || user.displayName || "",
    phone: profile?.phone || "",
    company: profile?.company || "",
    governorate: profile?.governorate || "",
    role: profile?.role || "trader",
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

/* ============================================
   طلبات الحذف (للأدمن) - كلها
   ============================================ */
export function subscribeAllDeletionRequests(callback, onError) {
  return onSnapshot(
    collection(db, "deletion_requests"),
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
   طلب التاجر الحالي
   ============================================ */
export function subscribeMyDeletionRequest(uid, callback) {
  if (!uid) {
    callback(null);
    return () => {};
  }
  const q = query(
    collection(db, "deletion_requests"),
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
      callback(items[0] || null);
    },
    (err) => {
      console.error("فشل تحميل طلب الحذف:", err);
      callback(null);
    }
  );
}

/* ============================================
   رفض الطلب
   ============================================ */
export async function rejectDeletionRequest(requestId, reason, adminUid) {
  await updateDoc(doc(db, "deletion_requests", requestId), {
    status: "rejected",
    rejectReason: reason || "",
    reviewedAt: serverTimestamp(),
    reviewedBy: adminUid,
  });
}

/* ============================================
   تعليم الطلب كمُنفّذ
   (يُستدعى بعد ما الأدمن يحذف الحساب فعلاً)
   ============================================ */
export async function markDeletionCompleted(requestId, adminUid) {
  await updateDoc(doc(db, "deletion_requests", requestId), {
    status: "completed",
    completedAt: serverTimestamp(),
    completedBy: adminUid,
  });
}

/* ============================================
   جلب كل بيانات المستخدم (للأدمن قبل الحذف)
   ============================================ */
export async function getUserFullData(uid) {
  if (!uid) return null;

  const result = {
    profile: null,
    wallet: null,
    transactions: [],
    reservations: [],
    verificationRequests: [],
    codes: [],
  };

  // البروفايل
  try {
    const userSnap = await getDoc(doc(db, "users", uid));
    if (userSnap.exists()) {
      result.profile = { id: userSnap.id, ...userSnap.data() };
    }
  } catch (err) {
    console.warn("فشل تحميل البروفايل:", err);
  }

  // المحفظة
  try {
    const walletSnap = await getDoc(doc(db, "wallets", uid));
    if (walletSnap.exists()) {
      result.wallet = { id: walletSnap.id, ...walletSnap.data() };
    }
  } catch (err) {
    console.warn("فشل تحميل المحفظة:", err);
  }

  // المعاملات
  try {
    const q = query(
      collection(db, "wallet_transactions"),
      where("uid", "==", uid)
    );
    const snap = await getDocs(q);
    result.transactions = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    result.transactions.sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() || 0;
      const tb = b.createdAt?.toMillis?.() || 0;
      return tb - ta;
    });
  } catch (err) {
    console.warn("فشل تحميل المعاملات:", err);
  }

  // الحجوزات
  try {
    const q = query(
      collection(db, "reservations"),
      where("uid", "==", uid)
    );
    const snap = await getDocs(q);
    result.reservations = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    result.reservations.sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() || 0;
      const tb = b.createdAt?.toMillis?.() || 0;
      return tb - ta;
    });
  } catch (err) {
    console.warn("فشل تحميل الحجوزات:", err);
  }

  // طلبات التوثيق
  try {
    const q = query(
      collection(db, "verification_requests"),
      where("uid", "==", uid)
    );
    const snap = await getDocs(q);
    result.verificationRequests = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  } catch (err) {
    console.warn("فشل تحميل طلبات التوثيق:", err);
  }

  // أكواد التوثيق
  try {
    const q = query(
      collection(db, "verification_codes_history"),
      where("uid", "==", uid)
    );
    const snap = await getDocs(q);
    result.codes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("فشل تحميل الأكواد:", err);
  }

  return result;
}
