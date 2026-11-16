import "server-only";

import { createClient } from "redis";

import type { BackendTokens } from "./backend";
import { googleTicketTtl } from "./google-ticket";

type SessionOperation = "acquired" | "busy" | "missing";

let connection: ReturnType<typeof connect> | undefined;

async function connect() {
  const url = process.env.AUTH_REDIS_URL;
  if (!url) throw new Error("AUTH_REDIS_URL is required");
  const client = createClient({
    url,
    disableOfflineQueue: true,
    socket: { connectTimeout: 3000, reconnectStrategy: false },
  });
  client.on("error", () => {
    connection = undefined;
  });
  return client.connect();
}

async function redis() {
  connection ??= connect().catch((error) => {
    connection = undefined;
    throw error;
  });
  return (await connection).withAbortSignal(AbortSignal.timeout(3000));
}

function keys(sessionId: string) {
  const key = "tnhub:auth:{" + sessionId + "}";
  return [key, key + ":operation"];
}

export async function readSession(sessionId: string): Promise<BackendTokens | null> {
  const [key] = keys(sessionId);
  const value = await (await redis()).get(key);
  return value ? JSON.parse(value) as BackendTokens : null;
}

export async function createSession(sessionId: string, tokens: BackendTokens) {
  const [key] = keys(sessionId);
  await (await redis()).set(key, JSON.stringify(tokens), { PXAT: tokens.refreshExpiresAt });
}

export async function removeSession(sessionId: string) {
  await (await redis()).del(keys(sessionId));
}

export async function storeGoogleTicket(id: string, tokens: BackendTokens) {
  await (await redis()).set("tnhub:auth:google:" + id, JSON.stringify(tokens), { EX: googleTicketTtl });
}

export async function consumeGoogleTicket(id: string): Promise<BackendTokens | null> {
  const value = await (await redis()).getDel("tnhub:auth:google:" + id);
  return value ? JSON.parse(value) as BackendTokens : null;
}

// An abandoned operation may have consumed the refresh token. Expire the
// session instead of allowing another worker to send that same token.
const begin = `
  local ttl = redis.call('PTTL', KEYS[1])
  if ttl <= 0 then return 'missing' end
  local deadline = redis.call('HGET', KEYS[2], 'deadline')
  local time = redis.call('TIME')
  local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
  if deadline then
    if tonumber(deadline) > now then return 'busy' end
    redis.call('DEL', KEYS[1], KEYS[2])
    return 'missing'
  end
  redis.call('HSET', KEYS[2], 'owner', ARGV[1], 'deadline', now + 35000)
  redis.call('PEXPIRE', KEYS[2], ttl)
  return 'acquired'
`;

const finish = `
  if redis.call('HGET', KEYS[2], 'owner') ~= ARGV[1] then return 0 end
  if ARGV[2] == '' then
    redis.call('DEL', KEYS[1])
  else
    local result = redis.call('SET', KEYS[1], ARGV[2], 'PXAT', ARGV[3], 'XX')
    if not result then
      redis.call('DEL', KEYS[2])
      return 0
    end
  end
  redis.call('DEL', KEYS[2])
  return 1
`;

export async function beginSessionOperation(sessionId: string, owner: string) {
  return await (await redis()).eval(begin, {
    keys: keys(sessionId),
    arguments: [owner],
  }) as SessionOperation;
}

export async function finishSessionOperation(
  sessionId: string,
  owner: string,
  tokens: BackendTokens | null,
) {
  return await (await redis()).eval(finish, {
    keys: keys(sessionId),
    arguments: [owner, tokens ? JSON.stringify(tokens) : "", String(tokens?.refreshExpiresAt ?? 0)],
  }) === 1;
}
