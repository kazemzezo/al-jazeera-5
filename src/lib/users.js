import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { ROLES, PRIMARY_ADMIN_EMAIL } from "./roles";

// الأدوار المتاحة للتعيين (بدون admin)
export const ROLE_OPTIONS = [
  { value: ROLES.TRADER, label: "تاجر عادي" },
  { value: ROLES.VERIFIED_TRADER, label: "تاجر موثق" },
  { value: ROLES.SUPERVISOR, label: "مشرف الموقع" },
  { value: ROLES.DRIVER_KABBASH, label: "سائق الكباش" },
  { value: ROLES.DRIVER_CRAWLER_CRANE, label: "سائق رافعة مجنزرة" },
  { value: ROLES.DRIVER_FORKLIFT, label: "سائق رافعة شوكية" },
];

export const ROLE_LABELS_MAP = {
  [ROLES.ADMIN]: "أدمن",
  [ROLES.SUPERVISOR]: "مشرف الموقع",
  [ROLES.VERIFIED_TRADER]: "تاجر موثق",
  [ROLES.TRADER]: "تاجر عادي",
  [ROLES.DRIVER_KABBASH]: "سائق الكباش",
  [ROLES.DRIVER_CRAWLER_CRANE]: "سائق رافعة مجنزرة",
  [ROLES.DRIVER_FORKLIFT]: "سائق رافعة شوكية",
};

export function getRoleLabel(role) {
  return ROLE_LABELS_MAP[role] || role || "—";
}

export function roleBadgeStyle(role) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  };
  if (role === ROLES.ADMIN)
    return {
      ...base,
      background: "var(--danger-light)",
      color: "var(--danger)",
    };
  if (role === ROLES.VERIFIED_TRADER)
    return {
      ...base,
      background: "var(--kabbash-light)",
      color: "var(--kabbash)",
    };
  if (role === ROLES.SUPERVISOR)
    return {
      ...base,
      background: "var(--crane-light)",
      color: "var(--crane)",
    };
  if (
    role === ROLES.DRIVER_KABBASH ||
    role === ROLES.DRIVER_CRAWLER_CRANE ||
    role === ROLES.DRIVER_FORKLIFT
  )
    return {
      ...base,
      background: "var(--paper-sunken)",
      color: "var(--steel)",
    };
  return {
    ...base,
    background: "var(--paper-sunken)",
    color: "var(--steel)",
  };
}

// ✅ قراءة كل المستخدمين (بدون الأدمن الأساسي — مايظهرش خالص)
export function subscribeAllUsers(callback, onError) {
  return onSnapshot(
    collection(db, "users"),
    (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.email !== PRIMARY_ADMIN_EMAIL);
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

// ✅ تغيير الدور (يحمي الأدمن الأساسي)
export async function changeUserRole(uid, newRole, adminUid) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error("المستخدم غير موجود");
  const data = snap.data();
  if (data.email === PRIMARY_ADMIN_EMAIL) {
    throw new Error("لا يمكن تعديل حساب الأدمن الأساسي");
  }
  await updateDoc(userRef, {
    role: newRole,
    roleUpdatedAt: serverTimestamp(),
    roleUpdatedBy: adminUid,
  });
}

// ✅ تعليق/تفعيل الحساب (يحمي الأدمن الأساسي)
export async function toggleUserSuspended(uid, suspended, adminUid) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error("المستخدم غير موجود");
  const data = snap.data();
  if (data.email === PRIMARY_ADMIN_EMAIL) {
    throw new Error("لا يمكن تعديل حساب الأدمن الأساسي");
  }
  await updateDoc(userRef, {
    suspended,
    suspendedAt: serverTimestamp(),
    suspendedBy: adminUid,
  });
}
