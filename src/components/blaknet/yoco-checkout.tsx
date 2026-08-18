"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Lock, ShieldCheck, Check, CreditCard } from "lucide-react";
import type { Plan } from "@/lib/types";

const PLAN_DETAILS: Record<string, { name: string; price: number; priceLabel: string }> = {
  VERIFIED: { name: "Verified", price: 24900, priceLabel: "R249.00" },
  INTELLIGENCE: { name: "Intelligence", price: 89500, priceLabel: "R895.00" },
};

export function YocoCheckout({
  plan,
  open,
  onOpenChange,
  onSuccess,
}: {
  plan: Plan;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
}) {
  const { refreshAuth } = useApp();
  const { toast } = useToast();
  const [step, setStep] = useState<"form" | "processing" | "done">("form");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardName, setCardName] = useState("");

  const detail = PLAN_DETAILS[plan];
  if (!detail) return null;

  function formatCardNumber(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  }
  function formatExpiry(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  }

  function reset() {
    setCardNumber("");
    setExpiry("");
    setCvc("");
    setCardName("");
    setStep("form");
  }

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (cardNumber.replace(/\s/g, "").length < 16 || expiry.length < 5 || cvc.length < 3) {
      toast({ title: "Check your card details", variant: "destructive" });
      return;
    }
    setStep("processing");
    // Simulate Yoco payment processing
    await new Promise((r) => setTimeout(r, 1800));
    try {
      await api("/api/subscriptions/upgrade", {
        method: "POST",
        json: {
          plan,
          paymentReference: `yoco_sim_${Date.now()}`,
        },
      });
      await refreshAuth();
      setStep("done");
      setTimeout(() => {
        onOpenChange(false);
        reset();
        onSuccess?.();
      }, 1600);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payment failed.";
      toast({ title: "Payment failed", description: msg, variant: "destructive" });
      setStep("form");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setTimeout(reset, 300);
      }}
    >
      <DialogContent className="sm:max-w-md">
        {step === "done" ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage/15 text-sage">
              <Check className="h-7 w-7" />
            </div>
            <h2 className="mt-4 font-display text-2xl tracking-tight">Payment successful</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You're now on the {detail.name} plan. Enjoy premium features!
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-cream">
                  <CreditCard className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-sage">
                  Secure checkout
                </span>
              </div>
              <DialogTitle className="font-display text-2xl tracking-tight">
                Upgrade to {detail.name}
              </DialogTitle>
              <DialogDescription>
                {detail.priceLabel} per month · Cancel anytime
              </DialogDescription>
            </DialogHeader>

            {step === "processing" ? (
              <div className="flex flex-col items-center py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-sage" />
                <p className="mt-4 text-sm text-muted-foreground">Processing payment securely…</p>
                <p className="mt-1 text-[11px] text-foreground/40">Do not close this window</p>
              </div>
            ) : (
              <form onSubmit={pay} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="card-name">Name on card</Label>
                  <Input
                    id="card-name"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Thandiwe Mokoena"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="card-number">Card number</Label>
                  <Input
                    id="card-number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="4242 4242 4242 4242"
                    inputMode="numeric"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="expiry">Expiry</Label>
                    <Input
                      id="expiry"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      inputMode="numeric"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input
                      id="cvc"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="123"
                      inputMode="numeric"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage" />
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    This is a simulated checkout for demo purposes. No real payment is processed.
                    In production, this is handled securely by Yoco.
                  </p>
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="btn-lift flex-1 bg-ink text-cream shadow-md shadow-ink/15 hover:bg-ink/90"
                  >
                    <ShieldCheck className="mr-1.5 h-4 w-4" /> Pay {detail.priceLabel}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
