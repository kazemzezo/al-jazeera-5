import { useNavigate } from "react-router-dom";
import Logo from "./Logo";

// ════════════════════════════════════════════
// ✏️ عدّل كل النصوص من هنا — كل حاجة في مكان واحد
// ════════════════════════════════════════════
const CONTENT = {
  // وصف الموقع (اللي تحت اللوجو)
  tagline:
    
"مكانك في السوق محفوظ. مع الجزيره خمسه، اشترِ بكمية تناسبك، نافس بفرصة عادلة، وكبّر شركتك خطوة بخطوة."
  // العمود الأول
  quickLinks: {
    title: "روابط سريعة",
    links: [
      { label: "الرئيسية", path: "/" },
      { label: "أداة الحساب والفاتورة", path: "/calculator" },
      { label: "دليل الاستخدام", path: "/guide" },
      { label: "تواصل معنا", path: "/contact" },
    ],
  },

  // العمود التاني
  infoLinks: {
    title: "معلومات",
    links: [
      { label: "عن الموقع", path: "/about" },
      { label: "شروط الاستخدام", path: "/terms" },
      { label: "سياسة الخصوصية", path: "/privacy" },
    ],
  },

  // السطر السفلي
  copyright: "جميع الحقوق محفوظة",
  designer: "Tamer Said",
};
// ════════════════════════════════════════════

export default function Footer() {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  const renderSection = (section) => (
    <div className="app-footer-section">
      <h4 className="app-footer-title">{section.title}</h4>
      <div className="app-footer-links">
        {section.links.map((link) => (
          <button
            key={link.path + link.label}
            onClick={() => navigate(link.path)}
            className="app-footer-link"
          >
            {link.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <div className="app-footer-brand">
          <Logo size={30} />
          <p className="app-footer-tagline">{CONTENT.tagline}</p>
        </div>

        {renderSection(CONTENT.quickLinks)}
        {renderSection(CONTENT.infoLinks)}
      </div>

      <div className="app-footer-bottom">
        © {year} الجزيره خمسه · {CONTENT.copyright} · تصميم وتطوير{" "}
        <span className="author">{CONTENT.designer}</span>
      </div>

      <style>{`
        .app-footer-brand {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .app-footer-section {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .app-footer-links {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .app-footer-link {
          color: var(--steel);
          font-size: 13.5px;
          background: none;
          border: none;
          text-align: start;
          padding: 5px 0;
          cursor: pointer;
          transition: color .2s, transform .2s;
          white-space: normal;
          line-height: 1.5;
        }

        .app-footer-link:hover {
          color: var(--kabbash);
        }

        /* ✅ موبايل: البراند فوق + العمودين جنب بعض */
        @media (max-width: 719px) {
          .app-footer-inner {
            grid-template-columns: 1fr 1fr !important;
            gap: 20px 24px !important;
          }
          .app-footer-brand {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 480px) {
          .app-footer-tagline {
            font-size: 12.5px;
            line-height: 1.7;
          }
          .app-footer-link {
            font-size: 12.5px;
            padding: 4px 0;
          }
          .app-footer-title {
            font-size: 12.5px;
            margin-bottom: 6px;
          }
          .app-footer-inner {
            padding-block: 20px 16px !important;
          }
          .app-footer-bottom {
            padding: 12px 14px !important;
            font-size: 11.5px !important;
          }
        }
      `}</style>
    </footer>
  );
}
