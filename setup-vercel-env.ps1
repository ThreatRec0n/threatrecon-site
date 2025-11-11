# PowerShell script to add Supabase environment variables to Vercel
# Run: .\setup-vercel-env.ps1

Write-Host "Setting up Vercel environment variables..." -ForegroundColor Green

# First, make sure you're logged in
Write-Host "`nMake sure you're logged into Vercel (run 'vercel login' if needed)" -ForegroundColor Yellow

$supabaseUrl = "https://uiikieptwxstqhcahtkox.supabase.co"
$supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpa2llcHR3eHN0cWhjYWhrdG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTg2MDAsImV4cCI6MjA3ODM5NDYwMH0.oUcxGm74g4DTXmwqkWs4QzNFtdCUageIznMTEgBo8lA"

# Add production environment variables
Write-Host "`nAdding NEXT_PUBLIC_SUPABASE_URL to production..." -ForegroundColor Cyan
$supabaseUrl | vercel env add NEXT_PUBLIC_SUPABASE_URL production

Write-Host "Adding NEXT_PUBLIC_SUPABASE_ANON_KEY to production..." -ForegroundColor Cyan
$supabaseKey | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# Also add to preview and development
Write-Host "`nAdding to preview environment..." -ForegroundColor Cyan
$supabaseUrl | vercel env add NEXT_PUBLIC_SUPABASE_URL preview
$supabaseKey | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview

Write-Host "Adding to development environment..." -ForegroundColor Cyan
$supabaseUrl | vercel env add NEXT_PUBLIC_SUPABASE_URL development
$supabaseKey | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development

Write-Host "`n✅ Done! Now redeploy your site: vercel --prod" -ForegroundColor Green

