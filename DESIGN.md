# Design Rules — Eric's Movie App

Theme: **80s/90s NYC graffiti** — spray paint on a concrete wall. Loud, colorful, street.
Keep everything on-system by using the tokens and component classes below — never hardcode
ad-hoc colors, font sizes, or shadows in components. (Re-theming is a token/font/texture swap;
components reference roles, not raw colors — that's the point of this system.)

## Brand

| Element      | Rule                                                                    |
| ------------ | ----------------------------------------------------------------------- |
| Background   | Dark concrete `ink` (#141014) + spray blooms + faint brick lines        |
| Primary      | Hot magenta `spray` (#ff2e88); highlight `sprayhi`, deep `spraylo`      |
| Accents      | `cyan` #26e0ff · `lime` #b6ff2e · `yellow` #ffe600 · `purple` #9d4edd   |
| Text         | Paint-white `cream` (#f6f2ea)                                           |
| Live/status  | Green `live` (#35d07f)                                                  |
| Display font | **Bangers** — loud piece lettering (`.u-display`)                       |
| Tag/labels   | **Permanent Marker**, rotated (`.u-label`, `.sticker`)                  |
| Drip accent  | **Rubik Wet Paint** (`font-drip`) — sparingly, decorative only          |
| Body font    | Inter                                                                    |
| Motif        | Crown ♛ (writer "king") as a kicker prefix; hard drop shadows           |
| Signature    | Burner text `.u-piece` (fill + dark outline + hard shadow)              |

## Tokens (tailwind.config.js)

Colors: `ink · surface · surface2 · line · spray · sprayhi · spraylo · cyan · lime · yellow · purple · cream · live`
Fonts: `font-display · font-tag · font-drip · font-body · font-mono`
Shadows: `shadow-glow · shadow-glowStrong · shadow-card · shadow-piece`

## Component classes (src/index.css `@layer components`)

- **Typography:** `.u-display`, `.u-label`, `.u-glow`, `.u-piece`, `.u-outline`
- **Surfaces:** `.card`, `.glass`, `.frame`, `.sticker`
- **Buttons:** `.btn` + `.btn-spray` / `.btn-ghost`
- **Chips:** `.chip` / `.chip-active`
- **Rails:** `.rail`, `.no-scrollbar`
- **Loading:** `.shimmer`

## Reusable primitives (src/components/ui/)

- `Button` (+ `LinkButton`, `AnchorButton`) — variants `gold` | `ghost`
- `Chip` — filter/tab pills
- `Heading` — mono kicker + big display title (`label`, `emoji`, `size`)
- `Skeleton` (+ `PosterSkeletonRow`)
- `HScroll` — horizontal rail with hover arrows

## Rules for new code

1. Components stay **≤300 lines**. Split when they grow (see `WhereToWatch`, `GameCard`).
2. Every interactive element gets `data-focusable` for TV / D-pad navigation.
3. Reach for a `ui/` primitive before writing new markup; add a primitive if a pattern repeats.
4. Two-tier headings: mono `♛ Kicker` label over an Anton display title.
5. Only legal sources. Paid titles deep-link out to the official app; never embed/re-stream them.
