# Project Specification: LexiDrop (Personal Version)

## 1. Goal
A personal vocabulary tracker.
- **Input:** Chrome Extension (Context Menu) -> Sends selected word to Backend.
- **Processing:** Backend uses Google Gemini (Free Tier) to translate and explain the word.
- **Output:** A React Dashboard where words fall like physics objects (Matter.js).

## 2. Tech Stack
- **Workspaces:** Monorepo structure (`/server`, `/client`, `/extension`).
- **Backend:** Node.js, Express, TypeScript.
- **Database:** SQLite (Simplest for personal use) OR PostgreSQL (if available). Use Prisma ORM.
- **AI:** `@google/generative-ai` SDK.
- **Frontend:** React, Vite, TypeScript, `matter-js` (Physics).

## 3. Data Model (Prisma)
model WordEntry {
  id              Int      @id @default(autoincrement())
  originalText    String
  translatedText  String?
  explanation     String?  // Markdown content
  status          String   @default("PENDING") // PENDING, COMPLETED, FAILED
  createdAt       DateTime @default(now())
}

## 4. API Definition
- `POST /api/save`: Accepts `{ text: string, targetLang: string }`.
  - Saves entry as PENDING.
  - Triggers Gemini AI to generate translation/explanation.
  - Updates entry to COMPLETED.
- `GET /api/words`: Returns all COMPLETED words.

## 5. Visuals (Frontend)
- **PhysicsBoard Component:**
  - Fetch words.
  - Create a Matter.js World.
  - Each word is a rectangular body that falls from the top.
  - Double-click a word to see the full explanation modal.