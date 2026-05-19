# FlipFlap

A fast, minimal flashcard app for your desktop. Create decks, study in multiple modes, and track your progress — all stored locally, no account required.

Built with [Tauri 2](https://tauri.app) + [SvelteKit](https://kit.svelte.dev).

---

## Features

- **Three study modes** — Flashcards (flip), Write (type the answer), Multiple Choice (4 options)
- **Folders** — organise decks into collapsible folder groups
- **Images on cards** — attach a photo to either side of any card
- **16 themes** — 8 light and 8 dark colour themes, switchable live with no restart
- **Import / Export** — share individual decks as `.flipflap` files; import decks from other apps using the AI conversion prompt in [`FLIPFLAP_FORMAT.md`](FLIPFLAP_FORMAT.md)
- **Study stats** — daily review count and study streak tracked automatically
- **Fully local** — all data is stored in a single JSON file on your machine, nothing is sent anywhere

---

## Study Modes

### Flashcards
Classic flip-card study. Tap the card to reveal the back, then mark yourself as **Got it** (removes the card from the queue) or **Still Learning** (sends it to the back of the queue). Progress is tracked until every card is cleared.

### Write
The front of the card is shown and you type the answer from memory. Your input is compared case-insensitively. Correct answers are shown in green; wrong answers reveal the correct text (and image if one exists) so you can learn from the mistake.

### Multiple Choice
Four options are presented per question — one correct, three distractors drawn from other cards in the deck. A correct answer bounces and auto-advances. A wrong answer highlights the correct option and counts down 4 seconds before moving on. Your score is shown at the end.

---

## The `.flipflap` Format

Each deck can be exported as a `.flipflap` file (plain JSON) and re-imported on any machine running FlipFlap. This makes it easy to share decks with others or convert flashcard sets from other programmes.

See [`FLIPFLAP_FORMAT.md`](FLIPFLAP_FORMAT.md) for the full format specification, including an AI prompt you can use to convert Anki exports, Quizlet copy-pastes, CSVs, or any JSON/XML file into a valid `.flipflap` deck.

**To export a deck:** open it and click the download icon (↓) in the top toolbar.  
**To import a deck:** click the upload icon (↑) on the home dashboard.

---

## Building from Source

### Requirements

| Tool | Version |
|------|---------|
| Node.js | 18 or later |
| Rust | latest stable |
| Tauri CLI | v2 (installed via npm) |

### Windows

```bash
# Install dependencies
npm install

# Development (hot-reload)
npm run tauri dev

# Production build (.exe + NSIS installer)
npm run tauri build
```

Output:
- `src-tauri/target/release/flipflap.exe` — portable executable
- `src-tauri/target/release/bundle/nsis/flipflap_0.1.0_x64-setup.exe` — installer

### macOS

macOS requires one extra step to generate the app icon from the included iconset:

```bash
iconutil -c icns "logo-export/FlipFlap.iconset" -o "src-tauri/icons/icon.icns"
npm install
npm run tauri build
```

Output:
- `src-tauri/target/release/bundle/dmg/flipflap_0.1.0_*.dmg` — disk image installer
- `src-tauri/target/release/bundle/macos/flipflap.app` — raw app bundle

Full macOS build instructions (including Gatekeeper workarounds and troubleshooting) are in [`BUILD_MACOS.md`](BUILD_MACOS.md).

---

## Data Storage

All app data is stored in a single JSON file on your local machine:

| Platform | Path |
|----------|------|
| Windows | `%APPDATA%\com.flipflap.app\data.json` |
| macOS | `~/Library/Application Support/com.flipflap.app/data.json` |
| Linux | `~/.local/share/com.flipflap.app/data.json` |

Nothing is synced, logged, or transmitted. The file is human-readable and can be backed up manually.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | [Tauri 2](https://tauri.app) (Rust) |
| Frontend | [SvelteKit 2](https://kit.svelte.dev) + TypeScript |
| Styling | Plain CSS with CSS custom properties (no framework) |
| Icons | [Tabler Icons](https://tabler.io/icons) webfont |
| Storage | `@tauri-apps/plugin-fs` — reads/writes a local JSON file |
| Bundler | Vite 6 |

---

## Project Structure

```
flipflap/
├── src/
│   ├── app.css                  # Global styles, CSS variables, scrollbar & select theming
│   ├── app.html                 # HTML shell (loads Tabler Icons CDN)
│   ├── lib/
│   │   ├── components/          # Svelte components (Dashboard, modals, etc.)
│   │   ├── stores/              # appData Svelte store + persistence logic
│   │   ├── icons.ts             # Tabler icon catalogue (9 groups, ~115 icons)
│   │   ├── themes.ts            # 16 colour themes with full CSS variable sets
│   │   ├── types/               # TypeScript interfaces (Deck, Card, Folder, etc.)
│   │   └── persistence.ts       # loadData / saveData via Tauri FS plugin
│   └── routes/
│       ├── +page.svelte         # Home dashboard
│       └── deck/[id]/
│           ├── +page.svelte     # Deck detail + card list
│           ├── study/           # Flashcard mode
│           ├── write/           # Write mode
│           └── quiz/            # Multiple choice mode
├── src-tauri/
│   ├── icons/                   # All app icon assets (ico, icns, png)
│   ├── src/main.rs              # Tauri entry point
│   └── tauri.conf.json          # Tauri configuration
├── logo-export/                 # Original logo assets (SVG, iconset, ICO)
├── FLIPFLAP_FORMAT.md           # .flipflap file format documentation
└── BUILD_MACOS.md               # macOS build instructions
```

---

## License

MIT
