// smoke.test.js - Smoke test that starts server and tests health endpoint
const request = require('supertest');
const { app } = require('../server');

describe('Smoke Tests', () => {
  test('root endpoint returns service info', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);
    
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('threatrecon-labs-backend');
    expect(response.body.version).toBe('1.0.0');
  });

  test('health endpoint returns 200', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(response.body.status).toBe('ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
  });

  test('status endpoint requires sessionId', async () => {
    await request(app)
      .get('/api/status')
      .expect(400);
  });

  test('status endpoint returns 404 for unknown session', async () => {
    await request(app)
      .get('/api/status?sessionId=unknown')
      .expect(404);
  });
});

