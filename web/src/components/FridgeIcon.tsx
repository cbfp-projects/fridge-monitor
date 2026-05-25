interface FridgeIconProps {
  size?: number;
}

/** Simple refrigerator outline for location tabs. */
export function FridgeIcon({ size = 18 }: FridgeIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="6" y="3" width="12" height="18" rx="1.5" />
      <path d="M6 11h12" />
      <path d="M14 7.5v1" />
      <path d="M14 14.5v1" />
    </svg>
  );
}
