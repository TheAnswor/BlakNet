# BlakNet Deployment Guide

## Prerequisites
- Node.js 18+ (or Bun)
- A hosting plan that supports Node.js (VPS, or Hostinger VPS plan)

> **Note**: Hostinger **shared** hosting does NOT support Node.js apps.
> You need a Hostinger **VPS** plan, or use Vercel/Render/Railway instead.

## Quick Deploy on Vercel (recommended)
```bash
# 1. Push to GitHub (already done)
# 2. Go to vercel.com → New Project → Import TheAnswor/BlakNet
# 3. Framework: Next.js (auto-detected)
# 4. Add Environment Variable:
#    DATABASE_URL = file:./db/custom.db
# 5. Build Command: bun run build
# 6. Deploy
```

## Deploy on Hostinger VPS

### 1. SSH into your server
```bash
ssh user@your-server-ip
```

### 2. Install Node.js + Bun
```bash
curl -fsSL https://bun.sh/install | bash
# or install Node.js 18+ via nvm
```

### 3. Clone the repo
```bash
git clone https://github.com/TheAnswor/BlakNet.git
cd BlakNet
```

### 4. Install dependencies + build
```bash
bun install
bun run db:push    # create the database
bun run db:seed    # seed demo data
bun run build      # build for production
```

### 5. Set environment variables
Create a `.env` file:
```env
DATABASE_URL=file:./db/custom.db
```

### 6. Start the production server
```bash
bun run start
# OR: node .next/standalone/server.js
```

### 7. Set up a reverse proxy (nginx/Apache)
Point your domain to `localhost:3000`:

**Apache** (`.htaccess` in public_html):
```apache
RewriteEngine On
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
ProxyPassReverse / http://localhost:3000/
```

**OR nginx**:
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

### 8. Keep it running (PM2)
```bash
npm install -g pm2
pm2 start "node .next/standalone/server.js" --name blaknet
pm2 startup
pm2 save
```

## Deploy with Docker
```bash
# Build
docker build -t blaknet .

# Run
docker run -p 3000:3000 -v $(pwd)/db:/app/db blaknet
```

## Login Credentials (demo data)
- **Demo user**: demo@blaknet.co.za / blaknet123
- **Admin**: admin@blaknet.co.za / blaknetadmin

## Troubleshooting

### "Doesn't login" / cookie issues
- Make sure you're accessing via **HTTPS** in production (the cookie uses `secure: true` + `sameSite: none` in production)
- If using a reverse proxy, make sure it forwards the `Host` and `X-Forwarded-Proto` headers
- Check that the database file exists and is writable: `ls -la db/custom.db`

### Database not found
```bash
# The DATABASE_URL is relative: file:./db/custom.db
# Make sure the db/ directory exists and is writable:
mkdir -p db
chmod 755 db
# Re-seed if needed:
bun run db:push && bun run db:seed
```

### Port already in use
```bash
# Change the port:
PORT=8080 node .next/standalone/server.js
```
