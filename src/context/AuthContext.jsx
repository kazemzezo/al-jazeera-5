import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db, googleProvider } from "../lib/firebase";
import { ROLES, PRIMARY_ADMIN_EMAIL } from "../lib/roles";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setUser(firebaseUser);

      const userRef = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        // أول تسجيل دخول لهذا المستخدم: ننشئ ملفه بدور افتراضي "تاجر"
        // إلا إذا كان بريده هو بريد الأدمن الأساسي
        const isPrimaryAdmin = firebaseUser.email === PRIMARY_ADMIN_EMAIL;
        const newProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || "",
          photoURL: firebaseUser.photoURL || "",
          role: isPrimaryAdmin ? ROLES.ADMIN : ROLES.TRADER,
          suspended: false,
          createdAt: serverTimestamp(),
        };
        await setDoc(userRef, newProfile);
        setProfile(newProfile);
      } else {
        setProfile(snap.data());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function loginWithGoogle() {
    await signInWithPopup(auth, googleProvider);
  }

  async function logout() {
    await signOut(auth);
  }

  const value = {
    user,
    profile,
    role: profile?.role || null,
    loading,
    loginWithGoogle,
    logout,
    isPrimaryAdmin: user?.email === PRIMARY_ADMIN_EMAIL,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
