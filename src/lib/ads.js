// ============================================
// نظام الإعلانات (الرصيف البحري)
// ============================================

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

// حالات الإعلان
export const AD_STATUS = {
  ACTIVE: "active",
  PARTIAL: "partial",
  SOLD_OUT: "sold_out",
  CLOSED: "closed",
};

export const AD_STATUS_LABELS = {
  [AD_STATUS.ACTIVE]: "متاح",
  [AD_STATUS.PARTIAL]: "متاح جزئياً",
  [AD_STATUS.SOLD_OUT]: "تم البيع",
  [AD_STATUS.CLOSED]: "تم الغلق من الإدارة",
};

// ============ قراءة ============

export function subscribeAllAds(callback, onError) {
  return onSnapshot(
    collection(db, "ads"),
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

export function subscribeAds(location, callback, onError) {
  return onSnapshot(
    collection(db, "ads"),
    (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((a) => a.location === location)
        .sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() || 0;
          const tb = b.createdAt?.toMillis?.() || 0;
          return tb - ta;
        });
      callback(items);
    },
    onError
  );
}

export function subscribeActiveAds(callback, onError) {
  return onSnapshot(
    collection(db, "ads"),
    (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter(
          (a) =>
            a.status === AD_STATUS.ACTIVE ||
            a.status === AD_STATUS.PARTIAL
        )
        .sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() || 0;
          const tb = b.createdAt?.toMillis?.() || 0;
          return tb - ta;
        });
      callback(items);
    },
    onError
  );
}

export function subscribeAd(id, callback, onError) {
  if (!id) {
    callback(null);
    return () => {};
  }
  return onSnapshot(
    doc(db, "ads", id),
    (snap) => {
      if (snap.exists()) callback({ id: snap.id, ...snap.data() });
      else callback(null);
    },
    onError
  );
}

// ============ كتابة ============

export async function createAd(ad, user) {
  const items = (ad.items || []).map((it) => ({
    category: it.category,
    qty: Number(it.qty || 0),
    unitPrice: Number(it.unitPrice || 0),
    reservedQty: 0,
  }));

  const ref = await addDoc(collection(db, "ads"), {
    title: ad.title?.trim() || "",
    description: ad.description?.trim() || "",
    imageUrl: ad.imageUrl?.trim() || "",
    location: ad.location,
    items,
    status: AD_STATUS.ACTIVE,
    createdBy: user.uid,
    createdByName: user.displayName || user.email,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateAd(id, updates, uid) {
  await updateDoc(doc(db, "ads", id), {
    ...updates,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
}

export function computeAdStatus(items) {
  if (!items || items.length === 0) return AD_STATUS.SOLD_OUT;
  const allSoldOut = items.every(
    (it) => Number(it.reservedQty || 0) >= Number(it.qty || 0)
  );
  if (allSoldOut) return AD_STATUS.SOLD_OUT;
  const anyReserved = items.some((it) => Number(it.reservedQty || 0) > 0);
  return anyReserved ? AD_STATUS.PARTIAL : AD_STATUS.ACTIVE;
}

export async function applyReservationToAd(adId, reservedItems) {
  const adRef = doc(db, "ads", adId);
  const snap = await getDoc(adRef);
  if (!snap.exists()) throw new Error("الإعلان غير موجود");
  const data = snap.data();
  const items = (data.items || []).map((it) => {
    const r = reservedItems.find((x) => x.category === it.category);
    if (!r) return it;
    return {
      ...it,
      reservedQty: Number(it.reservedQty || 0) + Number(r.qty || 0),
    };
  });
  const newStatus = computeAdStatus(items);
  await updateDoc(adRef, {
    items,
    status: newStatus,
    updatedAt: serverTimestamp(),
  });
  return newStatus;
}

// ✅ جديد: إرجاع الكمية للإعلان (عند الرفض أو الإلغاء)
export async function revertAdReservation(adId, reservedItems) {
  const adRef = doc(db, "ads", adId);
  const snap = await getDoc(adRef);
  if (!snap.exists()) return;
  const data = snap.data();
  const items = (data.items || []).map((it) => {
    const r = reservedItems.find((x) => x.category === it.category);
    if (!r) return it;
    return {
      ...it,
      reservedQty: Math.max(
        0,
        Number(it.reservedQty || 0) - Number(r.qty || 0)
      ),
    };
  });
  // لو الإعلان كان closed، نسيبه closed؛ غير كده نحدّث الحالة
  const newStatus =
    data.status === AD_STATUS.CLOSED
      ? AD_STATUS.CLOSED
      : computeAdStatus(items);
  await updateDoc(adRef, {
    items,
    status: newStatus,
    updatedAt: serverTimestamp(),
  });
}

export async function closeAd(id, uid) {
  await updateDoc(doc(db, "ads", id), {
    status: AD_STATUS.CLOSED,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
}

export async function reopenAd(id, uid) {
  const adRef = doc(db, "ads", id);
  const snap = await getDoc(adRef);
  if (!snap.exists()) throw new Error("الإعلان غير موجود");
  const data = snap.data();
  const newStatus = computeAdStatus(data.items);
  await updateDoc(adRef, {
    status: newStatus,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
}

export async function deleteAd(id) {
  await deleteDoc(doc(db, "ads", id));
}

// ============ مساعدات ============

export function getAdTotal(ad) {
  if (!ad?.items) return 0;
  return ad.items.reduce(
    (sum, it) => sum + Number(it.qty || 0) * Number(it.unitPrice || 0),
    0
  );
}

export function isAdReservable(ad) {
  if (!ad) return false;
  return ad.status === AD_STATUS.ACTIVE || ad.status === AD_STATUS.PARTIAL;
}

export function getAvailableItems(ad) {
  if (!ad?.items) return [];
  return ad.items
    .map((it) => ({
      ...it,
      available: Number(it.qty || 0) - Number(it.reservedQty || 0),
    }))
    .filter((it) => it.available > 0);
}

// ============ الحجوزات ============

// ✅ جديد: بيخصم من الإعلان فوراً
export async function createAdReservation(payload, user) {
  const items = (payload.items || []).filter((it) => Number(it.qty) > 0);
  const equipment = (payload.equipment || []).filter(
    (eq) => Number(eq.hours) > 0
  );

  const ref = await addDoc(collection(db, "reservations"), {
    type: "ad",
    adId: payload.adId,
    adTitle: payload.adTitle,
    location: payload.location,
    items,
    equipment,
    workerCount: Number(payload.workerCount || 0),
    workerUnitPrice: Number(payload.workerUnitPrice || 0),
    carCount: Number(payload.carCount || 0),
    carUnitPrice: Number(payload.carUnitPrice || 0),
    itemsTotal: Number(payload.itemsTotal || 0),
    equipmentTotal: Number(payload.equipmentTotal || 0),
    workersTotal: Number(payload.workersTotal || 0),
    carsTotal: Number(payload.carsTotal || 0),
    grandTotal: Number(payload.grandTotal || 0),
    uid: user.uid,
    traderName: payload.traderName || user.displayName || user.email,
    traderEmail: user.email || "",
    status: "new",
    adApplied: false, // هنحدّثها لـ true بعد الخصم
    createdAt: serverTimestamp(),
  });

  // خصم فوري من الإعلان
  try {
    await applyReservationToAd(payload.adId, items);
    await updateDoc(ref, { adApplied: true });
  } catch (err) {
    // لو الخصم فشل، نمسح الحجز
    await deleteDoc(ref);
    throw err;
  }

  return ref.id;
}
