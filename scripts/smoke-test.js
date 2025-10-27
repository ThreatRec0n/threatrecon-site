const request = require('supertest');
const app = require('../server.js'); // app is exported

async function run() {
  console.log('Running smoke tests...');

  // create session
  let res = await request(app)
    .post('/api/sessions')
    .send({ title: 'Smoke Drill' })
    .set('Content-Type','application/json');
  if (res.statusCode !== 201) throw new Error('create session failed');
  const sid = res.body.id;
  console.log('✅ session created:', sid);

  // join participant
  res = await request(app)
    .post(`/api/sessions/${sid}/participants`)
    .send({ name: 'Test User', role: 'IR Lead' })
    .set('Content-Type','application/json');
  if (res.statusCode !== 201) throw new Error('join failed');
  console.log('✅ participant joined');

  // inject
  res = await request(app)
    .post(`/api/sessions/${sid}/injects`)
    .send({ severity:'high', message:'Ransomware detected in payment gateway' })
    .set('Content-Type','application/json');
  if (res.statusCode !== 201) throw new Error('inject failed');
  console.log('✅ inject sent');

  // decision
  res = await request(app)
    .post(`/api/sessions/${sid}/decisions`)
    .send({ name:'Test User', role:'IR Lead', message:'Isolate payment gateway VM' })
    .set('Content-Type','application/json');
  if (res.statusCode !== 201) throw new Error('decision failed');
  console.log('✅ decision submitted');

  // fetch data back
  res = await request(app)
    .get(`/api/sessions/${sid}`);
  if (res.statusCode !== 200) throw new Error('get session failed');

  const body = res.body;
  if (!body.events || body.events.length < 3) throw new Error('events not captured');
  console.log('✅ events retrieved:', body.events.length, 'events');
  console.log('\n🎉 smoke test PASS');
}

run().catch(err => {
  console.error('\n❌ smoke test FAIL:', err);
  process.exit(1);
});

