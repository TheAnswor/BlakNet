"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store";
import { PublicHeader } from "@/components/public/header";
import { PublicFooter } from "@/components/public/footer";
import { HomeView } from "@/views/public/home";
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
import { DashboardShell } from "@/components/dashboard/shell";
import { AdminShell } from "@/components/admin/shell";
import { OverviewView } from "@/views/dashboard/overview";
import { MyBusinessesView } from "@/views/dashboard/businesses";
import { NewBusinessView } from "@/views/dashboard/business-new";
import { BusinessDetailView } from "@/views/dashboard/business-detail";
import { NetworkView } from "@/views/dashboard/network";
import { FollowingView } from "@/views/dashboard/following";
import { NotificationsView } from "@/views/dashboard/notifications";
import { PlanView } from "@/views/dashboard/plan";
import { SettingsView } from "@/views/dashboard/settings";
import { HelpView } from "@/views/dashboard/help";
import { AdminOverviewView } from "@/views/admin/overview";
import { AdminVerificationView } from "@/views/admin/verification";
import { AdminUsersView } from "@/views/admin/users";
import { AdminBusinessesView } from "@/views/admin/businesses";
import { AdminReviewsView } from "@/views/admin/reviews";
import { AdminSubscriptionsView } from "@/views/admin/subscriptions";
import { AdminIndustriesView } from "@/views/admin/industries";
import { ComingSoon } from "@/views/public/coming-soon";

// Routes that show the public header + footer (marketing surface)
const PUBLIC_ROUTES = new Set([
  "home",
  "directory",
  "business",
  "newsfeed",
  "events",
  "event",
  "resources",
  "resource",
  "pricing",
  "about",
]);

// Auth routes get a standalone split-screen layout (no public header/footer)
const AUTH_ROUTES = new Set(["login", "register", "forgot"]);

export default function Page() {
  const { route, authLoading, refreshAuth, navigate } = useApp();

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const isPublic = PUBLIC_ROUTES.has(route.name);
  const isAuth = AUTH_ROUTES.has(route.name);
  const isDash = route.name === "dashboard" || route.name.startsWith("dashboard-");
  const isAdmin = route.name === "admin" || route.name.startsWith("admin-");

  // redirect to dashboard if logged in & hitting login/register
  useEffect(() => {
    if (!authLoading) {
      const { authUser } = useApp.getState();
      if (authUser && (route.name === "login" || route.name === "register")) {
        navigate({ name: "dashboard" });
      }
      // dashboard/admin require auth
      if (!authUser && (isDash || isAdmin)) {
        navigate({ name: "login" });
      }
    }
     
  }, [authLoading, route.name]);

  if (isAuth) {
    return (
      <div className="min-h-screen bg-background">
        {route.name === "login" && <LoginView />}
        {route.name === "register" && <RegisterView />}
        {route.name === "forgot" && <ForgotView />}
      </div>
    );
  }

  if (isDash) {
    return (
      <DashboardShell>
        {route.name === "dashboard" && <OverviewView />}
        {route.name === "dashboard-businesses" && <MyBusinessesView />}
        {route.name === "dashboard-business-new" && <NewBusinessView />}
        {route.name === "dashboard-business" && <BusinessDetailView />}
        {route.name === "dashboard-network" && <NetworkView />}
        {route.name === "dashboard-following" && <FollowingView />}
        {route.name === "dashboard-notifications" && <NotificationsView />}
        {route.name === "dashboard-plan" && <PlanView />}
        {route.name === "dashboard-settings" && <SettingsView />}
        {route.name === "dashboard-help" && <HelpView />}
        {route.name === "dashboard-newsfeed" && <NewsfeedView />}
        {route.name === "dashboard-events" && <EventsView />}
        {route.name === "dashboard-resources" && <ResourcesView />}
        {![
          "dashboard",
          "dashboard-businesses",
          "dashboard-business-new",
          "dashboard-business",
          "dashboard-network",
          "dashboard-following",
          "dashboard-notifications",
          "dashboard-plan",
          "dashboard-settings",
          "dashboard-help",
          "dashboard-newsfeed",
          "dashboard-events",
          "dashboard-resources",
        ].includes(route.name) && <ComingSoon route={route} />}
      </DashboardShell>
    );
  }

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
      </AdminShell>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {isPublic && <PublicHeader />}
      <main className="flex flex-1 flex-col">
        {route.name === "home" && <HomeView />}
        {route.name === "directory" && <DirectoryView />}
        {route.name === "business" && <BusinessProfileView />}
        {route.name === "newsfeed" && <NewsfeedView />}
        {route.name === "events" && <EventsView />}
        {route.name === "event" && <EventDetailView />}
        {route.name === "resources" && <ResourcesView />}
        {route.name === "resource" && <ResourceDetailView />}
        {route.name === "pricing" && <PricingView />}
        {route.name === "about" && <AboutView />}
        {isPublic &&
          route.name !== "home" &&
          route.name !== "directory" &&
          route.name !== "business" &&
          route.name !== "newsfeed" &&
          route.name !== "events" &&
          route.name !== "event" &&
          route.name !== "resources" &&
          route.name !== "resource" &&
          route.name !== "pricing" &&
          route.name !== "about" && <ComingSoon route={route} />}
      </main>
      {isPublic && <PublicFooter />}
    </div>
  );
}
