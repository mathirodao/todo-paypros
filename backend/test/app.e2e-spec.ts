import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Shared state across tests — token and task id get set as we go
let token: string;
let createdTaskId: number;

// Unique email so each test run doesn't conflict with previous data
const testEmail = `e2e_${Date.now()}@test.com`;

describe('Auth + Tasks (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Same setup as main.ts so validation works in tests too
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // --- Auth ---

  it('POST /auth/register — creates a new user and returns a token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'E2E User', email: testEmail, password: 'test1234' })
      .expect(201);

    expect(res.body.access_token).toBeDefined();
    expect(res.body.user.email).toBe(testEmail);
    token = res.body.access_token;
  });

  it('POST /auth/register — rejects duplicate email with 409', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Dup', email: testEmail, password: 'test1234' })
      .expect(409);
  });

  it('POST /auth/login — returns a token with valid credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: 'test1234' })
      .expect(200);

    expect(res.body.access_token).toBeDefined();
  });

  it('POST /auth/login — rejects wrong password with 401', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: 'wrongpass' })
      .expect(401);
  });

  // --- Task access control ---

  it('GET /tasks — returns 401 without token', () => {
    return request(app.getHttpServer()).get('/tasks').expect(401);
  });

  // --- Task CRUD ---

  it('POST /tasks — creates a task for the authenticated user', async () => {
    const res = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'E2E Task',
        description: 'Created in automated test',
        dueDate: '2026-12-31',
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.title).toBe('E2E Task');
    expect(res.body.completed).toBe(false);
    createdTaskId = res.body.id;
  });

  it('GET /tasks — returns the task list for the user', async () => {
    const res = await request(app.getHttpServer())
      .get('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /tasks/:id — returns the specific task', async () => {
    const res = await request(app.getHttpServer())
      .get(`/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.id).toBe(createdTaskId);
  });

  it('PUT /tasks/:id — updates title and marks as completed', async () => {
    const res = await request(app.getHttpServer())
      .put(`/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'E2E Task (updated)', completed: true })
      .expect(200);

    expect(res.body.title).toBe('E2E Task (updated)');
    expect(res.body.completed).toBe(true);
  });

  it('DELETE /tasks/:id — deletes the task', () => {
    return request(app.getHttpServer())
      .delete(`/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('GET /tasks/:id — returns 404 after deletion', () => {
    return request(app.getHttpServer())
      .get(`/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});
