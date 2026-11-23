export type EssayTopic =
  | 'Education'
  | 'Technology & AI'
  | 'Environment & Climate'
  | 'Society & Culture'
  | 'Economy & Globalization'
  | 'Health & Lifestyle'

export type EssayQuestionType =
  | 'Agree or Disagree'
  | 'Discuss Both Views'
  | 'Problem & Solution'
  | 'Advantages & Disadvantages'
  | 'Bar / Line Chart'

export interface ModelEssay {
  id: string
  taskType: 'Task 1' | 'Task 2'
  topic: EssayTopic
  questionType: EssayQuestionType
  bandScore: '7.0' | '7.5' | '8.0' | '8.5'
  title: string
  prompt: string
  wordCount: number
  essay: string
  vietnameseTranslation: string
  examinerCriteria: {
    tr: string // Task Response
    cc: string // Coherence & Cohesion
    lr: string // Lexical Resource
    gra: string // Grammatical Range & Accuracy
  }
  keyCollocations: { phrase: string; meaningVi: string }[]
  structuralTakeaways: string[]
}

export const ESSAY_BANK: ModelEssay[] = [
  {
    id: 'essay-task2-ai-workplace',
    taskType: 'Task 2',
    topic: 'Technology & AI',
    questionType: 'Discuss Both Views',
    bandScore: '8.5',
    title: 'Artificial Intelligence & The Future of Human Employment',
    prompt:
      'Some people believe that artificial intelligence will eliminate millions of jobs and destabilize the economy, while others argue it will foster innovation and create more fulfilling career opportunities. Discuss both views and give your own opinion.',
    wordCount: 288,
    essay: `The proliferation of artificial intelligence into the modern workforce has elicited widespread apprehension alongside optimistic anticipation. While detractors caution that algorithmic automation could precipitate unprecedented waves of unemployment, proponents contend that technological disruption historically catalyzes novel economic frontiers. In my view, although robotic and digital automation will inevitably render certain repetitive occupations obsolete, it will ultimately generate high-value professions and amplify human productivity.

On the one hand, justifiable anxiety surrounds the displacement of low-skilled and administrative labor. Machine learning models and automated assembly lines have already begun superseding human workers in routine data processing, telemarketing, and manufacturing. Unlike prior mechanical revolutions, cognitive automation now threatens white-collar vocations, such as financial analysis and paralegal research. Consequently, without proactive government-funded reskilling initiatives, marginalized demographics may experience prolonged socioeconomic disenfranchisement.

On the other hand, technological progress functions as an indispensable catalyst for employment diversification. Historically, the advent of computing eradicated manual bookkeeping but spawned massive software, cybersecurity, and digital marketing ecosystems. Similarly, AI implementation liberates professionals from tedious administrative overhead, empowering them to focus on creative synthesis, ethical governance, and complex strategic negotiation—domains where human empathy and critical discernment remain unassailable. Furthermore, entirely new specialized industries, including prompt engineering and robotic maintenance, are burgeoning rapidly.

In conclusion, while the transitional phase will pose acute socioeconomic friction for displaced workers, artificial intelligence is far from a harbinger of universal redundancy. If governments prioritize lifelong retraining curricula, this technological leap will usher in an era of enhanced professional fulfillment and societal prosperity.`,
    vietnameseTranslation:
      'Su pho bien cua tri tue nhan tao vao luc luong lao dong hien dai da lam day len su lo ngai sau sac ben canh nhung ky vong lac quan. Mac du nhung nguoi chi trich canh bao rang tu dong hoa bang thuat toan co the gay ra nhung lan song that nghiep chua tung co, nhung nguoi ung ho lai lap luan rang su dot pha cong nghe trong lich su luon thuc day nhung linh vuc kinh te moi...',
    examinerCriteria: {
      tr: 'Luan diem hai chieu duoc phan tich can bang va ket luan the hien quan diem ro rang xuyen suot bai viet.',
      cc: 'Lien ket y chat che voi cac tu noi hoc thuat (On the one hand, Consequently, On the other hand, Similarly).',
      lr: 'Von tu vung Band 8.5 xuat sac: algorithmic automation, precipitate unprecedented waves, socioeconomic disenfranchisement, unassailable, harbinger of universal redundancy.',
      gra: 'Su dung da dang menh de quan he, the bi dong hoc thuat va cau dao ngu dieu kien.',
    },
    keyCollocations: [
      { phrase: 'algorithmic automation', meaningVi: 'tu dong hoa bang thuat toan' },
      { phrase: 'precipitate waves of unemployment', meaningVi: 'gay ra cac dot song that nghiep' },
      { phrase: 'socioeconomic disenfranchisement', meaningVi: 'su thiet thoi ve kinh te xa hoi' },
      { phrase: 'indispensable catalyst', meaningVi: 'chat xuc tac khong the thieu' },
      { phrase: 'harbinger of universal redundancy', meaningVi: 'diem bao cua su du thua lao dong toan dien' },
    ],
    structuralTakeaways: [
      'Mo bai: Paraphrase de thi -> Neu 2 luong quan diem -> Dua ra Thesis Statement ro rang.',
      'Than bai 1: Phan tich mat tieu cuc/nguy co mat viec lam voi dan chung cu the tu van phong toi nha may.',
      'Than bai 2: Phan tich mat tich cuc/co hoi moi va vai tro khong the thay the cua con nguoi ve mat cam xuc.',
      'Ket bai: Khang dinh lai quan diem tong the va de xuat giai phap dao tao lai ky nang cho xa hoi.',
    ],
  },
  {
    id: 'essay-task2-higher-education',
    taskType: 'Task 2',
    topic: 'Education',
    questionType: 'Agree or Disagree',
    bandScore: '8.0',
    title: 'University Tuition Fees & Free Tertiary Education',
    prompt:
      'Some people believe that tertiary education should be fully funded by the state for all citizens, regardless of their financial background. To what extent do you agree or disagree?',
    wordCount: 274,
    essay: `The proposition that higher education ought to be universally accessible free of charge has ignited intense pedagogical and fiscal debates. While proponents highlight that tuition-free tertiary education promotes social mobility and equal opportunities, I predominantly disagree with state-funded universal waivers because it imposes an unsustainable fiscal burden on taxpayers and compromises academic quality.

Admittedly, eliminating tuition barrier provides underprivileged scholars with an egalitarian pathway to professional advancement. Talented individuals from impoverished socio-economic strata are frequently deterred by exorbitant tuition debts, which perpetuates generational wealth disparities. By granting tuition exemptions, governments can unleash dormant intellectual capital and cultivate a meritocratic knowledge-based economy.

Nevertheless, universal state funding entails severe economic repercussions. Universities require colossal capital expenditures for cutting-edge laboratories, digital libraries, and competitive professorial salaries. If the government shoulders these expenses entirely, it inevitably necessitates substantial taxation hikes or the reallocation of public revenues away from essential sectors like healthcare and public transit. Furthermore, when degrees become entirely costless, graduation rates often drop due to perceived lack of personal financial accountability.

A more pragmatic alternative lies in means-tested scholarship frameworks. Rather than subsidizing affluent households that are fully capable of financing their education, public expenditure should be channeled specifically towards targeted bursaries and income-contingent student loans. This approach reconciles educational equity with fiscal prudence.

In conclusion, although the concept of universal free higher education possesses noble egalitarian ideals, it is practically unviable. Governments should instead implement targeted bursaries to empower underprivileged talent without compromising macroeconomic stability.`,
    vietnameseTranslation:
      'Quan diem cho rang giao duc dai hoc nen duoc mien phi hoan toan cho tat ca cong dan da thoi bung nhung cuoc tranh luan gay gat. Mac du nhung nguoi ung ho nhan manh viec mien hoc phi thuc day su dich chuyen xa hoi, toi phan lon khong dong tinh vi no tao ra ganh nang ngan sach khong the duy tri va lam suy giam chat luong giang day...',
    examinerCriteria: {
      tr: 'Giai quyet triet de de bai Agree or Disagree voi lap truong "predominantly disagree" dut khoat tu mo bai den ket bai.',
      cc: 'Luan diem phan bien duoc sap xep logic: thua nhan mat tich cuc (Admittedly) truoc khi bac bo bang he qua kinh te (Nevertheless).',
      lr: 'Cac cum tu Band 8.0+: egalitarian pathway, exorbitant tuition debts, dormant intellectual capital, fiscal prudence, macroeconomic stability.',
      gra: 'Cau truc phuc hop, su dung menh de rut gon va danh tu hoa dieu luyen.',
    },
    keyCollocations: [
      { phrase: 'egalitarian pathway', meaningVi: 'con duong mang tinh binh dang xa hoi' },
      { phrase: 'exorbitant tuition debts', meaningVi: 'khoan no hoc phi cat co' },
      { phrase: 'dormant intellectual capital', meaningVi: 'nguon von tri tue dang bi bo quen' },
      { phrase: 'fiscal prudence', meaningVi: 'su than trong ve mat tai khoa/ngan sach' },
      { phrase: 'macroeconomic stability', meaningVi: 'su on dinh kinh te vi mo' },
    ],
    structuralTakeaways: [
      'Mo bai: Neu van de hoc phi -> Dua ra lap truong ro rang: predominantly disagree.',
      'Than bai 1: Nhuong bo (Admittedly) thua nhan loi ich cua viec giup sinh vien ngheo.',
      'Than bai 2: Phan bien (Nevertheless) neu ra ganh nang thue va suy giam co so vat chat.',
      'Than bai 3: De xuat giai phap can bang (Pragmatic alternative) - cap hoc bong theo gia canh (means-tested).',
      'Ket bai: Khang dinh lai su can thiet cua giai phap hoc bong co muc tieu.',
    ],
  },
  {
    id: 'essay-task1-energy-transition',
    taskType: 'Task 1',
    topic: 'Environment & Climate',
    questionType: 'Bar / Line Chart',
    bandScore: '8.0',
    title: 'European Renewable Energy Consumption (2000-2020)',
    prompt:
      'The graph below compares the percentage of total electricity consumed from renewable sources in four European countries between 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    wordCount: 172,
    essay: `The line graph delineates the proportion of electricity consumption derived from renewable energy resources across four European nations—namely Denmark, Germany, Spain, and the United Kingdom—over a twenty-year period starting from 2000.

Overall, it is immediately apparent that all four countries witnessed sustained upward trajectories in clean energy reliance throughout the timeframe. Denmark maintained an unassailable supremacy in renewable consumption, whereas the United Kingdom registered the most dramatic acceleration despite initiating from the lowest baseline.

In 2000, Denmark was the clear front-runner, generating approximately 28% of its power renewably, before ascending steadily to reach nearly 58% by 2020. Germany and Spain displayed closely parallel trajectories: both began around 10% to 14% and climbed steadily to plateau around 40% and 38% respectively.

Conversely, the United Kingdom recorded a negligible renewable share of less than 3% in 2000. However, propelled by massive offshore wind infrastructure investments, British green electricity generation surged precipitously after 2010, culminating at approximately 36% in 2020 and effectively bridging the historical deficit with Spain.`,
    vietnameseTranslation:
      'Bieu do duong mieu ta ty le tieu thu dien nang co nguon goc tu nang luong tai tao o bon quoc gia chau Au gom Dan Mach, Duc, Tay Ban Nha va Vuong quoc Anh trong vong 20 nam tu nam 2000...',
    examinerCriteria: {
      tr: 'Tong quan (Overview) xuat sac voi 2 dac diem then chot: xu huong tang chung va Dan Mach luon dan dau trong khi Anh tang truong manh nhat.',
      cc: 'Bao cao so lieu duoc nhom hop ly: nhom Dan Mach, Duc, Tay Ban Nha o than bai 1 va nhom dot pha (Anh) o than bai 2.',
      lr: 'Ngon ngu miêu ta bieu do Band 8.0: sustained upward trajectories, unassailable supremacy, parallel trajectories, negligible share, surged precipitously.',
      gra: 'Menh de phuc, cau noi phu gia va su dung linh hoat cac moc thoi gian.',
    },
    keyCollocations: [
      { phrase: 'sustained upward trajectories', meaningVi: 'quy dao tang truong ben vung' },
      { phrase: 'unassailable supremacy', meaningVi: 'vi the dan dau tuyet doi khong the xo do' },
      { phrase: 'parallel trajectories', meaningVi: 'cac quy dao dien bien song song' },
      { phrase: 'negligible share', meaningVi: 'ty le khong dang ke' },
      { phrase: 'surged precipitously', meaningVi: 'tang vot dot bien' },
    ],
    structuralTakeaways: [
      'Mo bai: Paraphrase de bai mau muc (delineates the proportion of electricity consumption derived from...).',
      'Overview: Bat buoc neu duoc 2 diem: Xu huong chung cua ca 4 nuoc + Nuoc cao nhat/tang manh nhat.',
      'Than bai 1: Chi tiet nuoc dan dau va cac nuoc co xu huong giong nhau (Dan Mach, Duc, Tay Ban Nha).',
      'Than bai 2: Chi tiet nuoc co su khac biet hoac bứt pha dot bien (Vuong quoc Anh).',
    ],
  },
]

export function filterEssays(filters: {
  taskType?: string
  topic?: string
  bandScore?: string
  query?: string
}): ModelEssay[] {
  return ESSAY_BANK.filter((essay) => {
    if (filters.taskType && filters.taskType !== 'All' && essay.taskType !== filters.taskType) {
      return false
    }
    if (filters.topic && filters.topic !== 'All' && essay.topic !== filters.topic) {
      return false
    }
    if (filters.bandScore && filters.bandScore !== 'All' && essay.bandScore !== filters.bandScore) {
      return false
    }
    if (filters.query && filters.query.trim()) {
      const q = filters.query.toLowerCase().trim()
      const match =
        essay.title.toLowerCase().includes(q) ||
        essay.prompt.toLowerCase().includes(q) ||
        essay.essay.toLowerCase().includes(q) ||
        essay.keyCollocations.some((c) => c.phrase.toLowerCase().includes(q) || c.meaningVi.toLowerCase().includes(q))
      if (!match) return false
    }
    return true
  })
}
