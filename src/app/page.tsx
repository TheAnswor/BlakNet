"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { DirectoryView } from "@/views/public/directory";
import { BusinessProfileView } from "@/views/public/business-profile";
import { NewsfeedView } from "@/views/public/newsfeed";
import { EventsView } from "@/views/public/events";
import { EventDetailView } from "@/views/public/event-detail";
import { ResourcesView } from "@/views/public/resources";
import { ResourceDetailView } from "@/views/public/resource-detail";
import { PricingView } from "@/views/public/pricing";
import { AboutView } from "@/views/public/about";
import { LoginView, RegisterView, ForgotView } from "@/views/public/auth";
import { InviteAcceptView } from "@/views/public/invite-accept";
import { AdminShell } from "@/components/admin/shell";
import { OverviewView } from "@/views/dashboard/overview";
import { MyBusinessesView } from "@/views/dashboard/businesses";
import { NewBusinessView } from "@/views/dashboard/business-new";
import { BusinessDetailView } from "@/views/dashboard/business-detail";
import { BusinessAnalyticsView } from "@/views/dashboard/business-analytics";
import { NetworkView } from "@/views/dashboard/network";
import { FollowingView } from "@/views/dashboard/following";
import { EnquiriesView } from "@/views/dashboard/enquiries";
import { NotificationsView } from "@/views/dashboard/notifications";
import { PlanView } from "@/views/dashboard/plan";
import { SettingsView } from "@/views/dashboard/settings";
import { HelpView } from "@/views/dashboard/help";
import { DashboardEventsView } from "@/views/dashboard/events";
import { NewEventView } from "@/views/dashboard/event-new";
import { AdminOverviewView } from "@/views/admin/overview";
import { AdminVerificationView } from "@/views/admin/verification";
import { AdminUsersView } from "@/views/admin/users";
import { AdminBusinessesView } from "@/views/admin/businesses";
import { AdminReviewsView } from "@/views/admin/reviews";
import { AdminSubscriptionsView } from "@/views/admin/subscriptions";
import { AdminIndustriesView } from "@/views/admin/industries";
import { AdminEventsView } from "@/views/admin/events";
import { AdminNewsfeedView } from "@/views/admin/newsfeed";
import { AdminResourcesView } from "@/views/admin/resources";
import { AdminReportsView } from "@/views/admin/reports";
import { AdminSettingsView } from "@/views/admin/settings";
import { ComingSoon } from "@/views/public/coming-soon";

// Routes that don't require auth
const OPEN_ROUTES = new Set(["login", "register", "forgot", "invite"]);

// Routes that render inside the AdminShell
const ADMIN_ROUTES = new Set([
  "admin", "admin-verification", "admin-users", "admin-businesses",
  "admin-reviews", "admin-subscriptions", "admin-industries",
  "admin-events", "admin-newsfeed", "admin-resources",
  "admin-reports", "admin-settings",
]);

// Dashboard-style routes that render under the public header (no sidebar shell)
const MANAGE_ROUTES = new Set([
  "dashboard", "dashboard-businesses", "dashboard-business-new",
  "dashboard-business", "dashboard-business-analytics",
  "dashboard-network", "dashboard-following",
  "dashboard-enquiries", "dashboard-notifications",
  "dashboard-plan", "dashboard-settings", "dashboard-help",
  "dashboard-newsfeed", "dashboard-events",
  "dashboard-event-new", "dashboard-resources",
]);

// Routes that show the footer
const FOOTER_ROUTES = new Set([
  "home", "newsfeed", "directory", "business", "events", "event",
  "resources", "resource", "pricing", "about",
  ...Array.from(MANAGE_ROUTES),
]);

export default function Page() {
  const { route, authLoading, refreshAuth, navigate } = useApp();

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const isAuthRoute = OPEN_ROUTES.has(route.name);
  const isAdmin = ADMIN_ROUTES.has(route.name);
  const isInvite = route.name === "invite";

  // Auth gate: redirect logic
  useEffect(() => {
    if (authLoading) return;
    const { authUser } = useApp.getState();

    // If authed and on an auth route, go to the feed
    if (authUser && (route.name === "login" || route.name === "register" || route.name === "forgot")) {
      navigate({ name: "newsfeed" });
      return;
    }

    // If NOT authed and NOT on an open route, redirect to login
    if (!authUser && !isAuthRoute && !isInvite) {
      navigate({ name: "login" });
      return;
    }
     
  }, [authLoading, route.name]);

  // Loading state
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/15 border-t-ink" />
      </div>
    );
  }

  // Invite page — standalone
  if (isInvite) {
    return (
      <div className="min-h-screen bg-background">
        <InviteAcceptView />
      </div>
    );
  }

  // Auth pages — standalone split-screen
  if (route.name === "login" || route.name === "register" || route.name === "forgot") {
    return (
      <div className="min-h-screen bg-background">
        {route.name === "login" && <LoginView />}
        {route.name === "register" && <RegisterView />}
        {route.name === "forgot" && <ForgotView />}
      </div>
    );
  }

  // Admin console — keeps its own shell
  if (isAdmin) {
    return (
      <AdminShell>
        {route.name === "admin" && <AdminOverviewView />}
        {route.name === "admin-verification" && <AdminVerificationView />}
        {route.name === "admin-users" && <AdminUsersView />}
        {route.name === "admin-businesses" && <AdminBusinessesView />}
        {route.name === "admin-reviews" && <AdminReviewsView />}
        {route.name === "admin-subscriptions" && <AdminSubscriptionsView />}
        {route.name === "admin-industries" && <AdminIndustriesView />}
        {route.name === "admin-events" && <AdminEventsView />}
        {route.name === "admin-newsfeed" && <AdminNewsfeedView />}
        {route.name === "admin-resources" && <AdminResourcesView />}
        {route.name === "admin-reports" && <AdminReportsView />}
        {route.name === "admin-settings" && <AdminSettingsView />}
      </AdminShell>
    );
  }

  // Everything else — public layout with header + content + footer
  const showFooter = FOOTER_ROUTES.has(route.name) && route.name !== "newsfeed";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex flex-1 flex-col">
        {/* Social feed (default landing) */}
        {(route.name === "home" || route.name === "newsfeed") && <NewsfeedView />}
        {/* Directory */}
        {route.name === "directory" && <DirectoryView />}
        {/* Business profile */}
        {route.name === "business" && <BusinessProfileView />}
        {/* Events */}
        {route.name === "events" && <EventsView />}
        {route.name === "event" && <EventDetailView />}
        {/* Resources */}
        {route.name === "resources" && <ResourcesView />}
        {route.name === "resource" && <ResourceDetailView />}
        {/* Pricing + About */}
        {route.name === "pricing" && <PricingView />}
        {route.name === "about" && <AboutView />}

        {/* Business management (under main header, no sidebar) */}
        {route.name === "dashboard" && <OverviewView />}
        {route.name === "dashboard-businesses" && <MyBusinessesView />}
        {route.name === "dashboard-business-new" && <NewBusinessView />}
        {route.name === "dashboard-business" && <BusinessDetailView />}
        {route.name === "dashboard-business-analytics" && <BusinessAnalyticsView />}
        {route.name === "dashboard-network" && <NetworkView />}
        {route.name === "dashboard-following" && <FollowingView />}
        {route.name === "dashboard-enquiries" && <EnquiriesView />}
        {route.name === "dashboard-notifications" && <NotificationsView />}
        {route.name === "dashboard-plan" && <PlanView />}
        {route.name === "dashboard-settings" && <SettingsView />}
        {route.name === "dashboard-help" && <HelpView />}
        {route.name === "dashboard-newsfeed" && <NewsfeedView />}
        {route.name === "dashboard-events" && <DashboardEventsView />}
        {route.name === "dashboard-event-new" && <NewEventView />}
        {route.name === "dashboard-resources" && <ResourcesView />}

        {/* Fallback */}
        {!FOOTER_ROUTES.has(route.name) &&
          !MANAGE_ROUTES.has(route.name) &&
          !["home", "newsfeed", "directory", "business", "events", "event", "resources", "resource", "pricing", "about"].includes(route.name) &&
          <ComingSoon route={route} />}
      </main>
      {showFooter && <PublicFooter />}
    </div>
  );
}
