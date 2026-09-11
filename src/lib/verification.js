import {
  addDoc,
  collection,
  doc,
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

// للأدمن: كل الطلبات حسب الحالة ("pending" | "approved" | "rejected" | "all")
export function subscribeVerificationsByStatus(status, callback) {
  const col = collection(db, "verification_requests");
  const q =
    status === "all"
      ? query(col, orderBy("createdAt", "desc"))
      : query(col, where("status", "==", status), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// للتاجر: آخر طلب (لحالته الحالية)
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
  await updateDoc(doc(db, "users", request.uid), { role: ROLES.VERIFIED_TRADER });
  await updateDoc(doc(db, "verification_requests", request.id), {
    status: "approved",
    reviewedAt: serverTimestamp(),
  });
}

export async function rejectVerification(requestId, reason = "") {
  await updateDoc(doc(db, "verification_requests", requestId), {
    status: "rejected",
    rejectReason: reason,
    reviewedAt: serverTimestamp(),
  });
}
