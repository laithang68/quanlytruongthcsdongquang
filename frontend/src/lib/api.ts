/**
 * API Config & Utility Client cho Cổng thông tin THCS Đông Quang
 * Tự động cấu hình theo biến môi trường NEXT_PUBLIC_API_URL
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Ghép đường dẫn API hoàn chỉnh từ path
 * @example getApiUrl('/api/v1/bai-viet/cong-khai') => 'http://localhost:3001/api/v1/bai-viet/cong-khai'
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

/**
 * Ghép đường dẫn media/tệp đính kèm/ảnh đại diện
 * @example getMediaUrl('/uploads/image.jpg') => 'http://localhost:3001/uploads/image.jpg'
 */
export function getMediaUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL}${cleanUrl}`;
}
