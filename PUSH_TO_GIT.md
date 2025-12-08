# Manual Git Push Instructions

If the automated push didn't work, please run these commands manually:

## Step 1: Check Status
```bash
git status
```

## Step 2: Add All Changes
```bash
git add -A
```

## Step 3: Commit Changes
```bash
git commit -m "feat: Complete SOC platform transformation - massive event volumes and realistic alert queues"
```

## Step 4: Push to GitHub
```bash
git push origin main
```

## Files That Should Be Committed:

### New Files Created:
- `lib/simulation-engine/core-types.ts`
- `lib/simulation-engine/event-factory.ts`
- `lib/simulation-engine/alert-factory.ts`
- `components/AlertQueue.tsx` (new clean version)
- `TRANSFORMATION_COMPLETE.md`

### Files Modified:
- `lib/simulation-engine/index.ts` (complete replacement)
- `app/api/simulation/route.ts` (complete replacement)
- `components/soc-dashboard/SimulationDashboard.tsx` (simplified)

### Files Deleted:
- `components/AlertQueue.tsx` (old version - if it existed)
- `components/AlertClassificationPanel.tsx`
- `components/CaseManagement.tsx`
- `components/CaseReportGenerator.tsx`
- `components/DetectionRuleBuilder.tsx`
- `components/EvidenceWorkspace.tsx`
- `components/EnhancedLogViewer.tsx`
- `components/EnhancedSIEMDashboard.tsx`
- `components/ThreatIntelPanel.tsx`
- `components/soc-dashboard/EvidenceBinder.tsx`
- `components/soc-dashboard/ReportExport.tsx`
- `components/soc-dashboard/PurpleTeamMode.tsx`
- `components/soc-dashboard/CaseNotes.tsx`
- `lib/soc-workflows.ts`
- `lib/anti-cheat.ts`
- `lib/threat-intel.ts`

## Verify Push Success:

After pushing, check GitHub:
1. Go to https://github.com/ThreatRec0n/threatrecon-site
2. Check the `main` branch
3. Look for the commit message: "feat: Complete SOC platform transformation"
4. Verify the new files exist in the repository

## If Push Fails:

If you get authentication errors:
```bash
# Check your git credentials
git config --global user.name
git config --global user.email

# If needed, set up credentials
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

If you get permission errors, make sure you have push access to the repository.

