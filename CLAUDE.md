# Personal Study Hub – Guide for the AI Coding Agent

Local-only study app (React + TS + Tailwind v4 + IndexedDB). No backend, no in-app import.
**You** (the agent) prepare content; the app only studies / reviews / tracks progress.

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
Mastered = known and box ≥ 2 (two correct rounds in a row). Backup/restore of progress: Settings → Export / Restore.

## Layout
`src/data` loader + collections · `src/services/{storage,review,quiz}` · `src/features/learning` progress store ·
`src/components/{layout,flashcards,quiz,dashboard,ui}` · `src/pages` routes · `src/types`, `src/utils`.

## Commands
`npm run dev` · `npm test` · `npm run build` · `npm run import:cnxhkh` / `npm run import:history` (regenerate the Lịch sử Đảng collections from `docs/`;
NOTE: it overwrites those two JSON files).
