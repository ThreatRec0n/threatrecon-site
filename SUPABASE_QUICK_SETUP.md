# 🚀 Supabase Quick Setup Guide

**Complete step-by-step guide to set up Supabase free tier for ThreatRecon**

---

## ✅ Step 1: Create Supabase Account & Project (5 minutes)

1. **Go to Supabase**: https://supabase.com
2. **Sign up** (free) or **log in**
3. **Click "New Project"**
4. **Fill in the form**:
   - **Name**: `ThreatRecon` (or your choice)
   - **Database Password**: ⚠️ **SAVE THIS PASSWORD!** You'll need it later
   - **Region**: Choose closest to your users (e.g., `US East` or `Europe West`)
   - **Pricing Plan**: Select **Free** (it's free forever!)
5. **Click "Create new project"**
6. **Wait 2-3 minutes** for project to be created

---

## 🔑 Step 2: Get Your API Keys (2 minutes)

1. In your Supabase dashboard, click **Settings** (gear icon) → **API**
2. **Copy these two values**:

   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   ⚠️ **Keep these safe!** You'll add them to your project.

---

## 📝 Step 3: Add Environment Variables (3 minutes)

1. **In your project root**, create `.env.local` file (if it doesn't exist)

2. **Add these two lines**:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   Replace with your actual values from Step 2.

3. **Save the file**

   ⚠️ **Important**: 
   - Never commit `.env.local` to git (it's already in `.gitignore`)
   - These are public keys, safe to use in frontend code
   - The `anon` key is designed to be public

---

## 🗄️ Step 4: Create Database Tables (5 minutes)

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. **Open** `supabase-schema-complete.sql` from your project
4. **Copy the entire contents** and paste into the SQL Editor
5. Click **"Run"** (or press `Ctrl+Enter`)
6. **Wait for success message** ✅

   You should see: `Success. No rows returned`

7. **Verify tables were created**:
   - Click **Table Editor** (left sidebar)
   - You should see these tables:
     - ✅ `user_progress`
     - ✅ `simulation_results`
     - ✅ `simulation_completions`
     - ✅ `achievements`
     - ✅ `user_achievements`
     - ✅ `user_2fa`
     - ✅ `trusted_devices`
     - ✅ `user_sessions`
     - ✅ `audit_logs`

---

## 🔐 Step 5: Configure Authentication (3 minutes)

1. In Supabase dashboard, click **Authentication** → **URL Configuration**
2. **Add Site URL**:
   - For development: `http://localhost:3000`
   - For production: `https://yourdomain.com` (add this when you deploy)
3. **Add Redirect URLs**:
   - `http://localhost:3000/**`
   - `https://yourdomain.com/**` (add when you deploy)
4. **Click "Save"**

---

## 🧪 Step 6: Test the Setup (2 minutes)

1. **Restart your dev server**:
   ```bash
   npm run dev
   ```

2. **Open your browser**: http://localhost:3000

3. **Navigate to** `/simulation`

4. **Look for the profile icon** (👤) in the top-right header

5. **Click it** and you should see:
   - ✅ "Sign In" button
   - ✅ "Sign Up" button

6. **Try signing up**:
   - Enter an email
   - Enter a password (12+ characters)
   - Click "Sign Up"
   - Check your email for verification link (if email confirmation is enabled)

7. **After signing in**, you should see:
   - ✅ Your email in the profile dropdown
   - ✅ "Sign Out" option
   - ✅ Case notes should work (requires account)

---

## 🚀 Step 7: Deploy to Production (Vercel)

When you're ready to deploy:

1. **Push your code** to GitHub (make sure `.env.local` is NOT committed)

2. **In Vercel Dashboard**:
   - Go to your project → **Settings** → **Environment Variables**
   - Add:
     - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key

3. **Update Supabase Redirect URLs**:
   - Add your production URL: `https://yourdomain.com/**`

4. **Redeploy** your site

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Supabase project created
- [ ] Environment variables added to `.env.local`
- [ ] Database schema created (all 9 tables exist)
- [ ] Authentication configured (redirect URLs set)
- [ ] Dev server restarted
- [ ] Sign In/Sign Up buttons visible
- [ ] Can create account
- [ ] Can sign in
- [ ] Case notes work (requires account)
- [ ] Progress syncs (check dashboard after completing simulation)

---

## 🐛 Troubleshooting

### "Sign In" button not showing

- ✅ Check `.env.local` exists and has correct values
- ✅ Restart dev server: `npm run dev`
- ✅ Check browser console for errors
- ✅ Verify environment variables don't have quotes around values

### "Supabase not configured" error

- ✅ Check `.env.local` file exists in project root
- ✅ Verify variable names are exact: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ No typos in URLs or keys
- ✅ Restart dev server after adding variables

### Database errors

- ✅ Run `supabase-schema-complete.sql` in SQL Editor
- ✅ Check all 9 tables exist in Table Editor
- ✅ Verify RLS (Row Level Security) is enabled on all tables
- ✅ Check browser console for specific error messages

### Can't sign up/sign in

- ✅ Check Supabase project is active (not paused)
- ✅ Verify redirect URLs are configured correctly
- ✅ Check email for verification link (if email confirmation enabled)
- ✅ Try different email address
- ✅ Check Supabase dashboard → Authentication → Users for errors

### Tables not found

- ✅ Run `supabase-schema-complete.sql` again
- ✅ Check SQL Editor for error messages
- ✅ Verify you're in the correct project
- ✅ Check Table Editor to see which tables exist

---

## 📊 What You Get with Free Tier

- ✅ **50,000 monthly active users** (more than enough!)
- ✅ **500 MB database** (plenty for your platform)
- ✅ **2 GB bandwidth/month** (sufficient for training platform)
- ✅ **Unlimited API requests**
- ✅ **Full authentication** (email, OAuth, etc.)
- ✅ **Row Level Security** (RLS)
- ✅ **SSL/TLS encryption**
- ✅ **Automatic backups**

**You can run this platform for FREE forever!** 🎉

---

## 📚 Next Steps

1. **Test all features**:
   - Sign up / Sign in
   - Complete a simulation
   - Check progress dashboard
   - Try achievements
   - Test case notes

2. **Monitor usage**:
   - Check Supabase dashboard → Settings → Usage
   - You'll see database size, bandwidth, etc.
   - Free tier is very generous!

3. **Optional: Enable Email Confirmation**:
   - Supabase → Authentication → Settings
   - Toggle "Enable email confirmations"
   - Users will need to verify email before signing in

---

## 🆘 Need Help?

1. **Check browser console** for error messages
2. **Check Supabase logs**: Dashboard → Logs
3. **Verify environment variables** are set correctly
4. **Check database tables** exist in Table Editor
5. **Review this guide** step by step

---

**That's it! Your platform now has user accounts with Supabase free tier! 🚀**

