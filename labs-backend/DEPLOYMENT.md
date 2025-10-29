# Labs Backend Deployment Guide

## Architecture

```
Frontend (Vercel/Netlify) ←→ Backend (Render) ←→ Redis (Upstash/Render Redis)
```

## Local Development

### Quick Start with Docker Compose

```bash
cd labs-backend
docker-compose -f docker-compose.dev.yml up -d
```

This starts:
- Redis on `localhost:6379`
- Backend on `localhost:3001`

### Manual Start

```bash
# Terminal 1: Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# Terminal 2: Start backend
cd labs-backend
npm install
REDIS_URL=redis://localhost:6379 npm start
```

## Production Deployment (Render)

### Step 1: Create Render Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Configure:
   - **Name**: `threatrecon-labs-backend`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `labs-backend/Dockerfile`
   - **Branch**: `main`
   - **Auto-Deploy**: Yes

### Step 2: Add Redis

**Option A: Render Redis**
1. Click "New +" → "Redis"
2. Name: `threatrecon-labs-redis`
3. Copy the Redis URL

**Option B: Upstash** (recommended)
1. Sign up at [Upstash](https://upstash.com)
2. Create Redis database
3. Copy connection string (Redis URL)

### Step 3: Environment Variables

In Render service settings, add:

```
NODE_ENV=production
PORT=3001
FRONTEND_ORIGIN=https://your-frontend-domain.com
REDIS_URL=<your-redis-url-from-step-2>
SIM_TARGET_IP=10.0.10.5
SIM_TARGET_HOST=corp-target
```

### Step 4: Deploy

Render auto-deploys on push to `main`. Check logs:

```bash
# View deployment logs
render logs --follow
```

## Integration with Frontend

Update `public/labs.js`:

```javascript
// Production backend URL
const SOCKET_URL = 'https://threatrecon-labs-backend.onrender.com';

const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  socket.emit('exec', { command: 'whoami', sessionId: 'session-123' });
});

socket.on('output', (payload) => {
  term.write(payload.text);
});
```

## Health Check

```bash
# Local
curl http://localhost:3001/api/health

# Production
curl https://your-backend.onrender.com/api/health
```

## Monitoring

Render provides:
- Logs (real-time)
- Metrics (CPU, memory, network)
- Alerts (email/Slack)

Add Sentry for error tracking:
```bash
npm install @sentry/node
```

## Scaling

Start with **Starter** plan ($7/mo). Scale to **Standard** ($25/mo) for:
- More CPU/memory
- Better WebSocket performance
- Higher concurrency

For 100+ concurrent users:
- Use **Pro** plan ($85/mo)
- Enable horizontal scaling (2-3 instances)
- Redis adapter handles socket distribution

## Cost Estimate

| Plan | Price | Users | Use Case |
|------|-------|-------|----------|
| Starter | $7/mo | <20 | MVP |
| Standard | $25/mo | 50-100 | Production |
| Pro | $85/mo | 200+ | Enterprise |

Plus Redis:
- Upstash: Free tier (10K commands/day)
- Render Redis: $5-15/mo

## Troubleshooting

**Redis connection fails:**
```bash
# Check Redis URL
echo $REDIS_URL

# Test connection
redis-cli -u $REDIS_URL ping
```

**WebSocket doesn't work:**
- Ensure `FRONTEND_ORIGIN` matches your domain
- Check CORS settings
- Verify firewall rules

## Commands to Run

### Local Dev
```bash
cd labs-backend
npm install
docker-compose -f docker-compose.dev.yml up -d
npm start
```

### Run Tests
```bash
npm test
```

### Production Deploy
```bash
git push origin main  # Triggers auto-deploy
```

## License

ISC

