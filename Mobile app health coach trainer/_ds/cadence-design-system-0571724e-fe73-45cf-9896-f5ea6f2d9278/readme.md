# Cadence Design System

Cadence is a wearable health platform: a screenless band that measures continuously, and an app that turns those readings into one useful decision a day. This design system covers both surfaces — the mobile app and the marketing site.

## Sources this system was built from

- `uploads/WHOOPIMAGE.png` — a single reference screenshot supplied by the user, showing a competitor's "Healthspan" screen (biological age ring, pace-of-aging tick scale, insight card).
- Two reference URLs named in the brief: `https://ouraring.com/` and `https://www.whoop.com/`.
- No codebase, Figma file, brand kit, or logo was provided.

**Important scope note.** The references above were used only to understand the *category* — what a recovery-tracking product measures, how dense its screens are, what a member expects to see each morning. Cadence is an original brand: its own name, palette, typography, component inventory and voice. Nothing in this system reproduces another company's logo, wordmark, proprietary metric names, or distinctive branded visual identity. If you need a design that matches a specific existing product, supply that product's own design assets.

**There is no logo.** No brand mark was provided, so none was drawn. Wherever a mark would sit — site header, app profile, thumbnail — the word "Cadence" is set in Space Grotesk Bold at -0.04em. Supply a logo file and it can be dropped into `assets/` and swapped in.

---

## Content fundamentals

Cadence writes like a good coach reading an instrument panel: it states the measurement, says what it means, and gives one instruction. It never sells the reader on their own body.

**Person and address.** Second person, always. "Your HRV rose 4ms overnight." Never "we noticed" or "the app detected" — the app is not a character. The user's name appears once a day, in the morning greeting, and nowhere else.

**Sentence shape.** Measurement first, interpretation second, instruction third. "You were 39 minutes short of your sleep need. Going to bed by 10:25 pm tonight puts you back at 100%." Two to three sentences per insight, maximum. If it needs four, it belongs in a sheet.

**Casing.** Three registers, used strictly:
- UPPERCASE with wide tracking for structural labels — screen titles, card eyebrows, tile labels, buttons. `HEALTHSPAN`, `PACE OF AGING`, `VIEW YOUR PLAN`.
- Sentence case for everything a human reads as a sentence — insight titles, body copy, chips, list rows. "Steady and healthy", not "Steady And Healthy".
- Numerals stand alone, never spelled out. `29.9`, `7:42`, `0.8x`, `+4ms`.

**Numbers.** Always carry a unit and, where one exists, a baseline. "68 ms · vs 30-day average" is a fact; "68 ms" alone is trivia. Deltas are signed and coloured by whether the change is good for that specific metric — a falling resting heart rate is green.

**Tone.** Matter-of-fact and non-judgemental. Cadence reports; it does not congratulate or scold. There are no exclamation marks, no "Great job!", no streak guilt. Bad readings are stated plainly with a cause and a next step: "Your training load has climbed 18% over 14 days while sleep held flat. A lighter week now protects the gains."

**Uncertainty.** Named, not hidden. "Next update in 6 days." "Estimated from heart rate, movement and respiratory rate." Missing data says when it will arrive and never renders as zero.

**Marketing voice** is the same voice with more air around it. Short declarative headlines with a full stop: "Your body has been keeping notes." "No screen. Nothing to check." No superlatives, no "revolutionary", no percentage claims without a source.

**No emoji.** Anywhere. Meaning is carried by the icon set and by the metric hues.

---

## Visual foundations

**Colour.** The base is a warm ink ramp, never pure black — `--ink-1000` is `#0C0B0A`, which reads as charcoal rather than void and keeps the mint from vibrating. Mint (`--mint-500` `#2FD69C`) is the single brand signal: it means recovery, readiness, and "this is the action". Four further hues each own one metric domain and are used for nothing else — amber for strain, iris for sleep, coral for stress and cardiac alerts, sky for cardiovascular fitness. Hue is a *category*, not a sentiment; a coral bar is not a warning, it is a stress reading. Semantic status (`--state-good/caution/poor/info`) is a separate, deliberately overlapping alias layer. A light theme (`[data-theme="light"]`) exists for one marketing section and for print; the app is dark, permanently.

**Type.** Space Grotesk for anything structural or numeric — display headlines, screen titles, uppercase labels, and every metric readout (tabular figures on, `-0.03em`). Manrope for everything read as prose, at 1.62 line-height. The pairing is deliberate: the grotesk's flat terminals and single-storey digits make numbers look like instrument output; Manrope softens the explanation underneath. Micro-labels are 11–12px bold uppercase at 0.14em, widening to 0.2em for screen titles.

**Spacing and layout.** 4px base, doubling above 24px. 20px mobile gutter, 40px desktop; 12px between cards; 20px inside a card (14px compact). Minimum touch target 44px. Content column caps at 1240px, prose at 720px. App screens are a single scrolling column — no side-by-side panels on mobile, ever.

**Backgrounds.** Flat warm ink. One exception: a single soft radial mint bloom behind the hero of the marketing page and behind the phone frame in the app kit, at 9–16% opacity. No full-bleed photographic backgrounds, no repeating patterns, no textures, no noise, no gradient meshes. The only gradients in the system are protection scrims (`--scrim-top`, `--scrim-bottom`) used to keep chrome legible over content, and the radial glow behind a metric ring.

**Cards.** `--surface-card` (`#1D1B1A`), a 1px hairline at 7% white, 16px radius, 20px padding, and a very soft drop shadow that exists to separate the card from the page rather than to lift it. Depth on dark is communicated by a *lighter surface plus a hairline*, not by shadow strength. An optional 3px left rail (`accent`) groups a card into a metric domain — this is the only place a coloured left border appears.

**Corner radii.** 4px badges, 8px controls and inputs, 12px tiles, 16px cards, 22–28px sheets, full pill for buttons, chips and segmented controls. Buttons are pills; containers are not. That contrast is what makes a Cadence action look tappable without a shadow.

**Elevation and glow.** Three levels only: card, raised (a card on a card, or a sheet), and sheet. Glow (`--glow-mint/amber/iris`) is reserved for metric rings — a coloured bloom behind a ring is data emphasis, never decoration on a button.

**Transparency and blur.** Only for chrome that sits over scrolling content: the bottom tab bar, the sticky site header, and toasts. All use `--blur-chrome` (18px blur, 140% saturation) over an 72–86% ink fill. Nothing else is translucent — cards are opaque.

**Motion.** 80ms press, 140ms hover and colour, 220ms sheets and toggles, 400ms bars growing in, 900ms for a ring to draw on. Standard easing is `cubic-bezier(.16,1,.3,1)` — a decisive ease-out. Nothing bounces, springs, or overshoots: measured data does not wobble. A ring draws once on entry and then holds. Reduced-motion users should get the final state immediately.

**Hover, press, focus.** Hover lightens rather than darkens — translucent fills step from 8% to 14% white, mint steps from 500 to 400, ghost text steps from secondary to primary. Press scales to 0.97 and nothing else. Focus is a 2px mint ring at 2px offset, never a glow.

**Borders.** White at 7% (hairline, the default), 12% (subtle, inputs and dividers) and 22% (strong, outline buttons). Cadence has no grey filled dividers — separation is a 1px hairline or 12px of space.

**Imagery.** Warm-neutral, low-contrast, studio-lit product photography and candid athlete photography with no colour cast. Cool, blue-grey "tech" imagery is off-brand. No imagery was supplied with this system, so the marketing kit marks its photo slots with labelled dashed placeholders rather than inventing artwork.

**Charts.** Bars, never lines, for measured readings — a reading is a discrete event. Every series carries a dashed baseline (the 30-day average) because a bar without a reference means nothing. Selected bars stay in the metric hue; unselected bars drop to `--ink-700`.

---

## Iconography

The system ships the **Lucide** outline set (24px grid, 2px stroke, round caps and joins) as flat SVG files in `assets/icons/` — 52 glyphs covering navigation, metrics, activities and states. Lucide was selected as the closest match to the brand's geometric-but-humane drawing; **this is a substitution, not an imported house set** — no icon library was supplied. If Cadence has its own glyphs, replace the files in `assets/icons/` and everything picks them up.

- Icons are rendered through the `Icon` component, which paints the SVG as a CSS mask so it inherits `currentColor` and can be tinted with any metric hue.
- Sizes: 16 inline with text, 20 in controls and list rows, 24 in navigation and headers, 32 in empty states.
- Icons carry meaning, never decoration. A metric icon takes that metric's hue; a UI icon takes `--text-primary` or `--text-tertiary`.
- Emoji are never used. Unicode characters are used only for the neutral em dash in a zero delta.
- The icon set resolves against `window.CADENCE_ICON_BASE` (default `../../assets/icons`). Set it once per page if your file sits at a different depth.

---

## Index

**Root**
- `styles.css` — the single entry point consumers link. `@import`s only.
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `radius.css`, `elevation.css`, `motion.css`, `base.css`
- `assets/fonts/` — Space Grotesk and Manrope variable TTFs (SIL Open Font License, included)
- `assets/icons/` — 52 Lucide SVGs (ISC License, included)
- `guidelines/` — 17 foundation specimen cards (Colors, Type, Spacing, Brand)
- `thumbnail.html` — homepage tile
- `SKILL.md` — Agent Skills wrapper

**Components** (`components/`)

| Group | Components |
| --- | --- |
| `core/` | Button, IconButton, Icon, Badge, Chip, Card |
| `forms/` | Input, Select, Checkbox, Switch, SegmentedControl, Slider |
| `navigation/` | NavHeader, TabBar, Tabs, DateStepper |
| `feedback/` | Sheet, Toast, Tooltip, InsightCallout, EmptyState |
| `data/` | MetricRing, MetricTile, TrendDelta, ScaleGauge, BarSeries, StatRow, ProgressBar |

Every component has a sibling `.d.ts` (props contract) and `.prompt.md` (what & when, usage example, variants). Each group directory has one `@dsCard` preview page.

**Intentional additions.** No source defined a component inventory, so the standard set was authored from scratch and extended with five domain primitives the product cannot exist without: `MetricRing`, `MetricTile`, `ScaleGauge`, `BarSeries` and `TrendDelta`. `Icon` is a wrapper over the bundled glyph set. `InsightCallout` was added because every number in this product needs a sentence explaining it — that pattern appears on every screen.

**UI kits** (`ui_kits/`)
- `app/` — the mobile app. Today, Sleep, Healthspan, Trends, Coach, Profile, with working tab navigation, push/back, bottom sheets and a toast. Entry: `ui_kits/app/index.html`.
- `marketing/` — the public site. Header, hero, proof strip, feature grid, hardware section (light theme), membership, footer. Entry: `ui_kits/marketing/index.html`.

**Starting points.** Button (Core), Input (Forms), NavHeader (Navigation), Sheet (Feedback), MetricRing (Data), plus both UI kit entry screens.
