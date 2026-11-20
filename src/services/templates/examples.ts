export interface JsonTemplate {
  id: string
  name: string
  desc: string
  badge: string
  data: object
}

export const TEMPLATES: JsonTemplate[] = [
  {
    id: 'multiple-choice',
    name: 'Trắc nghiệm (MCQ)',
    desc: 'Hỗ trợ cả câu hỏi chọn 1 đáp án (A) hoặc chọn nhiều đáp án đúng (AB). Câu 1 minh họa thêm tags và enrichment (kiến thức mở rộng, tách riêng khỏi nội dung gốc).',
    badge: 'Phổ biến nhất',
    data: {
      id: 'triet-hoc-chuong-1-mau',
      title: 'Triết học Mác – Lênin: Chương 1 (Mẫu)',
      subject: 'Triết học Mác – Lênin',
      description: 'Bộ câu hỏi trắc nghiệm ôn tập trọng tâm chương 1',
      contentType: 'multiple-choice',
      source: {
        document: 'Giáo trình Triết học Mác – Lênin (Bộ GD&ĐT)',
      },
      items: [
        {
          id: 'th-c1-01',
          type: 'multiple-choice',
          tags: ['triết học', 'chương 1'],
          source: { ref: 'Câu 1' },
          enrichment: {
            text: 'Ph. Ăngghen nêu vấn đề cơ bản này trong tác phẩm "Lútvích Phoiơbắc và sự cáo chung của triết học cổ điển Đức" (1886).',
            confidence: 'verified',
            reference: 'Ph. Ăngghen, Lútvích Phoiơbắc và sự cáo chung của triết học cổ điển Đức (1886)',
          },
          content: {
            question: 'Vấn đề cơ bản của triết học là vấn đề về mối quan hệ giữa:',
            options: [
              { key: 'A', text: 'Tư duy và tồn tại (ý thức và vật chất)' },
              { key: 'B', text: 'Con người và giới tự nhiên' },
              { key: 'C', text: 'Vật chất và không gian, thời gian' },
              { key: 'D', text: 'Lý luận và thực tiễn' },
            ],
            answer: 'A',
            explanation: 'Theo Ăngghen, vấn đề cơ bản lớn của mọi triết học, đặc biệt là của triết học hiện đại, là vấn đề quan hệ giữa tư duy và tồn tại.',
          },
        },
        {
          id: 'th-c1-02',
          type: 'multiple-choice',
          source: { ref: 'Câu 2' },
          content: {
            question: 'Chọn CÁC tiền đề khoa học tự nhiên cho sự ra đời của triết học Mác (chọn nhiều đáp án):',
            options: [
              { key: 'A', text: 'Định luật bảo toàn và chuyển hóa năng lượng' },
              { key: 'B', text: 'Thuyết tế bào' },
              { key: 'C', text: 'Thuyết tiến hóa của Đác-uyn' },
              { key: 'D', text: 'Thuyết tương đối của Anh-xtanh' },
            ],
            answer: 'ABC',
            explanation: 'Ba phát minh lớn của khoa học tự nhiên thế kỷ XIX là: Định luật bảo toàn và chuyển hóa năng lượng, Thuyết tế bào, và Thuyết tiến hóa.',
          },
        },
      ],
    },
  },
  {
    id: 'true-false',
    name: 'Đúng / Sai (True-False)',
    desc: 'Dùng cho các câu hỏi nhận định, mệnh đề khẳng định hoặc phủ định.',
    badge: 'Ôn nhận định',
    data: {
      id: 'lich-su-dang-nhan-dinh-mau',
      title: 'Lịch sử Đảng: Mệnh đề Đúng/Sai (Mẫu)',
      subject: 'Lịch sử Đảng Cộng sản Việt Nam',
      description: 'Bộ câu hỏi nhận định đúng sai ôn tập các mốc lịch sử',
      contentType: 'true-false',
      source: {
        document: 'Giáo trình Lịch sử Đảng Cộng sản Việt Nam',
      },
      items: [
        {
          id: 'lsd-tf-01',
          type: 'true-false',
          source: { ref: 'Nhận định 1' },
          content: {
            statement: 'Cương lĩnh chính trị đầu tiên của Đảng được thông qua tại Đại hội đại biểu toàn quốc lần thứ I (1935).',
            answer: false,
            explanation: 'Sai. Cương lĩnh chính trị đầu tiên được thông qua tại Hội nghị thành lập Đảng (đầu năm 1930) do Nguyễn Ái Quốc chủ trì.',
          },
        },
        {
          id: 'lsd-tf-02',
          type: 'true-false',
          source: { ref: 'Nhận định 2' },
          content: {
            statement: 'Đại hội VI của Đảng (12/1986) là đại hội khởi xướng đường lối đổi mới toàn diện đất nước.',
            answer: true,
            explanation: 'Đúng. Đại hội VI đã đánh dấu bước ngoặt lịch sử quan trọng với đường lối đổi mới kinh tế và chính trị.',
          },
        },
      ],
    },
  },
  {
    id: 'theory',
    name: 'Lý thuyết & Khái niệm',
    desc: 'Học định nghĩa, nguyên lý và luận điểm chính. Từ 4 mục trở lên, app tự sinh thêm bài tập nối cặp (Matching), trắc nghiệm định nghĩa và trả lời ngắn.',
    badge: 'Tự sinh nối cặp',
    data: {
      id: 'kinh-te-chinh-tri-khai-niem-mau',
      title: 'Kinh tế chính trị: Các phạm trù (Mẫu)',
      subject: 'Kinh tế chính trị Mác – Lênin',
      description: 'Định nghĩa các phạm trù hàng hóa, tiền tệ và giá trị thặng dư',
      contentType: 'theory',
      source: {
        document: 'Giáo trình Kinh tế chính trị Mác – Lênin',
      },
      items: [
        {
          id: 'ktct-th-01',
          type: 'theory',
          content: {
            concept: 'Hàng hóa',
            definition: 'Là sản phẩm của lao động, có thể thỏa mãn nhu cầu nào đó của con người thông qua trao đổi, mua bán.',
            points: [
              'Thuộc tính Giá trị sử dụng: công dụng thỏa mãn nhu cầu',
              'Thuộc tính Giá trị: lao động xã hội của người sản xuất kết tinh trong hàng hóa',
            ],
            explanation: 'Hàng hóa có hai thuộc tính cơ bản là giá trị sử dụng và giá trị.',
          },
        },
        {
          id: 'ktct-th-02',
          type: 'theory',
          content: {
            concept: 'Giá trị thặng dư (m)',
            definition: 'Là bộ phận giá trị mới dôi ra ngoài giá trị sức lao động do công nhân làm thuê tạo ra và bị nhà tư bản chiếm đoạt.',
            points: [
              'Nguồn gốc duy nhất của giá trị thặng dư là lao động sống của công nhân',
              'Phản ánh bản chất bóc lột của quan hệ sản xuất tư bản chủ nghĩa',
            ],
          },
        },
        {
          id: 'ktct-th-03',
          type: 'theory',
          content: {
            concept: 'Tiền tệ',
            definition: 'Là hàng hóa đặc biệt được tách ra làm vật ngang giá chung thống nhất cho các hàng hóa khác.',
            points: ['Thước đo giá trị', 'Phương tiện lưu thông', 'Phương tiện cất trữ', 'Phương tiện thanh toán', 'Tiền tệ thế giới'],
            explanation: 'Năm điểm trên là năm chức năng của tiền tệ.',
          },
        },
        {
          id: 'ktct-th-04',
          type: 'theory',
          content: {
            concept: 'Sức lao động',
            definition: 'Là toàn bộ những năng lực thể chất và tinh thần tồn tại trong một con người, được người đó vận dụng mỗi khi sản xuất ra một giá trị sử dụng nào đó.',
            points: [
              'Điều kiện 1: người lao động tự do về thân thể, làm chủ được sức lao động của mình',
              'Điều kiện 2: người lao động không có tư liệu sản xuất cần thiết nên buộc phải bán sức lao động để sống',
            ],
          },
        },
      ],
    },
  },
  {
    id: 'vocabulary',
    name: 'Từ vựng & Thuật ngữ',
    desc: 'Học từ ngữ chuyên ngành, thuật ngữ, phát âm và câu ví dụ. Có ví dụ chứa từ cần học thì app tự sinh bài điền chỗ trống. collocations và synonyms là tùy chọn.',
    badge: 'Có phát âm TTS',
    data: {
      id: 'tieng-anh-chuyen-nganh-mau',
      title: 'Tiếng Anh chuyên ngành (Mẫu)',
      subject: 'Tiếng Anh học thuật',
      description: 'Thuật ngữ và từ vựng học thuật thông dụng',
      contentType: 'vocabulary',
      items: [
        {
          id: 'voc-01',
          type: 'vocabulary',
          content: {
            term: 'Pragmatism',
            meaning: 'Chủ nghĩa thực dụng',
            partOfSpeech: 'noun',
            collocations: ['philosophical pragmatism', 'political pragmatism'],
            synonyms: ['practicality'],
            pronunciation: '/ˈpræɡ.mə.tɪ.zəm/',
            example: 'His political career was characterized by pragmatism rather than ideology.',
            translation: 'Sự nghiệp chính trị của ông được đặc trưng bởi tính thực dụng hơn là hệ tư tưởng.',
          },
        },
        {
          id: 'voc-02',
          type: 'vocabulary',
          content: {
            term: 'Hegemony',
            meaning: 'Quyền bá chủ, vị thế thống trị',
            partOfSpeech: 'noun',
            pronunciation: '/hɪˈɡem.ə.ni/',
            example: 'The nation sought cultural and economic hegemony in the region.',
          },
        },
      ],
    },
  },
  {
    id: 'programming',
    name: 'Lập trình (Code)',
    desc: 'Khái niệm kèm đoạn code minh họa, ngôn ngữ và ví dụ ứng dụng. Từ 4 mục trở lên app tự sinh thêm bài nối cặp và trắc nghiệm định nghĩa.',
    badge: 'Có code minh họa',
    data: {
      id: 'lap-trinh-co-ban-mau',
      title: 'Lập trình cơ bản (Mẫu)',
      subject: 'Lập trình',
      description: 'Các khái niệm nền tảng kèm đoạn code JavaScript minh họa',
      contentType: 'programming',
      items: [
        {
          id: 'lt-01',
          type: 'programming',
          content: {
            concept: 'Biến (variable)',
            definition: 'Là vùng nhớ có tên dùng để lưu một giá trị; giá trị này có thể thay đổi trong lúc chương trình chạy.',
            language: 'javascript',
            code: 'let count = 0\ncount = count + 1\nconsole.log(count) // 1',
            explanation: 'Từ khóa let khai báo biến; phép gán = đặt giá trị mới cho biến.',
            application: 'Lưu điểm số, bộ đếm, dữ liệu người dùng nhập vào.',
          },
        },
        {
          id: 'lt-02',
          type: 'programming',
          content: {
            concept: 'Vòng lặp for',
            definition: 'Là cấu trúc điều khiển lặp lại một khối lệnh theo điều kiện lặp cho trước.',
            language: 'javascript',
            code: 'for (let i = 0; i < 3; i++) {\n  console.log(i)\n}\n// in ra 0, 1, 2',
            application: 'Duyệt từng phần tử của danh sách, lặp một thao tác nhiều lần.',
          },
        },
        {
          id: 'lt-03',
          type: 'programming',
          content: {
            concept: 'Hàm (function)',
            definition: 'Là khối lệnh có tên, nhận đầu vào (tham số) và có thể trả về kết quả, giúp tái sử dụng mã.',
            language: 'javascript',
            code: 'function add(a, b) {\n  return a + b\n}\nadd(2, 3) // 5',
            application: 'Tách một việc lặp đi lặp lại thành một đơn vị gọi lại được.',
          },
        },
        {
          id: 'lt-04',
          type: 'programming',
          content: {
            concept: 'Mảng (array)',
            definition: 'Là cấu trúc dữ liệu lưu nhiều phần tử có thứ tự, truy cập từng phần tử bằng chỉ số bắt đầu từ 0.',
            language: 'javascript',
            code: "const names = ['An', 'Bình']\nnames[0] // 'An'",
          },
        },
      ],
    },
  },
  {
    id: 'mixed',
    name: 'Tổng hợp (Mixed)',
    desc: 'Kết hợp nhiều loại câu hỏi (Trắc nghiệm, Đúng/Sai, Khái niệm) trong cùng 1 bộ học.',
    badge: 'Đa dạng câu hỏi',
    data: {
      id: 'chu-nghia-xa-hoi-tong-hop-mau',
      title: 'CNXH Khoa học: Tổng hợp (Mẫu)',
      subject: 'Chủ nghĩa xã hội khoa học',
      description: 'Bộ câu hỏi kết hợp cả trắc nghiệm và định nghĩa lý thuyết',
      contentType: 'mixed',
      items: [
        {
          id: 'cnxh-m-01',
          type: 'multiple-choice',
          content: {
            question: 'Tác phẩm nào đánh dấu sự ra đời của Chủ nghĩa xã hội khoa học?',
            options: [
              { key: 'A', text: 'Tuyên ngôn của Đảng Cộng sản (1848)' },
              { key: 'B', text: 'Bộ Tư bản (1867)' },
              { key: 'C', text: 'Chống Đuy-rinh (1878)' },
              { key: 'D', text: 'Hệ tư tưởng Đức (1846)' },
            ],
            answer: 'A',
          },
        },
        {
          id: 'cnxh-m-02',
          type: 'true-false',
          content: {
            statement: 'Sứ mệnh lịch sử của giai cấp công nhân là xóa bỏ chế độ tư bản chủ nghĩa, xây dựng CNXH và CNCS.',
            answer: true,
          },
        },
      ],
    },
  },
]

export function downloadJsonFile(filename: string, data: object): void {
  const jsonStr = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
