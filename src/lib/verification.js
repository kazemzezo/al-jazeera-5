import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { ROLES } from "./roles";

export async function requestVerification(user, profile, extra = {}) {
  // امنع التكرار: لو فيه طلب معلق موجود، ارمي خطأ
  const pendingQuery = query(
    collection(db, "verification_requests"),
    where("uid", "==", user.uid),
    where("status", "==", "pending")
  );
  const pendingSnap = await getDocs(pendingQuery);
  if (!pendingSnap.empty) {
    throw new Error("لديك طلب توثيق قيد المراجعة بالفعل. سيتم الرد عليك قريبًا.");
  }

  await addDoc(collection(db, "verification_requests"), {
    uid: user.uid,
    email: user.email,
    name: profile?.name || user.displayName || "",
    phone: extra.phone || "",
    notes: extra.notes || "",
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

// كل الطلبات (بدون فلتر من Firebase — بنفلتر في الواجهة)
export function subscribeAllVerifications(callback, onError) {
  const q = query(
    collection(db, "verification_requests"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    onError
  );
}

// للتاجر: آخر طلب
export function subscribeMyLatestVerification(uid, callback) {
  if (!uid) {
    callback(null);
    return () => {};
  }
  const q = query(
    collection(db, "verification_requests"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(docs[0] || null);
  });
}

export async function approveVerification(request) {
  // 1. وثّق المستخدم
  await updateDoc(doc(db, "users", request.uid), { role: ROLES.VERIFIED_TRADER });

  // 2. اقفل كل الطلبات المعلقة لنفس المستخدم (مش بس ده)
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

export async function rejectVerification(requestId, reason = "", uid = null) {
  // لو التاجر موثق أصلاً، مينفعش نرفضه — بنسيب الطلب يتقفل بس
  if (uid) {
    const userRef = doc(db, "users", uid);
    const { getDoc } = await import("firebase/firestore");
    const userSnap = await getDoc(userRef);
    const role = userSnap.data()?.role;
    if (role === ROLES.VERIFIED_TRADER || role === ROLES.ADMIN) {
      // التاجر موثق بالفعل — اقفل الطلب كمقبول بدل مرفوض
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
