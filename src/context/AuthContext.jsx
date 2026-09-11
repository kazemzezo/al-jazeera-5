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
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db, googleProvider } from "../lib/firebase";
import { ROLES, PRIMARY_ADMIN_EMAIL } from "../lib/roles";
import { subscribeMyLatestVerification } from "../lib/verification";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // راقب حالة بروفايل المستخدم
  useEffect(() => {
    let profileUnsub = null;
    let verifUnsub = null;

    const authUnsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (profileUnsub) profileUnsub();
      if (verifUnsub) verifUnsub();
      profileUnsub = null;
      verifUnsub = null;

      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setUser(firebaseUser);

      const userRef = doc(db, "users", firebaseUser.uid);

      try {
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
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
        }

        profileUnsub = onSnapshot(
          userRef,
          (docSnap) => {
            if (docSnap.exists()) setProfile(docSnap.data());
            else setProfile(null);
            setLoading(false);
          },
          (err) => {
            console.error("خطأ في متابعة بروفايل المستخدم:", err);
            setProfile(null);
            setLoading(false);
          }
        );

        // راقب حالة التوثيق وأطلق إشعار عند التغير
        const key = `aj5_vs_${firebaseUser.uid}`;
        verifUnsub = subscribeMyLatestVerification(firebaseUser.uid, (v) => {
          const cur = v?.status || "none";
          const prev = localStorage.getItem(key);
          if (prev !== null && prev !== cur) {
            let msg = null;
            if (cur === "approved") {
              msg = { type: "success", text: "🎉 تم توثيق حسابك! يمكنك الآن تأكيد الحجوزات." };
            } else if (cur === "rejected") {
              msg = {
                type: "error",
                text: `تم رفض طلب التوثيق${v.rejectReason ? ": " + v.rejectReason : ""}`,
              };
            } else if (cur === "pending") {
              msg = { type: "info", text: "طلب التوثيق تحت المراجعة ⏳" };
            }
            if (msg) {
              setToast(msg);
              setTimeout(() => setToast(null), 7000);
            }
          }
          localStorage.setItem(key, cur);
        });
      } catch (err) {
        console.error("تعذر تحميل ملف المستخدم:", err);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      if (profileUnsub) profileUnsub();
      if (verifUnsub) verifUnsub();
      authUnsub();
    };
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

  return (
    <AuthContext.Provider value={value}>
      {children}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </AuthContext.Provider>
  );
}

function Toast({ type, text, onClose }) {
  const bg =
    type === "success" ? "var(--kabbash)" :
    type === "error"   ? "var(--danger)"  :
                         "var(--ink)";
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 16,
        insetInline: 16,
        maxWidth: 420,
        margin: "0 auto",
        background: bg,
        color: "#fff",
        borderRadius: 12,
        padding: "12px 16px",
        fontSize: 13.5,
        fontWeight: 600,
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        zIndex: 100,
        cursor: "pointer",
        animation: "toast-in .3s ease",
        textAlign: "center",
      }}
    >
      {text}
      <style>{`
        @keyframes toast-in {
          from { transform: translateY(-12px); opacity: 0 }
          to { transform: translateY(0); opacity: 1 }
        }
      `}</style>
    </div>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
