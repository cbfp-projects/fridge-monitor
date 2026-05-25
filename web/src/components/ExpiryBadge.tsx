import { expiryLabel, getExpiryStatus } from "../utils/expiry";

interface ExpiryBadgeProps {
  expirationDate: string;
}

export function ExpiryBadge({ expirationDate }: ExpiryBadgeProps) {
  const status = getExpiryStatus(expirationDate);
  return (
    <span className={`badge badge-${status}`} title={expirationDate}>
      {expiryLabel(expirationDate)}
    </span>
  );
}
