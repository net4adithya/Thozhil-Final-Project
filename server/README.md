# InterviewX AI - Server Documentation

This is the Express backend API for **InterviewX AI**, migrated to use **Supabase PostgreSQL** and **Supabase Storage** for persistence.

---

## 🚀 1. Supabase Project Setup

To set up the database and storage on your Supabase instance:

### A. Database Migration
1. Go to your **Supabase Dashboard** -> **SQL Editor**.
2. Copy the contents of the migration SQL file:
   `supabase/migrations/001_initial_schema.sql`
3. Paste the contents into the SQL Editor and click **Run**. This will create the required tables (`candidates`, `jobs`, `interviews`, `questions`, `answers`, `resumes`, and `reports`) along with indexes, foreign keys, triggers, and type constraints.

### B. Storage Configuration
1. Go to your **Supabase Dashboard** -> **Storage**.
2. Click **New bucket** and name it exactly: **`resumes`**.
3. Set the bucket privacy policy (Public or Private depending on your client-side download policy; the backend uses the service role key which bypasses all RLS/privacy rules to read and write files).

---

## ⚙️ 2. Environment Variables

Create a `server/.env` file in the root of the server directory with the following variables:

```env
PORT=5000
NODE_ENV=development

# Supabase Configurations
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SECRET_KEY=your-supabase-service-role-key

# Upload Rules
MAX_FILE_SIZE=5242880 # 5 MB in bytes
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

> [!WARNING]
> **Security Guard**: `SUPABASE_SECRET_KEY` is a server-only service role key. It bypasses RLS and has full administrative access to your database. **NEVER** expose this key to your React client, place it in client-side code, or add it to `frontend/.env`.

---

## 🛠️ 3. Local Development

### Installation
Run the following command to download dependencies:
```bash
npm install
```

### Running Server
To start the backend development server (uses nodemon for automatic reloads):
```bash
npm run dev
```

---

## 🧪 4. Testing

A dedicated test suite is provided to assert API health, CRUD operations, relationships, UUID validations, unique report constraints, and file storage uploads.

To run the integration test suite:
1. Ensure you have populated valid values for `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in `server/.env`.
2. Run:
   ```bash
   node test.js
   ```
The test suite operates on the configured Supabase client and cleans up after itself by deleting the created test rows at completion, preventing test database pollution.

---

## 📡 5. API Endpoints

### Health check
*   `GET /api/health`: Asserts communication with the Express application and Supabase DB.

### Candidates
*   `POST /api/candidates`: Create candidate.
*   `GET /api/candidates`: Query candidates (can accept an optional `?interviewId=` query parameter).
*   `GET /api/candidates/:id`: Get candidate details.
*   `PUT /api/candidates/:id`: Update candidate details.
*   `DELETE /api/candidates/:id`: Delete candidate.

### Jobs
*   `POST /api/jobs`: Create job opening.
*   `GET /api/jobs`: Query all jobs.
*   `GET /api/jobs/:id`: Get job details.
*   `PUT /api/jobs/:id`: Update job details.
*   `DELETE /api/jobs/:id`: Delete job.

### Interviews
*   `POST /api/interviews`: Create async or live interview.
*   `GET /api/interviews`: Query all interviews.
*   `GET /api/interviews/:id`: Get interview details.
*   `PUT /api/interviews/:id`: Update interview configurations and nested questions.
*   `DELETE /api/interviews/:id`: Delete interview.

### Questions
*   `POST /api/interviews/:interviewId/questions`: Append question to interview.
*   `GET /api/interviews/:interviewId/questions`: List questions belonging to interview.

### Answers
*   `POST /api/interviews/:interviewId/answers`: Submit candidate answer/transcript.
*   `GET /api/interviews/:interviewId/answers`: List answers belonging to interview.

### Resumes
*   `POST /api/resumes`: Upload candidate resume (saves multipart form-data to Supabase Storage and records metadata in SQL resumes table).
*   `GET /api/resumes/:id`: Retrieve resume metadata.

### Reports
*   `POST /api/reports`: Persist interview evaluation report (enforces unique interview constraint).
*   `GET /api/reports/:id`: Get report metadata.
*   `GET /api/reports/analytics`: Calculate dashboard KPIs, scores, completions, and stats.

---

## 🔒 6. Security & Troubleshooting
1.  **Rate Limiting**: The server blocks IPs making more than 200 requests within a 15-minute window to protect endpoints.
2.  **Payload Validation**: Inputs are validated at the route level using `Joi` schemas. UUIDs are strictly enforced for database record identifiers.
3.  **Cross-Origin Requests**: Ensure your frontend URL matches the origins configured inside `ALLOWED_ORIGINS` to avoid CORS blocks.
