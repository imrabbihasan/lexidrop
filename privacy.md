# Privacy Policy — LexiDrop: AI Language Assistant & Translator

**Extension ID:** rabbihasan.dev@outlook.com  
**Author:** Hasan Rabbi  
**Last updated:** April 2026  
**Platform:** Mozilla Firefox Add-on (also available for Chromium browsers)

---

## Summary

LexiDrop is a **privacy-first** browser extension. It does **not** collect, transmit, or store any personal data on external servers operated by the developer. All data remains entirely within your own browser and, when you choose to use AI features, is sent only to the AI provider you personally configured with your own API key.

---

## 1. Data We Do NOT Collect

The developer of LexiDrop **never** receives:

- Your highlighted text or browsing content
- Your API keys
- Your translation history or saved vocabulary
- Your IP address, browser fingerprint, or device information
- Any analytics, crash reports, or telemetry

This is confirmed by the `data_collection_permissions` declaration in our manifest:

```json
"data_collection_permissions": {
  "required": ["none"]
}
```

---

## 2. Data Stored Locally on Your Device

LexiDrop stores the following data **exclusively in your browser's local storage** (`browser.storage.local` and `browser.storage.sync`). This data never leaves your device except as described in Section 3.

| Data | Storage Location | Purpose |
|---|---|---|
| Your selected AI provider name | `storage.sync` | Remember your provider setting |
| Your AI model name | `storage.sync` | Remember your model preference |
| Your API key | `storage.sync` | Sent only to your chosen AI provider |
| Your native language preference | `storage.sync` | Generate translations in your language |
| Your preferred Chinese TTS voice | `storage.sync` | Remember your voice selection |
| Translation history | `storage.local` | Display your past lookups in the History tab |
| Saved vocabulary items | `storage.local` | Power the Saved and Review tabs |
| Current result cache | `storage.local` | Restore your last result when you reopen the panel |
| Pending text selection | `storage.local` | Temporarily hold a word between the context menu click and panel load |

You can delete all locally stored data at any time by clicking **"Clear History"** in the extension panel or by removing the extension entirely from Firefox.

---

## 3. Data Sent to Third-Party AI Providers (User-Initiated Only)

When you highlight text and choose **"Understand with LexiDrop"**, the selected text is sent to the AI provider you have configured in the extension settings. This is the **sole** external network request made by LexiDrop.

- **What is sent:** The highlighted text, your chosen language preference, and your API key (as an HTTP Authorization header).
- **Who receives it:** Only the provider you selected — OpenRouter, DeepSeek, or Groq. The developer of LexiDrop receives nothing.
- **When it is sent:** Only on explicit user action (right-clicking → selecting LexiDrop from the context menu). LexiDrop never runs in the background or auto-monitors any page.
- **No API key, no AI request:** If you have not configured an API key, LexiDrop uses the free MyMemory translation API. Only the selected text is sent to MyMemory's public API endpoint.

**Third-party provider privacy policies:**
- OpenRouter: https://openrouter.ai/privacy
- DeepSeek: https://www.deepseek.com/privacy
- Groq: https://groq.com/privacy-policy
- MyMemory (fallback): https://mymemory.translated.net/doc/usagelimits.php

---

## 4. Permissions Justification

Firefox requires extensions to justify each requested permission. Here is our justification:

| Permission | Reason |
|---|---|
| `storage` | Save your settings, vocabulary, and history locally in the browser |
| `contextMenus` | Add the "Understand with LexiDrop" option to the right-click menu |
| `tabs` | Read the current tab's URL and title to display source context alongside a translation |
| `tts` | Use the browser's built-in Text-to-Speech engine to read selected text aloud |
| `sidePanel` *(Chrome only)* | Open LexiDrop in the native browser side panel |

> **Note:** The `sidePanel` permission is declared for Chromium compatibility. Firefox ignores it and uses the `sidebar_action` API instead. Neither requires access to page content.

**Host permissions** (`openrouter.ai`, `api.deepseek.com`, `api.groq.com`) are required solely to allow the extension's background script to make API requests to your chosen provider. These requests are only made on your explicit action and contain only your selected text and API key.

---

## 5. Children's Privacy

LexiDrop is not directed at children under 13 years of age and does not knowingly collect any information from children.

---

## 6. Changes to This Policy

If a future update changes how data is handled, the **"Last updated"** date at the top of this document will be updated and a note will be added to the extension's changelog. Continued use of the extension after an update constitutes acceptance of the revised policy.

---

## 7. Contact

If you have any questions about this privacy policy or how LexiDrop handles data, please contact:

**Hasan Rabbi**  
📧 rabbihasan.dev@outlook.com  
🔗 GitHub: https://github.com/rabbihasan

---

*LexiDrop is open-source. You are welcome to inspect every line of code to verify these claims.*
