import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// بيانات مشروع Firebase الخاص بالتطبيق
const firebaseConfig = {
  apiKey: "AIzaSyAo1CHrCS66YbCNWdTLoATYJDpo4aoX34U",
  authDomain: "al-jazeera-5.firebaseapp.com",
  projectId: "al-jazeera-5",
  storageBucket: "al-jazeera-5.firebasestorage.app",
  messagingSenderId: "662403568166",
  appId: "1:662403568166:web:96e63bde0bc7ad31c6cce7",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
