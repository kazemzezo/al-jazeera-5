import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { sendContactMessage } from "../lib/messages";

function Page({ title, children }) {
  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 16 }}>{title}</h1>
      <div style={{ fontSize: 14, color: "var(--steel)", lineHeight: 2 }}>{children}</div>
    </div>
  );
}

export function About() {
  return (
    <Page title="عن الموقع">
      <p>
        "الجزيره خمسه" منصة إلكترونية مخصصة لخدمة قطاع الخردة بمنطقة قناة
        السويس، تجمع بين الرصيف البحري (كميات يومية متجددة صغيرة) وساحة
        الجزيره (كميات كبيرة بنظام اللوط والطن والقطعة)، وتتيح للتجار
        الموثقين تصفح الأصناف وحجزها وحساب فواتيرهم بما يشمل إيجار المعدات
        والعمالة ورسوم الرصيف، كل ذلك بأسعار يومية محدثة من إدارة الموقع.
      </p>
    </Page>
  );
}

export function Contact() {
  const { user, profile } = useAuth();
  const [name, setName] = useState(profile?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError("");
    try {
      await sendContactMessage({ name, email, text: text.trim(), uid: user?.uid });
      setSent(true);
      setText("");
    } catch (err) {
      setError("تعذر إرسال الرسالة، حاول مرة أخرى.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Page title="تواصل معنا">
      <p style={{ marginBottom: 16 }}>
        لأي استفسار أو طلب توثيق كتاجر معتمد، ابعتلنا رسالتك وهيتم الرد عليك من إدارة الموقع.
      </p>

      {sent ? (
        <p style={{ color: "var(--kabbash)", fontWeight: 700 }}>تم إرسال رسالتك بنجاح، شكرًا لتواصلك معنا.</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 420 }}>
          <input type="text" placeholder="الاسم" value={name} onChange={(e) => setName(e.target.value)} required />
          <input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <textarea placeholder="رسالتك" value={text} onChange={(e) => setText(e.target.value)} required rows={5} style={{ fontFamily: "inherit", padding: 8, borderRadius: 8, border: "1px solid var(--line)" }} />
          <button className="btn btn-primary" type="submit" disabled={sending}>
            {sending ? "جاري الإرسال..." : "إرسال الرسالة"}
          </button>
          {error && <p style={{ color: "var(--danger)", fontSize: 12 }}>{error}</p>}
        </form>
      )}
    </Page>
  );
}

export function Guide() {
  return (
    <Page title="دليل الاستخدام">
      <ol style={{ paddingInlineStart: 20 }}>
        <li>تصفح أصناف الرصيف البحري أو ساحة الجزيره من الصفحة الرئيسية.</li>
        <li>سجّل دخولك بحساب جوجل واطلب التوثيق كتاجر معتمد.</li>
        <li>استخدم أداة الحساب لتجميع الأصناف وحساب إيجار المعدات والعمالة.</li>
        <li>أكّد الحجز واحصل على فاتورتك مجمعة وقابلة للطباعة.</li>
      </ol>
    </Page>
  );
}

export function Terms() {
  return (
    <Page title="شروط الاستخدام">
      <p>
        باستخدامك لمنصة "الجزيره خمسه" فإنك توافق على الالتزام بهذه الشروط.
        الحجوزات مُلزمة بمجرد تأكيدها، والأسعار والكميات المعروضة تخضع
        للتحديث اليومي من إدارة الموقع. يحتفظ الموقع بحق تعليق أو إنهاء أي
        حساب يخالف قواعد الاستخدام أو يسيء استخدام أدوات الحجز.
      </p>
    </Page>
  );
}

export function Privacy() {
  return (
    <Page title="سياسة الخصوصية">
      <p>
        نجمع فقط البيانات اللازمة لتشغيل الحساب (الاسم والبريد الإلكتروني
        عبر تسجيل الدخول بجوجل) وبيانات الحجوزات والفواتير الخاصة بك، ولا
        تتم مشاركتها مع أي طرف ثالث خارج نطاق تشغيل المنصة. يمكنك طلب حذف
        حسابك وبياناتك بالكامل في أي وقت من صفحة "حسابي".
      </p>
      <p style={{ marginTop: 12, fontSize: 12, color: "var(--steel-light)" }}>
        هذا الموقع مخصص لخدمة قطاع الخردة بمنطقة قناة السويس.
      </p>
    </Page>
  );
}
