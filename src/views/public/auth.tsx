"use client";

import { useState, type ReactNode } from "react";
import { useApp } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo, LogoMark } from "@/components/blaknet/logo";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Network,
  Rocket,
  Sparkles,
} from "lucide-react";

// ============================================================
// Shared split-screen layout
// ============================================================

function AuthLayout({
  children,
  side = "right",
}: {
  children: ReactNode;
  side?: "left" | "right";
}) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col lg:flex-row">
      {/* Brand panel (desktop only) */}
      <div
        className={
          side === "left"
            ? "relative hidden overflow-hidden bg-ink-grain text-cream lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12"
            : "relative hidden overflow-hidden bg-ink-grain text-cream lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12"
        }
      >
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
            <Sparkles className="h-3.5 w-3.5" /> Built for Black Business
          </div>
          <h2 className="font-display text-3xl leading-tight tracking-tight text-cream sm:text-4xl">
            The digital infrastructure for Black-owned business.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-cream/70">
            Get discovered. Build your network. Get procurement, partnership and funding-ready.
          </p>
          <p className="mt-6 font-display text-lg italic text-sage">
            Get Exposed. Get Connected. Get Ready.
          </p>
        </div>

        <div className="relative space-y-3">
          <TrustBullet icon={ShieldCheck} text="Verified, procurement-ready profiles." />
          <TrustBullet icon={Network} text="Real community — clients, partners, opportunities." />
          <TrustBullet icon={Rocket} text="Resources, verification and intelligence in one place." />
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-16 lg:py-20">
        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <Logo />
        </div>
        {children}
      </div>
    </div>
  );
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

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs text-destructive">{message}</p>
  );
}

// ============================================================
// Shared password input
// ============================================================

function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  placeholder,
  error,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  placeholder?: string;
  error?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder ?? "••••••••"}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 pl-9 pr-10"
        aria-invalid={!!error}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============================================================
// LoginView
// ============================================================

export function LoginView() {
  const { navigate, refreshAuth } = useApp();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const validate = () => {
    const e: { email?: string; password?: string } = {};
    if (!email.trim()) e.email = "Email is required.";
    else if (!EMAIL_RE.test(email.trim())) e.email = "Enter a valid email address.";
    if (!password) e.password = "Password is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api("/api/auth/login", {
        method: "POST",
        json: { email: email.trim(), password },
      });
      await refreshAuth();
      toast({ title: "Welcome back", description: "You're signed in." });
      navigate({ name: "dashboard" });
    } catch (err) {
      toast({
        title: "Sign in failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      await api("/api/auth/demo", { method: "POST" });
      await refreshAuth();
      toast({ title: "Demo account", description: "You're signed in as the demo user." });
      navigate({ name: "dashboard" });
    } catch (err) {
      toast({
        title: "Demo unavailable",
        description: err instanceof Error ? err.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mx-auto w-full max-w-md">
        <h1 className="font-display text-3xl tracking-tight text-ink">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to your BlakNet account to continue building.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="login-email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                placeholder="you@example.co.za"
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 pl-9"
                aria-invalid={!!errors.email}
              />
            </div>
            <FieldError message={errors.email} />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">Password</Label>
              <button
                type="button"
                onClick={() => navigate({ name: "forgot" })}
                className="text-xs text-sage hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <PasswordInput
              id="login-password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              error={errors.password}
            />
            <FieldError message={errors.password} />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-10 w-full bg-ink text-cream hover:bg-ink/90"
          >
            {loading ? "Signing in…" : "Sign in"}
            {!loading && <ArrowRight className="ml-1.5 h-4 w-4" />}
          </Button>
        </form>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            or
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleDemo}
          disabled={demoLoading}
          className="mt-4 h-10 w-full border-ink/15 bg-transparent text-ink hover:bg-ink/5"
        >
          {demoLoading ? "Loading demo…" : "Use demo account"}
        </Button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => navigate({ name: "register" })}
            className="font-medium text-sage hover:underline"
          >
            Join BlakNet
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}

// ============================================================
// RegisterView
// ============================================================

export function RegisterView() {
  const { navigate, refreshAuth } = useApp();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    agree?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!firstName.trim()) e.firstName = "First name is required.";
    if (!lastName.trim()) e.lastName = "Last name is required.";
    if (!email.trim()) e.email = "Email is required.";
    else if (!EMAIL_RE.test(email.trim())) e.email = "Enter a valid email address.";
    if (!password) e.password = "Password is required.";
    else if (password.length < 6) e.password = "Password must be at least 6 characters.";
    if (!agree) e.agree = "Please accept the Terms & Privacy to continue.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api("/api/auth/register", {
        method: "POST",
        json: { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password },
      });
      await refreshAuth();
      toast({ title: "Welcome to BlakNet", description: "Your account is ready." });
      navigate({ name: "dashboard" });
    } catch (err) {
      toast({
        title: "Registration failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mx-auto w-full max-w-md">
        <h1 className="font-display text-3xl tracking-tight text-ink">Join BlakNet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create your free account and start building your network.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="reg-first">First name</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reg-first"
                  value={firstName}
                  autoComplete="given-name"
                  placeholder="Thandiwe"
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-10 pl-9"
                  aria-invalid={!!errors.firstName}
                />
              </div>
              <FieldError message={errors.firstName} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-last">Last name</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="reg-last"
                  value={lastName}
                  autoComplete="family-name"
                  placeholder="Mokoena"
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-10 pl-9"
                  aria-invalid={!!errors.lastName}
                />
              </div>
              <FieldError message={errors.lastName} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="reg-email"
                type="email"
                autoComplete="email"
                value={email}
                placeholder="you@example.co.za"
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 pl-9"
                aria-invalid={!!errors.email}
              />
            </div>
            <FieldError message={errors.email} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-password">Password</Label>
            <PasswordInput
              id="reg-password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              error={errors.password}
            />
            <FieldError message={errors.password} />
            <p className="text-[11px] text-muted-foreground">
              At least 6 characters.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-start gap-2.5">
              <Checkbox
                id="reg-agree"
                checked={agree}
                onCheckedChange={(v) => setAgree(v === true)}
                className="mt-0.5"
              />
              <Label htmlFor="reg-agree" className="text-sm leading-snug font-normal text-muted-foreground">
                I agree to the{" "}
                <span className="font-medium text-ink">Terms</span> &{" "}
                <span className="font-medium text-ink">Privacy</span> of BlakNet.
              </Label>
            </div>
            <FieldError message={errors.agree} />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-10 w-full bg-ink text-cream hover:bg-ink/90"
          >
            {loading ? "Creating account…" : "Create account"}
            {!loading && <ArrowRight className="ml-1.5 h-4 w-4" />}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate({ name: "login" })}
            className="font-medium text-sage hover:underline"
          >
            Log in
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}

// ============================================================
// ForgotView
// ============================================================

export function ForgotView() {
  const { navigate } = useApp();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setError(undefined);
    setLoading(true);
    // MVP: no backend — simulate send
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Reset link sent",
        description: "Password reset link sent (demo) — check your inbox.",
      });
      setEmail("");
    }, 700);
  };

  return (
    <AuthLayout>
      <div className="mx-auto w-full max-w-md">
        <h1 className="font-display text-3xl tracking-tight text-ink">Forgot password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the email you used to sign up — we'll send you a reset link.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="forgot-email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                placeholder="you@example.co.za"
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 pl-9"
                aria-invalid={!!error}
              />
            </div>
            <FieldError message={error} />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-10 w-full bg-ink text-cream hover:bg-ink/90"
          >
            {loading ? "Sending…" : "Send reset link"}
            {!loading && <ArrowRight className="ml-1.5 h-4 w-4" />}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <button
            type="button"
            onClick={() => navigate({ name: "login" })}
            className="font-medium text-sage hover:underline"
          >
            Back to log in
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}
