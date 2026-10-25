# iMonster Classic: Hero Adventure — bản làm lại cho trình duyệt

Bản làm lại phi lợi nhuận, chơi một mình, của *iMonster Classic – Hero Adventure* (Pixss / Loongcheer, ngừng phát hành 2021),
dựng lại từ chính file APK 1.4.1: **toàn bộ hình ảnh, nhạc, dữ liệu và kịch bản Lua đều là của bản gốc**.

## Những gì đã có
- **Tháp Thống Trị**: 200 tầng theo đúng `map.csv` gốc (tên tầng, bộ gạch, nhạc, danh sách quái, bảng rơi đồ). Bản đồ sinh ngẫu nhiên theo công thức `GetMapConfig` gốc; tường/sàn tự ghép theo đúng hàm `getWallStyle/getFloorStyle` dịch ngược từ `libMyGame.so`. Tầng boss / phòng đặc biệt dùng bản đồ cố định gốc (`m-*.json`).
- **Nhân vật Spine gốc**: tiểu quái vật của bạn (10 màu da × 9 kiểu), mặc trang bị nào hiện đúng hình trang bị đó (paper‑doll); 170+ mẫu quái/boss với hoạt ảnh gốc.
- **Chiến đấu** dùng nguyên công thức trong `formular.lua` (trúng/né, chí mạng, phòng thủ, kháng nguyên tố), tốc độ đánh theo vũ khí, bình máu/mana, quả cầu HP/MP, quái tinh anh (xanh/vàng) có phụ tố ngẫu nhiên.
- **Kỹ năng**: cây kỹ năng 24 hàng, 4 kỹ năng chiến đấu + kỹ năng phiêu lưu (Niệm lực, Dịch chuyển, Tiên tri), hiệu ứng lấy thẳng từ `skill.lua` gốc; boss dùng AI gốc trong `monsterai.lua`.
- **Cốt truyện & hướng dẫn gốc**: ~900 đoạn hội thoại của `story.lua`, `subplots.lua`, `encounter.lua` chạy trên máy ảo Lua (Fengari), có chân dung nhân vật (Shanull, chú Gujiguji...).
- **Trang bị**: hơn 1.200 món, chỉ số sinh bằng `CalEquipmentAttrib/CalEquipmentAffix` gốc, so sánh điểm trang bị, bán đồ, cường hoá ở lò rèn (`CalEquipmentIntensify`), cửa hàng trang bị theo cấp.
- **Trại**: lò rèn, cửa hàng, cây kỹ năng, chọn tầng xuất phát; năng lượng hồi trại (hạ quái để nạp, đủ 100 mới mang được chiến lợi phẩm về).
- Rương, thùng, vò, giá vũ khí/giáp, đài phun hồi máu/mana, tế đàn bình thuốc, bia hồi trại, sách soi bản đồ, cổng dịch chuyển sang phòng bí mật.
- Lưu game: tự động vào trình duyệt (localStorage) + **lưu trên mây Firebase** (tuỳ chọn) + xuất/nhập file lưu.
- Chơi **offline** sau lần tải đầu (Service Worker), cài lên màn hình điện thoại như ứng dụng (PWA).

### Bổ sung ở bản 2
- **Bẫy**: chông nhô lên theo nhịp và trống lưỡi dao (trap.csv gốc, đúng `Appear`/`Period`); xuất hiện ở các tầng có `TrapID` và rải nhiều hơn ở chế độ Khó.
- **Thú cưng**: 6 thú (Lina miễn phí; Ally, Stanley, Kotone, Rex, Cookie thuê bằng vàng hoặc nhận từ khế ước), chỉ số theo `henchmanstats.csv`, lên cấp – thăng sao (★1–★5, mỗi sao mở 1 kỹ năng), đi theo và đánh cùng trong tháp, nhận 50% EXP; cho ăn trang bị (`CalPetExpFromItem`).
- **Lò rèn 4 tab**: Cường hoá · **Khảm ngọc** (xanh 1 lỗ, tím 2, cam/đỏ 3; chỉ số ngọc từ `GetGemAttr`, phí `CalEquipmentInlay`) · **Phân giải** (`CalBreakupMaterial`) · **Chế tạo** 244 công thức `recipe.csv` (học thêm bằng cuộn công thức).
- **Chế độ Khó** (mở ở tầng 50): quái +10 cấp, máu/công ×1,6, nhiều bẫy, thưởng ×1,6, kỷ lục riêng.
- **Chế độ vô tận – Phòng thí nghiệm Hắc Ám** (mở ở tầng 20): 100 tầng ngẫu nhiên (bản đồ 10001–19917 gốc), vào tay trắng cấp 1 với Dao mổ; ra về giữ ngọc/nguyên liệu/cuộn công thức, thưởng vàng + kim cương theo tầng.
- **Nhiệm vụ hằng ngày** (`bptask.csv`): 5 nhiệm vụ mỗi ngày + 4 mốc điểm hoạt động có quà.
- **Thời trang**: 154 bộ đồ thời trang gốc (mũ, áo, găng, quần, giày, vũ khí) mua bằng kim cương, chỉ đổi ngoại hình.
- **Thương nhân trại**: cuộn công thức, nguyên liệu (trả kim cương hoặc đổi vật phẩm theo `shop.csv`). **Kim cương** kiếm từ rương kim cương/boss, nhiệm vụ, phòng thí nghiệm.
- Dùng được thêm vật phẩm: cuộn công thức, rương ngẫu nhiên, gói bình thuốc, cuộn dịch chuyển, bom, tẩy điểm kỹ năng, khế ước thú cưng.

### Bổ sung ở bản 3
- **Đồ trang trí bản đồ**: 598 mẫu trang trí gốc (`ornament.csv` + 115 cảnh CocosBuilder `tower/*.ccbi` được chuyển sang `data/orna.json`): đuốc, cờ, tượng lớn, ván vỡ, vết nứt, xích, đom đóm/tia lửa (hiệu ứng hạt)… đặt theo đúng mẫu ô tường/sàn của bản gốc, có hoạt ảnh.
- **Nhật ký thám hiểm**: 59 trang nhật ký (`diary.csv`) rơi ngẫu nhiên trong tháp theo tầng; đọc lại trong Thành tích → Nhật ký thám hiểm.
- **Lời thoại NPC** (`tips.csv`) ở cửa hàng, lò rèn và màn hình tải.
- **Hạt chúc phúc**: chọn khi cường hoá để tăng tỉ lệ thành công (+4% đến +25%).
- **Quầy đổi trang bị** và **quầy sự kiện** (shop.csv storage 4 và 5), đổi bằng Mảnh Thánh, Ngọc Thợ Cung, vàng…
- **Cờ đánh dấu** (pháo hiệu đỏ/vàng/xanh/lục): cắm trên sàn, hiện trên bản đồ nhỏ.

Nội dung chữ trong game là của bản gốc (Anh / 中文 / 日本語 / 한국어 – đổi trong Cài đặt); bản gốc không có tiếng Việt. Kỹ năng thú cưng và chế độ Khó trong bản gốc nằm ở phần C++/máy chủ nên công thức ở đây là phỏng theo mô tả.

## Chạy thử trên máy
Cần một web server tĩnh (không mở trực tiếp file `index.html` được):
```bash
cd imonster-web
python -m http.server 8080
# mở http://localhost:8080
```

## Đưa lên GitHub Pages
1. Tạo repo mới trên GitHub (ví dụ `imonster-web`).
2. Trong thư mục này:
   ```bash
   git init
   git add .
   git commit -m "iMonster web"
   git branch -M main
   git remote add origin https://github.com/<tên-bạn>/imonster-web.git
   git push -u origin main
   ```
   (Có ~8.500 file nên hãy dùng git hoặc GitHub Desktop, đừng kéo thả trên web.)
3. Repo → **Settings → Pages** → Source: *Deploy from a branch*, Branch: `main` / `(root)` → Save.
4. Sau 1–2 phút game chạy ở `https://<tên-bạn>.github.io/imonster-web/`.

## Firebase (Hosting + lưu trên mây)
1. Tạo project ở <https://console.firebase.google.com>, thêm **Web app**, chép cấu hình vào `js/firebase-config.js`.
2. **Authentication → Sign-in method**: bật *Anonymous* (và *Google* nếu muốn đồng bộ giữa nhiều máy; nhớ thêm tên miền GitHub Pages vào *Authorized domains*).
3. **Firestore Database** → Create database → sau đó deploy luật bảo mật có sẵn:
   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use --add            # chọn project của bạn
   firebase deploy --only firestore:rules,hosting
   ```
   `firebase.json` đã cấu hình sẵn để host thư mục này. Game sẽ có ở `https://<project>.web.app`.
4. Trong game: **Cài đặt → Đăng nhập Google để đồng bộ** (nếu bật Google). Bản lưu nằm ở `saves/{uid}`, mỗi người chỉ đọc/ghi được của mình.

Không điền Firebase thì game vẫn chạy bình thường, chỉ lưu trong trình duyệt.

## Cấu trúc
```
index.html, css/, sw.js, manifest.webmanifest
js/main.js            khởi động, chuyển cảnh
js/engine/            WebGL (spine-webgl 3.8), Spine paper-doll, Lua (Fengari), âm thanh, dữ liệu
js/game/              tháp, sinh bản đồ, chiến đấu, kỹ năng, kịch bản, vật phẩm, hồ sơ & lưu
js/ui/ui.js           giao diện (HUD, túi đồ, cửa hàng, cây kỹ năng, cài đặt)
js/ui/panels.js       chế độ chơi, thú cưng, nhiệm vụ, lò rèn (khảm/phân giải/chế tạo), thương nhân, thời trang
lua/                  script gốc của game (formular, skill, monsterai, story...)
data/                 bảng dữ liệu gốc đã chuyển sang JSON + bảng chữ 5 ngôn ngữ
assets/               ảnh (WebP), khung xương Spine, nhạc & hiệu ứng âm thanh
tools/                script trích xuất từ APK, đọc .ccbi (không cần khi chạy game)
```

## Bản quyền
Hình ảnh, âm thanh, dữ liệu và kịch bản thuộc về Pixss Co., Ltd. / Loongcheer. Bản làm lại này chỉ để lưu giữ kỷ niệm và chơi cá nhân, không thương mại.
Thư viện dùng: spine-ts 3.8 (Esoteric Software, Spine Runtimes License), Fengari (MIT), sprintf.js (BSD).
