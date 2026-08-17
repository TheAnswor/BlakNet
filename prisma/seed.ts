 
/**
 * BlakNet seed script
 * Creates realistic South African demo data across multiple industries & provinces.
 * Run with: bun run db:seed  (or) bun prisma/seed.ts
 */
import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "crypto";

const prisma = new PrismaClient();

// ---------- helpers ----------
function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
function hash(pw: string) {
  return createHash("sha256").update(pw + "::blaknet").digest("hex");
}
function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
// deterministic-ish avatar color from name
function pickAvatarColor(seed: string) {
  const colors = ["1d2534", "717568", "4a5566", "5a6b3a", "2a3548", "8a8d7c"];
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
}
// simple inline SVG logo generator per business
function logo(name: string, seed: string) {
  const bg = pickAvatarColor(seed);
  const txt = initials(name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="24" fill="#${bg}"/><text x="60" y="62" font-family="Georgia, serif" font-size="44" font-weight="700" fill="#f6f6df" text-anchor="middle" dominant-baseline="central" letter-spacing="2">${txt}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ---------- data ----------
const INDUSTRIES: { name: string; slug: string; icon: string; subs: string[] }[] = [
  { name: "Technology", slug: "technology", icon: "Cpu", subs: ["Software Development", "IT Services", "Cloud & DevOps", "Cybersecurity"] },
  { name: "Construction", slug: "construction", icon: "HardHat", subs: ["Civil Engineering", "Building", "Construction Management", "Plant Hire"] },
  { name: "Finance & Accounting", slug: "finance-accounting", icon: "Landmark", subs: ["Accounting", "Tax", "Advisory", "Bookkeeping"] },
  { name: "Agriculture", slug: "agriculture", icon: "Sprout", subs: ["Crop Farming", "Agro-processing", "Livestock", "Agricultural Tech"] },
  { name: "Logistics & Transport", slug: "logistics-transport", icon: "Truck", subs: ["Freight", "Courier", "Warehousing", "Fleet Management"] },
  { name: "Marketing & Media", slug: "marketing-media", icon: "Megaphone", subs: ["Digital Marketing", "Brand Strategy", "Content", "Design"] },
  { name: "Manufacturing", slug: "manufacturing", icon: "Factory", subs: ["Light Manufacturing", "Textiles", "Food Processing", "Metalwork"] },
  { name: "Security Services", slug: "security-services", icon: "ShieldCheck", subs: ["Guarding", "Event Security", "Risk Advisory", "Surveillance"] },
  { name: "Food & Hospitality", slug: "food-hospitality", icon: "UtensilsCrossed", subs: ["Restaurants", "Catering", "Accommodation", "Beverages"] },
  { name: "Healthcare", slug: "healthcare", icon: "HeartPulse", subs: ["Clinics", "Home Care", "Medical Supplies", "Wellness"] },
  { name: "Legal Services", slug: "legal-services", icon: "Scale", subs: ["Commercial Law", "Conveyancing", "Litigation", "Compliance"] },
  { name: "Energy & Renewables", slug: "energy-renewables", icon: "Zap", subs: ["Solar", "Electrical", "Energy Advisory", "Installation"] },
];

const PROVINCES = [
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
];

const CITIES: Record<string, string[]> = {
  Gauteng: ["Johannesburg", "Sandton", "Pretoria", "Soweto", "Midrand"],
  "Western Cape": ["Cape Town", "Stellenbosch", "Paarl", "Khayelitsha", "Bellville"],
  "KwaZulu-Natal": ["Durban", "Pietermaritzburg", "Umhlanga", "Newcastle", "Richards Bay"],
  "Eastern Cape": ["Gqeberha", "East London", "Mthatha", "Uitenhage"],
  "Free State": ["Bloemfontein", "Welkom", "Sasolburg"],
  Limpopo: ["Polokwane", "Thohoyandou", "Tzaneen"],
  Mpumalanga: ["Mbombela", "Witbank", "Secunda"],
  "North West": ["Mahikeng", "Rustenburg", "Klerksdorp"],
  "Northern Cape": ["Kimberley", "Upington", "Springbok"],
};

type BizSeed = {
  name: string;
  tagline: string;
  industrySlug: string;
  province: string;
  city: string;
  size: string;
  founded: number;
  employees: string;
  revenue: string;
  cipc: string;
  bbbee: string;
  verified: boolean;
  featured: boolean;
  website: string;
  email: string;
  phone: string;
  whatsapp: string;
  description: string;
  services: string[];
  products: string[];
  rating: number;
  reviewCount: number;
};

const BIZ: BizSeed[] = [
  {
    name: "Lwazi Cloud Systems",
    tagline: "Cloud-native software for African enterprise",
    industrySlug: "technology",
    province: "Gauteng", city: "Sandton", size: "small", founded: 2018,
    employees: "11-50", revenue: "R5m-R10m", cipc: "2018/123456/07", bbbee: "Level 2",
    verified: true, featured: true,
    website: "https://lwazi.cloud", email: "hello@lwazi.cloud", phone: "+27 11 555 0100", whatsapp: "+27 82 555 0100",
    description:
      "Lwazi Cloud Systems builds cloud-native platforms, data pipelines and developer tooling for banks, insurers and retailers across SADC. We are a Level 2 B-BBEE contributor with a 60% Black-owned, 40% Black women-owned structure.",
    services: ["Custom Software Development", "Cloud Migration", "DevOps Engineering", "Data Engineering", "API Integration"],
    products: ["Lwazi DataHub", "Lwazi Auth Gateway", "Lwazi Observability Suite"],
    rating: 4.9, reviewCount: 27,
  },
  {
    name: "Sakhisizwe Civils",
    tagline: "Building infrastructure that builds communities",
    industrySlug: "construction", province: "KwaZulu-Natal", city: "Durban",
    size: "medium", founded: 2011, employees: "51-200", revenue: "R25m-R50m",
    cipc: "2011/778812/07", bbbee: "Level 1", verified: true, featured: true,
    website: "https://sakhisizwecivils.co.za", email: "info@sakhisizwecivils.co.za", phone: "+27 31 555 0142", whatsapp: "+27 83 555 0142",
    description:
      "Sakhisizwe Civils is a 100% Black-owned civil engineering and construction firm delivering roads, stormwater, water reticulation and community infrastructure for municipalities and Tier-1 contractors. CIDB Grading 6CE & 4GB.",
    services: ["Civil Engineering", "Roads & Stormwater", "Water & Sanitation", "Project Management", "Plant Hire"],
    products: ["Sakhi Site Safety Kit", "Sakhi Plant Fleet"],
    rating: 4.7, reviewCount: 18,
  },
  {
    name: "Mabuya Accounting Partners",
    tagline: "Numbers that move your business forward",
    industrySlug: "finance-accounting", province: "Gauteng", city: "Johannesburg",
    size: "small", founded: 2015, employees: "11-50", revenue: "R5m-R10m",
    cipc: "2015/451290/07", bbbee: "Level 2", verified: true, featured: true,
    website: "https://mabuya.accountants", email: "info@mabuya.accountants", phone: "+27 11 555 0188", whatsapp: "+27 84 555 0188",
    description:
      "Mabuya Accounting Partners provides accounting, tax, payroll and advisory services to SMMEs and mid-market firms. We are SAICA-registered and IRB-accredited, specialising in B-BBEE structuring and compliance for procurement-ready businesses.",
    services: ["Accounting", "Tax Services", "Payroll", "B-BBEE Advisory", "Audit Support"],
    products: ["Mabuya Monthly Books", "Mabuya Tax Pack"],
    rating: 4.8, reviewCount: 33,
  },
  {
    name: "Thari Agri Cooperative",
    tagline: "From Black soil to supermarket shelves",
    industrySlug: "agriculture", province: "Limpopo", city: "Tzaneen",
    size: "medium", founded: 2014, employees: "51-200", revenue: "R10m-R25m",
    cipc: "2014/902311/07", bbbee: "Level 1", verified: true, featured: false,
    website: "https://thariagri.co.za", email: "sales@thariagri.co.za", phone: "+27 15 555 0123", whatsapp: "+27 76 555 0123",
    description:
      "Thari Agri Cooperative is a Black-owned and Black-women-led agro-processing cooperative producing avocados, macadamia and mango for local retail and export. GAP-certified and Proudly SA.",
    services: ["Crop Farming", "Agro-processing", "Export Logistics", "Contract Farming"],
    products: ["Thari Macadamia", "Thari Avocado Oil", "Thari Dried Mango"],
    rating: 4.6, reviewCount: 12,
  },
  {
    name: "Vuyo Logistics",
    tagline: "Moving South Africa, on time",
    industrySlug: "logistics-transport", province: "Gauteng", city: "Johannesburg",
    size: "medium", founded: 2010, employees: "201-500", revenue: "R50m-R100m",
    cipc: "2010/118230/07", bbbee: "Level 2", verified: true, featured: false,
    website: "https://vuyologistics.co.za", email: "info@vuyologistics.co.za", phone: "+27 11 555 0200", whatsapp: "+27 72 555 0200",
    description:
      "Vuyo Logistics operates a national fleet of cross-border and line-haul vehicles, warehousing in Gauteng and KZN, and last-mile delivery for retailers. Full SARS and cross-border permits, SADC coverage.",
    services: ["Freight", "Cross-Border Transport", "Warehousing", "Last-Mile Delivery", "Fleet Management"],
    products: ["Vuyo Line-Haul Fleet", "Vuyo Bonded Warehouse"],
    rating: 4.5, reviewCount: 21,
  },
  {
    name: "Naledi Digital Studio",
    tagline: "Brands built for the new African consumer",
    industrySlug: "marketing-media", province: "Western Cape", city: "Cape Town",
    size: "small", founded: 2019, employees: "11-50", revenue: "R5m-R10m",
    cipc: "2019/332011/07", bbbee: "Level 2", verified: false, featured: true,
    website: "https://naledi.studio", email: "studio@naledi.studio", phone: "+27 21 555 0177", whatsapp: "+27 73 555 0177",
    description:
      "Naledi Digital Studio is a Black-women-owned creative agency delivering brand strategy, web design, paid media and content production for FMCG, fintech and tourism brands.",
    services: ["Brand Strategy", "Web Design", "Paid Media", "Content Production", "Social Media"],
    products: ["Naledi Brand Sprint", "Naledi Content Pack"],
    rating: 4.8, reviewCount: 19,
  },
  {
    name: "Kopano Manufacturing",
    tagline: "Precision metalwork, proudly local",
    industrySlug: "manufacturing", province: "Free State", city: "Welkom",
    size: "medium", founded: 2009, employees: "51-200", revenue: "R25m-R50m",
    cipc: "2009/661022/07", bbbee: "Level 1", verified: true, featured: false,
    website: "https://kopano-mfg.co.za", email: "orders@kopano-mfg.co.za", phone: "+27 57 555 0133", whatsapp: "+27 78 555 0133",
    description:
      "Kopano Manufacturing produces precision-machined components, light steel fabrication and mining consumables for OEMs and the mining sector. ISO 9001 aligned, SABS tested.",
    services: ["Precision Machining", "Fabrication", "Mining Consumables", "Assembly"],
    products: ["Kopano Milling Kit", "Kopano Mining Bolster"],
    rating: 4.6, reviewCount: 9,
  },
  {
    name: "Asikhatale Security Group",
    tagline: "Protection you can rely on",
    industrySlug: "security-services", province: "Gauteng", city: "Pretoria",
    size: "medium", founded: 2013, employees: "201-500", revenue: "R25m-R50m",
    cipc: "2013/221945/07", bbbee: "Level 2", verified: true, featured: false,
    website: "https://asikhatale.co.za", email: "ops@asikhatale.co.za", phone: "+27 12 555 0166", whatsapp: "+27 79 555 0166",
    description:
      "Asikhatale Security Group provides PSIRA-registered guarding, event security, CCTV and risk advisory services for retail, mining and government clients across Gauteng and the North West.",
    services: ["Guarding", "Event Security", "CCTV & Surveillance", "Risk Advisory"],
    products: ["Asikhatale Patrol App", "Asikhatale Control Room"],
    rating: 4.4, reviewCount: 15,
  },
  {
    name: "Kwaito Kitchen Eatery",
    tagline: "Modern South African street food",
    industrySlug: "food-hospitality", province: "Western Cape", city: "Cape Town",
    size: "micro", founded: 2021, employees: "1-10", revenue: "R1m-R5m",
    cipc: "2021/554019/07", bbbee: "Level 4", verified: false, featured: true,
    website: "https://kwaitokitchen.co.za", email: "eat@kwaitokitchen.co.za", phone: "+27 21 555 0190", whatsapp: "+27 74 555 0190",
    description:
      "Kwaito Kitchen Eatery serves modern township-inspired street food in the Cape Town CBD. Catering, private events and a growing ready-meal range.",
    services: ["Restaurant", "Catering", "Private Events", "Ready Meals"],
    products: ["Kwaito Braai Box", "Kwaito Chakalala Sauce"],
    rating: 4.9, reviewCount: 41,
  },
  {
    name: "Phila Home Health",
    tagline: "Dignified care, at home",
    industrySlug: "healthcare", province: "KwaZulu-Natal", city: "Durban",
    size: "small", founded: 2017, employees: "51-200", revenue: "R10m-R25m",
    cipc: "2017/884510/07", bbbee: "Level 2", verified: true, featured: false,
    website: "https://philahomehealth.co.za", email: "care@philahomehealth.co.za", phone: "+27 31 555 0155", whatsapp: "+27 71 555 0155",
    description:
      "Phila Home Health provides professional nursing, home-based care and chronic disease management for medical aids and private clients across KZN. SANC-registered nurses.",
    services: ["Home Nursing", "Chronic Care", "Post-Op Care", "Medical Supplies"],
    products: ["Phila Care Kit", "Phila Mobility Range"],
    rating: 4.8, reviewCount: 23,
  },
  {
    name: "Mokoena Attorneys",
    tagline: "Commercial law for ambitious businesses",
    industrySlug: "legal-services", province: "Gauteng", city: "Sandton",
    size: "small", founded: 2012, employees: "11-50", revenue: "R10m-R25m",
    cipc: "2012/110987/07", bbbee: "Level 1", verified: true, featured: false,
    website: "https://mokoena.attorneys", email: "legal@mokoena.attorneys", phone: "+27 11 555 0122", whatsapp: "+27 82 555 0122",
    description:
      "Mokoena Attorneys is a Black-owned law firm advising on commercial transactions, B-BBEE structuring, procurement disputes and conveyancing. LSSA-accredited.",
    services: ["Commercial Law", "B-BBEE Structuring", "Conveyancing", "Litigation", "Compliance"],
    products: ["Mokoena Deal Room", "Mokoena Property Pack"],
    rating: 4.7, reviewCount: 14,
  },
  {
    name: "SolarSizwe Energy",
    tagline: "Powering the off-grid transition",
    industrySlug: "energy-renewables", province: "Eastern Cape", city: "Gqeberha",
    size: "small", founded: 2018, employees: "11-50", revenue: "R10m-R25m",
    cipc: "2018/776214/07", bbbee: "Level 2", verified: true, featured: true,
    website: "https://solarsizwe.co.za", email: "power@solarsizwe.co.za", phone: "+27 41 555 0144", whatsapp: "+27 81 555 0144",
    description:
      "SolarSizwe Energy designs, supplies and installs commercial and residential solar PV, battery storage and grid-tied systems across the Eastern Cape and Eastern seaboard. PV GreenCard installers.",
    services: ["Solar PV Design", "Battery Storage", "Grid-Tied Systems", "Maintenance", "Energy Advisory"],
    products: ["Sizwe Home Kit", "Sizwe Commercial Array"],
    rating: 4.9, reviewCount: 28,
  },
];

// events
const EVENTS = [
  {
    title: "BlakNet Founder Connect: Johannesburg",
    category: "networking",
    province: "Gauteng",
    location: "Sandton Convention Centre, Johannesburg",
    desc: "An evening of curated founder-to-founder connections, procurement intros and a fireside chat with a leading Black-owned construction CEO.",
    date: addDays(7, 18),
    online: false,
    image: "event-founder-connect",
  },
  {
    title: "B-BBEE Compliance Masterclass",
    category: "workshop",
    province: "Western Cape",
    location: "Cape Town CBD",
    desc: "A practical, half-day workshop unpacking ownership, management control, skills development, enterprise & supplier development and socio-economic development.",
    date: addDays(12, 9),
    online: true,
    image: "event-bbbee",
  },
  {
    title: "Procurement Open Day — Retail Suppliers",
    category: "seminar",
    province: "Gauteng",
    location: "Johannesburg",
    desc: "Meet buyers from leading retailers, understand their supplier onboarding and compliance requirements, and pitch your business.",
    date: addDays(20, 13),
    online: false,
    image: "event-procurement",
  },
  {
    title: "Funding Readiness Webinar: Where Black SMMEs raise capital",
    category: "funding",
    province: "Online",
    location: "Online",
    desc: "A panel of fund managers, DFIs and angel investors break down what makes a fundable Black-owned business in 2025.",
    date: addDays(4, 11),
    online: true,
    image: "event-funding",
  },
  {
    title: "Construction & Infrastructure Summit",
    category: "conference",
    province: "KwaZulu-Natal",
    location: "Durban ICC",
    desc: "The largest gathering of Black-owned contractors, consultants and plant hire firms ahead of the infrastructure season.",
    date: addDays(35, 8),
    online: false,
    image: "event-construction",
  },
  {
    title: "Digital Marketing for Township Brands",
    category: "training",
    province: "Gauteng",
    location: "Soweto Theatre, Soweto",
    desc: "A hands-on training on content, paid social and community-led growth for township-origin brands.",
    date: addDays(15, 17),
    online: false,
    image: "event-marketing",
  },
];

// resources
const RESOURCES = [
  {
    title: "How to register your business with CIPC — a 2025 guide",
    category: "starting",
    type: "guide",
    desc: "A step-by-step walkthrough to register a private company, reserve a name and get your CoR14.3.",
    author: "BlakNet Knowledge",
    minutes: 8,
  },
  {
    title: "B-BBEE Scorecard checklist for procurement readiness",
    category: "bbbee",
    type: "checklist",
    desc: "Use this checklist to assess your readiness across all five pillars before approaching a Tier-1 buyer.",
    author: "Mabuya Accounting Partners",
    minutes: 6,
  },
  {
    title: "Funding map for Black-owned SMMEs in South Africa",
    category: "funding",
    type: "guide",
    desc: "A practical map of DFIs, angels, crowdfunders and accelerators — and what each actually funds.",
    author: "BlakNet Knowledge",
    minutes: 12,
  },
  {
    title: "Procurement-ready profile template",
    category: "procurement",
    type: "template",
    desc: "A one-page profile template that Tier-1 procurement teams expect from new suppliers.",
    author: "BlakNet Knowledge",
    minutes: 5,
  },
  {
    title: "Marketing on a R0 budget: the township brand playbook",
    category: "marketing",
    type: "article",
    desc: "How Black-owned brands are building community, content and conversion without a marketing budget.",
    author: "Naledi Digital Studio",
    minutes: 9,
  },
  {
    title: "Tax compliance for SMMEs: SARS basics",
    category: "compliance",
    type: "article",
    desc: "Income tax, VAT and PAYE essentials every Black-owned SMME should understand from day one.",
    author: "Mabuya Accounting Partners",
    minutes: 10,
  },
  {
    title: "Cashflow forecasting template",
    category: "finance",
    type: "template",
    desc: "A 13-week rolling cashflow template with formulas and scenarios.",
    author: "BlakNet Knowledge",
    minutes: 4,
  },
  {
    title: "Building your first operations manual",
    category: "operations",
    type: "guide",
    desc: "From SOPs to delegating your first manager — a simple, repeatable operations manual framework.",
    author: "BlakNet Knowledge",
    minutes: 11,
  },
  {
    title: "Hiring your first employee — the legal essentials",
    category: "hr",
    type: "checklist",
    desc: "Contracts, BCEA basics, UIF and COIDA in one checklist.",
    author: "Mokoena Attorneys",
    minutes: 7,
  },
  {
    title: "Why your business strategy needs a 12-month operating rhythm",
    category: "strategy",
    type: "article",
    desc: "A framework for translating ambition into a monthly operating cadence you can actually keep.",
    author: "BlakNet Knowledge",
    minutes: 8,
  },
  {
    title: "Choosing the right tech stack for a growing SMME",
    category: "technology",
    type: "guide",
    desc: "A pragmatic guide to CRM, accounting, operations and analytics tools for Black-owned businesses.",
    author: "Lwazi Cloud Systems",
    minutes: 13,
  },
  {
    title: "Sales fundamentals: from lead to closed deal",
    category: "sales",
    type: "workshop",
    desc: "A recorded workshop on a simple, repeatable sales process for service-based businesses.",
    author: "BlakNet Knowledge",
    minutes: 22,
  },
];

// newsfeed posts
const POSTS = [
  {
    author: "Lwazi Cloud Systems",
    type: "announcement",
    title: "We just shipped Lwazi DataHub 2.0",
    content:
      "Today we're launching DataHub 2.0 — a faster, more secure way for African enterprises to unify their data. Built by a 100% Black-owned engineering team. Proud of this one. 🚀",
  },
  {
    author: "Sakhisizwe Civils",
    type: "opportunity",
    title: "Subcontracting opportunity — KZN roads project",
    content:
      "We have an opening for a Level 1-2 B-BBEE subcontractor on a roads & stormwater package in KZN. Reach out via WhatsApp if you're CIBD 4CE+ graded.",
  },
  {
    author: "Mabuya Accounting Partners",
    type: "article",
    title: "B-BBEE in 2025 — what's actually changing",
    content:
      "We summarise the practical changes businesses should prepare for this year, and the three things most owners get wrong about ownership verification.",
  },
  {
    author: "Thari Agri Cooperative",
    type: "image",
    title: "Harvest is in 🥭",
    content: "Proud of the team. Macadamia and mango processed, packed and ready for export. From Black soil to supermarket shelves.",
  },
  {
    author: "Naledi Digital Studio",
    type: "announcement",
    title: "Now booking Q2 brand sprints",
    content: "We have space for two more brand sprints this quarter. Strategy, identity and a launch-ready website in 4 weeks.",
  },
  {
    author: "SolarSizwe Energy",
    type: "opportunity",
    title: "Free solar feasibility assessments — Eastern Cape",
    content: "For the month, we're running free feasibility assessments for any business spending over R25k/month on power. DM to book.",
  },
];

function addDays(days: number, hour = 9) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  console.log("🌱 Seeding BlakNet...");

  // wipe
  await prisma.comment.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.post.deleteMany();
  await prisma.eventAttendee.deleteMany();
  await prisma.event.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.businessService.deleteMany();
  await prisma.businessProduct.deleteMany();
  await prisma.businessReview.deleteMany();
  await prisma.businessMember.deleteMany();
  await prisma.verificationRequest.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.business.deleteMany();
  await prisma.subIndustry.deleteMany();
  await prisma.industry.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // ---------- demo user ----------
  const demoUser = await prisma.user.create({
    data: {
      email: "demo@blaknet.co.za",
      passwordHash: hash("blaknet123"),
      firstName: "Thandiwe",
      lastName: "Mokoena",
      role: "BUSINESS_OWNER",
      plan: "VERIFIED",
      phone: "+27 82 555 0100",
      bio: "Founder. Builder. Connector.",
    },
  });
  await prisma.subscription.create({
    data: {
      userId: demoUser.id,
      plan: "VERIFIED",
      status: "ACTIVE",
      provider: "yoco",
      providerSubscriptionId: "yoco_demo_001",
      startDate: new Date(),
      endDate: addDays(365),
    },
  });
  await prisma.profile.create({
    data: {
      userId: demoUser.id,
      headline: "Founder at Lwazi Cloud Systems",
      location: "Sandton, Gauteng",
      website: "https://lwazi.cloud",
    },
  });

  // ---------- admin ----------
  await prisma.user.create({
    data: {
      email: "admin@blaknet.co.za",
      passwordHash: hash("blaknetadmin"),
      firstName: "BlakNet",
      lastName: "Admin",
      role: "ADMIN",
      plan: "INTELLIGENCE",
      bio: "BlakNet platform administrator.",
    },
  });

  // ---------- industries ----------
  const industryMap: Record<string, string> = {};
  for (const ind of INDUSTRIES) {
    const created = await prisma.industry.create({
      data: {
        name: ind.name,
        slug: ind.slug,
        icon: ind.icon,
      },
    });
    industryMap[ind.slug] = created.id;
    for (const sub of ind.subs) {
      await prisma.subIndustry.create({
        data: { industryId: created.id, name: sub, slug: slugify(sub) },
      });
    }
  }

  // ---------- businesses ----------
  for (const b of BIZ) {
    const slug = slugify(b.name);
    const ownerId = b.name.includes("Lwazi") ? demoUser.id : undefined;
    const owner = ownerId
      ? demoUser
      : await prisma.user.create({
          data: {
            email: `owner.${slug}@blaknet.co.za`,
            passwordHash: hash("blaknet123"),
            firstName: b.name.split(" ")[0],
            lastName: b.name.split(" ").slice(1).join(" ") || "Founder",
            role: "BUSINESS_OWNER",
            plan: b.verified ? "VERIFIED" : "STARTER",
            phone: b.phone,
          },
        });
    const biz = await prisma.business.create({
      data: {
        ownerId: owner.id,
        name: b.name,
        slug,
        tagline: b.tagline,
        description: b.description,
        industryId: industryMap[b.industrySlug],
        province: b.province,
        city: b.city,
        address: `${b.city}, ${b.province}`,
        website: b.website,
        email: b.email,
        phone: b.phone,
        whatsapp: b.whatsapp,
        businessSize: b.size,
        yearFounded: b.founded,
        employeeCount: b.employees,
        annualRevenue: b.revenue,
        cipcNumber: b.cipc,
        bbbeeLevel: b.bbbee,
        logoUrl: logo(b.name, b.name),
        verificationStatus: b.verified ? "VERIFIED" : "NOT_VERIFIED",
        featured: b.featured,
        views: Math.floor(Math.random() * 9000) + 800,
        profileCompletion: b.verified ? 92 : 70,
      },
    });

    for (const s of b.services) {
      await prisma.businessService.create({ data: { businessId: biz.id, name: s } });
    }
    for (const p of b.products) {
      await prisma.businessProduct.create({ data: { businessId: biz.id, name: p } });
    }

    // reviews
    const reviewerNames = [
      ["Sipho Dlamini", "Acme Retail"],
      ["Nokwanda Zulu", "Umphakathi Logistics"],
      ["Lebo Molefe", "StoneHill Properties"],
      ["Tshepo Khosa", "Mvela Holdings"],
      ["Ayanda Mdluli", "Coastal Commodities"],
      ["Bongani Nkosi", "Vaal Engineering"],
    ];
    const reviewTemplates = [
      "Professional, responsive and delivered exactly what was agreed. Will work with them again.",
      "Strong team and clear communication throughout the project. Recommended.",
      "Reliable partner for our procurement needs. Compliance paperwork was in order.",
      "Great service and fair pricing. They understand the SA business context.",
      "Consistent quality. We've referred them to two of our partners.",
      "On time, on budget and easy to deal with.",
    ];
    for (let i = 0; i < b.reviewCount; i++) {
      const [rn, rc] = reviewerNames[i % reviewerNames.length];
      const r = (b.rating - 0.3 + (i % 3) * 0.2).toFixed(1);
      await prisma.businessReview.create({
        data: {
          businessId: biz.id,
          reviewerName: rn,
          reviewerCompany: rc,
          rating: Math.max(3, Math.min(5, Math.round(parseFloat(r)))),
          review: reviewTemplates[i % reviewTemplates.length],
          verificationStatus: "APPROVED",
          createdAt: new Date(Date.now() - i * 86400000),
        },
      });
    }

    // membership link
    await prisma.businessMember.create({
      data: { businessId: biz.id, userId: owner.id, role: "OWNER" },
    });

    // verification request for verified ones (approved)
    if (b.verified) {
      await prisma.verificationRequest.create({
        data: {
          businessId: biz.id,
          userId: owner.id,
          verificationType: "cipc",
          status: "APPROVED",
          adminNotes: "CIPC registration confirmed during onboarding review.",
          reviewedAt: new Date(),
        },
      });
    }
  }

  // ---------- events ----------
  for (const e of EVENTS) {
    const endDate = new Date(e.date);
    endDate.setHours(endDate.getHours() + 3);
    await prisma.event.create({
      data: {
        organizerId: demoUser.id,
        title: e.title,
        slug: slugify(e.title),
        description: e.desc,
        imageUrl: logo(e.title, e.title),
        category: e.category,
        startDate: e.date,
        endDate,
        location: e.location,
        isOnline: e.online,
        onlineUrl: e.online ? "https://meet.blaknet.co.za/" + slugify(e.title) : null,
        registrationUrl: "https://blaknet.co.za/#/events/" + slugify(e.title),
        capacity: e.online ? 500 : 120,
      },
    });
  }

  // ---------- resources ----------
  for (const r of RESOURCES) {
    await prisma.resource.create({
      data: {
        title: r.title,
        slug: slugify(r.title),
        description: r.desc,
        content: `${r.desc}\n\nThis ${r.type} is part of the BlakNet Knowledge base — practical, no-fluff resources built for Black-owned businesses preparing for procurement, funding and growth.\n\nKey takeaways:\n- Start with the checklist items relevant to your stage\n- Revisit quarterly\n- Pair with a verified BlakNet profile to signal readiness\n\nContributed by ${r.author}.`,
        category: r.category,
        resourceType: r.type,
        author: r.author,
        readMinutes: r.minutes,
        featured: r.type === "template" || r.type === "guide",
      },
    });
  }

  // ---------- posts ----------
  for (const p of POSTS) {
    const authorBusiness = await prisma.business.findFirst({ where: { name: p.author } });
    const authorId = authorBusiness?.ownerId ?? demoUser.id;
    await prisma.post.create({
      data: {
        authorId,
        businessId: authorBusiness?.id,
        content: p.content,
        postType: p.type,
        title: p.title,
        views: Math.floor(Math.random() * 400) + 40,
        createdAt: new Date(Date.now() - Math.random() * 5 * 86400000),
      },
    });
  }

  // ---------- notifications for demo user ----------
  const notifs = [
    { type: "verification", title: "Verification approved", message: "Lwazi Cloud Systems is now a Verified business on BlakNet." },
    { type: "review", title: "New 5-star review", message: "Sipho Dlamini left a 5-star review for Lwazi Cloud Systems." },
    { type: "connection", title: "New connection", message: "Mokoena Attorneys started following your business." },
    { type: "event", title: "Event reminder", message: "Procurement Open Day is in 20 days. Don't forget to register." },
    { type: "enquiry", title: "New business enquiry", message: "A Tier-1 retailer enquired about your services via your profile." },
    { type: "announcement", title: "Welcome to BlakNet", message: "Complete your profile to reach 100% and get discovered faster." },
  ];
  for (const n of notifs) {
    await prisma.notification.create({
      data: {
        userId: demoUser.id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: Math.random() > 0.5,
        createdAt: new Date(Date.now() - Math.random() * 6 * 86400000),
      },
    });
  }

  // ---------- sample contacts for CRM ----------
  const contacts = [
    { name: "Sipho Dlamini", company: "Acme Retail", position: "Procurement Manager", email: "sipho@acmeretail.co.za", phone: "+27 82 111 0001", category: "Procurement" },
    { name: "Nokwanda Zulu", company: "Umphakathi Logistics", position: "Operations Director", email: "nokwanda@umphakathi.co.za", phone: "+27 83 111 0002", category: "Partner" },
    { name: "Lebo Molefe", company: "StoneHill Properties", position: "CEO", email: "lebo@stonehill.co.za", phone: "+27 84 111 0003", category: "Client" },
    { name: "Tshepo Khosa", company: "Mvela Holdings", position: "Investment Associate", email: "tshepo@mvela.co.za", phone: "+27 85 111 0004", category: "Investor" },
    { name: "Ayanda Mdluli", company: "Coastal Commodities", position: "Founder", email: "ayanda@coastal.co.za", phone: "+27 86 111 0005", category: "Prospect" },
  ];
  for (const c of contacts) {
    await prisma.contact.create({
      data: { ownerId: demoUser.id, ...c, notes: "", tags: c.category },
    });
  }

  console.log("✅ Seed complete.");
  console.log(`   Demo user: demo@blaknet.co.za / blaknet123`);
  console.log(`   Admin:     admin@blaknet.co.za / blaknetadmin`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
