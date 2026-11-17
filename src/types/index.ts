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
  /**
   * A self-contained deck whose questions mostly repeat other collections of the same subject.
   * It is studied on its own, and left out of subject-wide mock exams and the exam-readiness estimate
   * so the same question is not drawn or counted twice.
   */
  standalone?: boolean
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

/** Self-rated confidence on a flashcard. `again` = forgot; the rest count as remembered. */
export type Grade = 'again' | 'hard' | 'good' | 'easy'

/** Personal note on one item; stored apart from the collection content. */
export interface NoteRecord {
  key: string // `${collectionId}::${itemId}`
  collectionId: string
  itemId: string
  text: string
  updatedAt: string // ISO
}

export type ActivityKind ='flashcard' | 'quiz' | 'review'

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
  /** distinct items to study per day */
  dailyGoal: number
  /** mock-exam structure per subject */
  examPresets: Record<string, { count: number; minutes: number }>
  theme: Theme
  /** flashcards: a card answered wrong comes back later in the same session until it is answered right */
  learnUntilKnown: boolean
  /** Pomodoro lengths in minutes */
  pomodoroWork: number
  pomodoroBreak: number
}

export type Theme = 'light' | 'dark' | 'system'

export interface BackupFile {
  app: 'personal-study-hub'
  version: 1
  exportedAt: string
  progress: ProgressRecord[]
  activity: ActivityRecord[]
  exams?: ExamRecord[]
  notes?: NoteRecord[]
}
