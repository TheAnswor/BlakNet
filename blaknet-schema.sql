-- ============================================================
--  BLAKNET — Complete Database Schema for Supabase
--  Paste this entire file into: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1. DROP EXISTING TABLES (safe to re-run)
DROP TABLE IF EXISTS verification_requests CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS business_enquiries CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS event_attendees CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS business_reviews CASCADE;
DROP TABLE IF EXISTS business_products CASCADE;
DROP TABLE IF EXISTS business_services CASCADE;
DROP TABLE IF EXISTS business_follows CASCADE;
DROP TABLE IF EXISTS business_invites CASCADE;
DROP TABLE IF EXISTS business_members CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS sub_industries CASCADE;
DROP TABLE IF EXISTS industries CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. CREATE TABLES

-- USERS
CREATE TABLE users (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  first_name    TEXT,
  last_name     TEXT,
  role          TEXT NOT NULL DEFAULT 'USER',
  plan          TEXT NOT NULL DEFAULT 'STARTER',
  profile_image TEXT,
  phone         TEXT,
  bio           TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SESSIONS
CREATE TABLE sessions (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  token      TEXT NOT NULL UNIQUE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sessions_token ON sessions(token);

-- PROFILES
CREATE TABLE profiles (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id       TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  headline      TEXT,
  location      TEXT,
  website       TEXT,
  linkedin      TEXT,
  notif_email    BOOLEAN NOT NULL DEFAULT true,
  notif_in_app  BOOLEAN NOT NULL DEFAULT true,
  notif_whatsapp BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDUSTRIES
CREATE TABLE industries (
  id    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name  TEXT NOT NULL,
  slug  TEXT NOT NULL UNIQUE,
  icon  TEXT
);

-- SUB-INDUSTRIES
CREATE TABLE sub_industries (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  industry_id TEXT NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL
);
CREATE INDEX idx_sub_industries_industry_id ON sub_industries(industry_id);

-- BUSINESSES
CREATE TABLE businesses (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  owner_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  tagline             TEXT,
  description         TEXT,
  industry_id         TEXT REFERENCES industries(id),
  province            TEXT,
  city                TEXT,
  address             TEXT,
  website             TEXT,
  email               TEXT,
  phone               TEXT,
  whatsapp            TEXT,
  business_size       TEXT,
  year_founded        INTEGER,
  employee_count      TEXT,
  annual_revenue      TEXT,
  cipc_number         TEXT,
  bbbee_level         TEXT,
  logo_url            TEXT,
  cover_url           TEXT,
  verification_status TEXT NOT NULL DEFAULT 'NOT_VERIFIED',
  featured            BOOLEAN NOT NULL DEFAULT false,
  views               INTEGER NOT NULL DEFAULT 0,
  profile_completion  INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX idx_businesses_industry_id ON businesses(industry_id);
CREATE INDEX idx_businesses_province ON businesses(province);

-- BUSINESS MEMBERS (team accounts)
CREATE TABLE business_members (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'OWNER',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, user_id)
);

-- BUSINESS INVITES
CREATE TABLE business_invites (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'STAFF',
  token       TEXT NOT NULL UNIQUE,
  status      TEXT NOT NULL DEFAULT 'PENDING',
  invited_by  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  accepted_by TEXT REFERENCES users(id),
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_business_invites_business_id ON business_invites(business_id);
CREATE INDEX idx_business_invites_email ON business_invites(email);

-- BUSINESS FOLLOWS
CREATE TABLE business_follows (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, user_id)
);
CREATE INDEX idx_business_follows_user_id ON business_follows(user_id);

-- BUSINESS SERVICES
CREATE TABLE business_services (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name        TEXT NOT NULL
);
CREATE INDEX idx_business_services_business_id ON business_services(business_id);

-- BUSINESS PRODUCTS
CREATE TABLE business_products (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name        TEXT NOT NULL
);
CREATE INDEX idx_business_products_business_id ON business_products(business_id);

-- BUSINESS REVIEWS
CREATE TABLE business_reviews (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id         TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  reviewer_id         TEXT REFERENCES users(id) ON DELETE SET NULL,
  reviewer_name       TEXT NOT NULL,
  reviewer_company    TEXT,
  rating              INTEGER NOT NULL,
  review              TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'APPROVED',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_business_reviews_business_id ON business_reviews(business_id);

-- POSTS (newsfeed)
CREATE TABLE posts (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  author_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id TEXT REFERENCES businesses(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  image_url   TEXT,
  post_type   TEXT NOT NULL DEFAULT 'text',
  title       TEXT,
  link        TEXT,
  pinned      BOOLEAN NOT NULL DEFAULT false,
  views       INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_business_id ON posts(business_id);

-- POST LIKES
CREATE TABLE post_likes (
  id        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id   TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- COMMENTS
CREATE TABLE comments (
  id        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id   TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_post_id ON comments(post_id);

-- EVENTS
CREATE TABLE events (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organizer_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id     TEXT REFERENCES businesses(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  description     TEXT NOT NULL,
  image_url       TEXT,
  category        TEXT NOT NULL,
  start_date     TIMESTAMPTZ NOT NULL,
  end_date        TIMESTAMPTZ,
  location        TEXT,
  is_online       BOOLEAN NOT NULL DEFAULT false,
  online_url      TEXT,
  registration_url TEXT,
  capacity        INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_start_date ON events(start_date);

-- EVENT ATTENDEES
CREATE TABLE event_attendees (
  id        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id  TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status    TEXT NOT NULL DEFAULT 'REGISTERED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- CONTACTS (CRM — legacy, may be unused in social model)
CREATE TABLE contacts (
  id        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  owner_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  company   TEXT,
  position  TEXT,
  email     TEXT,
  phone     TEXT,
  website   TEXT,
  notes     TEXT,
  category  TEXT NOT NULL DEFAULT 'Other',
  tags      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_contacts_owner_id ON contacts(owner_id);

-- BUSINESS ENQUIRIES
CREATE TABLE business_enquiries (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  company     TEXT,
  message     TEXT NOT NULL,
  enquiry_type TEXT NOT NULL DEFAULT 'general',
  status      TEXT NOT NULL DEFAULT 'new',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_business_enquiries_business_id ON business_enquiries(business_id);
CREATE INDEX idx_business_enquiries_user_id ON business_enquiries(user_id);

-- RESOURCES
CREATE TABLE resources (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT NOT NULL,
  content       TEXT NOT NULL,
  category      TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  image_url     TEXT,
  author        TEXT,
  read_minutes  INTEGER,
  featured      BOOLEAN NOT NULL DEFAULT false,
  published     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_resources_category ON resources(category);
CREATE INDEX idx_resources_resource_type ON resources(resource_type);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type      TEXT NOT NULL,
  title     TEXT NOT NULL,
  message   TEXT NOT NULL,
  link      TEXT,
  read      BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- SUBSCRIPTIONS
CREATE TABLE subscriptions (
  id                      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id                 TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  plan                    TEXT NOT NULL DEFAULT 'STARTER',
  status                  TEXT NOT NULL DEFAULT 'FREE',
  provider                TEXT,
  provider_subscription_id TEXT,
  start_date              TIMESTAMPTZ,
  end_date                TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- VERIFICATION REQUESTS
CREATE TABLE verification_requests (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_id      TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL,
  document_url     TEXT,
  notes            TEXT,
  status           TEXT NOT NULL DEFAULT 'PENDING',
  admin_notes      TEXT,
  reviewed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_verification_requests_business_id ON verification_requests(business_id);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);

-- 3. UPDATED_AT TRIGGER FUNCTION (auto-updates updated_at on row change)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. ATTACH TRIGGERS TO TABLES WITH updated_at
CREATE TRIGGER trigger_users_updated_at     BEFORE UPDATE ON users     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_profiles_updated_at  BEFORE UPDATE ON profiles  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_businesses_updated_at BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_posts_updated_at     BEFORE UPDATE ON posts     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_contacts_updated_at  BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
--  5. SEED DATA
-- ============================================================

-- DEMO USERS (passwords hashed with sha256 — "blaknet123" and "blaknetadmin")
-- Hash = sha256(password + "::blaknet") in hex
INSERT INTO users (id, email, password_hash, first_name, last_name, role, plan, phone, bio) VALUES
('user_demo',  'demo@blaknet.co.za',  '7bb01eb068be4297ec04a84698cec2456ecc1709af780e7926113c2050c017b2', 'Thandiwe', 'Mokoena',  'BUSINESS_OWNER', 'VERIFIED',    '+27 82 555 0100', 'Founder. Builder. Connector.'),
('user_admin', 'admin@blaknet.co.za', '2c3e3e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5', 'BlakNet',  'Admin',     'ADMIN',         'INTELLIGENCE', null,            'BlakNet platform administrator.')
ON CONFLICT (email) DO NOTHING;

-- PROFILES
INSERT INTO profiles (user_id, headline, location, website) VALUES
('user_demo', 'Founder at Lwazi Cloud Systems', 'Sandton, Gauteng', 'https://lwazi.cloud')
ON CONFLICT (user_id) DO NOTHING;

-- SUBSCRIPTIONS
INSERT INTO subscriptions (user_id, plan, status, provider, start_date, end_date) VALUES
('user_demo', 'VERIFIED', 'ACTIVE', 'yoco', now(), now() + interval '365 days')
ON CONFLICT (user_id) DO NOTHING;

-- INDUSTRIES
INSERT INTO industries (id, name, slug, icon) VALUES
('ind_tech',       'Technology',              'technology',            'Cpu'),
('ind_construction','Construction',            'construction',          'HardHat'),
('ind_finance',    'Finance & Accounting',     'finance-accounting',   'Landmark'),
('ind_agriculture','Agriculture',             'agriculture',           'Sprout'),
('ind_logistics',  'Logistics & Transport',    'logistics-transport',   'Truck'),
('ind_marketing',  'Marketing & Media',       'marketing-media',       'Megaphone'),
('ind_manufacturing','Manufacturing',          'manufacturing',         'Factory'),
('ind_security',   'Security Services',       'security-services',     'ShieldCheck'),
('ind_food',       'Food & Hospitality',      'food-hospitality',      'UtensilsCrossed'),
('ind_healthcare', 'Healthcare',              'healthcare',            'HeartPulse'),
('ind_legal',      'Legal Services',          'legal-services',        'Scale'),
('ind_energy',     'Energy & Renewables',     'energy-renewables',     'Zap')
ON CONFLICT (slug) DO NOTHING;

-- SUB-INDUSTRIES
INSERT INTO sub_industries (industry_id, name, slug) VALUES
('ind_tech',        'Software Development',  'software-development'),
('ind_tech',        'IT Services',           'it-services'),
('ind_tech',        'Cloud & DevOps',        'cloud-devops'),
('ind_construction','Civil Engineering',     'civil-engineering'),
('ind_construction','Building',              'building'),
('ind_finance',     'Accounting',            'accounting'),
('ind_finance',     'Tax Services',          'tax-services'),
('ind_agriculture','Crop Farming',           'crop-farming'),
('ind_agriculture','Agro-processing',       'agro-processing'),
('ind_logistics',   'Freight',               'freight'),
('ind_logistics',   'Courier',               'courier'),
('ind_marketing',   'Digital Marketing',     'digital-marketing'),
('ind_marketing',   'Brand Strategy',        'brand-strategy')
ON CONFLICT DO NOTHING;

-- DEMO BUSINESSES (subset — 4 key businesses)
INSERT INTO businesses (id, owner_id, name, slug, tagline, description, industry_id, province, city, address, website, email, phone, whatsapp, business_size, year_founded, employee_count, annual_revenue, cipc_number, bbbee_level, logo_url, verification_status, featured, views, profile_completion) VALUES
('biz_lwazi', 'user_demo', 'Lwazi Cloud Systems', 'lwazi-cloud-systems', 'Cloud-native software for African enterprise', 'Lwazi Cloud Systems builds cloud-native platforms, data pipelines and developer tooling for banks, insurers and retailers across SADC. We are a Level 2 B-BBEE contributor with a 60% Black-owned, 40% Black women-owned structure.', 'ind_tech', 'Gauteng', 'Sandton', 'Sandton, Gauteng', 'https://lwazi.cloud', 'hello@lwazi.cloud', '+27 11 555 0100', '+27 82 555 0100', 'small', 2018, '11-50', 'R5m-R10m', '2018/123456/07', 'Level 2', NULL, 'VERIFIED', true, 8277, 92),
('biz_sakhi', 'user_demo', 'Sakhisizwe Civils', 'sakhisizwe-civils', 'Building infrastructure that builds communities', 'Sakhisizwe Civils is a 100% Black-owned civil engineering and construction firm delivering roads, stormwater, water reticulation and community infrastructure for municipalities and Tier-1 contractors. CIDB Grading 6CE & 4GB.', 'ind_construction', 'KwaZulu-Natal', 'Durban', 'Durban, KZN', 'https://sakhisizwecivils.co.za', 'info@sakhisizwecivils.co.za', '+27 31 555 0142', '+27 83 555 0142', 'medium', 2011, '51-200', 'R25m-R50m', '2011/778812/07', 'Level 1', NULL, 'VERIFIED', true, 7734, 92),
('biz_mabuya', 'user_demo', 'Mabuya Accounting Partners', 'mabuya-accounting-partners', 'Numbers that move your business forward', 'Mabuya Accounting Partners provides accounting, tax, payroll and advisory services to SMMEs and mid-market firms. We are SAICA-registered and IRB-accredited, specialising in B-BBEE structuring and compliance for procurement-ready businesses.', 'ind_finance', 'Gauteng', 'Johannesburg', 'Johannesburg, Gauteng', 'https://mabuya.accountants', 'info@mabuya.accountants', '+27 11 555 0188', '+27 84 555 0188', 'small', 2015, '11-50', 'R5m-R10m', '2015/451290/07', 'Level 2', NULL, 'VERIFIED', true, 8588, 92),
('biz_solar', 'user_demo', 'SolarSizwe Energy', 'solarsizwe-energy', 'Powering the off-grid transition', 'SolarSizwe Energy designs, supplies and installs commercial and residential solar PV, battery storage and grid-tied systems across the Eastern Cape and Eastern seaboard. PV GreenCard installers.', 'ind_energy', 'Eastern Cape', 'Gqeberha', 'Gqeberha, Eastern Cape', 'https://solarsizwe.co.za', 'power@solarsizwe.co.za', '+27 41 555 0144', '+27 81 555 0144', 'small', 2018, '11-50', 'R10m-R25m', '2018/776214/07', 'Level 2', NULL, 'VERIFIED', true, 9566, 92)
ON CONFLICT (slug) DO NOTHING;

-- BUSINESS SERVICES
INSERT INTO business_services (business_id, name) VALUES
('biz_lwazi', 'Custom Software Development'),
('biz_lwazi', 'Cloud Migration'),
('biz_lwazi', 'DevOps Engineering'),
('biz_lwazi', 'Data Engineering'),
('biz_lwazi', 'API Integration'),
('biz_sakhi', 'Civil Engineering'),
('biz_sakhi', 'Roads & Stormwater'),
('biz_sakhi', 'Water & Sanitation'),
('biz_sakhi', 'Project Management'),
('biz_mabuya', 'Accounting'),
('biz_mabuya', 'Tax Services'),
('biz_mabuya', 'Payroll'),
('biz_mabuya', 'B-BBEE Advisory'),
('biz_solar', 'Solar PV Design'),
('biz_solar', 'Battery Storage'),
('biz_solar', 'Grid-Tied Systems'),
('biz_solar', 'Maintenance')
ON CONFLICT DO NOTHING;

-- BUSINESS PRODUCTS
INSERT INTO business_products (business_id, name) VALUES
('biz_lwazi', 'Lwazi DataHub'),
('biz_lwazi', 'Lwazi Auth Gateway'),
('biz_lwazi', 'Lwazi Observability Suite'),
('biz_sakhi', 'Sakhi Site Safety Kit'),
('biz_sakhi', 'Sakhi Plant Fleet'),
('biz_mabuya', 'Mabuya Monthly Books'),
('biz_mabuya', 'Mabuya Tax Pack'),
('biz_solar', 'Sizwe Home Kit'),
('biz_solar', 'Sizwe Commercial Array')
ON CONFLICT DO NOTHING;

-- BUSINESS MEMBERS (owner links)
INSERT INTO business_members (business_id, user_id, role) VALUES
('biz_lwazi', 'user_demo', 'OWNER'),
('biz_sakhi', 'user_demo', 'OWNER'),
('biz_mabuya', 'user_demo', 'OWNER'),
('biz_solar', 'user_demo', 'OWNER')
ON CONFLICT (business_id, user_id) DO NOTHING;

-- DEMO REVIEWS
INSERT INTO business_reviews (business_id, reviewer_name, reviewer_company, rating, review, verification_status) VALUES
('biz_lwazi', 'Sipho Dlamini', 'Acme Retail', 5, 'Professional, responsive and delivered exactly what was agreed. Will work with them again.', 'APPROVED'),
('biz_lwazi', 'Nokwanda Zulu', 'Umphakathi Logistics', 5, 'Strong team and clear communication throughout the project. Recommended.', 'APPROVED'),
('biz_sakhi', 'Lebo Molefe', 'StoneHill Properties', 5, 'Reliable partner for our procurement needs. Compliance paperwork was in order.', 'APPROVED'),
('biz_sakhi', 'Tshepo Khosa', 'Mvela Holdings', 4, 'Great service and fair pricing. They understand the SA business context.', 'APPROVED'),
('biz_mabuya', 'Ayanda Mdluli', 'Coastal Commodities', 5, 'Consistent quality. We have referred them to two of our partners.', 'APPROVED'),
('biz_mabuya', 'Bongani Nkosi', 'Vaal Engineering', 5, 'On time, on budget and easy to deal with.', 'APPROVED'),
('biz_solar', 'Sipho Dlamini', 'Acme Retail', 5, 'Excellent solar installation. Professional team from start to finish.', 'APPROVED'),
('biz_solar', 'Nokwanda Zulu', 'Umphakathi Logistics', 4, 'Great work, fair pricing. Highly recommend for commercial solar.', 'APPROVED')
ON CONFLICT DO NOTHING;

-- DEMO POSTS
INSERT INTO posts (author_id, business_id, content, post_type, title, views, created_at) VALUES
('user_demo', 'biz_lwazi', 'Today we are launching DataHub 2.0 — a faster, more secure way for African enterprises to unify their data. Built by a 100% Black-owned engineering team.', 'announcement', 'We just shipped Lwazi DataHub 2.0', 340, now() - interval '4 hours'),
('user_demo', 'biz_sakhi', 'We have an opening for a Level 1-2 B-BBEE subcontractor on a roads & stormwater package in KZN. Reach out via WhatsApp if you are CIBD 4CE+ graded.', 'opportunity', 'Subcontracting opportunity — KZN roads project', 280, now() - interval '8 hours'),
('user_demo', 'biz_mabuya', 'We summarise the practical changes businesses should prepare for this year, and the three things most owners get wrong about ownership verification.', 'article', 'B-BBEE in 2025 — what is actually changing', 190, now() - interval '12 hours'),
('user_demo', 'biz_solar', 'For the month, we are running free feasibility assessments for any business spending over R25k/month on power. DM to book.', 'opportunity', 'Free solar feasibility assessments — Eastern Cape', 210, now() - interval '1 day')
ON CONFLICT DO NOTHING;

-- DEMO EVENTS
INSERT INTO events (organizer_id, business_id, title, slug, description, category, start_date, end_date, location, is_online, online_url, registration_url, capacity) VALUES
('user_demo', NULL, 'BlakNet Founder Connect: Johannesburg', 'blaknet-founder-connect-johannesburg', 'An evening of curated founder-to-founder connections, procurement intros and a fireside chat with a leading Black-owned construction CEO.', 'networking', now() + interval '7 days', now() + interval '7 days' + interval '3 hours', 'Sandton Convention Centre, Johannesburg', false, NULL, NULL, 120),
('user_demo', NULL, 'B-BBEE Compliance Masterclass', 'bbbee-compliance-masterclass', 'A practical, half-day workshop unpacking ownership, management control, skills development, enterprise & supplier development and socio-economic development.', 'workshop', now() + interval '12 days', now() + interval '12 days' + interval '4 hours', NULL, true, 'https://meet.blaknet.co.za/bbbee-masterclass', NULL, 500),
('user_demo', NULL, 'Funding Readiness Webinar', 'funding-readiness-webinar', 'A panel of fund managers, DFIs and angel investors break down what makes a fundable Black-owned business in 2025.', 'funding', now() + interval '4 days', now() + interval '4 days' + interval '2 hours', NULL, true, 'https://meet.blaknet.co.za/funding-webinar', NULL, 500)
ON CONFLICT (slug) DO NOTHING;

-- DEMO RESOURCES
INSERT INTO resources (title, slug, description, content, category, resource_type, author, read_minutes, featured) VALUES
('How to register your business with CIPC — a 2025 guide', 'how-to-register-your-business-with-cipc', 'A step-by-step walkthrough to register a private company, reserve a name and get your CoR14.3.', 'This guide walks you through the CIPC registration process step by step.', 'starting', 'guide', 'BlakNet Knowledge', 8, true),
('B-BBEE Scorecard checklist for procurement readiness', 'bbbee-scorecard-checklist-for-procurement-readiness', 'Use this checklist to assess your readiness across all five pillars before approaching a Tier-1 buyer.', 'A practical checklist for B-BBEE compliance.', 'bbbee', 'checklist', 'Mabuya Accounting Partners', 6, true),
('Funding map for Black-owned SMMEs in South Africa', 'funding-map-for-black-owned-smmes', 'A practical map of DFIs, angels, crowdfunders and accelerators — and what each actually funds.', 'A comprehensive funding guide.', 'funding', 'guide', 'BlakNet Knowledge', 12, true),
('Tax compliance for SMMEs: SARS basics', 'tax-compliance-for-smmes-sars-basics', 'Income tax, VAT and PAYE essentials every Black-owned SMME should understand from day one.', 'SARS compliance basics.', 'compliance', 'article', 'Mabuya Accounting Partners', 10, false),
('Cashflow forecasting template', 'cashflow-forecasting-template', 'A 13-week rolling cashflow template with formulas and scenarios.', 'A practical cashflow template.', 'finance', 'template', 'BlakNet Knowledge', 4, true),
('Marketing on a R0 budget: the township brand playbook', 'marketing-on-a-zero-budget', 'How Black-owned brands are building community, content and conversion without a marketing budget.', 'Marketing guide for township brands.', 'marketing', 'article', 'Naledi Digital Studio', 9, false)
ON CONFLICT (slug) DO NOTHING;

-- DEMO NOTIFICATIONS
INSERT INTO notifications (user_id, type, title, message, link, read) VALUES
('user_demo', 'verification', 'Verification approved', 'Lwazi Cloud Systems is now a Verified business on BlakNet.', '#/dashboard-businesses', false),
('user_demo', 'review', 'New 5-star review', 'Sipho Dlamini left a 5-star review for Lwazi Cloud Systems.', '#/dashboard-businesses', false),
('user_demo', 'connection', 'New connection', 'Mokoena Attorneys started following your business.', '#/dashboard-following', false),
('user_demo', 'event', 'Event reminder', 'Funding Readiness Webinar is in 4 days. Do not forget to register.', '#/events', true),
('user_demo', 'enquiry', 'New business enquiry', 'A Tier-1 retailer enquired about your services via your profile.', '#/dashboard-enquiries', false),
('user_demo', 'announcement', 'Welcome to BlakNet', 'Complete your profile to reach 100% and get discovered faster.', '#/dashboard-settings', true)
ON CONFLICT DO NOTHING;

-- ============================================================
--  DONE! Your BlakNet database is ready.
--
--  Login credentials:
--    Demo:  demo@blaknet.co.za / blaknet123
--    Admin: admin@blaknet.co.za / blaknetadmin
-- ============================================================
