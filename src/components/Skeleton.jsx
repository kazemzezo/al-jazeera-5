/* ============================================
   Skeleton Components — هياكل التحميل
   ============================================ */

// الشريط الأساسي
export function Skeleton({
  width = "100%",
  height = 16,
  radius = 6,
  style = {},
}) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}

/* ============================================
   Skeleton نصي (سطر أو أكتر)
   ============================================ */
export function SkeletonText({ lines = 1, gap = 6, lastWidth = "60%" }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap,
        width: "100%",
      }}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={12}
          width={i === lines - 1 && lines > 1 ? lastWidth : "100%"}
        />
      ))}
    </div>
  );
}

/* ============================================
   Skeleton كارت الإعلان (مطابق لـ AdCard)
   ============================================ */
export function SkeletonAdCard() {
  return (
    <div className="skeleton-card">
      <Skeleton height={160} radius={0} />
      <div className="skeleton-card-body">
        <Skeleton height={14} width="80%" style={{ marginBottom: 6 }} />
        <Skeleton height={10} width="60%" style={{ marginBottom: 10 }} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Skeleton height={12} width="40%" />
          <Skeleton height={14} width="30%" />
        </div>
      </div>
    </div>
  );
}

/* ============================================
   Skeleton شبكة كروت (للرئيسية / dock / yard)
   ============================================ */
export function SkeletonAdGrid({ count = 6 }) {
  return (
    <div className="skeleton-ad-grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonAdCard key={i} />
      ))}
      <style>{`
        .skeleton-ad-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 14px;
        }
        @media (max-width: 500px) {
          .skeleton-ad-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

/* ============================================
   Skeleton صف حجز (للـ Profile)
   ============================================ */
export function SkeletonReservationRow() {
  return (
    <div className="skeleton-reservation-row">
      <div style={{ flex: 1, minWidth: 0 }}>
        <Skeleton height={12} width="30%" style={{ marginBottom: 8 }} />
        <Skeleton height={14} width="70%" style={{ marginBottom: 6 }} />
        <Skeleton height={10} width="40%" />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 8,
          minWidth: 100,
        }}
      >
        <Skeleton height={16} width={80} />
        <Skeleton height={24} width={100} radius={6} />
      </div>
      <style>{`
        .skeleton-reservation-row {
          background: var(--paper-sunken);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 12px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
        }
      `}</style>
    </div>
  );
}

/* ============================================
   Skeleton صفحة الإعلان
   ============================================ */
export function SkeletonAdDetails() {
  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <Skeleton height={36} width={120} style={{ marginBottom: 16 }} />
      <div className="skeleton-ad-details-card">
        <Skeleton height={280} radius={0} />
        <div style={{ padding: 22 }}>
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 14,
              flexWrap: "wrap",
            }}
          >
            <Skeleton height={22} width={100} radius={999} />
            <Skeleton height={22} width={130} radius={999} />
          </div>
          <Skeleton height={24} width="70%" style={{ marginBottom: 12 }} />
          <SkeletonText lines={2} />
          <div style={{ marginTop: 22, marginBottom: 10 }}>
            <Skeleton height={14} width={120} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Skeleton height={50} radius={10} />
            <Skeleton height={50} radius={10} />
          </div>
          <div style={{ marginTop: 20 }}>
            <Skeleton height={48} radius={10} />
          </div>
        </div>
      </div>
      <style>{`
        .skeleton-ad-details-card {
          background: var(--paper-raised);
          border: 1px solid var(--line);
          border-radius: 16px;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

/* ============================================
   Skeleton قائمة محافظ
   ============================================ */
export function SkeletonWalletCard() {
  return (
    <div className="skeleton-wallet-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div>
          <Skeleton height={16} width={100} style={{ marginBottom: 6 }} />
          <Skeleton height={12} width={140} />
        </div>
        <Skeleton height={24} width={80} radius={999} />
      </div>
      <Skeleton height={70} radius={12} style={{ marginBottom: 14 }} />
      <Skeleton height={14} width={120} style={{ marginBottom: 8 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Skeleton height={50} radius={8} />
        <Skeleton height={50} radius={8} />
      </div>
      <style>{`
        .skeleton-wallet-card {
          background: var(--paper-raised);
          border: 1px solid var(--line);
          border-radius: var(--radius-lg);
          padding: 18px;
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
}

/* ============================================
   Skeleton جدول/قائمة عامة
   ============================================ */
export function SkeletonList({ count = 3, itemHeight = 60 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} height={itemHeight} radius={10} />
      ))}
    </div>
  );
}

/* ============================================
   CSS الأساسي للـ Shimmer Effect
   ============================================ */
export function SkeletonStyles() {
  return (
    <style>{`
      .skeleton {
        background: linear-gradient(
          90deg,
          var(--paper-sunken) 0%,
          var(--line) 50%,
          var(--paper-sunken) 100%
        );
        background-size: 200% 100%;
        animation: skeleton-shimmer 1.6s ease-in-out infinite;
      }
      @keyframes skeleton-shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      @media (prefers-reduced-motion: reduce) {
        .skeleton {
          animation: none;
          background: var(--paper-sunken);
        }
      }
    `}</style>
  );
}
