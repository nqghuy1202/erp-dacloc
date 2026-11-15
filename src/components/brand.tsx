import Image from "next/image";

// Logo Đắc Lộc (tải từ thuysandacloc.vn, 115×125). Luôn đặt trên nền trung tính — design-spec 12 §5.
// nợ: ảnh gốc chỉ 115×125px nên logo cao >60px bị mềm, nâng cấp khi có file logo gốc (SVG/PNG ≥ 512px) thì thay public/brand/logo-dacloc.png
export function BrandLogo({ className }: { className?: string }) {
  return <Image src="/brand/logo-dacloc.png" alt="Logo Đắc Lộc" width={115} height={125} priority className={className} />;
}

// Dải sóng xanh ngọc như header thuysandacloc.vn — chỉ dùng ở màn đăng nhập (Ngoại lệ đã duyệt, design-spec 12).
export function BrandWave({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 1440 320" preserveAspectRatio="none" className={className}>
      <path d="M0 0h1440v190c-170 60-360 92-560 60C640 212 470 160 300 176 180 188 80 220 0 250Z" fill="var(--app-wave-1)" />
      <path d="M0 250c80-30 180-62 300-74 170-16 340 36 580 74 200 32 390 0 560-60v40c-190 70-380 96-580 66C640 262 470 216 300 226 180 234 80 262 0 290Z" fill="var(--app-wave-2)" />
    </svg>
  );
}
