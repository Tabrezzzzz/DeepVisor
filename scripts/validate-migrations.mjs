import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');
const MIGRATION_NAME_PATTERN = /^(\d{14})_[a-z0-9_]+\.sql$/;
const CONFLICT_MARKER_PATTERN = /^(<<<<<<<|=======|>>>>>>>) /m;

function fail(message) {
  console.error(`[migrations:check] ${message}`);
  process.exitCode = 1;
}

function stripSqlComments(sql) {
  return sql
    .split(/\r?\n/)
    .map((line) => line.replace(/--.*$/, '').trim())
    .filter(Boolean)
    .join('\n');
}

if (!fs.existsSync(MIGRATIONS_DIR)) {
  fail(`Missing migrations directory: ${MIGRATIONS_DIR}`);
  process.exit();
}

const files = fs
  .readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .sort();

if (files.length === 0) {
  fail('No migration files found.');
  process.exit();
}

const seenVersions = new Map();
let previousVersion = '';

for (const file of files) {
  const match = MIGRATION_NAME_PATTERN.exec(file);
  if (!match) {
    fail(`Invalid migration filename "${file}". Expected YYYYMMDDHHMMSS_slug.sql.`);
    continue;
  }

  const version = match[1];
  if (seenVersions.has(version)) {
    fail(`Duplicate migration version ${version}: ${seenVersions.get(version)} and ${file}.`);
  }
  seenVersions.set(version, file);

  if (previousVersion && version < previousVersion) {
    fail(`Migration ${file} is out of timestamp order after ${seenVersions.get(previousVersion)}.`);
  }
  previousVersion = version;

  const fullPath = path.join(MIGRATIONS_DIR, file);
  const sql = fs.readFileSync(fullPath, 'utf8');
  const trimmed = sql.trim();

  if (!trimmed) {
    fail(`Migration ${file} is empty.`);
    continue;
  }

  if (CONFLICT_MARKER_PATTERN.test(sql)) {
    fail(`Migration ${file} contains unresolved conflict markers.`);
  }

  const executableSql = stripSqlComments(trimmed);
  if (!executableSql.endsWith(';')) {
    fail(`Migration ${file} does not end with a SQL statement terminator.`);
  }
}

if (process.exitCode) {
  process.exit();
}

console.log(`[migrations:check] ${files.length} migrations passed validation.`);
