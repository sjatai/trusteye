// Custom stars icon extracted from the brand logo
export function StarsIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Large star */}
      <path
        d="M12 2L13.5 7.5L19 9L13.5 10.5L12 16L10.5 10.5L5 9L10.5 7.5L12 2Z"
        fill="currentColor"
      />
      {/* Medium star */}
      <path
        d="M17 14L17.8 16.2L20 17L17.8 17.8L17 20L16.2 17.8L14 17L16.2 16.2L17 14Z"
        fill="currentColor"
      />
      {/* Small star */}
      <path
        d="M7 17L7.5 18.5L9 19L7.5 19.5L7 21L6.5 19.5L5 19L6.5 18.5L7 17Z"
        fill="currentColor"
      />
    </svg>
  );
}
