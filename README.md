# 🚀 NestJS API

A task scheduling REST API that lets users create tasks to be completed at a
particular time. You can think of this as an application similar to a to-do app and a
reminders app.

## ✅Functional Requirements

- NestJS and Typescript
- With CRUD Endpoints for Managing Tasks
- SQLite for Database for easier set-up

## ✅Additional Features

- A routine for completing tasks (NOT STARTED, IN PROGRESS, COMPLETED, BLOCKED)
- Task hiarchy (one task blocks another task if not completed; e.g. parent is blocked if child is not completed)
- Parent - child relationship (child task cannot have a later due date than the parent)
- If all Children has complete status, parent status will be updated to NOT STARTED
- E2E test included for all endpoints
- OpenUI/Swagger Docs available

## 📦 Requirements

- Node.js >= 22.17.0
- npm

---

## 🛠 Installation

```bash
# Clone the repository
git clone https://github.com/kentblesario/NestJS-Task.git
cd NestJS-Task

# Install dependencies
npm install
# or
yarn install

▶️ Running the App
# Development mode with hot reload
npm run start:dev

By default, the server runs at: http://localhost:3000

📘 Swagger API Docs (Manual Testing)
Swagger is available once the server is running.

URL: http://localhost:3000/api

To test endpoints manually:

Open the URL above in your browser.

Try out any endpoint with real input/output.



✅ End-to-End (E2E) Testing
# Run all e2e tests
npm run test:e2e

✅ POST /tasks Test Cases

- It should create a task without prerequisites
- It should create a task with valid prerequisites
- It should fail with non-existent prerequisite ID
- It should fail with malformed UUID
- It should fail if title is missing
- It should reject if prerequisite includes self
- It should create a valid child task with earlier dueDate than its parent (prerequisite)
- It should reject a child task with dueDate after its parent (prerequisite)
- It should set taskStatus to BLOCKED when prerequisites exist
- It should set taskStatus to NOT_STARTED when no prerequisites exist
- It should return 400 for invalid taskStatus value

🗑️ DELETE /tasks/:id Test Cases
- It should delete an existing task (200)
- It should return 404 for non-existent task ID
- It should return 400 for malformed UUID

📋 GET /tasks Test Case
- It should return all tasks

✅ GET /tasks/:id
- It should return an existing task
- It should return 404 for non-existent task ID
- It should return 400 for malformed UUID

✅ PATCH /tasks/:id/status
- It should return 404 if task does not exist
- It should return 400 for invalid UUID
- It should return 400 for invalid taskStatus value
- It should reject direct transition from NOT_STARTED to COMPLETED
- It should allow NOT_STARTED → IN_PROGRESS → COMPLETED
- It should block completing a task if prerequisites are incomplete
- It should unblock dependent task once prerequisites are completed

✅ POST /tasks
- It should create a task without prerequisites
- It should create a task with valid prerequisites
- It should fail with non-existent prerequisite ID
- It should fail with invalid UUID
- It should reject if prerequisite includes self
- It should allow updating a task with a valid dueDate before its prerequisite
- It should reject updating a task with a dueDate later than its prerequisite


