import { INestApplication } from '@nestjs/common';
import { ITask } from 'src/task/task.interface';
import * as request from 'supertest';
import { createTestApp } from '../utils/test-setup';
import { v4 as uuidv4 } from 'uuid';
import { App } from 'supertest/types';

describe('PATCH /tasks/:id/complete', () => {
  let app: INestApplication;
  let appHttp: App;
  beforeAll(async () => {
    app = await createTestApp(); // Shared test app setup
    appHttp = app.getHttpServer() as App; // Cast to App type for supertest
  });

  afterAll(async () => {
    await app.close();
  });

  it('It should return 404 if task does not exist', async () => {
    const fakeId = uuidv4();

    const res = await request(appHttp)
      .patch(`/tasks/${fakeId}/complete`)
      .send({ completed: true });

    expect(res.statusCode).toBe(404);
    const body = res.body as { message?: string };
    expect(
      typeof body.message === 'string' || Array.isArray(body.message),
    ).toBe(true);
  });

  it('It should return 400 if prerequisites are not completed', async () => {
    const prereqRes = await request(appHttp)
      .post('/tasks')
      .send({ title: 'Unfinished Prereq' })
      .expect(201);
    const prereq = prereqRes.body as ITask;

    const taskRes = await request(appHttp)
      .post('/tasks')
      .send({
        title: 'Main Task',
        prerequisites: [prereq.id],
      })
      .expect(201);
    const mainTask = taskRes.body as ITask;

    const res = await request(appHttp)
      .patch(`/tasks/${mainTask.id}/complete`)
      .send({ completed: true });

    expect(res.statusCode).toBe(400);
    const body = res.body as { message?: string };
    expect(
      typeof body.message === 'string' || Array.isArray(body.message),
    ).toBe(true);
  });

  it('✅ should complete task when prerequisites are completed', async () => {
    const prereqRes = await request(appHttp)
      .post('/tasks')
      .send({ title: 'Finished Prereq' })
      .expect(201);
    const prereq: ITask = prereqRes.body as ITask;

    await request(appHttp)
      .patch(`/tasks/${prereq.id}/complete`)
      .send({ completed: true })
      .expect(200);

    const taskRes = await request(appHttp)
      .post('/tasks')
      .send({
        title: 'Main Task With Done Prereq',
        prerequisites: [prereq?.id],
      })
      .expect(201);
    const mainTask: ITask = taskRes.body as ITask;

    const res = await request(appHttp)
      .patch(`/tasks/${mainTask.id}/complete`)
      .send({ completed: true })
      .expect(200);

    const updated: ITask = res.body as ITask;
    expect(updated.completed).toBe(true);
    expect(typeof updated.completedAt).toBe('string');
  });

  it('It should return 400 for invalid UUID', async () => {
    const res = await request(appHttp)
      .patch(`/tasks/not-a-uuid/complete`)
      .send({ completed: true })
      .expect(400 | 404);

    const body = res.body as { message?: string };
    expect(
      typeof body.message === 'string' || Array.isArray(body.message),
    ).toBe(true);
  });
});
