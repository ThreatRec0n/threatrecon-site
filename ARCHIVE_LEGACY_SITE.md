# Legacy Site Archive

## Status
**Date**: January 2025  
**Branch**: `labs-migration`  
**Action**: Full backup of ThreatRecon.io demo site preserved before replacement

## What Was Archived
The previous demo site included:
- Static HTML marketing landing page (`public/index.html`)
- Express server with demo session API (`server.js`)
- Demo session modal and JavaScript (`public/session.js`)
- Example AAR report template (`public/example-aar.pdf.html`)
- Legacy `lib/store.js` with in-memory fallback
- All routes under `/api/sessions/*` (create, join, inject, decision, stream)
- SSE (Server-Sent Events) timeline implementation

## Rollback Plan
If this migration fails or needs to be reversed:

```bash
git checkout main
git push origin main  # This restores the original site
```

Or to view the archive on this branch:
```bash
git checkout labs-migration
```

## New Site Structure
- Replaced with single-player AI cyber range game
- Player chooses Attacker or Defender role
- AI opponent with realistic CLI behavior
- Full game engine with win/loss conditions
- AAR (After Action Report) timeline at end of match
- Maintains Vercel compatibility

## Migration Completed
✅ Archive created on `labs-migration` branch  
✅ Ready to deploy new single-player labs  
✅ Rollback tested via `git checkout main`

