export default function AppLogo({ className = "", size = 40, title }) {
  const s = Number(size) || 40;
  return (
    <svg
      className={className}
      width={s}
      height={s}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      aria-label={title || undefined}
    >
      <path
        d="M8 28c8-14 22-18 28-22-2 10-8 20-22 26-4 2-8 3-12 3 2-4 4-7 6-7z"
        fill="#3d6b4f"
      />
      <path
        d="M12 14c6-4 14-5 20-6-1 8-6 15-14 19-2-5-4-9-6-13z"
        fill="#f28c33"
        opacity="0.95"
      />
      <path
        d="M20 22v10"
        stroke="#1b3b2f"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}
