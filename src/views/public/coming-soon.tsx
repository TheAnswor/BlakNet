"use client";

import type { Route } from "@/lib/types";
import { Construction } from "lucide-react";

export function ComingSoon({ route }: { route: Route }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-cream">
        <Construction className="h-6 w-6" />
      </div>
      <h1 className="mt-6 font-display text-3xl tracking-tight">Coming next</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        The <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{route.name}</code> view is being built. Check back shortly.
      </p>
    </div>
  );
}
