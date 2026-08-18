import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  tone = "ink",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  tone?: "ink" | "cream";
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <div
          className={cn(
            "mb-3 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em]",
            tone === "cream" ? "text-sage" : "text-sage",
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {eyebrow}
        </div>
      )}
      <h2
        className={cn(
          "font-display text-3xl leading-[1.1] tracking-tight sm:text-4xl md:text-[2.6rem]",
          tone === "cream" ? "text-cream" : "text-ink",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed text-muted-foreground sm:text-[17px]",
            tone === "cream" && "text-cream/70",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-cream">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <h3 className="font-display text-xl tracking-tight">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
