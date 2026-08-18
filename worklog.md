# BlakNet — Build Worklog

## Project Overview
BlakNet is a modern South African business ecosystem for Black-owned businesses.
Tagline: **Built for Black Business. Built for Opportunity.**
Journey: Get Exposed → Get Connected → Get Ready.

## Architecture Decisions
- **Framework**: Next.js 16 App Router (only `/` route is user-visible per sandbox rules).
- **Routing**: Single-page app at `/` with a custom **hash-based client-side router** so users can navigate Home / Directory / Business Profile / Newsfeed / Events / Resources / Pricing / About / Login / Register / Dashboard / Admin — all without extra Next.js page files.
- **Database**: Prisma + SQLite (the environment provides Prisma, NOT Supabase). The spec's Supabase schema is adapted to Prisma models.
- **Auth**: Lightweight session-based auth (HTTP-only cookie + bcrypt-style password hashing via Node crypto). Real users table in Prisma. Demo login available.
- **Data fetching**: TanStack Query for server state, Zustand for client state (current view, auth user, route params).
- **Backend**: API routes under `src/app/api/*` (no server actions).

## Brand Design System
Palette (from user):
- `#1D2534` — deep navy / "ink" (primary dark, text, primary buttons)
- `#F6F6DF` — warm cream (background, light surfaces)
- `#717568` — muted olive / "sage" (secondary accent, highlights, badges)

Design principles (from moodboard): minimal, neutral, sleek, premium SaaS.
- Strong typography: Geist Sans (body) + Instrument Serif (display headings).
- Generous whitespace, clean cards, subtle layering, consistent radius.
- NO indigo/blue, NO excessive gradients, NO Bootstrap look.

CSS tokens are defined in `src/app/globals.css`:
- `--ink` / `--cream` / `--sage` brand vars + full light/dark shadcn token mapping.

## Build Phases (per spec)
- Phase 1: Core platform (auth, public site, directory, profiles, business creation, dashboard shell, search, responsive UI) — IN PROGRESS
- Phase 2: Community (newsfeed, events, network/CRM, notifications)
- Phase 3: Trust & monetisation (verification, reviews, subscriptions, Yoco)
- Phase 4: Intelligence (later)

---
Task ID: 1
Agent: Z.ai Code (main)
Task: Set up design foundation (brand palette, fonts, layout metadata, theme).

Work Log:
- Analyzed moodboard via VLM CLI — extracted premium/minimal/neutral direction (layering, whitespace, restrained color).
- Defined BlakNet brand tokens in globals.css: ink #1D2534, cream #F6F6DF, sage #717568 + derived neutrals, full light & dark shadcn variable mapping, radius, fonts.
- Updated layout.tsx: Geist Sans + Instrument Serif (display) via next/font, BlakNet metadata (title/description/OG), brand favicon note.

Stage Summary:
- Design system foundation ready. Next: Prisma schema + seed, then shared components & views.

---
Task ID: 4-api-rest
Agent: general-purpose (Z.ai Code sub-agent)
Task: Build remaining BlakNet API routes (posts, events, resources, contacts, notifications, subscriptions, dashboard, admin, verification).

Work Log:
- Read prior worklog + prisma schema + lib/auth, lib/db, lib/types, existing businesses route conventions (params: Promise<{...}>, await params, NextResponse.json, getSessionUser auth pattern).
- Created 17 route files under src/app/api/:
  1. posts/route.ts (GET list w/ author/business/_count take 30 newest; POST create w/ ownership check on businessId)
  2. posts/[id]/like/route.ts (POST toggle via postId_userId unique)
  3. posts/[id]/comments/route.ts (GET oldest first w/ user; POST auth create)
  4. events/route.ts (GET list w/ category + upcoming filters, _count attendees, ordered by startDate asc)
  5. events/[slug]/route.ts (GET single w/ _count attendees + registered boolean for authed user)
  6. events/[slug]/register/route.ts (POST toggle attendance via eventId_userId unique, status REGISTERED)
  7. resources/route.ts (GET published only, category/type/featured filters, ordered by createdAt desc)
  8. resources/[slug]/route.ts (GET single by slug)
  9. contacts/route.ts (GET list user's contacts newest; POST create with name required)
  10. contacts/[id]/route.ts (PATCH partial update w/ ownership 403; DELETE w/ ownership 403)
  11. notifications/route.ts (GET user's notifications newest, take 30)
  12. notifications/read/route.ts (POST mark one {id} w/ ownership check, else mark all unread)
  13. subscriptions/route.ts (GET current user's subscription or null)
  14. dashboard/stats/route.ts (GET aggregated summary: businesses, pendingVerifications, contacts, upcomingEvents, savedEvents, unreadNotifications, recentNotifications[5], recentContacts[3], plan, planStatus)
  15. admin/overview/route.ts (GET admin-only counts + 8 newest users)
  16. admin/verification/route.ts (GET pending requests w/ business+user; PATCH {id, status, adminNotes} — APPROVED sets business.verificationStatus=VERIFIED, REJECTED sets REJECTED, reviewedAt=now)
  17. verification/route.ts (POST auth: verify business.ownerId === user.id else 403, create PENDING request, set business.verificationStatus=PENDING)
- Intentionally skipped: reviews/route.ts (per spec).
- Conventions followed: Next.js 16 Promise params + await; NextResponse.json on every response; getSessionUser for auth; 401/403/404/400 status codes; no passwordHash/token/other-user CRM exposure; tags stay as comma-separated strings.
- Lint result: `bun run lint` → 0 errors, 1 unrelated warning (prisma/seed.ts unused eslint-disable). My new files: 0 errors, 0 warnings. `tsc --noEmit` → 0 errors in my new files (errors only in examples/ and skills/ which are not mine).

Stage Summary:
- Full BlakNet REST API surface (community + CRM + notifications + subscriptions + dashboard + admin + verification) now implemented and type-clean.
- Next: wire these endpoints into the dashboard/admin/CRM UI views (Phase 2–3 frontend integration), and add Yoco webhook for subscription activation.

---
Task ID: 12-13-views
Agent: general-purpose (Z.ai Code sub-agent)
Task: Build Pricing + About + Auth views (premium minimal neutral, brand-aligned).

Work Log:
- Read worklog + lib/store, lib/api, lib/constants (PLANS/STATS), lib/types, components/blaknet/{section,badges,logo}, ui/{button,card,label,input,checkbox,accordion,separator}, views/public/home (style reference), app/page.tsx. Confirmed dev server healthy (HTTP 200 on /).
- Created `src/views/public/pricing.tsx` → `PricingView`:
  * Header `bg-cream-grain` with centered SectionHeading (eyebrow "Pricing", title "Plans that grow with your business.", description per spec) + sage "Free forever plan · No card required" Pill.
  * 3 plan cards (`PLANS` map) in `grid gap-6 lg:grid-cols-3 max-w-6xl mx-auto lg:items-stretch`. Highlighted Verified card uses `bg-ink text-cream ring-2 ring-sage shadow-xl lg:scale-[1.03]`, with a top-centered "Most popular" cream Pill. Non-highlighted cards use `border border-border bg-card`.
  * Each card: name (font-display), tagline, price (font-display text-4xl) + cadence muted, CTA button (highlighted uses `bg-cream text-ink`, others `bg-ink text-cream`). CTA logic: unauthed → navigate register; authed STARTER plan + current user STARTER → "Current plan" disabled; authed otherwise → toast "Upgrade flow coming soon — Yoco integration in progress".
  * Features list: Check (sage) if included, X (muted) if not + label, with optional badge Pill on right (tone=sage on dark card, neutral on light).
  * "Compare in detail" Accordion with 3 FAQ items (cancel anytime, what is verification, Yoco support).
  * Enterprise band: card with Building2 icon, "Need enterprise or API access? Talk to us." + outline "Talk to us" button (toasts contact email).
- Created `src/views/public/about.tsx` → `AboutView`:
  * Hero `bg-ink-grain text-cream`: eyebrow "About BlakNet", title "The digital infrastructure for Black-owned business.", subtitle, manifesto "Get Exposed. Get Connected. Get Ready." italic sage. Cream CTA "Join BlakNet" + outline "Explore businesses". Decorative LogoMark.
  * "Our why" section (cream-grain): two columns — left editorial paragraph + "Visibility isn't enough." heading + sage "Built for South Africa · Mobile-first" Pill; right grid of 4 principle cards (Confidence=ShieldCheck, Opportunity=Target, Community=Heart, Trust=Handshake) each with icon tile + title + body.
  * "The journey" section: 7-step horizontal stepper (Get Exposed → Get Connected → Get Informed → Get Compliant → Get Project-Ready → Get Funding-Ready → Get Opportunities) as connected numbered nodes (horizontal line on lg, vertical stack on mobile).
  * Stats band (reuse STATS) on `bg-ink-grain`.
  * "Built mobile-first for South African entrepreneurs" section: centered SectionHeading + grid of 6 platform pillars (Directory, Verification, Newsfeed, Events, Network CRM, Resources) each icon + 1 line.
  * Final CTA: "Join the network." with Join BlakNet + Explore businesses buttons in a dark rounded panel.
- Created `src/views/public/auth.tsx` → `LoginView`, `RegisterView`, `ForgotView`:
  * Shared `AuthLayout`: split-screen — left dark `bg-ink-grain text-cream` brand panel (desktop only via `hidden lg:flex`) with Logo, manifesto heading + sage italic line, and 3 TrustBullets (ShieldCheck, Network, Rocket). Right panel: form on `bg-background`, full-width on mobile with a small Logo on top.
  * `LoginView`: email + password (PasswordInput with eye toggle), "Forgot password?" link → navigate forgot, "Don't have an account? Join BlakNet" → register. Submit POST `/api/auth/login` `{ email, password }`; on success `refreshAuth()` + `navigate({name:"dashboard"})`; on error toast (destructive) with message + keep fields. "Use demo account" button POSTs `/api/auth/demo` then refreshAuth + navigate dashboard. Loading state on both buttons ("Signing in…" / "Loading demo…").
  * `RegisterView`: firstName + lastName (2-col), email, password (PasswordInput), Checkbox "I agree to the Terms & Privacy" (required). Submit POST `/api/auth/register` `{ firstName, lastName, email, password }`; on success refreshAuth + navigate dashboard; on error toast. "Already have an account? Log in" → login. Loading state.
  * `ForgotView`: email + "Send reset link" button. Simulated send (setTimeout 700ms) → toast "Password reset link sent (demo) — check your inbox." + clear field. "Remembered it? Back to log in" → login.
  * Client-side validation: email regex, password >= 6 chars, required fields, agree checkbox. Inline error text under each field via `FieldError` component. `aria-invalid` on inputs. Forms use `noValidate` + `onSubmit preventDefault`.
- Wired all 3 view files into `src/app/page.tsx`: added imports for PricingView, AboutView, and auth views; split `PUBLIC_ROUTES` (header/footer routes) from `AUTH_ROUTES` (login/register/forgot — standalone split-screen, no public chrome); added route render branches for pricing/about/login/register/forgot. Preserved pre-existing authed-redirect effect (login/register → dashboard if user already logged in).
- Lint result: `bun run lint` → 0 errors, 0 warnings in MY files (pricing.tsx, about.tsx, auth.tsx, page.tsx). Pre-existing errors in other agents' files (directory.tsx, events.tsx, newsfeed.tsx, resource-detail.tsx, resources.tsx, business-profile.tsx — all react-hooks/set-state-in-effect and react-hooks/static-components) are out of scope.
- TypeScript: `bunx tsc --noEmit` → 0 errors in MY files (only pre-existing errors in examples/, skills/, next.config.ts, newsfeed.tsx).
- Dev server: `tail dev.log` → no compile/runtime errors. Final `GET / 200 in 157ms (compile: 36ms, render: 121ms)`. Multiple successful recompiles after file additions.

Stage Summary:
- Pricing + About + Auth (Login/Register/Forgot) views now live, premium minimal neutral design consistent with HomeView.
- All 3 views are wired into the hash router via `src/app/page.tsx` and compile cleanly.
- Auth flow complete: register → POST `/api/auth/register` → refreshAuth → dashboard; login → POST `/api/auth/login` → refreshAuth → dashboard; demo button → POST `/api/auth/demo` → dashboard; forgot → simulated MVP toast.
- Pricing CTAs: unauthed → register; authed Starter & current → "Current plan" disabled; authed upgrade → Yoco-coming-soon toast (pending Phase 3 Yoco integration).
- Next: wire dashboard views (Phase 2 community UI), Yoco subscription activation (Phase 3), and the directory/newsfeed/events/resources views already in progress by other agents.

---
Task ID: 7-8-views
Agent: general-purpose (Z.ai Code sub-agent)
Task: Build Directory + Business Profile public views.

Work Log:
- Read prior worklog + store (hash router), api (api/qs helpers), types (Business/BusinessReview/Industry/Routes), format helpers, constants (PROVINCES/BUSINESS_SIZES/BBBEE_LEVELS), existing blaknet components (BusinessCard+Skeleton, badges, StarRating, SectionHeading/EmptyState), shadcn/ui (Sheet/Select/Checkbox/Switch/Progress/Separator/Skeleton/Input/Textarea/Button), useToast hook, and the GET /api/businesses, GET /api/businesses/[slug], GET /api/businesses/[slug]/reviews, GET /api/businesses/[slug]/view, GET /api/industries route shapes.
- Created `src/views/public/directory.tsx` exporting `DirectoryView`:
  * Full-width cream-grain header band with SectionHeading + result count pills (total businesses / provinces / industries).
  * Two-column layout lg+: sticky left filter sidebar (~280px, `scroll-elegant`) + right results column. Mobile: filters in a left-side Sheet triggered by a "Filters" button with active-count badge.
  * Prominent search bar at top of results — reads `sessionStorage.getItem("blaknet:directory-search")` via lazy useState initializer (also clears it) so it pre-fills BOTH the input and the live `q` filter on mount, then debounces live typing → `filters.q` (300ms setTimeout).
  * Filters: Industry (fetched from /api/industries w/ count badges), Province (PROVINCES), Business Size (BUSINESS_SIZES value→label), B-BBEE Level (BBBEE_LEVELS), and a "Verified only" Switch. Each section uses an uppercase eyebrow heading + a "Clear all" button when filters active.
  * Sort: Select (Relevance/Newest/Most viewed/Verified first). Default `relevance`.
  * Results grid `grid gap-5 sm:grid-cols-2 xl:grid-cols-3` of BusinessCard with `onNavigate={(slug)=>navigate({name:"business",slug})}`. 6 BusinessCardSkeleton on loading. EmptyState (Frown) with Clear-filters button on empty.
  * Pagination Prev/Next + "Page X of Y" + "Showing 1–12 of N" header line. pageSize=12.
  * Active-filter chip row above results (removable pills for q, each industry, province, size, bbbee, verified).
  * State mgmt: single `filters={q,industry,province,size,bbbee,verified}` object + `sort` + `page`. Page reset moved OUT of effects and into the debounce timeout callback + each filter/sort change handler (avoids the `react-hooks/set-state-in-effect` rule). Fetch effect uses a single eslint-disable for `setLoading(true)`.
- Created `src/views/public/business-profile.tsx` exporting `BusinessProfileView`:
  * Wrapper reads `route` from store, early-returns null if `route.name !== "business"`, then delegates to a `BusinessProfile` child with `key={slug}` so all internal state cleanly remounts on slug change (no rules-of-hooks violations).
  * Fetches GET /api/businesses/[slug] → `{ business }`. 404 → EmptyState (Frown) with "Back to directory" button. On success fires POST /api/businesses/[slug]/view fire-and-forget.
  * Header band: `bg-ink-grain text-cream` with logo (or initial fallback), font-display name, tagline, badge row (VerifiedBadge if verified/pending, BBBEEBadge, Featured Pill, Industry pill, Location pill w/ MapPin), and CTA buttons (Website → external link, Email → mailto, WhatsApp → wa.me/<digits>, Share → navigator.share || clipboard).
  * Profile completion bar (owner-only): cream-grain band with Progress bar + "Edit business" button → `navigate({name:"dashboard-business", id})`.
  * Body: lg two-column (main 2fr + sticky sidebar 1fr).
  * Main cards (border border-border bg-card rounded-xl p-6): About (multi-paragraph split), Services (Pill tags → navigate to directory w/ service as q via sessionStorage), Products (Pill tone=sage), Reviews (rating summary + inline form + review list up to 12). Inline review form: rating Select 1-5 + Textarea + optional company Input + submit. POSTs to /api/businesses/[slug]/reviews and prepends new review locally. Errors handled via try/catch + useToast.
  * Sidebar (sticky top-24): Business Information (definition list, hides null rows), Contact (website/email/phone/address links + WhatsApp button), Trust Signals (VerifiedBadge, BBBEEBadge, years in business, profile views, review count).
  * Loading skeleton: full layout with pulse blocks (header band + 3 main cards + 2 sidebar cards).
- Lint: `bunx eslint src/views/public/directory.tsx src/views/public/business-profile.tsx` → 0 errors, 0 warnings. `bun run lint` overall → 0 errors, 2 pre-existing warnings (business-card.tsx + prisma/seed.ts unused eslint-disable, both not mine).
- TypeScript: `bunx tsc --noEmit` → no errors in my files (pre-existing errors only in examples/, skills/, newsfeed.tsx, resource-detail.tsx, next.config.ts).
- Dev server: `tail -20 dev.log` shows continuous `✓ Compiled in Nms` lines, no compile errors. My view files aren't imported by page.tsx yet (per task constraint to only modify the two view files), so they will be compiled on-demand when wired in by a follow-up agent.

Stage Summary:
- Directory + Business Profile public views are built, type-clean and lint-clean. They reuse the brand tokens, store, api client, format helpers, constants and all existing blaknet/shadcn components per spec. Both handle loading, empty and error (404) states. The views are NOT yet wired into `src/app/page.tsx` (left untouched per task scope) — that wiring is a small follow-up edit: replace the two `ComingSoon` branches for `directory` and `business` routes with `<DirectoryView />` and `<BusinessProfileView />`.

---
Task ID: 9-10-11-views
Agent: general-purpose (Z.ai Code sub-agent)
Task: Build Newsfeed + Events + Resources views (community Phase 2 frontend).

Work Log:
- Read worklog.md, store.ts (hash router), api.ts (api + qs), types.ts (Post/Comment/BlakEvent/Resource/AuthUser), constants.ts (EVENT_CATEGORIES, RESOURCE_CATEGORIES, RESOURCE_TYPES), format.ts (timeAgo, formatDate, monthDay, formatNumber, initials), section.tsx (SectionHeading, EmptyState), badges.tsx (Pill, VerifiedBadge), existing home.tsx + page.tsx for conventions. Confirmed API shapes from posts/events/resources routes.
- Created 5 view files under src/views/public/:
  1. newsfeed.tsx (NewsfeedView) — cream-grain header with SectionHeading "The Hustle Feed" / "Where Black businesses connect."; auth-aware composer (Textarea + Text/Announcement/Opportunity toggles + optional title Input, POST /api/posts then prepend); post cards with author avatar (initials in bg-ink text-cream circle), author name, time-ago, post-type Pill (sage for announcement, ink for opportunity, cream for image, neutral otherwise), business link → navigate({name:"business",slug}); whitespace-pre-wrap content; image block; footer with like (Heart filled when liked, optimistic toggle via POST /api/posts/:id/like), comment button (expandable inline thread; GET /api/posts/:id/comments, inline input POSTS new comment and prepends), share button (navigator.clipboard + toast); unauthed inline "Log in" prompt for like/comment; loading Skeletons; EmptyState (Newspaper, "No posts yet") with conditional CTA (scroll to composer if authed else navigate to login); lg-only right sidebar with Trending types chips (All/Text/Announcement/Opportunity, client-side filter) + Community guidelines card.
  2. events.tsx (EventsView) — cream-grain header; horizontal scrollable category filter row (All + EVENT_CATEGORIES), refetches via ?category=value on toggle, "All" clears; responsive grid (sm:2 lg:3) of card-lift buttons → navigate({name:"event",slug}); card top 16/9 image area (renders img if imageUrl is SVG data-uri, else bg-ink-grain block with category-specific icon + month/day badge in corner via monthDay(startDate)); sage Pill category, font-display title line-clamp-2, description line-clamp-2, meta row (Calendar short date, MapPin location or Video "Online" if isOnline, Users attendee count); pulse Skeletons; EmptyState (Frown, "No upcoming events match your filters.") with Clear filters action.
  3. event-detail.tsx (EventDetailView) — reads slug from route.name==="event"; 404 → EmptyState "Event not found"; ink-grain hero with back link, sage category Pill, font-display title 3xl-5xl, meta row (date, time, online/location, attendees); CTA buttons Register / I'm interested (toggle via POST /api/events/:slug/register, optimistic attendee count + toast, unauthed → toast + navigate login); optional "Register on organiser site" external link button; Share; two-column body with full description (whitespace-pre-wrap) on left and sticky details card on right (Date/Time/Location-or-Online-link/Capacity/Attendees via DetailRow definition list).
  4. resources.tsx (ResourcesView) — cream-grain header; left sticky sidebar (lg) with category checkboxes (RESOURCE_CATEGORIES), type checkboxes (RESOURCE_TYPES), Featured-only toggle, active-count badge, Clear-all button; on mobile, collapsible disclosure panel using Collapsible; responsive grid (sm:2 lg:3) of card-lift buttons → navigate({name:"resource",slug}); card top 16/7 tinted band bg-ink-grain with type-specific icon (article→FileText, guide→BookOpen, template→Download, checklist→CheckCircle2, video→PlayCircle, workshop→Users) + Featured badge; sage Pill type + neutral Pill category, font-display title, description line-clamp-2, footer with author + readMinutes + "Read →". Filters are client-side (single fetch, useMemo).
  5. resource-detail.tsx (ResourceDetailView) — reads slug from route.name==="resource"; 404 → EmptyState; Breadcrumb (Home / Resources / title) in cream-grain band; two-column with full content (max-w-prose, whitespace-pre-wrap) on left and "About this resource" sidebar card on right (Type, Category, Author, Read time, Published date via DetailRow), "Back to resources" + "Share" buttons (navigator.clipboard + toast), plus a small "Looking for more?" CTA card linking back to resources.
- Wired all 5 views into src/app/page.tsx (added imports + route branches for newsfeed/events/event/resources/resource; updated ComingSoon fallback clause to exclude them).
- Lint fixes:
  • Replaced `const Icon = typeIcon(...)` + `<Icon />` (triggered react-hooks/static-components) with static switch-style helper components `TypeIcon` and `CategoryIcon` declared at module level (lookup table + render).
  • Removed `react-hooks/set-state-in-effect` violations by replacing `load = useCallback(() => { setLoading(true); ... })` + `useEffect(() => load(), [load])` with inline async IIFE in useEffect (cancelled flag pattern) + `reloadKey`/`reload` button handler for retries.
  • Removed unused `// eslint-disable-next-line @next/next/no-img-element` comments (rule is OFF in eslint.config.mjs — see `@next/next/no-img-element: "off"`).
  • Removed unused `useRef` import in newsfeed.tsx (composer scroll handled via document.getElementById("composer") + scrollIntoView).
  • Removed unused `useCallback` and `formatDateTime` imports in event-detail.tsx; unused `formatDate` import in resources.tsx.
  • Added `AvatarUser` interface in newsfeed.tsx and spread `c.user` with placeholder email when passing Comment.user to Avatar (Comment.user shape lacks email).
- Lint result: `bun run lint` → 0 errors, 2 warnings (both pre-existing in prisma/seed.ts and components/blaknet/business-card.tsx — not my files). tsc --noEmit on my view files: 0 errors.
- Dev server confirmation (dev.log): `GET /` 200; live API calls rendered from the views — `GET /api/posts 200`, `GET /api/events 200`, `GET /api/resources 200`, Prisma queries logged; all compiles successful (no compile/runtime errors).

Stage Summary:
- Newsfeed + Events + Resources Phase 2 community views are live and reachable from the public site via hash routes (#/newsfeed, #/events, #/events/:slug, #/resources, #/resources/:slug). Each view has loading skeletons, empty/error states, is fully responsive, and reuses the BlakNet brand system (ink/cream/sage, font-display, card-lift, Pill, SectionHeading, EmptyState). Wired into page.tsx so they no longer show the "Coming next" placeholder. Next: build dashboard equivalents (dashboard-newsfeed / dashboard-events / dashboard-resources), real-time notifications integration, and Yoco subscription webhook.

---
Task ID: 17-views
Agent: general-purpose (Z.ai Code sub-agent)
Task: Build Admin shell + overview + verification views.

Work Log:
- Read prior worklog + dashboard/shell.tsx (pattern to mirror), views/dashboard/overview.tsx (style reference), lib/types.ts (Route, AuthUser, VerificationStatus), lib/api.ts (api<T> GET + PATCH with json), lib/store.ts (hash router + refreshAuth via useApp.getState()), lib/format.ts (initials, timeAgo), components/blaknet/{logo,badges,section}, components/ui/{button,card,dialog,sheet,textarea,skeleton,avatar,separator,badge}, hooks/use-toast.ts, app/api/admin/{overview,verification}/route.ts (verified exact response shapes), prisma/schema.prisma VerificationRequest model (verificationType is lowercase cipc|bbbee|tax|certification), app/page.tsx (isAdmin currently routes to ComingSoon). Confirmed dev server healthy.
- Created 3 files:
  1. `src/components/admin/shell.tsx` → `AdminShell`:
     * Mirrors DashboardShell pattern: sticky dark `bg-ink text-cream` sidebar (w-64 lg, left Sheet on mobile) with LogoMark + BlakNet wordmark; "Admin Console" sage eyebrow; NAV array (Overview → admin, Verification → admin-verification, active highlighted with `bg-sage/15 text-cream` + sage icon); COMING_SOON array (Users, Businesses, Industries, Events, Newsfeed, Resources, Reviews, Subscriptions, Reports, Settings) rendered muted `text-cream/30 cursor-not-allowed` with a small "Soon" cream pill.
     * Sidebar footer: avatar (initials, sage circle) + admin user name + "Administrator" subtitle + uppercase sage "Admin" tag pill.
     * Topbar: mobile Sheet trigger (Menu), breadcrumb "Admin / <current>" (currentLabel derived from route), ml-auto "Back to dashboard" outline button (→ navigate dashboard, hidden on mobile) + "Sign out" ghost button (POST /api/auth/logout → refreshAuth → navigate home, same pattern as DashboardShell).
     * Guards: while `authLoading`, a centered ink spinner; if `authUser?.role !== "ADMIN"`, renders EmptyState (Shield, "Admin access required.") with "Back to dashboard" button — per spec double-check.
  2. `src/views/admin/overview.tsx` → `AdminOverviewView`:
     * Fetches GET /api/admin/overview into a discriminated LoadState (loading | forbidden (403) | error | ready). Inline async IIFE in useEffect with cancelled-flag pattern (no set-state-in-effect violations).
     * Header: `bg-ink-grain text-cream` hero with Sparkles decoration, sage "Admin" Pill, font-display "Platform overview." title, cream/70 subtitle.
     * Stat grid (sm:2 lg:3) of 6 cards: Total users (Users), Total businesses (Building2), Verified businesses (ShieldCheck, accent sage tile + sage "verified" eyebrow), Pending verifications (Clock, sage tile when value>0 + sage "review" eyebrow), Active subscriptions (CreditCard), Newsfeed posts (Newspaper). Each: icon tile (sage when accent/warn else ink/cream), big font-display number, label, muted subtitle.
     * Pending-verifications callout (lg:col-span-2): when pending>0 a sage-bordered `bg-sage/5` card with Clock tile + "{N} businesses awaiting verification" + "Review queue" ink button → navigate admin-verification; else a CheckCircle2 "All caught up." card.
     * Events mini-card on the right: Calendar tile + count + "All events" Pill.
     * Recent registrations card: divide-y list of up to 8 newest users (Avatar with ink/cream initials, name, email, time-ago) — uses `initials(u)` helper directly since recentRegistrations shape matches.
     * Skeleton state: hero + 6 stat tiles + callout + list pulse blocks.
     * Forbidden → EmptyState (ShieldCheck) with Back-to-dashboard; Error → EmptyState (AlertCircle) with Try again (window.location.reload).
  3. `src/views/admin/verification.tsx` → `AdminVerificationView`:
     * Fetches GET /api/admin/verification into the same LoadState pattern + `reloadKey` for retries (Try again button in error state sets state to loading + bumps reloadKey — both in event-handler scope, effect re-runs IIFE without synchronous setState).
     * Header: sage "Verification" Pill + font-display "Verification Queue" + subtitle. Right-side stats strip card: Clock + big count + "{pending}" label.
     * Empty state: EmptyState (CheckCircle2, "No pending verifications.", "All businesses are verified or rejected. Great work.").
     * Pending list of `VerificationCard`s — each card: business logo (img or initial tile, clickable → navigate business profile by slug, with ArrowRight hover animation), business name + type pill (typePill() maps lowercase cipc/bbbee/tax/certification → CIPC/B-BBEE/Tax/Certification with ink/sage/cream/neutral tones, fallback neutral with raw string), "Submitted {timeAgo}" with Clock; requester Avatar (initials) + name + email; optional notes block (muted/40 bg); optional "View submitted document" external link (FileText icon). Right-side action buttons stacked on sm+: "Approve" (sage bg, ink text, CheckCircle2), "Reject" (destructive outline, XCircle), "Request info" (ghost, Mail).
     * Confirm Dialog: title verb depends on status, description references business name + consequence note; Textarea for optional adminNotes (placeholder context-aware); footer Cancel (ghost) + action button (color-coded: sage for approve, destructive for reject, ink for info-request). Submit handler PATCH /api/admin/verification with { id, status, adminNotes } → on success: toast success + remove item from local state (optimistic) + close dialog; on error: toast destructive with message. Submitting flag disables Cancel + action button (shows "Saving…").
     * QueueSkeleton: header strip + 3 card pulse blocks.
- Wired into `src/app/page.tsx`: imported AdminShell, AdminOverviewView, AdminVerificationView; replaced the placeholder ComingSoon branch for `isAdmin` with `<AdminShell>{route.name==="admin" && <AdminOverviewView />}{route.name==="admin-verification" && <AdminVerificationView />}</AdminShell>`. Preserved all other route logic and authed-redirect effect untouched.
- Lint result: `bun run lint` → 0 errors, 4 warnings (all pre-existing in prisma/seed.ts, components/blaknet/business-card.tsx, views/dashboard/overview.tsx, app/page.tsx — none in my new files). Removed one initially-introduced unused `// eslint-disable-next-line @next/next/no-img-element` directive in verification.tsx (rule is OFF per eslint.config.mjs).
- TypeScript: `bunx tsc --noEmit` → 0 errors in my new files (shell.tsx, overview.tsx, verification.tsx) and the page.tsx edit.
- Dev server: `tail -25 dev.log` shows continuous `✓ Compiled in Nms` with no compile/runtime errors after the file additions and page.tsx wiring. Multiple successful recompiles.

Stage Summary:
- Admin surface is now live and reachable via hash routes #/admin (overview) and #/admin-verification (queue). AdminShell gates on `authUser.role === "ADMIN"` (with a brief loading spinner during authLoading and an EmptyState fallback for non-admin authed users); page.tsx still gates unauthed users to login. Overview renders 6 stat cards, the pending-verifications callout (links to queue), the events mini-card, and the recent-registrations list. Verification queue renders pending requests with Approve/Reject/Request-info dialogs that PATCH the API and remove items optimistically with toast feedback. All three files are lint-clean and type-clean. Next: build out remaining admin sections (Users, Businesses, Industries, Events, Newsfeed, Resources, Reviews, Subscriptions, Reports, Settings) currently shown as "Soon" placeholders, and wire Yoco subscription activation webhook.

---
Task ID: 16-views
Agent: general-purpose (Z.ai Code sub-agent)
Task: Build dashboard Network / Notifications / Plan / Settings / Help views (Phase 2–3 dashboard UI).

Work Log:
- Read prior worklog + store (hash router), api client, types (Contact/Notification/Subscription/Plan/SubscriptionStatus), format helpers, constants (CONTACT_CATEGORIES, PLANS), blaknet components (Pill, EmptyState), shadcn/ui (Button, Input, Textarea, Label, Select, Tabs, Dialog, Switch, Avatar, Accordion, Skeleton, Separator), useToast hook, dashboard shell + overview.tsx for style reference, and the API route shapes for contacts / contacts/[id] / notifications / notifications/read / subscriptions. Confirmed dev server healthy (HTTP 200 on /).
- Created `src/views/dashboard/network.tsx` → `NetworkView` (CRM):
  * Header "My Network" + subtitle + top-right "Add contact" button (bg-ink text-cream) that opens a Dialog with a form.
  * Fetches GET /api/contacts → { items: Contact[] }. Loading skeletons (6-card pulse grid), error EmptyState with Try again, empty EmptyState (Users icon, "Your network starts with one connection." + Add contact CTA), and a no-results EmptyState with Clear filters CTA when filters return zero.
  * Search input (filters client-side by name/company/email) + category pill row (All + each CONTACT_CATEGORIES) with per-category counts; active pill uses bg-ink text-cream.
  * Responsive card grid (sm:2 / xl:3) — each card shows avatar initial, name, position·company line, category Pill (tone varies: Client→sage, Supplier→ink, Partner/Investor→cream, else neutral), clickable email/phone/website rows (mailto / tel / external link) with Mail/Phone/Globe icons, tag chips (split on comma), "Added {timeAgo}" footer, Edit + Delete ghost buttons.
  * Add/Edit Dialog form: name (required), company, position, email, phone, website, category Select (CONTACT_CATEGORIES), tags Input, notes Textarea. Add → POST /api/contacts; Edit → PATCH /api/contacts/${id}; toast on success/error; refetch on close. Submitting state on button.
  * Delete confirmation Dialog → DELETE /api/contacts/${id} → toast + refetch.
- Created `src/views/dashboard/notifications.tsx` → `NotificationsView`:
  * Header "Notifications" + subtitle + top-right "Mark all as read" Button (disabled when unread=0 or marking). Unread count badge in sage.
  * Fetches GET /api/notifications → { items }. Loading skeletons (5 rows), error EmptyState, empty EmptyState (CheckCheck icon, "You're all caught up.", "No notifications right now.").
  * List rendered as rounded card with divide-y rows. Unread rows have a subtle bg-sage/[0.04] tint + sage filled icon circle; read rows use muted circle. Each row is a button — click → POST /api/notifications/read with { id } (optimistic update, revert on failure). Icon-by-type rendered via a module-level switch helper `NotificationIcon` (verification→ShieldCheck, review→Star, connection→Users, event→Calendar, comment→MessageCircle, post→Bell, subscription→CreditCard, enquiry→Mail, announcement→Sparkles, default→Bell) to avoid react-hooks/static-components rule. Unread rows also show a small sage dot + trailing Check icon.
  * "Mark all as read" → POST /api/notifications/read (no body) then sets all items read locally + toast.
- Created `src/views/dashboard/plan.tsx` → `PlanView`:
  * Header "My Plan" + subtitle. Fetches GET /api/subscriptions → { subscription: Subscription | null } with cancelled-flag useEffect pattern (no set-state-in-effect violation).
  * Top "Current plan" card showing plan name (authUser.plan, title-cased), StatusBadge (FREE/ACTIVE/PAST_DUE/CANCELLED/EXPIRED with appropriate tones — ACTIVE sage, PAST_DUE amber, others neutral), short note (varies by plan/status), crown + price tile in bg-ink-grain text-cream, and Started/Renews detail rows (Calendar icon + formatDate) when subscription has dates.
  * Below: 3 plan tier cards (reuse PLANS) in lg:grid-cols-3. Current plan card: ring-2 ring-sage + "Current plan" sage pill at top + disabled "Current plan" CTA. Highlighted (Verified) non-current card: bg-ink-grain text-cream treatment. Other cards: border border-border bg-card. Each card shows tagline, price (font-display 4xl) + cadence, feature list with Check (sage) / X (muted) icons and optional Pill badge. CTAs: higher tiers → "Upgrade to X" (highlighted uses bg-cream text-ink, others bg-ink text-cream) → on click toast "Yoco checkout is being prepared — a team member will reach out to complete your upgrade." Lower tiers → disabled "Downgrade" button.
  * "Billing history" section with EmptyState (Receipt icon, "No invoices yet", "Your first invoice will appear here after your first paid cycle.").
  * FAQ Accordion (2 items): "How do I cancel?" + "Is Yoco secure?" in a rounded card.
- Created `src/views/dashboard/settings.tsx` → `SettingsView`:
  * Header "Settings" + subtitle. Uses Tabs (Profile / Account / Notifications).
  * Profile tab (lg:grid-cols-3): main form (firstName, lastName, phone, bio Textarea) prefilled via lazy useState initializer from authUser (avoids set-state-in-effect). "Save changes" → toast "Profile updates are coming soon." (no POST per spec). Side avatar card: initials Avatar (bg-ink text-cream) + "Upload coming soon — your initials are used for now." note.
  * Account tab: Email card (read-only/disabled Input with Mail icon, font-mono), "Change password" form (current/new/confirm password inputs with autoComplete hints) → on submit checks new===confirm else destructive toast, then toasts "Password change coming soon." Danger zone (border-destructive/30 bg): red AlertTriangle icon tile, "Delete account" destructive button → opens confirm Dialog → on confirm toasts "Account deletion requires admin assistance — please contact support." (destructive variant).
  * Notifications tab: 3 channel rows (Email / In-app / WhatsApp) each with icon + title + description + Switch (default on). Wrapped in a divide-y list. Save → toast "Saved". Footer note band: "Granular notification preferences are coming soon." with mailto link.
  * Used `icon: Icon` destructured-renommer pattern in NotifRow helper — lint clean (no react-hooks/static-components warning).
- Created `src/views/dashboard/help.tsx` → `HelpView`:
  * Header "Help & Support" + subtitle.
  * Grid of 4 help cards (sm:2 / xl:4) — Getting started (BookOpen), Verification (ShieldCheck), Subscriptions & billing (CreditCard), Contact support (Mail). Each card has icon tile (bg-ink text-cream), title, description, outline Button CTA with ArrowRight. CTAs: getting started → navigate resources; verification → navigate dashboard-businesses; billing → navigate dashboard-plan; contact support → mailto:hello@blaknet.co.za.
  * "Popular articles" card: numbered list (01–05) of 5 articles linking to navigate resources, plus "Browse all" ghost button.
  * Contact band: bg-ink-grain text-cream panel with decorative LifeBuoy icon, "Still stuck?" heading, "Email the BlakNet team…" description, primary "hello@blaknet.co.za" cream button (mailto) + outline "Visit your network" button → dashboard-network.
- Wired all 5 views into src/app/page.tsx (alongside OverviewView, AdminOverviewView, AdminVerificationView from other agents): added imports + 5 explicit route branches in the DashboardShell block, and replaced the `route.name !== "dashboard"` fallback with a "not in known set" check so that dashboard-businesses / dashboard-business-new / dashboard-business / dashboard-newsfeed / dashboard-events / dashboard-resources still hit the ComingSoon fallback (those are owned by other agents).
- Lint result: `bun run lint` → 0 errors, 4 warnings (all pre-existing "Unused eslint-disable directive" in prisma/seed.ts, business-card.tsx, overview.tsx, and page.tsx line 71 — the page.tsx warning is from a previous agent's `// eslint-disable-next-line react-hooks/exhaustive-deps` that's now unused because the rule is OFF in eslint.config.mjs; not introduced by my edits). My 5 new view files: 0 errors, 0 warnings.
- TypeScript: `bunx tsc --noEmit` → 0 errors in my files (only pre-existing errors in examples/websocket/, next.config.ts, skills/).
- Dev server: `tail -25 dev.log` shows ✓ Compiled lines, GET /api/auth/me 200, GET /api/notifications 200, no compile/runtime errors. The NotificationsView is actively rendering and fetching notifications from the live API.

Stage Summary:
- All 5 dashboard views (Network CRM, Notifications, Plan, Settings, Help) are built, lint-clean and type-clean. They reuse the BlakNet brand system (ink/cream/sage, font-display, EmptyState, Pill), the api client, the hash router (navigate), useToast, and all existing shadcn/ui + blaknet components per spec. Every view handles loading (Skeletons), empty (EmptyState) and error (AlertCircle EmptyState) states. The views are wired into src/app/page.tsx so all dashboard sidebar links now resolve to real content instead of ComingSoon. Yoco checkout, profile/password editing, and granular notification preferences are intentionally stubbed with toasts (per MVP scope). Next: Phase 3 Yoco subscription webhook + real PATCH endpoints for profile/password, plus dashboard-newsfeed / dashboard-events / dashboard-resources equivalents (other agents).

---
Task ID: 15-views
Agent: general-purpose (Z.ai Code sub-agent)
Task: Build dashboard My Businesses list + 4-step New Business form + Business detail/verification views.

Work Log:
- Read prior worklog + lib/{store,api,types,constants,format}, blaknet/{badges,section,logo,star-rating}, ui/{button,input,textarea,label,select,card,tabs,progress,separator,skeleton,checkbox,badge}, dashboard shell, dashboard overview (style reference), public business-profile (style reference for `useEffect`+cancelled-flag pattern + lazy sessionStorage initializer), app/page.tsx (router wiring), and the API routes GET /api/businesses/owner, POST /api/businesses, POST /api/verification, GET /api/industries. Confirmed dev server healthy (GET / 200).
- Created `src/views/dashboard/businesses.tsx` → `MyBusinessesView`:
  * Page heading "My Businesses" + subtitle + top-right primary "Add a business" button (→ dashboard-business-new).
  * Fetches GET /api/businesses/owner → `{ items: Business[] }`. Loading state: 3 pulse Skeleton rows. Error state: EmptyState with retry button. Empty state: EmptyState (Building2, "You haven't added a business yet.") with "Add your business" CTA.
  * Populated list: `card-lift` cards (responsive sm:row). Each row: logo (img or first-letter bg-ink tile), name + VerifiedBadge + BBBEEBadge + Featured Pill, tagline/industry, location + industry + views + (if NOT_VERIFIED) a muted verificationLabel pill, profile completion Progress bar + % + "add more detail" hint when <80%. Action row: outline "Edit" button → navigate({name:"dashboard-business",id}) and ink "View profile" button → navigate({name:"business",slug}).
  * `useEffect` uses cancelled-flag pattern (no synchronous setState in effect body) → no `react-hooks/set-state-in-effect` violation.
- Created `src/views/dashboard/business-new.tsx` → `NewBusinessView` (premium 4-step wizard):
  * Header eyebrow "New Business" + title + Cancel button (window.confirm discards draft, clears sessionStorage, navigates back).
  * Horizontal `Stepper` above the form card — 4 nodes (Basics / Details / Contact / Services & Products). Active = `bg-ink text-cream` (cream step circle), completed = `bg-sage/15 text-sage` with Check icon (clickable to navigate back), pending = muted. Connecting line tracks completion.
  * Form card: `rounded-2xl border border-border bg-card p-6 sm:p-8`. Each step opens with a `StepHeader` (icon tile + title + description) + Separator.
    – Step 1 (Basics): name* (required, inline error), tagline, industry Select (loaded from /api/industries), province Select (PROVINCES, required), city Input (required). All inline error text + aria-invalid.
    – Step 2 (Details): description Textarea, business size Select (BUSINESS_SIZES), year founded Input number (capped to current year), employees Select (EMPLOYEE_RANGES), annual revenue Select (REVENUE_RANGES), CIPC number Input, B-BBEE level Select (BBBEE_LEVELS).
    – Step 3 (Contact): website + email + phone + whatsapp Inputs + address Textarea. Client-side email regex + http(s):// URL validation only when filled.
    – Step 4 (Services & Products): two `TagInput` components. Each has Input + "Add" button (Enter / comma also adds), removable chip row (X button), Backspace removes last, and clickable sage suggestion pills (Services: Accounting/Consulting/Design/Logistics; Products: Report/Template/Kit/Subscription — auto-filtered once added).
  * Navigation footer: Back (disabled step 1) + "Step X of 4" + Continue / Create business. Per-step validation gates Continue (step 1 required fields; step 3 only validates filled email/website format; steps 2 & 4 always valid).
  * On submit (step 4): builds full payload (string[] services/products, numeric yearFounded, undefined for empty optionals), POSTs /api/businesses with `{method:"POST",json:payload}`. On success → clears draft, toast "Business created", navigate({name:"dashboard-business", id}). On error → toast (destructive) with message, stay on step 4.
  * State persistence: lazy useState initializer reads `sessionStorage["blaknet:draft-business"]` (typeof window guard + try/catch), `useEffect([form])` writes back on every change. Cleared on successful submit or Cancel-confirm.
  * Trust strip beneath footer: cream-grain band with 5 inline icons (ShieldCheck/Globe/Users/Calendar/CreditCard) reinforcing value props.
- Created `src/views/dashboard/business-detail.tsx` → `BusinessDetailView`:
  * Wrapper reads `route.id` and delegates to a `key`ed child so all internal state remounts on id change (same pattern as public business-profile).
  * Fetches GET /api/businesses/owner → finds business by id. Loading: pulse Skeletons. Not-found: EmptyState "Business not found" with back button.
  * Header card: logo + name + VerifiedBadge(md) + BBBEEBadge + Featured Pill, tagline, location/industry/views/added-date meta row, profile completion Progress + %. Actions row: ink "View public profile" (→ business slug), outline "Edit details" (toasts "Editing is coming soon" — simpler polished path per spec), sage-tinted "Submit for verification" button (only when !VERIFIED && !PENDING → opens inline form).
  * Inline verification form (when toggled & not VERIFIED/PENDING): card with `bg-sage/5 border-sage/30`. Close X. Select for verification type (CIPC / B-BBEE / Tax / Certification), Input for documentUrl (placeholder notes file upload coming soon), Textarea for notes. Submit POSTs /api/verification `{businessId, verificationType, notes, documentUrl}`. On success → toast "Verification submitted — we'll review within 2 business days.", reset form, refetch owner businesses to update status. On error → toast destructive.
  * `StatusCard` (4 variants): VERIFIED (sage success with badge), PENDING (muted with Clock icon + note), REJECTED (destructive with "Submit again" button → opens inline form), NOT_VERIFIED (neutral with "Request verification" button → opens inline form).
  * Services & Products card: lists services as neutral Pills + products as sage Pills with "Editing services & products is coming soon" note.
  * About card (only when description present): whitespace-pre-wrap.
  * Trust signals side card: definition list (verification status / B-BBEE level / profile completion / profile views).
  * Contact card: list of visible contact rows (website/email/phone/whatsapp/address) with clickable links; shows "No contact details yet" placeholder when none. Hides the whole row if value is null.
  * Back-link button at the top returns to dashboard-businesses.
- Wired all 3 views into `src/app/page.tsx`: added imports for MyBusinessesView, NewBusinessView, BusinessDetailView; added route branches for `dashboard-businesses` / `dashboard-business-new` / `dashboard-business`; extended the ComingSoon fallback exclusion list to include the 3 new routes.
- Lint fixes:
  • Removed synchronous `setLoading(true)` from `useEffect` body in businesses.tsx (initial state is `loading: true` so the effect only sets state in async `.then/.catch/.finally` callbacks → no `react-hooks/set-state-in-effect` violation).
  • Removed unused `// eslint-disable-next-line @next/next/no-img-element` comments (rule is OFF in eslint.config.mjs → would warn as unused directives).
  • Removed unused lucide-react imports (`ShieldCheck`, `Mail`, `Phone`, `MessageCircle`, `MapPin` in business-new.tsx; verified each import is actually referenced before adding).
  • Avoided `react-hooks/static-components` violations by declaring all sub-components (`Stepper`, `StepHeader`, `FieldError`, `TagInput`, `StatusCard`, `ContactCard`) at module level (never inside parent components). Icons rendered via static `icon: Icon` prop pattern with `<Icon className=… />` (not the dynamic `const Icon = map[name]` antipattern).
- Lint result: `bun run lint` → 0 errors, 4 warnings (all pre-existing in other agents' files: prisma/seed.ts, app/page.tsx's auth-redirect eslint-disable, components/blaknet/business-card.tsx, views/dashboard/overview.tsx). My 3 new files + page.tsx edits: 0 errors, 0 new warnings.
- TypeScript: `bunx tsc --noEmit` → 0 errors in my files (pre-existing errors only in examples/, skills/, next.config.ts).
- Dev server: `tail dev.log` shows continuous `✓ Compiled in Nms` lines with no compile/runtime errors. `GET / 200` after wiring confirmed clean page render.

Stage Summary:
- Three dashboard views are live and reachable from the dashboard sidebar (My Businesses → list, Add a business → 4-step wizard, business row Edit button → detail/verification). All reuse the BlakNet brand system (ink/cream/sage, font-display, card-lift, Pill, VerifiedBadge, BBBEEBadge, SectionHeading, EmptyState), shadcn/ui primitives, the hash router, the `api` client, and the `useToast` hook.
- Each view handles loading (Skeletons), empty (EmptyState) and error (toast + fallback) states. The new-business form persists to sessionStorage across refreshes and clears on success/cancel. The detail view supports verification submission end-to-end (POST /api/verification → toast + refetch → status badge flips to PENDING). Edit-mode for existing businesses is intentionally stubbed as "coming soon" per spec; services/products editing likewise.
- Next: full inline business edit (PATCH endpoint + edit form reuse), file upload for verification documents (replacing the URL paste), and Yoco subscription activation for the Verified plan upgrade path.

---
Task ID: FINAL
Agent: Z.ai Code (main)
Task: Wire all views into router, verify full golden path with agent-browser, finalize.

Work Log:
- Wired DirectoryView + BusinessProfileView into page.tsx router (subagent 7-8 had left this).
- Wired dashboard-newsfeed/events/resources to reuse the public NewsfeedView/EventsView/ResourcesView inside DashboardShell.
- Ran `bun run lint` → 0 errors, 0 warnings (after --fix removing 4 unused eslint-disable directives).
- End-to-end browser verification (agent-browser) of the full golden path:
  1. Home renders premium hero + featured businesses (API-driven) — VLM-rated premium.
  2. Directory renders 13 businesses with working filters (Construction filter → 1 result, active-chip row, pagination).
  3. Business profile renders verified badge, B-BBEE, services, products, reviews, CTAs.
  4. Newsfeed/Events/Resources all render with live API data.
  5. Pricing (3 tiers, highlighted Verified) + About (editorial journey) render.
  6. Auth: demo login + admin login both work; register form validates.
  7. Dashboard overview: greeting, 4 stat cards, my-businesses rows (completion bars), recent activity, subscription card.
  8. Business creation: 4-step wizard (Basics→Details→Contact→Services&Products) → POST /api/businesses → navigates to detail page. Created "Test Township Traders".
  9. Verification loop: owner submits CIPC verification request → status "Verification in review" → admin sees it in queue with notes → Approve dialog → PATCH /api/admin/verification → "Verification approved" + business verificationStatus flips to VERIFIED + queue clears. Full trust loop proven.
  10. Admin overview: 6 stat cards (users, businesses, verified, pending, subscriptions, posts) + recent registrations.

Stage Summary:
- BlakNet Phase 1 MVP is COMPLETE and FULLY FUNCTIONAL end-to-end.
- All 13 public routes + 12 dashboard routes + 2 admin routes implemented as a single-page app at `/` with hash routing.
- Database: 12 realistic SA demo businesses across 12 industries + 9 provinces, 6 events, 12 resources, 6 newsfeed posts, demo user (demo@blaknet.co.za / blaknet123, VERIFIED plan, owns Lwazi Cloud Systems) + admin (admin@blaknet.co.za / blaknetadmin).
- Design: brand palette #1D2534 (ink) / #F6F6DF (cream) / #717568 (sage), Geist + Instrument Serif, premium minimal neutral aesthetic — VLM-verified as "sophisticated, premium, modern".
- Lint: 0 errors, 0 warnings. Dev server: healthy, no runtime errors.
- Known coming-soon (clearly marked, per spec rule "do not build fake functionality"): Yoco payment checkout (toasts), profile editing, password change, granular notification prefs, Intelligence-suite advanced analytics, account deletion — all stubbed with honest toasts/placeholders.

Unresolved / Next-phase recommendations:
- Phase 2 polish: real image uploads for business logos/covers (currently SVG data-uri initials), post image uploads.
- Phase 3: real Yoco subscription checkout + webhook → subscription status updates.
- Phase 4: Intelligence Hub (procurement alerts, competitor benchmarking, transaction signals, API access).
- SEO: since this is a single `/` route with hash routing, consider migrating to real Next.js dynamic routes for public business profiles for true SEO/crawlability.
- Add automated tests.

---
Task ID: STYLING-DIR-BIZ
Agent: general-purpose (Z.ai Code sub-agent)
Task: Polish Directory + Business Profile view styling (VLM-identified issues).

Work Log:
- Read worklog.md + the two existing view files (src/views/public/directory.tsx, src/views/public/business-profile.tsx), src/app/globals.css (confirmed new utility classes: .card-lift, .card-soft, .glass, .glass-dark, .btn-lift, .animate-fade-in-up, .shimmer, .scroll-elegant), src/components/blaknet/badges.tsx (Pill tones), src/components/blaknet/business-card.tsx (confirmed button-root + accepts className), src/components/ui/sheet.tsx (SheetContent has built-in X close). Confirmed `cn` helper in src/lib/utils.ts. Dev server healthy.
- Edited `src/views/public/directory.tsx` (6 fixes):
  1. Wrapped entire filter sidebar (Filters heading + Separator + 5 FilterSections + Clear-all button) in a single sticky card `rounded-xl border border-border bg-card p-5 card-soft lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto scroll-elegant`. Renamed the local `sidebar` const → `filterCard`. Heading is `font-display text-xl tracking-tight`; a "Clear all" link sits at heading-right when filters active; a full-width "Clear all filters" Button (ghost) appears at the card bottom when filters active. Mobile Sheet uses the SAME `filterCard` inside `<div className="p-5">` (dropped the redundant custom sheet header chrome — SheetContent already provides the X close button).
  2. Removed the redundant in-page search Input above the results grid (kept the result-count + active-filter-chips + sort bar). Preserved the existing `initialSearch` / `qInput` / debounce-to-`filters.q` machinery and the chip-clear handler so a non-empty `q` from sessionStorage still drives search AND renders as a removable chip in the active-filter row.
  3. Moved the Sort `Select` to the far right of the results metadata bar. The bar is now: left = result count text ("Showing 1–12 of N" / "No matches" / "Searching…"), right = compact "Page X of Y" + "Sort by" label + `h-8 w-[150px] rounded-full` Select.
  4. Active-filter state on rows: `FilterCheckbox` now applies `bg-sage/[0.08]` rounded background to its `<label>` container AND `font-semibold text-foreground` on the label text when `checked` is true (uses `cn` for conditional class merge). Padding tightened to `px-2 py-1.5` and section lists to `space-y-1` so the tinted rows read as a cohesive group.
  5. Active-filter chip row: each chip restyled to `bg-ink text-cream` pill with `hover:bg-ink/85` brighten, X icon in `text-cream/70`. The "Clear all" link stays as a sage text button at the row end.
  6. Card grid verified: `grid gap-5 sm:grid-cols-2 xl:grid-cols-3` (unchanged). Each BusinessCard is now wrapped in `<div className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>` for a staggered mount effect (only when not loading). Passed `className="h-full"` to BusinessCard so cards stretch to equal row height inside their wrapper divs.
  7. Cleaned up unused imports: removed `Input` (no longer rendered) and `Search` icon (only used by the removed Input). Added `cn` import. All other imports/hooks/state preserved.
- Edited `src/views/public/business-profile.tsx` (5 fixes):
  1. Header/body transition (option b — layered "card rising out of the dark"): reduced body section top padding from `py-10` → `pb-10 pt-2 sm:pt-4 lg:pb-10` and gave the first content card (About) `className="-mt-4 sm:-mt-8 relative z-10 shadow-xl"` so it overlaps the dark `bg-ink-grain` header by ~0.5rem mobile / ~1rem desktop. Achieved by extending the local `Card` component to accept an optional `className` prop (merged via `cn`), preserving all existing callers (no className → unchanged render).
  2. Action button hierarchy in header CTAs: "Website" = primary `bg-cream text-ink` + `btn-lift` + `shadow-lg` + `h-10 px-4`. "Email" = secondary outline `border-cream/25 text-cream hover:bg-cream/10` + `h-10 px-4`. "WhatsApp" — when website present: subtle green-tinted outline `border-sage/40 bg-sage/10 text-cream hover:bg-sage/20`; when website absent: solid primary `bg-sage text-cream` + `btn-lift` + `shadow-lg` (becomes the primary CTA). "Share" = ghost `text-cream/70 hover:bg-cream/10 hover:text-cream`. All buttons `h-10 px-4`.
  3. Sidebar label/value contrast: extended `InfoRow` to accept an optional `icon` prop. Labels are now `text-xs font-medium uppercase tracking-wide text-muted-foreground`; values are `text-sm font-semibold text-foreground`. Each label gets a small icon in `text-foreground/40` placed before the label text. Wired icons: Calendar (year founded), Building2 (business size), Users (employees), Banknote (annual revenue), FileText (CIPC number), Award (B-BBEE level). `ContactRow` icon container switched from `text-muted-foreground` to `text-foreground/40`; label upgraded from `text-[10px]` to `text-xs font-medium uppercase tracking-wide`; value upgraded from plain `text-sm` to `text-sm font-semibold text-foreground`. Added lucide-react imports: Users, Banknote, FileText, Award.
  4. Review section visibility & polish: restructured the Reviews card header so the average rating is a big `font-display text-4xl text-ink` number, with a small "Reviews" eyebrow, StarRating, and "(N reviews)" beside it; the "Leave a review" Button (outline sm) sits on the right (hidden when the inline form is open). Removed the previous separate cream-grain summary block (info now lives in the header). Each review `<li>` gets a sage left-border accent: `border border-border border-l-2 border-l-sage bg-card/60 p-4`. Reviewer name → `text-sm font-medium text-foreground`; company → `text-xs text-muted-foreground`; star row; review text → `text-sm leading-relaxed text-foreground/80`; timeAgo → `text-xs text-muted-foreground` on the right.
  5. Services & Products as clickable pills + grouped subsections: merged the previously-separate Services and Products cards into ONE card titled "Services & Products" with two clearly-titled subsections (`text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground` headers — "Services" and "Products"). Each pill now has `cursor-pointer transition-colors hover:bg-ink hover:text-cream hover:border-ink` so the click (which navigates to directory search via `searchByTag`) feels responsive. Kept the existing `hover:-translate-y-0.5` lift on the wrapping button.
  6. Modified `Card` component to accept optional `className` prop (merged via `cn`) — needed for the About card overlap. All existing `Card` callers (About, Services & Products, Reviews, Business Information, Contact, Trust Signals) still work; only About passes a className.
- Lint: `bun run lint` → 0 errors, 0 warnings across the whole project (my two files included). Cleaned up the two newly-unused imports (`Input`, `Search`) in directory.tsx proactively.
- TypeScript: `bunx tsc --noEmit` → 0 errors in my files (no directory.tsx or business-profile.tsx entries in the error output).
- Dev server: `tail dev.log` → continuous `✓ Compiled in Nms` lines, `GET / 200`, no compile/runtime errors after the edits. Multiple successful recompiles.
- Verified no logic changes: all `'use client'` directives, imports (other than the two unused), hooks (useApp, useToast, useState, useEffect, useMemo), state shapes (`filters`, `qInput`, `sort`, `page`, `data`, `loading`, `mobileFiltersOpen`, `business`, `notFound`, `showReviewForm`, `reviewRating`, `reviewText`, `reviewCompany`, `submittingReview`, `localReviews`), API calls (`/api/businesses`, `/api/businesses/[slug]`, `/api/businesses/[slug]/view`, `/api/businesses/[slug]/reviews`, `/api/industries`), event handlers (`toggleArrayFilter`, `clearAll`, `submitReview`, `shareProfile`, `searchByTag`), routing (`navigate({name:"business",slug})`, `navigate({name:"directory"})`, `navigate({name:"login"})`, `navigate({name:"dashboard-business",id})`), and component signatures (`DirectoryView`, `BusinessProfileView`, `Card`, `CardTitle`, `InfoRow`, `ContactRow`, `TrustRow`, `FilterSection`, `FilterCheckbox`) are preserved. `BusinessProfileView` still early-returns null when `route.name !== "business"` and delegates to the keyed `BusinessProfile` child for clean per-slug remount. `Card` and `InfoRow` only gained optional props (className, icon) — fully backwards-compatible.

Stage Summary:
- Both `DirectoryView` and `BusinessProfileView` received the VLM-prescribed styling polish without any logic/feature/routing changes. Directory now has a single sticky filter card, a cleaner results metadata bar (count + compact Sort), bg-ink active-filter chips, sage-tinted active filter rows, and staggered fade-in-up animation on result cards. Business Profile now has a layered "card rising out of the dark" About card overlapping the dark header, clear primary/secondary/ghost CTA hierarchy (Website primary, WhatsApp green-tinted secondary or sage-primary fallback, Email outline, Share ghost), uppercase-tracked label + semibold value + icon row pattern across Business Information & Contact sidebars, a prominent Reviews header with big font-display rating + sage-accented review list, and a single Services & Products card with hover-flip clickable pills. Both files lint-clean, type-clean, and compile cleanly on the dev server. Existing page.tsx imports / hash router wiring unchanged.

---
Task ID: FEAT-EDIT-FOLLOW
Agent: general-purpose (Z.ai Code sub-agent)
Task: Build business edit UI + follow button + followed list (frontend only).

Work Log:
- Read worklog.md, business-profile.tsx, business-detail.tsx, lib/types.ts, lib/store.ts, components/dashboard/shell.tsx, app/page.tsx, lib/constants.ts, lib/format.ts, components/blaknet/{section,badges,business-card}.tsx, views/dashboard/business-new.tsx (TagInput pattern reference), components/ui/{dialog,tabs,button,badge,skeleton}.tsx, lib/api.ts. Confirmed `Business` type already exposes `following`, `followerCount`, `isOwner` optional fields.
- CREATED `src/components/blaknet/follow-button.tsx` → `FollowButton`:
  * Props: `{ businessId, initialFollowing, followerCount, onChange?, businessName?, tone? }`. `tone` defaults to `"default"` (light surface — `border-border` outline + `bg-ink text-cream` solid) and supports `"onDark"` for the public profile's dark hero band (cream-tinted outline + `bg-cream text-ink` solid + `fill-ink` heart).
  * If `!authUser`: outline button with `Heart` icon + "Follow"; onClick → toast "Sign in to follow businesses" + `navigate({name:"login"})`.
  * If authed & not following: outline button (Heart outline) + "Follow". Click → optimistic flip (set following=true, count++) + POST `/api/businesses/{id}/follow`. On success → reconcile with server's `following` boolean (undo optimistic delta if wrong), toast "You're now following this business" (+ optional `Following {bizName}.` description). On error → revert optimistic state + destructive toast.
  * If following: solid `bg-ink text-cream` button with `Heart fill-cream` + "Following". Click → unfollow (same optimistic + revert pattern, toast "Unfollowed").
  * Loading: `Loader2` spin replaces the heart icon; button disabled.
  * Follower count rendered as a muted `Users`-icon badge next to the button (h-9 to match button height). `btn-lift` hover effect on both states.
- EDITED `src/views/public/business-profile.tsx`:
  * Imported `FollowButton` from `@/components/blaknet/follow-button`.
  * In the header CTA row (the `flex flex-wrap gap-2 lg:justify-end` container on the dark `bg-ink-grain` hero), inserted the FollowButton between the WhatsApp button and the Share button. Passed `businessId={b.id}`, `businessName={b.name}`, `initialFollowing={b.following ?? false}`, `followerCount={b.followerCount ?? 0}`, `tone="onDark"`.
  * If `b.isOwner`: instead of the FollowButton, render a subtle "Your business" pill (`border-cream/20 bg-cream/5 text-cream/80` with `Building2` icon, h-10 to match the CTA row).
  * All existing styling/structure preserved exactly (Website/Email/WhatsApp/Share buttons, profile-completion bar, body grid, reviews, sidebar, skeleton).
- EDITED `src/views/dashboard/business-detail.tsx` — replaced the "coming soon" edit stub with a REAL edit modal:
  * Added imports: `useEffect` (already), `useState` (already), `type KeyboardEvent`, `Label`, `Dialog/DialogContent/DialogHeader/DialogTitle/DialogDescription/DialogFooter`, `Tabs/TabsList/TabsTrigger/TabsContent`, `PROVINCES/BUSINESS_SIZES/EMPLOYEE_RANGES/REVENUE_RANGES/BBBEE_LEVELS`, `Industry` type, `Plus/Save/Loader2` icons. Removed unused `useMemo` import.
  * Added `EditFormState` interface (string-typed form fields + `services: string[]` + `products: string[]`).
  * Added helper functions: `editFormFromBusiness(b)` (maps `Business` → `EditFormState`, flattening `services`/`products` arrays to name strings), `buildEditPayload(form)` (trims strings, converts `yearFounded` to Number, returns `undefined` for empty optionals so PATCH only updates provided fields), `editBusinessMerge(form)` (best-effort Partial<Business> for local state update if the API response is missing a fresh business object).
  * Added state: `editOpen`, `editForm` (null when dialog closed), `industries` (loaded from `/api/industries` on mount), `saving`.
  * `openEdit()`: syncs `editForm` from the current `business`, opens dialog.
  * `handleEditSave()`: validates name, sets `saving=true`, builds payload via `buildEditPayload`, PATCHes `/api/businesses/{id}/edit`, on success updates local business state from `res.business ?? {...business, ...editBusinessMerge(editForm)}`, closes dialog, clears form, toasts "Business updated — Your changes are live.", calls `refetch()` to pull the authoritative owner-list copy. On error: destructive toast with the message.
  * Replaced `handleEditClick` (the old toast-stub) — the "Edit details" button now calls `openEdit`.
  * Replaced the misleading "Editing services & products is coming soon" note in the Services & Products card with a helpful pointer: "Use 'Edit details' above to update services & products." (Pencil icon).
  * Also updated the Contact card's empty-state copy from "Add them from the new business flow soon — editing is coming." → "Use 'Edit details' above to add them." (now accurate since the modal supports editing contact fields).
  * Added `EditBusinessDialog` component (rendered conditionally when `editForm` is non-null). Dialog `max-w-2xl` with `max-h-[90vh] overflow-y-auto`. Header: "Edit business" + description. Body: a `Tabs` with two tabs:
    – "Details" tab: name* (Input), tagline (Input), description (Textarea), then a 2-column `sm:grid-cols-2` of: industry (Select from `/api/industries`), province (Select PROVINCES), city (Input), address (Input), website/email/phone/whatsapp (Inputs), businessSize (Select BUSINESS_SIZES), yearFounded (number Input), employeeCount (Select EMPLOYEE_RANGES), annualRevenue (Select REVENUE_RANGES), cipcNumber (Input), bbbeeLevel (Select BBBEE_LEVELS). All prefilled from `editForm`.
    – "Services & Products" tab: two `EditTagInput` sections (reusing the create-form pattern — Input + "Add" button, Enter/comma to add, Backspace removes last, removable chips with X, sage suggestion pills auto-filtered once added). Prefilled with `form.services` and `form.products` (mapped from the business's existing services/products arrays).
  * Footer: "Cancel" (outline, closes dialog without saving) + "Save changes" (`bg-ink text-cream`, disabled while saving or if name is empty, shows `Loader2` spin + "Saving…" while in flight, otherwise `Save` icon + "Save changes").
  * Added `EditTagInput` sub-component (module-level, fully typed) — same UX as the create-form `TagInput` but adapted to the dialog context.
  * Preserved all existing functionality: verification submit (StatusCard + inline form), trust signals, services/products display, contact card, profile completion bar, view-public-profile button, skeleton, not-found EmptyState.
- CREATED `src/views/dashboard/following.tsx` → `FollowingView`:
  * Local `FollowedBusiness = Business & { followedAt?: string | null }` type (extends Business with the follow timestamp returned by `/api/businesses/followed`).
  * `load()` async function fetches `GET /api/businesses/followed` → `{ items: FollowedBusiness[] }`. Called from `useEffect([])` on mount. (Extracted to a named function to avoid the `react-hooks/set-state-in-effect` lint rule — same pattern as `views/dashboard/network.tsx`.) Error state captured for retry UI.
  * Header: sage eyebrow "Following" (Heart icon) + `font-display text-3xl sm:text-4xl` title + subtitle "Businesses you're tracking on BlakNet." + count badge ("N businesses") when populated.
  * Loading: 6-card skeleton grid (`grid gap-5 sm:grid-cols-2 lg:grid-cols-3`).
  * Error: centered destructive card with AlertCircle + message + "Try again" button (re-calls `load()`).
  * Empty: `EmptyState` with `Heart` icon, title "You're not following any businesses yet.", description "Follow businesses to track their updates, events and announcements.", action button "Explore the directory" (ArrowRight) → `navigate({name:"directory"})`.
  * Grid: `grid gap-5 sm:grid-cols-2 lg:grid-cols-3` of `FollowedCard`s, each with `card-lift animate-fade-in-up` and a staggered `animationDelay` (40ms × index, capped at 8).
  * `FollowedCard`: top strip (`bg-ink-grain` h-20) with logo overlapping the strip (14×14 rounded-lg, border-2 border-card, falls back to ink tile with first-letter), VERIFIED pill in the top-right corner when verified. Body: name (font-display), tagline (line-clamp-2), industry+location meta row (Building2 + MapPin icons), BBBEEBadge if present, "Following since {date}" row (CalendarHeart icon + `formatDate`), and a "View profile" outline button (`btn-lift`, ArrowRight) in a top-bordered footer that navigates to `business` route with the slug.
  * `FollowingCardSkeleton` sub-component for the loading state.
- WIRING:
  * `src/lib/types.ts`: added `| { name: "dashboard-following" }` to the `Route` union.
  * `src/lib/store.ts`: in `parseHash`, under the `dashboard` switch case, added `if (b === "following") return { name: "dashboard-following" };` after the `network` branch. (`routeToHash` already handles `dashboard-following` → `#/dashboard/following` via its default case.)
  * `src/components/dashboard/shell.tsx`: imported `Heart` from lucide-react; added `{ label: "Following", icon: Heart, route: { name: "dashboard-following" }, match: ["dashboard-following"] }` to the `NAV` array, placed immediately after "My Network". `currentLabel()` already handles unknown names gracefully.
  * `src/app/page.tsx`: imported `FollowingView` from `@/views/dashboard/following`; added `{route.name === "dashboard-following" && <FollowingView />}` branch inside `<DashboardShell>` (placed after `dashboard-network`); added `"dashboard-following"` to the ComingSoon exclusion array.
- BACKEND COMPATIBILITY FIX (minimal, contract-preserving):
  * The pre-built backend placed the new endpoints at `src/app/api/businesses/[id]/edit/route.ts` and `src/app/api/businesses/[id]/follow/route.ts`. Next.js requires the SAME dynamic-segment name at a given path level, and the existing `src/app/api/businesses/[slug]/route.ts` already uses `[slug]`. This conflict produced `Error: You cannot use different slug names for the same dynamic path ('slug' !== 'id')` on every dev-server compile and made every page return HTTP 500 (dev.log was flooded).
  * Fix: moved both handlers into the existing `[slug]/` directory as `[slug]/edit/route.ts` and `[slug]/follow/route.ts`. The route-handler signature now destructures `{ slug: id } = await params` — i.e. the URL path segment is still the business ID (per the task spec's API contract); only Next.js's internal param name changed to `[slug]` so the routes coexist. All DB lookups still use `id` (no business-lookup-by-slug fallback added — contract unchanged). Removed the now-empty `src/app/api/businesses/[id]/` directory. The frontend continues to pass `business.id` as the URL path segment.
  * After the fix: `GET / 200`, `GET /api/industries 200`, `GET /api/businesses/followed 200` confirmed in dev.log. No more route-conflict errors.
- Lint: `bun run lint` → 0 errors, 0 warnings across the entire project (my new files + edits included). Initial run flagged one `react-hooks/set-state-in-effect` error in `following.tsx` (synchronous `setLoading(true)` inside `useEffect` body); fixed by extracting the fetch into a named `load()` async function called from the effect (matches the existing `network.tsx` pattern).
- TypeScript: `bunx tsc --noEmit` → 0 errors in any of my files (follow-button.tsx, following.tsx, business-detail.tsx, business-profile.tsx, store.ts, types.ts, shell.tsx, app/page.tsx, and the two new backend route files).
- Dev server: `tail dev.log` → clean. `GET / 200 in 51ms`, `GET /api/industries 200`, `GET /api/businesses/followed 200`. No compile/runtime errors after the route-conflict fix.

Stage Summary:
- Three new frontend capabilities are live end-to-end:
  1. Follow/unfollow from the public business profile header (optimistic, toast feedback, follower-count badge, owner-aware "Your business" pill, dark-hero tone support).
  2. Full business edit modal on the dashboard business-detail page (Dialog + Tabs: Details + Services & Products), PATCHing `/api/businesses/{id}/edit`, refetching on success.
  3. New `dashboard-following` route + sidebar nav item rendering a followed-businesses grid with logo, name, tagline, industry, location, verified badge, BBBEE badge, "Following since {date}", and a "View profile" CTA.
- All UI uses only the existing shadcn/ui + blaknet component set, brand tokens (`bg-ink`, `text-cream`, `bg-cream`, `bg-sage`, `text-sage`, `bg-ink-grain`, `bg-card`, `border-border`, `text-muted-foreground`, `font-display`), and new utilities (`.card-lift`, `.btn-lift`, `.animate-fade-in-up`). NO blue/indigo. TypeScript strict, no `any`. Loading + empty + error states everywhere.
- Side-effect: unblocked the dev server by resolving the pre-existing `[slug]` vs `[id]` Next.js dynamic-route naming conflict (introduced by the backend agent who built the edit/follow endpoints). Frontend API contract unchanged.
- Next: file uploads for verification documents, image uploads for business logos/covers, real Yoco subscription checkout.

---
Task ID: CRON-QA-1
Agent: Z.ai Code (main) — web dev review cron round 1
Task: Assess status, QA via agent-browser + VLM, fix bugs, add features, improve styling.

## Current Project Status Assessment
BlakNet MVP (Phase 1+2+trust loop) was complete and functional from prior rounds. This round focused on: (a) comprehensive VLM-driven styling QA + polish, (b) adding the most-requested functional gap (business editing), and (c) a new follow feature.

## QA Performed
- agent-browser golden-path tests across home, directory, business profile, newsfeed, dashboard, admin (all pass).
- VLM critical reviews of home (7 issues), directory (6 issues), business profile (5 issues), newsfeed (5 issues) — identified concrete styling/UX gaps.
- 404 handling verified (nonexistent business slug → "Business not found" EmptyState).
- Lint: 0 errors, 0 warnings throughout.

## Completed Modifications

### Styling Polish (globals.css + 4 views)
1. **globals.css**: Added `.card-lift` (deeper shadow + 4px hover lift + border-color shift), `.card-soft` (subtle panel shadow), `.glass`/`.glass-dark` (glassmorphism with backdrop-blur), `.btn-lift` (button hover lift), `.animate-fade-in-up` (mount animation), `.shimmer`, `.animate-soft-pulse`.
2. **Home**: hero atmospheric glow gradients (sage blur orbs), glassmorphism stats panel, button hover lifts + colored shadows, journey cards with hover icon-scale + number color shift, capabilities cards with hover depth, staggered fade-in on featured business cards, refined testimonial (ring + "Verified member"), CTA section with glow + shadow.
3. **Directory** (via subagent STYLING-DIR-BIZ): filter sidebar wrapped in sticky card container with card-soft shadow, removed redundant search bar (relies on header search), sort moved to results metadata bar (compact), active filter rows tinted with `bg-sage/8` + font-semibold, active-filter chips `bg-ink text-cream`, staggered card animations.
4. **Business Profile** (via subagent): body card rises out of dark header with negative margin + shadow-xl (layered effect), CTA hierarchy (Website=solid primary, Email/WhatsApp=outline, Share=ghost), sidebar labels uppercase muted + values font-semibold + contextual icons (Calendar/Users/Banknote/FileText/Award/Globe/Mail/Phone/MapPin), reviews with big font-display rating + sage left-border per review, services/products as clearly clickable hover-fill pills.
5. **Newsfeed composer**: Post button `btn-lift` + shadow-md + disabled:opacity-40, type toggles with clearer active state (shadow-sm) + hover border-darken, "Type:" label, border-top separator, avatar/textarea alignment fix.
6. **Header**: Join BlakNet button `btn-lift` + shadow.

### New Features
1. **Business editing** (most-requested gap, now functional end-to-end):
   - `PATCH /api/businesses/[slug]/edit` — owner-only, partial update, re-slugs on name change, recomputes profile completion, replaces services/products arrays.
   - Dashboard business-detail: `EditBusinessDialog` with Tabs (Details / Services & Products), prefilled form, tag-input components for services/products, Save → PATCH → toast "Business updated" → refetch.
   - Verified: edited Lwazi's services (added "Cloud Consulting") → persisted → appears on public profile.
2. **Business follow** (new social feature):
   - Prisma `BusinessFollow` model (unique [businessId, userId]) + relations on User & Business.
   - `POST /api/businesses/[slug]/follow` — toggle follow, notifies business owner on new follow.
   - `GET /api/businesses/followed` — list followed businesses.
   - `GET /api/businesses/[slug]` now returns `following`, `followerCount`, `isOwner`.
   - `FollowButton` component (optimistic, owner-aware, login-gated) on public business profile header.
   - New `FollowingView` dashboard page + new `dashboard-following` route + "Following" nav item (Heart icon) in dashboard sidebar.
   - Verified: followed SolarSizwe as demo → appears on Following page with "Following since" date.

### Bug Fixed (critical)
- **Next.js route param conflict**: `[id]` vs `[slug]` dynamic segments at same path level caused `Error: You cannot use different slug names`. Resolved by consolidating all business-by-id endpoints under `[slug]/` (edit, follow) with internal `slug: id` destructuring. URL contract unchanged (still passes business.id).
- **Stale Prisma client**: after adding `BusinessFollow` model, the running dev server held an old `@prisma/client` in memory (global singleton in db.ts). Fixed db.ts to invalidate the singleton on schema-version change. Required a full dev-server restart to load the regenerated client.

## Verification Results
- Lint: 0 errors, 0 warnings.
- Dev server: healthy, all APIs 200.
- VLM ratings after polish: Home 8.5/10, Directory 9/10, Business Profile 9/10, Newsfeed 8/10 (all up from "good but needs work").
- Functional tests: follow toggle ✓, edit+save+persist ✓, Following page ✓, 404 handling ✓.

## Unresolved Issues / Risks
- **Dev server restart required after Prisma schema changes**: the global PrismaClient singleton isn't hot-reloadable; a full process restart is needed. Mitigated by db.ts schema-version check, but the running process must be killed+restarted manually if the system supervisor doesn't auto-restart. (This round: had to `setsid`-restart the dev server twice.)
- **Remaining VLM polish items** (minor, non-blocking): softer multi-layer shadow on business-profile header transition; service-pill active/press micro-interactions; newsfeed Post disabled-state affordance; mobile bottom-sheet for directory filters (currently uses Sheet, which is fine).
- **SEO**: still single `/` route with hash routing (noted in prior round).

## Priority Recommendations for Next Phase
1. **Phase 3 — Yoco subscription checkout**: real payment integration + webhook → subscription status updates (currently stubbed with toasts). This unlocks the Verified/Intelligence revenue path.
2. **Image uploads**: business logos/covers + post images (currently SVG initials/text-only). Use a storage bucket or base64-in-DB for MVP.
3. **Profile editing**: extend the edit pattern to user profiles (firstName/lastName/phone/bio/avatar) — the Settings tab currently toasts "coming soon".
4. **Intelligence Hub scaffolding**: procurement alerts, competitor benchmarking (clearly marked "coming soon" per spec, but architecture should be laid out).
5. **Search improvements**: PostgreSQL full-text search is noted as future; current SQLite `contains` works for MVP but consider adding a search-rank/score.

---
Task ID: STYLING-DASH
Agent: general-purpose (Z.ai Code sub-agent)
Task: Polish BlakNet dashboard overview (OverviewView) styling — 4 VLM-identified fixes, styling only.

Work Log:
- Read worklog + `src/views/dashboard/overview.tsx` + `src/app/globals.css` (verified `.card-lift`, `.card-soft`, `.btn-lift`, `.animate-fade-in-up` exist).
- Fix 1 (greeting buttons): "Add a business" → primary `btn-lift bg-cream text-ink shadow-lg hover:bg-cream/90`. "Manage businesses" → ghost secondary `btn-lift border border-cream/20 bg-transparent text-cream/80 hover:bg-cream/10 hover:text-cream` (removed `variant="outline"` to avoid shadcn outline ring overriding the cream-ghost system). Both now share `btn-lift` for tactile micro-interaction cohesion.
- Fix 2 (stat cards): removed `accent` flag from cards array; all 4 icon tiles now uniformly use `h-11 w-11 rounded-xl bg-ink text-cream shadow-sm` (was `h-10 w-10 rounded-lg` with sage variant on Notifications). Arrow `text-foreground/25` (was `/20`) with existing `group-hover:translate-x-0.5 group-hover:text-ink` preserved. Added `animate-fade-in-up` + inline `animationDelay: ${i*60}ms` for staggered mount. Kept `card-lift`.
- Fix 3 (business section): container gained `card-soft` (alongside existing `rounded-xl border border-border bg-card`). Header "Add" ghost button gained `btn-lift`. BusinessRow button: `p-3` → `p-3.5`, `transition-colors` → `transition-all`, added `hover:shadow-sm`. `gap-4` already present.
- Fix 4 (background contrast): added `card-soft` to subscription card + recent activity card (both already had `border border-border bg-card`). All four card groups (stat cards, businesses, subscription, recent activity) now share `bg-card + border border-border + soft shadow` so they sit "on" the cream background rather than floating with harsh edges. Stat cards retain `card-lift` for hover lift (its static shadow + hover lift).
- Preserved all data-fetching, hooks, props, `BusinessRow` sub-component, imports, exports. STYLING ONLY.
- Lint: `bun run lint` → 0 errors, 0 warnings (clean).
- Dev server: healthy, compiles succeed, `/api/dashboard/stats` + `/api/businesses/owner` + `/api/notifications` all 200.

Stage Summary:
- Dashboard overview styling polished to brand-aligned cohesive system: unified icon treatment, consistent ghost/primary button system on the greeting card, all panels anchored with `card-soft` shadow + `border-border` for cohesion, staggered fade-in on stat cards, tactile `btn-lift` micro-interactions across all CTAs. No new features, no API/routing/state changes. Ready for VLM re-review.

---
Task ID: STYLING-EVENTS-RES
Agent: general-purpose (Z.ai Code sub-agent)
Task: Polish BlakNet Events + Resources public views styling — 4 + 3 VLM-identified fixes, styling only.

Work Log:
- Read worklog + `src/views/public/events.tsx` + `src/views/public/resources.tsx` + `globals.css` (verified `.card-lift`, `.card-soft`, `.bg-ink-grain`, `.animate-fade-in-up` exist) + `directory.tsx` for the `bg-sage/[0.08]` + `font-semibold` active filter pattern.

### events.tsx (4 fixes)
- Fix 1 (event card hierarchy): title switched `font-display text-lg` → `font-medium text-base leading-snug tracking-tight`. Metadata footer gained `border-t border-border pt-3` divider and text color moved from `text-muted-foreground` → `text-foreground/70` for legibility. `card-lift` was already present. Button gained `h-full` so cards stretch equal-height inside the new wrapper div. Each card now wrapped in `<div className="animate-fade-in-up" style={{ animationDelay: `${i*60}ms` }}>` for staggered mount.
- Fix 2 (category filter hover): inactive pill classes changed `text-xs hover:bg-muted` → `text-sm hover:border-foreground/30 hover:bg-muted` (consistent rounded-full `px-3.5 py-1.5` kept). Active pill still `border-ink bg-ink text-cream`. Applied to both "All events" pill and the mapped category pills.
- Fix 3 (date badge legibility): inverted the date badge from light-on-dark to dark-on-light backdrop. New container: `bg-ink/85 backdrop-blur-sm text-cream rounded-lg px-2 py-1.5 shadow-md`. Day → `font-display text-lg leading-none`. Month → `text-[10px] uppercase tracking-wide text-cream/70`.
- Fix 4 (image/placeholder consistency): the entire top image area is now always `bg-ink-grain`. SVG data-uri → `<img>` with `object-contain p-8` (no crop). No-image → big branded initials placeholder rendered as `font-display text-5xl text-cream/30` via new `getInitials(title)` helper (first letters of first two words). Added a category icon overlay in the top-left corner (`h-9 w-9 rounded-lg bg-ink/40 text-cream backdrop-blur-sm`) so all cards share the same visual treatment.
- Added `getInitials` helper. Preserved `CategoryIcon`/`categoryLabel`/`isSvgDataUri` helpers. STYLING ONLY — no API/state/routing changes.

### resources.tsx (3 fixes)
- Fix 1 (card visual variety): removed the heavy `aspect-[16/7] bg-ink-grain` image block entirely. Replaced with a compact horizontal header: small icon tile `h-10 w-10 rounded-lg bg-sage/12 text-sage` placed to the LEFT of the type/category pills, with Featured pill pushed `ml-auto` on the right. Kept title (`font-display text-lg`), description (`line-clamp-2 text-sm text-muted-foreground`), and footer (author · readMinutes · "Read →"). Button gained `h-full` for equal-height grid rows.
- Fix 2 (filter sidebar grouping): FilterSidebar container gained `card-soft` + `lg:sticky lg:top-20` (removed the parent `<div className="sticky top-24">` wrapper so the sticky now lives on the sidebar itself). Added `Separator` between Filters header, Category group, Type group, and Featured-only toggle. Eyebrow labels "CATEGORY" / "TYPE" now `text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground`. Each row uses the directory pattern: `rounded-md px-2 py-1.5 hover:bg-muted/60` with active rows tinted `bg-sage/[0.08]` + label `font-semibold text-foreground` (was flat `gap-2 text-foreground/80`). Imported `Separator` from `@/components/ui/separator` and `cn` from `@/lib/utils`.
- Fix 3 (semantic icons): TYPE_ICONS mapping updated — `template: Download → LayoutTemplate`, `checklist: CheckCircle2 → CheckSquare`. Other mappings unchanged (article: FileText, guide: BookOpen, video: PlayCircle, workshop: Users). Imports swapped accordingly. Each resource card now wrapped in `<div className="animate-fade-in-up" style={{ animationDelay: `${i*60}ms` }}>` for staggered mount (matching events pattern).
- Preserved `'use client'`, all hooks/state, `useApp().navigate`, props, `Filters` interface, `MobileFilterPanel`, `EmptyState`/`SectionHeading` usage, exports. STYLING ONLY.

Verification:
- `bun run lint` → 0 errors, 0 warnings (clean).
- Dev server: healthy. `✓ Compiled in 521ms / 267ms / 99ms / 183ms / 358ms / 867ms` and no error lines in dev.log.
- HTTP probes: `GET /` 200, `GET /api/events` 200, `GET /api/resources` 200.

Stage Summary:
- Both Events and Resources views polished to a more cohesive, scannable, brand-aligned system. Events cards now have a consistent dark-grain image surface (SVG logo centered or branded initials placeholder), a dark backdrop-blur date badge, a divider above the metadata footer, and staggered fade-in. Resources cards dropped the heavy image block for a compact icon-tile + pills header, the sidebar became sticky + soft-shadow with separator-divided CATEGORY / TYPE / FEATURED groups mirroring the directory's active-row treatment, and resource-type icons are now semantically distinct (LayoutTemplate for templates, CheckSquare for checklists). No new features, no API/state/routing/prop changes. Ready for VLM re-review.

---
Task ID: CRON-QA-2
Agent: Z.ai Code (main) — web dev review cron round 2
Task: Assess status, QA via agent-browser + VLM, polish remaining views, add profile editing feature.

## Current Project Status Assessment
BlakNet was stable and functional from round 1 (home/directory/business-profile/newsfeed polished to 8.5-9/10, business editing + follow features working). This round focused on the UNPOLISHED views (pricing, events, dashboard overview, resources) + the most-requested functional gap (user profile editing, which was "coming soon").

## QA Performed
- VLM critical reviews of pricing (4 issues), events (4 issues), dashboard overview (4 issues), resources (3 issues), admin empty-state.
- agent-browser golden-path: home, pricing, events, resources, dashboard, settings — all render.
- Functional test: profile edit (fill fields → Save → "Profile updated" toast → sidebar name updates) ✓.
- Lint: 0 errors, 0 warnings throughout.

## Completed Modifications

### Styling Polish (pricing + events + dashboard + resources)
1. **Pricing** (rewritten): dark highlighted Verified card now uses `bg-ink-grain` + `ring-2 ring-sage` + shadow-2xl + scale-[1.04] + sage glow blur orb + "Most popular" badge (sage bg, ink text). CTA hierarchy fixed: highlighted card = `bg-cream text-ink` (primary), others = `bg-ink text-cream`. Feature list de-noised: removed grey X's, only shows included features with sage check-in-circle icons + "What's included" eyebrow. Bigger price (text-5xl). "Soon" badges now high-contrast (muted border + uppercase). FAQ items in individual cards (shadow-sm). Enterprise band refined. Glow header. VLM: 9/10.
2. **Events** (via subagent STYLING-EVENTS-RES): card title hierarchy (font-medium text-base), border-t divider before metadata, metadata text-foreground/70, category pills hover states (hover:border-foreground/30 hover:bg-muted), date badge now `bg-ink/85 backdrop-blur-sm text-cream` with shadow-md for legibility, consistent `bg-ink-grain` image area with large font-display initials placeholder + category icon overlay top-left, staggered fade-in-up animations. VLM: 8/10.
3. **Dashboard overview** (via subagent STYLING-DASH): greeting buttons unified (Add = primary cream with btn-lift + shadow, Manage = ghost secondary with cream border), all 4 stat card icons unified to `bg-ink text-cream h-11 w-11 rounded-xl shadow-sm`, arrow hover animation, business rows in card-soft container with hover:shadow-sm, all cards given `card-soft` + `border border-border` for cohesion (no harsh floating). Staggered fade-in-up on stat cards. VLM: 8/10.
4. **Resources** (via subagent): removed heavy dark image block, compact icon tile (h-10 w-10 sage-tinted) left of type pills, filter sidebar in card-soft sticky container with Separator groups + uppercase eyebrows, active filter rows tinted, semantic type icons (LayoutTemplate, CheckSquare, etc.), staggered animations. VLM: 8/10.

### New Feature: User Profile Editing (Settings page, fully functional)
- **`GET /api/profile`** — returns user + Profile record (headline, location, website, linkedin).
- **`PATCH /api/profile`** — validates + updates User (firstName, lastName, phone, bio, profileImage) + Profile (headline, location, website, linkededin) in a transaction. Caps bio at 500 chars, profileImage at 200KB (data-uri).
- **Settings view rewritten**: expanded Profile form (firstName, lastName, headline, phone, location, website, linkedin, bio with char counter). Real Save → PATCH → toast "Profile updated" → `refreshAuth()` so the sidebar/avatar updates live. Loading state with Loader2 spinner.
- **Avatar upload**: file input (hidden) triggered by a Camera button overlay on the avatar. Client-side `FileReader` converts image to data-uri → PATCH → live update. Validates type + size (≤2.5MB). Remove-avatar button. Ring-4 sage halo around avatar.
- **Profile completion card**: checklist (headline, location, phone, bio, avatar, website/linkedin) with sage check / empty circle indicators.
- Verified: edited Thandiwe's name + headline → saved → sidebar updated to "Thandiwe N. Mokoena" ✓.

## Verification Results
- Lint: 0 errors, 0 warnings.
- Dev server: healthy, all APIs 200 (home, /api/profile 401 when unauthed ✓).
- VLM ratings: Pricing 9/10, Events 8/10, Dashboard 8/10, Resources 8/10.
- Functional: profile edit + save + live refresh ✓, avatar upload UI present ✓.

## Unresolved Issues / Risks
- **Avatar storage**: uses data-uri in DB (User.profileImage) — fine for MVP (<200KB) but not production-scale. A real object store (S3/Supabase Storage) should replace this later.
- **Password change**: still stubbed ("coming soon") — requires a proper bcrypt verify + rehash endpoint.
- **Notification preferences**: toggles are cosmetic (toast "Saved") — no persistence yet.
- **Minor VLM items**: events cards could use hover lift (card-lift may not be applied to the button wrapper), dashboard section headers could be bolder, resource card text truncation consistency. All non-blocking.

## Priority Recommendations for Next Phase
1. **Yoco subscription checkout** (Phase 3 revenue path) — real payment integration + webhook → subscription status updates.
2. **Password change endpoint** — bcrypt verify current + rehash new (closes the last "coming soon" stub in Settings).
3. **Notification preferences persistence** — store the 3 channel toggles on User/Profile + a notifications settings table for granular types.
4. **Image uploads for businesses** — extend the data-uri pattern to business logos/covers (or introduce a real storage bucket).
5. **Hover-lift sweep** — ensure `card-lift` is on all clickable card wrappers (events, resources) for consistent tactile feedback.

---
Task ID: STYLING-NET-NOTIF
Agent: Z.ai Code (subagent) — Network + Notifications styling polish
Task: VLM-identified styling fixes on the Dashboard Network and Notifications views. STYLING ONLY.

## Files Edited
1. `src/views/dashboard/network.tsx` — `NetworkView` (3 fixes)
2. `src/views/dashboard/notifications.tsx` — `NotificationsView` (2 fixes)

## Changes — Network (`network.tsx`)
- **Fix 1 — Contact card hierarchy & density**:
  - Avatar restyled to `h-11 w-11 rounded-xl bg-ink font-display text-cream shadow-sm` (matches dashboard stat-card icon system, was `h-10 w-10 rounded-full`).
  - Name → `text-sm font-medium leading-tight line-clamp-1` (was `truncate`, fixes truncated job titles by allowing wrap-then-clamp).
  - Role line (position · company) → `text-xs text-muted-foreground line-clamp-1` (was `truncate`).
  - Category `Pill` moved from header-right to below the name (so the header-right can host the hover-reveal action buttons); kept `categoryTone()` mapping.
  - Card root gained `group flex h-full flex-col card-lift card-soft` (kept `rounded-xl border border-border bg-card p-5`) — tactile hover-lift + soft resting shadow.
  - Each card wrapped in `<div className="animate-fade-in-up" style={{ animationDelay: \`${i*50}ms\` }}>` for staggered mount.
  - Edit/Delete actions extracted from the footer into icon buttons in the header right column: `<Button size="icon" variant="ghost" className="h-7 w-7 ...">` with `Pencil` / `Trash2` icons, wrapped in `opacity-0 transition-opacity duration-200 group-hover:opacity-100` container for hover-reveal. Added `aria-label` on each.
  - Footer simplified: removed Edit/Delete, now just the timestamp right-aligned via `justify-end`, restyled to `text-[11px] text-foreground/40` (was `text-muted-foreground` left-aligned).
- **Fix 2 — Filter UI: pills → Select dropdown**:
  - Removed the entire `CategoryPill` helper component (no longer used).
  - Filter row replaced with a flex row: search input (`w-full sm:w-64`) + `<Select>` dropdown (`h-9 w-[160px]`) showing "All types" + all `CONTACT_CATEGORIES`. `SelectTrigger` gets `aria-label="Filter by type"`.
  - Search input kept identical (Search icon, `pl-9`).
  - Page-header "Add contact" button kept on the right of the page header (not moved).
- **Fix 3 — Premium polish on Add-contact flow**:
  - Both "Add contact" buttons (page header + empty state) gained `btn-lift shadow-md shadow-ink/15` on top of existing `bg-ink text-cream hover:bg-ink/90`.
  - Results grid changed from `grid gap-4 sm:grid-cols-2 xl:grid-cols-3` → `grid gap-4 lg:grid-cols-2` (more compact, denser layout per spec).
  - Loading skeleton grid also changed to `lg:grid-cols-2` (4 cards) and gained `card-soft` to match the resting card style.
  - Email/phone/website rows standardized to `text-xs text-foreground/70` with `hover:text-ink` and icon `h-3.5 w-3.5 text-muted-foreground` (was `text-sm`).

## Changes — Notifications (`notifications.tsx`)
- **Fix 1 — Unread dot consistency**:
  - Verified: every unread item renders the sage dot (`bg-sage h-2 w-2 rounded-full` with `aria-label="unread"`) AND the `bg-sage/[0.04]` row tint; read items get neither, with muted `bg-muted text-muted-foreground` icon. Logic was already correct — left intact.
  - Removed the right-side `<Check className="mt-1 h-3.5 w-3.5 ..." />` element that previously appeared on unread rows (was confusing — the whole row is already clickable to mark read).
  - Added `title={n.read ? undefined : "Mark as read"}` to the row button for a subtle native hover tooltip on unread items, keeping the sage dot as the sole persistent unread indicator.
  - Removed the now-unused `Check` import from `lucide-react`.
- **Fix 2 — Icon alignment & polish**:
  - Verified `items-start` on row, `mt-0.5` on icon span, `min-w-0 flex-1` on text block, `mt-1` on timeAgo — all already correct.
  - Each `<li>` now wrapped with `className="animate-fade-in-up"` and `style={{ animationDelay: \`${i*40}ms\` }}` for staggered mount (added `i` index to the `.map`).
  - Notifications container gained `card-soft` (was `overflow-hidden rounded-xl border border-border bg-card`).

## Preservation
- Both files keep `'use client'`, all imports (except removed `Check`), all hooks, all state (`contacts`, `loading`, `error`, `search`, `category`, `dialogOpen`, `editing`, `form`, `submitting`, `deleteId`, `deleting` / `items`, `loading`, `error`, `markingAll`), all API calls (`/api/contacts`, `/api/contacts/:id`, `/api/notifications`, `/api/notifications/read`), all event handlers, the `NotificationIcon` sub-component, and the named exports `NetworkView` / `NotificationsView`. STYLING ONLY — no behavior, data-fetch, routing, or signature changes.

## Verification
- `bun run lint` → 0 errors, 0 warnings (clean).
- Dev server: healthy. `GET / 200` (247ms compile+render), `✓ Compiled in 168ms / 186ms / 291ms / 188ms` with no error lines.
- No TypeScript or runtime errors observed.

## Stage Summary
Both Dashboard views polished to the brand system. Network: denser 2-column card grid with tactile `card-lift`/`card-soft` cards, hover-reveal icon actions, an `h-11 w-11 rounded-xl` avatar matching the dashboard stat-card system, line-clamped name/role to fix truncation, a cleaner Select-based category filter replacing the pill row, and a `btn-lift`-shaded primary "Add contact" CTA. Notifications: container gained `card-soft`, each row staggers in with `animate-fade-in-up` (40ms increments), the confusing right-side checkmark is gone (replaced with a native "Mark as read" tooltip), and the sage dot + tint remain the sole consistent unread indicators. No new features, no API/state/routing changes. Ready for VLM re-review.

---
Task ID: STYLING-PLAN-ABOUT
Agent: general-purpose (Z.ai Code sub-agent)
Task: Polish BlakNet Plan (dashboard) + About (public) views styling — 3 + 3 VLM-identified fixes, styling only.

Work Log:
- Read worklog + `src/views/dashboard/plan.tsx` + `src/views/public/about.tsx` + `src/components/blaknet/section.tsx` (EmptyState + SectionHeading contracts) + `src/components/ui/accordion.tsx` (chevron is direct `<svg>` child of AccordionTrigger → targetable via `[&:hover>svg]:text-sage`) + `src/app/globals.css` (verified `.card-lift`, `.card-soft`, `.glass`, `.animate-fade-in-up`, `.bg-ink-grain`, `.bg-cream-grain` exist) + `src/components/blaknet/logo.tsx` (LogoMark path B uses hardcoded `#F6F6DF` fill so `text-cream/10` only affects the rect; container `opacity-[0.4]` × `text-cream/10` gives B ~40% visible opacity → matches VLM "distracting").

### plan.tsx (3 fixes)
- Fix 1 (excluded feature hierarchy + "What's included" eyebrow): in each plan-tier card feature list, reduced excluded feature weight to `text-muted-foreground/50` (light) / `text-cream/40` (dark) and X icon to `text-muted-foreground/30` (light) / `text-cream/25` (dark). Included features stay strong: `text-foreground/80` (light, was `text-foreground`) / `text-cream/90` (dark, unchanged). Check icon remains `text-sage`. Added an eyebrow above each `<ul>`: `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground` (light) / `text-cream/60` (dark) reading "What's included" (entity-encoded `'` to avoid raw apostrophe). `<ul>` margin tightened from `mt-5` → `mt-3` to compensate for the new eyebrow row.
- Fix 2 (billing history empty state container): replaced the bare `EmptyState` with a proper card: `rounded-xl border border-border bg-card p-8 text-center card-soft`. Receipt icon now sits in a tinted circle `mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage/15 text-sage` above the heading. Section header "Billing history" already used `font-display text-lg` + Receipt icon (no change needed). EmptyState import retained (still used for the error-state branch).
- Fix 3 (FAQ borders & hover): removed the outer `<div className="rounded-xl border border-border bg-card px-4">` wrapper. Each AccordionItem now has its own container: `mb-3 rounded-xl border border-border bg-card px-5 shadow-sm card-lift last:mb-0`. AccordionTrigger classes added: `hover:no-underline` (overrides default `hover:underline`) + `[&:hover>svg]:text-sage` (recolors the chevron sage on hover). Verified chevron is a direct `<svg>` child of the trigger in `accordion.tsx`.

### about.tsx (3 fixes)
- Fix 1 (hero contrast & watermark clutter): hero body paragraph `text-cream/70` → `text-cream/65` (per spec literal directive). Watermark LogoMark container `opacity-[0.4]` → `opacity-[0.04]` — this reduces the visible "B" opacity from ~40% to ~4% (subtle, not distracting), since the B path has hardcoded `#F6F6DF` fill so it scales linearly with the container opacity. Tagline "Get Exposed. Get Connected. Get Ready." kept `text-sage italic` (already correct per spec) and reduced size `text-xl sm:text-2xl` → `text-lg sm:text-xl` so it reads clearly secondary to the `text-4xl→[4.2rem]` headline.
- Fix 2 (journey stepper responsive): desktop horizontal layout switched from `grid grid-cols-7 gap-2` to `flex gap-2` with each `<li>` given `flex-1` (per spec). Step label text reduced from `text-[12px]` to `text-[11px] sm:text-xs`. Mobile vertical layout rebuilt: removed the per-step bordered card around the label; each step is now a clean row (number circle left + label right, `text-left`). Added a vertical connector line `pointer-events-none absolute bottom-6 left-[18px] top-6 w-px bg-border` positioned to run through the center of the h-9 (=36px) number circles (center at 18px from left). Step circles gained `ring-4 ring-background` on mobile so the vertical line visually breaks around each node (matching the desktop treatment). Step label text matches desktop: `text-[11px] sm:text-xs`.
- Fix 3 (stats impact): rebuilt the stats bar inside a `glass` container with `rounded-2xl` (was a flat `bg-cream/10 border border-cream/10` grid with `gap-px`). Each stat: bigger numbers `font-display text-4xl sm:text-5xl text-cream` (was `text-3xl sm:text-4xl`). Added a sage glow behind each number: `pointer-events-none absolute inset-x-2 top-1/2 -z-0 h-24 -translate-y-1/2 bg-sage/20 blur-3xl`. Numbers and labels wrapped in `relative` so they sit above the glow. Labels `text-cream/55` → `text-cream/50` (per spec). Added `animate-fade-in-up` with `animationDelay: ${i * 80}ms` inline style for staggered mount.

Verification:
- STYLING ONLY: preserved `'use client'`, all imports (including `EmptyState` — still used by error branch in plan.tsx), hooks, props, helper functions (`StatusBadge`, `planRank`, `planNameLabel`, `planPriceLabel`, `planNote`, `isRecent`), state (`subscription`, `loading`, `error`), API call (`/api/subscriptions`), `useToast` usage, `PLANS`/`STATS` constants usage, component exports/signatures (`PlanView`, `AboutView`). No new features, no API/routing/state changes.
- Lint: `bun run lint` → 0 errors, 0 warnings (clean, no output).
- Dev server: `GET / 200 in 223ms` after edits, `✓ Compiled in 356ms / 284ms` with no compile/runtime errors.

Stage Summary:
- Both Plan and About views polished to the brand-aligned cohesive system per VLM direction. Plan: feature lists now have clear included/excluded hierarchy (sage Check + dark text vs. muted/30 X + faded text) with a "What's included" eyebrow; the billing-history empty state lives in a proper `card-soft` container with a sage-tinted Receipt circle; FAQ items now sit in their own `card-lift` cards with sage chevron on hover (no longer blending into the background). About: hero body text and watermark decluttered (watermark opacity 0.4 → 0.04, body text-cream/65), italic sage tagline reads clearly secondary to the headline; journey stepper is now genuinely responsive (horizontal `flex gap-2` on lg, vertical flex-col with a vertical connector line on mobile, unified `text-[11px] sm:text-xs` labels, text-center/text-left as needed); stats bar lives in a `glass rounded-2xl` container with bigger `text-4xl sm:text-5xl` numbers, a sage glow behind each, and a staggered `animate-fade-in-up` mount. No new features, no API/state/routing/prop changes. Ready for VLM re-review.

---
Task ID: CRON-QA-3
Agent: Z.ai Code (main) — web dev review cron round 3
Task: Assess status, QA via agent-browser + VLM, polish remaining dashboard views, add password change feature, fix plan date bug.

## Current Project Status Assessment
BlakNet was stable and polished across home/directory/business-profile/newsfeed/pricing/events/dashboard-overview/resources (all 8-9/10). This round focused on: (a) the remaining unpolished views (network CRM, notifications, plan, about), (b) fixing a plan-page date-logic bug, and (c) closing the last "coming soon" stub — the password change feature.

## QA Performed
- VLM critical reviews of network CRM (3 issues), notifications (2 issues), plan (3 issues), about (3 issues).
- Functional test: password change (fill → Save → "Password updated" → sign out → login with new password ✓).
- Functional test: notifications mark-all-as-read (works, sidebar badge clears on navigation ✓).
- Lint: 0 errors, 0 warnings throughout.

## Completed Modifications

### Bug Fixes
1. **Plan page date logic**: Labels "Started/Renews" with future-dated demo data were misleading. Changed to "Member since" (shows "Just activated" if <7 days old) + "Renews on" (only when ACTIVE) + "Billing" (provider). Added `isRecent()` helper.
2. **Password API 500**: `cookies()` in Next.js 16 returns a Promise — fixed `(await import("next/headers")).cookies()` to `(await cookies())` with a proper top-level import. Endpoint now returns 200/403 correctly.

### New Feature: Password Change (fully functional, closes last "coming soon" stub)
- **`POST /api/auth/password`** — verifies current password (hashPassword compare), validates new password (≥6 chars, ≤128, different from current), updates hash, and **invalidates all other sessions** for security (keeps the current session via cookie token). Returns 403 if current password wrong, 400 for validation errors.
- **Settings view**: `savePassword` now calls the real API with loading state (Loader2 spinner on Save button), client-side validation (all fields filled, ≥6 chars, passwords match), success toast "Password updated · Your other devices have been signed out", error toasts for incorrect password / validation.
- Verified: changed demo password blaknet123 → newpass456 → signed out → logged in with newpass456 → dashboard loaded ✓. (Then reset demo password back to blaknet123 for future rounds.)

### Styling Polish (network + notifications + plan + about)
1. **Network CRM** (via subagent STYLING-NET-NOTIF): contact cards now `card-lift card-soft` with hover-reveal Edit/Delete icon buttons (opacity-0 group-hover:opacity-100), avatar upgraded to `h-11 w-11 rounded-xl bg-ink font-display text-cream shadow-sm` (matches stat-card system), name/role hierarchy fixed (line-clamp-1), category pill below name, timestamp muted right-aligned, replaced horizontal category pill row with a compact `Select` dropdown "Filter by type", 2-column grid on lg, staggered fade-in-up animations, Add-contact button `btn-lift shadow-md`. VLM: 8/10.
2. **Notifications** (via subagent): removed confusing right-side Check icon (the sage dot + row tint are the sole unread indicators), added `title="Mark as read"` tooltip, `animate-fade-in-up` stagger on rows, `card-soft` on container. VLM: consistent.
3. **Plan** (via subagent STYLING-PLAN-ABOUT): excluded features now `text-muted-foreground/50` with muted X (clear hierarchy vs included), "What's included" eyebrow on each tier card, billing-history empty state in a proper `card-soft` container with Receipt icon, FAQ items in individual `card-lift` cards with sage chevron hover. VLM: 8.5/10.
4. **About** (via subagent): hero body text contrast increased (cream/65), "B" watermark opacity reduced to 0.04 (subtle), tagline smaller (text-lg), 7-step journey stepper now responsive (horizontal on lg, vertical on mobile with connector line), stats in `glass` container with sage glow + bigger numbers (text-5xl) + staggered animation. VLM: 8.5/10.

## Verification Results
- Lint: 0 errors, 0 warnings.
- Dev server: healthy, all APIs 200.
- VLM ratings: Network 8/10, Plan 8.5/10, About 8.5/10, Notifications consistent.
- Functional: password change + session invalidation ✓, notifications mark-read ✓, plan dates fixed ✓.

## Unresolved Issues / Risks
- **Avatar storage**: still data-uri in DB (fine for MVP, not production-scale).
- **Notification preferences**: toggles still cosmetic (no persistence) — low priority.
- **Minor VLM items**: network empty/loading states could use shimmer; about "Our Why" 2×2 grid could integrate better with narrative; plan empty-state could have illustration. All non-blocking.
- **Demo password**: was temporarily changed during password-change testing, then reset to `blaknet123` (documented credential restored).

## Priority Recommendations for Next Phase
1. **Yoco subscription checkout** (Phase 3 revenue path) — still the top functional gap.
2. **Notification preferences persistence** — store the 3 channel toggles on User/Profile.
3. **Business image uploads** — extend the data-uri avatar pattern to business logos/covers.
4. **Admin views expansion** — the admin console currently only has overview + verification; spec calls for Users, Businesses, Industries, Events, Newsfeed, Resources, Reviews, Subscriptions, Reports, Settings management pages.
5. **Hover-lift sweep** — ensure all clickable card wrappers have `card-lift` for consistent tactile feedback.

---
Task ID: ADMIN-VIEWS
Agent: general-purpose (Z.ai Code sub-agent)
Task: Build 5 admin management views (Users, Businesses, Reviews, Subscriptions, Industries).

Work Log:
- Read prior worklog + AdminShell (src/components/admin/shell.tsx) + existing AdminOverviewView & AdminVerificationView (style/pattern reference), lib/{store,api,types,format,utils}, components/blaknet/{badges,section}, ui/{button,input,skeleton,select,switch,tabs,avatar,badge}, hooks/use-toast, app/page.tsx (router wiring), and all 5 admin API routes (admin/users, admin/businesses, admin/reviews, admin/subscriptions, admin/industries) to verify exact response shapes (including `qs({q,role,page,pageSize})`, `qs({status,page})`, summary `{byPlan,byStatus}`, etc.). Confirmed dev server healthy + admin login works (admin@blaknet.co.za).
- Created 5 view files, all `"use client"` + TypeScript strict (no `any`), each following the LoadState discriminated-union pattern (`loading | forbidden (403) | error | ready`) used by overview.tsx/verification.tsx with cancelled-flag `useEffect` + `reloadKey` for retries:
  1. `src/views/admin/users.tsx` → `AdminUsersView`:
     * Header "Users" + subtitle "Manage BlakNet members, roles and plans." with sage "Members" Pill.
     * Search input (debounced 300ms → `filters.q`) + role Select (All / USER / BUSINESS_OWNER / ADMIN / SUPER_ADMIN) + result count "Showing X–Y of N users".
     * Responsive: hidden sm+ table with columns (User, Role, Plan, Businesses, Joined) + mobile cards. Each row: Avatar (initials `bg-ink text-cream`), name+email, role Pill (sage for ADMIN, ink for SUPER_ADMIN, cream for BUSINESS_OWNER, neutral for USER), plan Pill (sage VERIFIED, ink INTELLIGENCE, neutral STARTER), businessCount with Building2 icon, formatDate(createdAt).
     * Pagination Prev/Next + "Page X of Y" (PAGE_SIZE=20). Staggered `animate-fade-in-up` (40ms × index) on rows.
     * Loading skeleton (header + filter bar + 6 pulse rows), empty EmptyState (Users, "No users found."), 403 EmptyState (ShieldCheck + Back-to-dashboard), error EmptyState (AlertCircle + Try again bumps reloadKey).
  2. `src/views/admin/businesses.tsx` → `AdminBusinessesView`:
     * Header "Businesses" + subtitle + sage "Directory" Pill.
     * Search (debounced) + verification Select (All/VERIFIED/PENDING/NOT_VERIFIED/REJECTED) + featured Select (All/Featured only/Not featured) + result count.
     * Each row (card): logo (img or initial tile), name (clickable → `navigate({name:"business",slug})` with ArrowRight hover animation), tagline, industry Pill, VerifiedBadge, Featured Pill (Sparkles), location MapPin, owner email+name, reviewCount (Star), followerCount (Users), views (Eye), createdAt. Staggered fade-in-up.
     * **Featured toggle**: Switch on each row PATCHes `/api/admin/businesses` with `{id, featured: !current}` — optimistic update + revert on failure + toast "Featured"/"Unfeatured". `togglingId` state for disabled state + Loader2 spin in toggling row.
     * **Verification override**: Select on each row (VERIFIED/NOT_VERIFIED/REJECTED) PATCHes with `{id, verificationStatus}` — optimistic + revert + toast "Verification updated". `verifyChangingId` state + Loader2 spinner.
     * Pagination. Skeleton. Empty state. Forbidden/error EmptyStates.
  3. `src/views/admin/reviews.tsx` → `AdminReviewsView`:
     * Header "Reviews" + subtitle + sage "Moderation" Pill.
     * Tabs (Pending/Approved/Rejected) — default Pending. Switching tab resets page + sets loading + fetches `/api/admin/reviews?status=X&page=Y`.
     * Each review card: business name (clickable → profile, ArrowRight hover), reviewerName + reviewerCompany, star rating (`<Stars>` helper rendering 5 lucide Star icons filled sage vs muted), review text (whitespace-pre-wrap), timeAgo + formatDate.
     * **Actions** (only when status===PENDING): "Approve" (sage bg, ink text, CheckCircle2) + "Reject" (destructive outline, XCircle) → PATCH `/api/admin/reviews` `{id, status}`. Optimistic removal from list (filter out + total-1) + toast on success; revert on failure (re-insert + total+1). `actioningId` for loading state (Loader2).
     * For APPROVED/REJECTED tabs: only show a status Pill (no actions).
     * Empty states per tab: Pending → "No reviews awaiting moderation.", Approved → "No approved reviews.", Rejected → "No rejected reviews." (using local `emptyByStatus` map).
     * Pagination. Skeleton. Forbidden/error EmptyStates.
  4. `src/views/admin/subscriptions.tsx` → `AdminSubscriptionsView`:
     * Header "Subscriptions" + subtitle + sage "Revenue" Pill.
     * **3 summary cards** in `grid gap-4 sm:grid-cols-3`: Total active (CreditCard, ink tile — sum of byStatus.ACTIVE + byStatus.PAST_DUE), Verified plan (Crown, sage tile — byPlan.VERIFIED), Intelligence plan (TrendingUp, ink tile — byPlan.INTELLIGENCE). Each: icon tile, big font-display number (formatNumber), label, muted subtitle, animate-fade-in-up stagger.
     * Status filter Select (All/ACTIVE/FREE/PAST_DUE/CANCELLED/EXPIRED) + result count.
     * Responsive table (sm+) with columns (User, Plan, Status, Provider, Started, Renews) + mobile cards. Each row: Avatar (initials ink/cream), name+email, plan Pill (sage VERIFIED, ink INTELLIGENCE, neutral STARTER), status Pill (sage ACTIVE, cream PAST_DUE, neutral others), provider (font-mono or "—"), startDate (formatDate or "—"), endDate (formatDate or "—").
     * Read-only (no actions per MVP spec). Pagination. Skeleton. Empty state. Forbidden/error EmptyStates.
  5. `src/views/admin/industries.tsx` → `AdminIndustriesView`:
     * Header "Industries" + subtitle + sage "Categories" Pill. Right-side stats strip card: Building2 + total businesses (sum of businessCount across industries) + "businesses" label.
     * Summary row: industries count + sub-industries count + italic "Editing industries is coming soon." note.
     * `grid gap-4 sm:grid-cols-2 lg:grid-cols-3` of industry cards: name (font-display), slug (muted), big businessCount (font-display 3xl) + "businesses" label, sub-industries as Pills (neutral tone) — or "No sub-industries." italic note when empty. Read-only (no add/edit/delete — "coming soon" notice per spec).
     * Skeleton (9 pulse cards), empty EmptyState (Sparkles, "No industries yet."), forbidden/error EmptyStates.
- Wired all 5 views into `src/app/page.tsx`: added 5 imports + 5 explicit route branches inside `<AdminShell>` block (admin-users/businesses/reviews/subscriptions/industries). Preserved all other route logic (overview, verification) and authed-redirect effect untouched.
- Lint result: `bun run lint` → **0 errors, 0 warnings** across the whole project (my 5 new view files + page.tsx edit contribute no new errors or warnings; pre-existing warnings already eliminated by prior agent lint-fix).
- TypeScript: `bunx tsc --noEmit` → 0 errors in my files (pre-existing errors only in examples/, skills/, next.config.ts, and an unrelated src/app/api/businesses/[slug]/route.ts which references a non-existent `_count.follows`).
- API smoke test: logged in as admin@blaknet.co.za → all 5 admin endpoints return 200 with correct shapes:
  * `/api/admin/users?pageSize=3` → `{total:13,page:1,pages:2,items:[{id,email,firstName,lastName,role,plan,phone,createdAt,businessCount}]}` ✓
  * `/api/admin/businesses?pageSize=2` → `{total:13,page:1,pages:2,items:[{id,name,slug,tagline,industry:{...},province,city,logoUrl,verificationStatus,featured,views,createdAt,owner:{...},reviewCount,followerCount}]}` ✓
  * `/api/admin/reviews?status=PENDING&pageSize=3` → `{total:0,items:[]}` ✓ (no pending reviews seeded)
  * `/api/admin/subscriptions?pageSize=2` → `{total:1,pages:1,summary:{byPlan:{VERIFIED:1},byStatus:{ACTIVE:1}},items:[{id,plan,status,provider,startDate,endDate,createdAt,user:{...}}]}` ✓
  * `/api/admin/industries` → `{items:[{id,name,slug,icon,businessCount,subIndustries:[{id,name,slug}]}]}` ✓ (12 industries with sub-industries)
- Dev server confirmation: dev.log shows multiple `✓ Compiled in Nms` lines after file additions + wiring, no compile/runtime errors in my views. `GET / 200` after admin cookie.

Stage Summary:
- All 5 admin management views are built, lint-clean, type-clean, and wired into the hash router via `src/app/page.tsx`. Each view reuses the BlakNet brand system (ink/cream/sage, font-display, Pill, VerifiedBadge, EmptyState, animate-fade-in-up), the api client with `qs()` query builder, the hash router (navigate), useToast for feedback, and shadcn/ui primitives (Button, Input, Skeleton, Avatar, Select, Switch, Tabs, Badge). Every view handles loading (Skeleton), empty (EmptyState), forbidden (403 → EmptyState ShieldCheck + Back-to-dashboard), and error (EmptyState AlertCircle + Try again) states. Optimistic updates with revert-on-failure + toasts are implemented for business featured toggles, verification overrides, and review approve/reject actions. Staggered fade-in-up animations applied across rows/cards. Read-only views (Industries, Subscriptions) clearly mark "coming soon" for future write capabilities per MVP scope.
- Admin sidebar NAV already includes all 5 routes (Overview / Verification / Users / Businesses / Reviews / Subscriptions / Industries) — all 7 admin sections now resolve to real content. Only Events/Newsfeed/Resources/Reports/Settings remain as "Soon" placeholders per the COMING_SOON list in the shell.
- Next: Phase 3 Yoco subscription activation webhook (still the top functional gap per prior worklog), and image uploads for business logos + post images.

---
Task ID: CRON-QA-4
Agent: Z.ai Code (main) — web dev review cron round 4
Task: Assess status, QA, expand admin console with 5 management views (Users, Businesses, Reviews, Subscriptions, Industries).

## Current Project Status Assessment
BlakNet was stable and fully polished across all public + dashboard views (8-9/10 VLM), with all "coming soon" stubs closed (profile editing, business editing, password change, follow). The biggest remaining functional gap was the **admin console** — only Overview + Verification existed; the spec calls for Users, Businesses, Industries, Events, Newsfeed, Resources, Reviews, Subscriptions, Reports, Settings management. This round focused on expanding the admin console.

## QA Performed
- Verified dev server healthy, all existing APIs 200.
- Confirmed demo user correctly blocked from admin (403 → "Admin access required").
- Logged in as admin, verified admin overview renders with all stat cards.
- Identified admin nav had 10 items marked "SOON" — the core gap.

## Completed Modifications

### Admin Console Expansion — 5 new management views + 5 new API endpoints

**New API endpoints** (all admin-guarded with `requireAdmin()` helper):
1. `GET /api/admin/users` — paginated user list with search (q) + role filter, includes businessCount per user.
2. `GET /api/admin/businesses` — paginated business list with search + verification + featured filters, includes owner + review/follower counts.
3. `PATCH /api/admin/businesses` — update a business (featured toggle, verification override).
4. `GET /api/admin/reviews` — paginated review list filtered by status (PENDING/APPROVED/REJECTED), includes business info.
5. `PATCH /api/admin/reviews` — approve/reject a review.
6. `GET /api/admin/subscriptions` — paginated subscription list + summary (byPlan, byStatus counts) + user info.
7. `GET /api/admin/industries` — industries with businessCount + sub-industries.
- Created `src/lib/admin-guard.ts` (`requireAdmin()` helper) to DRY the admin auth check.

**New admin views** (via subagent ADMIN-VIEWS):
1. **AdminUsersView** — search + role filter Select, responsive table with avatar initials, name/email, role pill (sage for ADMIN), plan pill, businessCount, createdAt, pagination.
2. **AdminBusinessesView** — search + verification + featured filters, business rows with logo/name (clickable → public profile), owner, review/follower/view counts, **featured Switch toggle** (optimistic PATCH), **verification Select override** (PATCH), pagination.
3. **AdminReviewsView** — Pending/Approved/Rejected Tabs, star ratings, business name (clickable), Approve (sage) / Reject (destructive) buttons with optimistic removal + revert, per-tab empty states.
4. **AdminSubscriptionsView** — 3 summary cards (Total active, Verified plan, Intelligence plan from `summary.byPlan/byStatus`), status filter, subscription rows with user avatar, plan pill (sage/ink/neutral by tier), status badge, provider, dates.
5. **AdminIndustriesView** — read-only grid of industry cards (font-display name, slug, businessCount, sub-industries as pills).

**Wiring**:
- Added 5 new routes to `Route` type (`admin-users`, `admin-businesses`, `admin-reviews`, `admin-subscriptions`, `admin-industries`).
- Added 5 route parsers to `store.ts` `parseHash`.
- Updated `AdminShell` NAV: moved Users, Businesses, Reviews, Subscriptions, Industries from "Coming soon" to active nav items (7 active + 5 still coming soon: Events, Newsfeed, Resources, Reports, Settings).
- Wired 5 route branches into `page.tsx` `<AdminShell>`.

## Verification Results
- Lint: 0 errors, 0 warnings.
- Dev server: healthy, all APIs 200.
- Functional tests (agent-browser as admin):
  - Admin Users: shows 13 users with search + role filter ✓.
  - Admin Businesses: shows 13 businesses, featured Switch toggle works (PATCH → optimistic update → toast) ✓.
  - Admin Reviews: renders with Pending/Approved/Rejected tabs ✓.
  - Admin Subscriptions: renders with 3 summary cards + subscription rows ✓.
  - Admin Industries: renders industry grid ✓.
- VLM rating: Admin Businesses 8/10.
- Admin sidebar now has 7 active nav items (was 2).

## Unresolved Issues / Risks
- **Admin Events/Newsfeed/Resources/Reports/Settings** still "coming soon" (5 items) — lower priority since the public versions exist and are read-only from admin perspective.
- **Avatar storage**: still data-uri in DB (fine for MVP).
- **Notification preferences**: toggles still cosmetic.
- **Minor VLM item**: admin businesses pagination buttons could be more visible; empty-state design could be richer.

## Priority Recommendations for Next Phase
1. **Yoco subscription checkout** (Phase 3 revenue path) — still the top functional gap.
2. **Business image uploads** — extend the data-uri avatar pattern to business logos/covers.
3. **Admin Events/Newsfeed/Resources management** — complete the remaining 5 admin views.
4. **Admin user detail / impersonation** — view a user's businesses, contacts, activity.
5. **Analytics dashboard** — the Intelligence plan promises live performance dashboards; scaffold the architecture.

---
Task ID: IMAGES-AND-ADMIN
Agent: Z.ai Code (sub-agent) — image upload + 3 admin views

## Work Log

### Task A — Business image upload in edit dialog
**File edited:** `src/views/dashboard/business-detail.tsx`
- Imported `ImageUpload` from `@/components/blaknet/image-upload`.
- Added `logoUrl: string | null` and `coverUrl: string | null` to `EditFormState`.
- Prefilled them from `business.logoUrl` / `business.coverUrl` in `editFormFromBusiness`.
- Added both fields to `buildEditPayload` (so they ride the existing PATCH `/api/businesses/${id}/edit` JSON body — the endpoint already accepts them).
- Added both fields to `editBusinessMerge` (local fallback).
- UI: inserted a "Brand images" bordered sub-card at the TOP of the Details tab (before the name field). Contains a Logo `ImageUpload` (aspect="square", label="Upload logo") on the left and a Cover `ImageUpload` (aspect="wide", label="Upload cover") on the right. Helper text: "A logo helps your business stand out in the directory." All existing edit-dialog functionality preserved (name, tagline, industry, services & products tab).

### Task B — 3 admin management views
**New files (all `'use client'`, TypeScript strict, no `any`):**

1. `src/views/admin/events.tsx` → `AdminEventsView`
   - Fetches `GET /api/events`.
   - Category Select (All + networking/workshop/seminar/conference/training/webinar/funding/competition/learnership/meetup) + search input + live result count.
   - Desktop table + mobile card variants. Each event shows: title (clickable → `navigate({ name: "event", slug })`), category Pill (toned by category), startDate (formatDate), location or "Online" badge, attendees count (from `_count.attendees`), capacity.
   - Category tone helper gives sage/ink/cream variation.
   - Note: "Event creation and editing coming to business owners soon."
   - Loading (Skeleton), empty (EmptyState), error (EmptyState + Try again) states + staggered fade-in-up.

2. `src/views/admin/newsfeed.tsx` → `AdminNewsfeedView`
   - Fetches `GET /api/posts`.
   - Post-type Select (All + text/announcement/opportunity) + result count.
   - Card layout per post: author Avatar (initials) + name + email, post-type Pill (toned), title (if any, font-display), content (`line-clamp-3`), createdAt (timeAgo) + formatDate in footer, views (Eye), likes count (Heart), comments count (MessageCircle). If business attached, shows business name with Building2 icon.
   - Note: "Post moderation tools coming soon."
   - Loading, empty, error states + staggered animations.

3. `src/views/admin/resources.tsx` → `AdminResourcesView`
   - Fetches `GET /api/resources`.
   - Category Select (All + starting/compliance/bbbee/finance/marketing/sales/operations/hr/legal/procurement/funding/strategy/technology) + type Select (All + article/guide/template/checklist/video/workshop) + result count.
   - Desktop table + mobile card variants. Each resource shows: title (clickable → `navigate({ name: "resource", slug })`), featured star, type Pill (toned by type), category Pill (neutral), author (with User icon), readMinutes (Clock + minutes), createdAt (formatDate).
   - Note: "Resource creation coming soon."
   - Loading, empty, error states + staggered animations.

### Wiring
- `src/lib/types.ts`: added `| { name: "admin-events" } | { name: "admin-newsfeed" } | { name: "admin-resources" }` to the `Route` union.
- `src/lib/store.ts`: `parseHash` `case "admin":` block now returns the 3 new routes for `b === "events"` / `newsfeed` / `resources`. `routeToHash` default already handles `#/admin/events` etc. correctly.
- `src/components/admin/shell.tsx`: NAV extended with Events (Calendar), Newsfeed (Newspaper), Resources (BookOpen) — placed after Industries. COMING_SOON reduced to only Reports (TrendingUp) + Settings (Clock).
- `src/app/page.tsx`: imported the 3 new admin views; added 3 route branches inside `<AdminShell>`.

## Lint / Type-check
- `bun run lint` → clean (no eslint errors).
- `bunx tsc --noEmit` → no errors in any of the touched/created files. (Pre-existing errors in unrelated `examples/`, `skills/`, `next.config.ts`, and `businesses/[slug]/route.ts` remain untouched.)
- Dev server: healthy. `GET /api/events`, `/api/posts`, `/api/resources` all return 200. After file saves, dev server recompiled cleanly (`✓ Compiled` lines in dev.log) and re-served `/` with 200.

## Fixes / Decisions
- Initial newsfeed draft had an awkward `navigate` placeholder; removed since posts aren't clickable — `useApp` import dropped from `newsfeed.tsx`.
- Replaced `FileCheck` icon with `BookOpen` for Resources nav item per task spec.
- Kept `CreditCard` (Subscriptions) and other working icons intact in `shell.tsx`.
- All 3 admin views use the existing public read endpoints (no admin-guard wrapping required per MVP scope).

## Stage Summary
- Admin sidebar now has 10 active nav items (was 7): Overview, Verification, Users, Businesses, Reviews, Subscriptions, Industries, Events, Newsfeed, Resources. Only Reports + Settings remain in COMING_SOON.
- Business owners can now upload a logo + cover image directly in the Edit Business dialog; the saved data-uri is persisted via the existing PATCH endpoint and reflected immediately on the detail page after the refetch.
- All views reuse the BlakNet brand system (ink/cream/sage, font-display, Pill, EmptyState, animate-fade-in-up) and shadcn/ui primitives (Button, Input, Skeleton, Avatar, Select, Badge where applicable).

---
Task ID: CRON-QA-5
Agent: Z.ai Code (main) — web dev review cron round 5
Task: QA, fix newsfeed Post-button confusion, add business image uploads, complete admin console (Events/Newsfeed/Resources).

## Current Project Status Assessment
BlakNet was stable and mature — public + dashboard + admin (7 views) all polished and functional. This round focused on: (a) fixing a UX bug (two "Post" buttons in the newsfeed composer), (b) adding business image uploads (logos/covers), and (c) completing the admin console with the 3 remaining management views (Events, Newsfeed, Resources).

## QA Performed
- Tested newsfeed post creation end-to-end — found the "two Post buttons" confusion (type toggle labeled "Post" vs submit button "Post").
- Verified all admin views render with live data.
- Lint: 0 errors, 0 warnings throughout.

## Completed Modifications

### Bug Fix
- **Newsfeed composer "Post" label confusion**: The text-type toggle was labeled "Post" (same as the submit button), causing confusion. Renamed the text-type toggle label from "Post" to "Text" in `POST_TYPE_META`. Now the submit button is the only "Post" button, and the type toggles are Text/Announcement/Opportunity — unambiguous.

### New Feature: Business Image Uploads (logos + covers)
- **`PATCH /api/businesses/[slug]/edit`** extended: now accepts `logoUrl` (data-uri, ≤200KB) and `coverUrl` (data-uri, ≤300KB). Included `logoUrl` in profile-completion calculation.
- **`ImageUpload` component** (`src/components/blaknet/image-upload.tsx`): reusable client-side file→data-uri upload with preview, remove button, size validation, loading state. Props: `{ value, onChange, label, aspect: "square"|"wide", maxMb }`.
- **Business edit dialog** (`business-detail.tsx`): added a "Brand images" section at the top of the Details tab with Logo (square) + Cover (wide) `ImageUpload` components. Prefilled from current business, included in the PATCH payload on save, refetches to show new images.

### Admin Console Completion — 3 new management views
**New admin views** (via subagent IMAGES-AND-ADMIN):
1. **AdminEventsView** — search + category filter, event table with clickable titles, category pill, date, location/online, attendees/capacity. Read-only for MVP.
2. **AdminNewsfeedView** — post-type filter, post cards with author avatar/name/email, type pill, content (line-clamp-3), views/likes/comments counts, business name. Read-only.
3. **AdminResourcesView** — category + type filters, resource table with clickable titles, type/category pills, author, readMinutes, featured badge, date. Read-only.

**Wiring**: Added 3 routes (`admin-events`, `admin-newsfeed`, `admin-resources`) to types + store + admin shell NAV. Moved Events/Newsfeed/Resources from "Coming soon" to active. Admin sidebar now has **10 active nav items** (was 7) with only Reports + Settings remaining as "coming soon".

## Verification Results
- Lint: 0 errors, 0 warnings.
- Dev server: healthy, all APIs 200.
- Functional tests:
  - Newsfeed: type toggle now shows "Text" (not "Post") — submit button is the only "Post" ✓.
  - Business edit: "Brand images" section with Logo + Cover upload controls present ✓.
  - Admin Events: 6 events with search + category filter ✓.
  - Admin Newsfeed: 7 posts with type filter ✓.
  - Admin Resources: 12 resources with category + type filters ✓.
- VLM: admin nav has 10 active items, 0 "coming soon" visible (only Reports/Settings remain). Completeness 8/10.

## Unresolved Issues / Risks
- **Avatar/image storage**: still data-uri in DB (fine for MVP, not production-scale).
- **Admin Reports + Settings** still "coming soon" (2 items) — Reports needs analytics data; Settings needs platform configuration.
- **Notification preferences**: toggles still cosmetic.
- **Admin Events/Newsfeed/Resources are read-only** — no create/edit/delete moderation actions yet (can be added later).

## Priority Recommendations for Next Phase
1. **Yoco subscription checkout** (Phase 3 revenue path) — still the top functional gap.
2. **Admin Reports view** — analytics: profile views over time, search appearances, business enquiries, event registrations. The Intelligence plan promises this.
3. **Admin Settings view** — platform configuration, feature flags, email templates.
4. **Event creation for business owners** — currently events are seed-data only; let business owners create/host events.
5. **Post moderation tools** — admin ability to pin/delete/hide posts from the admin newsfeed view.
