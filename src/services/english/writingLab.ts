export interface WritingPrompt {
  id: string
  taskType: 'Task 1' | 'Task 2'
  title: string
  prompt: string
  targetWordCount: number
  recommendedMinutes: number
  modelOutline: {
    section: string
    focus: string
  }[]
  band8Sample: string
  modelHighlights: string[]
}

export interface ParaphraseDrill {
  id: string
  original: string
  strategy: string
  modelAnswer: string
  keyElements: string[]
  explanation: string
}

export const WRITING_PROMPTS: WritingPrompt[] = [
  {
    id: 'wp-task2-tech',
    taskType: 'Task 2',
    title: 'Technology & Social Isolation',
    prompt: 'Some people argue that technological advancements have isolated individuals from authentic social interactions, while others believe technology has fostered unprecedented global connectivity. Discuss both views and give your own opinion.',
    targetWordCount: 250,
    recommendedMinutes: 40,
    modelOutline: [
      { section: 'Introduction (approx. 40 words)', focus: 'Paraphrase the prompt & state a clear balanced thesis statement.' },
      { section: 'Body Paragraph 1 (approx. 90 words)', focus: 'Discuss how screen dependency and superficial online interactions erode real-life bonding.' },
      { section: 'Body Paragraph 2 (approx. 90 words)', focus: 'Discuss how digital platforms transcend geographic borders to unite communities and empower education.' },
      { section: 'Conclusion (approx. 40 words)', focus: 'Reiterate thesis with a synthesis of mindful technological adoption.' },
    ],
    band8Sample: `The pervasive integration of digital technology into contemporary life has sparked intense debate regarding its social repercussions. While detractors contend that screen saturation breeds emotional alienation, proponents argue that digital communication bridges geographical divides. In my view, although excessive virtual immersion undoubtedly erodes face-to-face interpersonal rapport, technology fundamentally acts as an empowering conduit for global solidarity when utilized with deliberate moderation.

On the one hand, excessive reliance on digital devices can precipitate acute social atomization. Modern communication often favors brief, curated interactions on social media platforms over spontaneous, nuanced dialogue. Consequently, individuals frequently experience psychological isolation despite being perpetually connected. Furthermore, the addictive design of algorithmic feeds diverts valuable hours away from communal activities and familial bonding, thereby diminishing authentic conversational competence among younger generations.

On the other hand, technological advancements have democratized human connection across unprecedented distances. Online platforms enable geographically dispersed diaspora communities to preserve their cultural heritage and maintain vital connections with kin. Moreover, collaborative educational forums and digital support groups provide an indispensable sanctuary for marginalized populations who might otherwise lack empathetic local companionship. Remote collaboration tools have similarly proven that international partnerships can flourish seamlessly without physical proximity.

In conclusion, while unrestricted screen usage poses undeniable hazards to organic interpersonal interactions, technology itself remains an extraordinary instrument of cohesion. The pivotal imperative lies not in rejecting digital progress, but in cultivating digital mindfulness to preserve genuine human empathy alongside virtual efficiency.`,
    modelHighlights: ['pervasive integration', 'social repercussions', 'emotional alienation', 'empowering conduit', 'social atomization', 'curated interactions', 'psychological isolation', 'democratized human connection', 'indispensable sanctuary', 'digital mindfulness'],
  },
  {
    id: 'wp-task1-energy',
    taskType: 'Task 1',
    title: 'Renewable Electricity Generation (2000-2020)',
    prompt: 'The chart details the proportion of electricity produced from renewable energy sources across four European nations between 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    targetWordCount: 150,
    recommendedMinutes: 20,
    modelOutline: [
      { section: 'Introduction & Overview', focus: 'Paraphrase prompt & highlight key trends (overall upward trajectory for all countries).' },
      { section: 'Detail Paragraph 1', focus: 'Analyze the leading nations (e.g. Germany and Denmark) with specific percentages.' },
      { section: 'Detail Paragraph 2', focus: 'Compare the moderate or lagging nations with contrasting linkers.' },
    ],
    band8Sample: `The bar chart illustrates the percentage of electrical power generated from renewable alternatives across four European nations—namely Germany, Denmark, Spain, and the United Kingdom—over a twenty-year period from 2000 to 2020.

Overall, it is immediately apparent that all four countries experienced substantial upward trajectories in their clean energy adoption. Denmark consistently dominated the cohort throughout the entire timeframe, while the United Kingdom exhibited the most dramatic acceleration despite starting from the lowest base.

In 2000, Denmark generated approximately 25% of its electricity through renewables, a figure that climbed steadily to surpass 50% by 2020. Germany and Spain followed a comparable upward momentum, rising from roughly 12% and 15% in 2000 to approximately 40% and 38% respectively by the end of the survey period.

In stark contrast, the United Kingdom began with a negligible renewable share of just 3% in 2000. However, spurred by massive offshore wind investments, British renewable production surged precipitously to reach 35% in 2020, effectively bridging the statistical disparity with Spain and Germany.`,
    modelHighlights: ['upward trajectories', 'consistently dominated', 'dramatic acceleration', 'lowest base', 'upward momentum', 'in stark contrast', 'negligible renewable share', 'surged precipitously', 'bridging the statistical disparity'],
  },
]

export const ACADEMIC_WORD_LIST: string[] = [
  'substantial', 'phenomenon', 'predominantly', 'consequently', 'furthermore',
  'nevertheless', 'diminish', 'detrimental', 'beneficial', 'correlation',
  'underlying', 'facilitate', 'advocate', 'disparity', 'inevitable',
  'comprehensive', 'implement', 'accelerate', 'mitigate', 'paradigm',
  'resilience', 'paramount', 'crucial', 'proportion', 'fluctuation',
  'precipitous', 'counterpart', 'divergence', 'preponderance', 'unprecedented',
  'repercussions', 'manifest', 'empirical', 'indispensable', 'profoundly',
  'catalyst', 'intrinsic', 'pervasive', 'atomization', 'conduit',
  'democratized', 'mindfulness', 'sanctuary', 'cohesion', 'imperative',
]

export const INFORMAL_WARNINGS: { phrase: string; alternative: string; explanation: string }[] = [
  { phrase: 'a lot of', alternative: 'a substantial number of / a considerable amount of', explanation: 'Cum tu qua thong tuc trong van viet hoc thuat.' },
  { phrase: 'lots of', alternative: 'a great deal of / numerous', explanation: 'Nen thay bang cac tu chi so luong mang tinh hoc thuat.' },
  { phrase: 'kids', alternative: 'children / adolescents / youth', explanation: 'Tu ngu giao tiep hang ngay, tranh dung trong Writing Task 1 & 2.' },
  { phrase: 'good', alternative: 'beneficial / advantageous / favorable / commendable', explanation: 'Tu qua chung chung, hay dung tinh tu hoc thuat chinh xac hon.' },
  { phrase: 'bad', alternative: 'detrimental / adverse / deleterious / catastrophic', explanation: 'Tu qua so sai va mo nhat trong tieu luan hoc thuat.' },
  { phrase: 'stuff', alternative: 'aspects / factors / components / materials', explanation: 'Khong bao gio dung stuff trong IELTS Academic Writing.' },
  { phrase: 'things', alternative: 'elements / issues / dimensions / variables', explanation: 'Nen chi ro ban chat cu the thay vi dung thing/things mo ho.' },
  { phrase: 'really', alternative: 'profoundly / significantly / remarkably / extraordinarily', explanation: 'Trang tu really thuong chi hop voi van noi.' },
  { phrase: 'very', alternative: 'exceedingly / substantially / inherently', explanation: 'Luyen tap dung cac dong tu hoac tinh tu manh thay vi them very.' },
  { phrase: 'gonna', alternative: 'going to', explanation: 'Tieng long van noi tuyet doi tranh.' },
  { phrase: 'wanna', alternative: 'want to / wish to', explanation: 'Tieng long van noi tuyet doi tranh.' },
  { phrase: 'nowadays', alternative: 'in contemporary society / in recent decades', explanation: 'Nowadays bi giam khao danh gia la sao chep rap khuon, ton kem vi the.' },
  { phrase: 'in a nutshell', alternative: 'in conclusion / to synthesize', explanation: 'Thanh ngu thong tuc qua than mat, khong hop Academic Writing.' },
  { phrase: 'more and more', alternative: 'an increasing number of / increasingly', explanation: 'Cum tu lap lap, nen dung pho tu increasingly.' },
]

export const PARAPHRASE_DRILLS: ParaphraseDrill[] = [
  {
    id: 'para-1',
    original: 'Many students use smartphones during classes because they find lectures boring.',
    strategy: 'Nominalization & Academic Vocabulary',
    modelAnswer: 'A substantial proportion of students resort to smartphone usage in lectures primarily due to perceived disengagement with teaching materials.',
    keyElements: ['substantial proportion', 'resort to', 'perceived disengagement'],
    explanation: 'Chuyen dong tu "use" thanh cum danh tu "smartphone usage", thay "find lectures boring" bang "perceived disengagement with teaching materials".',
  },
  {
    id: 'para-2',
    original: 'The government should spend more money on public transport to reduce traffic congestion.',
    strategy: 'Passive Construction & Formal Verbs',
    modelAnswer: 'Increased public funding ought to be allocated toward municipal transit infrastructure to alleviate vehicular congestion.',
    keyElements: ['allocated toward', 'municipal transit infrastructure', 'alleviate vehicular congestion'],
    explanation: 'Dung the bi dong "ought to be allocated toward", nang cap "traffic congestion" thanh "vehicular congestion", "reduce" thanh "alleviate".',
  },
  {
    id: 'para-3',
    original: 'Fast food makes people gain weight and causes serious health problems like diabetes.',
    strategy: 'Cause-and-effect Nominalization',
    modelAnswer: 'The habitual consumption of processed fast foods precipitates rapid weight gain and induces chronic metabolic conditions, such as diabetes.',
    keyElements: ['habitual consumption', 'precipitates', 'induces chronic metabolic conditions'],
    explanation: 'Thay "makes people gain weight" bang "precipitates rapid weight gain", "causes health problems" bang "induces chronic metabolic conditions".',
  },
]

export function analyzeWritingText(text: string): {
  wordCount: number
  characterCount: number
  awlWords: string[]
  awlDensityPct: number
  informalFound: { phrase: string; alternative: string; explanation: string }[]
} {
  const words = text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter(Boolean)

  const wordCount = words.length
  const characterCount = text.length

  if (!wordCount) {
    return {
      wordCount: 0,
      characterCount: 0,
      awlWords: [],
      awlDensityPct: 0,
      informalFound: [],
    }
  }

  const wordSet = new Set(words)
  const awlMatched: string[] = []
  for (const awl of ACADEMIC_WORD_LIST) {
    if (wordSet.has(awl) || words.some((w) => w.startsWith(awl.slice(0, -2)))) {
      awlMatched.push(awl)
    }
  }

  const lowerText = text.toLowerCase()
  const informalFound = INFORMAL_WARNINGS.filter((item) =>
    new RegExp(`\\b${item.phrase}\\b`, 'i').test(lowerText)
  )

  const awlDensityPct = Math.round((awlMatched.length / wordCount) * 100)

  return {
    wordCount,
    characterCount,
    awlWords: awlMatched,
    awlDensityPct,
    informalFound,
  }
}
