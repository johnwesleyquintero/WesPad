# WesPad

> "If Notepad learned new tricks, forgot its roots, and started charging rent. WesPad keeps the tricks and fires the landlord."

**WesPad** is a sovereign, local-first, AI-optional writing pad. It is designed to be the ultimate distraction-free writing environment that lives entirely in your browser.

No subscriptions. No forced logins. No telemetry.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-alpha-orange.svg)

<img width="700" alt="image" src="https://github.com/user-attachments/assets/59a85d2e-8abd-44e2-802d-ab41e844b53f" />

## 🎯 Vision

Modern writing apps have become bloated SaaS platforms demanding monthly tithes for basic functionality. WesPad returns to first principles:

- **Local-first:** Your data lives in your browser's storage. It does not leave your machine unless you export it.
- **Markdown Native:** First-class support for Markdown editing and previewing.
- **Pluggable AI:** AI is a tool, not a subscription. Bring your own Google Gemini API key.
- **Instant Load:** Opens faster than you can think of what to write.

## ✨ Features

- **Session Persistence:** Auto-saves to local storage. Never lose a draft on refresh.
- **Tabbed Interface:** Manage multiple documents simultaneously.
- **Split View:** Edit Markdown on the left, see the rendered preview on the right.
- **AI Assistant (Optional):**
  - **Rewrite:** Polish selected text for clarity and tone.
  - **Summarize:** Condense long notes into paragraphs.
  - **Generate:** Create content from scratch using custom prompts.
  - _Powered by Google Gemini Flash 2.5/3.0_
- **Quality of Life:**
  - Export to `.md` or `.txt`.
  - Customizable font family (Mono, Sans, Serif).
  - Adjustable font size.
  - Toggleable Word Wrap.
- **PWA / Offline Capable:**
  - Installable on Desktop and Mobile.
  - Works fully offline (once cached).

## 🛠️ Tech Stack

- **Framework:** React 19 + TypeScript
- **Styling:** Tailwind CSS (CDN/Runtime for zero-build portability)
- **AI:** Google GenAI SDK (`@google/genai`)
- **Icons:** Lucide React
- **Markdown:** React Markdown

## 🚀 Getting Started

### Prerequisites

- A modern web browser.
- (Optional) A Google Gemini API Key for AI features.

### Installation / Running

Since WesPad is designed to be lightweight, it runs directly via ES Modules in the browser.

1.  **Clone the repo:**

    ```bash
    git clone https://github.com/johnwesleyquintero/wespad.git
    cd wespad
    ```

2.  **Serve the files:**
    You can use any static file server.

    ```bash
    # using python
    python3 -m http.server 8000

    # using serve
    npx serve .
    ```

3.  **Open in Browser:**
    Navigate to `http://localhost:8000`.

4.  **Install App:**
    Click the "Install" icon in your browser address bar to install WesPad as a standalone application.

## 🤖 Configuring AI

WesPad uses a **Bring Your Own Key (BYOK)** model. You are in control.

1.  **Get a Key:** Obtain a free API key from [Google AI Studio](https://aistudio.google.com/).
2.  **Enter in WesPad:**
    - Click the **Settings (⚙️)** icon in the top right of the tab bar.
    - Paste your key into the input field.
    - Click **Save**.
3.  **Start Creating:** Use `Ctrl + K` or the sparkle icon to access AI tools.

_Security Note: Your API key is stored locally in your browser's `localStorage`. It is sent directly from your browser to Google's servers for inference. It is never sent to any WesPad backend (because there isn't one)._

## ⌨️ Keyboard Shortcuts

| Shortcut   | Action                      |
| ---------- | --------------------------- |
| `Ctrl + N` | New Tab                     |
| `Ctrl + K` | Open AI Command Palette     |
| `Ctrl + S` | Force Save (Visual trigger) |
| `Tab`      | Indent (2 spaces)           |

## 🗺️ Roadmap

- [x] Phase 0: Foundation (React + TS + Tailwind)
- [x] Phase 1: Core Editor (Tabs, Persistence)
- [x] Phase 2: Session Intelligence
- [x] Phase 3: Markdown Mode (Edit/Preview/Split)
- [x] Phase 5: AI Integration (Rewrite, Summarize, Generate)
- [x] Phase 6: Quality of Life (Export, Fonts, Word Wrap)
- [x] Phase 7: Offline PWA Support

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch.
3.  Commit your changes.
4.  Open a Pull Request.

## 📄 License

MIT. Own your code, own your text.
