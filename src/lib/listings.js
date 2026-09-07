import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { TON_CATEGORIES } from "./catalog";

// ---------- أسعار الأصناف اليومية (بالطن) - شريط الأسعار العلوي ----------
export function subscribeTonPrices(callback) {
  const ref = collection(db, "prices");
  return onSnapshot(ref, (snap) => {
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
  // يُستخدم مرة واحدة من لوحة الإدمن لاحقًا لإنشاء وثائق الأصناف الافتراضية
  return TON_CATEGORIES;
}

// ---------- الإعلانات (المشرف/الأدمن) ----------
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

// ---------- الأصناف المُدرجة (الرصيف البحري / ساحة الجزيره) ----------
export function subscribeListings(location, callback) {
  const q = query(
    collection(db, "listings"),
    where("location", "==", location),
    where("status", "==", "available"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function createListing(listing, user) {
  await addDoc(collection(db, "listings"), {
    ...listing,
    status: "available",
    createdBy: user.uid,
    createdByName: user.displayName || user.email,
    createdAt: serverTimestamp(),
  });
}

export async function deleteListing(id) {
  await deleteDoc(doc(db, "listings", id));
}

export async function markListingReserved(id, uid) {
  await updateDoc(doc(db, "listings", id), {
    status: "reserved",
    reservedBy: uid,
    reservedAt: serverTimestamp(),
  });
}
