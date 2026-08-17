import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TruyCapService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * API Ping: Ghi nhận hoặc cập nhật phiên truy cập
   */
  async pingSession(sessionId: string) {
    if (!sessionId || typeof sessionId !== 'string' || sessionId.length < 5 || sessionId.length > 100) {
      return { thanh_cong: false, thong_bao: 'Session ID không hợp lệ' };
    }

    const trimmedSessionId = sessionId.trim();
    const now = new Date();

    const existingSession = await this.prisma.luot_truy_cap.findFirst({
      where: { session_id: trimmedSessionId },
    });

    if (existingSession) {
      await this.prisma.luot_truy_cap.update({
        where: { id: existingSession.id },
        data: { lan_cuoi_hoat_dong: now },
      });
    } else {
      try {
        await this.prisma.luot_truy_cap.create({
          data: {
            session_id: trimmedSessionId,
            lan_cuoi_hoat_dong: now,
            ngay_tao: now,
          },
        });
      } catch (err) {
        // Nếu bị trùng session_id do request đồng thời, thực hiện update
        const existing = await this.prisma.luot_truy_cap.findFirst({
          where: { session_id: trimmedSessionId },
        });
        if (existing) {
          await this.prisma.luot_truy_cap.update({
            where: { id: existing.id },
            data: { lan_cuoi_hoat_dong: now },
          });
        }
      }
    }

    return { thanh_cong: true, thong_bao: 'Ghi nhận truy cập thành công' };
  }

  /**
   * API Thống kê: Trả về 4 chỉ số truy cập theo Timezone Việt Nam (Asia/Ho_Chi_Minh)
   */
  async layThongKeTruyCap() {
    const now = new Date();

    // 1. Đang online: Số session có hoạt động trong 5 phút qua
    const onlineThreshold = new Date(now.getTime() - 5 * 60 * 1000);

    // 2. Mốc thời gian theo Timezone Việt Nam (UTC+7)
    // Chuyển đổi giờ hiện tại sang múi giờ Việt Nam
    const nowVNString = now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
    const nowVN = new Date(nowVNString);

    // Mốc 00:00:00 hôm nay Việt Nam
    const startOfTodayVN = new Date(nowVN.getFullYear(), nowVN.getMonth(), nowVN.getDate(), 0, 0, 0, 0);

    // Mốc 00:00:00 Thứ 2 tuần này Việt Nam (0: Chủ Nhật, 1: Thứ 2, ...)
    const dayOfWeek = nowVN.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeekVN = new Date(nowVN.getFullYear(), nowVN.getMonth(), nowVN.getDate() - diffToMonday, 0, 0, 0, 0);

    // Chuyển đổi mốc Việt Nam thành Date UTC để query PostgreSQL
    const utcOffset = 7 * 60 * 60 * 1000;
    const startOfTodayUTC = new Date(Date.UTC(startOfTodayVN.getFullYear(), startOfTodayVN.getMonth(), startOfTodayVN.getDate(), 0, 0, 0, 0) - utcOffset);
    const startOfWeekUTC = new Date(Date.UTC(startOfWeekVN.getFullYear(), startOfWeekVN.getMonth(), startOfWeekVN.getDate(), 0, 0, 0, 0) - utcOffset);

    // Query các chỉ số từ PostgreSQL
    const [dangOnline, homNay, trongTuan, tatCa] = await Promise.all([
      this.prisma.luot_truy_cap.count({
        where: {
          lan_cuoi_hoat_dong: { gte: onlineThreshold },
        },
      }),
      this.prisma.luot_truy_cap.count({
        where: {
          ngay_tao: { gte: startOfTodayUTC },
        },
      }),
      this.prisma.luot_truy_cap.count({
        where: {
          ngay_tao: { gte: startOfWeekUTC },
        },
      }),
      this.prisma.luot_truy_cap.count(),
    ]);

    return {
      thanh_cong: true,
      du_lieu: {
        dang_online: dangOnline,
        hom_nay: homNay,
        trong_tuan: trongTuan,
        tat_ca: tatCa,
      },
    };
  }
}
