import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { createTestApp } from 'test/utils/test-setup';
import { ITask } from 'src/task/task.interface';
import { App } from 'supertest/types';

describe('DELETE /tasks/:id', () => {
  let app: INestApplication;
  let appHttp: App;

  beforeAll(async () => {
    app = await createTestApp();
    appHttp = app.getHttpServer() as App;
  });

  afterAll(async () => {
    await app.close();
  });

  it('It should delete an existing task (200)', async () => {
    const createRes = await request(appHttp)
      .post('/tasks')
      .send({ title: 'Task to be deleted' })
      .expect(201);

    const task: ITask = createRes.body as ITask;

    const deleteRes = await request(appHttp)
      .delete(`/tasks/${task.id}`)
      .expect(200);

    expect(deleteRes.status).toBe(200);

    await request(appHttp).get(`/tasks/${task.id}`).expect(404);
  });

  it('It should return 404 for non-existent task ID', async () => {
    const fakeId = uuidv4();

    const res = await request(appHttp).delete(`/tasks/${fakeId}`).expect(404);

    expect(res.status).toBe(404);

    const body = res.body as { message?: string | string[] };

    expect(
      typeof body.message === 'string' || Array.isArray(body.message),
    ).toBe(true);
  });

  it('It should return 400 for malformed UUID', async () => {
    const res = await request(appHttp).delete('/tasks/not-a-uuid').expect(400);

    expect(res.status).toBe(400);

    const body = res.body as { message?: string | string[] };

    expect(
      typeof body.message === 'string' || Array.isArray(body.message),
    ).toBe(true);

    if (Array.isArray(body.message)) {
      expect(body.message.some((m) => m.toLowerCase().includes('uuid'))).toBe(
        true,
      );
    } else {
      expect(body.message?.toLowerCase()).toContain('uuid');
    }
  });
});
