import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";

export interface UserRecord {
  id: string;
  agent_id?: string | null;
  phone?: string | null;
  username: string;
  password: string;
  email: string;
  tier?: string | null;
  status?: string;
  balance?: number;
  plan_type: string;
  is_test: number;
  usage_limit: number;
  usage_used: number;
  valid_from?: string;
  valid_to?: string;
  api_token: string;
  name?: string;
  created_at?: string | null;
}

const dbPath =
  process.env.DB_PATH ||
  path.join(process.cwd(), "backend", "data", "ai-tarot.db");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  agent_id TEXT,
  phone TEXT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email TEXT UNIQUE,
  tier TEXT DEFAULT 'level1',
  status TEXT DEFAULT 'active',
  balance INTEGER DEFAULT 0,
  plan_type TEXT DEFAULT 'test',
  is_test INTEGER DEFAULT 1,
  usage_limit INTEGER DEFAULT 50,
  usage_used INTEGER DEFAULT 0,
  valid_from TEXT,
  valid_to TEXT,
  api_token TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TEXT
);
`);

// 添加缺失的列
const columns = db.prepare("PRAGMA table_info(users)").all().map((c: any) => c.name);

function addColumnIfMissing(colName: string, colDef: string) {
  if (!columns.includes(colName)) {
    try {
      db.exec(`ALTER TABLE users ADD COLUMN ${colDef}`);
      console.log(`✅ Added column: ${colName}`);
    } catch (err: any) {
      console.error(`Failed to add column ${colName}:`, err.message);
    }
  }
}

addColumnIfMissing('agent_id', 'agent_id TEXT');
addColumnIfMissing('phone', 'phone TEXT');
addColumnIfMissing('tier', "tier TEXT DEFAULT 'level1'");
addColumnIfMissing('status', "status TEXT DEFAULT 'active'");
addColumnIfMissing('balance', 'balance INTEGER DEFAULT 0');
addColumnIfMissing('created_at', 'created_at TEXT');

export const getUserByUsername = (username: string): UserRecord | undefined => {
  const row = db
    .prepare("SELECT * FROM users WHERE username = ? LIMIT 1")
    .get(username);
  return row as UserRecord | undefined;
};

export const getUserByToken = (token: string): UserRecord | undefined => {
  const row = db
    .prepare("SELECT * FROM users WHERE api_token = ? LIMIT 1")
    .get(token);
  return row as UserRecord | undefined;
};

export const getUserById = (userId: string): UserRecord | undefined => {
  const row = db
    .prepare("SELECT * FROM users WHERE id = ? LIMIT 1")
    .get(userId);
  return row as UserRecord | undefined;
};

export const getUserByPhone = (phone: string): UserRecord | undefined => {
  const row = db
    .prepare("SELECT * FROM users WHERE phone = ? LIMIT 1")
    .get(phone);
  return row as UserRecord | undefined;
};

export const hashPassword = (password: string): string => {
  return createHash('sha256').update(password).digest('hex');
};

export const toUsage = (user: UserRecord) => {
  return {
    limit: user.usage_limit,
    used: user.usage_used,
    remaining: computeRemaining(user)
  };
};

export const insertUser = (user: Omit<UserRecord, "id" | "api_token">) => {
  const id = randomUUID();
  const api_token = `token-${user.username}-${id.slice(0, 8)}`;
  db.prepare(
    `INSERT INTO users (id, username, password, email, plan_type, is_test, usage_limit, usage_used, valid_from, valid_to, api_token, name)
     VALUES (@id, @username, @password, @email, @plan_type, @is_test, @usage_limit, @usage_used, @valid_from, @valid_to, @api_token, @name)`
  ).run({ ...user, id, api_token });

  return getUserByUsername(user.username);
};

export const computeRemaining = (user: UserRecord): number =>
  Math.max(0, (user.usage_limit ?? 0) - (user.usage_used ?? 0));

export const incrementUsage = (token: string, step = 1) => {
  db.prepare(
    "UPDATE users SET usage_used = usage_used + ? WHERE api_token = ?"
  ).run(step, token);
};

export const resetUsage = (token: string) => {
  db.prepare("UPDATE users SET usage_used = 0 WHERE api_token = ?").run(token);
};

const seedUsers = () => {
  const count = db.prepare("SELECT COUNT(*) as c FROM users").get() as {
    c: number;
  };
  if (count.c > 0) return;

  const now = new Date();
  const validFrom = now.toISOString();
  const validTo = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  insertUser({
    username: "test",
    password: "test123",
    email: "test@example.com",
    plan_type: "test",
    is_test: 1,
    usage_limit: 50,
    usage_used: 0,
    valid_from: validFrom,
    valid_to: validTo,
    name: "Tarot Tester",
  });

  insertUser({
    username: "pro",
    password: "pro123",
    email: "pro@example.com",
    plan_type: "monthly",
    is_test: 0,
    usage_limit: 200,
    usage_used: 0,
    valid_from: validFrom,
    valid_to: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    name: "Tarot Pro",
  });
};

seedUsers();

export default db;

