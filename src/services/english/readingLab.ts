export type TFNGChoice = 'TRUE' | 'FALSE' | 'NOT GIVEN'

export interface TFNGQuestion {
  id: string
  statement: string
  correct: TFNGChoice
  explanation: string
  referenceQuote: string
}

export interface ReadingDrillPassage {
  id: string
  title: string
  academicField: string
  passage: string
  questions: TFNGQuestion[]
}

export interface SpeedReadingArticle {
  id: string
  title: string
  wordCount: number
  passage: string
  comprehensionQuiz: {
    question: string
    options: string[]
    correctIndex: number
    explanation: string
  }[]
}

export const TFNG_DRILLS: ReadingDrillPassage[] = [
  {
    id: 'rd-pass-1',
    title: 'The Neurological Foundations of Sleep and Memory',
    academicField: 'Neuroscience & Cognitive Psychology',
    passage: `Recent neuroimaging investigations have elucidated the indispensable role of slow-wave sleep in memory consolidation. During non-rapid eye movement (NREM) sleep stages, neural oscillations within the neocortex synchronize with the hippocampus, orchestrating the transfer of transient memories into long-term architectural storage.
Contrary to historical assumptions that the sleeping brain is merely dormant, metabolic activity in targeted cerebral regions remains surprisingly dynamic. Researchers discovered that subjects deprived of restorative slumber for merely twenty-four hours exhibited a 40 percent deterioration in hippocampal learning capacity compared to well-rested counterparts. However, whether synthetic pharmacological sleep aids can faithfully replicate the neurochemical benefits of natural sleep remains largely unresolved among clinical practitioners.`,
    questions: [
      {
        id: 'q1',
        statement: 'The human brain undergoes complete metabolic inactivity during slow-wave sleep.',
        correct: 'FALSE',
        explanation: 'Doan van neu ro rang: "Contrary to historical assumptions that the sleeping brain is merely dormant, metabolic activity in targeted cerebral regions remains surprisingly dynamic." Vi vay nhan dinh nao hoan toan bat hoat la sai (FALSE).',
        referenceQuote: 'metabolic activity in targeted cerebral regions remains surprisingly dynamic',
      },
      {
        id: 'q2',
        statement: 'Sleep deprivation significantly impairs the capacity of the hippocampus to acquire new knowledge.',
        correct: 'TRUE',
        explanation: 'Doan van cho biet nguoi bi thieu ngu trong 24 gio suy giam toi 40% kha nang hoc hoi cua hoi hai ma ("exhibited a 40 percent deterioration in hippocampal learning capacity"), dong nghia voi viec giam sut nghiem trong (TRUE).',
        referenceQuote: 'exhibited a 40 percent deterioration in hippocampal learning capacity',
      },
      {
        id: 'q3',
        statement: 'Prescription sleeping pills have been conclusively proven to be harmful to long-term memory formation.',
        correct: 'NOT GIVEN',
        explanation: 'Doan van chi neu rang lieu thuoc ngu co sao chep duoc loi ich sinh hoa cua giac ngu tu nhien hay khong van chua duoc giai quyet ("remains largely unresolved"). Bai khong ket luan chung da duoc chung minh dut khoat la co hai (NOT GIVEN).',
        referenceQuote: 'whether synthetic pharmacological sleep aids can faithfully replicate... remains largely unresolved',
      },
    ],
  },
  {
    id: 'rd-pass-2',
    title: 'Geothermal Energy Extraction and Tectonic Stability',
    academicField: 'Geophysics & Sustainable Energy',
    passage: `Enhanced Geothermal Systems (EGS) harness subterranean thermal energy by circulating pressurized water through fractured crystalline bedrock miles beneath the Earth surface. This methodology liberates previously inaccessible heat reserves, offering a continuous baseload power supply immune to meteorological fluctuations that restrict solar and wind installations.
Nevertheless, hydraulic stimulation carries inherent environmental consequences. The high-pressure injection of fluid can reactivate dormant fault lines, inducing micro-seismic tremors. In 2006, a pioneer EGS facility in Basel, Switzerland, was permanently decommissioned after generating sustained tremors exceeding magnitude 3.4 on the Richter scale, which provoked widespread residential property damage. Modern engineers have since implemented real-time seismic traffic-light protocols to mitigate these geological risks.`,
    questions: [
      {
        id: 'q4',
        statement: 'Geothermal power generation is unaffected by adverse atmospheric weather conditions.',
        correct: 'TRUE',
        explanation: 'Doan van viet: "offering a continuous baseload power supply immune to meteorological fluctuations that restrict solar and wind installations". "Immune to meteorological fluctuations" dong nghia voi khong bi anh huong boi thoi tiet (TRUE).',
        referenceQuote: 'immune to meteorological fluctuations that restrict solar and wind installations',
      },
      {
        id: 'q5',
        statement: 'The Basel geothermal project was terminated solely due to budget shortfalls and construction delays.',
        correct: 'FALSE',
        explanation: 'Doan van noi ro rang du an Basel bi dong cua vinh vien sau khi gay ra cac con dia chan vuot muc 3.4 do Richter gay hu hong nha cua ("permanently decommissioned after generating sustained tremors..."), khong phai do thieu kinh phi (FALSE).',
        referenceQuote: 'permanently decommissioned after generating sustained tremors exceeding magnitude 3.4',
      },
      {
        id: 'q6',
        statement: 'Switzerland currently generates the majority of its electricity from advanced geothermal stations.',
        correct: 'NOT GIVEN',
        explanation: 'Bai doc chi de cap den mot tram thi diem tai Basel bi dong cua nam 2006, hoan toan khong noi den ty le phan tram dien nang hien tai cua Thuy Si den tu dau (NOT GIVEN).',
        referenceQuote: 'In 2006, a pioneer EGS facility in Basel, Switzerland...',
      },
    ],
  },
]

export const SPEED_READING_ARTICLES: SpeedReadingArticle[] = [
  {
    id: 'spd-art-1',
    title: 'Urban Microclimates and The Urban Heat Island Phenomenon',
    wordCount: 228,
    passage: `The Urban Heat Island (UHI) effect represents one of the most prominent anthropogenically driven microclimatic transformations of the modern era. Dense metropolitan areas consistently record surface and ambient air temperatures several degrees higher than adjacent rural hinterlands. This thermal disparity stems primarily from the extensive replacement of permeable vegetative landscapes with high thermal mass construction materials, such as asphalt, concrete, and dark masonry. These impermeable surfaces absorb solar radiation throughout peak daylight hours and subsequently re-radiate thermal energy during the nocturnal cycle, severely restricting nighttime atmospheric cooling.

Compounding this radiative imbalance is the continuous emission of anthropogenic heat generated by vehicular combustion engines, centralized HVAC cooling networks, and industrial manufacturing facilities. Furthermore, the geometric configuration of skyscrapers—frequently termed 'urban canyons'—traps radiant heat and significantly reduces mean wind velocities, which impairs natural convective ventilation.

Mitigation strategies increasingly prioritize biophilic urban design. Large-scale municipal initiatives deploy reflective 'cool roofs', expansive vegetative green corridors, and porous permeable pavements designed to retain precipitation for evaporative cooling. Recent computational simulations suggest that elevating urban vegetative canopy coverage by 20 percent can reduce ambient summertime peak temperatures by up to 2.5 degrees Celsius, delivering substantial reductions in municipal energy expenditure and heat-related respiratory hospitalizations.`,
    comprehensionQuiz: [
      {
        question: 'What is identified as the primary cause of heat retention during nocturnal hours?',
        options: [
          'High thermal mass materials like asphalt and concrete re-radiating heat',
          'Excessive air conditioning units operating at night',
          'Heavy industrial manufacturing emissions during nighttime shifts',
          'Severe reduction of atmospheric greenhouse gases',
        ],
        correctIndex: 0,
        explanation: 'Doan 1 giai thich: "high thermal mass construction materials... absorb solar radiation... and subsequently re-radiate thermal energy during the nocturnal cycle".',
      },
      {
        question: 'According to computational models, a 20% rise in vegetative canopy can lower peak temperatures by:',
        options: ['Up to 1.0 degree Celsius', 'Up to 2.5 degrees Celsius', 'Up to 5.0 degrees Celsius', 'More than 7.0 degrees Celsius'],
        correctIndex: 1,
        explanation: 'Doan 3 ghi ro: "elevating urban vegetative canopy coverage by 20 percent can reduce ambient summertime peak temperatures by up to 2.5 degrees Celsius".',
      },
    ],
  },
]

export function computeReadingWpm(wordCount: number, elapsedSeconds: number): number {
  if (elapsedSeconds <= 0) return 0
  return Math.round((wordCount / elapsedSeconds) * 60)
}

export function evaluateWpmBand(wpm: number): {
  rating: string
  color: string
  description: string
} {
  if (wpm < 150) {
    return {
      rating: 'Below Target (<150 WPM)',
      color: 'text-amber-600 dark:text-amber-400',
      description: 'Toc do doc cham, can luyen bo thoi quen nham tung tu de kip gio lam bai 3 passages trong 60 phut.',
    }
  }
  if (wpm < 220) {
    return {
      rating: 'Standard Band 6.5 - 7.0 (150-220 WPM)',
      color: 'text-blue-600 dark:text-blue-400',
      description: 'Toc do doc dat chuan. Du de hoan thanh 40 cau hoi trong 60 phut voi thoi gian soat lai.',
    }
  }
  return {
    rating: 'Advanced Band 7.5 - 9.0 (220+ WPM)',
    color: 'text-emerald-600 dark:text-emerald-400',
    description: 'Toc do doc rat nhanh va linh hoat! Kha nang skimming va scanning cao, tiet kiem thoi gian suy nghi.',
  }
}
