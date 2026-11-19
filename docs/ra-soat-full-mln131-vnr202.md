# Rà soát hai bộ Full: MLN131 (360 câu) và VNR202 (404 câu)

Rà bằng script (không sửa nội dung). Nguyên tắc dự án: giữ nguyên văn nguồn, chỉ báo cáo chỗ nghi ngờ.

## Tổng quan
- Cả hai bộ đủ câu, id `q-001…` liên tục, mọi đáp án trỏ vào một phương án có thật, không có ký tự lỗi (U+FFFD).
- MLN131 Full: 23 câu chọn nhiều đáp án (câu 79–101); 1 câu có 3 phương án, còn lại 4.
- VNR202 Full: không có câu chọn nhiều đáp án; 6 câu có 3 phương án, 1 câu có 5.

## 1. Đáp án nghi sai (cần đối chiếu giáo trình)
| Bộ | Câu | Vấn đề |
|---|---|---|
| MLN131 | **129** | Cùng đề với câu 127 ("Giai cấp nào là đại biểu cho lực lượng sản xuất tiên tiến…?"). Câu 127 đáp án *Công nhân*, câu 129 đáp án *Thống trị*. Câu 129 gần như chắc chắn sai khoá. |
| MLN131 | **253** | Phương án B và C giống hệt nhau ("Phát triển nền kinh tế thị trường định hướng xã hội chủ nghĩa"); đáp án là C. Chọn B sẽ bị tính sai. |
| VNR202 | **139** | "Mỹ – Ngụy không thực thi Hiệp định Giơ-ne-vơ bằng cách": A, B, C đều là cách thật và D = "Các phương án trả lời đều đúng", nhưng đáp án nguồn là A. |
| VNR202 | 30 | "Một trong những sự kiện làm bùng nổ Đồng Khởi": đáp án B (Luật 10/59) trong khi A, C cũng đúng và có phương án "đều đúng". Có thể chấp nhận vì đề nói "một trong những". |

## 2. Câu mất đề (VNR202)
14 câu có đề trùng với một phương án (chỉ còn nội dung đáp án): 45, 63, 81, 102, 103, 106, 148, 162, 212, 247, 277, 283, 344, 347.
Thêm các câu đề bị cắt/chép lẫn: 17, 55, 85, 86, 133, 155, 177, 254, 219, 360 (và 170, 180 đã khôi phục).
Xem `docs/question-fixes-vnr202.json`; trong app các câu này có ghi chú "tham khảo".

## 3. Câu lặp trong file (giữ nguyên, chỉ báo)
- MLN131: 3=202, 23=293, 28=200, 115=178, 143=188, 153=155, 270=278, 96=97 (khác lỗi chính tả), 322=332 (khác lỗi chính tả); riêng 127/129 lặp đề nhưng khác đáp án (mục 1).
- VNR202: 1=371, 13=228, 174=180, 53=191 (khác lỗi chính tả).

## 4. Lỗi chép (OCR / gõ) trong nguồn
- VNR202: khoảng 50 câu có chữ bị tách ("cách mạn g", "Phá p thuộc", "củ a"), và rất nhiều chữ mất dấu nặng (đinh, moi, dich, tri, thit…). Chỉ ảnh hưởng cách đọc.
- Nhiều phương án bị cắt cụt cuối câu (ví dụ "…đồng bộ về cơ cấ"). Đáp án đúng thường vẫn là phương án dài nhất.
- MLN131: ít lỗi hơn; vài lỗi như "bản than", "thành tự", "các án đều đúng", "lực l ượng".

## 5. Lưu ý khi ôn
- Vị trí đáp án lệch mạnh: MLN131 có 144/337 câu một đáp án là **A** (43%), VNR202 có 151/404 (37%). Đừng ôn bằng cách đoán "A"; đề thật có thể xáo thứ tự.
- Câu có phương án "Tất cả các đáp án đều đúng" thường *không* phải đáp án (MLN131 câu 212, 213, 214, 316). Hợp lý về nội dung, nhưng cần đọc kỹ từng câu.

## Đã xử lý (cập nhật sau rà soát)
- **MLN131 câu 129**: đáp án sửa thành *Công nhân* (C); đáp án gốc D lưu ở `source.sourceAnswer`. Căn cứ: câu 127 cùng file + giáo trình. Xem `docs/question-fixes-mln131-full.json`.
- **MLN131 câu 253**: bỏ phương án B trùng nội dung với C; phương án bị bỏ lưu ở `source.removedOptions`.
- **VNR202 câu 139 và 30**: giữ nguyên đáp án nguồn. Cản trở hiệp thương/tổng tuyển cử (A của câu 139) là cách trực tiếp vi phạm Hiệp định Giơ-ne-vơ; Luật 10/59 và ấp chiến lược là biện pháp đàn áp, nên "đều đúng" không hẳn đúng. Câu 30 nói "một trong những" nên B hợp lệ.
- **Lỗi chép/gõ**: sửa tự động bằng `scripts/lib/clean-text.mjs` (chữ tách, mất dấu nặng, cụt chữ cuối câu, đoạn lặp dính vào cuối). Danh sách thay đổi: `docs/vnr202-text-cleanup.md` (295 câu) và `docs/mln131-full-text-cleanup.md` (49 câu). File nguồn `docs/source-*.json` không bị sửa.
- **Câu mất đề (VNR202)**: tra mạng không tìm được bản gốc của ngân hàng. 6 câu có đề được khôi phục/ghi lại (55, 63, 170, 180, 283, 347), trong đó 170 và 180 đã kiểm chứng bằng câu song sinh trong ngân hàng, còn 55, 63, 283, 347 do Claude dựng lại và gắn cờ "tham khảo". Các câu còn lại vẫn chỉ có ghi chú cảnh báo.
