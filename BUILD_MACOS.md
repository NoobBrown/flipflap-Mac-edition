# Building FlipFlap for macOS

These are step-by-step instructions to build the FlipFlap desktop app on macOS and produce a `.dmg` installer.

---

## Prerequisites

You need to install a few tools before you can build. Open **Terminal** and run each section in order.

### 1. Xcode Command Line Tools

```bash
xcode-select --install
```

A dialog will pop up — click **Install** and wait for it to finish. If it says "already installed", move on.

### 2. Node.js

Download and install the LTS version from: https://nodejs.org

Verify it worked:
```bash
node --version
npm --version
```

Both should print a version number.

### 3. Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

When prompted, choose option **1** (default install). Then reload your shell:

```bash
source "$HOME/.cargo/env"
```

Verify:
```bash
rustc --version
```

---

## Build the macOS Icon

The repo includes a ready-made `.iconset` folder. macOS can convert it to the required `.icns` file natively — run this from the project root:

```bash
iconutil -c icns "logo-export/FlipFlap.iconset" -o "src-tauri/icons/icon.icns"
```

This replaces the placeholder `.icns` with the real FlipFlap icon.

---

## Install Dependencies

From the project root:

```bash
npm install
```

---

## Build the App

```bash
npm run tauri build
```

This will take a few minutes the first time (Rust compiles all dependencies). Subsequent builds are faster.

When it finishes you'll see something like:

```
Finished 2 bundles at:
  src-tauri/target/release/bundle/macos/flipflap.app
  src-tauri/target/release/bundle/dmg/flipflap_0.1.0_x64.dmg
```

---

## Output Files

| File | What it is |
|------|-----------|
| `src-tauri/target/release/bundle/dmg/flipflap_0.1.0_*.dmg` | macOS disk image — drag-to-Applications installer |
| `src-tauri/target/release/bundle/macos/flipflap.app` | The raw `.app` bundle (can be zipped and shared) |

The `.dmg` is what you upload to the GitHub release as the macOS asset.

---

## Gatekeeper Warning

Because the app isn't code-signed with an Apple Developer certificate, macOS will block it on first open with _"flipflap cannot be opened because it is from an unidentified developer."_

To bypass this, right-click (or Control-click) the app → **Open** → **Open** again in the dialog. You only need to do this once.

Alternatively, from Terminal:
```bash
xattr -cr /Applications/flipflap.app
```

---

## Troubleshooting

**`cargo` not found after install**
Run `source "$HOME/.cargo/env"` and try again, or open a new Terminal window.

**Build fails with "linker not found"**
Make sure Xcode Command Line Tools are installed: `xcode-select --install`

**`npm install` fails**
Make sure you're in the project root folder (the one containing `package.json`). Run `ls` to check.

**Icon looks wrong in dev mode**
This is normal — `npm run tauri dev` uses a placeholder icon. The correct icon only appears in the built `.app`.
