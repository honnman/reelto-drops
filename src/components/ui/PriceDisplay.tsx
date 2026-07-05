import { formatPrice } from "@/lib/utils";

interface PriceDisplayProps {
  paise: number;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function PriceDisplay({ paise, className = "", size = "md" }: PriceDisplayProps) {
  const sizes = {
    sm: "text-sm font-semibold",
    md: "text-xl font-bold",
    lg: "text-3xl font-bold",
    xl: "text-4xl font-extrabold",
  };
  return (
    <span className={`${sizes[size]} text-rose-600 ${className}`}>
      {formatPrice(paise)}
    </span>
  );
}
