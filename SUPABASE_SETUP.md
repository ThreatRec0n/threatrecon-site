# Supabase Authentication Setup Guide

This guide explains how to set up optional user accounts with Supabase for the ThreatRecon platform.

## Overview

The platform supports **optional** user authentication via Supabase. Users can use the platform without signing in, but signing in enables:
- Progress syncing across devices
- Cloud backup of completed scenarios, scores, and leaderboard entries
- Persistent progress storage

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: ThreatRecon (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
5. Wait for project to be created (~2 minutes)

### 2. Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

### 3. Set Up Environment Variables

1. Create a `.env.local` file in the project root (if it doesn't exist)
2. Add the following:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace `your_project_url_here` and `your_anon_key_here` with the values from step 2.

### 4. Create the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the contents of `supabase-schema.sql`
4. Click "Run" to execute the SQL

This creates:
- `user_progress` table for storing user data
- Row Level Security (RLS) policies to ensure users can only access their own data
- Automatic timestamp updates

### 5. Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Settings**
2. Under "Site URL", add your deployment URL (e.g., `https://yourdomain.com`)
3. Under "Redirect URLs", add:
   - `https://yourdomain.com/**` (for production)
   - `http://localhost:3000/**` (for local development)

### 6. Test the Setup

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/simulation`
3. Look for the profile dropdown in the header (👤 icon)
4. Click it and try signing up with a test email
5. Check your email for the verification link (if email confirmation is enabled)

## Security Features

- **JWT Authentication**: All auth tokens are JWT-based and managed by Supabase
- **Row Level Security**: Database policies ensure users can only access their own data
- **Input Sanitization**: All user inputs are sanitized before storage
- **No Personal Data**: Only email addresses are collected (required for authentication)
- **Optional Feature**: Platform works fully without Supabase configured

## Troubleshooting

### Profile Dropdown Not Showing

- Check that environment variables are set correctly
- Verify `.env.local` is in the project root
- Restart the development server after adding environment variables

### "Supabase not configured" Error

- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Check that values don't contain placeholder text
- Verify the Supabase project is active

### Database Errors

- Ensure you've run the `supabase-schema.sql` script
- Check that Row Level Security is enabled on the `user_progress` table
- Verify the table exists in your Supabase dashboard

## Production Deployment

For production (Vercel, Netlify, etc.):

1. Add environment variables in your hosting platform's dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. Update Supabase redirect URLs to include your production domain

3. Ensure the database schema is created in your production Supabase project

## Privacy & Data

- **Email Only**: We only collect email addresses for authentication
- **User Data**: Progress data (scenarios, scores, leaderboard) is stored per user
- **No Tracking**: No analytics or tracking beyond what's needed for the platform
- **User Control**: Users can delete their account and data at any time via Supabase dashboard

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify Supabase project is active and accessible
3. Ensure database schema is correctly set up
4. Check that environment variables are properly configured

