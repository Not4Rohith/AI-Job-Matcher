<<<<<<< HEAD
# HireMatch AI

HireMatch AI is a modern, full-stack application designed to revolutionize the job search process. By leveraging AI (LLMs) and Vector Databases (`pgvector`), HireMatch parses your resume, intelligently matches you with the best roles, identifies skill gaps, tailors your resume for specific applications, and tracks your progress via an interactive Kanban board.

## ✨ Key Features

- **AI Resume Parsing**: Upload your resume and instantly parse education, experience, and skills into structured JSON using OpenAI.
- **Smart Matching Engine**: Matches jobs against your profile using a combination of Semantic Similarity (embeddings via pgvector) and hard skill overlap.
- **AI Resume Tailoring**: Automatically generates a tailored version of your resume to maximize your ATS score for a specific Job Description without inventing fake experience.
- **Automated Job Ingestion**: Connects to the Remotive API to automatically ingest and vectorize new job postings on a schedule.
- **Kanban Tracker**: A drag-and-drop Kanban board built with `dnd-kit` to track your application pipeline.
- **Automated Reminders**: Built-in daemon to remind you to follow up on stale applications.

## 🏗️ Architecture Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, Zustand, dnd-kit, Lucide Icons.
- **Backend**: Spring Boot 3, Java 17, Spring Data JPA, Spring Security (JWT).
- **AI Microservice**: Python, FastAPI, OpenAI API, sentence-transformers (for embeddings).
- **Database**: PostgreSQL 16 with `pgvector` extension hosted on Supabase.

---

## 🚀 Getting Started

### 1. Database Setup (Supabase)
We use Supabase for PostgreSQL with `pgvector` enabled out of the box.
1. Create a Supabase project.
2. Ensure you have your connection string (Session Mode or IPv4 pooler).
3. The Spring Boot backend uses Flyway to automatically run the schema migration (`V1__init_schema.sql`) on startup.

### 2. Python AI Service Setup
This microservice handles OpenAI LLM calls and local embedding generation.

```bash
cd ai-service
# Create a virtual environment
python -m venv venv
# Activate it (Windows)
venv\Scripts\activate
# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --port 8000
```
**Environment Variables Required (`ai-service/.env`)**:
- `OPENAI_API_KEY`: Your OpenAI key.
- `OPENAI_MODEL`: `gpt-4o-mini`

### 3. Spring Boot Backend Setup
This is the core business logic API and database driver.

```bash
cd backend
# Compile and run using Maven
mvn spring-boot:run
```
**Environment Variables Required (`backend/src/main/resources/application.properties`)**:
- `spring.datasource.url`: JDBC URL pointing to your Supabase instance.
- `spring.datasource.username`: Postgres User.
- `spring.datasource.password`: Postgres Password.
- `jwt.secret`: A random 256-bit secret for JWT signing.
- `ai.service.url`: `http://localhost:8000` (points to the python service)

### 4. React Frontend Setup
The beautiful user interface.

```bash
cd frontend
# Install dependencies
npm install
# Start development server
npm run dev
```

---

## 🗺️ Project Structure

- `/frontend` - Vite + React SPA.
  - `/src/pages` - Main views (Dashboard, Jobs, Resume Builder, Tracker).
  - `/src/api` - Axios interceptors and endpoints.
  - `/src/store` - Zustand state management.
- `/backend` - Spring Boot Java Application.
  - `/src/main/java/com/hirematch/entity` - JPA Entities.
  - `/src/main/java/com/hirematch/controller` - REST Endpoints.
  - `/src/main/java/com/hirematch/service` - Business Logic.
  - `/src/main/resources/db/migration` - Flyway SQL schemas.
- `/ai-service` - Python FastAPI Microservice.
  - `/routers` - Endpoints for resume parsing, skill extraction, and tailoring.
  - `/services` - Embedding generators using `sentence-transformers`.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

## 📝 License
This project is open-sourced software licensed under the MIT license.
=======
# AI-Project
>>>>>>> 2c48b2ca06d68533da674bcb4ba6b94e5370ea28
