# Pre-Launch Testing Checklist

## Authentication Flow

- [ ] Sign up with valid email
- [ ] Sign up with duplicate email (should fail)
- [ ] Sign up with weak password (should fail)
- [ ] Login with correct credentials
- [ ] Login with wrong password (should fail)
- [ ] Account locks after 5 failed attempts
- [ ] Password reset flow works (if implemented)
- [ ] 2FA setup flow works end-to-end (if enabled)
- [ ] 2FA verification works
- [ ] Backup codes work
- [ ] Trusted device functionality works
- [ ] Session expires after inactivity

## Simulation Flow

- [ ] Start simulation for each difficulty level
- [ ] Complete simulation with all correct answers
- [ ] Complete simulation with mixed answers
- [ ] Feedback displays correctly
- [ ] MITRE ATT&CK references link correctly
- [ ] OWASP references display
- [ ] Timeline shows all actions
- [ ] Achievements unlock appropriately
- [ ] Progress saves correctly

## Navigation

- [ ] All navigation links work
- [ ] Back buttons on all pages work
- [ ] Mobile navigation works (hamburger menu)
- [ ] Footer links work
- [ ] Legal pages accessible (Privacy, Terms, Security)

## Features

- [ ] OWASP Top 10 lessons display
- [ ] Quiz questions work
- [ ] Achievements page shows all achievements
- [ ] Progress dashboard shows metrics
- [ ] Leaderboard displays correctly
- [ ] Help sidebar opens and is searchable
- [ ] Tutorial triggers for new users

## Mobile Responsive

- [ ] Test on iPhone (Safari)
- [ ] Test on Android (Chrome)
- [ ] Test on iPad
- [ ] All pages responsive
- [ ] Navigation accessible
- [ ] Forms usable on mobile

## Performance

- [ ] Homepage loads <2 seconds
- [ ] Simulation starts quickly
- [ ] No console errors
- [ ] Images load properly
- [ ] No memory leaks (check DevTools)

## Security

- [ ] HTTPS enforced (in production)
- [ ] Security headers present (check securityheaders.com)
- [ ] CSRF protection works
- [ ] Rate limiting works
- [ ] XSS attempts blocked
- [ ] SQL injection attempts blocked
- [ ] Input validation on all forms

## Legal & Compliance

- [ ] Privacy Policy displays
- [ ] Terms of Service displays
- [ ] Security Policy displays
- [ ] Footer links to legal pages
- [ ] security.txt file accessible

## Error Handling

- [ ] 404 page works
- [ ] 500 error page works
- [ ] Form errors display correctly
- [ ] API errors handled gracefully
- [ ] Network errors handled
- [ ] Error boundary catches React errors

## Edge Cases

- [ ] Very long usernames/emails
- [ ] Special characters in inputs
- [ ] Simultaneous logins
- [ ] Browser back button behavior
- [ ] Copy/paste in forms
- [ ] Offline behavior (graceful degradation)

## Health Check

- [ ] `/api/health` endpoint returns healthy status
- [ ] Database connection verified
- [ ] All services operational

