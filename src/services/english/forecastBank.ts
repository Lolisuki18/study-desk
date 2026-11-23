export interface ForecastTopic {
  id: string
  quarter: string
  category: 'Speaking Part 1' | 'Speaking Part 2' | 'Writing Task 2'
  topicName: string
  tag: 'HOT' | 'New' | 'High Frequency'
  frequencyScore: number
  prompt: string
  bulletPoints?: string[]
  band7Model: string
  band8Model: string
  vietnameseTranslation: string
  highlightedCollocations: { term: string; meaningVi: string }[]
  examinerTips: string
}

export const FORECAST_TOPICS: ForecastTopic[] = [
  {
    id: 'fc-sp2-crowded-place',
    quarter: 'Q1-Q2 2026 Forecast',
    category: 'Speaking Part 2',
    topicName: 'A Memorable Crowded Place',
    tag: 'HOT',
    frequencyScore: 94,
    prompt: 'Describe a crowded place you visited that left an impression on you.',
    bulletPoints: [
      'Where the place is located',
      'When you went there and who you were with',
      'What activities people were doing',
      'And explain how you felt being in that crowded environment',
    ],
    band7Model:
      'I would like to describe Ben Thanh Night Market in Ho Chi Minh City. I went there with my college friends during our summer vacation. The market was packed with domestic tourists and foreign travelers browsing street food stalls and souvenir shops. Although the vibrant atmosphere was energetic, the stifling humidity and loud bargaining made me feel somewhat overwhelmed after two hours.',
    band8Model:
      'I would like to recount my visit to the bustling Ben Thanh Market in the heart of Ho Chi Minh City during the lunar festive season. Stepping into the labyrinthine alleys, I was instantly engulfed by a kaleidoscopic sensory overload: aromatic culinary aromas wafting from sizzling street stalls, incandescent lantern illuminations, and the melodic cadence of local vendors negotiating prices. Navigating through the shoulder-to-shoulder throng was initially claustrophobic, yet the infectious communal camaraderie transformed the experience into an exhilarating celebration of metropolitan vibrancy.',
    vietnameseTranslation:
      'Toi muon ke ve chuyen tham cho Ben Thanh nhon nhip o trung tam TP.HCM vao dip Tet. Buoc vao nhung con hem ngoan ngoeo, toi lap tuc bi cuon vao mot bua tiec giac quan da sac mau: mui thuc an thom lung tu cac quay bep lua, anh den long ruc ro va nhip dieu mac ca day am vang...',
    highlightedCollocations: [
      { term: 'labyrinthine alleys', meaningVi: 'nhung con hem quanh co nhu me cung' },
      { term: 'kaleidoscopic sensory overload', meaningVi: 'su qua tai giac quan da sac mau' },
      { term: 'aromatic culinary aromas', meaningVi: 'huong vi am thuc thom lung' },
      { term: 'shoulder-to-shoulder throng', meaningVi: 'dam dong chen chuc vai sat vai' },
      { term: 'metropolitan vibrancy', meaningVi: 'su song dong cua do thi lon' },
    ],
    examinerTips:
      'Tranh dung cac tinh tu co ban nhu "very crowded", "very noisy". Thay vao do, hay mieu ta da giac quan (am thanh, mui vi, thi giac) nhu kaleidoscopic, labyrinthine, aromatic.',
  },
  {
    id: 'fc-sp1-video-games',
    quarter: 'Q1-Q2 2026 Forecast',
    category: 'Speaking Part 1',
    topicName: 'Video Games & Digital Entertainment',
    tag: 'New',
    frequencyScore: 88,
    prompt: 'Do you often play video games in your leisure time?',
    band7Model:
      'Yes, I enjoy playing video games on weekends. It helps me relax after exhausting classes and allows me to connect with friends remotely through cooperative multiplayer matches.',
    band8Model:
      'To be entirely candid, I periodically indulge in story-driven video games as an avenue for cognitive decompression. Immersing myself in interactive virtual narratives enables me to temporarily disconnect from academic pressures, whilst fostering strategic problem-solving and rapid reflexes.',
    vietnameseTranslation:
      'Thanh that ma noi, toi thi thoang dam chim vao cac tua game co cot truyen sau sac nhu mot lieu thuoc giai toa nhan thuc. Viec hoa minh vao cac the gioi tuong tac giup toi tam gac lai ap luc hoc tap, dong thoi ren luyen tu duy chien luoc va phan xa nhanh.',
    highlightedCollocations: [
      { term: 'cognitive decompression', meaningVi: 'su giai toa ap luc nhan thuc/tinh than' },
      { term: 'interactive virtual narratives', meaningVi: 'cot truyen tuong tac the gioi ao' },
      { term: 'strategic problem-solving', meaningVi: 'tu duy giai quyet van de chien luoc' },
    ],
    examinerTips:
      'Mo dau tu nhien voi cac cum conversational fillers: "To be entirely candid", "I periodically indulge in".',
  },
  {
    id: 'fc-wt2-remote-work',
    quarter: 'Q1-Q2 2026 Forecast',
    category: 'Writing Task 2',
    topicName: 'Remote Work vs Office Attendance',
    tag: 'High Frequency',
    frequencyScore: 96,
    prompt:
      'In many countries, an increasing number of companies are allowing employees to work remotely from home rather than attending physical offices. Do the advantages of this trend outweigh the disadvantages?',
    band7Model:
      'Remote work provides remarkable flexibility and reduces commuting expenses for staff. However, prolonged telecommuting can blur work-life boundaries and diminish corporate team unity. Overall, the benefits in productivity outweigh these drawbacks if appropriate communication protocols are maintained.',
    band8Model:
      'The paradigm shift towards telecommuting has restructured contemporary corporate culture. While virtual employment risks eroding workplace cohesion and precipitating sedentary isolation, I am firmly convinced that its socioeconomic merits—specifically substantial temporal savings, reduced overhead expenditures, and geographic recruitment flexibility—substantially outweigh the associated shortcomings.',
    vietnameseTranslation:
      'Su thay doi mo hinh sang lam viec tu xa da tai cau truc van hoa doanh nghiep hien dai. Mac du viec lam ao co the lam suy giam su gan ket dong doi va gay ra su co lap it van dong, toi hoan toan tin rang cac loi ich ve kinh te xa hoi - dac biet la tiet kiem thoi gian, cat giam chi phi van hanh va linh hoat tuyen dung - vuot troi hon han cac bat cap.',
    highlightedCollocations: [
      { term: 'paradigm shift', meaningVi: 'su thay doi mo hinh mang tinh buoc ngoat' },
      { term: 'eroding workplace cohesion', meaningVi: 'lam suy giam su gan ket noi lam viec' },
      { term: 'sedentary isolation', meaningVi: 'su co lap it van dong' },
      { term: 'overhead expenditures', meaningVi: 'chi phi quan ly van hanh' },
    ],
    examinerTips:
      'Voi dang bai "Do advantages outweigh disadvantages?", can dua ra ket luan dut khoat (substantially outweigh) va danh gia ca 2 mat theo ty le 60/40 hoac 70/30.',
  },
]
