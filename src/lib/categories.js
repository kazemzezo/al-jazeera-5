// ============================================
// إدارة الأصناف — قابلة للإضافة من الأدمن
// ============================================

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { SALE_TYPES } from "./catalog";

// قراءة كل الأصناف
export function subscribeAllCategories(callback, onError) {
  return onSnapshot(
    collection(db, "categories"),
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

// قراءة الأصناف حسب نوع البيع
export function subscribeCategoriesBySaleType(saleType, callback, onError) {
  const q = query(
    collection(db, "categories"),
    where("saleType", "==", saleType)
  );
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() || 0;
        const tb = b.createdAt?.toMillis?.() || 0;
        return ta - tb;
      });
      callback(items);
    },
    onError
  );
}

// إضافة صنف جديد
export async function createCategory(category, user) {
  const name = category.name?.trim();
  if (!name) throw new Error("اسم الصنف مطلوب");
  if (!category.saleType) throw new Error("نوع البيع مطلوب");

  // تحقق: مفيش صنف بنفس الاسم ونفس النوع
  const q = query(
    collection(db, "categories"),
    where("name", "==", name),
    where("saleType", "==", category.saleType)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    throw new Error("الصنف موجود بالفعل بنفس نوع البيع");
  }

  const ref = await addDoc(collection(db, "categories"), {
    name,
    saleType: category.saleType,
    notes: category.notes?.trim() || "",
    active: true,
    createdBy: user.uid,
    createdByName: user.displayName || user.email,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// تعديل صنف
export async function updateCategory(id, updates, uid) {
  await updateDoc(doc(db, "categories", id), {
    ...updates,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
}

// حذف صنف
export async function deleteCategory(id) {
  await deleteDoc(doc(db, "categories", id));
}

// زرع الأصناف الافتراضية لو الـ collection فاضي
export async function seedDefaultCategories(user) {
  const snap = await getDocs(collection(db, "categories"));
  if (!snap.empty) return { seeded: false, count: 0 };

  const { TON_CATEGORIES, PIECE_CATEGORIES, LOT_CATEGORIES } = await import(
    "./catalog"
  );

  const all = [
    ...TON_CATEGORIES.map((name) => ({ name, saleType: SALE_TYPES.TON })),
    ...PIECE_CATEGORIES.map((name) => ({ name, saleType: SALE_TYPES.PIECE })),
    ...LOT_CATEGORIES.map((name) => ({ name, saleType: SALE_TYPES.DEAL })),
  ];

  await Promise.all(
    all.map((c) =>
      addDoc(collection(db, "categories"), {
        ...c,
        notes: "",
        active: true,
        createdBy: user.uid,
        createdByName: user.displayName || user.email,
        createdAt: serverTimestamp(),
      })
    )
  );

  return { seeded: true, count: all.length };
}
