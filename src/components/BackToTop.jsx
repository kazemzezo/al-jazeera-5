import { useEffect, useState } from "react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      // يظهر لما ننزل 400px
      setVisible(window.scrollY > 400);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // فحص أولي

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <button
      type="button"
      className={"back-to-top" + (visible ? " visible" : "")}
      onClick={scrollToTop}
      aria-label="العودة لأعلى"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
      <style>{`
        .back-to-top {
          position: fixed;
          bottom: 20px;
          inset-inline-end: 20px;
          width: 46px;
          height: 46px;
          border-radius: 50%;
          border: none;
          background: var(--kabbash);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(47, 104, 68, 0.35);
          opacity: 0;
          visibility: hidden;
          transform: translateY(12px);
          transition: opacity .25s ease, visibility .25s ease, transform .25s ease, background .2s;
          z-index: 45;
        }
        .back-to-top.visible {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        .back-to-top:hover {
          background: var(--kabbash-dark);
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(47, 104, 68, 0.5);
        }
        .back-to-top:active {
          transform: translateY(-1px) scale(0.95);
        }
        .back-to-top:focus-visible {
          outline: 2px solid var(--crane);
          outline-offset: 3px;
        }

        @media (max-width: 480px) {
          .back-to-top {
            width: 42px;
            height: 42px;
            bottom: 16px;
            inset-inline-end: 16px;
          }
        }

        /* في الطباعة مش بيظهر */
        @media print {
          .back-to-top {
            display: none !important;
          }
        }
      `}</style>
    </button>
  );
}
