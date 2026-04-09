# LexiDrop 💧

LexiDrop is a powerful, AI-driven browser reading assistant that transforms how you engage with foreign text online. 

Instead of switching tabs to Google Translate, LexiDrop brings translations, grammatical breakdowns, smart quizzes, and native audio pronunciations directly to your current webpage natively through the browser's side panel.

> **Note:** Arc Browser currently blocks native side panels. Full Arc support is coming soon! For now, Arc, Opera, and Brave users can use LexiDrop natively via the built-in "Floating Window" fallback mode in the Extension Settings.

## The Core Loop

1. **Highlight** any word or phrase on a webpage.
2. **Right-click** and select *"Save to LexiDrop"*.
3. Wait a few milliseconds, and everything you need appears neatly beside the page:
   - Beautiful localized translation into your native language.
   - Real-world grammar explanation and context.
   - Pinyin (for Chinese characters) via an entirely offline engine.
   - Premium localized Native Neural Text-to-Speech (TTS).

## Features & Philosophy

LexiDrop is **not** a generic translator. It is designed as an interactive reading companion.

- **Global Language Support:** By default, it translates into Bengali, but seamlessly supports 20 globally spoken base languages (English, Spanish, French, Hindi, Japanese, etc.) dynamically during onboarding.
- **Offline Pinyin:** Instant tone marks and precise Pinyin resolution via the local, fast `pinyin-pro`.
- **Smart Quizzes:** Generates dynamic, AI-assisted quizzes to test retention based on your recent searches.
- **Cost-Free Fallbacks:** Completely free to use with MyMemory fallback translations for the simplest tasks.

## Privacy & Security First (BYOK)
LexiDrop is 100% free and private. It runs entirely inside your browser (Manifest V3 compatible).

To power the AI explanation engines, you bring your own **free API key** (BYOK) from providers like:
- **OpenRouter**
- **DeepSeek**
- **Groq**

Your keys are saved securely and locally to `chrome.storage.sync` and are never broadcast to a central server.

## Installation

You can load this unpacked extension natively in any Chromium-based browser (Chrome, Edge, Brave, etc.)

1. Clone or download the repository.
2. Go to `chrome://extensions/` (or `edge://extensions/`).
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the `/extension` directory.

*(Available soon on Chrome Web Store and Microsoft Edge Add-ons)*

## Architecture

LexiDrop was historically a Node.js/React project, but has been completely re-architected strictly as a lightweight **Vanilla JS Manifest V3 Browser Extension** to adhere to modern strict Content Security Policies (CSP).

Everything—from state management to the AI prompting, the onboarding slide wizard, and local offline API mapping—is contained efficiently and performantly within the `/extension` directory.
