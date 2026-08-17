import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { QUYEN_HAN_KEY } from '../decorators/quyen-han.decorator';

@Injectable()
export class QuyenHanGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const meYeuCauQuyen = this.reflector.getAllAndOverride<string[]>(QUYEN_HAN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!meYeuCauQuyen || meYeuCauQuyen.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.quyen_han) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này.');
    }

    // SUPER_ADMIN và QUAN_TRI_VIEN có toàn quyền
    if (user.vai_tro && (user.vai_tro.includes('SUPER_ADMIN') || user.vai_tro.includes('QUAN_TRI_VIEN'))) {
      return true;
    }

    const hasPermission = meYeuCauQuyen.some((quyen) => user.quyen_han.includes(quyen));
    if (!hasPermission) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này.');
    }

    return true;
  }
}
