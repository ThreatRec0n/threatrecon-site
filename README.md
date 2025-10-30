> Production branch = main. Previews use any branch.

# ThreatRecon SOC Simulator v1.0

A production-grade, interactive cybersecurity operations simulation dashboard built with Next.js.

## 🎮 Features

- **Next.js Architecture** - Modern React framework with API routes
- **Interactive SOC Dashboard** - Real-time rank, XP, and incident tracking
- **Session Management** - `/api/session/start` and `/api/session/end` endpoints
- **Neon UI Design** - Dark mode with glowing terminal aesthetic
- **Smooth Animations** - Fade-in effects, motion blur, and progress bars
- **Mobile Optimized** - Responsive grid layout for all screen sizes
- **Persistent Profile** - Browser localStorage integration
- **Production Ready** - Deployed to https://threatrecon.io

## 🚀 Tech Stack

- **Next.js 14** - React framework with SSR and API routes
- **Tailwind CSS** - Utility-first CSS framework
- **React Hooks** - Modern state management
- **Vercel** - Deployment platform

## 📋 Getting Started

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Visit http://localhost:3000 to see the dashboard.

## 🎯 How to Play

1. **Clock In** - Click "CLOCK IN FOR SHIFT" to start a new session
2. **Monitor Progress** - Watch the animated progress bar fill during active shift
3. **Track Stats** - View rank, XP, and incident count updates in real-time
4. **End Shift** - Click "DISMISS / END SHIFT" to complete session
5. **Review Performance** - See grade, XP awarded, and promotion status in modal

## 🏗️ Architecture

```
/
├── pages/
│   ├── index.js          # Main dashboard component
│   ├── _app.js           # Global styles and scripts
│   └── api/
│       └── session/
│           ├── start.js  # Session start API
│           └── end.js    # Session end API
├── styles/
│   └── globals.css      # Tailwind and custom styles
├── tailwind.config.js   # Tailwind configuration
└── package.json          # Dependencies
```

## 🎨 UI Features

- **Glowing Title Banner** - Pulsing neon green border
- **Animated Progress Bar** - Visual shift progress indicator
- **Motion Blur Effects** - Smooth data update transitions
- **Fade-in Animations** - Page load and modal transitions
- **Neon Color Palette** - Terminal-green, neon-blue, neon-red accents

## 📝 API Endpoints

### POST /api/session/start
Returns session data:
```json
{
  "rank": "Trainee",
  "xp": 0,
  "activeIncidents": 23,
  "intelFeed": ["..."],
  "sessionId": "..."
}
```

### POST /api/session/end
Returns grade and summary:
```json
{
  "grade": "A+",
  "xpAwarded": 500,
  "summary": {...},
  "promoted": false
}
```

## 🚢 Deployment

The app is automatically deployed to Vercel on push to `main` branch.

- **Production URL**: https://threatrecon.io
- **Framework**: Next.js (auto-detected)
- **Build**: Automatic on git push

## 📦 Release Information

**v1.0** - Production Release
- ✅ Production-grade Next.js architecture
- ✅ Tailwind + neon styling
- ✅ Dynamic SOC session logic
- ✅ Mobile-optimized layout
- ✅ Clean API + responsive UI

## 🔮 Roadmap

- **v1.1** - AI analyst events
- **v1.2** - Multiplayer sessions
- **v1.3** - Real-time scoring enhancements

## 📄 License

See LICENSE file for details.
