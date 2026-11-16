import "server-only";

import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

import { ApiError } from "@/lib/axios/error";
import { logoutBackend, refreshBackend, type BackendTokens } from "./backend";
import { beginSessionOperation, finishSessionOperation, readSession } from "./session-store";

async function acquireSession(sessionId: string, owner: string) {
  const waitUntil = Date.now() + 16_000;
  while (Date.now() < waitUntil) {
    const state = await beginSessionOperation(sessionId, owner);
    if (state !== "busy") return state;
    await delay(200);
  }
  throw new ApiError("Phiên đang được cập nhật. Vui lòng thử lại.", 503);
}

async function rotate(tokens: BackendTokens) {
  try {
    return await refreshBackend(tokens);
  } catch (error) {
    if (error instanceof ApiError && [401, 403].includes(error.status)) return null;
    // A failed response can leave the old refresh token consumed.
    throw new ApiError("Không thể gia hạn phiên. Vui lòng đăng nhập lại.", 401);
  }
}

export async function getValidAccessToken(sessionId: string) {
  const current = await readSession(sessionId);
  if (!current) return null;
  if (current.refreshAfter > Date.now()) return current.accessToken;

  const owner = randomUUID();
  if (await acquireSession(sessionId, owner) === "missing") return null;

  let next: BackendTokens | null = null;
  let committed: boolean;
  try {
    const latest = await readSession(sessionId);
    if (latest) {
      next = latest.refreshAfter > Date.now()
        ? latest
        : await rotate(latest);
    }
  } finally {
    committed = await finishSessionOperation(sessionId, owner, next);
  }
  return committed ? next?.accessToken ?? null : null;
}

export async function endSession(sessionId: string) {
  const owner = randomUUID();
  if (await acquireSession(sessionId, owner) === "missing") return;

  try {
    const current = await readSession(sessionId);
    if (!current) return;
    const active = current.refreshAfter > Date.now()
      ? current
      : await rotate(current);
    if (active) await logoutBackend(active.accessToken);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return;
    throw new ApiError("Không xác nhận được đăng xuất ở máy chủ.", 502, "LOGOUT_UNCONFIRMED");
  } finally {
    await finishSessionOperation(sessionId, owner, null);
  }
}
