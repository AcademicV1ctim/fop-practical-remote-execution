const request = require('supertest');
const app = require('./app'); // NOT server.js

describe('POST /evaluate', () => {
  const basePayload = {
    id: 'testuser',
    ichat: 'sample',
    Topicid: 1,
    Questionid: 'q1',
    code: 'function add(a,b){return a+b;}',
    mockExecution: true
  };

  it('should return 400 if code is missing', async () => {
    const res = await request(app).post('/evaluate').send({ ...basePayload, code: '' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/No code provided/i);
  });

  it('should return 400 if no function name found', async () => {
    const res = await request(app).post('/evaluate').send({
      ...basePayload,
      code: 'console.log("no function");'
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should handle mockExecution successfully', async () => {
    const res = await request(app).post('/evaluate').send(basePayload);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.results)).toBe(true);
  });
});
