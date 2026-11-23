export interface SpeakingPart1Topic {
  id: string
  topic: string
  questions: {
    question: string
    modelAnswer: string
    translation: string
    keyVocab: string[]
  }[]
  examinerTip: string
}

export interface SpeakingPart2CueCard {
  id: string
  title: string
  cuePrompt: string
  bulletPoints: string[]
  preparationTimeSeconds: number
  speakingTimeSeconds: number
  frameworkGuide: {
    part: string
    prompt: string
  }[]
  modelAnswer: string
  translation: string
  bandScore: string
  lexicalHighlights: string[]
}

export const SPEAKING_PART1_TOPICS: SpeakingPart1Topic[] = [
  {
    id: 'sp1-tech',
    topic: 'Artificial Intelligence & Technology',
    examinerTip: 'Su dung thi hien tai hoan thanh de noi ve su thay doi va dua ra vi du thuc te tu cuoc song hang ngay.',
    questions: [
      {
        question: 'Do you often use artificial intelligence tools in your daily study?',
        modelAnswer: 'Yes, absolutely. AI assistants have become an indispensable part of my study routine. I regularly utilize them to summarize dense academic papers, brainstorm research outlines, and clarify complex theoretical concepts.',
        translation: 'Vang, chac chan roi. Cac cong cu AI da tro thanh mot phan khong the thieu trong thoi quen hoc tap cua toi. Toi thuong xuyen su dung chung de tom tat cac bai bao khoa hoc hoc thuat, phac thao de cuong nghien cuu va lam sang to cac khai niem ly thuyet phuc tap.',
        keyVocab: ['indispensable part', 'dense academic papers', 'brainstorm outlines', 'theoretical concepts'],
      },
      {
        question: 'Do you think AI will replace human teachers in the future?',
        modelAnswer: 'In my perspective, it is highly unlikely. While artificial intelligence can effectively deliver factual information and automate grading, it fundamentally lacks emotional empathy, moral mentorship, and the ability to inspire students.',
        translation: 'Theo quan diem cua toi, dieu do rat kho xay ra. Mac du tri tue nhan tao co the truyen dat thong tin xac thuc va cham diem tu dong mot cach hieu qua, no can ban thieu su dong cam cam xuc, su dinh huong dao duc va kha nang truyen cam hung cho hoc sinh.',
        keyVocab: ['highly unlikely', 'factual information', 'emotional empathy', 'moral mentorship'],
      },
    ],
  },
  {
    id: 'sp1-study',
    topic: 'Work & Academic Routine',
    examinerTip: 'Tranh tra loi cu cut co 1 cau. Hay mo rong bang ly do, cam xuc hoac du dinh tuong lai.',
    questions: [
      {
        question: 'What do you find most demanding about your current course?',
        modelAnswer: 'Undoubtedly, the sheer volume of reading materials and the tight deadlines for semester essays. Balancing rigorous analytical coursework with practical project assignments requires exceptional time management.',
        translation: 'Khong con nghi ngo gi, khoi luong tai lieu doc do so va cac han chot nop tieu luan gap gap la ap luc nhat. Viec can bang giua cac mon hoc phan tich chuyen sau voi cac bai tap du an thuc te doi hoi ky nang quan ly thoi gian vuot troi.',
        keyVocab: ['sheer volume', 'rigorous coursework', 'exceptional time management'],
      },
      {
        question: 'Do you prefer studying alone or in a study group?',
        modelAnswer: 'I lean towards studying independently when tackling intricate concepts that require deep concentration. However, collaborative study sessions are truly invaluable for peer feedback and brainstorming alternative viewpoints.',
        translation: 'Toi thien ve tu hoc mot minh khi giai quyet cac khai niem phuc tap can su tap trung cao do. Tuy nhien, cac buoi hoc nhom hop tac lai rat vo gia de nhan gop y tu ban be va tim kiem cac goc nhin moi.',
        keyVocab: ['lean towards', 'intricate concepts', 'deep concentration', 'invaluable for peer feedback'],
      },
    ],
  },
]

export const SPEAKING_PART2_CUE_CARDS: SpeakingPart2CueCard[] = [
  {
    id: 'sp2-speech',
    title: 'An Impressive Presentation or Speech',
    cuePrompt: 'Describe an impressive presentation or speech that you attended.',
    bulletPoints: [
      'Who the speaker was',
      'What the topic was about',
      'Where and when you heard it',
      'And explain why it left a profound impression on you',
    ],
    preparationTimeSeconds: 60,
    speakingTimeSeconds: 120,
    frameworkGuide: [
      { part: 'Introduction (15s)', prompt: 'Name the speaker, event, and general topic.' },
      { part: 'Setting the Scene (30s)', prompt: 'Describe the venue, atmosphere, and the audience expectation.' },
      { part: 'Core Message (45s)', prompt: 'Detail the compelling points, charismatic delivery, and visual aids.' },
      { part: 'Personal Reflection (30s)', prompt: 'Explain the lasting takeaway and how it reshaped your mindset.' },
    ],
    modelAnswer: 'I would like to talk about an exceptional presentation delivered by a renowned environmental scientist at our university annual symposium last year. The keynote address focused on accelerating renewable energy adoption in developing nations. What struck me most was not just the speaker authoritative command of quantitative data, but his captivating delivery. Rather than bombarding the audience with overwhelming statistics, he wove real-world case studies into a cohesive narrative. He illustrated vividly how solar micro-grids transformed remote mountainous villages. By the conclusion, the entire auditorium gave a standing ovation. This speech profoundly shifted my perspective on sustainable technology, proving that innovative solutions can bridge socioeconomic disparities.',
    translation: 'Toi xin chia se ve mot bai thuyet trinh xuat sac cua mot nha khoa hoc moi truong danh tieng tai hoi thao thuong nien cua truong toi nam ngoai. Bai phat bieu chu dao tap trung vao viec day nhanh ung dung nang luong tai tao o cac quoc gia dang phat trien. Dieu gay an tuong nhat khong chi la su am hieu chuyen sau ve du lieu ma con o phong cach truyen dat loi cuon...',
    bandScore: 'Band 8.0+',
    lexicalHighlights: ['exceptional presentation', 'keynote address', 'authoritative command', 'captivating delivery', 'standing ovation', 'socioeconomic disparities'],
  },
  {
    id: 'sp2-problem',
    title: 'A Challenging Obstacle You Overcame',
    cuePrompt: 'Describe a difficult problem you encountered and successfully resolved.',
    bulletPoints: [
      'What the problem was',
      'When and how it arose',
      'What steps you took to tackle it',
      'And explain how you felt once it was solved',
    ],
    preparationTimeSeconds: 60,
    speakingTimeSeconds: 120,
    frameworkGuide: [
      { part: 'Context & Difficulty (20s)', prompt: 'What was at stake and why was it challenging?' },
      { part: 'Action Plan (50s)', prompt: 'Break down the analytical and practical steps taken.' },
      { part: 'Turning Point (20s)', prompt: 'How was the deadlock broken?' },
      { part: 'Outcome & Learning (30s)', prompt: 'Describe the sense of relief and lifelong lesson gained.' },
    ],
    modelAnswer: 'A notable challenge that comes to mind occurred during our final semester capstone project. Our team was developing an automated data processing system, but two weeks prior to submission, a critical software glitch caused severe data corruption. Tensions ran high and morale plummeted. Realizing that panic would yield nothing, I organized an emergency triage session. We methodically isolated the faulty algorithmic components and established a continuous version control protocol. Working around the clock, we re-architected the database queries and verified every edge case. Overcoming this hurdle was an immensely gratifying milestone that taught me resilience and composure under immense pressure.',
    translation: 'Mot thu thach dang chu y ma toi nho toi la trong du an tot nghiep hoc ky cuoi. Nhom chung toi phat trien he thong xu ly du lieu tu dong, nhung chi hai tuan truoc ngay nop, mot loi phan mem nghiem trong da lam hong toan bo du lieu. Bang cach binh tinh lap ke hoach xu ly tung thanh phan thuat toan...',
    bandScore: 'Band 8.0+',
    lexicalHighlights: ['notable challenge', 'capstone project', 'morale plummeted', 'emergency triage', 'methodically isolated', 'immensely gratifying'],
  },
]

// Speech recognition helper
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
}

export function computePronunciationAccuracy(spoken: string, reference: string): {
  accuracy: number
  matchedWords: string[]
  missingWords: string[]
} {
  const cleanSpoken = spoken.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean)
  const cleanRef = reference.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean)

  if (!cleanRef.length) return { accuracy: 0, matchedWords: [], missingWords: [] }

  const spokenSet = new Set(cleanSpoken)
  const matchedWords: string[] = []
  const missingWords: string[] = []

  for (const w of cleanRef) {
    if (spokenSet.has(w)) {
      matchedWords.push(w)
    } else {
      missingWords.push(w)
    }
  }

  const accuracy = Math.round((matchedWords.length / cleanRef.length) * 100)
  return { accuracy, matchedWords, missingWords }
}
