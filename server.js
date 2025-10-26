const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

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

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ThreatRecon Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎯 Frontend: http://localhost:${PORT}`);
  console.log(`📄 Example AAR: http://localhost:${PORT}/example-aar.html`);
});

module.exports = app;
