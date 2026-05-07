# SkillBridge Backend

Express + TypeScript API for the SkillBridge attendance management MVP. The backend owns application roles, authorization checks, attendance writes, invite-based batch enrollment, and reporting summaries.

## Stack

- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Clerk authentication via `@clerk/express`
- Zod request validation
- Helmet, CORS, and Morgan middleware

## Project Structure

```text
backend/
  prisma/
    schema.prisma          Database schema and enums
    seed.ts                Demo database seed
    migrations/            Prisma migrations
  src/
    app.ts                 Express app, middleware, route mounting
    index.ts               HTTP server entry point
    config/
      env.ts               Environment validation
      prisma.ts            Prisma client singleton
    controllers/           Route handlers
    middlewares/           Auth and error middleware
    routes/                API route definitions
    services/              Summary/reporting helpers
    utils/                 Async handler and HTTP error helper
    validators/            Zod request schemas
```

## Environment Variables

Create `backend/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/skillbridge?sslmode=require"
CLERK_SECRET_KEY="sk_test_xxxxxxxxx"
CLERK_PUBLISHABLE_KEY="pk_test_xxxxxxxxx"
FRONTEND_URL="http://localhost:3000"
PORT=5000
NODE_ENV="development"
```

Required:

- `DATABASE_URL`: PostgreSQL connection string used by Prisma.
- `CLERK_SECRET_KEY`: Clerk secret key used to verify authenticated requests.

Optional/defaulted:

- `CLERK_PUBLISHABLE_KEY`: Present for deployment parity, not directly required by backend routes.
- `FRONTEND_URL`: Allowed browser origin for CORS. Defaults to `http://localhost:3000`. Use a comma-separated list for multiple origins, for example `http://localhost:3000,https://your-frontend.vercel.app`. Vercel frontend origins ending in `.vercel.app` are also accepted for preview deployments.
- `PORT`: API port. Defaults to `5000`.
- `NODE_ENV`: `development`, `test`, or `production`. Defaults to `development`.

## Local Setup

Install dependencies:

```bash
npm install
```

Generate Prisma Client:

```bash
npm run prisma:generate
```

Run database migrations:

```bash
npm run prisma:migrate
```

Seed demo records:

```bash
npm run seed
```

Start the development server:

```bash
npm run dev
```

The API will run at:

```text
http://localhost:5000
```

Health check:

```http
GET /health
```

API root:

```http
GET /
```

Returns basic API metadata and links to health/docs. Clerk middleware is scoped to protected API route groups, so the backend root URL does not process frontend Clerk handshake requests.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Starts the API with `tsx watch`. |
| `npm run prebuild` | Generates Prisma Client before build. Runs automatically before `npm run build`. |
| `npm run build` | Compiles TypeScript into `dist/`. |
| `npm run start` | Runs compiled server from `dist/index.js`. |
| `npm run prisma:generate` | Generates Prisma Client from `prisma/schema.prisma`. |
| `npm run prisma:migrate` | Runs local development migrations. |
| `npm run prisma:deploy` | Applies migrations in production/deployment. |
| `npm run seed` | Inserts demo records into the database. |

## Authentication And Authorization

Protected endpoints expect a Clerk session token:

```http
Authorization: Bearer <CLERK_SESSION_TOKEN>
```

Authentication flow:

1. `clerkMiddleware()` verifies the Clerk request context.
2. `requireAuth` checks that Clerk provided a `userId`.
3. `requireUserProfile` loads the matching app user from the `users` table.
4. `requireRole(...)` checks the app role before the controller runs.

The backend stores application roles in the database instead of trusting only frontend state.

Supported roles:

- `STUDENT`
- `TRAINER`
- `INSTITUTION`
- `PROGRAMME_MANAGER`
- `MONITORING_OFFICER`

## Response Format

Successful responses use:

```json
{
  "success": true,
  "data": {}
}
```

Validation errors use:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {}
}
```

Application errors use:

```json
{
  "success": false,
  "message": "Error message"
}
```

## Swagger / OpenAPI

The backend exposes Swagger documentation from the running API:

```text
http://localhost:5000/api/docs
```

Deployed Swagger documentation:

```text
https://skillbridge-attendance-management-system-4tth.onrender.com/api/docs
```

The raw OpenAPI JSON document is available at:

```text
http://localhost:5000/api/docs/openapi.json
```

In Swagger UI, click **Authorize** and paste a Clerk session JWT as the bearer token to test protected endpoints.

## API Reference

Base URL locally:

```text
http://localhost:5000/api
```

### Health

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `GET` | `/health` | No | Confirms the API is running. |

### Auth

| Method | Endpoint | Roles | Purpose |
|---|---|---|---|
| `GET` | `/api/auth/me` | Authenticated Clerk user | Returns the current app user profile, or `null` if onboarding is incomplete. |
| `POST` | `/api/auth/sync` | Authenticated Clerk user | Creates or updates the app user profile. |

`POST /api/auth/sync`

```json
{
  "name": "Demo Trainer",
  "email": "trainer@test.com",
  "role": "TRAINER",
  "institutionName": "SkillBridge Demo Institution"
}
```

`institutionName` is used for `STUDENT`, `TRAINER`, and `INSTITUTION` profiles.

### Batches

| Method | Endpoint | Roles | Purpose |
|---|---|---|---|
| `POST` | `/api/batches` | `TRAINER`, `INSTITUTION` | Creates a batch. Trainers are attached to batches they create. |
| `GET` | `/api/batches/my` | `TRAINER`, `INSTITUTION` | Lists batches for the current trainer or institution. |
| `GET` | `/api/batches/student` | `STUDENT` | Lists batches joined by the current student. |
| `POST` | `/api/batches/:id/invite` | `TRAINER` | Creates an invite token for a trainer-owned batch. |
| `POST` | `/api/batches/:id/join` | `STUDENT` | Joins a batch with a valid invite token. |
| `GET` | `/api/batches/:id/summary` | `INSTITUTION` | Returns attendance summary for an institution-owned batch. |

`POST /api/batches`

```json
{
  "name": "Web Development Batch A"
}
```

`POST /api/batches/:id/invite`

```json
{
  "expiresAt": "2026-06-01T00:00:00.000Z"
}
```

`expiresAt` is optional. Invite records also support an `isActive` flag in the database.

`POST /api/batches/:id/join`

```json
{
  "token": "invite-token"
}
```

### Sessions

| Method | Endpoint | Roles | Purpose |
|---|---|---|---|
| `POST` | `/api/sessions` | `TRAINER` | Creates a session for a trainer-assigned batch. |
| `GET` | `/api/sessions/my` | `TRAINER` | Lists sessions created by the current trainer. |
| `GET` | `/api/sessions/student-active` | `STUDENT` | Lists enrolled sessions whose end time has not passed. |
| `GET` | `/api/sessions/:id/attendance` | `TRAINER` | Returns attendance for a trainer-owned session. |

`POST /api/sessions`

```json
{
  "batchId": "batch_id",
  "title": "HTML and CSS Basics",
  "date": "2026-05-07T10:00:00.000Z",
  "startTime": "2026-05-07T10:00:00.000Z",
  "endTime": "2026-05-07T11:30:00.000Z"
}
```

`endTime` must be after `startTime`.

### Attendance

| Method | Endpoint | Roles | Purpose |
|---|---|---|---|
| `POST` | `/api/attendance/mark` | `STUDENT` | Marks attendance for an enrolled session. |

`POST /api/attendance/mark`

```json
{
  "sessionId": "session_id",
  "status": "PRESENT"
}
```

Supported statuses:

- `PRESENT`
- `ABSENT`
- `LATE`

Rules:

- Student must be enrolled in the session batch.
- Attendance cannot be marked after the session end time.
- A student can mark attendance only once per session.

### Institutions

| Method | Endpoint | Roles | Purpose |
|---|---|---|---|
| `GET` | `/api/institutions` | `PROGRAMME_MANAGER` | Lists institutions with batch/user counts. |
| `GET` | `/api/institutions/my/trainers` | `INSTITUTION` | Lists trainers linked to the current institution. |
| `GET` | `/api/institutions/:id/summary` | `PROGRAMME_MANAGER` | Returns a summary for one institution. |

### Programme

| Method | Endpoint | Roles | Purpose |
|---|---|---|---|
| `GET` | `/api/programme/summary` | `PROGRAMME_MANAGER`, `MONITORING_OFFICER` | Returns programme-wide summary metrics. |

## Database Model Summary

Main models:

- `Institution`: Owns batches and institution-linked users.
- `User`: App profile linked to Clerk by `clerkUserId`.
- `Batch`: Institution-owned training batch.
- `BatchTrainer`: Many-to-many batch/trainer membership.
- `BatchStudent`: Many-to-many batch/student membership.
- `Session`: Trainer-created class session for a batch.
- `Attendance`: One attendance record per session/student pair.
- `BatchInvite`: Token used by students to join a batch.

Important constraints:

- `users.clerkUserId` is unique.
- `users.email` is unique.
- `institutions.name` is unique.
- `attendance` is unique on `sessionId + studentId`.
- `batch_invites.token` is unique.

## Reporting Logic

Summary helpers live in `src/services/summary.service.ts`.

Available summary functions:

- `getBatchSummary(batchId)`
- `getInstitutionSummary(institutionId)`
- `getProgrammeSummary()`

Attendance rate is calculated from marked attendance records:

```text
(PRESENT + LATE) / total marked records
```

## Deployment Notes

Recommended Render backend settings:

```bash
npm install && npm run prisma:deploy && npm run build
```

Start command:

```bash
npm run start
```

The `prebuild` script runs `prisma generate` automatically before TypeScript compilation. This is required on fresh deploys because TypeScript imports generated Prisma enums such as `Role` and `AttendanceStatus`.

Required production environment variables:

```env
DATABASE_URL=...
CLERK_SECRET_KEY=...
FRONTEND_URL=https://your-frontend-domain
NODE_ENV=production
PORT=10000
```

For Vercel preview deployments or multiple frontend domains, set `FRONTEND_URL` as a comma-separated allowlist:

```env
FRONTEND_URL=https://your-production-frontend.vercel.app,https://your-preview-frontend.vercel.app
```

## Troubleshooting

### `@prisma/client` has no exported member `Role`

Prisma Client was not generated before TypeScript compilation.

Fix:

```bash
npm run prisma:generate
npm run build
```

The project also includes `prebuild` so `npm run build` runs generation automatically.

### Windows `EPERM rename query_engine-windows.dll.node`

A running Node process is usually holding Prisma's query engine open. Stop the local backend/dev server, then rerun:

```bash
npm run build
```

### Database connection errors during deploy

Check that:

- `DATABASE_URL` is set in the backend hosting environment.
- The database accepts external connections.
- SSL mode matches the hosted database provider's connection string.
- `npm run prisma:deploy` ran before the app starts.

## MVP Limitations

- Role onboarding is simplified for MVP use.
- Institution and trainer approval workflows are not implemented.
- Invite links are reusable unless disabled or expired in the database.
- Attendance window logic currently blocks late marking after session end time.
- Audit logs and email notifications are not included.
