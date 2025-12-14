import crypto from 'crypto';
import db, { hashPassword, toUsage, getUserById, getUserByUsername, getUserByPhone, UserRecord } from './db.js';

const REQUIRED_CREATE_FIELDS = ['username', 'password', 'email'] as const;

function assertString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${field} 不能为空`);
  }
}

function sanitizeUser(user: UserRecord) {
  const { password, ...safe } = user;
  return safe;
}

// ========== 1. 创建用户 ==========
export function createUser(params: any) {
  for (const field of REQUIRED_CREATE_FIELDS) {
    assertString(params?.[field], field);
  }

  const username = params.username.trim();
  const password = params.password.trim();
  const email = params.email.trim();
  const phone = params.phone?.toString()?.trim() || null;
  const agentId = params.agent_id?.toString()?.trim() || null;
  const tier = params.tier?.toString()?.trim() || 'level1';

  // 唯一性校验
  if (getUserByUsername(username)) {
    throw new Error('用户名已存在');
  }
  if (email && db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
    throw new Error('邮箱已存在');
  }
  if (phone && db.prepare('SELECT 1 FROM users WHERE phone = ?').get(phone)) {
    throw new Error('手机号已存在');
  }

  const now = new Date().toISOString();
  const hashed = hashPassword(password);
  const id = crypto.randomUUID();
  const apiToken = `token-${username}-${crypto.randomUUID().slice(0, 8)}`;

  db.prepare(
    `INSERT INTO users (id, agent_id, phone, name, username, password, email, tier, status, balance, plan_type, is_test, usage_limit, usage_used, valid_from, valid_to, api_token, created_at)
     VALUES (@id, @agent_id, @phone, @name, @username, @password, @email, @tier, 'active', @balance, @plan_type, @is_test, @usage_limit, 0, @valid_from, @valid_to, @api_token, @created_at)`
  ).run({
    id,
    agent_id: agentId,
    phone,
    name: username,
    username,
    password: hashed,
    email,
    tier,
    balance: 0,
    plan_type: tier,
    is_test: 0,
    usage_limit: 0,  // 默认 0，由 Admin 后端设置
    valid_from: now,
    valid_to: null,
    api_token: apiToken,
    created_at: now,
  });

  const created = getUserById(id);
  return created ? sanitizeUser(created) : undefined;
}

// ========== 2. 管理配额 ==========
export function manageQuota(params: any) {
  assertString(params?.user_id, 'user_id');
  const type = params?.type;
  const amount = Number(params?.amount);

  if (!Number.isFinite(amount) || amount === 0) {
    throw new Error('amount 必须为非零数字');
  }
  if (type !== 'balance' && type !== 'calls') {
    throw new Error('type 必须为 balance 或 calls');
  }

  const tx = db.transaction((userId: string, delta: number) => {
    const user = getUserById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }
    if (type === 'balance') {
      const newBalance = Math.max(0, (user.balance || 0) + delta);
      db.prepare('UPDATE users SET balance = ? WHERE id = ?').run(newBalance, userId);
      return { ...user, balance: newBalance } as UserRecord;
    }
    // type === 'calls'
    const baseLimit = user.usage_limit ?? 0;
    const newLimitRaw = baseLimit + delta;
    const newLimit = Math.max(user.usage_used ?? 0, newLimitRaw);
    db.prepare('UPDATE users SET usage_limit = ? WHERE id = ?').run(newLimit, userId);
    return { ...user, usage_limit: newLimit } as UserRecord;
  });

  const updated = tx(params.user_id, amount);
  return sanitizeUser(updated);
}

// ========== 3. 更新状态 ==========
export function updateStatus(params: any) {
  assertString(params?.user_id, 'user_id');
  assertString(params?.status, 'status');
  const allowed = ['active', 'banned', 'deleted'];
  if (!allowed.includes(params.status)) {
    throw new Error('status 非法，允许值：active/banned/deleted');
  }
  const user = getUserById(params.user_id);
  if (!user) throw new Error('用户不存在');
  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(params.status, params.user_id);
  const updated = getUserById(params.user_id);
  return updated ? sanitizeUser(updated) : undefined;
}

// ========== 4. 重置密码 ==========
export function resetPassword(params: any) {
  assertString(params?.user_id, 'user_id');
  assertString(params?.new_password, 'new_password');
  const user = getUserById(params.user_id);
  if (!user) throw new Error('用户不存在');
  const hashed = hashPassword(params.new_password.trim());
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, params.user_id);
  return { success: true };
}

// ========== 5. 查询用户信息 ==========
export function getUserInfo(params: any) {
  const userId = params?.user_id?.toString?.();
  const phone = params?.phone?.toString?.();
  let user: UserRecord | undefined;
  if (userId) {
    user = getUserById(userId);
  } else if (phone) {
    user = getUserByPhone(phone);
  } else {
    throw new Error('需要 user_id 或 phone');
  }
  if (!user) throw new Error('用户不存在');
  const usage = toUsage(user);
  return {
    ...sanitizeUser(user),
    remaining_calls: usage.remaining,
    balance: user.balance ?? 0,
  };
}

// ========== 6. 列出用户 ==========
export function listUsers(params: any) {
  const limit = Number(params?.limit) || 50;
  const offset = Number(params?.offset) || 0;
  const users = db.prepare(`
    SELECT * FROM users 
    WHERE status != 'deleted'
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset) as UserRecord[];
  
  return users.map(user => {
    const usage = toUsage(user);
    return {
      ...sanitizeUser(user),
      remaining_calls: usage.remaining,
      balance: user.balance ?? 0,
    };
  });
}

