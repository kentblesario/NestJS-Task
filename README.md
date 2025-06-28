# 🚀 NestJS API

A task scheduling REST API that lets users create tasks to be completed at a
particular time. You can think of this as an application similar to a to-do app and a
reminders app.

# Functional Requirements
- NestJS and Typescript
- With CRUD Endpoints for Managing Tasks
- SQLite for Database for easier set-up

## Additional Features
- Task hiarchy where a task is dependent on the other, meaning you cannot complete specific task if it is has a prerequisite task to be completed.
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


