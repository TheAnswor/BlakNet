"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
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
import { initials } from "@/lib/format";
import {
  Mail,
  Shield,
  Bell,
  MessageCircle,
  LifeBuoy,
  User as UserIcon,
  AlertTriangle,
  Camera,
  Loader2,
  Check,
} from "lucide-react";

interface ProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
  bio: string;
  headline: string;
  location: string;
  website: string;
  linkedin: string;
}

interface PasswordForm {
  current: string;
  next: string;
  confirm: string;
}

const EMPTY_FORM: ProfileForm = {
  firstName: "",
  lastName: "",
  phone: "",
  bio: "",
  headline: "",
  location: "",
  website: "",
  linkedin: "",
};

export function SettingsView() {
  const { authUser, refreshAuth } = useApp();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfileForm>(EMPTY_FORM);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [password, setPassword] = useState<PasswordForm>({
    current: "",
    next: "",
    confirm: "",
  });

  const [notifEmail, setNotifEmail] = useState(true);
  const [notifInApp, setNotifInApp] = useState(true);
  const [notifWhatsapp, setNotifWhatsapp] = useState(true);

  const [deleteOpen, setDeleteOpen] = useState(false);

  // Load full profile (incl. Profile record) on mount
  useEffect(() => {
    if (!authUser) return;
    api<{ user: { firstName: string | null; lastName: string | null; phone: string | null; bio: string | null; profileImage: string | null }; profile: { headline: string | null; location: string | null; website: string | null; linkedin: string | null } | null }>(
      "/api/profile",
    )
      .then((d) => {
        setProfile({
          firstName: d.user?.firstName ?? "",
          lastName: d.user?.lastName ?? "",
          phone: d.user?.phone ?? "",
          bio: d.user?.bio ?? "",
          headline: d.profile?.headline ?? "",
          location: d.profile?.location ?? "",
          website: d.profile?.website ?? "",
          linkedin: d.profile?.linkedin ?? "",
        });
        setAvatarUrl(d.user?.profileImage ?? null);
      })
      .catch(() => {
        // fall back to authUser
        setProfile({
          firstName: authUser.firstName ?? "",
          lastName: authUser.lastName ?? "",
          phone: authUser.phone ?? "",
          bio: authUser.bio ?? "",
          headline: "",
          location: "",
          website: "",
          linkedin: "",
        });
        setAvatarUrl(authUser.profileImage ?? null);
      });
  }, [authUser]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile.firstName.trim()) {
      toast({ title: "First name is required", variant: "destructive" });
      return;
    }
    setSavingProfile(true);
    try {
      await api("/api/profile", {
        method: "PATCH",
        json: {
          firstName: profile.firstName,
          lastName: profile.lastName || undefined,
          phone: profile.phone || undefined,
          bio: profile.bio || undefined,
          headline: profile.headline || undefined,
          location: profile.location || undefined,
          website: profile.website || undefined,
          linkedin: profile.linkedin || undefined,
        },
      });
      await refreshAuth();
      toast({
        title: "Profile updated",
        description: "Your changes are live across BlakNet.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save profile.";
      toast({ title: "Could not save", description: msg, variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please choose an image file", variant: "destructive" });
      return;
    }
    if (file.size > 2_500_000) {
      toast({
        title: "Image too large",
        description: "Choose an image under 2.5MB.",
        variant: "destructive",
      });
      return;
    }
    setUploadingAvatar(true);
    try {
      const dataUri = await fileToDataUri(file);
      await api("/api/profile", {
        method: "PATCH",
        json: { profileImage: dataUri },
      });
      setAvatarUrl(dataUri);
      await refreshAuth();
      toast({ title: "Avatar updated" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      toast({ title: "Could not upload", description: msg, variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeAvatar() {
    setUploadingAvatar(true);
    try {
      await api("/api/profile", { method: "PATCH", json: { profileImage: null } });
      setAvatarUrl(null);
      await refreshAuth();
      toast({ title: "Avatar removed" });
    } catch {
      toast({ title: "Could not remove", variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
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
                className="card-soft rounded-xl border border-border bg-card p-6"
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
                  <Label htmlFor="headline">Headline</Label>
                  <Input
                    id="headline"
                    value={profile.headline}
                    onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                    placeholder="Founder at Lwazi Cloud Systems"
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+27 82 000 0000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      placeholder="Sandton, Gauteng"
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={profile.website}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      placeholder="https://yourbusiness.co.za"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={profile.linkedin}
                      onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/you"
                    />
                  </div>
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
                  <p className="text-[11px] text-muted-foreground">
                    {profile.bio.length}/500 characters
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Changes appear on your profile and across BlakNet immediately.
                  </p>
                  <Button
                    type="submit"
                    disabled={savingProfile}
                    className="btn-lift bg-ink text-cream shadow-md shadow-ink/15 hover:bg-ink/90"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving…
                      </>
                    ) : (
                      <>
                        <Check className="mr-1.5 h-4 w-4" /> Save changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            <div className="space-y-6">
              <div className="card-soft rounded-xl border border-border bg-card p-6">
                <h3 className="font-display text-base tracking-tight">Avatar</h3>
                <div className="mt-4 flex flex-col items-center gap-4 text-center">
                  <div className="relative">
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-ink ring-4 ring-sage/15">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Your avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-display text-3xl text-cream">
                          {authUser ? initials(authUser) : "?"}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-sage text-ink shadow-md transition-transform hover:scale-110 disabled:opacity-50"
                      aria-label="Upload avatar"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Click the camera to upload. JPG/PNG up to 2.5MB.
                    </p>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={removeAvatar}
                        disabled={uploadingAvatar}
                        className="mt-1.5 text-xs text-destructive hover:underline"
                      >
                        Remove photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="card-soft rounded-xl border border-border bg-card p-6">
                <h3 className="font-display text-base tracking-tight">Profile completion</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <ProfileCheck done={!!profile.headline} label="Headline added" />
                  <ProfileCheck done={!!profile.location} label="Location set" />
                  <ProfileCheck done={!!profile.phone} label="Phone number" />
                  <ProfileCheck done={!!profile.bio} label="Bio written" />
                  <ProfileCheck done={!!avatarUrl} label="Avatar uploaded" />
                  <ProfileCheck done={!!profile.website || !!profile.linkedin} label="Website or LinkedIn" />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Account */}
        <TabsContent value="account" className="mt-6">
          <div className="space-y-6">
            <div className="card-soft rounded-xl border border-border bg-card p-6">
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
              className="card-soft rounded-xl border border-border bg-card p-6"
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
          <div className="card-soft rounded-xl border border-border bg-card p-6">
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

function ProfileCheck({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={
          done
            ? "flex h-5 w-5 items-center justify-center rounded-full bg-sage/15 text-sage"
            : "flex h-5 w-5 items-center justify-center rounded-full border border-border text-muted-foreground/40"
        }
      >
        {done ? <Check className="h-3 w-3" /> : null}
      </span>
      <span className={done ? "text-foreground/80" : "text-muted-foreground"}>{label}</span>
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

// Convert a File to a data URI (client-side, no server upload needed for MVP)
function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}
