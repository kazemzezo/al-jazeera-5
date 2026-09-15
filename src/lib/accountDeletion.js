import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { deleteUser, reauthenticateWithPopup } from "firebase/auth";
import { db, googleProvider } from "./firebase";

/**
 * حذف الحساب بالكامل + كل البيانات المرتبطة
 * الترتيب:
 * 1. إعادة التحقق (عشان نتجنب requires-recent-login)
 * 2. حذف المحفظة
 * 3. حذف كل الـ collections المرتبطة بالـ uid
 * 4. حذف users doc
 * 5. حذف Firebase Auth
 */
export async function deleteAccountCompletely(user) {
  if (!user) throw new Error("مفيش مستخدم مسجّل");

  const uid = user.uid;

  // 1. أعد التحقق
  await reauthenticateWithPopup(user, googleProvider);

  // 2. احذف wallets/{uid} (مستند مباشر)
  try {
    await deleteDoc(doc(db, "wallets", uid));
  } catch (err) {
    console.warn("فشل حذف wallets:", err);
  }

  // 3. احذف collections المرتبطة بـ uid
  const relatedCollections = [
    "wallet_transactions",
    "reservations",
    "verification_requests",
    "verification_codes_history",
  ];

  for (const colName of relatedCollections) {
    try {
      const q = query(collection(db, colName), where("uid", "==", uid));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    } catch (err) {
      console.warn(`فشل حذف ${colName}:`, err);
    }
  }

  // 4. احذف users/{uid}
  try {
    await deleteDoc(doc(db, "users", uid));
  } catch (err) {
    console.warn("فشل حذف users:", err);
  }

  // 5. احذف Firebase Auth (آخر خطوة)
  await deleteUser(user);
}
