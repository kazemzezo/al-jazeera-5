import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { TON_CATEGORIES } from "./catalog";
import { EQUIPMENT } from "./equipment";

/* ===================== الأسعار ===================== */
export function subscribeTonPrices(callback) {
  return onSnapshot(collection(db, "prices"), (snap) => {
    const prices = {};
    snap.forEach((d) => (prices[d.id] = d.data()));
    callback(prices);
  });
}

export async function setTonPrice(category, pricePerTon, uid) {
  await setDoc(doc(db, "prices", category), {
    name: category,
    pricePerTon: Number(pricePerTon),
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
}

export function ensureTonCategoriesSeed() {
  return TON_CATEGORIES;
}

/* ===================== أسعار المعدات ===================== */
export function subscribeEquipmentPrices(callback) {
  return onSnapshot(collection(db, "equipment_prices"), (snap) => {
    const prices = {};
    snap.forEach((d) => (prices[d.id] = d.data()));
    callback(prices);
  });
}

export async function setEquipmentPrice(id, pricePerHour, uid) {
  const meta = EQUIPMENT.find((e) => e.id === id);
  await setDoc(doc(db, "equipment_prices", id), {
    name: meta?.name || id,
    pricePerHour: Number(pricePerHour),
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
}

/* ===================== الإعلانات ===================== */
export function subscribeAnnouncements(location, callback) {
  return onSnapshot(
    collection(db, "announcements"),
    (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const filtered = all
        .filter((a) => a.location === location)
        .sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() || 0;
          const tb = b.createdAt?.toMillis?.() || 0;
          return tb - ta;
        });
      callback(filtered);
    },
    (err) => {
      console.error("فشل تحميل الإعلانات:", err);
      callback([]);
    }
  );
}

export async function postAnnouncement(location, text, user) {
  await addDoc(collection(db, "announcements"), {
    location,
    text,
    createdBy: user.uid,
    createdByName: user.displayName || user.email,
    createdAt: serverTimestamp(),
  });
}

export async function deleteAnnouncement(id) {
  await deleteDoc(doc(db, "announcements", id));
}

/* ===================== الأصناف ===================== */
export function subscribeListings(location, callback) {
  const q = query(
    collection(db, "listings"),
    where("location", "==", location),
    where("active", "==", true),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function createListing(listing, user) {
  await addDoc(collection(db, "listings"), {
    ...listing,
    reservedQty: 0,
    active: true,
    createdBy: user.uid,
    createdByName: user.displayName || user.email,
    createdAt: serverTimestamp(),
  });
}

export async function deactivateListing(id) {
  await setDoc(doc(db, "listings", id), { active: false }, { merge: true });
}

/* ===================== الحجوزات ===================== */

export async function reserveListingQuantity(listingId, qty, user, extra = {}) {
  const listingRef = doc(db, "listings", listingId);
  const result = await runTransaction(db, async (tx) => {
    const snap = await tx.get(listingRef);
    if (!snap.exists()) throw new Error("الصنف غير موجود");
    const data = snap.data();
    const total = Number(data.quantity || 0);
    const reserved = Number(data.reservedQty || 0);
    const available = total - reserved;

    if (qty > available) {
      return { ok: false, available };
    }

    tx.update(listingRef, { reservedQty: reserved + qty });
    return { ok: true, available: available - qty, data };
  });

  if (result.ok) {
    const d = result.data;
    const unitPrice = Number(extra.unitPrice || 0);
    const subtotal = unitPrice * qty;
    await addDoc(collection(db, "reservations"), {
      type: "listing",
      listingId,
      category: d.category,
      saleType: d.saleType,
      location: d.location,
      qty,
      unitPrice,
      subtotal,
      grandTotal: subtotal,
      uid: user.uid,
      traderName: user.displayName || user.email,
      traderEmail: user.email || "",
      status: "new",
      createdAt: serverTimestamp(),
    });
  }
  return result;
}

export async function reserveLot(listingId, user) {
  const listingRef = doc(db, "listings", listingId);
  const result = await runTransaction(db, async (tx) => {
    const snap = await tx.get(listingRef);
    if (!snap.exists()) throw new Error("اللوط غير موجود");
    const data = snap.data();
    if (data.reservedQty >= 1) return { ok: false };
    tx.update(listingRef, { reservedQty: 1, active: false });
    return { ok: true, data };
  });

  if (result.ok) {
    const d = result.data;
    const lotPrice = Number(d.lotPrice || 0);
    await addDoc(collection(db, "reservations"), {
      type: "listing",
      listingId,
      category: d.category,
      saleType: d.saleType,
      location: d.location,
      qty: 1,
      unitPrice: lotPrice,
      subtotal: lotPrice,
      grandTotal: lotPrice,
      uid: user.uid,
      traderName: user.displayName || user.email,
      traderEmail: user.email || "",
      status: "new",
      createdAt: serverTimestamp(),
    });
  }
  return result;
}

export async function createCalculatorInvoice(invoice, user) {
  const ref = await addDoc(collection(db, "reservations"), {
    type: "calculator",
    ...invoice,
    uid: user.uid,
    traderName: invoice.traderName || user.displayName || user.email,
    traderEmail: user.email || "",
    status: "new",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeAllReservations(callback, onError) {
  const q = query(
    collection(db, "reservations"),
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

// ✅ جديد: حجوزات التاجر الحالي
export function subscribeMyReservations(uid, callback) {
  if (!uid) {
    callback([]);
    return () => {};
  }
  return onSnapshot(
    collection(db, "reservations"),
    (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const filtered = all
        .filter((r) => r.uid === uid)
        .sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() || 0;
          const tb = b.createdAt?.toMillis?.() || 0;
          return tb - ta;
        });
      callback(filtered);
    },
    (err) => {
      console.error("فشل تحميل حجوزاتي:", err);
      callback([]);
    }
  );
}

// ✅ محدّث: نحدّث الحالة الأول، وبعدها نرجّع المخزون
export async function updateReservationStatus(id, newStatus, options = {}) {
  const { reason = "", uid = null } = options;
  const reservationRef = doc(db, "reservations", id);

  const snap = await getDoc(reservationRef);
  if (!snap.exists()) throw new Error("الحجز غير موجود");
  const data = snap.data();

  const updatePayload = {
    status: newStatus,
    statusUpdatedAt: serverTimestamp(),
    statusUpdatedBy: uid,
  };
  if (newStatus === "cancelled" && reason) {
    updatePayload.cancelReason = reason;
  }
  await updateDoc(reservationRef, updatePayload);

  if (newStatus === "cancelled" && data.type === "listing" && data.listingId) {
    try {
      const listingRef = doc(db, "listings", data.listingId);
      const listingSnap = await getDoc(listingRef);
      if (listingSnap.exists()) {
        const ld = listingSnap.data();
        if (data.saleType === "lot") {
          await updateDoc(listingRef, { reservedQty: 0, active: true });
        } else {
          const qty = Number(data.qty || 0);
          const currentReserved = Number(ld.reservedQty || 0);
          const newReserved = Math.max(0, currentReserved - qty);
          await updateDoc(listingRef, { reservedQty: newReserved });
        }
      }
    } catch (rollbackErr) {
      console.error("فشل إرجاع الكمية للمخزون:", rollbackErr);
    }
  }
}
