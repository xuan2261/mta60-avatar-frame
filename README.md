# MTA 60 năm – PA17-C Avatar Frame

Công cụ tạo ảnh đại diện cộng đồng nhân dịp kỷ niệm 60 năm Học viện Kỹ thuật Quân sự.

**Dùng trực tiếp:** https://xuan2261.github.io/mta60-avatar-frame/

## Release 1.0
- Ghép ảnh trong khung PA17-C và giới hạn ảnh đúng vùng aperture.
- Kéo, zoom, xoay, căn giữa và mô phỏng crop tròn avatar.
- Xuất JPG 2048×2048 nền trắng hoặc PNG nền trong suốt.
- Chia sẻ trang, sao chép lời mời + link, tải QR và poster chia sẻ.
- Open Graph/social preview 1200×630.
- Regression test Playwright chạy tự động trên GitHub Actions.

## Release 1.1
- Popup QR ngay trên trang để quét/gửi nhanh.
- Nút chia sẻ poster: ưu tiên Web Share file khi thiết bị hỗ trợ, tự hạ cấp sang chia sẻ link hoặc tải poster.
- Ba mẫu lời mời: cán bộ/giảng viên, cựu học viên, học viên/sinh viên.
- Regression suite kiểm tra QR modal, mẫu lời mời và luồng chia sẻ poster.

## Quyền riêng tư
Ảnh cá nhân được xử lý ngay trong trình duyệt bằng Canvas; trang tĩnh không tải ảnh người dùng lên máy chủ.

## Liên hệ
Bùi Thanh Xuân · https://fb.com/xuan2261 · 0374 037 026

Đây là mẫu khung cộng đồng, không phải công cụ chính thức của Facebook, Zalo hoặc Học viện.
