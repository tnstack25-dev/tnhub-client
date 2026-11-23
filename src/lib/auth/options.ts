import { getServerEnv } from "@/lib/env/server";
import "server-only";

import { randomUUID } from "node:crypto";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

import { ApiError } from "@/lib/axios/error";
import { getBackendProfile, loginBackend, logoutBackend, type BackendTokens } from "./backend";
import { googleTicketCookie } from "./google-ticket";
import { endSession } from "./session";
import { consumeGoogleTicket, createSession, readSession } from "./session-store";

const credentialsSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(72),
});

async function createAuthUser(tokens: BackendTokens) {
  try {
    const profile = await getBackendProfile(tokens.accessToken);
    const sessionId = randomUUID();
    await createSession(sessionId, tokens);
    return {
      id: profile.id,
      name: profile.fullName,
      email: profile.email,
      image: profile.avatarUrl,
      backendSessionId: sessionId,
    };
  } catch {
    await logoutBackend(tokens.accessToken).catch(() => {
      console.error("Unable to revoke incomplete backend login");
    });
    throw new Error("AuthUnavailable");
  }
}

export const authOptions: NextAuthOptions = {
  secret: getServerEnv().NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials, request) {
        const input = credentialsSchema.safeParse(credentials);
        if (!input.success) return null;

        let tokens;
        try {
          tokens = await loginBackend(input.data, request.headers?.["user-agent"]);
        } catch (error) {
          if (error instanceof ApiError) {
            if (error.status === 429) throw new Error("RateLimited");
            if ([400, 401, 403].includes(error.status)) return null;
          }
          throw new Error("AuthUnavailable");
        }

        return createAuthUser(tokens);
      },
    }),
    CredentialsProvider({
      id: "google-bridge",
      name: "Google",
      credentials: {},
      async authorize(_, request) {
        const prefix = googleTicketCookie + "=";
        const cookie: unknown = request.headers?.cookie;
        const id = typeof cookie === "string"
          ? cookie.split(";").map((entry) => entry.trim()).find((entry) => entry.startsWith(prefix))?.slice(prefix.length)
          : undefined;
        const ticket = z.uuid().safeParse(id);
        if (!ticket.success) return null;
        try {
          const tokens = await consumeGoogleTicket(ticket.data);
          return tokens ? await createAuthUser(tokens) : null;
        } catch {
          throw new Error("AuthUnavailable");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.backendSessionId = user.backendSessionId;
      return token;
    },
    async session({ session, token }) {
      session.user = token.sub && token.backendSessionId && await readSession(token.backendSessionId)
        ? { ...session.user, id: token.sub }
        : undefined;
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.backendSessionId) {
        await endSession(token.backendSessionId).catch(() => {
          console.error("Unable to complete backend sign-out");
        });
      }
    },
  },
};
