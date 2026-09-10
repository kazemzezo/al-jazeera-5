import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { TON_CATEGORIES } from "./catalog";
import { EQUIPMENT } from "./equipment";

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

export function subscribeAnnouncements(location, callback) {
  const q = query(
    collection(db, "announcements"),
    where("location", "==", location),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
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

export async function reserveListingQuantity(listingId, qty, user) {
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
    await addDoc(collection(db, "reservations"), {
      listingId,
      category: result.data.category,
      saleType: result.data.saleType,
      location: result.data.location,
      qty,
      uid: user.uid,
      traderName: user.displayName || user.email,
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
    await addDoc(collection(db, "reservations"), {
      listingId,
      category: result.data.category,
      saleType: result.data.saleType,
      location: result.data.location,
      lotPrice: result.data.lotPrice,
      uid: user.uid,
      traderName: user.displayName || user.email,
      createdAt: serverTimestamp(),
    });
  }
  return result;
}
