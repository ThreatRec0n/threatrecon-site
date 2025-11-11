# 🔐 Environment Variables Setup

## ✅ Your Supabase Credentials

Based on your API keys, here's what you need to add:

### Step 1: Create `.env.local` File

1. **In your project root** (same folder as `package.json`), create a new file named `.env.local`

2. **Add these two lines** (replace with your actual values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://uiikieptwxstqhcahtkox.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpa2llcHR3eHN0cWhjYWhrdG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTg2MDAsImV4cCI6MjA3ODM5NDYwMH0.oUcxGm74g4DTXmwqkWs4QzNFtdCUageIznMTEgBo8lA
```

### Step 2: Verify File Location

Your `.env.local` should be in:
```
threatrecon-site/
  ├── .env.local          ← HERE
  ├── package.json
  ├── next.config.mjs
  └── ...
```

### Step 3: Restart Dev Server

After creating the file:
```bash
# Stop your current dev server (Ctrl+C)
# Then restart it:
npm run dev
```

### Step 4: Verify It Works

1. Open http://localhost:3000/simulation
2. Look for the 👤 profile icon in the top-right
3. Click it - you should see "Sign In" and "Sign Up" buttons
4. If you see them, ✅ **Supabase is configured correctly!**

---

## ⚠️ Security Notes

- ✅ `.env.local` is already in `.gitignore` - it won't be committed
- ✅ The `anon` key is **safe to use in browser** (it's public)
- ✅ Row Level Security (RLS) protects your data
- ❌ **NEVER** share the `service_role` key (secret key)
- ❌ **NEVER** commit `.env.local` to git

---

## 🚀 Next Steps

After setting up `.env.local`:

1. ✅ Create database tables (run `supabase-schema-complete.sql`)
2. ✅ Configure authentication URLs in Supabase dashboard
3. ✅ Test sign up / sign in
4. ✅ Complete a simulation to test progress syncing

See `SUPABASE_QUICK_SETUP.md` for complete instructions.

