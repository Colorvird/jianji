PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS surveys (
  id                 TEXT PRIMARY KEY,
  title              TEXT NOT NULL,
  description        TEXT NOT NULL DEFAULT '',
  type               TEXT NOT NULL DEFAULT 'short' CHECK (type IN ('short', 'long')),
  icon               TEXT NOT NULL DEFAULT 'clipboard',
  status             TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  deadline           TEXT,
  target             INTEGER NOT NULL DEFAULT 20,
  access             TEXT NOT NULL DEFAULT 'approval' CHECK (access IN ('readonly', 'approval', 'open')),
  results_published  INTEGER NOT NULL DEFAULT 0,
  timetable_mode     TEXT NOT NULL DEFAULT 'period' CHECK (timetable_mode IN ('period', 'clock')),
  period_times_json  TEXT NOT NULL DEFAULT '[]',
  admin_token_hash   TEXT NOT NULL UNIQUE,
  fill_token         TEXT NOT NULL UNIQUE,
  result_token       TEXT NOT NULL UNIQUE,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS questions (
  id          TEXT PRIMARY KEY,
  survey_id   TEXT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('short', 'textarea', 'radio', 'checkbox', 'timeslots', 'timetable')),
  label       TEXT NOT NULL,
  required    INTEGER NOT NULL DEFAULT 0,
  placeholder TEXT NOT NULL DEFAULT '',
  help        TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_questions_survey ON questions(survey_id, sort_order);

CREATE TABLE IF NOT EXISTS question_options (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_options_question ON question_options(question_id, sort_order);

CREATE TABLE IF NOT EXISTS submissions (
  id                     TEXT PRIMARY KEY,
  survey_id              TEXT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  respondent_name        TEXT NOT NULL,
  respondent_token_hash  TEXT NOT NULL,
  status                 TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'edited')),
  submitted_at           TEXT NOT NULL,
  updated_at             TEXT NOT NULL,
  UNIQUE (survey_id, respondent_token_hash)
);
CREATE INDEX IF NOT EXISTS idx_submissions_survey ON submissions(survey_id, submitted_at);

CREATE TABLE IF NOT EXISTS answers (
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  question_id   TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  value_json    TEXT NOT NULL,
  PRIMARY KEY (submission_id, question_id)
);

CREATE TABLE IF NOT EXISTS edit_requests (
  id            TEXT PRIMARY KEY,
  survey_id     TEXT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  summary       TEXT NOT NULL,
  reason        TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at   TEXT,
  used_at       TEXT,
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_requests_survey ON edit_requests(survey_id, status);

CREATE TABLE IF NOT EXISTS timetable_imports (
  id                    TEXT PRIMARY KEY,
  survey_id             TEXT REFERENCES surveys(id) ON DELETE SET NULL,
  respondent_token_hash TEXT NOT NULL DEFAULT '',
  submission_id         TEXT REFERENCES submissions(id) ON DELETE SET NULL,
  question_id           TEXT REFERENCES questions(id) ON DELETE SET NULL,
  provider              TEXT NOT NULL,
  original_name         TEXT NOT NULL DEFAULT '',
  file_path             TEXT NOT NULL,
  mime_type             TEXT NOT NULL,
  confidence            REAL,
  raw_json              TEXT NOT NULL DEFAULT '{}',
  courses_json          TEXT NOT NULL DEFAULT '[]',
  text_result           TEXT NOT NULL DEFAULT '',
  created_at            TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_imports_rid ON timetable_imports(respondent_token_hash);

CREATE TABLE IF NOT EXISTS audit_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  survey_id   TEXT REFERENCES surveys(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_survey ON audit_logs(survey_id, created_at);
