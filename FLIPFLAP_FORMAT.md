# FlipFlap File Format — `.flipflap`

A `.flipflap` file is a plain JSON file that represents a **single flashcard deck**. It can be imported directly into FlipFlap via the upload button on the dashboard, or exported from any deck's detail page.

---

## File Structure

```json
{
  "v": 2,
  "app": "flipflap",
  "exportedAt": "2026-05-19T12:00:00.000Z",
  "name": "Deck Name",
  "icon": "planet",
  "cards": [
    {
      "front": { "text": "Question or term" },
      "back":  { "text": "Answer or definition" }
    },
    {
      "front": { "text": "Term with image", "imagePath": "data:image/png;base64,..." },
      "back":  { "text": "Answer" }
    }
  ]
}
```

---

## Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `v` | `number` | ✅ | Format version. Must be `2`. |
| `app` | `string` | ✅ | Must be `"flipflap"`. Used to validate the file. |
| `exportedAt` | `string` | ✅ | ISO 8601 timestamp of when the file was created. |
| `name` | `string` | ✅ | Deck name, max 60 characters. |
| `icon` | `string` | — | A [Tabler Icons](https://tabler.io/icons) icon name without the `ti-` prefix (e.g. `"planet"`, `"book"`, `"flask"`). Leave as `""` for no icon. |
| `cards` | `array` | ✅ | Array of card objects. Must have at least 1 card. |

### Card Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `front` | `object` | ✅ | The front face of the card (the question/term). |
| `front.text` | `string` | — | Text displayed on the front. Either `text` or `imagePath` (or both) must be present. |
| `front.imagePath` | `string` | — | Base64-encoded image as a data URL (`data:image/png;base64,...`). Optional. |
| `back` | `object` | ✅ | The back face of the card (the answer/definition). |
| `back.text` | `string` | — | Text displayed on the back. |
| `back.imagePath` | `string` | — | Base64-encoded image on the back. Optional. |

---

## Rules & Constraints

- `name` is trimmed to 60 characters on import if longer.
- Cards with no `text` and no `imagePath` on either side will import but appear blank — avoid this.
- `imagePath` must be a valid base64 data URL if present. Large images (> ~1 MB base64) will bloat the file significantly.
- Unknown fields are silently ignored, making the format forward-compatible.
- File extension must be `.flipflap` (or `.json` for manual import).

---

## Minimal Valid Example

```json
{
  "v": 2,
  "app": "flipflap",
  "exportedAt": "2026-01-01T00:00:00.000Z",
  "name": "My Deck",
  "icon": "book",
  "cards": [
    { "front": { "text": "Hello" }, "back": { "text": "Hola" } },
    { "front": { "text": "Thank you" }, "back": { "text": "Gracias" } }
  ]
}
```

---

## How to Import

1. Open FlipFlap.
2. On the home dashboard, click the **upload icon** (↑) in the top toolbar.
3. Select your `.flipflap` file.
4. The deck appears instantly in your library.

Alternatively, go to **Settings → Import** to import any `.flipflap` file (supports both v2 single-deck and the legacy v1 multi-deck format).

---

## How to Export

1. Open any deck.
2. Click the **download icon** (↓) in the deck's header toolbar.
3. A `.flipflap` file is saved to your downloads folder.

---

## AI Conversion Prompt

Use the prompt below to ask any AI assistant (Claude, ChatGPT, Gemini, etc.) to convert flashcard data from another program's export format (Anki `.apkg` text export, Quizlet copy-paste, XML, CSV, JSON) into a valid `.flipflap` file.

---

### Prompt Template

> I want to convert flashcard data into a FlipFlap `.flipflap` file. Here is the format specification:
>
> **Target format:**
> ```json
> {
>   "v": 2,
>   "app": "flipflap",
>   "exportedAt": "<current ISO timestamp>",
>   "name": "<deck name>",
>   "icon": "<tabler icon name or empty string>",
>   "cards": [
>     { "front": { "text": "<question/term>" }, "back": { "text": "<answer/definition>" } }
>   ]
> }
> ```
>
> **Rules:**
> - `v` must be the number `2`.
> - `app` must be the string `"flipflap"`.
> - `name` is the deck title, max 60 characters.
> - `icon` is an optional [Tabler Icons](https://tabler.io/icons) name without the `ti-` prefix (e.g. `"book"`, `"flask"`, `"language"`). Use `""` if unsure.
> - Each card has a `front` and `back` object, each with a `text` string.
> - Do not include HTML tags — plain text only.
> - If the source data has a term/definition structure, put the term on `front.text` and the definition on `back.text`.
> - If the source data has question/answer structure, put the question on `front.text` and the answer on `back.text`.
> - Output only the raw JSON — no markdown code fences, no explanation.
>
> **Source data to convert:**
> ```
> [PASTE YOUR DATA HERE]
> ```
>
> Convert it now and output a single valid `.flipflap` JSON object.

---

### Tips for specific source formats

| Source | How to get the raw data |
|--------|------------------------|
| **Anki** | File → Export → "Cards in Plain Text (.txt)" — one card per line, tab-separated term and definition |
| **Quizlet** | Open a set → select all text on the page → paste into the prompt |
| **CSV** | Paste the CSV rows directly, with a note like "column 1 is the term, column 2 is the definition" |
| **JSON / XML** | Paste the raw file contents and describe which fields are the term and definition |
| **Google Sheets** | File → Download → Tab-separated values (.tsv), then paste the contents |

---

## Version History

| Version | Description |
|---------|-------------|
| `v1` | Legacy multi-deck format. Contained a `decks` array and optional `folders` array. Still supported on import for backwards compatibility. |
| `v2` | Current format. Single deck per file. Simpler, portable, and easier to generate with AI tools. |
