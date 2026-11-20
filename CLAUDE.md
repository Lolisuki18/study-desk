# Personal Study Hub – Guide for the AI Coding Agent

Local-only study app (React + TS + Tailwind v4 + IndexedDB). No backend.
**You** (the agent) prepare content; the app only studies / reviews / tracks progress. The learner can also upload their own deck
JSON (page `/import`, kept in localStorage): the sample library there is `src/services/templates/examples.ts` (one sample per content
type, covered by `examples.test.ts`). Uploaded decks are checked by the same `validateCollection`; their `id` must be a lowercase
hyphenated slug and must not reuse a bundled collection id.

## Add a collection (the whole workflow)
1. Read the source the user gives you (put a copy in `docs/`). Identify subject + content type.
2. Create ONE JSON file: `src/data/collections/<subject-folder>/<name>.json` (any new file under
   `src/data/collections/**` is auto-loaded; no code change needed).
3. Run `npm test` (validates every bundled collection) and `npm run build`.
4. Open `npm run dev` → Settings → "Trạng thái nạp dữ liệu" must show the file with a green tick; check it in Collections, Flashcards, Quiz.

For bulk conversions write a small script in `scripts/` (see `scripts/import-history-md.mjs`) instead of hand-typing.

## Collection schema (`src/types/index.ts`, validated in `src/utils/validate.ts`)
```jsonc
{ "id": "unique-slug", "title": "...", "subject": "...", "description": "...",
  "contentType": "vocabulary | multiple-choice | true-false | theory | programming | mixed",
  "source": { "document": "..." },
  "items": [ { "id": "stable-id", "type": "<one of the types>", "content": { ... },
               "source": { "ref": "Câu 12" },            // optional: where it came from
               "enrichment": { "text": "...", "confidence": "verified|uncertain", "reference": "..." } } ] }
```
Content profiles:
- `vocabulary`: term, meaning, pronunciation?, partOfSpeech?, example?, translation?, collocations?[], synonyms?[]
- `multiple-choice`: question, options[{key,text}], answer (an option key, or several keys like "AB" for select-all-that-apply), explanation?
- `true-false`: statement, answer (boolean), explanation?
- `theory`: concept, definition, points?[], explanation?
- `programming`: concept, definition, code?, language?, explanation?, application?

Quiz types are derived automatically (MC items → MC; vocabulary with examples → fill-in-the-blank; ≥4 term/definition items → matching, short answer, T/F...). Don't hand-write quiz types.

## Extra question banks
`scripts/import-quiz-bank.mjs` builds the MLN131 / VNR202 banks from `docs/source-bank-*.json`; textbook cross-check notes come from
`docs/enrichment-bank-*.json`. Report and method: `docs/doi-chieu-giao-trinh.md`. `scripts/crosscheck.mjs` is a triage tool, not proof.
`npm run import:mln131-full` rebuilds `cnxhkh/mln131-full.json` from `docs/source-mln131-full.json`: all 360 questions, as the learner
asked, although ~310 of them also exist in the other CNXHKH collections (a deliberate exception to "don't duplicate"). It also writes
the overlap / answer-conflict report `docs/mln131-full-doi-chieu.md`. Item ids are the position in the source file, so keep the source
order when updating it. The collection is marked `"standalone": true`: such a deck is studied on its own and is left out of the
subject-wide mock exam (`/exam`) and the readiness estimate (`examCollections` in `src/data/index.ts`); it still counts everywhere else.

Repairs to community banks (never edit `docs/source-*.json`): `scripts/lib/clean-text.mjs` fixes copy/OCR damage while importing
(VNR202 bank + VNR202 Full + MLN131 Full; changes listed in `docs/*-text-cleanup.md`); `docs/question-fixes-*.json` hold hand-made fixes
(lost stems, answer corrections) with a reason and `confidence`. New subjects from the FPT quiz site: `npm run import:fpt-banks`
(HCM202, ITE302c, MLN111, MLN122). `npm run import:vnr202-full` / `import:mln131-full` rebuild the two Full decks.

## Rules
- NEVER silently change original questions/answers. Copy verbatim; keep source wording.
- NEVER invent facts/explanations. Researched extras go in `enrichment` (never in `content`), flagged `uncertain` if unsure.
  If the source has no explanation, leave `explanation` out (the UI says so).
- Item `id`s must be **stable**. Progress is stored in IndexedDB keyed by `collectionId::itemId`, separate from content.
  Editing text / adding items keeps progress; renaming an `id` or collection `id` orphans it. Never rename ids on update.
- Don't duplicate an existing collection (check `src/data/collections/` first). Don't touch other collections when adding one.
- If you suspect an error in the source (e.g. a wrong answer key), keep it as-is and tell the user.

## Progress / SRS
`src/services/review/srs.ts`: Leitner boxes 1–5 (1,3,7,14,30 days). Correct → up a box; wrong → box 1 and due now.
Flashcards are self-rated in 4 grades: Quên (= wrong) · Khó (same box, half interval) · Được (+1 box) · Dễ (+2 boxes).
Mastered = known and box ≥ 2 (two correct rounds in a row). A card is due again when its interval passes, mastered or not.
Personal notes (`notes` store) are keyed like progress and never written into collection content.
Backup/restore of progress + notes: Settings → Export / Restore, or automatic backup to a chosen file (Chrome/Edge only).

## Features beyond flashcards / quiz
Mock exam per subject (`/exam`, chapters mixed in proportion; chapter = "Chương N" in the collection title, see
`src/services/quiz/exam.ts`) · wrong-answer notebook (`/mistakes`) · global search (`/search`, `src/utils/search.ts`) ·
daily goal, streak, heatmap, due forecast, estimated study time (`src/services/stats.ts`) ·
"Học hôm nay" (`/today`, `src/services/review/today.ts`: due → wrong → new cards up to the daily goal) ·
learn-until-known in `FlashcardSession` (a wrong card is re-queued 3 cards later; a repeat only earns the `hard` grade) ·
exam readiness estimate (`src/services/readiness.ts`; the recall figures per box are assumptions, keep the on-screen caveat) ·
Pomodoro (`src/services/pomodoro.ts`, state + log in localStorage) · print sheet on `/mistakes` (`print:` classes).
Zen / focus mode: one shared state in `src/utils/zen.ts`, read with `useZen()` (never a local copy; Z toggles it, Esc leaves it).
Cram list (`CramView`, `src/utils/preview.ts`): key cards by `collectionId::itemId`, item ids repeat between collections.
React: keep every hook above any early `return` in a component (an early return before a later hook blanks the whole app).

## Dark theme
`html.dark` (set by `src/services/theme.ts`) remaps the palette variables at the end of `src/index.css`; components keep their
light classes. When adding a new colour shade, check it in dark mode and add it to that block if it reads badly.
Switching theme at runtime must go through `applyTheme(theme, { animate: true })`: it cross-fades the whole page (View Transitions,
with a CSS fallback) so surfaces change together; startup calls omit `animate`.

## PWA / offline
`public/manifest.webmanifest` + icons (`node scripts/make-icons.mjs` regenerates the PNGs). `vite build` writes `dist/sw.js`
from `scripts/sw-template.js` (plugin in `vite.config.ts`); it precaches every built file. The service worker is registered
only in production builds, so test offline with `npm run build && npm run preview`, not `npm run dev`.

## Layout
`src/data` loader + collections · `src/services/{storage,review,quiz}`, `src/services/stats.ts` · `src/features/learning` progress store ·
`src/components/{layout,flashcards,quiz,dashboard,ui}` · `src/pages` routes · `src/types`, `src/utils`.

## Commands
`npm run dev` · `npm test` · `npm run build` · `npm run preview` (serve the built app, with offline support) · `npm run import:cnxhkh` / `npm run import:history` (regenerate the Lịch sử Đảng collections from `docs/`;
NOTE: it overwrites those two JSON files).
