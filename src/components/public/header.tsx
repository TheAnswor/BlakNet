"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { Logo } from "@/components/blaknet/logo";
import { ThemeToggle } from "@/components/blaknet/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu, Search, Bell, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { initials } from "@/lib/format";

const PUBLIC_LINKS: { label: string; route: Parameters<ReturnType<typeof useApp.getState>["navigate"]>[0] }[] = [
  { label: "Newsfeed", route: { name: "newsfeed" } },
  { label: "Directory", route: { name: "directory" } },
  { label: "Events", route: { name: "events" } },
  { label: "Resources", route: { name: "resources" } },
  { label: "Pricing", route: { name: "pricing" } },
  { label: "About", route: { name: "about" } },
];

export function PublicHeader() {
  const { route, navigate, authUser, authLoading, setMobileNavOpen, mobileNavOpen } = useApp();
  const [searchValue, setSearchValue] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ name: "directory" });
    // store search in sessionStorage for the directory to pick up
    if (searchValue.trim()) {
      sessionStorage.setItem("blaknet:directory-search", searchValue.trim());
    }
  };

  const isActive = (name: string) => route.name === name;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b transition-all duration-300",
        scrolled
          ? "border-border bg-background/85 backdrop-blur-xl"
          : "border-transparent bg-background",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <button
          type="button"
          onClick={() => navigate({ name: "newsfeed" })}
          className="shrink-0 transition-opacity hover:opacity-80"
          aria-label="BlakNet home"
        >
          <Logo />
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {PUBLIC_LINKS.map((l) => (
            <button
              key={l.label}
              type="button"
              onClick={() => navigate(l.route)}
              className={cn(
                "link-underline rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(l.route.name)
                  ? "text-ink"
                  : "text-foreground/70 hover:text-ink",
              )}
            >
              {l.label}
            </button>
          ))}
        </nav>

        {/* Search (desktop) */}
        <form onSubmit={submitSearch} className="ml-auto hidden flex-1 max-w-xs items-center md:flex">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search businesses, services…"
              className="h-9 w-full rounded-full border border-border bg-card pl-9 pr-3 text-sm placeholder:text-foreground/40 focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30"
            />
          </div>
        </form>

        {/* Auth / actions */}
        <div className="ml-auto flex items-center gap-2 md:ml-2">
          <ThemeToggle />
          {authLoading ? (
            <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
          ) : authUser ? (
            <UserMenu />
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ name: "login" })}
                className="hidden sm:inline-flex"
              >
                Log in
              </Button>
              <Button
                size="sm"
                onClick={() => navigate({ name: "register" })}
                className="btn-lift bg-ink text-cream shadow-md shadow-ink/20 hover:bg-ink/90 hover:shadow-lg hover:shadow-ink/25"
              >
                Join BlakNet
              </Button>
            </>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] border-border bg-background p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex h-16 items-center border-b border-border px-5">
                <Logo />
              </div>
              <div className="p-4">
                <form onSubmit={submitSearch} className="mb-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                    <input
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      placeholder="Search…"
                      className="h-10 w-full rounded-full border border-border bg-card pl-9 pr-3 text-sm focus:border-sage focus:outline-none"
                    />
                  </div>
                </form>
                <nav className="flex flex-col">
                  {PUBLIC_LINKS.map((l) => (
                    <button
                      key={l.label}
                      type="button"
                      onClick={() => navigate(l.route)}
                      className="flex items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-medium hover:bg-muted"
                    >
                      {l.label}
                      <ChevronDown className="-rotate-90 h-4 w-4 text-foreground/30" />
                    </button>
                  ))}
                </nav>
                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  {authUser ? (
                    <>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => navigate({ name: "dashboard" })}
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-muted-foreground"
                        onClick={async () => {
                          await fetch("/api/auth/logout", { method: "POST" });
                          await useApp.getState().refreshAuth();
                          toast({ title: "Signed out", description: "Come back soon." });
                          navigate({ name: "newsfeed" });
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" /> Sign out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate({ name: "login" })}
                      >
                        Log in
                      </Button>
                      <Button
                        className="w-full bg-ink text-cream hover:bg-ink/90"
                        onClick={() => navigate({ name: "register" })}
                      >
                        Join BlakNet
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function UserMenu() {
  const { authUser, navigate, refreshAuth } = useApp();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  if (!authUser) return null;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-2.5 text-sm font-medium transition-colors hover:border-foreground/30"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-cream">
          {initials(authUser)}
        </span>
        <span className="hidden max-w-[100px] truncate sm:inline">{authUser.firstName}</span>
        <ChevronDown className="h-3.5 w-3.5 text-foreground/50" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">
              {authUser.firstName} {authUser.lastName}
            </p>
            <p className="truncate text-xs text-muted-foreground">{authUser.email}</p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-sage/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sage">
              {authUser.plan} plan
            </span>
          </div>
          <div className="p-1">
            <button
              type="button"
              onMouseDown={() => {
                navigate({ name: "dashboard" });
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
            >
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </button>
            <button
              type="button"
              onMouseDown={() => {
                navigate({ name: "dashboard-notifications" });
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
            >
              <Bell className="h-4 w-4" /> Notifications
            </button>
            <button
              type="button"
              onMouseDown={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                await refreshAuth();
                toast({ title: "Signed out" });
                navigate({ name: "newsfeed" });
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/5"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
