import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

interface PhienToken {
  jti: string;
  userId: string;
  parentJti?: string;
  isRevoked: boolean;
  createdAt: Date;
}

@Injectable()
export class XacThucPhienService {
  // Quản lý các phiên Refresh Token và trạng thái thu hồi phía Server
  private phienTokens: Map<string, PhienToken> = new Map();
  // Theo dõi các gia đình token (Token Family) để phát hiện hành vi tái sử dụng
  private tokenFamilies: Map<string, Set<string>> = new Map();

  taoJti(): string {
    return randomUUID();
  }

  dangKyRefreshToken(jti: string, userId: string, parentJti?: string) {
    const phien: PhienToken = {
      jti,
      userId,
      parentJti,
      isRevoked: false,
      createdAt: new Date(),
    };

    this.phienTokens.set(jti, phien);

    if (!this.tokenFamilies.has(userId)) {
      this.tokenFamilies.set(userId, new Set());
    }
    this.tokenFamilies.get(userId)?.add(jti);
  }

  kiemTraHopLe(jti: string, userId: string): boolean {
    const phien = this.phienTokens.get(jti);
    if (!phien) {
      return false;
    }
    if (phien.userId !== userId) {
      return false;
    }
    return !phien.isRevoked;
  }

  laTokenDaBiSuDungLai(jti: string): boolean {
    const phien = this.phienTokens.get(jti);
    // Nếu token đã được ghi nhận nhưng bị revoked -> Phát hiện tái sử dụng!
    return !!phien && phien.isRevoked;
  }

  thuHoiRefreshToken(jti: string) {
    const phien = this.phienTokens.get(jti);
    if (phien) {
      phien.isRevoked = true;
    }
  }

  thuHoiToanBoPhienNguoiDung(userId: string) {
    const family = this.tokenFamilies.get(userId);
    if (family) {
      for (const jti of family) {
        const phien = this.phienTokens.get(jti);
        if (phien) {
          phien.isRevoked = true;
        }
      }
    }
  }
}
