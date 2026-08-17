import {
  Controller,
  Post,
  Get,
  Query,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { XacThucGuard } from '../xac-thuc/guards/xac-thuc.guard';
import { QuyenHanGuard } from '../xac-thuc/guards/quyen-han.guard';
import { QuyenHan } from '../xac-thuc/decorators/quyen-han.decorator';
import { NguoiDungHienTai } from '../xac-thuc/decorators/nguoi-dung-hien-tai.decorator';
import { PrismaService } from '../../database/prisma.service';

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

// Danh sách các đuôi file thực thi/nguy hiểm bị cấm tuyệt đối
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.php', '.js', '.py', '.ps1',
  '.msi', '.scr', '.com', '.vbs', '.jar', '.reg', '.wsf',
];

// Danh sách các đuôi file hợp lệ (PDF, Word, Excel, Image, Video)
const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv',
];

@Controller('tep-tin')
export class TepTinController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('tai-ve')
  async downloadFile(
    @Query('path') relativePath: string,
    @Query('ten_goc') originalName: string,
    @Res() res: Response,
  ) {
    if (!relativePath || !relativePath.startsWith('/uploads/')) {
      throw new BadRequestException('Đường dẫn tệp tin không hợp lệ.');
    }

    const fileName = relativePath.replace('/uploads/', '');
    const filePath = join(uploadDir, fileName);

    if (!existsSync(filePath)) {
      throw new NotFoundException('Tệp tin không tồn tại trên hệ thống.');
    }

    const saveName = originalName && originalName.trim() ? originalName.trim() : fileName;
    return res.download(filePath, saveName);
  }

  @Get('xem-pdf')
  async viewPdf(
    @Query('path') relativePath: string,
    @Res() res: Response,
  ) {
    if (!relativePath || !relativePath.startsWith('/uploads/')) {
      throw new BadRequestException('Đường dẫn tệp tin không hợp lệ.');
    }

    const fileName = relativePath.replace('/uploads/', '');
    const filePath = join(uploadDir, fileName);

    if (!existsSync(filePath)) {
      throw new NotFoundException('Tệp tin không tồn tại trên hệ thống.');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    return res.sendFile(filePath);
  }

  @Post('upload')
  @UseGuards(XacThucGuard, QuyenHanGuard)
  @QuyenHan(
    'bai_viet_tao',
    'bai_viet_sua',
    'van_ban_tao',
    'van_ban_sua',
    'giao_vien_tao',
    'giao_vien_sua',
    'video_tao',
    'thu_vien_anh_tao',
    'thu_vien_so_tao',
    'thong_bao_tao',
    'gioi_thieu_tao',
    'gioi_thieu_sua',
  )
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
          const randomName = Array(16)
            .fill(null)
            .map(() => Math.floor(Math.random() * 16).toString(16))
            .join('');
          const ext = extname(file.originalname).toLowerCase();
          return cb(null, `${Date.now()}-${randomName}${ext}`);
        },
      }),
      limits: {
        fileSize: 100 * 1024 * 1024, // Giới hạn tối đa 100 MB theo yêu cầu Giai đoạn 7
      },
      fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();

        // 1. Chống file thực thi/nguy hiểm
        if (DANGEROUS_EXTENSIONS.includes(ext)) {
          return cb(
            new BadRequestException(
              `Định dạng file ${ext} bị cấm do nguy cơ mất an toàn hệ thống.`,
            ),
            false,
          );
        }

        // 2. Chỉ cho phép các đuôi file trong danh mục hợp lệ
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          return cb(
            new BadRequestException(
              'Chỉ chấp nhận tệp tin văn bản (.pdf, .doc, .docx, .xls, .xlsx) hoặc tệp ảnh (.jpg, .png, .gif, .webp).',
            ),
            false,
          );
        }

        cb(null, true);
      },
    }),
  )
  async uploadFile(@UploadedFile() file: any, @NguoiDungHienTai() user: any) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn tập tin để tải lên.');
    }

    const fileUrl = `/uploads/${file.filename}`;

    // Tạo bản ghi trong bảng tep_tin để van_ban có thể liên kết FK tep_tin_id
    const tepTinRecord = await this.prisma.tep_tin.create({
      data: {
        ten_goc: file.originalname,
        ten_luu_tru: file.filename,
        duong_dan: file.path,
        url: fileUrl,
        loai_tap_tin: file.mimetype,
        kich_thuoc: file.size,
        nguoi_tai_len_id: user.id,
      },
    });

    return {
      thanh_cong: true,
      thong_bao: 'Tải tập tin lên hệ thống thành công',
      du_lieu: {
        id: tepTinRecord.id,
        url: fileUrl,
        ten_goc: file.originalname,
        ten_luu_tru: file.filename,
        loai_tap_tin: file.mimetype,
        kich_thuoc: file.size,
      },
    };
  }
}
