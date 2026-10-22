-- ============================================================
-- V1 — Enable pgvector + create full HireMatch schema
-- ============================================================
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── USERS ─────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20)  NOT NULL DEFAULT 'USER',
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    consent_given   BOOLEAN      NOT NULL DEFAULT FALSE,
    consent_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── USER PROFILES ─────────────────────────────────────────────────────────
CREATE TABLE user_profiles (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    first_name          VARCHAR(100),
    last_name           VARCHAR(100),
    phone               VARCHAR(30),
    location            VARCHAR(200),
    preferred_work_mode VARCHAR(20),    -- REMOTE | HYBRID | ONSITE
    notice_period_days  INT,
    expected_ctc        NUMERIC(15,2),
    work_authorization  VARCHAR(100),
    linkedin_url        VARCHAR(500),
    github_url          VARCHAR(500),
    portfolio_url       VARCHAR(500),
    bio                 TEXT,
    avatar_url          VARCHAR(500),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── RESUMES ───────────────────────────────────────────────────────────────
CREATE TABLE resumes (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    version         INT          NOT NULL DEFAULT 1,
    label           VARCHAR(100),
    is_primary      BOOLEAN      NOT NULL DEFAULT FALSE,
    source          VARCHAR(20)  NOT NULL DEFAULT 'UPLOAD',  -- UPLOAD | BUILDER
    file_path       VARCHAR(500),
    file_name       VARCHAR(255),
    mime_type       VARCHAR(100),
    parsed_json     JSONB,
    embedding       vector(384),
    ats_score       SMALLINT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_embedding ON resumes USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_resumes_parsed_json ON resumes USING gin (parsed_json);

-- ── RESUME SECTIONS ───────────────────────────────────────────────────────
CREATE TABLE resume_sections (
    id          BIGSERIAL PRIMARY KEY,
    resume_id   BIGINT       NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    section     VARCHAR(50)  NOT NULL,  -- SUMMARY|EXPERIENCE|EDUCATION|SKILLS|PROJECTS|CERTS
    content     JSONB,
    embedding   vector(384),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_resume_sections_resume ON resume_sections(resume_id);
CREATE INDEX idx_resume_sections_emb ON resume_sections USING hnsw (embedding vector_cosine_ops);

-- ── SKILLS TAXONOMY ───────────────────────────────────────────────────────
CREATE TABLE skills (
    id            BIGSERIAL PRIMARY KEY,
    canonical     VARCHAR(100) NOT NULL UNIQUE,
    category      VARCHAR(50),
    synonyms      TEXT[],       -- e.g. ARRAY['JS', 'node.js']
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_skills_synonyms ON skills USING gin (synonyms);

-- ── USER SKILLS ───────────────────────────────────────────────────────────
CREATE TABLE user_skills (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id    BIGINT      NOT NULL REFERENCES skills(id),
    proficiency VARCHAR(20),   -- BEGINNER | INTERMEDIATE | EXPERT
    years_exp   SMALLINT,
    UNIQUE (user_id, skill_id)
);

-- ── JOBS ──────────────────────────────────────────────────────────────────
CREATE TABLE jobs (
    id              BIGSERIAL PRIMARY KEY,
    source          VARCHAR(30)  NOT NULL,   -- ADZUNA | JSEARCH | REMOTIVE | MANUAL
    external_id     VARCHAR(200),
    hash            VARCHAR(64)  NOT NULL UNIQUE,  -- SHA-256 of (source+external_id+title+company)
    title           VARCHAR(300) NOT NULL,
    company         VARCHAR(200),
    location        VARCHAR(300),
    work_mode       VARCHAR(20),   -- REMOTE | HYBRID | ONSITE
    job_type        VARCHAR(30),   -- FULL_TIME | PART_TIME | CONTRACT | INTERNSHIP
    experience_min  SMALLINT,
    experience_max  SMALLINT,
    salary_min      NUMERIC(15,2),
    salary_max      NUMERIC(15,2),
    currency        VARCHAR(10),
    description     TEXT,
    apply_url       VARCHAR(1000),
    apply_email     VARCHAR(255),
    posted_at       TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    embedding       vector(384),
    is_active       BOOLEAN  NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_jobs_hash ON jobs(hash);
CREATE INDEX idx_jobs_source ON jobs(source);
CREATE INDEX idx_jobs_posted_at ON jobs(posted_at DESC);
CREATE INDEX idx_jobs_work_mode ON jobs(work_mode);
CREATE INDEX idx_jobs_job_type ON jobs(job_type);
CREATE INDEX idx_jobs_embedding ON jobs USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_jobs_title_trgm ON jobs USING gin (title gin_trgm_ops);
CREATE INDEX idx_jobs_company_trgm ON jobs USING gin (company gin_trgm_ops);
CREATE INDEX idx_jobs_description_fts ON jobs USING gin (to_tsvector('english', description));

-- ── JOB SKILLS ────────────────────────────────────────────────────────────
CREATE TABLE job_skills (
    id          BIGSERIAL PRIMARY KEY,
    job_id      BIGINT      NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill_id    BIGINT      NOT NULL REFERENCES skills(id),
    is_required BOOLEAN     NOT NULL DEFAULT TRUE,
    UNIQUE (job_id, skill_id)
);
CREATE INDEX idx_job_skills_job ON job_skills(job_id);

-- ── MATCH RESULTS (cache) ─────────────────────────────────────────────────
CREATE TABLE match_results (
    id                  BIGSERIAL PRIMARY KEY,
    resume_id           BIGINT      NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    job_id              BIGINT      NOT NULL REFERENCES jobs(id)    ON DELETE CASCADE,
    overall_score       REAL        NOT NULL,
    semantic_score      REAL,
    skill_score         REAL,
    experience_score    REAL,
    location_score      REAL,
    matched_skills      JSONB,
    missing_skills      JSONB,
    verdict             TEXT,
    computed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (resume_id, job_id)
);
CREATE INDEX idx_match_results_resume ON match_results(resume_id);
CREATE INDEX idx_match_results_score  ON match_results(overall_score DESC);

-- ── APPLICATIONS ──────────────────────────────────────────────────────────
CREATE TABLE applications (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id              BIGINT      NOT NULL REFERENCES jobs(id),
    resume_id           BIGINT      REFERENCES resumes(id),
    status              VARCHAR(30) NOT NULL DEFAULT 'SAVED',
    -- SAVED | APPLIED | UNDER_REVIEW | INTERVIEW | OFFER | REJECTED | WITHDRAWN
    channel             VARCHAR(30),    -- EMAIL | URL | MANUAL
    applied_at          TIMESTAMPTZ,
    cover_letter        TEXT,
    notes               TEXT,
    next_action         VARCHAR(200),
    next_action_at      TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, job_id)
);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status  ON applications(status);
CREATE INDEX idx_applications_applied_at ON applications(applied_at DESC);

-- ── APPLICATION STATUS HISTORY ────────────────────────────────────────────
CREATE TABLE application_status_history (
    id              BIGSERIAL PRIMARY KEY,
    application_id  BIGINT      NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    from_status     VARCHAR(30),
    to_status       VARCHAR(30) NOT NULL,
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    note            TEXT
);
CREATE INDEX idx_app_status_history_app ON application_status_history(application_id);

-- ── REMINDERS ─────────────────────────────────────────────────────────────
CREATE TABLE reminders (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id  BIGINT      REFERENCES applications(id) ON DELETE CASCADE,
    type            VARCHAR(50) NOT NULL,
    -- FOLLOW_UP | INTERVIEW_24H | INTERVIEW_1H | DEADLINE | JOB_CLOSED | PROFILE_SUGGESTION
    trigger_at      TIMESTAMPTZ NOT NULL,
    snoozed_until   TIMESTAMPTZ,
    is_sent         BOOLEAN     NOT NULL DEFAULT FALSE,
    is_completed    BOOLEAN     NOT NULL DEFAULT FALSE,
    idempotency_key VARCHAR(100) NOT NULL UNIQUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_reminders_trigger ON reminders(trigger_at) WHERE NOT is_sent AND NOT is_completed;
CREATE INDEX idx_reminders_user    ON reminders(user_id);

-- ── NOTIFICATIONS ─────────────────────────────────────────────────────────
CREATE TABLE notifications (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(50),
    title       VARCHAR(200),
    body        TEXT,
    link        VARCHAR(500),
    is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE NOT is_read;

-- ── SAVED SEARCHES ────────────────────────────────────────────────────────
CREATE TABLE saved_searches (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(100),
    filters     JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── AUDIT LOGS ────────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT,
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id   BIGINT,
    details     JSONB,
    ip_address  VARCHAR(45),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ── REFRESH TOKENS ────────────────────────────────────────────────────────
CREATE TABLE refresh_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ  NOT NULL,
    revoked     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
