# ThreatRecon Labs Backend

Real-time terminal simulator API for ThreatRecon Labs platform.

## Quick Start

```bash
cd labs-backend
npm install
npm start
```

Server runs on `http://localhost:3001`

## API Endpoints

- `GET /` - Service info
- `GET /api/health` - Health check  
- `GET /api/status?sessionId=<id>` - Session status

## Socket.IO Events

**Client → Server:** `exec` command
**Server → Client:** `output`, `gameEvent`, `errorEvent`

## Testing

```bash
npm test
```

## Docker

```bash
docker-compose up -d
```

## License

ISC

