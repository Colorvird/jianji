'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.resolve(process.env.JIANJI_DATA_DIR || path.join(__dirname, '..', 'data'));
const DB_PATH = path.join(DATA_DIR, 'jianji.db');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function openDatabase() {
  return new DatabaseSync(DB_PATH);
}

function archiveLegacyDatabase(database) {
  const table = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'surveys'").get();
  if (!table) return false;
  const columns = database.prepare('PRAGMA table_info(surveys)').all().map((column) => column.name);
  if (columns.includes('admin_token_hash')) return false;
  database.close();
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  for (const suffix of ['', '-shm', '-wal']) {
    const source = `${DB_PATH}${suffix}`;
    if (fs.existsSync(source)) fs.renameSync(source, `${DB_PATH}.legacy-${stamp}${suffix}`);
  }
  return true;
}

let db = openDatabase();
archiveLegacyDatabase(db);
db = openDatabase();
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA synchronous = NORMAL;
  PRAGMA busy_timeout = 5000;
`);

const schemaPath = path.join(__dirname, '..', 'schema.sql');
db.exec(fs.readFileSync(schemaPath, 'utf8'));

function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all().map((item) => item.name);
  if (!columns.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

ensureColumn('surveys', 'timetable_mode', "TEXT NOT NULL DEFAULT 'period'");
ensureColumn('surveys', 'period_times_json', "TEXT NOT NULL DEFAULT '[]'");

function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(6).toString('hex')}`;
}

let transactionDepth = 0;

function tx(fn) {
  if (transactionDepth > 0) return fn();
  db.exec('BEGIN IMMEDIATE');
  transactionDepth += 1;
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    try {
      db.exec('ROLLBACK');
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }
    throw error;
  } finally {
    transactionDepth -= 1;
  }
}

module.exports = {
  db,
  uid,
  tx,
  DATA_DIR,
  DB_PATH,
  UPLOAD_DIR
};
