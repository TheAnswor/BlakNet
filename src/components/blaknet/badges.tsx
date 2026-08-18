import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, XCircle, ShieldCheck } from "lucide-react";
import type { VerificationStatus } from "@/lib/types";
import { verificationLabel } from "@/lib/format";

export function VerifiedBadge({
  status,
  className,
  size = "sm",
}: {
  status: VerificationStatus;
  className?: string;
  size?: "sm" | "md";
}) {
  if (status === "VERIFIED") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full font-medium",
          size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
          "bg-sage/12 text-sage border border-sage/25",
          className,
        )}
      >
        <ShieldCheck className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
        Verified
      </span>
    );
  }
  if (status === "PENDING") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-muted-foreground/10 text-muted-foreground border border-muted-foreground/20",
          size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
          className,
        )}
      >
        <Clock className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
        {verificationLabel(status)}
      </span>
    );
  }
  if (status === "REJECTED") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive border border-destructive/25",
          size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
          className,
        )}
      >
        <XCircle className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
        Rejected
      </span>
    );
  }
  return null;
}

export function BBBEEBadge({ level, className }: { level: string | null; className?: string }) {
  if (!level) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-foreground/15 bg-foreground/5 px-2 py-0.5 text-[11px] font-medium text-foreground/80",
        className,
      )}
    >
      <CheckCircle2 className="h-3 w-3 text-sage" />
      {level}
    </span>
  );
}

export function Pill({
  children,
  className,
  tone = "neutral",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "neutral" | "ink" | "sage" | "cream";
}) {
  const tones = {
    neutral: "bg-foreground/5 text-foreground/70 border-foreground/15",
    ink: "bg-ink text-cream border-ink",
    sage: "bg-sage/15 text-sage border-sage/30",
    cream: "bg-cream text-ink border-cream",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
