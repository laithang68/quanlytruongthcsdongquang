export interface UserAuthContext {
  id?: string;
  ho_ten?: string;
  email?: string;
  vai_tro?: string[];
  quyen_han?: string[];
}

export function isSuperAdmin(user?: UserAuthContext | null): boolean {
  if (!user || !user.vai_tro) return false;
  return user.vai_tro.includes('SUPER_ADMIN');
}

export function isSystemAdmin(user?: UserAuthContext | null): boolean {
  if (!user || !user.vai_tro) return false;
  return user.vai_tro.includes('SUPER_ADMIN') || user.vai_tro.includes('QUAN_TRI_VIEN');
}

export function hasPermission(user: UserAuthContext | null | undefined, permCode: string): boolean {
  if (!user) return false;
  if (isSystemAdmin(user)) return true;
  if (!permCode) return true;
  if (!user.quyen_han) return false;
  return user.quyen_han.includes(permCode);
}

export function hasAnyPermission(user: UserAuthContext | null | undefined, permCodes: string[]): boolean {
  if (!user) return false;
  if (isSystemAdmin(user)) return true;
  if (!permCodes || permCodes.length === 0) return true;
  if (!user.quyen_han) return false;
  return permCodes.some((code) => user.quyen_han?.includes(code));
}

export type ActionType = 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'PUBLISH' | 'UPLOAD' | 'EXPORT';

export const ACTION_CODE_MAPPING: Record<ActionType, string> = {
  VIEW: 'xem',
  CREATE: 'tao',
  UPDATE: 'sua',
  DELETE: 'xoa',
  APPROVE: 'duyet',
  PUBLISH: 'xuat_ban',
  UPLOAD: 'upload',
  EXPORT: 'xuat_excel',
};

export function hasModuleAction(
  user: UserAuthContext | null | undefined,
  moduleCode: string,
  action: ActionType,
): boolean {
  if (!user) return false;
  if (isSystemAdmin(user)) return true;
  const suffix = ACTION_CODE_MAPPING[action];
  if (!suffix) return false;
  const permCode = `${moduleCode}_${suffix}`;
  return hasPermission(user, permCode);
}
