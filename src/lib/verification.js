import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

// ينشئ طلب توثيق يظهر للأدمن في لوحة التحكم (المرحلة القادمة)
export async function requestVerification(user, profile) {
  await addDoc(collection(db, "verification_requests"), {
    uid: user.uid,
    email: user.email,
    name: profile?.name || user.displayName || "",
    status: "pending",
    createdAt: serverTimestamp(),
  });
}
