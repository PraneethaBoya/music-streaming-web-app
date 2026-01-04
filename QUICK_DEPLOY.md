# ⚡ Quick Deployment Guide

## 🎯 Fastest Way to Deploy

### 1. Database Setup (5 minutes)

**Use Supabase (Free):**
1. Go to https://supabase.com → Sign up
2. Create new project
3. Go to SQL Editor
4. Copy and paste contents of `database/schema.sql`
5. Run the SQL
6. Copy connection string from Settings → Database

### 2. GitHub Setup (2 minutes)

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/music-streaming-app.git
git push -u origin main
```

### 3. Backend Deployment (5 minutes)

**Railway:**
1. Go to https://railway.app → Sign up with GitHub
2. New Project → Deploy from GitHub
3. Select your repo
4. Add environment variables:
   - `DATABASE_URL` = (your Supabase connection string)
   - `JWT_SECRET` = (any random string, 32+ chars)
   - `NODE_ENV` = production
5. Deploy! (auto-detects Node.js)

### 4. Frontend Deployment (3 minutes)

**Vercel:**
1. Go to https://vercel.com → Sign up with GitHub
2. New Project → Import repo
3. Framework: Other
4. Deploy!

### 5. Update API URL

In `js/config.js`, update:
```javascript
const API_BASE_URL = 'https://your-railway-app.railway.app/api';
```

Redeploy frontend.

## ✅ Done!

Your app is now live! 🎉

**Backend URL**: `https://your-app.railway.app`
**Frontend URL**: `https://your-app.vercel.app`

## 🔄 Update Process

After making changes:
```bash
git add .
git commit -m "Your changes"
git push
```

Railway and Vercel auto-deploy on push!

