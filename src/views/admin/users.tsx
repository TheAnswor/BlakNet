"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { api, qs } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Pill } from "@/components/blaknet/badges";
import { EmptyState } from "@/components/blaknet/section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, initials, formatNumber } from "@/lib/format";
import type { Plan, Role } from "@/lib/types";
import {
  Users as UsersIcon,
  Search,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Building2,
  Mail,
} from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  plan: Plan;
  phone: string | null;
  createdAt: string;
  businessCount: number;
}

interface UsersResponse {
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  items: AdminUser[];
}

interface Filters {
  q: string;
  role: "" | Role;
  page: number;
}

type LoadState =
  | { kind: "loading" }
  | { kind: "forbidden" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: UsersResponse };

const PAGE_SIZE = 20;

function roleTone(role: Role): "ink" | "sage" | "cream" | "neutral" {
  if (role === "SUPER_ADMIN") return "ink";
  if (role === "ADMIN") return "sage";
  if (role === "BUSINESS_OWNER") return "cream";
  return "neutral";
}

function roleLabel(role: Role): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super admin";
    case "ADMIN":
      return "Admin";
    case "BUSINESS_OWNER":
      return "Business owner";
    default:
      return "Member";
  }
}

function planTone(plan: Plan): "ink" | "sage" | "cream" | "neutral" {
  switch (plan) {
    case "INTELLIGENCE":
      return "ink";
    case "VERIFIED":
      return "sage";
    case "STARTER":
      return "neutral";
    default:
      return "neutral";
  }
}

function planLabel(plan: Plan): string {
  switch (plan) {
    case "INTELLIGENCE":
      return "Intelligence";
    case "VERIFIED":
      return "Verified";
    case "STARTER":
      return "Starter";
    default:
      return plan;
  }
}

export function AdminUsersView() {
  const { navigate } = useApp();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [filters, setFilters] = useState<Filters>({ q: "", role: "", page: 1 });
  const [qInput, setQInput] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const path = `/api/admin/users${qs({
          q: filters.q,
          role: filters.role,
          page: filters.page,
          pageSize: PAGE_SIZE,
        })}`;
        const data = await api<UsersResponse>(path);
        if (!cancelled) setState({ kind: "ready", data });
      } catch (err) {
        if (cancelled) return;
        const e = err as Error & { status?: number };
        if (e.status === 403) setState({ kind: "forbidden" });
        else setState({ kind: "error", message: e.message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filters, reloadKey]);

  const onSearchChange = (value: string) => {
    setQInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters((f) => ({ ...f, q: value, page: 1 }));
    }, 300);
  };

  const onRoleChange = (value: string) => {
    const role = (value === "all" ? "" : value) as Filters["role"];
    setFilters((f) => ({ ...f, role, page: 1 }));
  };

  const goToPage = (p: number) => {
    setFilters((f) => ({ ...f, page: Math.max(1, p) }));
  };

  if (state.kind === "loading") {
    return <UsersSkeleton />;
  }
  if (state.kind === "forbidden") {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Admin access required."
        description="You need an admin account to manage users."
        action={
          <Button
            onClick={() => navigate({ name: "dashboard" })}
            className="bg-ink text-cream hover:bg-ink/90"
          >
            <ArrowRight className="mr-1.5 h-4 w-4" /> Back to dashboard
          </Button>
        }
      />
    );
  }
  if (state.kind === "error") {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load users."
        description={state.message}
        action={
          <Button
            variant="outline"
            onClick={() => {
              setState({ kind: "loading" });
              setReloadKey((k) => k + 1);
            }}
          >
            Try again
          </Button>
        }
      />
    );
  }

  const { data } = state;
  const items = data.items;
  const start = (data.page - 1) * data.pageSize;
  const end = Math.min(start + items.length, data.total);

  return (
    <div className="space-y-6">
      {/* header */}
      <div>
        <Pill tone="sage" className="mb-2">
          <UsersIcon className="h-3 w-3" /> Members
        </Pill>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Users</h1>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          Manage BlakNet members, roles and plans.
        </p>
      </div>

      {/* filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={qInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or email…"
            className="pl-9"
          />
        </div>
        <Select value={filters.role || "all"} onValueChange={onRoleChange}>
          <SelectTrigger className="h-9 w-full sm:w-[180px]">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="USER">Members</SelectItem>
            <SelectItem value="BUSINESS_OWNER">Business owners</SelectItem>
            <SelectItem value="ADMIN">Admins</SelectItem>
            <SelectItem value="SUPER_ADMIN">Super admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">
        {data.total === 0
          ? "No users found."
          : `Showing ${start + 1}–${end} of ${formatNumber(data.total)} users`}
      </p>

      {/* table (sm+) */}
      {items.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No users found."
          description="Try adjusting your search or filters."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-border bg-card sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium">Businesses</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((u, i) => (
                  <UserRow key={u.id} user={u} delayMs={i * 40} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 sm:hidden">
            {items.map((u, i) => (
              <UserCard key={u.id} user={u} delayMs={i * 40} />
            ))}
          </div>

          {/* pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                Page {data.page} of {data.pages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(data.page - 1)}
                  disabled={data.page <= 1}
                >
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(data.page + 1)}
                  disabled={data.page >= data.pages}
                >
                  Next <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function UserRow({ user, delayMs }: { user: AdminUser; delayMs: number }) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email.split("@")[0];
  return (
    <tr className="animate-fade-in-up hover:bg-muted/30" style={{ animationDelay: `${delayMs}ms` }}>
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-ink text-[11px] font-semibold text-cream">
              {initials(user)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3">
        <Pill tone={roleTone(user.role)}>{roleLabel(user.role)}</Pill>
      </td>
      <td className="px-5 py-3">
        <Pill tone={planTone(user.plan)}>{planLabel(user.plan)}</Pill>
      </td>
      <td className="px-5 py-3">
        {user.businessCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-foreground/80">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            {user.businessCount}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-5 py-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
    </tr>
  );
}

function UserCard({ user, delayMs }: { user: AdminUser; delayMs: number }) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email.split("@")[0];
  return (
    <div
      className="animate-fade-in-up rounded-xl border border-border bg-card p-4"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-ink text-xs font-semibold text-cream">
            {initials(user)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{name}</p>
          <p className="truncate text-xs text-muted-foreground">
            <Mail className="mr-1 inline h-3 w-3" />
            {user.email}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Pill tone={roleTone(user.role)}>{roleLabel(user.role)}</Pill>
        <Pill tone={planTone(user.plan)}>{planLabel(user.plan)}</Pill>
        {user.businessCount > 0 && (
          <Pill tone="neutral">
            <Building2 className="h-3 w-3" /> {user.businessCount}{" "}
            {user.businessCount === 1 ? "business" : "businesses"}
          </Pill>
        )}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Joined {formatDate(user.createdAt)}</p>
    </div>
  );
}

function UsersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-9 w-40 rounded-md" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 flex-1 rounded-md" />
        <Skeleton className="h-9 w-[180px] rounded-md" />
      </div>
      <Skeleton className="h-4 w-48 rounded-md" />
      <div className="overflow-hidden rounded-xl border border-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-0">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-40 rounded-md" />
              <Skeleton className="h-3 w-60 rounded-md" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
