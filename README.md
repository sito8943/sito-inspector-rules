# Sito Inspector Rules (Browser Extension)

Firefox's inspector draws dashed guide lines from the edges of the hovered element
across the whole page, which makes it trivial to see whether things line up.
Chrome doesn't. This tiny MV3 extension brings that behaviour to any page, in any
Chromium browser (and Firefox too).

## Features

- Toggle per tab from the toolbar icon or `Alt+Shift+R` (`Option+Shift+R` on Mac). Badge shows `ON`.
- Chrome's own inspect mode (`Cmd+Shift+C`) swallows mouse events, so the two can't run together. Use one or the other; after you pick an element in DevTools the guides pin to it.
- With DevTools open, the guides pin to whatever element you select in the Elements panel (`$0`).
- Hover any element: four dashed guide lines extend from its edges across the viewport.
- Box highlight (blue), padding (purple) and margin (yellow) areas, Firefox-style.
- Label with tag, `#id`, first classes and `width × height`.
- Click to pin an element (guides stay while you move the mouse). Click again to unpin.
- `Esc` turns the guides off (click the pinned element or anywhere to unpin instead).
- Guides follow scroll and resize.
- The toolbar icon turns grey and is disabled on pages where extensions can't run (`chrome://`, the Web Store, `about:` …).
- Only `activeTab`, `scripting` and `tabs` (to read tab URLs for the icon state); nothing is injected until you toggle it on.

## Files

- `manifest.json` — MV3 manifest (Chrome + Firefox).
- `background.js` — injects the content script on demand and toggles it, sets badge.
- `content.js`, `content.css` — overlay drawing and interaction.
- `devtools.html`, `devtools.js` — forwards the DevTools selection to the page.
- `icon.png`, `icon128.png` — toolbar icons; `icon-off*.png` — greyed variant for blocked pages.

## Install (Chrome / Edge / Brave, unpacked)

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and pick this folder.
4. Pin the icon, open any page, click the icon (or `Alt+Shift+R`).

## Shortcut not working?

Chrome only *suggests* `Alt+Shift+R`; it won't bind it if another extension already uses
that combination, or if the extension was updated from a previous install. Nothing in the
extension can force it.

1. Open `chrome://extensions/shortcuts`.
2. Find **Sito Inspector Rules** → *Toggle alignment guides*.
3. Set `Alt+Shift+R` (`Option+Shift+R` on Mac) and keep the scope as **In Chrome**.

The shortcut is also intentionally disabled on pages where extensions can't run
(`chrome://`, the Web Store, `about:` …) — the greyed icon means the same thing.

## Install (Firefox, temporary)

1. `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on…** → pick `manifest.json`.

## Packaging

```sh
npx web-ext build --overwrite-dest
```

## License

MPL-2.0
