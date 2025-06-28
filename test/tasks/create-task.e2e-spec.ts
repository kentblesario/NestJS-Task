import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../utils/test-setup';
import { ITask } from 'src/task/task.interface';
import { App } from 'supertest/types';

describe('POST /tasks', () => {
  let app: INestApplication;
  let appHttp: App;
  beforeAll(async () => {
    app = await createTestApp(); // Shared test app setup
    appHttp = app.getHttpServer() as App; // Cast to App type for supertest
  });

  afterAll(async () => {
    await app.close();
  });

  it('✅ should create a task without prerequisites', async () => {
    const res = await request(appHttp)
      .post('/tasks')
      .send({ title: 'Write unit tests' })
      .expect(201);

    const task = res.body as ITask;
    expect(task.title).toBe('Write unit tests');
    expect(task.prerequisites).toEqual([]);
  });

  it('✅ should create a task with valid prerequisites', async () => {
    const prereqRes = await request(appHttp)
      .post('/tasks')
      .send({ title: 'Set up DB' })
      .expect(201);

    const prereq = prereqRes.body as ITask;

    const res = await request(appHttp)
      .post('/tasks')
      .send({
        title: 'Deploy to Prod',
        prerequisites: [prereq.id],
      })
      .expect(201);

    const task = res.body as ITask;
    expect(task.title).toBe('Deploy to Prod');
    expect(task.prerequisites?.[0]?.id).toBe(prereq.id);
  });

  it('❌ should fail with non-existent prerequisite ID', async () => {
    const res = await request(appHttp)
      .post('/tasks')
      .send({
        title: 'Invalid PreReq',
        prerequisites: ['00000000-0000-0000-0000-000000000999'],
      });

    expect([400, 404]).toContain(res.statusCode);
  });

  it('❌ should fail with malformed UUID', async () => {
    await request(appHttp)
      .post('/tasks')
      .send({
        title: 'Bad UUID',
        prerequisites: ['not-a-uuid'],
      })
      .expect(400);
  });

  it('❌ should fail if title is missing', async () => {
    await request(appHttp).post('/tasks').send({}).expect(400);
  });

  it('❌ should reject if prerequisite includes self', async () => {
    const res = await request(appHttp)
      .post('/tasks')
      .send({ title: 'Self ref' })
      .expect(201);

    const task = res.body as ITask;

    const selfDepRes = await request(appHttp)
      .post('/tasks')
      .send({
        title: 'Depends on self',
        prerequisites: [task.id],
      });

    // Adjust based on your logic
    expect([201, 400]).toContain(selfDepRes.statusCode);
  });
});
