export interface JwtPayload {
  sub: string; // nguoi_dung_id
  email: string;
  type?: 'access' | 'refresh';
  jti?: string; // Token Unique ID
}
