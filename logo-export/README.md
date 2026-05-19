# FlipFlap — Logo bundle

The FF Ligature mark, in every format you need for desktop (Windows + macOS) and the web.

## Files

```
flipflap.svg                   Master mark (dark tile background)
flipflap-transparent.svg       Mark only, transparent background

FlipFlap.ico                   Windows app icon — multi-res (16/32/48/64/128/256)
FlipFlap.iconset/              macOS source folder — see "Building .icns" below

png/                           PNG renders, dark tile background
  flipflap-16.png              favicon (standard)
  flipflap-32.png              favicon retina / Windows taskbar
  flipflap-48.png
  flipflap-64.png
  flipflap-128.png
  flipflap-180.png             Apple touch icon
  flipflap-192.png             Android / PWA
  flipflap-256.png
  flipflap-512.png             PWA splash, store listings
  flipflap-1024.png            macOS app icon source / store hero

png-transparent/               Same set, no background tile
```

## Web — favicons

Drop into your `<head>`:

```html
<link rel="icon" type="image/svg+xml" href="/flipflap.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/png/flipflap-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/png/flipflap-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/png/flipflap-180.png">
```

## Windows — desktop app

Point your installer / executable resource at `FlipFlap.ico`. It already
contains every size Windows asks for (16, 32, 48, 64, 128, 256); the OS
picks the right one per context.

## macOS — building the .icns

The `FlipFlap.iconset/` folder has the layout Apple's `iconutil` expects,
**but** the export filenames use `-2x` where Apple requires `@2x`. Run this
one-liner first to rename them, then build:

```bash
cd FlipFlap.iconset
for f in *-2x.png; do mv "$f" "${f%-2x.png}@2x.png"; done
cd ..
iconutil -c icns FlipFlap.iconset
```

You'll get `FlipFlap.icns`. Drop it into your `.app` bundle's
`Contents/Resources/` and reference it from `Info.plist` as `CFBundleIconFile`.

## Colors

- Ink:    `#1F1B2E`
- Coral:  `#FF7A59`
- White:  `#FFFFFF` @ 92% opacity
