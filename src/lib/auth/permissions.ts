import type { AuthProfile } from "./contracts";

export function allowed(profile: AuthProfile | undefined, permission: string) {
  return Boolean(
    profile?.roles.includes("super_admin") || profile?.permissions.includes(permission),
  );
}

export function canReadServices(profile?: AuthProfile) {
  return allowed(profile, "services.read");
}
