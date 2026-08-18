import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

export function StarRating({
  rating,
  size = 14,
  className,
  showValue = false,
  count,
}: {
  rating: number;
  size?: number;
  className?: string;
  showValue?: boolean;
  count?: number;
}) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="inline-flex">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < full || (i === full && hasHalf);
          return (
            <Star
              key={i}
              style={{ width: size, height: size }}
              className={cn(
                filled ? "fill-sage text-sage" : "fill-transparent text-foreground/25",
              )}
            />
          );
        })}
      </span>
      {showValue && (
        <span className="text-xs font-medium text-foreground/70">
          {rating > 0 ? rating.toFixed(1) : "New"}
          {typeof count === "number" && count > 0 && (
            <span className="text-foreground/40"> · {count}</span>
          )}
        </span>
      )}
    </span>
  );
}
