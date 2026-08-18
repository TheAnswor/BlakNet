// BlakNet shared TypeScript types

export type Role = "USER" | "BUSINESS_OWNER" | "ADMIN" | "SUPER_ADMIN";
export type Plan = "STARTER" | "VERIFIED" | "INTELLIGENCE";
export type SubscriptionStatus = "FREE" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
export type VerificationStatus = "NOT_VERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  plan: Plan;
  profileImage: string | null;
  phone: string | null;
  bio: string | null;
}

export interface Industry {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export interface BusinessService {
  id: string;
  name: string;
}
export interface BusinessProduct {
  id: string;
  name: string;
}

export interface BusinessReview {
  id: string;
  businessId: string;
  reviewerName: string;
  reviewerCompany: string | null;
  rating: number;
  review: string;
  createdAt: string;
}

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  industryId: string | null;
  industry?: Industry | null;
  province: string | null;
  city: string | null;
  address: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  businessSize: string | null;
  yearFounded: number | null;
  employeeCount: string | null;
  annualRevenue: string | null;
  cipcNumber: string | null;
  bbbeeLevel: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  verificationStatus: VerificationStatus;
  featured: boolean;
  views: number;
  profileCompletion: number;
  createdAt: string;
  services?: BusinessService[];
  products?: BusinessProduct[];
  reviews?: BusinessReview[];
  followerCount?: number;
  following?: boolean;
  isOwner?: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  author: { id: string; firstName: string | null; lastName: string | null; email: string };
  businessId: string | null;
  business?: { id: string; name: string; slug: string; logoUrl: string | null } | null;
  content: string;
  imageUrl: string | null;
  postType: string;
  title: string | null;
  views: number;
  createdAt: string;
  _count?: { likes: number; comments: number };
  liked?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user: { id: string; firstName: string | null; lastName: string | null };
  content: string;
  createdAt: string;
}

export interface BlakEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  category: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  isOnline: boolean;
  onlineUrl: string | null;
  registrationUrl: string | null;
  capacity: number | null;
  organizer?: { id: string; firstName: string | null; lastName: string | null };
  business?: { id: string; name: string; slug: string; logoUrl: string | null } | null;
  _count?: { attendees: number };
  registered?: boolean;
}

export interface Resource {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string;
  resourceType: string;
  imageUrl: string | null;
  author: string | null;
  readMinutes: number | null;
  featured: boolean;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  company: string | null;
  position: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  category: string;
  tags: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface Subscription {
  id: string;
  plan: Plan;
  status: SubscriptionStatus;
  provider: string | null;
  startDate: string | null;
  endDate: string | null;
}

// routing
export type Route =
  | { name: "home" }
  | { name: "directory" }
  | { name: "business"; slug: string }
  | { name: "newsfeed" }
  | { name: "events" }
  | { name: "event"; slug: string }
  | { name: "resources" }
  | { name: "resource"; slug: string }
  | { name: "pricing" }
  | { name: "about" }
  | { name: "login" }
  | { name: "register" }
  | { name: "forgot" }
  | { name: "dashboard" }
  | { name: "dashboard-businesses" }
  | { name: "dashboard-business-new" }
  | { name: "dashboard-business"; id: string }
  | { name: "dashboard-network" }
  | { name: "dashboard-following" }
  | { name: "dashboard-enquiries" }
  | { name: "dashboard-newsfeed" }
  | { name: "dashboard-events" }
  | { name: "dashboard-event-new" }
  | { name: "dashboard-resources" }
  | { name: "dashboard-notifications" }
  | { name: "dashboard-plan" }
  | { name: "dashboard-settings" }
  | { name: "dashboard-help" }
  | { name: "admin" }
  | { name: "admin-verification" }
  | { name: "admin-users" }
  | { name: "admin-businesses" }
  | { name: "admin-reviews" }
  | { name: "admin-subscriptions" }
  | { name: "admin-industries" }
  | { name: "admin-events" }
  | { name: "admin-newsfeed" }
  | { name: "admin-resources" }
  | { name: "admin-reports" };
