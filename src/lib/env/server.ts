import "server-only";
import { parseServerEnv } from "./schema";

// Validate on use, allowing CLI tooling to load configuration without live services.
export function getServerEnv() {
  return parseServerEnv(process.env);
}
