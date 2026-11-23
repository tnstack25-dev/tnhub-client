import { getServerEnv } from "@/lib/env/server";
import "server-only";

import { createServerApi } from "@/lib/axios/server";

import type { BackendTokens } from "./backend";

type SessionOperation = "acquired" | "busy" | "missing";

function internalApi() {
  const secret = getServerEnv().AUTH_INTERNAL_SECRET;
  if (!secret) throw new Error("AUTH_INTERNAL_SECRET is required");

  const api = createServerApi(secret);
  api.defaults.timeout = 7000;
  return api;
}

function sessionPath(id: string) {
  return "/internal/auth/sessions/" + encodeURIComponent(id);
}

function googleTicketPath(id: string) {
  return "/internal/auth/google-tickets/" + encodeURIComponent(id);
}

export async function readSession(sessionId: string) {
  const response = await internalApi().get<{ data: BackendTokens | null }>(sessionPath(sessionId));
  return response.data.data;
}

export async function createSession(sessionId: string, tokens: BackendTokens) {
  await internalApi().put(sessionPath(sessionId), tokens);
}

export async function removeSession(sessionId: string) {
  await internalApi().delete(sessionPath(sessionId));
}

export async function storeGoogleTicket(id: string, tokens: BackendTokens) {
  await internalApi().put(googleTicketPath(id), tokens);
}

export async function consumeGoogleTicket(id: string) {
  const response = await internalApi().post<{ data: BackendTokens | null }>(googleTicketPath(id) + "/consume");
  return response.data.data;
}

export async function beginSessionOperation(sessionId: string, owner: string) {
  const response = await internalApi().post<{ data: SessionOperation }>(
    sessionPath(sessionId) + "/operations/begin", { owner },
  );
  return response.data.data;
}

export async function finishSessionOperation(
  sessionId: string,
  owner: string,
  tokens: BackendTokens | null,
) {
  const response = await internalApi().post<{ data: boolean }>(
    sessionPath(sessionId) + "/operations/finish", { owner, tokens },
  );
  return response.data.data;
}
