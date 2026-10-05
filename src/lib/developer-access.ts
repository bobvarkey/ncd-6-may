/**
 * Developer Access Control
 * This list contains UUIDs allowed to access developer-only tools,
 * bypass certain paywalls during testing, or access debug panels.
 */

export const DEVELOPER_ALLOWLIST = [
  "5ebbd491-44d9-4836-9c13-be922c1ffbfc", // Developer id for NCD app
] as const;

export const isDeveloper = (userId: string | null): boolean => {
  if (!userId) return false;
  return DEVELOPER_ALLOWLIST.includes(userId as any);
};
