export type ItemType = 'vocabulary' | 'multiple-choice' | 'true-false' | 'theory' | 'programming'
export type ContentType = ItemType | 'mixed'

export interface VocabularyContent {
  term: string
  meaning: string
  pronunciation?: string
  partOfSpeech?: string
  example?: string
  translation?: string
  collocations?: string[]
  synonyms?: string[]
}

export interface McOption {
  key: string
  text: string
}

export interface MultipleChoiceContent {
  question: string
  options: McOption[]
  /** key of the correct option */
  answer: string
  explanation?: string
}

export interface TrueFalseContent {
  statement: string
  answer: boolean
  explanation?: string
}

export interface TheoryContent {
  concept: string
  definition: string
  points?: string[]
  explanation?: string
}

export interface ProgrammingContent {
  concept: string
  definition: string
  code?: string
  language?: string
  explanation?: string
  application?: string
}

/** Researched / extra material kept apart from the original source content. */
export interface Enrichment {
  text: string
  confidence?: 'verified' | 'uncertain'
  reference?: string
}

interface ItemBase {
  id: string
  tags?: string[]
  /** where the original item came from (document, question number...) */
  source?: { ref?: string; [k: string]: unknown }
  enrichment?: Enrichment
}

export type Item = ItemBase &
  (
    | { type: 'vocabulary'; content: VocabularyContent }
    | { type: 'multiple-choice'; content: MultipleChoiceContent }
    | { type: 'true-false'; content: TrueFalseContent }
    | { type: 'theory'; content: TheoryContent }
    | { type: 'programming'; content: ProgrammingContent }
  )

export interface Collection {
  id: string
  title: string
  subject: string
  contentType: ContentType
  description: string
  language?: string
  source?: { document?: string; note?: string; [k: string]: unknown }
  items: Item[]
}

export interface Entry {
  collection: Collection
  item: Item
}

export type Status = 'new' | 'known' | 'unknown'

export interface ProgressRecord {
  key: string // `${collectionId}::${itemId}`
  collectionId: string
  itemId: string
  status: Status
  review: boolean
  correct: number
  incorrect: number
  lastStudied?: string // ISO
  nextReview?: string // ISO
  level: number // Leitner box 0..5 (0 = never studied)
  lastResult?: 'correct' | 'incorrect'
}

export type ActivityKind = 'flashcard' | 'quiz' | 'review'

export interface ActivityRecord {
  id?: number
  ts: string // ISO
  collectionId: string
  itemId: string
  kind: ActivityKind
  result: 'correct' | 'incorrect'
}

export interface ExamRecord {
  id?: number
  ts: string // ISO
  collectionId: string // collection id or 'all'
  title: string
  total: number
  correct: number
  score10: number
  durationSec: number
  limitSec?: number
}

export interface Settings {
  shuffleFlashcards: boolean
  quizCount: number
  quizPracticeDefault: boolean
  /** exam date per subject, YYYY-MM-DD */
  examDates: Record<string, string>
}

export interface BackupFile {
  app: 'personal-study-hub'
  version: 1
  exportedAt: string
  progress: ProgressRecord[]
  activity: ActivityRecord[]
  exams?: ExamRecord[]
}
