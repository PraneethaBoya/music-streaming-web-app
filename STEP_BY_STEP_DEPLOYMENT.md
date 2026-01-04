# 📚 Step-by-Step Deployment Guide
## Complete Guide to Deploy Your Music Streaming App

---

## 🎯 Overview

This guide will walk you through:
1. Setting up PostgreSQL database (cloud)
2. Setting up GitHub repository
3. Deploying backend server
4. Deploying frontend
5. Connecting everything together

**Time Required:** 30-45 minutes  
**Difficulty:** Beginner-friendly

---

## 📋 Prerequisites Checklist

Before starting, make sure you have:
- [ ] A GitHub account (free) - https://github.com
- [ ] A computer with internet connection
- [ ] Node.js installed (download from nodejs.org if not installed)
- [ ] Git installed (usually comes with Node.js)

---

## PART 1: Database Setup (PostgreSQL)

### Step 1.1: Create Supabase Account (Free PostgreSQL)

1. **Go to Supabase**
   - Visit: https://supabase.com
   - Click "Start your project"

2. **Sign Up**
   - Click "Sign up" or "Sign in with GitHub"
   - Create your account (it's free!)

3. **Create New Project**
   - Click "New Project"
   - **Organization**: Create new or use default
   - **Name**: `music-streaming-app` (or any name)
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose closest to you
   - Click "Create new project"
   - ⏳ Wait 2-3 minutes for setup

### Step 1.2: Get Database Connection String

1. **Go to Project Settings**
   - In your Supabase project, click "Settings" (gear icon) in left sidebar
   - Click "Database"

2. **Copy Connection String**
   - Scroll down to "Connection string"
   - Find "URI" tab
   - Copy the connection string
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`
   - **SAVE THIS** - You'll need it later!

### Step 1.3: Create Database Tables

1. **Open SQL Editor**
   - In Supabase, click "SQL Editor" in left sidebar
   - Click "New query"

2. **Run Schema**
   - Open the file `database/schema.sql` from your project
   - Copy ALL the contents
   - Paste into Supabase SQL Editor
   - Click "Run" (or press Ctrl+Enter)
   - ✅ You should see "Success. No rows returned"

3. **Verify Tables Created**
   - In left sidebar, click "Table Editor"
   - You should see tables: `users`, `artists`, `songs`, `playlists`, etc.

**✅ Database Setup Complete!**

---

## PART 2: GitHub Repository Setup

### Step 2.1: Create GitHub Account (if needed)

1. Go to https://github.com
2. Sign up (it's free)
3. Verify your email

### Step 2.2: Create New Repository on GitHub

1. **Go to GitHub**
   - Log in to your GitHub account
   - Click the "+" icon in top right
   - Select "New repository"

2. **Repository Settings**
   - **Repository name**: `music-streaming-app`
   - **Description**: "Music streaming web application"
   - **Visibility**: Choose Public or Private
   - **⚠️ IMPORTANT**: Do NOT check "Add a README file"
   - **⚠️ IMPORTANT**: Do NOT add .gitignore or license
   - Click "Create repository"

3. **Copy Repository URL**
   - GitHub will show you a page with commands
   - Copy the repository URL (looks like: `https://github.com/YOUR_USERNAME/music-streaming-app.git`)
   - **SAVE THIS URL**

### Step 2.3: Initialize Git in Your Project

1. **Open Terminal/Command Prompt**
   - **Windows**: Press `Win + R`, type `cmd`, press Enter
   - **Mac**: Press `Cmd + Space`, type `Terminal`, press Enter
   - **Linux**: Press `Ctrl + Alt + T`

2. **Navigate to Your Project**
   ```bash
   cd "C:\Users\boyas\OneDrive\Desktop\Music streaming web app"
   ```
   (Adjust path if different)

3. **Check if Git is Initialized**
   ```bash
   git status
   ```
   - If it says "not a git repository", continue to next step
   - If it shows files, git is already initialized

4. **Initialize Git** (if needed)
   ```bash
   git init
   ```

5. **Add All Files**
   ```bash
   git add .
   ```

6. **Create First Commit**
   ```bash
   git commit -m "Initial commit: Music streaming app"
   ```

7. **Connect to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/music-streaming-app.git
   ```
   (Replace YOUR_USERNAME with your actual GitHub username)

8. **Rename Branch to Main**
   ```bash
   git branch -M main
   ```

9. **Push to GitHub**
   ```bash
   git push -u origin main
   ```
   - You'll be asked for GitHub username and password
   - For password, use a **Personal Access Token** (see Step 2.4 below)

### Step 2.4: Create GitHub Personal Access Token

1. **Go to GitHub Settings**
   - Click your profile picture (top right)
   - Click "Settings"

2. **Create Token**
   - Scroll down, click "Developer settings"
   - Click "Personal access tokens" → "Tokens (classic)"
   - Click "Generate new token" → "Generate new token (classic)"

3. **Token Settings**
   - **Note**: "Music App Deployment"
   - **Expiration**: 90 days (or your choice)
   - **Scopes**: Check "repo" (this selects all repo permissions)
   - Click "Generate token"

4. **Copy Token**
   - ⚠️ **IMPORTANT**: Copy the token immediately (you won't see it again!)
   - Save it securely

5. **Use Token as Password**
   - When pushing to GitHub, use your GitHub username
   - Use the **token** as the password (not your GitHub password)

**✅ GitHub Setup Complete!**

---

## PART 3: Backend Deployment (Railway)

### Step 3.1: Create Railway Account

1. **Go to Railway**
   - Visit: https://railway.app
   - Click "Start a New Project"

2. **Sign Up**
   - Click "Login with GitHub"
   - Authorize Railway to access your GitHub

### Step 3.2: Deploy Your Project

1. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Find and select `music-streaming-app` repository
   - Click "Deploy Now"

2. **Wait for Initial Deploy**
   - Railway will detect Node.js automatically
   - Wait 2-3 minutes for first deployment
   - It will fail initially (we need to add environment variables)

### Step 3.3: Add Environment Variables

1. **Open Project Settings**
   - Click on your project in Railway
   - Click "Variables" tab

2. **Add Variables**
   Click "New Variable" and add these one by one:

   **Variable 1:**
   - **Name**: `DATABASE_URL`
   - **Value**: (Paste your Supabase connection string from Step 1.2)
   - Click "Add"

   **Variable 2:**
   - **Name**: `JWT_SECRET`
   - **Value**: (Generate a random string, at least 32 characters)
     - You can use: https://randomkeygen.com (use "CodeIgniter Encryption Keys")
   - Click "Add"

   **Variable 3:**
   - **Name**: `NODE_ENV`
   - **Value**: `production`
   - Click "Add"

   **Variable 4:**
   - **Name**: `PORT`
   - **Value**: (Leave empty - Railway auto-assigns)

3. **Redeploy**
   - After adding variables, Railway will auto-redeploy
   - Wait 2-3 minutes
   - Check "Deployments" tab to see status

### Step 3.4: Get Your Backend URL

1. **Open Project**
   - Click on your project
   - Click "Settings" tab
   - Scroll to "Domains"

2. **Generate Domain**
   - Click "Generate Domain"
   - Copy the URL (looks like: `https://your-app-name.up.railway.app`)
   - **SAVE THIS URL** - This is your backend API URL!

**✅ Backend Deployment Complete!**

---

## PART 4: Frontend Deployment (Vercel)

### Step 4.1: Create Vercel Account

1. **Go to Vercel**
   - Visit: https://vercel.com
   - Click "Sign Up"

2. **Sign Up with GitHub**
   - Click "Continue with GitHub"
   - Authorize Vercel

### Step 4.2: Deploy Frontend

1. **Import Project**
   - Click "Add New..." → "Project"
   - Find and select `music-streaming-app` repository
   - Click "Import"

2. **Configure Project**
   - **Framework Preset**: Select "Other"
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: (leave empty)
   - **Output Directory**: `./` (leave as is)
   - **Install Command**: `npm install` (should auto-fill)

3. **Environment Variables**
   - Click "Environment Variables"
   - Add variable:
     - **Name**: `VITE_API_URL` or `REACT_APP_API_URL`
     - **Value**: `https://your-railway-app.up.railway.app/api`
       (Use your Railway backend URL from Step 3.4)
   - Click "Add"

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - ✅ Your app is deploying!

### Step 4.3: Get Your Frontend URL

1. **After Deployment**
   - Vercel will show "Congratulations!"
   - Copy the URL (looks like: `https://music-streaming-app.vercel.app`)
   - **SAVE THIS URL** - This is your live app!

**✅ Frontend Deployment Complete!**

---

## PART 5: Connect Frontend to Backend

### Step 5.1: Update API Configuration

1. **Edit Config File**
   - In your project, open `js/config.js`
   - Update the API URL:

   ```javascript
   // Change this line:
   const API_BASE_URL = 'http://localhost:3000/api';
   
   // To this (use your Railway URL):
   const API_BASE_URL = 'https://your-railway-app.up.railway.app/api';
   ```

2. **Commit and Push Changes**
   ```bash
   git add js/config.js
   git commit -m "Update API URL for production"
   git push
   ```

3. **Redeploy Frontend**
   - Vercel will automatically redeploy when you push
   - Wait 2-3 minutes

**✅ Everything Connected!**

---

## PART 6: Testing Your Deployment

### Step 6.1: Test Backend API

1. **Test Health Endpoint**
   - Open browser
   - Go to: `https://your-railway-app.up.railway.app/api/health`
   - Should see: `{"status":"ok","message":"Server is running"}`

2. **Test Database Connection**
   - Check Railway logs
   - Should see: "✅ Connected to PostgreSQL database"

### Step 6.2: Test Frontend

1. **Open Your App**
   - Go to your Vercel URL
   - Try to register a new account
   - Try to login

2. **Check Browser Console**
   - Press F12
   - Go to "Console" tab
   - Look for any errors

---

## 🎉 Congratulations!

Your app is now live! 🚀

**Your URLs:**
- **Frontend**: `https://your-app.vercel.app`
- **Backend API**: `https://your-app.railway.app/api`
- **Database**: Supabase (managed)

---

## 🔄 Making Updates

After making changes to your code:

1. **Make Changes**
   - Edit your files locally

2. **Commit Changes**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```

3. **Auto-Deploy**
   - Railway and Vercel will automatically redeploy
   - Wait 2-3 minutes
   - Changes will be live!

---

## 🐛 Troubleshooting

### Problem: Backend deployment fails
**Solution:**
- Check Railway logs (click "View Logs")
- Verify all environment variables are set
- Check DATABASE_URL format

### Problem: Frontend can't connect to backend
**Solution:**
- Verify API URL in `js/config.js` is correct
- Check CORS settings in `server.js`
- Verify backend is running (check Railway)

### Problem: Database connection error
**Solution:**
- Verify DATABASE_URL is correct
- Check Supabase project is active
- Verify database password is correct

### Problem: Git push fails
**Solution:**
- Use Personal Access Token (not password)
- Verify repository URL is correct
- Check you have write access to repo

---

## 📞 Need Help?

1. Check Railway logs for backend errors
2. Check Vercel logs for frontend errors
3. Check browser console (F12) for client errors
4. Verify all environment variables are set correctly

---

## ✅ Final Checklist

- [ ] Database created and schema run
- [ ] GitHub repository created and code pushed
- [ ] Backend deployed on Railway
- [ ] Environment variables set in Railway
- [ ] Frontend deployed on Vercel
- [ ] API URL updated in config.js
- [ ] Tested registration and login
- [ ] Everything working! 🎉

---

**You're all set! Your music streaming app is now live on the internet! 🎵**

