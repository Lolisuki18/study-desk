export interface DictionaryEntry {
  word: string
  ipa: string
  pos: string
  meaningVi: string
  definitionEn: string
  examples: string[]
  collocations: string[]
  synonyms: string[]
  antonyms: string[]
  band: '7.0' | '7.5' | '8.0+'
  topic: 'Education' | 'Technology' | 'Environment' | 'Society' | 'Economy' | 'General Academic'
}

export const OFFLINE_DICTIONARY: DictionaryEntry[] = [
  {
    word: 'substantial',
    ipa: '/səbˈstæn.ʃəl/',
    pos: 'adj.',
    meaningVi: 'Dang ke, to lon ve so luong hoac gia tri',
    definitionEn: 'Large in amount, size, or importance.',
    examples: [
      'The government invested a substantial amount of money into renewable energy.',
      'There is substantial evidence supporting the correlation between sleep and academic performance.',
    ],
    collocations: ['substantial amount', 'substantial increase', 'substantial evidence', 'substantial progress'],
    synonyms: ['considerable', 'significant', 'momentous', 'appreciable'],
    antonyms: ['negligible', 'insignificant', 'trivial', 'minor'],
    band: '7.5',
    topic: 'General Academic',
  },
  {
    word: 'unprecedented',
    ipa: '/ʌnˈpres.ɪ.den.tɪd/',
    pos: 'adj.',
    meaningVi: 'Chua tung co tien le, chua tung xay ra truoc day',
    definitionEn: 'Never having happened or existed in the past.',
    examples: [
      'The sudden pandemic caused an unprecedented disruption to international aviation.',
      'Modern society has achieved an unprecedented level of technological connectivity.',
    ],
    collocations: ['unprecedented scale', 'unprecedented growth', 'unprecedented crisis', 'unprecedented challenge'],
    synonyms: ['groundbreaking', 'unrivaled', 'novel', 'unparalleled'],
    antonyms: ['commonplace', 'familiar', 'conventional', 'precedented'],
    band: '8.0+',
    topic: 'Technology',
  },
  {
    word: 'mitigate',
    ipa: '/ˈmɪt.ɪ.ɡeɪt/',
    pos: 'v.',
    meaningVi: 'Giam nhe, lam diu bot muc do nghiem trong hoac tac hai',
    definitionEn: 'To make something less severe, serious, or painful.',
    examples: [
      'Urban planners must implement biophilic design to mitigate the heat island effect.',
      'Comprehensive educational reforms could help mitigate socioeconomic inequality.',
    ],
    collocations: ['mitigate risks', 'mitigate the impact', 'mitigate pollution', 'mitigate climate change'],
    synonyms: ['alleviate', 'attenuate', 'diminish', 'palliate'],
    antonyms: ['exacerbate', 'aggravate', 'intensify', 'worsen'],
    band: '7.5',
    topic: 'Environment',
  },
  {
    word: 'deterioration',
    ipa: '/dɪˌtɪə.ri.əˈreɪ.ʃən/',
    pos: 'n.',
    meaningVi: 'Su suy giam, su xuong cap ve chat luong hoac tinh trang',
    definitionEn: 'The process of becoming progressively worse.',
    examples: [
      'Sleep deprivation causes a severe deterioration in cognitive memory consolidation.',
      'The rapid deterioration of historical monuments is exacerbated by acid precipitation.',
    ],
    collocations: ['rapid deterioration', 'sharp deterioration', 'prevent deterioration'],
    synonyms: ['decline', 'degeneration', 'decay', 'degradation'],
    antonyms: ['amelioration', 'improvement', 'enhancement'],
    band: '7.5',
    topic: 'General Academic',
  },
  {
    word: 'disparity',
    ipa: '/dɪˈspær.ə.ti/',
    pos: 'n.',
    meaningVi: 'Su chenh lech lon, su bat binh dang khong hop ly',
    definitionEn: 'A great difference between things, often unfair.',
    examples: [
      'There remains an alarming income disparity between metropolitan and rural communities.',
      'Bridging the technological disparity among developing nations requires international subsidies.',
    ],
    collocations: ['glaring disparity', 'economic disparity', 'bridge the disparity', 'growing disparity'],
    synonyms: ['inequality', 'divergence', 'imbalance', 'disproportion'],
    antonyms: ['parity', 'equality', 'similarity'],
    band: '7.5',
    topic: 'Society',
  },
  {
    word: 'paradigm',
    ipa: '/ˈpær.ə.daɪm/',
    pos: 'n.',
    meaningVi: 'Mo hinh, khuon mau tu duy hoac ly thuyet kieu mau',
    definitionEn: 'A typical example or pattern of something; a model or worldview.',
    examples: [
      'Artificial intelligence represents a fundamental paradigm shift in contemporary education.',
      'The research introduced a brand new paradigm for testing cryptographic algorithms.',
    ],
    collocations: ['paradigm shift', 'dominant paradigm', 'adopt a paradigm'],
    synonyms: ['model', 'archetype', 'prototype', 'framework'],
    antonyms: ['anomaly', 'aberration'],
    band: '8.0+',
    topic: 'Technology',
  },
  {
    word: 'accommodate',
    ipa: '/əˈkɒm.ə.deɪt/',
    pos: 'v.',
    meaningVi: 'Cung cap cho o; dap ung hoac dieu chinh cho phu hop voi nhu cau',
    definitionEn: 'To provide lodging or sufficient space for; to fit in with the wishes or needs of.',
    examples: [
      'The university dormitories were expanded to accommodate an influx of international scholars.',
      'Public infrastructure must be upgraded to accommodate rapid population expansion.',
    ],
    collocations: ['accommodate the needs', 'accommodate visitors', 'easily accommodate'],
    synonyms: ['lodge', 'house', 'adapt to', 'cater to'],
    antonyms: ['reject', 'exclude', 'impede'],
    band: '7.0',
    topic: 'General Academic',
  },
  {
    word: 'questionnaire',
    ipa: '/ˌkwes.tʃəˈneər/',
    pos: 'n.',
    meaningVi: 'Bang cau hoi khao sat (bay chinh ta thuong gap: 2 chu n)',
    definitionEn: 'A set of printed or written questions with a choice of answers, devised for the purposes of a survey.',
    examples: [
      'Participants completed an online questionnaire evaluating consumer sentiment.',
      'The researchers distributed three hundred questionnaires across various demographic segments.',
    ],
    collocations: ['distribute questionnaires', 'complete a questionnaire', 'questionnaire survey'],
    synonyms: ['survey', 'poll', 'inquiry'],
    antonyms: [],
    band: '7.0',
    topic: 'Education',
  },
  {
    word: 'environment',
    ipa: '/ɪnˈvaɪ.rən.mənt/',
    pos: 'n.',
    meaningVi: 'Moi truong song, moi truong xung quanh (chu y chu n truoc m)',
    definitionEn: 'The surroundings or conditions in which a person, animal, or plant lives.',
    examples: [
      'Collaborative classrooms cultivate a supportive learning environment for pupils.',
      'Industrial pollutants pose dire hazards to the delicate marine environment.',
    ],
    collocations: ['working environment', 'protect the environment', 'environmental degradation'],
    synonyms: ['surroundings', 'ecosystem', 'milieu'],
    antonyms: [],
    band: '7.0',
    topic: 'Environment',
  },
  {
    word: 'resilience',
    ipa: '/rɪˈzɪl.jəns/',
    pos: 'n.',
    meaningVi: 'Kha nang phuc hoi nhanh chong sau kho khan hoac khung hoang',
    definitionEn: 'The capacity to recover quickly from difficulties; toughness.',
    examples: [
      'Students demonstrated remarkable mental resilience while preparing for grueling examinations.',
      'Cultivating economic resilience is paramount for small island developing states.',
    ],
    collocations: ['emotional resilience', 'economic resilience', 'build resilience', 'display resilience'],
    synonyms: ['tenacity', 'endurance', 'fortitude', 'perseverance'],
    antonyms: ['fragility', 'vulnerability', 'weakness'],
    band: '7.5',
    topic: 'Society',
  },
  {
    word: 'alleviate',
    ipa: '/əˈliː.vi.eɪt/',
    pos: 'v.',
    meaningVi: 'Lam nhe bot noi dau, giam thieu kho khan hoac tac nghen',
    definitionEn: 'To make suffering, deficiency, or a problem less severe.',
    examples: [
      'Subsidizing public transit systems will alleviate severe urban vehicular congestion.',
      'Government welfare initiatives seek to alleviate extreme poverty in rural provinces.',
    ],
    collocations: ['alleviate poverty', 'alleviate traffic congestion', 'alleviate symptoms'],
    synonyms: ['relieve', 'ease', 'mitigate', 'assuage'],
    antonyms: ['aggravate', 'intensify', 'exacerbate'],
    band: '7.5',
    topic: 'Economy',
  },
  {
    word: 'correlation',
    ipa: '/ˌkɒr.əˈleɪ.ʃən/',
    pos: 'n.',
    meaningVi: 'Moi tuong quan, su lien quan mat thiet giua hai yeu to',
    definitionEn: 'A mutual relationship or connection between two or more things.',
    examples: [
      'Empirical studies revealed a direct correlation between physical exercise and cognitive clarity.',
      'Correlation does not inherently imply causation in observational medical trials.',
    ],
    collocations: ['strong correlation', 'direct correlation', 'positive correlation', 'negative correlation'],
    synonyms: ['connection', 'interrelation', 'association', 'linkage'],
    antonyms: ['independence', 'disconnection', 'disparity'],
    band: '7.5',
    topic: 'General Academic',
  },
  {
    word: 'indispensable',
    ipa: '/ˌɪn.dɪˈspen.sə.bəl/',
    pos: 'adj.',
    meaningVi: 'Khong the thieu duoc, vo cung can thiet',
    definitionEn: 'Absolutely necessary or essential.',
    examples: [
      'High-speed internet has become an indispensable asset for higher education distance learning.',
      'Emotional empathy is an indispensable attribute for healthcare professionals.',
    ],
    collocations: ['indispensable tool', 'indispensable role', 'prove indispensable'],
    synonyms: ['vital', 'essential', 'imperative', 'crucial'],
    antonyms: ['dispensable', 'redundant', 'superfluous', 'unnecessary'],
    band: '7.5',
    topic: 'Education',
  },
  {
    word: 'phenomenon',
    ipa: '/fəˈnɒm.ɪ.nən/',
    pos: 'n.',
    meaningVi: 'Hien tuong (chu y so nhieu la phenomena)',
    definitionEn: 'A fact or situation that is observed to exist or happen, especially one whose cause is in question.',
    examples: [
      'The Urban Heat Island is a well-documented microclimatic phenomenon in metropolitan regions.',
      'Social media viral trends represent a peculiar psychological phenomenon among teenagers.',
    ],
    collocations: ['cultural phenomenon', 'natural phenomenon', 'global phenomenon'],
    synonyms: ['occurrence', 'event', 'marvel', 'development'],
    antonyms: [],
    band: '7.5',
    topic: 'General Academic',
  },
  {
    word: 'predominantly',
    ipa: '/prɪˈdɒm.ɪ.nənt.li/',
    pos: 'adv.',
    meaningVi: 'Phan lon, chu yeu la, chiem uu the',
    definitionEn: 'Mainly, for the most part.',
    examples: [
      'The workforce in rural farming communities consists predominantly of manual laborers.',
      'Renewable electricity in Norway is predominantly generated by hydroelectric facilities.',
    ],
    collocations: ['predominantly female', 'predominantly male', 'predominantly composed of'],
    synonyms: ['primarily', 'principally', 'largely', 'chiefly'],
    antonyms: ['secondarily', 'minimally'],
    band: '7.5',
    topic: 'Economy',
  },
  {
    word: 'precipitate',
    ipa: '/prɪˈsɪp.ɪ.teɪt/',
    pos: 'v.',
    meaningVi: 'Gay ra dot ngot, day nhanh mot su viec tieu cuc dien ra som hon',
    definitionEn: 'To cause an event or situation, typically one that is bad or undesirable, to happen suddenly or prematurely.',
    examples: [
      'The sudden collapse of major commercial banks precipitated a worldwide financial recession.',
      'Excessive consumer debt can precipitate acute socioeconomic crises.',
    ],
    collocations: ['precipitate a crisis', 'precipitate decline', 'precipitate conflict'],
    synonyms: ['trigger', 'instigate', 'accelerate', 'provoke'],
    antonyms: ['prevent', 'hinder', 'delay'],
    band: '8.0+',
    topic: 'Economy',
  },
  {
    word: 'counterpart',
    ipa: '/ˈkaʊn.tə.pɑːt/',
    pos: 'n.',
    meaningVi: 'Doi phuong, ben tuong ung (trong so sanh doi chieu Task 1 & 2)',
    definitionEn: 'A person or thing holding a position or performing a function that corresponds to that of another person or thing in another place.',
    examples: [
      'Graduates from prestigious universities earn substantially higher starting wages than their peers at regional counterparts.',
      'The Danish renewable energy sector surged far ahead of its European counterparts.',
    ],
    collocations: ['international counterparts', 'European counterparts', 'male counterparts', 'female counterparts'],
    synonyms: ['equivalent', 'peer', 'colleague', 'opposite number'],
    antonyms: [],
    band: '7.5',
    topic: 'Economy',
  },
]

export function lookupWord(query: string): DictionaryEntry | null {
  const clean = query.trim().toLowerCase()
  if (!clean) return null
  return (
    OFFLINE_DICTIONARY.find(
      (entry) =>
        entry.word.toLowerCase() === clean ||
        entry.word.toLowerCase().replace(/[^a-z]/g, '') === clean.replace(/[^a-z]/g, '')
    ) || null
  )
}

export function searchDictionary(query: string, limit: number = 8): DictionaryEntry[] {
  const clean = query.trim().toLowerCase()
  if (!clean) return OFFLINE_DICTIONARY.slice(0, limit)

  return OFFLINE_DICTIONARY.filter(
    (entry) =>
      entry.word.toLowerCase().includes(clean) ||
      entry.meaningVi.toLowerCase().includes(clean) ||
      entry.collocations.some((c) => c.toLowerCase().includes(clean)) ||
      entry.synonyms.some((s) => s.toLowerCase().includes(clean))
  ).slice(0, limit)
}

export function getWordsByTopic(topic: string): DictionaryEntry[] {
  return OFFLINE_DICTIONARY.filter((entry) => entry.topic.toLowerCase() === topic.toLowerCase())
}
