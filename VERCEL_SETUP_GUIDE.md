# 🚀 GitHub Streak Stats - Vercel Self-Hosting Setup Guide

## ✅ Step 1: Deploy to Vercel (COMPLETED!)

You've already done this! Your project is deployed at Vercel. 

The "404 NOT_FOUND" error you're seeing is expected - the service needs a GitHub token to work.

---

## 📝 Step 2: Create GitHub Personal Access Token

### 2.1 Go to GitHub Token Settings
**Direct Link:** https://github.com/settings/tokens/new

Or navigate manually:
1. Click your profile picture (top right) → **Settings**
2. Scroll down to **Developer settings** (bottom left)
3. Click **Personal access tokens** → **Tokens (classic)**
4. Click **Generate new token** → **Generate new token (classic)**

### 2.2 Configure the Token

Fill in these details:

- **Note:** `Streak Stats Service` (or any name you want)
- **Expiration:** `No expiration` (or choose a duration)
- **Scopes:** ⚠️ **IMPORTANT: Leave ALL boxes UNCHECKED**
  - You don't need any permissions
  - The token only reads public data

### 2.3 Generate and Copy Token

1. Scroll to bottom and click **Generate token**
2. **COPY the token immediately** (starts with `ghp_`)
3. ⚠️ **You can only see it once** - save it somewhere safe temporarily

**Example token format:** `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 🔧 Step 3: Add Token to Vercel

### 3.1 Go to Your Vercel Project

**Direct Link to Projects:** https://vercel.com/dashboard

1. Find your newly deployed project (should be called `github-readme-streak-stats`)
2. Click on the project

### 3.2 Add Environment Variable

1. Click **Settings** tab (top navigation)
2. Click **Environment Variables** (left sidebar)
3. Add the following:

```
Name:  TOKEN
Value: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (paste your token here)
```

4. Select which environments: ✅ **Production** ✅ **Preview** ✅ **Development**
5. Click **Save**

### 3.3 Redeploy

After adding the token:
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **...** menu (three dots)
4. Click **Redeploy**
5. Confirm redeploy

Wait about 30-60 seconds for the build to complete.

---

## 🎯 Step 4: Get Your Personal URL

### 4.1 Find Your Vercel URL

After redeployment finishes:
1. Go to your project dashboard
2. You'll see your URL at the top (e.g., `github-readme-streak-stats-xxx.vercel.app`)
3. **Copy this URL**

### 4.2 Test Your Service

Open this URL in your browser (replace with your actual URL):
```
https://your-project-name.vercel.app/?user=hmusamaofficial&theme=tokyonight
```

You should see your streak stats! 🎉

---

## 📄 Step 5: Update Your README

### 5.1 Edit README.md

Replace the current streak badge URL with your personal Vercel URL:

**Find this line (around line 156):**
```html
<img src="https://streak-stats.demolab.com/?user=hmusamaofficial&theme=tokyonight&hide_border=true&background=0D1117" alt="GitHub Streak" />
```

**Replace with:**
```html
<img src="https://YOUR-PROJECT-NAME.vercel.app/?user=hmusamaofficial&theme=tokyonight&hide_border=true&background=0D1117" alt="GitHub Streak" />
```

### 5.2 Commit and Push

Save the file and commit the change. Your profile will now use YOUR personal streak service!

---

## ✨ You're Done!

### Benefits of Your Setup:

✅ **100% Reliability** - You control the service  
✅ **No more errors** - Your dedicated instance  
✅ **Free hosting** - Vercel free tier (Student Pack bonus)  
✅ **Auto-updates** - Streak updates with each profile view  
✅ **Professional** - No intermittent downtime

---

## 🔍 Troubleshooting

### Still seeing 404 error?
- Make sure you added the TOKEN environment variable
- Make sure you redeployed after adding the token
- Wait 1-2 minutes after redeployment

### Token expired?
- Go to GitHub → Settings → Developer settings → Tokens
- Generate a new token with "No expiration"
- Update the TOKEN variable in Vercel
- Redeploy

### Need help?
- Check Vercel deployment logs in the Deployments tab
- Ensure your token starts with `ghp_`
- Make sure no scopes/permissions are selected on the token

---

## 📚 Quick Reference Links

- **Create GitHub Token:** https://github.com/settings/tokens/new
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Original Repo:** https://github.com/DenverCoder1/github-readme-streak-stats

---

**Estimated Total Time:** 5-7 minutes

**Your service will be online 24/7 with 100% reliability!** 🚀
