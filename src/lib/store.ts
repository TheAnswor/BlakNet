"use client";

import { create } from "zustand";
import type { AuthUser, Route } from "@/lib/types";

// ---------- hash router ----------
function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, "").trim();
  const parts = clean ? clean.split("/") : [];

  if (parts.length === 0 || parts[0] === "") return { name: "home" };
  const [a, b, c] = parts;

  switch (a) {
    case "directory":
      return { name: "directory" };
    case "business":
      return b ? { name: "business", slug: decodeURIComponent(b) } : { name: "directory" };
    case "newsfeed":
      return { name: "newsfeed" };
    case "events":
      return b ? { name: "event", slug: decodeURIComponent(b) } : { name: "events" };
    case "resources":
      return b ? { name: "resource", slug: decodeURIComponent(b) } : { name: "resources" };
    case "pricing":
      return { name: "pricing" };
    case "about":
      return { name: "about" };
    case "login":
      return { name: "login" };
    case "register":
      return { name: "register" };
    case "forgot":
      return { name: "forgot" };
    case "dashboard":
      if (!b || b === "") return { name: "dashboard" };
      if (b === "businesses") {
        if (!c || c === "") return { name: "dashboard-businesses" };
        if (c === "new") return { name: "dashboard-business-new" };
        return { name: "dashboard-business", id: decodeURIComponent(c) };
      }
      if (b === "network") return { name: "dashboard-network" };
      if (b === "following") return { name: "dashboard-following" };
      if (b === "newsfeed") return { name: "dashboard-newsfeed" };
      if (b === "events") return { name: "dashboard-events" };
      if (b === "resources") return { name: "dashboard-resources" };
      if (b === "notifications") return { name: "dashboard-notifications" };
      if (b === "plan") return { name: "dashboard-plan" };
      if (b === "settings") return { name: "dashboard-settings" };
      if (b === "help") return { name: "dashboard-help" };
      return { name: "dashboard" };
    case "admin":
      if (b === "verification") return { name: "admin-verification" };
      if (b === "users") return { name: "admin-users" };
      if (b === "businesses") return { name: "admin-businesses" };
      if (b === "reviews") return { name: "admin-reviews" };
      if (b === "subscriptions") return { name: "admin-subscriptions" };
      if (b === "industries") return { name: "admin-industries" };
      if (b === "events") return { name: "admin-events" };
      if (b === "newsfeed") return { name: "admin-newsfeed" };
      if (b === "resources") return { name: "admin-resources" };
      return { name: "admin" };
    default:
      return { name: "home" };
  }
}

export function routeToHash(route: Route): string {
  switch (route.name) {
    case "home":
      return "#/";
    case "business":
      return `#/business/${encodeURIComponent(route.slug)}`;
    case "event":
      return `#/events/${encodeURIComponent(route.slug)}`;
    case "resource":
      return `#/resources/${encodeURIComponent(route.slug)}`;
    case "dashboard-business":
      return `#/dashboard/businesses/${encodeURIComponent(route.id)}`;
    case "dashboard-business-new":
      return `#/dashboard/businesses/new`;
    default:
      return `#/${route.name.replace(/^dashboard-/, "dashboard/").replace(/^admin-/, "admin/")}`;
  }
}

interface AppState {
  route: Route;
  authUser: AuthUser | null;
  authLoading: boolean;
  mobileNavOpen: boolean;
  setRoute: (r: Route) => void;
  navigate: (r: Route) => void;
  setAuthUser: (u: AuthUser | null) => void;
  setAuthLoading: (b: boolean) => void;
  setMobileNavOpen: (b: boolean) => void;
  refreshAuth: () => Promise<void>;
}

export const useApp = create<AppState>((set, get) => ({
  route: parseHash(typeof window !== "undefined" ? window.location.hash : ""),
  authUser: null,
  authLoading: true,
  mobileNavOpen: false,
  setRoute: (r) => set({ route: r }),
  navigate: (r) => {
    if (typeof window !== "undefined") {
      window.location.hash = routeToHash(r).replace(/^#/, "");
    }
    set({ route: r, mobileNavOpen: false });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  },
  setAuthUser: (u) => set({ authUser: u }),
  setAuthLoading: (b) => set({ authLoading: b }),
  setMobileNavOpen: (b) => set({ mobileNavOpen: b }),
  refreshAuth: async () => {
    set({ authLoading: true });
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) {
        set({ authUser: null, authLoading: false });
        return;
      }
      const data = await res.json();
      set({ authUser: data.user ?? null, authLoading: false });
    } catch {
      set({ authUser: null, authLoading: false });
    }
  },
}));

// hook up hash listener (client only)
if (typeof window !== "undefined") {
  const apply = () => {
    const r = parseHash(window.location.hash);
    const cur = useApp.getState().route;
    if (JSON.stringify(cur) !== JSON.stringify(r)) {
      useApp.getState().setRoute(r);
      window.scrollTo({ top: 0 });
    }
  };
  window.addEventListener("hashchange", apply);
  // initial
  if (!window.location.hash) window.location.hash = "/";
}
