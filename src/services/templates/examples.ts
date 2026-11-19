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
    desc: 'Hỗ trợ cả câu hỏi chọn 1 đáp án (A) hoặc chọn nhiều đáp án đúng (AB).',
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
          source: { ref: 'Câu 1' },
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
    desc: 'Học định nghĩa, nguyên lý và luận điểm chính. Tự động sinh bài tập nối cặp (Matching).',
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
      ],
    },
  },
  {
    id: 'vocabulary',
    name: 'Từ vựng & Thuật ngữ',
    desc: 'Học từ ngữ chuyên ngành, thuật ngữ, phát âm và câu ví dụ ứng dụng.',
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
