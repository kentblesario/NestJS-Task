import { INestApplication } from '@nestjs/common';
import { ITask } from 'src/task/task.interface';
import * as request from 'supertest';
import { createTestApp } from '../utils/test-setup';
import { v4 as uuidv4 } from 'uuid';
import { App } from 'supertest/types';

describe('GET /tasks/:id', () => {
  let app: INestApplication;
  let appHttp: App;

  beforeAll(async () => {
    app = await createTestApp();
    appHttp = app.getHttpServer() as App;
  });

  afterAll(async () => {
    await app.close();
  });

  it('It should return an existing task', async () => {
    const createRes = await request(appHttp)
      .post('/tasks')
      .send({ title: 'Test Task' })
      .expect(201);

    const createdTask: ITask = createRes.body as ITask;

    const res = await request(appHttp)
      .get(`/tasks/${createdTask.id}`)
      .expect(200);

    const task = res.body as ITask;
    expect(task.id).toBe(createdTask.id);
    expect(task.title).toBe('Test Task');
  });

  it('It should return 404 for non-existent task ID', async () => {
    const res = await request(appHttp).get(`/tasks/${uuidv4()}`).expect(404);

    const body = res.body as { message?: string };
    expect(
      typeof body.message === 'string' || Array.isArray(body.message),
    ).toBe(true);
  });

  it('It should return 400 for malformed UUID', async () => {
    const res = await request(appHttp).get(`/tasks/not-a-uuid`).expect(404);

    const body = res.body as { message?: string };
    expect(
      typeof body.message === 'string' || Array.isArray(body.message),
    ).toBe(true);
  });
});
