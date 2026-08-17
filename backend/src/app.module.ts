import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { KiemTraModule } from './modules/kiem-tra/kiem-tra.module';
import { XacThucModule } from './modules/xac-thuc/xac-thuc.module';
import { NguoiDungModule } from './modules/nguoi-dung/nguoi-dung.module';
import { BaiVietModule } from './modules/bai-viet/bai-viet.module';
import { DanhMucModule } from './modules/danh-muc/danh-muc.module';
import { TheModule } from './modules/the/the.module';
import { TepTinModule } from './modules/tep-tin/tep-tin.module';
import { ThongBaoModule } from './modules/thong-bao/thong-bao.module';
import { VanBanModule } from './modules/van-ban/van-ban.module';
import { LoaiVanBanModule } from './modules/loai-van-ban/loai-van-ban.module';
import { GiaoVienModule } from './modules/giao-vien/giao-vien.module';
import { ToChuyenMonModule } from './modules/to-chuyen-mon/to-chuyen-mon.module';
import { LopHocModule } from './modules/lop-hoc/lop-hoc.module';
import { HocSinhModule } from './modules/hoc-sinh/hoc-sinh.module';
import { PhuHuynhModule } from './modules/phu-huynh/phu-huynh.module';
import { VideoModule } from './modules/video/video.module';
import { AlbumModule } from './modules/album/album.module';
import { ThuVienSoModule } from './modules/thu-vien-so/thu-vien-so.module';
import { TruyCapModule } from './modules/truy-cap/truy-cap.module';
import { LienHeModule } from './modules/lien-he/lien-he.module';
import { GioiThieuModule } from './modules/gioi-thieu/gioi-thieu.module';
import { PhanQuyenModule } from './modules/phan-quyen/phan-quyen.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    KiemTraModule,
    XacThucModule,
    NguoiDungModule,
    BaiVietModule,
    DanhMucModule,
    TheModule,
    TepTinModule,
    ThongBaoModule,
    VanBanModule,
    LoaiVanBanModule,
    GiaoVienModule,
    ToChuyenMonModule,
    LopHocModule,
    HocSinhModule,
    PhuHuynhModule,
    VideoModule,
    AlbumModule,
    ThuVienSoModule,
    TruyCapModule,
    LienHeModule,
    GioiThieuModule,
    PhanQuyenModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
