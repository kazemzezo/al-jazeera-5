// ============================================
// نظام الإعلانات
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
  ACTIVE: "active",           // 🟢 نشط
  PARTIAL: "partial",         // 🟡 متاح جزئياً
  LOADING: "loading",         // 🟡 جاري التحميل
  SOLD_OUT: "sold_out",       // 🔴 تم البيع
  INACTIVE: "inactive",       // 🔴 غير نشط (أرشيف)
  CLOSED: "closed",           // 🔴 مغلق
};

export const AD_STATUS_LABELS = {
  [AD_STATUS.ACTIVE]: "نشط",
  [AD_STATUS.PARTIAL]: "متاح جزئياً",
  [AD_STATUS.LOADING]: "جاري التحميل",
  [AD_STATUS.SOLD_OUT]: "تم البيع",
  [AD_STATUS.INACTIVE]: "غير نشط",
  [AD_STATUS.CLOSED]: "مغلق",
};

// ألوان الحالات (للـ UI)
export const AD_STATUS_COLORS = {
  [AD_STATUS.ACTIVE]: { bg: "#16a34a", light: "rgba(22, 163, 74, 0.12)" },
  [AD_STATUS.PARTIAL]: { bg: "#f59e0b", light: "rgba(245, 158, 11, 0.12)" },
  [AD_STATUS.LOADING]: { bg: "#eab308", light: "rgba(234, 179, 8, 0.15)" },
  [AD_STATUS.SOLD_OUT]: { bg: "#dc2626", light: "rgba(220, 38, 38, 0.12)" },
  [AD_STATUS.INACTIVE]: { bg: "#7a8894", light: "rgba(122, 136, 148, 0.15)" },
  [AD_STATUS.CLOSED]: { bg: "#7a8894", light: "rgba(122, 136, 148, 0.15)" },
};

// الحالات النشطة (تظهر للتاجر)
export const ACTIVE_STATUSES = [AD_STATUS.ACTIVE, AD_STATUS.PARTIAL];

// الحالات المؤرشفة (تظهر في الأرشيف بس)
export const ARCHIVE_STATUSES = [
  AD_STATUS.LOADING,
  AD_STATUS.SOLD_OUT,
  AD_STATUS.INACTIVE,
  AD_STATUS.CLOSED,
];

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

// الإعلانات النشطة بس (للتاجر)
export function subscribeActiveAds(callback, onError) {
  return onSnapshot(
    collection(db, "ads"),
    (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((a) => ACTIVE_STATUSES.includes(a.status))
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

// كل الإعلانات المتاحة للعرض (نشط + أرشيف)
export function subscribeVisibleAds(callback, onError) {
  return onSnapshot(
    collection(db, "ads"),
    (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
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
    saleType: it.saleType || "ton",
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
  const cleanUpdates = { ...updates };

  if (cleanUpdates.items) {
    cleanUpdates.items = cleanUpdates.items.map((it) => ({
      category: it.category,
      saleType: it.saleType || "ton",
      qty: Number(it.qty || 0),
      unitPrice: Number(it.unitPrice || 0),
      reservedQty: Number(it.reservedQty || 0),
    }));
  }

  await updateDoc(doc(db, "ads", id), {
    ...cleanUpdates,
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

  // لو الإعلان مش نشط، نرفض الحجز
  if (!ACTIVE_STATUSES.includes(data.status)) {
    throw new Error("الإعلان مش متاح للحجز");
  }

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

  // لو الإعلان مؤرشف، نسيبه زي ما هو
  const newStatus = ARCHIVE_STATUSES.includes(data.status)
    ? data.status
    : computeAdStatus(items);

  await updateDoc(adRef, {
    items,
    status: newStatus,
    updatedAt: serverTimestamp(),
  });
}

// ============ إدارة الحالات (للأدمن) ============

// تعليم إعلان "جاري التحميل"
export async function markAdAsLoading(id, uid) {
  await updateDoc(doc(db, "ads", id), {
    status: AD_STATUS.LOADING,
    statusChangedAt: serverTimestamp(),
    statusChangedBy: uid,
  });
}

// تعليم إعلان "غير نشط" (أرشيف)
export async function markAdAsInactive(id, uid) {
  await updateDoc(doc(db, "ads", id), {
    status: AD_STATUS.INACTIVE,
    statusChangedAt: serverTimestamp(),
    statusChangedBy: uid,
  });
}

// إعادة إعلان لأرشيف "غير نشط" → "نشط" (نادرًا)
export async function reactivateAd(id, uid) {
  const adRef = doc(db, "ads", id);
  const snap = await getDoc(adRef);
  if (!snap.exists()) throw new Error("الإعلان غير موجود");
  const data = snap.data();
  const newStatus = computeAdStatus(data.items);
  await updateDoc(adRef, {
    status: newStatus,
    statusChangedAt: serverTimestamp(),
    statusChangedBy: uid,
  });
}

// غلق يدوي
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
  return ACTIVE_STATUSES.includes(ad.status);
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

// إحصائيات (للأدمن)
export function getAdsStats(ads) {
  return {
    total: ads.length,
    active: ads.filter((a) => a.status === AD_STATUS.ACTIVE).length,
    partial: ads.filter((a) => a.status === AD_STATUS.PARTIAL).length,
    loading: ads.filter((a) => a.status === AD_STATUS.LOADING).length,
    soldOut: ads.filter((a) => a.status === AD_STATUS.SOLD_OUT).length,
    inactive: ads.filter((a) => a.status === AD_STATUS.INACTIVE).length,
    closed: ads.filter((a) => a.status === AD_STATUS.CLOSED).length,
    dock: {
      total: ads.filter((a) => a.location === "dock").length,
      active: ads.filter(
        (a) => a.location === "dock" && ACTIVE_STATUSES.includes(a.status)
      ).length,
    },
    yard: {
      total: ads.filter((a) => a.location === "yard").length,
      active: ads.filter(
        (a) => a.location === "yard" && ACTIVE_STATUSES.includes(a.status)
      ).length,
    },
  };
}

// ============ الحجوزات ============

export async function createAdReservation(payload, user) {
  const items = (payload.items || []).filter((it) => Number(it.qty) > 0);
  const equipment = (payload.equipment || []).filter(
    (eq) => Number(eq.hours) > 0
  );

  const invoiceId = "AJ5-" + Date.now().toString().slice(-8);
  const date = new Date().toLocaleDateString("ar-EG");

  const ref = await addDoc(collection(db, "reservations"), {
    type: "ad",
    invoiceId,
    date,
    adId: payload.adId,
    adTitle: payload.adTitle,
    location: payload.location,
    items: items.map((it) => ({
      category: it.category,
      saleType: it.saleType || "ton",
      qty: Number(it.qty || 0),
      unitPrice: Number(it.unitPrice || 0),
      subtotal: Number(it.subtotal || 0),
    })),
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
    createdAt: serverTimestamp(),
  });

  try {
    await applyReservationToAd(payload.adId, items);
  } catch (err) {
    try {
      await deleteDoc(ref);
    } catch (delErr) {
      console.error("فشل التراجع عن الحجز:", delErr);
    }
    throw err;
  }

  return ref.id;
}
