// BlakNet formatting helpers

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function fullName(u: { firstName: string | null; lastName: string | null; email: string } | null | undefined) {
  if (!u) return "";
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return name || u.email.split("@")[0];
}

export function initials(u: { firstName: string | null; lastName: string | null; email: string } | null | undefined) {
  if (!u) return "?";
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return u.email[0]?.toUpperCase() ?? "?";
}

export function timeAgo(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk}w ago`;
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-ZA", opts ?? { day: "numeric", month: "long", year: "numeric" });
}

export function formatDateTime(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-ZA").format(n);
}

export function shortDate(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-ZA", { day: "2-digit", month: "short" });
}

export function monthDay(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return {
    day: d.toLocaleDateString("en-ZA", { day: "2-digit" }),
    month: d.toLocaleDateString("en-ZA", { month: "short" }).toUpperCase(),
  };
}

export function starRow(rating: number) {
  const full = Math.round(rating);
  return Array.from({ length: 5 }, (_, i) => (i < full ? "★" : "☆")).join("");
}

export function provinceCity(b: { province: string | null; city: string | null }) {
  return [b.city, b.province].filter(Boolean).join(", ") || "South Africa";
}

export function verificationLabel(status: string) {
  switch (status) {
    case "VERIFIED":
      return "Verified";
    case "PENDING":
      return "Verification pending";
    case "REJECTED":
      return "Verification rejected";
    default:
      return "Not verified";
  }
}
