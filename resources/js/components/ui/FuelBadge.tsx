import { cn } from "@/lib/utils";

export type FuelType = "92-petrol" | "95-petrol" | "auto-diesel" | "super-diesel";

interface FuelBadgeProps {
  type: FuelType;
  className?: string;
}

const fuelLabels: Record<FuelType, string> = {
  "92-petrol": "92 Petrol",
  "95-petrol": "95 Petrol",
  "auto-diesel": "Auto Diesel",
  "super-diesel": "Super Diesel",
};

const fuelStyles: Record<FuelType, string> = {
  "92-petrol": "badge-petrol",
  "95-petrol": "badge-petrol",
  "auto-diesel": "badge-diesel",
  "super-diesel": "badge-diesel",
};

export function FuelBadge({ type, className }: FuelBadgeProps) {
  return (
    <span className={cn(fuelStyles[type], className)}>
      {fuelLabels[type]}
    </span>
  );
}

// Export fuel options for use in dropdowns
export const fuelTypeOptions = [
  { value: "92-petrol", label: "92 Petrol" },
  { value: "95-petrol", label: "95 Petrol" },
  { value: "auto-diesel", label: "Auto Diesel" },
  { value: "super-diesel", label: "Super Diesel" },
];
