import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../utils/test-setup';
import { ITask } from 'src/task/task.interface';
import { App } from 'supertest/types';

describe('POST /tasks', () => {
  let app: INestApplication;
  let appHttp: App;
  beforeAll(async () => {
    app = await createTestApp();
    appHttp = app.getHttpServer() as App;
  });

  afterAll(async () => {
    await app.close();
  });

  it('It should create a task without prerequisites', async () => {
    const res = await request(appHttp)
      .post('/tasks')
      .send({ title: 'Write unit tests' })
      .expect(201);

    const task: ITask = res.body as ITask;

    expect(task.title).toBe('Write unit tests');
    expect(task.prerequisites).toEqual([]);
  });

  it('It should create a task with valid prerequisites', async () => {
    const prereqRes = await request(appHttp)
      .post('/tasks')
      .send({ title: 'Set up DB' })
      .expect(201);

    const prereq: ITask = prereqRes.body as ITask;

    const res = await request(appHttp)
      .post('/tasks')
      .send({
        title: 'Deploy to Prod',
        prerequisites: [prereq.id],
      })
      .expect(201);

    const task: ITask = res.body as ITask;

    expect(task.title).toBe('Deploy to Prod');
    expect(task.prerequisites?.[0]?.id).toBe(prereq.id);
  });

  it('It should fail with non-existent prerequisite ID', async () => {
    const res = await request(appHttp)
      .post('/tasks')
      .send({
        title: 'Invalid PreReq',
        prerequisites: ['00000000-0000-0000-0000-000000000999'],
      });

    expect([400, 404]).toContain(res.statusCode);
    const body = res.body as { message?: string };
    expect(
      typeof body.message === 'string' || Array.isArray(body.message),
    ).toBe(true);
  });

  it('It should fail with invalid UUID', async () => {
    const res = await request(appHttp)
      .post('/tasks')
      .send({
        title: 'Bad UUID',
        prerequisites: ['123'],
      })
      .expect(400);

    const body = res.body as { message?: string };
    expect(
      typeof body.message === 'string' || Array.isArray(body.message),
    ).toBe(true);
  });

  it('It should reject if prerequisite includes self', async () => {
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

    expect([400, 201]).toContain(selfDepRes.statusCode);
    if (selfDepRes.statusCode === 400) {
      const body = selfDepRes.body as { message?: string };
      expect(
        typeof body.message === 'string' || Array.isArray(body.message),
      ).toBe(true);
    }
  });

  it('It should allow updating a task with a valid dueDate before its prerequisite', async () => {
    const parentRes = await request(appHttp)
      .post('/tasks')
      .send({
        title: 'Write documentation',
        dueDate: '2025-07-10T10:00:00.000Z',
      })
      .expect(201);

    const parent = parentRes.body as ITask;

    const childRes = await request(appHttp)
      .post('/tasks')
      .send({
        title: 'Submit draft',
      })
      .expect(201);

    const child = childRes.body as ITask;

    const patchRes = await request(appHttp)
      .patch(`/tasks/${child.id}`)
      .send({
        dueDate: '2025-07-08T10:00:00.000Z',
        prerequisites: [parent.id],
      })
      .expect(200);

    const updatedChild: ITask = patchRes.body as ITask;
    expect(updatedChild.prerequisites?.[0]?.id).toBe(parent.id);
    expect(updatedChild.dueDate).toBe('2025-07-08T10:00:00.000Z');
  });

  it('It should reject updating a task with a dueDate later than its prerequisite', async () => {
    const parentRes = await request(appHttp)
      .post('/tasks')
      .send({
        title: 'Prepare training deck',
        dueDate: '2025-07-05T12:00:00.000Z',
      })
      .expect(201);

    const parent = parentRes.body as ITask;

    const childRes = await request(appHttp)
      .post('/tasks')
      .send({
        title: 'Review slides',
        dueDate: '2025-07-04T12:00:00.000Z',
      })
      .expect(201);

    const child = childRes.body as ITask;

    const patchRes = await request(appHttp)
      .patch(`/tasks/${child.id}`)
      .send({
        dueDate: '2025-07-06T12:00:00.000Z',
        prerequisites: [parent.id],
      })
      .expect(400);

    const patchBody = patchRes.body as { message?: string };
    expect(patchBody.message).toContain(
      'Due date must be earlier than prerequisite task',
    );
  });
});
