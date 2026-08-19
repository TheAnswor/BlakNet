"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo, LogoMark } from "@/components/blaknet/logo";
import { EmptyState } from "@/components/blaknet/section";
import {
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ShieldCheck,
  Network,
  Sparkles,
  Loader2,
  Building2,
  CheckCircle2,
} from "lucide-react";

// ---------- types ----------
interface InvitePayload {
  invite: {
    email: string;
    role: "OWNER" | "MANAGER" | "STAFF";
    business: { id: string; name: string; slug: string };
    hasAccount: boolean;
  };
}

type LoadState =
  | { kind: "loading" }
  | { kind: "invalid" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: InvitePayload["invite"] };

function roleLabel(role: InvitePayload["invite"]["role"]): string {
  if (role === "MANAGER") return "Manager";
  if (role === "STAFF") return "Staff";
  return "Owner";
}

function TrustBullet({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm text-cream/80">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream/10 text-sage">
        <Icon className="h-4 w-4" />
      </span>
      {text}
    </div>
  );
}

export function InviteAcceptView() {
  const route = useApp((s) => s.route);
  if (route.name !== "invite") return null;
  return <InviteAccept key={route.token} token={route.token} />;
}

function InviteAccept({ token }: { token: string }) {
  const navigate = useApp((s) => s.navigate);
  const refreshAuth = useApp((s) => s.refreshAuth);
  const { toast } = useToast();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  // registration form (only used if hasAccount === false)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ firstName?: string; password?: string }>({});
  const [registering, setRegistering] = useState(false);

  // accept flow (for users who already have an account)
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await api<InvitePayload>(
          `/api/invite/${encodeURIComponent(token)}`,
        );
        if (!cancelled) setState({ kind: "ready", data: d.invite });
      } catch (err) {
        if (cancelled) return;
        const e = err as Error & { status?: number };
        // The GET endpoint returns 404 for invalid/expired/revoked tokens.
        // Any other failure still means we can't show an invite → treat as
        // invalid so the user gets a clean recovery path.
        if (
          e.status === 404 ||
          e.status === 400 ||
          e.status === 500 ||
          e.status === 401
        ) {
          setState({ kind: "invalid" });
        } else {
          setState({ kind: "error", message: e.message });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // ----- registration (no existing account) -----
  const validateRegister = () => {
    const e: { firstName?: string; password?: string } = {};
    if (!firstName.trim()) e.firstName = "First name is required.";
    if (!password) e.password = "Password is required.";
    else if (password.length < 6) e.password = "Password must be at least 6 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validateRegister()) return;
    setRegistering(true);
    try {
      const res = await api<{ ok: true; businessName: string; businessSlug: string }>(
        `/api/invite/${encodeURIComponent(token)}`,
        {
          method: "POST",
          json: {
            firstName: firstName.trim(),
            lastName: lastName.trim() || undefined,
            password,
          },
        },
      );
      await refreshAuth();
      toast({
        title: `Welcome to ${res.businessName}!`,
        description: "Your account is ready — let's get building.",
      });
      navigate({ name: "dashboard" });
    } catch (err) {
      toast({
        title: "Couldn't accept invite",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setRegistering(false);
    }
  };

  // ----- accept (already-logged-in user) -----
  const handleAcceptExisting = async () => {
    setAccepting(true);
    try {
      const res = await api<{ ok: true; businessName: string; businessSlug: string }>(
        `/api/invite/${encodeURIComponent(token)}`,
        { method: "POST", json: {} },
      );
      await refreshAuth();
      toast({
        title: `Welcome to ${res.businessName}!`,
        description: "You're now part of the team.",
      });
      navigate({ name: "dashboard-businesses" });
    } catch (err) {
      const e = err as Error & { status?: number; data?: { needLogin?: boolean } };
      if (e.status === 401 && e.data?.needLogin) {
        toast({
          title: "Log in to accept",
          description: "Please sign in with the invited email to accept.",
        });
        navigate({ name: "login" });
        return;
      }
      toast({
        title: "Couldn't accept invite",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  // ----- render -----
  if (state.kind === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-sage" />
          <p className="text-sm text-muted-foreground">Validating your invite…</p>
        </div>
      </div>
    );
  }

  if (state.kind === "invalid") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">
          <EmptyState
            icon={Mail}
            title="Invalid invite"
            description="This invite link is no longer valid — it may have expired, been revoked, or already been used. Ask the business owner to send you a new invite."
            action={
              <Button
                onClick={() => navigate({ name: "home" })}
                className="bg-ink text-cream hover:bg-ink/90"
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to home
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">
          <EmptyState
            title="Something went wrong"
            description={state.message}
            action={
              <Button
                onClick={() => navigate({ name: "home" })}
                className="bg-ink text-cream hover:bg-ink/90"
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to home
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const invite = state.data;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-1 flex-col lg:flex-row">
      {/* Brand panel (desktop) */}
      <div className="relative hidden overflow-hidden bg-ink-grain text-cream lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0 opacity-[0.35]">
          <LogoMark
            className="absolute -bottom-12 -right-12 h-80 w-80 text-cream/10"
            size={320}
          />
        </div>

        <div className="relative">
          <Logo markClassName="text-cream" textClassName="text-cream" />
        </div>

        <div className="relative max-w-md">
          <div className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-sage">
            <Sparkles className="h-3.5 w-3.5" /> You've been invited
          </div>
          <h2 className="font-display text-3xl leading-tight tracking-tight text-cream sm:text-4xl">
            Join {invite.business.name} on BlakNet.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-cream/70">
            You've been invited to collaborate as a{" "}
            <span className="font-medium text-sage">{roleLabel(invite.role)}</span>. Accept
            this invite to start building together.
          </p>
          <p className="mt-6 font-display text-lg italic text-sage">
            Join the BlakNet business ecosystem.
          </p>
        </div>

        <div className="relative space-y-3">
          <TrustBullet icon={ShieldCheck} text="Trusted, verified business profiles." />
          <TrustBullet icon={Network} text="A real community of Black-owned businesses." />
          <TrustBullet icon={Building2} text="Resources, network and intelligence in one place." />
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-1 flex-col justify-center bg-background px-4 py-12 sm:px-6 lg:w-1/2 lg:px-16 lg:py-20">
        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <Logo />
        </div>

        <div className="mx-auto w-full max-w-md">
          {/* Invite header card */}
          <div className="card-soft mb-6 rounded-xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-cream">
                <Building2 className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Invited to join
                </p>
                <p className="truncate font-display text-lg tracking-tight text-ink">
                  {invite.business.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Role: <span className="font-medium text-sage">{roleLabel(invite.role)}</span> · {invite.email}
                </p>
              </div>
            </div>
          </div>

          {invite.hasAccount ? (
            <ExistingAccountForm
              email={invite.email}
              accepting={accepting}
              onAccept={handleAcceptExisting}
              onLogin={() => navigate({ name: "login" })}
            />
          ) : (
            <RegisterForm
              email={invite.email}
              firstName={firstName}
              lastName={lastName}
              password={password}
              showPw={showPw}
              errors={errors}
              registering={registering}
              onFirstName={setFirstName}
              onLastName={setLastName}
              onPassword={setPassword}
              onTogglePw={() => setShowPw((s) => !s)}
              onSubmit={handleRegister}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function RegisterForm({
  email,
  firstName,
  lastName,
  password,
  showPw,
  errors,
  registering,
  onFirstName,
  onLastName,
  onPassword,
  onTogglePw,
  onSubmit,
}: {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  showPw: boolean;
  errors: { firstName?: string; password?: string };
  registering: boolean;
  onFirstName: (v: string) => void;
  onLastName: (v: string) => void;
  onPassword: (v: string) => void;
  onTogglePw: () => void;
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <div className="card-soft rounded-xl border border-border bg-card p-6 sm:p-8">
      <h1 className="font-display text-2xl tracking-tight text-ink sm:text-3xl">
        Create your BlakNet account
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Set up your password to accept the invite and join the team.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="inv-first">First name</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="inv-first"
                value={firstName}
                autoComplete="given-name"
                placeholder="Thandiwe"
                onChange={(e) => onFirstName(e.target.value)}
                className="h-10 pl-9"
                aria-invalid={!!errors.firstName}
                required
                autoFocus
              />
            </div>
            {errors.firstName && (
              <p className="text-xs text-destructive">{errors.firstName}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-last">Last name (optional)</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="inv-last"
                value={lastName}
                autoComplete="family-name"
                placeholder="Mokoena"
                onChange={(e) => onLastName(e.target.value)}
                className="h-10 pl-9"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="inv-email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="inv-email"
              type="email"
              value={email}
              readOnly
              disabled
              className="h-10 cursor-not-allowed pl-9 opacity-70"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            This is the email your invite was sent to.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="inv-password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="inv-password"
              type={showPw ? "text" : "password"}
              value={password}
              autoComplete="new-password"
              placeholder="••••••••"
              onChange={(e) => onPassword(e.target.value)}
              className="h-10 pl-9 pr-10"
              aria-invalid={!!errors.password}
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={onTogglePw}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password ? (
            <p className="text-xs text-destructive">{errors.password}</p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              At least 6 characters.
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={registering}
          className="btn-lift h-10 w-full bg-ink text-cream hover:bg-ink/90"
        >
          {registering ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Accepting…
            </>
          ) : (
            <>
              Accept invite & create account
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

function ExistingAccountForm({
  email,
  accepting,
  onAccept,
  onLogin,
}: {
  email: string;
  accepting: boolean;
  onAccept: () => void;
  onLogin: () => void;
}) {
  return (
    <div className="card-soft rounded-xl border border-border bg-card p-6 sm:p-8">
      <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-sage/30 bg-sage/10 px-3 py-1 text-[11px] font-medium text-sage">
        <CheckCircle2 className="h-3.5 w-3.5" /> Account found
      </span>
      <h1 className="font-display text-2xl tracking-tight text-ink sm:text-3xl">
        You already have a BlakNet account
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We found an existing account for{" "}
        <span className="font-medium text-foreground">{email}</span>. Log in to accept
        this invite and join the team.
      </p>

      <div className="mt-6 space-y-3">
        <Button
          type="button"
          onClick={onLogin}
          className="btn-lift h-10 w-full bg-ink text-cream hover:bg-ink/90"
        >
          Log in
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            or
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onAccept}
          disabled={accepting}
          className="h-10 w-full border-ink/15 bg-transparent text-ink hover:bg-ink/5"
        >
          {accepting ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Accepting…
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-1.5 h-4 w-4" /> Accept invite (if already signed in)
            </>
          )}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          If you're already signed in as {email}, accept the invite directly.
        </p>
      </div>
    </div>
  );
}
