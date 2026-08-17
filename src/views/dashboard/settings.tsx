"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { Mail, Shield, Bell, MessageCircle, LifeBuoy, User as UserIcon, AlertTriangle } from "lucide-react";

interface ProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
  bio: string;
}

interface PasswordForm {
  current: string;
  next: string;
  confirm: string;
}

export function SettingsView() {
  const { authUser } = useApp();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfileForm>(() => ({
    firstName: authUser?.firstName ?? "",
    lastName: authUser?.lastName ?? "",
    phone: authUser?.phone ?? "",
    bio: authUser?.bio ?? "",
  }));

  const [password, setPassword] = useState<PasswordForm>({
    current: "",
    next: "",
    confirm: "",
  });

  const [notifEmail, setNotifEmail] = useState(true);
  const [notifInApp, setNotifInApp] = useState(true);
  const [notifWhatsapp, setNotifWhatsapp] = useState(true);

  const [deleteOpen, setDeleteOpen] = useState(false);

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    toast({
      title: "Profile updates are coming soon",
      description: "We're putting the finishing touches on profile editing.",
    });
  }

  function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.next && password.next !== password.confirm) {
      toast({
        title: "Passwords don't match",
        description: "Your new password and confirmation must match.",
        variant: "destructive",
      });
      return;
    }
    setPassword({ current: "", next: "", confirm: "" });
    toast({
      title: "Password change coming soon",
      description: "Reach out to support if you need a reset right now.",
    });
  }

  function saveNotifications() {
    toast({ title: "Saved", description: "Your notification preferences have been saved." });
  }

  function confirmDelete() {
    setDeleteOpen(false);
    toast({
      title: "Account deletion requires admin assistance",
      description: "Please contact support — we'll help you close your account securely.",
      variant: "destructive",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Settings</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Manage your profile, account and notification preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full max-w-full overflow-x-auto sm:w-auto">
          <TabsTrigger value="profile" className="gap-1.5">
            <UserIcon className="h-3.5 w-3.5" /> Profile
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Account
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="h-3.5 w-3.5" /> Notifications
          </TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <form
                onSubmit={saveProfile}
                className="rounded-xl border border-border bg-card p-6"
              >
                <h2 className="font-display text-lg tracking-tight">Profile details</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Update how you appear across BlakNet.
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      placeholder="Thabo"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      placeholder="Mokoena"
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+27 82 000 0000"
                  />
                </div>
                <div className="mt-4 space-y-1.5">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    rows={4}
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="A short note about who you are and what you're building."
                  />
                </div>

                <div className="mt-5 flex justify-end">
                  <Button type="submit" className="bg-ink text-cream hover:bg-ink/90">
                    Save changes
                  </Button>
                </div>
              </form>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-display text-base tracking-tight">Avatar</h3>
              <div className="mt-4 flex flex-col items-center gap-3 text-center">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-ink font-display text-2xl text-cream">
                    {authUser ? initials(authUser) : "?"}
                  </AvatarFallback>
                </Avatar>
                <p className="text-xs text-muted-foreground">
                  Upload coming soon — your initials are used for now.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Account */}
        <TabsContent value="account" className="mt-6">
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-display text-lg tracking-tight">Email address</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your email is your login. Contact support to change it.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={authUser?.email ?? ""}
                  readOnly
                  disabled
                  className="bg-muted/40 font-mono text-sm"
                />
              </div>
            </div>

            <form
              onSubmit={savePassword}
              className="rounded-xl border border-border bg-card p-6"
            >
              <h2 className="font-display text-lg tracking-tight">Change password</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Keep your account secure with a strong, unique password.
              </p>

              <div className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="current">Current password</Label>
                  <Input
                    id="current"
                    type="password"
                    autoComplete="current-password"
                    value={password.current}
                    onChange={(e) => setPassword({ ...password, current: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="next">New password</Label>
                    <Input
                      id="next"
                      type="password"
                      autoComplete="new-password"
                      value={password.next}
                      onChange={(e) => setPassword({ ...password, next: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm">Confirm new password</Label>
                    <Input
                      id="confirm"
                      type="password"
                      autoComplete="new-password"
                      value={password.confirm}
                      onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <Button type="submit" className="bg-ink text-cream hover:bg-ink/90">
                  Save password
                </Button>
              </div>
            </form>

            <Separator />

            <div className="rounded-xl border border-destructive/30 bg-destructive/[0.03] p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-lg tracking-tight text-foreground">Danger zone</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Permanently delete your account and all associated data. This can't be undone.
                  </p>
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setDeleteOpen(true)}
                    >
                      Delete account
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-lg tracking-tight">Notification channels</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose how BlakNet reaches you. Granular notification preferences are coming soon.
            </p>

            <div className="mt-5 divide-y divide-border">
              <NotifRow
                icon={Mail}
                title="Email"
                description="Reviews, enquiries and account updates to your inbox."
                checked={notifEmail}
                onChange={setNotifEmail}
              />
              <NotifRow
                icon={Bell}
                title="In-app"
                description="The bell in your dashboard — best for everyday activity."
                checked={notifInApp}
                onChange={setNotifInApp}
              />
              <NotifRow
                icon={MessageCircle}
                title="WhatsApp"
                description="High-priority alerts only, like verifications and procurement leads."
                checked={notifWhatsapp}
                onChange={setNotifWhatsapp}
              />
            </div>

            <div className="mt-5 flex justify-end">
              <Button type="button" onClick={saveNotifications} className="bg-ink text-cream hover:bg-ink/90">
                Save preferences
              </Button>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-background p-4">
            <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
            <p className="text-xs text-muted-foreground">
              Need to mute a specific type of notification? Granular preferences are coming soon. For now, reach out to{" "}
              <a className="text-sage underline" href="mailto:hello@blaknet.co.za">
                hello@blaknet.co.za
              </a>{" "}
              and we'll tailor things for you.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete account?</DialogTitle>
            <DialogDescription>
              This will permanently remove your account, businesses and contacts. This action can't be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Delete account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NotifRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={title} />
    </div>
  );
}
