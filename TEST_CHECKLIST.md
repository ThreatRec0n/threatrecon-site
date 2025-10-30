# ThreatRecon Packet Hunt v3.0 - Test Checklist

## Pre-Deployment Testing

### 1. Critical Bug Fixes ✅
- [ ] **Reload System Fix**: Start new round multiple times - no page reloads should occur
- [ ] **State Clearing**: Verify packets, selection, and marks are cleared on new round
- [ ] **Error Handling**: Test with invalid scenarios - should show friendly error, not crash

### 2. Packet Count System ✅
- [ ] **Beginner**: Verify exactly 25 packets are generated
- [ ] **Intermediate**: Verify exactly 50 packets are generated  
- [ ] **Advanced**: Verify exactly 100 packets are generated
- [ ] **Evidence Count**: Check evidence packets per difficulty:
  - Beginner: 1-2 evidence packets
  - Intermediate: 2-4 evidence packets
  - Advanced: 3-7 evidence packets

### 3. Explicit Marking System ✅
- [ ] **No Auto-Marking**: Clicking packet rows only selects, doesn't mark as evidence
- [ ] **Mark Button Only**: Only "Mark as Evidence" button should add to evidence list
- [ ] **Keyboard Shortcut**: Press 'M' key to mark selected packet
- [ ] **Visual Feedback**: Marked packets show yellow border and checkmark

### 4. Upload PCAP Removal ✅
- [ ] **No Upload Button**: Upload PCAP button should not be visible
- [ ] **No Upload Handlers**: No file input or upload functionality present

### 5. Randomized IPs ✅
- [ ] **Unique IPs**: Each new round generates different IP addresses
- [ ] **Realistic Ranges**: IPs follow private (10.x, 172.x, 192.168.x) and public ranges
- [ ] **Proper Seeding**: Refresh/new round yields different IP sets

### 6. Enhanced PacketDetail ✅
- [ ] **Full Headers**: Ethernet, IP, TCP/UDP headers show all fields
- [ ] **5-Tuple Display**: Source:port → Destination:port format
- [ ] **MAC Addresses**: Source and destination MAC addresses shown
- [ ] **TTL Values**: IP TTL field displayed
- [ ] **TCP Flags**: SYN/ACK/FIN/RST/PSH flags shown
- [ ] **Hex/ASCII View**: Raw packet bytes in hex and ASCII format
- [ ] **Stream Reassembly**: TCP stream reconstruction works

### 7. Evidence Scoring ✅
- [ ] **Correct Scoring**: Perfect matches get full points
- [ ] **Partial Credit**: Partial matches get proportional points
- [ ] **Penalties**: False positives and hints reduce score
- [ ] **Difficulty Scaling**: Advanced gives more points than beginner
- [ ] **Feedback**: Clear explanation of what was correct/incorrect

### 8. Study Pack ✅
- [ ] **Study Pack Button**: Purple "STUDY PACK" button visible in header
- [ ] **Modal Opens**: Clicking opens study pack modal
- [ ] **Navigation**: Previous/Next buttons work
- [ ] **Page Jump**: Dropdown to jump to specific pages
- [ ] **Content**: All 10 pages of Wireshark content display correctly

## Local Development Testing

### Quick Start
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

### Test Scenarios
1. **Mixed Investigation (Beginner)**
   - Start new round
   - Verify 25 packets generated
   - Look for 1-2 evidence packets
   - Test marking and submission

2. **HTTP Exfiltration (Intermediate)**
   - Select HTTP Exfiltration scenario
   - Set difficulty to Intermediate
   - Verify 50 packets generated
   - Look for 2-4 evidence packets with POST requests

3. **VoIP Investigation (Advanced)**
   - Select VoIP scenario
   - Set difficulty to Advanced
   - Verify 100 packets generated
   - Test RTP playback functionality

### Browser Testing
- [ ] **Chrome**: Test all functionality
- [ ] **Firefox**: Test all functionality
- [ ] **Safari**: Test all functionality
- [ ] **Mobile**: Test responsive design

## Deployment Steps

### 1. Build for Production
```bash
# Create production build
npm run build

# Test production build locally
npm start
```

### 2. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Or push to GitHub (if connected to Vercel)
git add .
git commit -m "v3.0: Critical fixes and enhancements"
git push origin main
```

### 3. Post-Deployment Verification
- [ ] **Production URL**: Verify app loads correctly
- [ ] **All Features**: Test all functionality in production
- [ ] **Performance**: Check load times and responsiveness
- [ ] **Error Handling**: Test error scenarios

## Performance Checklist

### Load Testing
- [ ] **Packet Generation**: 100 packets generate quickly (< 2 seconds)
- [ ] **UI Responsiveness**: Interface remains responsive during generation
- [ ] **Memory Usage**: No memory leaks during multiple rounds
- [ ] **Browser Compatibility**: Works across all major browsers

### Error Scenarios
- [ ] **Invalid Scenarios**: Handle gracefully
- [ ] **Network Issues**: Offline mode works
- [ ] **Large Datasets**: 100 packets don't crash browser
- [ ] **Rapid Clicks**: Multiple rapid clicks don't break state

## Security Checklist

### Data Handling
- [ ] **No Sensitive Data**: No real credentials or sensitive data in packets
- [ ] **Local Storage**: Only stores user progress, no sensitive data
- [ ] **Client-Side Only**: All processing happens in browser
- [ ] **No External APIs**: No calls to external services

## User Experience Checklist

### Interface
- [ ] **Intuitive Navigation**: Easy to understand and use
- [ ] **Clear Feedback**: Users understand what they're doing
- [ ] **Help Available**: Study pack and help modals accessible
- [ ] **Keyboard Shortcuts**: M key for marking works
- [ ] **Responsive Design**: Works on different screen sizes

### Learning Experience
- [ ] **Progressive Difficulty**: Beginner → Intermediate → Advanced makes sense
- [ ] **Realistic Scenarios**: Packets look like real network traffic
- [ ] **Educational Value**: Users learn Wireshark concepts
- [ ] **Feedback Quality**: Debriefs are helpful and educational

## Final Sign-off

- [ ] All critical bugs fixed
- [ ] All new features working
- [ ] Performance acceptable
- [ ] Security reviewed
- [ ] User experience polished
- [ ] Documentation complete
- [ ] Ready for production deployment

---

**Tested By**: _______________  
**Date**: _______________  
**Version**: v3.0  
**Status**: ✅ Ready for Production
