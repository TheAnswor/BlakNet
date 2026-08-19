# BlakNet Deployment Guide

## Database: Supabase (PostgreSQL)

BlakNet uses **Supabase** as its database. This is a free, cloud-hosted PostgreSQL database that works from any server.

### Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) → Sign up (free)
2. Create a **New Project** (pick a name, choose a region close to your users)
3. Set a database password (save it!)
4. Wait ~2 minutes for the project to be ready

### Step 2: Get Your Connection String
1. Go to **Project Settings → Database**
2. Find the **Connection string** section
3. Copy the **Direct connection** string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

### Step 3: Configure the App
Create a `.env` file in the project root:
```env
DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres"
```

### Step 4: Set Up the Database
```bash
# Install dependencies
bun install

# Generate Prisma client + create all tables + seed demo data
bun run db:setup
```

This creates all tables in Supabase and seeds:
- 12 realistic South African demo businesses across multiple industries
- 6 events, 12 resources, 6 newsfeed posts
- Demo user: demo@blaknet.co.za / blaknet123 (VERIFIED plan)
- Admin: admin@blaknet.co.za / blaknetadmin

---

## Deploy on Vercel (recommended — 2 minutes)

1. Push the repo to GitHub (already done: https://github.com/TheAnswor/BlakNet)
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import `TheAnswor/BlakNet`
3. Framework Preset: **Next.js** (auto-detected)
4. Add **Environment Variable**:
   - `DATABASE_URL` = your Supabase connection string
5. **Deploy** — Vercel builds and hosts the app automatically
6. You get a live URL like `blaknet.vercel.app` — share it with your superior!

---

## Deploy on Hostinger VPS

### 1. SSH into your server
```bash
ssh user@your-server-ip
```

### 2. Install Bun
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

### 3. Clone + build
```bash
git clone https://github.com/TheAnswor/BlakNet.git
cd BlakNet

# Set the Supabase connection string
echo 'DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_REF.supabase.co:5432/postgres"' > .env

# Install + setup database + build
bun install
bun run db:setup
bun run build
```

### 4. Start the production server
```bash
bun run start
# OR: node .next/standalone/server.js
```

### 5. Set up a reverse proxy (nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 6. Keep it running with PM2
```bash
npm install -g pm2
pm2 start "node .next/standalone/server.js" --name blaknet
pm2 startup
pm2 save
```

---

## Login Credentials (after seeding)
- **Demo user**: demo@blaknet.co.za / blaknet123 (VERIFIED plan)
- **Admin**: admin@blaknet.co.za / blaknetadmin

## Troubleshooting

### "Doesn't login" / connection errors
- Verify the `DATABASE_URL` in `.env` matches your Supabase connection string exactly
- Make sure the password is correct (no special characters that need URL encoding)
- Check that your Supabase project is running (not paused)
- For Vercel: add `DATABASE_URL` as an Environment Variable in the Vercel dashboard

### Database tables missing
```bash
bun run db:setup  # creates tables + seeds demo data
```

### Build fails
```bash
bun install          # reinstall dependencies
bun run db:generate  # regenerate Prisma client for PostgreSQL
bun run build        # build the app
```
