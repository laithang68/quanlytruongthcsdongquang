import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const chucVus = await prisma.danh_muc_chuc_vu.findMany();
  const boMons = await prisma.danh_muc_bo_mon.findMany();

  const mapCv = new Map<string, string>();
  chucVus.forEach((c) => mapCv.set(c.ma, c.id));

  const mapBm = new Map<string, string>();
  boMons.forEach((b) => mapBm.set(b.ma, b.id));

  const teachers = await prisma.giao_vien.findMany();
  console.log('Tổng số giáo viên hiện tại:', teachers.length);

  let mappedCvCount = 0;
  let mappedBmCount = 0;
  let unmappedCount = 0;

  for (const t of teachers) {
    const rawCv = (t.chuc_vu || '').trim().toLowerCase();
    let targetCvMa: string | null = null;
    let targetBmMa: string | null = null;

    if (rawCv.includes('hiệu trưởng') && !rawCv.includes('phó')) {
      targetCvMa = 'HIEU_TRUONG';
    } else if (rawCv.includes('hiệu phó') || rawCv.includes('phó hiệu trưởng')) {
      targetCvMa = 'HIEU_PHO';
    } else if (rawCv.includes('giáo vụ')) {
      targetCvMa = 'GIAO_VU';
    } else if (rawCv.includes('kế toán')) {
      targetCvMa = 'KE_TOAN';
    } else if (rawCv.includes('nhân viên')) {
      targetCvMa = 'NHAN_VIEN';
    } else {
      // Mặc định vai trò Giáo viên
      targetCvMa = 'GIAO_VIEN';
    }

    if (rawCv.includes('tin')) targetBmMa = 'TIN_HOC';
    else if (rawCv.includes('toán')) targetBmMa = 'TOAN';
    else if (rawCv.includes('văn') || rawCv.includes('ngữ văn')) targetBmMa = 'NGU_VAN';
    else if (rawCv.includes('anh')) targetBmMa = 'TIENG_ANH';
    else if (rawCv.includes('lý') || rawCv.includes('vật lý')) targetBmMa = 'VAT_LY';
    else if (rawCv.includes('hóa')) targetBmMa = 'HOA_HOC';
    else if (rawCv.includes('sinh')) targetBmMa = 'SINH_HOC';
    else if (rawCv.includes('sử') || rawCv.includes('lịch sử')) targetBmMa = 'LICH_SU';
    else if (rawCv.includes('địa')) targetBmMa = 'DIA_LY';
    else if (rawCv.includes('gdcd') || rawCv.includes('công dân')) targetBmMa = 'GDCD';
    else if (rawCv.includes('công nghệ')) targetBmMa = 'CONG_NGHE';
    else if (rawCv.includes('nhạc') || rawCv.includes('âm nhạc')) targetBmMa = 'AM_NHAC';
    else if (rawCv.includes('mỹ thuật') || rawCv.includes('họa')) targetBmMa = 'MY_THUAT';
    else if (rawCv.includes('thể dục')) targetBmMa = 'THE_DUC';

    const chuc_vu_id = targetCvMa ? mapCv.get(targetCvMa) || null : null;
    const bo_mon_id = targetBmMa ? mapBm.get(targetBmMa) || null : null;

    if (chuc_vu_id) mappedCvCount++;
    if (bo_mon_id) mappedBmCount++;
    if (!chuc_vu_id && !bo_mon_id) unmappedCount++;

    await prisma.giao_vien.update({
      where: { id: t.id },
      data: {
        chuc_vu_id: chuc_vu_id || undefined,
        bo_mon_id: bo_mon_id || undefined,
      },
    });

    console.log(
      `[MIGRATE] ${t.ho_ten} | chuc_vu cũ: '${t.chuc_vu}' -> Chức vụ: ${targetCvMa || 'NULL'} | Bộ môn: ${targetBmMa || 'NULL'}`,
    );
  }

  console.log('\n--- KẾT QUẢ MIGRATION DỮ LIỆU GIÁO VIÊN ---');
  console.log('Tổng giáo viên:', teachers.length);
  console.log('Đã mapping chức vụ:', mappedCvCount);
  console.log('Đã mapping bộ môn:', mappedBmCount);
  console.log('Không xác định:', unmappedCount);
}

main()
  .catch((e) => {
    console.error('Lỗi khi migrate dữ liệu giáo viên:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
