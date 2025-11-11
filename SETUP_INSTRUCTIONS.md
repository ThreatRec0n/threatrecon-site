# 🚀 Supabase Setup Instructions

## Step 1: Restart Your Development Server

1. **Look at your terminal** where `npm run dev` is running
2. **Press `Ctrl + C`** to stop the server
3. **Run this command** to start it again:
   ```
   npm run dev
   ```
4. **Wait for it to start** - you should see "Ready" message
5. **Open your browser** to http://localhost:3000
6. **Check the header** - you should now see "Sign In" and "Sign Up" buttons in the top-right corner

✅ **If you see the buttons, you're done with local setup!**

---

## Step 2: Add Environment Variables to Vercel (for production)

You have 2 options:

### Option A: Using Vercel Dashboard (Easiest)

1. **Go to**: https://vercel.com/dashboard
2. **Click on your project** (threatrecon-site)
3. **Click "Settings"** (in the top menu)
4. **Click "Environment Variables"** (in the left sidebar)
5. **Click "Add New"** button
6. **Add first variable**:
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: `https://uiikieptwxstqhcahtkox.supabase.co`
   - **Environments**: Check all three boxes (Production, Preview, Development)
   - **Click "Save"**
7. **Click "Add New"** again
8. **Add second variable**:
   - **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpa2llcHR3eHN0cWhjYWhrdG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTg2MDAsImV4cCI6MjA3ODM5NDYwMH0.oUcxGm74g4DTXmwqkWs4QzNFtdCUageIznMTEgBo8lA`
   - **Environments**: Check all three boxes (Production, Preview, Development)
   - **Click "Save"**
9. **Go to "Deployments"** tab
10. **Click the three dots** (⋯) on your latest deployment
11. **Click "Redeploy"**
12. **Wait for deployment to finish**

✅ **Done! Your production site now has Supabase enabled!**

---

### Option B: Using Command Line (Advanced)

1. **Open PowerShell** in your project folder
2. **Run this command** to login:
   ```
   vercel login
   ```
   (This will open your browser - follow the prompts)
3. **Run the script**:
   ```
   .\setup-vercel-env.ps1
   ```
4. **Redeploy**:
   ```
   vercel --prod
   ```

---

## ✅ Verification

After completing both steps:

- **Local**: Sign In/Sign Up buttons should appear in header
- **Production**: After redeploy, buttons should appear on your live site

---

## 🆘 Troubleshooting

**Buttons still not showing locally?**
- Make sure you restarted the dev server (Step 1)
- Check that `.env.local` file exists in your project root
- Check browser console for errors (F12 → Console tab)

**Buttons not showing in production?**
- Make sure you added BOTH environment variables in Vercel
- Make sure you selected ALL environments (Production, Preview, Development)
- Make sure you redeployed after adding the variables

