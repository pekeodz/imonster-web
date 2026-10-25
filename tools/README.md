# Công cụ trích xuất tài nguyên từ APK gốc

Các script này đã được dùng để chuyển tài nguyên của *iMonster Classic – Hero Adventure 1.4.1* (APK + OBB) sang dạng web.
Không cần chạy lại trừ khi bạn muốn trích xuất thêm.

- Ảnh trong APK/OBB được mã hoá dạng Cocos2d-x `CCZp` (PVR). Khoá 128-bit lấy từ `GameView::init()` trong `libMyGame.so`:
  `0x426e5e6f, 0x3d7e2b0b, 0xbdde0b8c, 0x4e3aa900` (`ccz.py`, `pvr2png.py`).
- `convert_all.py` – giải mã toàn bộ ảnh ra PNG.
- `build_assets.py` – PNG → WebP, sắp xếp vào `assets/`.
- `build_data.py` – CSV (`assets/data/*.csv`) → JSON trong `data/`, tách bảng chữ `string.csv` theo ngôn ngữ.
- `frames.py` – đọc các sprite sheet `.plist` → `data/frames.json`.
- `spine_convert.py` – chuyển khung xương Spine 3.3 sang định dạng JSON 3.8 (thêm `order` cho ràng buộc, đổi `skins`, `curve`...).
- `bundle_fengari.js` – đóng gói máy ảo Lua [Fengari](https://github.com/fengari-lua/fengari) cho trình duyệt.
- `sheet.py` – xem nhanh một sprite sheet.
