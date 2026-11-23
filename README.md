# Góc học tập (Personal Study Hub)

Ứng dụng học tập cá nhân chạy **hoàn toàn trên máy bạn**: không có máy chủ, không tài khoản, không gửi dữ liệu đi đâu.
Nội dung học (bộ câu hỏi, thuật ngữ, lý thuyết) được chuẩn bị sẵn dưới dạng file JSON; ứng dụng lo phần học, ôn tập và theo dõi tiến độ.

Công nghệ: React 18, TypeScript, Tailwind CSS v4, Vite, Vitest. Tiến độ lưu trong IndexedDB của trình duyệt.

## Tính năng

**Học**
- **Flashcard** tự chấm 4 mức (Quên / Khó / Được / Dễ), thẻ sai được hỏi lại sau vài thẻ cho đến khi nhớ.
- **Trắc nghiệm** (kể cả câu chọn nhiều đáp án), điền chỗ trống, ghép cặp, đúng/sai, tự sinh từ nội dung bộ.
- **Thi thử theo môn** (`/exam`): trộn các chương theo tỷ lệ, kèm ước lượng mức sẵn sàng thi.
- **Luyện chương yếu** (`/drill`) từ thẻ "Mức sẵn sàng thi" ở Tổng quan.
- **Sinh tồn** (`/survival`) và **Dòng thời gian** (`/timeline`) cho môn lịch sử.
- Đánh dấu (highlight) trong câu hỏi, ghi chú cá nhân, chế độ tập trung (phím `Z`), Pomodoro.

**Ôn tập**
- Lặp lại ngắn quãng kiểu Leitner, 5 hộp (1, 3, 7, 14, 30 ngày). Đúng thì lên hộp, sai thì về hộp 1.
- **Học hôm nay** (`/today`): thẻ đến hạn, rồi câu từng sai, rồi thẻ mới theo mục tiêu mỗi ngày.
- **Sổ tay câu sai** (`/mistakes`), có bản in; mục **thẻ "leech"** gom các thẻ cứ sai mãi.
- Câu trùng giữa các bộ dùng chung tiến độ.
- Câu có đáp án đang bị tranh cãi giữa hai nguồn được ghi chú ngay khi học; bạn có thể tự đánh dấu "nghi ngờ".

**Theo dõi**: chuỗi ngày học, mục tiêu hằng ngày, bản đồ nhiệt, dự báo số thẻ đến hạn, thống kê (`/statistics`), tìm kiếm toàn bộ (`/search`).

**Dữ liệu của bạn**
- Tải bộ riêng ở `/import`: dán văn bản (không bao giờ đoán đáp án) hoặc nạp JSON, có sẵn thư viện mẫu.
- Sao lưu và khôi phục ở Cài đặt (tiến độ, ghi chú, highlight, bộ tự tải, kỷ lục Sinh tồn, cờ nghi ngờ); tự động sao lưu ra file đã chọn trên Chrome/Edge.
- Giao diện sáng/tối, cài được như ứng dụng (PWA) và dùng offline.
- Góp ý ở `/feedback`.

## Chạy thử

Cần Node.js 20 trở lên.

```powershell
npm install
npm run dev
```

Mở địa chỉ Vite in ra (thường là http://localhost:5173).

| Lệnh | Việc làm |
|---|---|
| `npm run dev` | Chạy máy chủ phát triển |
| `npm test` | Chạy toàn bộ test, gồm kiểm tra mọi bộ câu hỏi |
| `npm run lint` | ESLint (quy tắc hooks của React là lỗi) |
| `npm run build` | Kiểm tra kiểu và build ra `dist/` |
| `npm run preview` | Chạy bản build, có hỗ trợ offline |

Service worker chỉ đăng ký ở bản build, nên thử offline bằng `npm run build && npm run preview`, không dùng `npm run dev`.

## Thêm bộ nội dung

1. Đặt bản gốc của tài liệu vào `docs/`.
2. Tạo **một** file JSON tại `src/data/collections/<thư-mục-môn>/<tên>.json`. Mọi file trong thư mục này được nạp tự động, không cần sửa code.
3. Chạy `npm test` và `npm run build`.
4. Mở `npm run dev`, vào Cài đặt, mục "Trạng thái nạp dữ liệu" phải hiện file với dấu tick xanh.

Cấu trúc một bộ:

```jsonc
{
  "id": "ma-bo-duy-nhat", "title": "...", "subject": "...", "description": "...",
  "contentType": "vocabulary | multiple-choice | true-false | theory | programming | mixed",
  "items": [
    { "id": "id-on-dinh", "type": "multiple-choice",
      "content": { "question": "...", "options": [{ "key": "A", "text": "..." }], "answer": "A" } }
  ]
}
```

Quy tắc chính:
- Chép nguyên văn câu hỏi và đáp án từ nguồn, không sửa lặng lẽ; nghi ngờ sai thì giữ nguyên và báo lại.
- Không bịa giải thích. Thông tin tra cứu thêm đặt trong `enrichment` và gắn `uncertain` nếu không chắc.
- **Không đổi `id`** của câu hay của bộ: tiến độ lưu theo `idBộ::idCâu`, đổi id là mất tiến độ.
- Không nhân đôi một bộ đã có.

Chuyển đổi hàng loạt thì viết script trong `scripts/` thay vì gõ tay. Các lệnh nạp có sẵn:
`npm run import:history`, `import:cnxhkh`, `import:mln131-full`, `import:vnr202-full`, `import:fpt-banks`
(chúng ghi đè các file JSON tương ứng). Chi tiết schema nằm trong `src/types/index.ts` và `src/utils/validate.ts`.

## Cấu trúc thư mục

```
src/data/            nạp bộ + collections/<môn>/*.json
src/pages/           các trang (route)
src/components/      layout, flashcards, quiz, dashboard, ui
src/services/        storage, review (SRS), quiz, thống kê, twins, drill, survival, timeline...
src/features/learning/   kho tiến độ (ProgressContext)
docs/                tài liệu nguồn, báo cáo đối chiếu, bản sửa lỗi cho ngân hàng câu hỏi
scripts/             script nạp dữ liệu, tạo icon, mẫu service worker
```

## Lưu ý về dữ liệu

- Mọi thứ nằm trong trình duyệt của bạn. Xóa dữ liệu trang web là mất tiến độ, nên hãy **xuất file sao lưu** định kỳ ở Cài đặt.
- Ứng dụng xin trình duyệt giữ dữ liệu bền vững và báo khi không ghi được (ví dụ bộ nhớ đầy).
- Một số ngân hàng câu hỏi lấy từ cộng đồng có thể sai đáp án. Các chỗ nghi ngờ được ghi trong `docs/ra-soat-dap-an.md` và các file `*-doi-chieu.md`; kết quả đối chiếu giáo trình chỉ mang tính tham khảo.
- Ước lượng "mức sẵn sàng thi" dựa trên giả định về xác suất nhớ theo từng hộp, chỉ là gợi ý.

## Góp ý

Mọi góp ý, báo lỗi hay chỉ ra câu sai đáp án: trang `/feedback` trong ứng dụng, hoặc email leninh2004@gmail.com.
