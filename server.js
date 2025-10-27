const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'ThreatRecon Backend'
  });
});

// Serve example AAR files
app.get('/example-aar.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'example-aar.html'));
});

app.get('/example-aar.pdf.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'example-aar.pdf.html'));
});

app.get('/example-aar.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'example-aar.json'));
});

// Mock API endpoints for demo
app.post('/api/session/start', (req, res) => {
  const sessionId = `demo-session-${Date.now()}`;
  res.json({
    id: sessionId,
    status: 'active',
    createdAt: new Date().toISOString(),
    participants: req.body.participants || [],
    scenario: req.body.scenarioId || 'ransomware_basic'
  });
});

app.get('/api/session/:id', (req, res) => {
  res.json({
    id: req.params.id,
    status: 'active',
    createdAt: new Date().toISOString(),
    participants: [
      { role: 'IR Lead', name: 'Security Team Lead' },
      { role: 'Network Admin', name: 'Network Operations' },
      { role: 'Legal Counsel', name: 'Legal Department' }
    ],
    scenario: 'ransomware_basic'
  });
});

// Facilitator routes
app.post('/api/session/:id/pause', (req, res) => {
  res.json({ success: true, message: 'Session paused', timestamp: new Date().toISOString() });
});

app.post('/api/session/:id/resume', (req, res) => {
  res.json({ success: true, message: 'Session resumed', timestamp: new Date().toISOString() });
});

app.post('/api/session/:id/end', (req, res) => {
  res.json({ success: true, message: 'Session ended', timestamp: new Date().toISOString() });
});

app.post('/api/session/:id/delete', (req, res) => {
  res.json({ success: true, message: 'Session deleted', timestamp: new Date().toISOString() });
});

// Scenario validation
app.post('/api/scenario/validate', (req, res) => {
  res.json({
    status: 'pass',
    errors: [],
    warnings: []
  });
});

// Demo session page
app.get('/session/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ThreatRecon Demo Session</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
            color: #fff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: rgba(30, 41, 59, 0.8);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(148, 163, 184, 0.2);
            border-radius: 12px;
            padding: 40px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        h1 {
            font-size: 28px;
            margin-bottom: 8px;
            color: #60a5fa;
        }
        .subtitle {
            color: #94a3b8;
            margin-bottom: 32px;
            font-size: 14px;
        }
        .session-info {
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(148, 163, 184, 0.1);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 24px;
        }
        .session-info label {
            display: block;
            font-size: 12px;
            color: #94a3b8;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .session-info code {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 16px;
            color: #60a5fa;
            background: rgba(96, 165, 250, 0.1);
            padding: 12px 16px;
            border-radius: 6px;
            display: block;
            word-break: break-all;
        }
        .note {
            background: rgba(234, 179, 8, 0.1);
            border: 1px solid rgba(234, 179, 8, 0.3);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
            color: #fde047;
            font-size: 14px;
            line-height: 1.5;
        }
        .btn {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            transition: background 0.2s;
        }
        .btn:hover {
            background: #1d4ed8;
        }
        .icon {
            display: inline-block;
            width: 24px;
            height: 24px;
            margin-right: 8px;
            vertical-align: middle;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>ThreatRecon Demo Session</h1>
        <p class="subtitle">Live Incident Response Drill</p>
        
        <div class="session-info">
            <label>Session ID</label>
            <code>${sessionId}</code>
        </div>
        
        <div class="note">
            <strong>Demo Mode:</strong> This is a demo view. In a full deployment you would see the live incident timeline, facilitator controls, and real-time decision tracking here.
        </div>
        
        <a href="/" class="btn">
            ← Back to ThreatRecon Home
        </a>
    </div>
</body>
</html>
  `;
  res.send(html);
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server (disabled for Vercel serverless functions)
// app.listen(PORT, () => {
//   console.log(`🚀 ThreatRecon Backend running on port ${PORT}`);
//   console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
//   console.log(`🎯 Frontend: http://localhost:${PORT}`);
//   console.log(`📄 Example AAR: http://localhost:${PORT}/example-aar.html`);
// });

module.exports = app;
