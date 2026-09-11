import { useNavigate } from "react-router-dom";
import Logo from "./Logo";

export default function Footer() {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  function go(path) {
    navigate(path);
  }

  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <div className="app-footer-brand">
          <Logo size={30} />
          <p className="app-footer-tagline">
            منصة متكاملة لإدارة المعدات والفواتير، تهدف لتسهيل العمل اليومي
            وتنظيم العمليات بين الفريق والإدارة.
          </p>
        </div>

        <div>
          <h4 className="app-footer-title">روابط سريعة</h4>
          <div className="app-footer-links">
            <button onClick={() => go("/")}>الرئيسية</button>
            <button onClick={() => go("/calculator")}>أداة الحساب والفاتورة</button>
            <button onClick={() => go("/guide")}>دليل الاستخدام</button>
            <button onClick={() => go("/contact")}>تواصل معنا</button>
          </div>
        </div>

        <div>
          <h4 className="app-footer-title">معلومات</h4>
          <div className="app-footer-links">
            <button onClick={() => go("/about")}>عن الموقع</button>
            <button onClick={() => go("/terms")}>شروط الاستخدام</button>
            <button onClick={() => go("/privacy")}>سياسة الخصوصية</button>
          </div>
        </div>
      </div>

      <div className="app-footer-bottom">
        © {year} الجزيره خمسه · جميع الحقوق محفوظة · تصميم وتطوير{" "}
        <span className="author">Tamer Said</span>
      </div>
    </footer>
  );
}
