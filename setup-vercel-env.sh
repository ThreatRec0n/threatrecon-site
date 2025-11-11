#!/bin/bash
# Script to add Supabase environment variables to Vercel
# Run: bash setup-vercel-env.sh

echo "Setting up Vercel environment variables..."

# First, make sure you're logged in
echo "Make sure you're logged into Vercel (run 'vercel login' if needed)"

# Add production environment variables
echo "Adding NEXT_PUBLIC_SUPABASE_URL to production..."
echo "https://uiikieptwxstqhcahtkox.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production

echo "Adding NEXT_PUBLIC_SUPABASE_ANON_KEY to production..."
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpa2llcHR3eHN0cWhjYWhrdG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTg2MDAsImV4cCI6MjA3ODM5NDYwMH0.oUcxGm74g4DTXmwqkWs4QzNFtdCUageIznMTEgBo8lA" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# Also add to preview and development
echo "Adding to preview environment..."
echo "https://uiikieptwxstqhcahtkox.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL preview
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpa2llcHR3eHN0cWhjYWhrdG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTg2MDAsImV4cCI6MjA3ODM5NDYwMH0.oUcxGm74g4DTXmwqkWs4QzNFtdCUageIznMTEgBo8lA" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview

echo "Adding to development environment..."
echo "https://uiikieptwxstqhcahtkox.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL development
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpa2llcHR3eHN0cWhjYWhrdG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTg2MDAsImV4cCI6MjA3ODM5NDYwMH0.oUcxGm74g4DTXmwqkWs4QzNFtdCUageIznMTEgBo8lA" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development

echo "✅ Done! Now redeploy your site: vercel --prod"

