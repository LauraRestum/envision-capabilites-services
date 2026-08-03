# Accessibility flags — changes that would alter the default design

Everything in this file fails WCAG 2.2 AA (or the accessibility-director house
standard) but cannot be fixed without visibly changing the default rendering,
so per the retrofit ground rules nothing here has been touched. Each entry
lists the smallest on-brand fix from the skill's verified tables, ready to
apply on approval. Ratios are computed with the WCAG relative-luminance
formula against the actual composited background (alpha blends included).

A note on what is NOT here: the audit found no opacity-floor failures from
the web reference section 5 (the deck's dimmest informational text is
`--text-faint` at 0.72 white, which measures 9.9:1 on the modal surface), no
color-only meaning carriers, and no interactions that need new visible
controls. Slide navigation already has visible on-screen previous/next
buttons in the nav, overlays have visible closers, and the BSC map's text
alternative fit invisibly. Placeholder text in the In Action gate measures
4.75:1 and passes.

---

## 1. `--text-soft` body/label text on light surfaces

- **File / selector:** `index.html` — token `--text-soft: #6b7a96` (`:root`),
  used as text color by `.navlink` (nav links), `.campus-card-sub`,
  `.campus-photo-note`, `.cb-num .cb-unit`, `.cb-label`, `.cb-note`,
  `.tile-sub`, `.toc-tile-sub`, `.doc-link-sub`, `.general-contacts-label`,
  and other 10.5–14px captions on the white and `--bg-tint` slide surfaces.
- **What fails:** normal-size text below the contrast minimum.
- **Measured vs required:** 4.33:1 on `#ffffff`, 4.07:1 on `#f6f8fc` —
  required 4.5:1 (these run 10.5–14px, so the 3:1 large-text allowance does
  not apply).
- **WCAG:** 1.4.3 Contrast (Minimum).
- **Smallest on-brand fix:** darken the one token. `#5b6880` is the nearest
  passing value in the same blue-slate family (5.62:1 on white, 5.29:1 on
  tint); the skill's table alternative is house Charcoal `#53565A` (7.38:1),
  the standard body-copy color on light grounds. One-line change either way;
  every listed selector inherits it.

## 2. Project status chips in the In Action views

- **File / selector:** `index.html` — `.proj-status--proto`,
  `.proj-status--active`, `.proj-status--shipping` (rendered inside the dark
  In Action modal and project detail pages, ~11px bold uppercase).
- **What fails:** chip label text below the contrast minimum on its tinted
  chip background.
- **Measured vs required (text on composited chip over `#000d2e`):**
  - Prototype `#9a6a00` on goldenrod tint: **3.31:1** vs 4.5:1
  - Active `#4f8a17` on green tint: **3.73:1** vs 4.5:1
  - Shipping `#1f5fc0` on blue tint: **2.83:1** vs 4.5:1
- **WCAG:** 1.4.3 Contrast (Minimum).
- **Smallest on-brand fix (dark-system table values, backgrounds and borders
  unchanged):** Prototype → Goldenrod `#FFCF00` (10.59:1); Active → brand
  Green `#78BE21` (6.88:1); Shipping → Bright Blue `#41B6E6` (7.43:1). Text
  color only; the tinted chip fills and borders already read as UI at 3:1+.

## 3. Body text under the 16px house floor

- **File / selector:** `index.html` — `.m-card .m-card-d` (14px card
  descriptions), `.m-cat-table` (13.5px catalog/equipment table cells),
  `.m-cat-foot` (12.5px catalog footnotes), `.bcard-row` (13px contact
  rows), `.cb-note` (10.5px campus notes), `.slide--innovation` list bodies
  in the same range.
- **What fails:** running body copy below the skill's 16px web floor. (This
  is the accessibility-director house standard from universal rule 6, not a
  WCAG 2.2 AA failure — resize/reflow behavior itself passes.)
- **Measured vs required:** 10.5–14px vs 16px minimum for body text.
  Micro-labels, tags, and eyebrows (10–12px uppercase letterspaced) are
  labels, not body copy, and are not flagged.
- **WCAG:** none directly (house standard; supports 1.4.4 Resize Text
  comfort). Users can compensate today via the new accessibility panel's
  text-size control.
- **Smallest on-brand fix:** raise the listed body-copy selectors to 16px
  (tables may stay at 14px if treated as data, at your call). This reflows
  cards and tables, hence flagged rather than fixed.

## 4. Focus ring color on the mixed-surface slides (advisory)

- **File / selector:** `index.html` — curated rings on dark-surface
  components use `--green: #78BE21`; the global default ring added in this
  retrofit follows the same convention.
- **What fails:** nothing today — every audited focusable element sits on a
  surface where its ring measures 3:1+ (green on the dark surfaces 8.37:1,
  ink green on the light zones 5.0:1). Flagged as advisory because any
  future control placed on a white surface that inherits the green default
  ring would measure 2.29:1 vs the required 3:1.
- **WCAG:** 1.4.11 Non-text Contrast (future risk only).
- **Smallest on-brand fix:** when adding controls on light surfaces, extend
  the light-zone override list (`.topnav`, `.nav-menu`, `.bcard`,
  `.campus-footer`) or use `--green-ink` locally. No change needed now.
