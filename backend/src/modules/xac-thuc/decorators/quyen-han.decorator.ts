import { SetMetadata } from '@nestjs/common';

export const QUYEN_HAN_KEY = 'quyen_han';
export const QuyenHan = (...quyenHan: string[]) => SetMetadata(QUYEN_HAN_KEY, quyenHan);
