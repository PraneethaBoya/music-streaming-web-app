# 🚀 Complete Deployment Steps

## Step 1: Set Up PostgreSQL Database

### Option A: Local PostgreSQL
```bash
# Install PostgreSQL (if not installed)
# Windows: Download from postgresql.org
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql

# Create database
createdb musicstream

# Or using psql:
psql -U postgres
CREATE DATABASE musicstream;
\q
```

### Option B: Cloud PostgreSQL (Recommended)

**Using Supabase (Free):**
1. Go to https://supabase.com
2. Sign up for free account
3. Create new project
4. Go to Settings → Database
5. Copy the connection string (looks like: `postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres`)

**Using ElephantSQL (Free):**
1. Go to https://www.elephantsql.com
2. Sign up and create free instance
3. Copy the connection URL

## Step 2: Initialize Git Repository

```bash
# Navigate to project directory
cd "C:\Users\boyas\OneDrive\Desktop\Music streaming web app"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Music streaming app with backend"
```

## Step 3: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `music-streaming-app` (or your choice)
3. Description: "Modern music streaming web application"
4. Choose Public or Private
5. **Don't** initialize with README (we already have one)
6. Click "Create repository"

## Step 4: Connect and Push to GitHub

```bash
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/music-streaming-app.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 5: Set Up Environment Variables

Create `.env` file in project root:

```env
DATABASE_URL=postgresql://username:password@host:5432/dbname
JWT_SECRET=your-super-secret-key-minimum-32-characters-long
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
```

## Step 6: Install Dependencies

```bash
npm install
```

## Step 7: Set Up Database Schema

```bash
# Using psql command line
psql -d musicstream -f database/schema.sql

# Or if using cloud database, connect and run:
# Copy contents of database/schema.sql and run in database console
```

## Step 8: Test Locally

```bash
# Start development server
npm run dev

# Open browser
# http://localhost:3000
```

## Step 9: Deploy Backend

### Option A: Railway (Easiest)

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add environment variables:
   - `DATABASE_URL` (your PostgreSQL connection string)
   - `JWT_SECRET` (generate a random secret)
   - `NODE_ENV=production`
6. Railway will auto-detect Node.js and deploy
7. Copy the deployment URL (e.g., `https://your-app.railway.app`)

### Option B: Render

1. Go to https://render.com
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Settings:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment**: Node
6. Add environment variables (same as Railway)
7. Deploy!

### Option C: Heroku

```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
heroku create your-app-name

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set JWT_SECRET=your-secret-key
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

## Step 10: Deploy Frontend

### Option A: Vercel (Recommended)

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Framework Preset: **Other**
6. Build Command: (leave empty)
7. Output Directory: `.` (current directory)
8. Add environment variable:
   - `VITE_API_URL` or `REACT_APP_API_URL` = your backend URL
9. Deploy!

### Option B: Netlify

1. Go to https://netlify.com
2. Sign up with GitHub
3. Click "New site from Git"
4. Select your repository
5. Build settings:
   - **Build command**: (leave empty)
   - **Publish directory**: `.`
6. Add environment variable for API URL
7. Deploy!

### Option C: GitHub Pages

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
"deploy": "gh-pages -d ."

# Deploy
npm run deploy
```

## Step 11: Update Frontend API URLs

After deploying backend, update frontend JavaScript files to use the API:

1. Create `js/config.js`:
```javascript
const API_BASE_URL = 'https://your-backend-url.railway.app/api';
```

2. Update `js/auth.js` to use API instead of localStorage

## Step 12: Connect Frontend to Backend

Update authentication to use API endpoints instead of localStorage.

## ✅ Verification Checklist

- [ ] Database schema created
- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] API endpoints working
- [ ] Authentication working
- [ ] Database connection successful
- [ ] Environment variables set
- [ ] CORS configured correctly

## 🔧 Troubleshooting

### Database Connection Issues
- Check DATABASE_URL format
- Verify database is accessible
- Check firewall settings

### CORS Errors
- Add frontend URL to CORS_ORIGIN
- Check backend CORS configuration

### Build Errors
- Check Node.js version (should be 16+)
- Verify all dependencies installed
- Check environment variables

## 📞 Support

If you encounter issues:
1. Check server logs
2. Verify environment variables
3. Test API endpoints with Postman/curl
4. Check browser console for errors

