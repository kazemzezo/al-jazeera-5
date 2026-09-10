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

export async function requestVerification(user, profile) {
  await addDoc(collection(db, "verification_requests"), {
    uid: user.uid,
    email: user.email,
    name: profile?.name || user.displayName || "",
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export function subscribePendingVerifications(callback) {
  const q = query(
    collection(db, "verification_requests"),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function approveVerification(request) {
  await updateDoc(doc(db, "users", request.uid), { role: ROLES.VERIFIED_TRADER });
  await updateDoc(doc(db, "verification_requests", request.id), { status: "approved" });
}

export async function rejectVerification(requestId) {
  await updateDoc(doc(db, "verification_requests", requestId), { status: "rejected" });
}
