import { cn } from "@/lib/utils";

export function LogoMark({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="14" fill="currentColor" />
      <path
        d="M20 16h13.5c5.2 0 8.7 2.6 8.7 7 0 3.1-1.8 5.2-4.6 5.9v.2c3.5.4 5.9 2.7 5.9 6.4 0 5.1-3.9 8.1-9.8 8.1H20V16zm6.8 11.2h5.4c2.4 0 3.7-1 3.7-2.8 0-1.9-1.3-2.8-3.7-2.8h-5.4v5.6zm0 11.4h6.1c2.6 0 4-1.1 4-3.1 0-2-1.4-3-4-3h-6.1v6.1z"
        fill="#F6F6DF"
      />
      <circle cx="46" cy="20" r="3.4" fill="#717568" />
      <circle cx="46" cy="44" r="3.4" fill="#717568" />
      <line x1="42.6" y1="20" x2="42.6" y2="44" stroke="#717568" strokeWidth="1.4" strokeDasharray="2 2" opacity="0.7" />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
  textClassName,
  showText = true,
  size = 36,
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  showText?: boolean;
  size?: number;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={cn("text-ink", markClassName)} size={size} />
      {showText && (
        <span className={cn("font-display text-2xl leading-none tracking-tight", textClassName)}>
          Blak<span className="text-sage">Net</span>
        </span>
      )}
    </span>
  );
}
