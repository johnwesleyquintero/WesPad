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
- **Native File Access:** Save and open files directly from your local disk using the File System Access API.
- **Command Palette:** Quick access to all features via `Ctrl + Shift + P`.
- **Find & Replace:** Full find and replace functionality within your documents.
- **Zen Mode:** Distraction-free writing environment with `Alt + Z`.
- **AI Assistant (Optional):**
  - **Conversational AI:** Chat with your documents.
  - **Rewrite & Refine:** Polish selected text with multiple tones (Professional, Casual, Creative, Academic, Concise).
  - **Summarize & Generate:** Condense notes or create content from scratch.
  - _Powered by Google Gemini Flash 1.5/2.0_
- **Quality of Life:**
  - Export to `.md` or `.txt`.
  - Drag & Drop file support.
  - Customizable font family (Mono, Sans, Serif).
  - Adjustable font size and theme (Dark/Light/System).
  - Toggleable Word Wrap.
- **PWA / Offline Capable:**
  - Installable on Desktop and Mobile.
  - Works fully offline.
  - **OS Integration:** Register as a file handler to open `.md` and `.txt` files directly from your operating system.

## 🛠️ Tech Stack

- **Framework:** React 18 + TypeScript
- **Styling:** Tailwind CSS (Modern, utility-first styling)
- **AI:** Google GenAI SDK (`@google/genai`)
- **Icons:** Lucide React
- **Markdown:** React Markdown + Remark GFM
- **Code Highlighting:** React Syntax Highlighter (Prism)

## 🚀 Getting Started

### Prerequisites

- A modern web browser.
- [Node.js](https://nodejs.org/) (v18 or higher)
- (Optional) A Google Gemini API Key for AI features.

### Installation / Running

1.  **Clone the repo:**

    ```bash
    git clone https://github.com/johnwesleyquintero/wespad.git
    cd wespad
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Run in Development Mode:**

    ```bash
    npm run dev
    ```

4.  **Open in Browser:**
    Navigate to the URL shown in your terminal (usually `http://localhost:5173`).

5.  **Build for Production:**

    ```bash
    npm run build
    ```

    The production-ready files will be in the `dist/` directory.

6.  **Install App:**
    Click the "Install" icon in your browser address bar to install WesPad as a standalone PWA application.

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

| Shortcut           | Action                  |
| ------------------ | ----------------------- |
| `Ctrl + N`         | New Document            |
| `Ctrl + O`         | Open File               |
| `Ctrl + S`         | Save As                 |
| `Ctrl + Shift + P` | Command Palette         |
| `Ctrl + F`         | Find & Replace          |
| `Ctrl + K`         | AI Assistant            |
| `Alt + Z`          | Zen Mode                |
| `Ctrl + Z`         | Undo                    |
| `Ctrl + Y`         | Redo                    |
| `Tab`              | Indent (2 spaces)       |
| `Esc`              | Close Modals / Exit Zen |

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
