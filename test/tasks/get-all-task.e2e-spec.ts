import { INestApplication } from '@nestjs/common';
import { ITask } from 'src/task/task.interface';
import * as request from 'supertest';
import { createTestApp } from '../utils/test-setup';
import { App } from 'supertest/types';

describe('GET /tasks', () => {
  let app: INestApplication;
  let appHttp: App;

  beforeAll(async () => {
    app = await createTestApp();
    appHttp = app.getHttpServer() as App;
  });

  afterAll(async () => {
    await app.close();
  });

  it('It should return all tasks', async () => {
    await request(appHttp).post('/tasks').send({ title: 'Task A' }).expect(201);
    await request(appHttp).post('/tasks').send({ title: 'Task B' }).expect(201);

    const res = await request(appHttp).get('/tasks').expect(200);

    const tasks = res.body as ITask[];

    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeGreaterThanOrEqual(2);
    expect(tasks.some((t) => t.title === 'Task A')).toBe(true);
    expect(tasks.some((t) => t.title === 'Task B')).toBe(true);
  });
});
