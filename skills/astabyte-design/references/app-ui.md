# App surface

The look of Astabyte's tools, such as its canvas editor. Dense, dark and quiet chrome so the work in the middle stands out. Blue marks what is selected or active.

## Tokens

| Token | Value | Use |
|---|---|---|
| `paper` | `#0d0d0f` | App ground, top bar |
| `paper-2` | `#16161a` | Side panels, menus, grouped tool bars |
| `paper-3` | `#232328` | Hover on `paper-2`, field fills (often at 70%), slider tracks, scrollbars |
| `canvas` | `#1c1c20` | The work area behind the document |
| `ink` | `#ededee` | Primary text and values |
| `ink-2` | `#c4c4c9` | Default icon and label colour |
| `mute` | `#82828a` | Hints, units, inactive items |
| `line` | `rgb(255 255 255 / 0.07)` | Thin separators inside panels |
| `brand` | `#2f54eb` | Primary action, selected items, active menu rows |
| `brand-2` | `#5576ff` | Hover on brand, selection outlines, handles, snap guides, focused fields |

Text selection uses `brand-2` at about 45%. Scrollbars are thin, `paper-3` on transparent.

## Type

- Geist and Geist Mono. Base size 12px.
- Scale: 10.5px (meta, shortcuts), 11–11.5px (panel labels, values), 12px (menus, buttons), 12.5px (document title).
- Numbers and hex values in mono with `tabular-nums`. Hex values uppercase.
- Weight 500 for titles and section names. Regular everywhere else.

## Layout

- Top bar: 48px, `paper`, three columns (file and title on the left, tools in the centre, actions on the right).
- Left panel (layers) about 240px, right panel (inspector) about 268px, both on `paper-2`.
- The canvas fills the middle on `canvas`.
- Timeline or bottom bar: compact rows, 22–28px items.
- The page itself doesn't scroll. Panels scroll on their own.

## Controls

| Control | Size | Radius | Notes |
|---|---|---|---|
| Tool button | 32×32 | 7px | `ink-2`, hover `paper-3` and `ink` |
| Tool group | padding 4px | 10px | On `paper-2`, buttons 2px apart |
| Small icon button | 28×28 | 6–7px | Play, loop, toggles |
| Primary button | 32px tall | 8px | `brand` fill, white 12px text, hover `brand-2` |
| Field | 28px tall | 6px | `paper-3` at 70%, focus = inset 1px `brand-2` |
| Menu | 192px wide, padding 4px | 10px | `paper-2`, outline 1px `line`, deep soft shadow `0 16px 40px -12px rgb(0 0 0 / .7)` |
| Menu row | 28px | 6px | Hover = `brand` fill with white text |
| Swatch | 18×18 | 4px | Inset 1px white at 14% |
| Slider | 3px track, 12px thumb | round | Thumb `ink` with a 3px `paper-2` ring, grows to 1.15 on hover |
| Separator in a toolbar | 1×20px | | `line` |

- Disabled controls drop to 30–35% opacity.
- Labels and values sit in tight grids, for example label 76px, control, value 38px.
- Panel sections are padded 12px and separated by a 1px `line` shadow. This is the one place a thin separator is expected.

## Canvas feedback

- Hover: a 1px outline in `brand-2`.
- Selection: a 1px `brand-2` outline, 8px white square handles with 2px corners and a `brand-2` ring, a round rotate handle above.
- Size readout: a small `brand-2` chip under the selection, mono 10px, white text, 4px corners.
- Snap guides: 1px `brand-2` lines across the canvas.
- Selected timeline clips: `brand` fill, white text.

## Motion

- Mostly instant. Colour transitions on hover only, about 150ms.
- Small physical touches use expo out, for example a slider thumb scaling in 150ms.
- Never animate layout in the editor. Canvas transforms are direct.

## Don't

- Big type, airy marketing spacing or rounded 14px cards in the chrome.
- A second accent. Status colours beyond the blue.
- Borders around every panel. Separate panels by surface (`paper` vs `paper-2` vs `canvas`).
