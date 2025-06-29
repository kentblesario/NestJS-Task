import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from '../utils/test-setup';
import { v4 as uuidv4 } from 'uuid';
import { App } from 'supertest/types';
import { ITask } from 'src/task/task.interface';

describe('PATCH /tasks/:id/status', () => {
  let app: INestApplication;
  let appHttp: App;
  beforeAll(async () => {
    app = await createTestApp();
    appHttp = app.getHttpServer() as App;
  });

  afterAll(async () => {
    await app.close();
  });

  it('It should return 404 if task does not exist', async () => {
    const fakeId = uuidv4();

    const res = await request(appHttp)
      .patch(`/tasks/${fakeId}/status`)
      .send({ taskStatus: 'COMPLETED' });

    expect(res.statusCode).toBe(404);
    const body = res.body as { message?: string };
    expect(
      typeof body.message === 'string' || Array.isArray(body.message),
    ).toBe(true);
  });

  it('It should return 400 for invalid UUID', async () => {
    const res = await request(appHttp)
      .patch(`/tasks/not-a-uuid/status`)
      .send({ taskStatus: 'COMPLETED' })
      .expect(400);

    const body = res.body as { message?: string };
    expect(
      typeof body.message === 'string' || Array.isArray(body.message),
    ).toBe(true);
  });

  it('It should return 400 for invalid taskStatus value', async () => {
    const createRes = await request(appHttp)
      .post('/tasks')
      .send({ title: 'Validate bad status' })
      .expect(201);

    const task = createRes.body as ITask;

    const res = await request(appHttp)
      .patch(`/tasks/${task.id}/status`)
      .send({ taskStatus: 'INVALID_STATUS' });

    expect(res.statusCode).toBe(400);

    const body = res.body as { message?: string[] };

    expect(Array.isArray(body.message)).toBe(true);
    expect(body.message).toContain(
      'taskStatus must be one of the following values: NOT_STARTED, IN_PROGRESS, COMPLETED, BLOCKED',
    );
  });

  it('It should reject direct transition from NOT_STARTED to COMPLETED', async () => {
    const createRes = await request(appHttp)
      .post('/tasks')
      .send({ title: 'Start then complete' })
      .expect(201);

    const task = createRes.body as ITask;

    const res = await request(appHttp)
      .patch(`/tasks/${task.id}/status`)
      .send({ taskStatus: 'COMPLETED' });

    expect(res.statusCode).toBe(400);
    const body = res.body as { message?: string };
    expect(body.message).toContain(
      'Cannot change status directly from "NOT_STARTED" to "COMPLETED"',
    );
  });

  it('It should allow NOT_STARTED → IN_PROGRESS → COMPLETED', async () => {
    const res = await request(appHttp)
      .post('/tasks')
      .send({ title: 'Progression task' })
      .expect(201);

    const task = res.body as ITask;

    await request(appHttp)
      .patch(`/tasks/${task.id}/status`)
      .send({ taskStatus: 'IN_PROGRESS' })
      .expect(200);

    const completedRes = await request(appHttp)
      .patch(`/tasks/${task.id}/status`)
      .send({ taskStatus: 'COMPLETED' })
      .expect(200);

    const updated: ITask = completedRes.body as ITask;
    expect(updated.taskStatus).toBe('COMPLETED');
    expect(updated.completedAt).toBeDefined();
  });

  it('It should block completing a task if prerequisites are incomplete', async () => {
    const prereqRes = await request(appHttp)
      .post('/tasks')
      .send({ title: 'Blocked prereq' })
      .expect(201);

    const prereq: ITask = prereqRes.body as ITask;

    const taskRes = await request(appHttp)
      .post('/tasks')
      .send({ title: 'Blocked child', prerequisites: [prereq.id] })
      .expect(201);

    const blocked: ITask = taskRes.body as ITask;

    const res = await request(appHttp)
      .patch(`/tasks/${blocked.id}/status`)
      .send({ taskStatus: 'IN_PROGRESS' });

    expect(res.statusCode).toBe(200); // can move to in progress

    const fail = await request(appHttp)
      .patch(`/tasks/${blocked.id}/status`)
      .send({ taskStatus: 'COMPLETED' });
    expect(fail.statusCode).toBe(400);
    expect((fail.body as { message?: string }).message).toContain(
      'Cannot complete task: prerequisites are not all completed.',
    );
  });

  it('It should unblock dependent task once prerequisites are completed', async () => {
    // Create prerequisite task
    const prereqRes = await request(appHttp)
      .post('/tasks')
      .send({ title: 'Complete me first' })
      .expect(201);
    const prereq: ITask = prereqRes.body as ITask;

    // Create dependent task with prereq
    const dependentRes = await request(appHttp)
      .post('/tasks')
      .send({ title: 'Blocked until done', prerequisites: [prereq.id] })
      .expect(201);
    const dependent: ITask = dependentRes.body as ITask;

    expect(dependent.taskStatus).toBe('BLOCKED');

    // Move prereq to IN_PROGRESS
    const inProgressRes = await request(appHttp)
      .patch(`/tasks/${prereq.id}/status`)
      .send({ taskStatus: 'IN_PROGRESS' });

    expect(inProgressRes.statusCode).toBe(200);

    // Move prereq to COMPLETED
    await request(appHttp)
      .patch(`/tasks/${prereq.id}/status`)
      .send({ taskStatus: 'COMPLETED' })
      .expect(200);

    // Confirm prereq is marked COMPLETED
    const prereqCheck = await request(appHttp)
      .get(`/tasks/${prereq.id}`)
      .expect(200);
    const prereqBody: ITask = prereqCheck.body as ITask;
    expect(prereqBody.taskStatus).toBe('COMPLETED');

    // Optional: short wait to ensure DB consistency
    await new Promise((r) => setTimeout(r, 50));

    // Reload dependent to check if status was unblocked
    const checkRes = await request(appHttp)
      .get(`/tasks/${dependent.id}`)
      .expect(200);
    const dependentBody: ITask = checkRes.body as ITask;
    expect(dependentBody.taskStatus).toBe('NOT_STARTED');
  });
});
