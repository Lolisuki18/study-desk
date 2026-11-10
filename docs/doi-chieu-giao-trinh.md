# Ngân hàng câu hỏi bổ sung và đối chiếu giáo trình

Nguồn câu hỏi: trang https://dinh-vien.github.io/fpt-political-quiz/ (nguồn cộng đồng, không chính thức).
Đã lấy 2 bộ phù hợp với môn của bạn và lưu nguyên bản tại `docs/source-bank-mln131.json`, `docs/source-bank-vnr202.json`.

| Bộ | Trên site | Đã thêm vào app | Bỏ qua |
|---|---|---|---|
| MLN131 – CNXH khoa học | 418 | 415, chia theo 7 chương giáo trình: C1 47, C2 52, C3 69, C4 59, C5 59, C6 68, C7 61 | 2 câu trùng Chương 4–5 (b-192, b-324), 1 câu lặp trong bộ (b-348) |
| VNR202 – Lịch sử Đảng | 404 | 400, chia theo chương giáo trình: Chương 1 (122 câu), Chương 2 (127 câu), Chương 3 (151 câu) | 4 câu lặp trong bộ (b-191, b-224, b-228, b-371) |

Giáo trình dùng để đối chiếu: `MLN131.pdf` (Giáo trình CNXHKH 2019), `VNR202.pdf` (Giáo trình Lịch sử Đảng 2021–2022), `VNR202-TomTat.pdf` (tài liệu học tập). Số trang ghi dưới đây là **trang trong file PDF**, có thể lệch với số trang in trong sách.

### Chia chương (MLN131 và VNR202)

MLN131: 7 chương của giáo trình CNXH khoa học (1 Nhập môn, 2 Sứ mệnh lịch sử của GCCN, 3 CNXH và thời kỳ quá độ, 4 Dân chủ và Nhà nước XHCN, 5 Cơ cấu xã hội – giai cấp và liên minh, 6 Dân tộc và tôn giáo, 7 Gia đình), bản đồ ở `docs/chapter-map-bank-mln131.json`; đã sửa tay 21 câu máy xếp sai. VNR202 làm cách tương tự (bên dưới).

#### VNR202

Mỗi câu được xếp vào chương theo vị trí đoạn giáo trình khớp nhất (Chương 1: 1930–1945; Chương 2: 1945–1975; Chương 3: 1975–nay), rồi tôi rà từng câu và sửa tay 27 câu xếp sai (ví dụ câu về Hiệp định Sơ bộ, Bình dân học vụ, Đại hội II thuộc Chương 2). Bản đồ chương lưu ở `docs/chapter-map-bank-vnr202.json`, sửa file này rồi chạy lại `node scripts/import-quiz-bank.mjs` nếu muốn chuyển câu. Vài câu bị cụt (b-045, b-063, b-102, b-148, b-204, b-277...) được xếp theo đoán nội dung.

## Cách đối chiếu (và giới hạn)

Script `scripts/crosscheck.mjs` tìm đoạn giáo trình khớp nhất với phần câu hỏi, rồi xem nội dung từng phương án có xuất hiện trong đoạn đó không. Đây là **công cụ phân loại**, không phải kiểm chứng tuyệt đối:

- **Khớp giáo trình**: nội dung đáp án đúng xuất hiện (≥ 80%) trong đoạn giáo trình khớp câu hỏi. Với mỗi câu, ghi chú trong app **diễn đạt lại nội dung giáo trình nói** (kèm số trang PDF) thay vì chỉ ghi số trang. Khoảng 27 câu không tìm được đoạn giáo trình phù hợp nên không có ghi chú.
- **Nghi vấn**: phương án khác khớp giáo trình hơn đáp án của ngân hàng → tôi đọc lại đoạn giáo trình bằng tay.
- **Không tự động xác minh được**: câu hỏi diễn đạt lại khác giáo trình, hoặc loại "tất cả đều đúng", "đáp án nào KHÔNG…", câu hỏi số. Các câu này **chưa được đối chiếu**, không có nghĩa là đúng.

| Bộ | Khớp giáo trình | Nghi vấn (đã đọc tay) | Chưa xác minh tự động |
|---|---|---|---|
| MLN131 bổ sung (418) | 167 | 21 | 230 |
| VNR202 bổ sung (404) | 58 | 29 | 317 |
| 200 câu CNXH Chương 2–5 cũ | 54 | 8 | 138 |
| 100 câu Lịch sử Đảng cũ | 33 | 2 | 65 |

Với 300 câu cũ, tất cả các câu bị nghi vấn tôi đọc lại đều **đúng** (không phát hiện thêm lỗi mới ngoài Câu 2 Ch.1 đã báo từ trước).

## Câu trong ngân hàng bổ sung mà giáo trình cho đáp án khác

**Đã đổi sang đáp án theo giáo trình** (theo yêu cầu của người học). Đáp án gốc của ngân hàng được giữ trong `source.bankAnswer`, danh sách đổi nằm ở `docs/answer-overrides-bank-*.json`, mỗi câu có ghi chú "ĐÃ ĐỔI THEO GIÁO TRÌNH". Nếu thầy cô dạy khác giáo trình, xoá câu tương ứng khỏi file overrides rồi chạy lại `node scripts/import-quiz-bank.mjs`.

| Câu (id) | Ngân hàng (gốc) | Giáo trình (đang dùng trong app) | Trang PDF |
|---|---|---|---|
| MLN131 b-073: Dân chủ trong lĩnh vực nào quan trọng hàng đầu | A (kinh tế và chính trị) | Dân chủ trong kinh tế và trong văn hóa – tinh thần, tư tưởng → gần D | MLN131 tr. 82 |
| MLN131 b-106: Ưu tiên đầu tư vùng dân tộc, miền núi | B (… y tế, giáo dục) | “giao thông và cơ sở hạ tầng, xóa đói, giảm nghèo” → A | MLN131 tr. 143 |
| MLN131 b-150: điền “quyền tự do … và không …” | C (tín ngưỡng và tôn giáo) | “quyền tự do tín ngưỡng và không tín ngưỡng” → B | MLN131 tr. 150 |
| MLN131 b-221: Thiếu cơ sở văn hóa thì ảnh hưởng gì (ngân hàng còn có câu giống hệt b-391 với đáp án C) | A (phát triển xã hội) | “việc xây dựng gia đình sẽ lệch lạc…” → C | MLN131 tr. 176 |
| MLN131 b-345: Công nghiệp cơ khí thuộc cách mạng công nghiệp lần thứ mấy | A (lần thứ nhất) | “công nghiệp cơ khí (Cách mạng công nghiệp lần thứ 2)” → B (nhiều sách sử xếp lần thứ nhất, nên hỏi lại thầy cô) | MLN131 tr. 55 |
| VNR202 b-041: Đại hội V coi lĩnh vực nào là mặt trận hàng đầu | A (Công nghiệp) | “coi nông nghiệp là mặt trận hàng đầu” → B | VNR202 Tóm tắt tr. 70 |
| VNR202 b-078: Đại hội XIII họp từ ngày nào | B (25.1–1.2.2021) | “từ ngày 26-1 đến 1-2-2021” → C (một số nguồn tính từ phiên trù bị 25/1) | VNR202 tr. 114 |

## Câu hỏng hoặc mơ hồ trong nguồn

- VNR202 b-204 (“Chính tri pháp:”) và b-374 (“Trung Quốc xuất bản tại đầu?”): câu hỏi bị cắt, không đối chiếu được. Nên bỏ qua.
- VNR202 b-329: “giai cấp nào là động lực của cách mạng” mơ hồ (công nhân hay nông dân), chưa đối chiếu được chắc chắn.

## Chất lượng dữ liệu nguồn

- Nhiều câu có lỗi chính tả và lỗi OCR (ví dụ “nhất đinh”, “bi động”, “thống tri”). Tôi **giữ nguyên văn**, không sửa.
- 6 câu VNR202 có phương án D rỗng (b-089, b-129, b-171, b-184, b-379, b-404): đã bỏ phương án rỗng, câu còn 3 lựa chọn.
- Một số phương án bị cụt chữ cuối (ví dụ “…trong cả nư”): giữ nguyên.
- 23 câu MLN131 là **câu chọn nhiều đáp án** (đáp án dạng “AB”, “ABC”): app đã được nâng cấp để hỗ trợ (chọn nhiều ô rồi bấm Kiểm tra / Xác nhận đáp án, chấm đúng khi chọn đủ và đúng tập hợp).
- Nguồn không có phần giải thích, nên các bộ này chỉ có ghi chú đối chiếu giáo trình.

## Chạy lại

```bash
node scripts/import-quiz-bank.mjs     # dựng lại 2 bộ từ docs/source-bank-*.json (+ docs/enrichment-bank-*.json)
node scripts/crosscheck.mjs --questions q.json --text giao-trinh.txt --out report.json
```
