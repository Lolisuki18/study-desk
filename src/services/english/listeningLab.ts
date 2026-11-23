export interface Section1Item {
  id: string
  category: 'name' | 'number' | 'postcode' | 'date' | 'price'
  label: string
  context: string
  spokenText: string
  answer: string
  tip: string
}

export interface SentenceDictationItem {
  id: string
  title: string
  context: string
  audioText: string
  targetText: string
  translation: string
  keyFocus: string
}

export const SECTION1_DRILLS: Section1Item[] = [
  {
    id: 's1-name-1',
    category: 'name',
    label: 'Applicant Surname',
    context: 'Can I take your family name please? Yes, it is Featherstone. Let me spell that: F - E - A - T - H - E - R - S - T - O - N - E.',
    spokenText: 'Yes, it is Featherstone. That is spelled F. E. A. T. H. E. R. S. T. O. N. E.',
    answer: 'Featherstone',
    tip: 'Chu y cac am de nham: E va I, A va R, H va Eight.',
  },
  {
    id: 's1-name-2',
    category: 'name',
    label: 'Guest Family Name',
    context: 'And your last name? Mackenzie, that is M - A - C - K - E - N - Z - I - E.',
    spokenText: 'My surname is Mackenzie. M. A. C. K. E. N. Z. I. E.',
    answer: 'Mackenzie',
    tip: 'Chu y am Mac/Mc va Z (Zed theo giong Anh).',
  },
  {
    id: 's1-name-3',
    category: 'name',
    label: 'Street Name',
    context: 'The property address is on Blackwood Road. B - L - A - C - K - W - O - O - D.',
    spokenText: 'The property is located on Blackwood Road. B. L. A. C. K. W. O. O. D.',
    answer: 'Blackwood',
    tip: 'Ten duong pho thuong viet hoa chu cai dau.',
  },
  {
    id: 's1-num-1',
    category: 'number',
    label: 'Contact Telephone',
    context: 'You can reach me on 07892 451 902.',
    spokenText: 'My mobile number is 0 7 8 9 2. 4 5 1. 9 0 2.',
    answer: '07892 451 902',
    tip: 'So khong thuong doc la Oh hoac Zero. Chu y ngat nhip giua cac cum so.',
  },
  {
    id: 's1-num-2',
    category: 'number',
    label: 'Reference Number',
    context: 'Your booking reference is TR 48209.',
    spokenText: 'Your reference number is T. R. 4. 8. 2. 0. 9.',
    answer: 'TR 48209',
    tip: 'Ket hop chu cai va con so, thuong gap trong ma dat cho.',
  },
  {
    id: 's1-postcode-1',
    category: 'postcode',
    label: 'Delivery Postcode',
    context: 'The postal code is SW1A 1AA.',
    spokenText: 'The postcode is S. W. 1. A. 1. A. A.',
    answer: 'SW1A 1AA',
    tip: 'Ma buu chinh Anh thuong gom 2 phan: vi du SW1A (khu vuc) va 1AA (toa nha).',
  },
  {
    id: 's1-postcode-2',
    category: 'postcode',
    label: 'Office Postcode',
    context: 'Our Cambridge office postcode is CB2 1TN.',
    spokenText: 'Our office postcode is C. B. 2. 1. T. N.',
    answer: 'CB2 1TN',
    tip: 'Phan biet ro rang chu B va D, P va B khi nghe danh van nhanh.',
  },
  {
    id: 's1-date-1',
    category: 'date',
    label: 'Departure Date',
    context: 'We are scheduled to depart on the 14th of July.',
    spokenText: 'We are scheduled to depart on the fourteenth of July.',
    answer: '14th July',
    tip: 'Chap nhan ca cach viet 14 July hoac July 14th.',
  },
  {
    id: 's1-date-2',
    category: 'date',
    label: 'Conference Start Date',
    context: 'The international seminar begins on the 23rd of October.',
    spokenText: 'The international seminar will begin on the twenty-third of October.',
    answer: '23rd October',
    tip: 'Chu y cac ngay dac biet nhu 1st, 2nd, 3rd, 21st, 22nd, 23rd.',
  },
  {
    id: 's1-price-1',
    category: 'price',
    label: 'Standard Admission Fee',
    context: 'Admission for adults is forty-five pounds and fifty pence.',
    spokenText: 'The adult admission ticket costs forty-five pounds and fifty pence.',
    answer: '45.50',
    tip: 'Viet so gon gang, ki hieu tien te thuong da co san trong de bai.',
  },
  {
    id: 's1-price-2',
    category: 'price',
    label: 'Monthly Rental Deposit',
    context: 'The deposit required upfront is six hundred and twenty dollars.',
    spokenText: 'The required deposit upfront is six hundred and twenty dollars.',
    answer: '620',
    tip: 'Chu y khong viet nham giua sixty (60) va sixteen (16), 620 va 602.',
  },
]

export const SENTENCE_DICTATIONS: SentenceDictationItem[] = [
  {
    id: 'sd-1',
    title: 'Renewable Energy Transition',
    context: 'Academic Lecture - Environmental Science',
    audioText: 'Renewable energy sources have demonstrated substantial potential to diminish reliance on fossil fuels.',
    targetText: 'Renewable energy sources have demonstrated substantial potential to diminish reliance on fossil fuels.',
    translation: 'Cac nguon nang luong tai tao da chung minh tiem nang to lon trong viec giam su phu thuoc vao nhien lieu hoa thach.',
    keyFocus: 'substantial, diminish, reliance',
  },
  {
    id: 'sd-2',
    title: 'Urban Infrastructure Planning',
    context: 'Academic Seminar - Architecture & Urban Studies',
    audioText: 'Rapid urbanization poses unprecedented challenges for municipal transportation infrastructure.',
    targetText: 'Rapid urbanization poses unprecedented challenges for municipal transportation infrastructure.',
    translation: 'Do thi hoa nhanh chong dat ra nhung thach thuc chua tung co cho ha tang giao thong do thi.',
    keyFocus: 'urbanization, unprecedented, municipal infrastructure',
  },
  {
    id: 'sd-3',
    title: 'Cognitive Development & Technology',
    context: 'Research Presentation - Psychology',
    audioText: 'Excessive screen exposure may impede cognitive development and adversely affect attention span in adolescents.',
    targetText: 'Excessive screen exposure may impede cognitive development and adversely affect attention span in adolescents.',
    translation: 'Tiep xuc qua muc voi man hinh co the can tro su phat trien nhan thuc va anh huong tieu cuc den do tap trung cua thanh thieu nien.',
    keyFocus: 'impede, cognitive, adversely, adolescents',
  },
  {
    id: 'sd-4',
    title: 'Economic Globalization Trends',
    context: 'Economics Tutorial - Macroeconomics',
    audioText: 'Technological innovation plays a pivotal role in boosting domestic productivity and international competitiveness.',
    targetText: 'Technological innovation plays a pivotal role in boosting domestic productivity and international competitiveness.',
    translation: 'Doi moi cong nghe dong vai tro then chot trong viec thuc day nang suat noi dia va suc canh tranh quoc te.',
    keyFocus: 'pivotal role, domestic productivity, competitiveness',
  },
]

export function normalizeListeningInput(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[,\.!?]/g, '')
    .replace(/\s+/g, ' ')
}

export function isSection1AnswerCorrect(typed: string, expected: string): boolean {
  const normTyped = normalizeListeningInput(typed)
  const normExpected = normalizeListeningInput(expected)

  if (normTyped === normExpected) return true

  // Also check without spaces (for postcodes/phone numbers like 'sw1a1aa' vs 'sw1a 1aa')
  const strippedTyped = normTyped.replace(/\s+/g, '')
  const strippedExpected = normExpected.replace(/\s+/g, '')
  if (strippedTyped === strippedExpected) return true

  // Date variations: '14th july' vs '14 july' or 'july 14'
  const dateSimplifiedTyped = normTyped.replace(/(st|nd|rd|th)/g, '')
  const dateSimplifiedExpected = normExpected.replace(/(st|nd|rd|th)/g, '')
  if (dateSimplifiedTyped === dateSimplifiedExpected) return true

  return false
}
