# 🔌 Supabase Connection Test Guide

## Quick Test Methods

### Method 1: Health Check API (Easiest)

1. **Start your dev server**:
   ```bash
   npm run dev
   ```

2. **Open in browser**:
   ```
   http://localhost:3000/api/health
   ```

3. **Check the response** - You should see:
   ```json
   {
     "status": "healthy",
     "supabase": {
       "configured": true
     },
     "database": {
       "connected": true,
       "status": "fully_connected",
       "tables": {
         "total": 9,
         "found": 9,
         "missing": 0
       }
     },
     "authentication": {
       "accessible": true
     },
     "rls": {
       "enabled": true,
       "status": "working"
     }
   }
   ```

### Method 2: Test Script (Detailed)

1. **Install dotenv** (if not already installed):
   ```bash
   npm install dotenv --save-dev
   ```

2. **Run the test script**:
   ```bash
   node scripts/test-supabase-connection.js
   ```

3. **Check output** - Should show:
   - ✅ Environment variables found
   - ✅ Successfully connected to Supabase
   - ✅ All 9 tables found
   - ✅ Authentication accessible
   - ✅ RLS working

### Method 3: Browser Test (Visual)

1. **Open your site**: http://localhost:3000
2. **Look for Sign In/Sign Up buttons** in top-right
3. **Click "Sign Up"**
4. **Try creating an account**
5. **If it works** → ✅ Connection is good!

---

## Expected Results

### ✅ Success Indicators

- Health API returns `status: "healthy"`
- Database shows `connected: true`
- All 9 tables found
- Authentication accessible
- Sign In/Sign Up buttons visible
- Can create account successfully

### ❌ Failure Indicators

- Health API returns `status: "error"`
- Database shows `connected: false`
- Tables missing (need to run SQL schema)
- Sign In/Sign Up buttons not visible
- Errors in browser console

---

## Troubleshooting

### "Supabase not configured"
- ✅ Check `.env.local` exists
- ✅ Verify environment variables are set
- ✅ Restart dev server after adding variables

### "Tables missing"
- ✅ Run `supabase-schema-complete.sql` in Supabase SQL Editor
- ✅ Verify all 9 tables were created
- ✅ Check Table Editor in Supabase dashboard

### "Connection error"
- ✅ Verify Supabase project is active (not paused)
- ✅ Check Supabase URL is correct
- ✅ Verify API key is correct
- ✅ Check internet connection

### "RLS not working"
- ✅ Verify RLS is enabled on all tables
- ✅ Check RLS policies exist
- ✅ Run SQL schema again if needed

---

## Test Checklist

- [ ] Health API accessible (`/api/health`)
- [ ] Supabase configured: `true`
- [ ] Database connected: `true`
- [ ] All 9 tables found
- [ ] Authentication accessible
- [ ] RLS enabled and working
- [ ] Sign In button visible
- [ ] Sign Up button visible
- [ ] Can create account
- [ ] Can sign in
- [ ] No errors in browser console

---

## Quick Commands

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Or open in browser
# http://localhost:3000/api/health

# Run test script
node scripts/test-supabase-connection.js
```

---

**Status**: Ready to test! 🚀

