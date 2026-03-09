# LexiDrop

LexiDrop is a browser reading assistant for Bengali speakers.

It helps users understand Chinese and English text instantly without leaving the page. The primary flow is:

1. Highlight text on a webpage
2. Trigger LexiDrop
3. Open the side panel
4. Read the translation, explanation, and pronunciation

Vocabulary saving and quiz features support that flow. They are secondary, not the product identity.

## Current Product Direction

LexiDrop should be positioned as:

- an in-browser reading comprehension tool
- a translation and explanation assistant
- a lightweight study companion

LexiDrop is not being positioned as:

- a generic translator
- a physics dashboard
- a vocabulary board product

## Repository Structure

- [extension](/Users/imrabbihasan/Documents/Web-Projects/lexidrop/extension): browser extension shell, side panel, options page
- [landing](/Users/imrabbihasan/Documents/Web-Projects/lexidrop/landing): marketing site
- [client](/Users/imrabbihasan/Documents/Web-Projects/lexidrop/client): embedded React app currently rendered inside the extension side panel
- [server](/Users/imrabbihasan/Documents/Web-Projects/lexidrop/server): local Express + Prisma API used by the current client

## Architecture Status

The repository still contains legacy product direction from an older vocabulary-tracker concept:

- a physics-based vocabulary dashboard in `client`
- a localhost API and SQLite persistence in `server`
- copy that still refers to vocabulary boards and whiteboards

These parts are functional but no longer represent the clearest launch direction.

Recommended direction:

- keep the browser extension side panel as the main product surface
- keep translation, explanation, and pronunciation first
- demote save and quiz actions
- treat the physics dashboard as legacy until it is either removed or intentionally reintroduced

## Installation

Install from Microsoft Edge Add-ons:

[LexiDrop on Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/lexidrop-ai-vocabulary-t/kkidkhomhljchjdhbbggjjchhnnipnji)

## Provider Configuration

LexiDrop currently uses a BYOK setup.

Users should configure:

- provider
- model
- API key

The current codebase still has inconsistent naming in a few places from older Gemini-specific logic. That is being refactored toward provider-neutral configuration.

## Launch Focus

Before launch, prioritize:

1. consistent product messaging
2. side-panel-first UX
3. clear provider/model settings
4. reduced legacy architecture confusion
5. reliable error and loading states
