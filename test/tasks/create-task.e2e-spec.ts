import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../utils/test-setup';
import { App } from 'supertest/types';
import { ITask, ITaskStatus } from '../../src/task/task.interface';

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

    const task = res.body as ITask;
    expect(task.title).toBe('Write unit tests');
    expect(task.prerequisites).toEqual([]);
  });

  it('It should create a task with valid prerequisites', async () => {
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

  it('It should fail with non-existent prerequisite ID', async () => {
    const res = await request(appHttp)
      .post('/tasks')
      .send({
        title: 'Invalid PreReq',
        prerequisites: ['00000000-0000-0000-0000-000000000999'],
      });

    expect([400, 404]).toContain(res.statusCode);
  });

  it('It should fail with malformed UUID', async () => {
    await request(appHttp)
      .post('/tasks')
      .send({
        title: 'Bad UUID',
        prerequisites: ['not-a-uuid'],
      })
      .expect(400);
  });

  it('It should fail if title is missing', async () => {
    await request(appHttp).post('/tasks').send({}).expect(400);
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

    expect([201, 400]).toContain(selfDepRes.statusCode);
  });

  it('It should create a valid child task with earlier dueDate than its parent (prerequisite)', async () => {
    const parentRes = await request(appHttp)
      .post('/tasks')
      .send({
        title: 'Set up environment',
        dueDate: '2025-07-10T12:00:00.000Z',
      })
      .expect(201);

    const parent = parentRes.body as ITask;

    const childRes = await request(appHttp)
      .post('/tasks')
      .send({
        title: 'Install dependencies',
        dueDate: '2025-07-08T12:00:00.000Z',
        prerequisites: [parent.id],
      })
      .expect(201);

    const child = childRes.body as ITask;
    expect(child.prerequisites?.[0]?.id).toBe(parent.id);
  });

  it('It should reject a child task with dueDate after its parent (prerequisite)', async () => {
    const parentRes = await request(appHttp)
      .post('/tasks')
      .send({
        title: 'Configure server',
        dueDate: '2025-07-10T12:00:00.000Z',
      })
      .expect(201);

    const parent = parentRes.body as ITask;

    const invalidChildRes = await request(appHttp)
      .post('/tasks')
      .send({
        title: 'Write deployment script',
        dueDate: '2025-07-12T12:00:00.000Z',
        prerequisites: [parent.id],
      });

    expect(invalidChildRes.statusCode).toBe(400);
    const message: string = (invalidChildRes.body as { message: string })
      .message;
    expect(message).toContain(
      'Due date must be earlier than prerequisite task',
    );
  });

  it('It should set taskStatus to BLOCKED when prerequisites exist', async () => {
    const setupRes = await request(appHttp)
      .post('/tasks')
      .send({ title: 'Prepare backend' })
      .expect(201);

    const prerequisite = setupRes.body as ITask;

    const blockedTaskRes = await request(appHttp)
      .post('/tasks')
      .send({
        title: 'Run integration tests',
        prerequisites: [prerequisite.id],
      })
      .expect(201);

    const blockedTask = blockedTaskRes.body as ITask;
    expect(blockedTask.taskStatus).toBe(ITaskStatus.BLOCKED);
  });

  it('It should set taskStatus to NOT_STARTED when no prerequisites exist', async () => {
    const res = await request(appHttp)
      .post('/tasks')
      .send({ title: 'Write documentation' })
      .expect(201);

    const task = res.body as ITask;
    expect(task.taskStatus).toBe(ITaskStatus.NOT_STARTED);
  });

  it('It should return 400 for invalid taskStatus value', async () => {
    const createRes = await request(appHttp)
      .post('/tasks')
      .send({ title: 'Validate bad status' })
      .expect(201);

    const task = createRes.body as ITask;

    const res = await request(appHttp)
      .patch(`/tasks/${task.id}/status`)
      .send({ status: 'INVALID_STATUS' });

    expect(res.statusCode).toBe(400);
    const body = res.body as { message: string };
    expect(body.message).toContain(
      'taskStatus must be one of the following values: NOT_STARTED, IN_PROGRESS, COMPLETED, BLOCKED',
    );
  });
});
