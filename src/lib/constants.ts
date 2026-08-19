// BlakNet static reference data (industries seeded to DB, these are for filters/UI)

export const PROVINCES = [
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
] as const;

export const BUSINESS_SIZES = [
  { value: "micro", label: "Micro (1–10)" },
  { value: "small", label: "Small (11–50)" },
  { value: "medium", label: "Medium (51–200)" },
  { value: "large", label: "Large (200+)" },
] as const;

export const BBBEE_LEVELS = [
  "Level 1",
  "Level 2",
  "Level 3",
  "Level 4",
  "Level 5",
  "Level 6",
  "Level 7",
  "Level 8",
  "Non-Compliant",
] as const;

export const EMPLOYEE_RANGES = ["1-10", "11-50", "51-200", "201-500", "500+"] as const;
export const REVENUE_RANGES = [
  "Under R1m",
  "R1m-R5m",
  "R5m-R10m",
  "R10m-R25m",
  "R25m-R50m",
  "R50m-R100m",
  "R100m+",
] as const;

export const CONTACT_CATEGORIES = [
  "Client",
  "Supplier",
  "Partner",
  "Investor",
  "Prospect",
  "Entrepreneur",
  "Procurement",
  "Professional",
  "Other",
] as const;

export const EVENT_CATEGORIES = [
  { value: "networking", label: "Networking" },
  { value: "workshop", label: "Workshops" },
  { value: "seminar", label: "Seminars" },
  { value: "conference", label: "Conferences" },
  { value: "training", label: "Training" },
  { value: "webinar", label: "Webinars" },
  { value: "funding", label: "Funding" },
  { value: "competition", label: "Competitions" },
  { value: "learnership", label: "Learnerships" },
  { value: "meetup", label: "Meetups" },
] as const;

export const RESOURCE_CATEGORIES = [
  { value: "starting", label: "Starting a Business" },
  { value: "compliance", label: "Compliance" },
  { value: "bbbee", label: "B-BBEE" },
  { value: "finance", label: "Finance" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "operations", label: "Operations" },
  { value: "hr", label: "Human Resources" },
  { value: "legal", label: "Legal" },
  { value: "procurement", label: "Procurement" },
  { value: "funding", label: "Funding" },
  { value: "strategy", label: "Business Strategy" },
  { value: "technology", label: "Technology" },
] as const;

export const RESOURCE_TYPES = [
  { value: "article", label: "Articles" },
  { value: "guide", label: "Guides" },
  { value: "template", label: "Templates" },
  { value: "checklist", label: "Checklists" },
  { value: "video", label: "Videos" },
  { value: "workshop", label: "Workshops" },
] as const;

export interface PlanFeature {
  label: string;
  included: boolean;
  badge?: string;
}
export interface PlanTier {
  id: "STARTER" | "VERIFIED" | "INTELLIGENCE";
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  cta: string;
  highlight?: boolean;
  features: PlanFeature[];
}

export const PLANS: PlanTier[] = [
  {
    id: "STARTER",
    name: "Starter",
    price: "R0",
    cadence: "free forever",
    tagline: "Get Listed. Get Found.",
    cta: "Get Started Free",
    features: [
      { label: "1 business profile", included: true },
      { label: "1 team account (owner only)", included: true },
      { label: "Appear in search results", included: true },
      { label: "Collect reviews", included: true },
      { label: "Basic profile analytics", included: true },
      { label: "Category & province listing", included: true },
      { label: "Team accounts via email invite", included: false },
      { label: "CIPC verification badge", included: false },
      { label: "Priority search ranking", included: false },
    ],
  },
  {
    id: "VERIFIED",
    name: "Verified",
    price: "R249",
    cadence: "per month",
    tagline: "Build credibility that wins contracts.",
    cta: "Upgrade to Verified",
    highlight: true,
    features: [
      { label: "Everything in Starter", included: true },
      { label: "Up to 3 businesses", included: true, badge: "Popular" },
      { label: "Up to 3 team accounts", included: true },
      { label: "Add more accounts at additional cost", included: true },
      { label: "CIPC verification badge", included: true, badge: "Trust" },
      { label: "B-BBEE certificate display", included: true },
      { label: "Priority search ranking", included: true },
      { label: "Featured directory placement", included: true },
      { label: "WhatsApp enquiry button", included: true },
      { label: "Team invites via email", included: true },
    ],
  },
  {
    id: "INTELLIGENCE",
    name: "Intelligence",
    price: "R895",
    cadence: "per month",
    tagline: "Full business intelligence suite.",
    cta: "Upgrade to Intelligence",
    features: [
      { label: "Everything in Verified", included: true },
      { label: "Up to 5 businesses", included: true },
      { label: "Up to 5 team accounts", included: true },
      { label: "Add more accounts at additional cost", included: true },
      { label: "Live performance dashboard", included: true, badge: "Soon" },
      { label: "Competitor benchmarking", included: true, badge: "Soon" },
      { label: "Procurement alerts", included: true, badge: "Soon" },
      { label: "Export data and reports", included: true },
      { label: "API access", included: true, badge: "Soon" },
      { label: "Dedicated account manager", included: true },
    ],
  },
];

export const STATS = [
  { value: "2 400+", label: "Black-owned businesses" },
  { value: "9", label: "Provinces covered" },
  { value: "18", label: "Industries" },
  { value: "R312m", label: "Opportunities shared" },
];
