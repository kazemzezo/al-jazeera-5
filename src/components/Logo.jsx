export default function Logo({ size = 32, withText = true }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="12" fill="var(--kabbash)" />
        <path
          d="M32 12H18v9h8c4 0 6 2.5 6 6.5S30 34 26 34c-3 0-5.2-1.3-6.4-3.4"
          stroke="#fff"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="34" cy="30" r="2.6" fill="#fff" />
      </svg>
      {withText && (
        <span style={{ fontWeight: 900, fontSize: size < 28 ? 14 : 16, color: "var(--ink)" }}>
          الجزيره خمسه
        </span>
      )}
    </div>
  );
}
