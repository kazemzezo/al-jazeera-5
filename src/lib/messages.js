import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export async function sendContactMessage({ name, email, text, uid }) {
  await addDoc(collection(db, "messages"), {
    name: name || "",
    email: email || "",
    text,
    uid: uid || null,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export function subscribeMessages(callback) {
  const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function markMessageRead(id) {
  await updateDoc(doc(db, "messages", id), { read: true });
}
