import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * حذف بيانات المستخدم من Firestore بالكامل (من طرف الأدمن)
 * ⚠️ ملاحظة: لا يحذف حساب Firebase Auth (SDK العميل مش بيسمح)
 *    لكن يمسح كل بيانات Firestore
 */
export async function adminDeleteUserData(uid) {
  if (!uid) throw new Error("UID مطلوب");

  const errors = [];

  // 1. احذف wallets/{uid}
  try {
    await deleteDoc(doc(db, "wallets", uid));
  } catch (err) {
    console.warn("فشل حذف wallets:", err);
    errors.push("wallets");
  }

  // 2. احذف من collections اللي فيها حقل uid
  const relatedCollections = [
    "wallet_transactions",
    "reservations",
    "verification_requests",
    "verification_codes_history",
    "deletion_requests",
  ];

  for (const colName of relatedCollections) {
    try {
      const q = query(collection(db, colName), where("uid", "==", uid));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    } catch (err) {
      console.warn(`فشل حذف ${colName}:`, err);
      errors.push(colName);
    }
  }

  // 3. احذف users/{uid}
  try {
    await deleteDoc(doc(db, "users", uid));
  } catch (err) {
    console.warn("فشل حذف users:", err);
    errors.push("users");
  }

  return { success: errors.length === 0, errors };
}
