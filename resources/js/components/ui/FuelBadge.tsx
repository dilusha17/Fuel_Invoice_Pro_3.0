import { cn } from "@/lib/utils";

interface FuelBadgeProps {
  type: string;
  className?: string;
}

function styleFor(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes("petrol")) return "badge-petrol";
  if (normalized.includes("diesel")) return "badge-diesel";
  return "badge-lubricant";
}

export function FuelBadge({ type, className }: FuelBadgeProps) {
  return (
    <span className={cn(styleFor(type), className)}>
      {type}
    </span>
  );
}
