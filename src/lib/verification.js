import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { ROLES } from "./roles";

/* ============================================
   طلب توثيق جديد
   ============================================ */
export async function requestVerification(user, profile, extra = {}) {
  // امنع التكرار: لو فيه طلب معلق موجود، ارمي خطأ
  const pendingQuery = query(
    collection(db, "verification_requests"),
    where("uid", "==", user.uid),
    where("status", "==", "pending")
  );
  const pendingSnap = await getDocs(pendingQuery);
  if (!pendingSnap.empty) {
    throw new Error(
      "لديك طلب توثيق قيد المراجعة بالفعل. سيتم الرد عليك قريبًا."
    );
  }

  await addDoc(collection(db, "verification_requests"), {
    uid: user.uid,
    email: user.email,
    name: profile?.name || user.displayName || "",
    phone: extra.phone || profile?.phone || "",
    notes: extra.notes || "",
    // الحقول الجديدة
    type: extra.type || "dock", // dock | yard
    code: extra.code || "", // DK-XXXXXX
    transactionId: extra.transactionId || "",
    paymentAmount: Number(extra.paymentAmount || 0),
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

/* ============================================
   كل الطلبات (للأدمن)
   ============================================ */
export function subscribeAllVerifications(callback, onError) {
  return onSnapshot(
    collection(db, "verification_requests"),
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
   آخر طلب للتاجر
   ============================================ */
export function subscribeMyLatestVerification(uid, callback) {
  if (!uid) {
    callback(null);
    return () => {};
  }
  const q = query(
    collection(db, "verification_requests"),
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
      console.error("فشل تحميل حالة التوثيق:", err);
      callback(null);
    }
  );
}

/* ============================================
   الموافقة على التوثيق
   ملاحظة: هتتنادى من AdminPanel، ومحتاجة
   كمان تستدعي createWallet من wallet.js
   ============================================ */
export async function approveVerification(request) {
  // 1. وثّق المستخدم
  await updateDoc(doc(db, "users", request.uid), {
    role: ROLES.VERIFIED_TRADER,
  });

  // 2. اقفل كل الطلبات المعلقة لنفس المستخدم
  const pendingQuery = query(
    collection(db, "verification_requests"),
    where("uid", "==", request.uid),
    where("status", "==", "pending")
  );
  const snap = await getDocs(pendingQuery);
  const updates = snap.docs.map((d) =>
    updateDoc(doc(db, "verification_requests", d.id), {
      status: "approved",
      reviewedAt: serverTimestamp(),
    })
  );
  await Promise.all(updates);
}

/* ============================================
   رفض طلب التوثيق
   ============================================ */
export async function rejectVerification(
  requestId,
  reason = "",
  uid = null
) {
  // لو التاجر موثق أصلاً، نأرشف الطلب
  if (uid) {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    const role = userSnap.data()?.role;
    if (role === ROLES.VERIFIED_TRADER || role === ROLES.ADMIN) {
      await updateDoc(doc(db, "verification_requests", requestId), {
        status: "approved",
        reviewedAt: serverTimestamp(),
      });
      return;
    }
  }

  await updateDoc(doc(db, "verification_requests", requestId), {
    status: "rejected",
    rejectReason: reason,
    reviewedAt: serverTimestamp(),
  });
}
