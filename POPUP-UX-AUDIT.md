# Popup / Overlay UX Audit — Functional

Scope: every overlay layer in the deck and how they interact when opened,
closed, stacked, and re-entered. **Functional only — no design/visual changes.**

The deck is a single-file vanilla-JS app (`index.html`) plus a self-hosted
chat concierge (`assistant/concierge.js` + `.css`). There are six independent
overlay systems, each previously managing its own open/close state with no
shared coordinator:

| # | Overlay | Element(s) | Module |
|---|---------|-----------|--------|
| 1 | Detail modal (capabilities/services) | `#modal` / `#modalBackdrop` | main IIFE |
| 2 | "Envision In Action" modal | same `#modal`, different render | main IIFE |
| 3 | Base Supply Center map | `#bscModal` / `#bscBackdrop` | bsc IIFE |
| 4 | Campus lightbox | `#lbModal` / `#lbBackdrop` | lightbox IIFE |
| 5 | Section menu (hamburger) | `#navMenu` | main IIFE |
| 6 | Concierge chat | `.ec-panel` / `.ec-launcher` | concierge.js |
| — | Per-slide disclosures | `.reg-pill`/`.reg-panel`, `.proc-more` | main IIFE |

The root problem the audit confirmed: **there was no single source of truth for
"what overlay owns the screen."** Each system opened and closed in isolation, so
layers leaked across each other and per-slide state was never reset. That is the
"layers of small things" the report described.

---

## Findings

### F1 — Per-slide "tabs" stay open when you leave and come back  ·  FIXED
**Severity: High.** Maps directly to "you close out of the whole pop-up but the
tabs are still open when you go back to the screen."

Non-current slides are hidden with `opacity:0; pointer-events:none` (index.html
line ~191) — they are **never removed from the DOM**. So any disclosure widget
left expanded keeps its `aria-expanded="true"` / un-`hidden` panel:

- Compliance **registration tabs** (`.reg-pill` / `.reg-panel`) — literally the
  "tabs" in the report.
- Innovation **process-stage** tooling tails (`.proc-more`, the "N more" button
  on a stage that carries more machines than the card shows by default).

Expand one, navigate away, return → it is still open.

**Fix:** `resetSlideDisclosures()` collapses every `.reg-pill` and `.proc-more`
back to closed, called from `render()` — the single choke point every navigation
passes through. Each slide now opens in its default state every time.

### F2 — Chat panel floats over / lingers behind a modal  ·  FIXED
**Severity: High.** Maps to "when you go back to the chat it's still opened up"
and "layers of small things."

The concierge panel is `z-index:101`, **above** the detail modal's `z-index:100`,
and its launcher ties at `100`. Nothing closed the chat when a deck overlay
opened, and the launcher stayed clickable, so a chat could be raised on top of a
modal — two competing dialogs, two focus traps, two Escape handlers.

**Fix:**
- A shared coordinator (`syncOverlayState`) sets `body.env-overlay-open`
  whenever any deck overlay is open.
- CSS hides `.ec-launcher` and `.ec-panel` while that flag is set, so a chat can
  never stack over an overlay.
- Every overlay's `open*` now calls `dismissPeers()` → closes the chat and the
  section menu first.
- `EnvisionConcierge.close()` was added so the deck can dismiss the chat; the
  chat's `openPanel()` also bails if an overlay already owns the screen.

### F3 — Keyboard / screen-reader focus leaks onto hidden slides  ·  FIXED
**Severity: High (a11y).**

`pointer-events:none` blocks the mouse but **not** keyboard focus. With a modal
open, pressing Tab walked focus onto controls in the dimmed, off-screen slides
behind it (and screen readers could read all ten slides at once). None of the
deck modals trapped focus — only the chat did.

**Fix:** `syncOverlayState()` makes the whole `.deck` wrapper `inert` (with an
`aria-hidden` fallback for browsers without `inert`) whenever an overlay is open,
and clears it when the last one closes. Focus and the accessibility tree are now
contained to the open overlay. Focus is moved into the overlay *before* the deck
is marked inert, so focus is never trapped in an `aria-hidden` subtree.

### F4 — Section menu stays open behind modals and after jumps  ·  FIXED
**Severity: Medium.**

The hamburger `#navMenu` only closed on its own button click, an outside click,
or Escape. Opening a modal left it open behind the modal; pressing a number key
(1–9) jumped sections but left the menu open over the new slide.

**Fix:** `go()` (the universal navigation function) now calls `closeMenu()`, and
`dismissPeers()` closes it whenever any overlay opens. `EnvisionDeck.closeMenu`
is exposed so the BSC and lightbox modules can close it too.

### F5 — Fragmented body scroll-lock ownership  ·  IMPROVED
**Severity: Medium.**

Three modules each set `document.body.style.overflow` independently; the BSC and
lightbox close handlers guessed at the prior state by checking only `#modal`.
Because F2/F3 now guarantee **only one deck overlay is interactive at a time**
(the deck is inert, so you cannot open a second overlay from a slide while one is
up), the lock can no longer be left dangling by a nested open. The existing
per-module restore logic is retained as a backstop.

---

## Recommended (not yet implemented — needs a product call)

### R1 — Chat conversation persists across closes
`started`/`userTurns` and the full message log survive a close, so reopening the
chat shows the entire prior conversation. This is a reasonable session-continuity
choice, but if it reads as clutter, add an inactivity reset (e.g. clear the log
and `started` after N minutes closed, or on a fresh page load). Low risk, but it
changes behavior for returning visitors — worth confirming before doing it.

### R2 — Focus-trap fallback for very old iOS Safari
`inert` covers Safari 15.5+. Older iOS PWAs fall back to `aria-hidden` only,
which contains screen readers but not the Tab key. If those clients matter, add a
small JS Tab-trap to the deck modals mirroring the one the concierge already has.

### R3 — `openModal()` no-ops if a modal is already open
Switching directly from one detail modal to another via a `[data-modal]` tile is
silently ignored (`if (modalOpen()) return;`). The credential-chip paths use
`switchModal()` and are unaffected, so this is latent today, but if tile-to-tile
switching is ever wired up it will need `switchModal` semantics.

---

---

## Round 2 — full-site sweep (beyond popups)

Audited: service worker, manifest, vercel config, the concierge engine + its
three data files, every local asset reference, section/slide mapping, all
keyboard/touch handlers, and the modal-internal click delegation.

### F6 — Deck keyboard shortcuts & swipe drove the slides *behind* an open BSC map / lightbox  ·  FIXED
**Severity: High.** The global keydown handler bailed only on `modalOpen()`,
which checks the `#modal` detail modal **only**. The BSC map and lightbox each
have a capture-phase handler that swallows Escape and the arrow/space keys — but
**not** `f` or the number keys `1`–`9`. So with the map or a campus photo open,
pressing `f` toggled fullscreen and pressing a digit jumped the deck to another
section, leaving the overlay floating over a slide it no longer matched. The
touch-swipe handler had the same `modalOpen()`-only guard.

**Fix:** both guards now use `anyDeckOverlayOpen()` (detail modal **or** BSC map
**or** lightbox). The deck's `f` / digit / arrow / swipe shortcuts are inert
while any overlay owns the screen; the overlays keep their own Escape handling.

### Clean — no bugs found
- **Concierge referential integrity:** 34 intents (no dup ids), every `contact`,
  `next` modal/section target, `clarify` option, opening-chip, `CATALOG_CONTACT`
  entry, self-test assertion, and `ROUTING.default` resolves. 0 broken.
- **Asset references:** all 71 image/font/icon refs in `index.html`, all 5 in
  `sw.js`, all 3 in the manifest resolve with exact case (Linux/Vercel-safe).
  (Many unused files exist on disk — the inverse of a broken link, not a bug.)
- **Section ↔ slide mapping:** 10 slides / 10 sections; every `slideIndexByName`
  call and `data-atag-jump` value matches a real `data-name`. The section-name
  vs `data-name` gap (`Home`/`Open`, `Campuses`/`Campus`) is never exercised —
  `goToSection` keys off the `SECTIONS` array index, not the name.
- **No duplicate element IDs**; no missing helpers; all inline scripts and
  `concierge.js` syntax-check clean.

### F7 — Dead `dtCat` contact-category preselect removed  ·  FIXED (cleanup)
The modal "Get in Touch" handler tried to pre-select a category via
`getElementById("dtCat")`, but there is **no `<select>` anywhere on the site**
and no `dtCat` element — a null guard made it a permanent no-op. Removed the dead
block and the now-orphaned `MODAL_TO_CONTACT` lookup table. "Get in Touch" still
closes the modal and jumps to the Contact section, exactly as before.

### F8 — Chat now fully captures navigation  ·  FIXED
The concierge is `aria-modal` but only trapped Tab. If focus drifted onto the
slide behind its corner panel, the deck's arrow/number shortcuts and touch-swipe
still paged the slides underneath. The concierge now exposes `isOpen()`, and both
the deck keydown handler and the swipe handler stand down while the chat is open.
Its own handler still owns Escape (close) and Tab (trap).

### Observations — not bugs (flagged for you)
- **First-ever offline load.** `sw.js` is network-first and never precaches `/`
  or the app shell (only the manifest + icons, by design), so the very first
  visit while offline has no fallback. Expected for this PWA; noted for clarity.

---

## Verification performed
- All inline scripts in `index.html` and `assistant/concierge.js` syntax-check
  clean.
- Traced focus ordering through open/close of all four deck overlays to confirm
  focus is moved out of `.deck` before it is made inert, and the deck is
  un-inerted before focus is restored on close.
- Confirmed the credential-chip deck-jump paths still route through `go()`, which
  closes the modal and re-runs `render()` (resetting disclosures) as expected.

---

## Round 3 — concierge field audit (mobile sizing, routing, interaction)

Triggered by two reports from real use: **"once I clicked the text it was too big
on the screen, I had to zoom out"** and **"I clicked a CTA button and it didn't go
anywhere."** Rounds 1–2 hardened overlay *coordination* but never touched the
concierge's own mobile sizing, input behavior, or the CTA bridge. This round
walks the concierge end to end — how it pops up, what it says, where each button
lands, and how it behaves on a phone — and fixes 27 things. Engine matching
logic (classify / catalog / MiniSearch config) was **not** touched, so the
in-browser regression battery (`EnvisionConcierge.selfTest()`) is unaffected.

### The two reported bugs — root-caused

**"Text too big, had to zoom out" (F9, High).** The composer `<textarea>` was
`13.5px`. iOS Safari force-zooms the page whenever a focused field is under
`16px`, and because the viewport meta sets no `maximum-scale`, it never zooms
back — the visitor is left magnified. Worse, the panel *auto-focused* that field
on open, so merely tapping "Ask Envision" zoomed the page before a word was read.
**Fix:** input is `16px` on touch (`13.5px` only on `pointer:fine` desktop), and
the textarea is no longer auto-focused on coarse pointers (the dialog takes focus
instead; the keyboard appears when the visitor actually taps the field).

**"CTA went nowhere" (F10, High).** `runNext()` closed the chat *first*, then
tried `deck.openModal/goToSection/openBSC`. If the deck bridge was missing or the
action wasn't exposed, the panel had already vanished and nothing opened — a
literal dead end. **Fix:** `runNext()` now resolves the handler *before*
committing to close; if it can't, it keeps the conversation open and hands over a
person instead of a blank screen. The BSC bridge also no longer synthesizes a
click on the first `[data-bsc]` element (which lives on a non-current,
`pointer-events:none` slide) — it calls `openBsc()` directly.

### All 27 fixes

**Mobile sizing / "pops up" behavior**
1. Input `16px` on touch — kills the iOS focus-zoom (the core report).
2. Desktop keeps the compact `13.5px` via `@media (pointer:fine)`.
3. Panel height switched from `vh` to `dvh` so it tracks the *visible* viewport
   as the mobile browser's toolbar shows/hides (no more off-screen overflow).
4. Keyboard-aware lift: JS measures the on-screen-keyboard inset from
   `VisualViewport` and exposes `--ec-kb`; CSS lifts the panel by exactly that
   much so the composer sits above the keyboard instead of behind it.
5. `--ec-kb` reset to `0` on close so the launcher returns to its anchor.
6. No textarea auto-focus on coarse pointers — the keyboard/zoom no longer pops
   the instant the panel opens.
7. Panel given `tabindex="-1"` so focus can land on the dialog itself.
8. Message and chip rows now "pop" in with a short, reduced-motion-aware
   entrance animation — the conversation reads as live.

**Routing / CTAs / "where it lands"**
9. CTA dead-end guard in `runNext()` (see F10) — never closes into nothing.
10. Handler resolved before close; missing bridge → human handoff, chat stays up.
11. Direct, reliable BSC open bridge replacing the off-slide synthetic click.
12. Focus restoration: closing a deck modal the *chat* opened now returns focus
    to the launcher, not a hidden control inside the dismissed panel.
13. BSC on-close focus likewise aimed at the launcher.

**Interaction correctness**
14. Send button actually disables when the field is empty (the `:disabled` style
    existed but nothing ever toggled it) — no silent dead tap.
15. Send state re-synced after each submit.
16. IME-safe Enter (`isComposing` / `keyCode 229`) — Enter confirming a CJK
    candidate commits text instead of firing a half-composed message.
17. `enterkeyhint="send"` so mobile keyboards show a Send key, matching the
    Enter-sends behavior.
18. Placeholder shortened so it no longer clips inside the `16px` field on a
    narrow phone.

**Accessibility**
19. Launcher pulled out of the tab order and a11y tree while the panel is open
    (`visibility:hidden`) — a keyboard/SR user can't land on an invisible control
    behind the open dialog.
20. Larger touch targets (header-close, send, chips) on `pointer:coarse`.

**Containment / overflow**
21. `overscroll-behavior:contain` on the log — a scroll gesture in the chat no
    longer chains through to the scroll-snapping deck behind it.
22. `overscroll-behavior:contain` on the panel as a second backstop.
23. Long chip labels (e.g. "Explore Quality Assurance & Compliance") wrap inside
    the chip instead of spilling past the panel edge.
24. Long unbroken tokens (NSN, part number, URL) wrap inside bot bubbles.
25. Long emails / links wrap inside the contact card.

**Hygiene**
26. Duplicate contact cards no longer stack under every answer once a visitor
    passes `contactAfterQueries` (dedupe of the identical card in a row).
27. `rel="noreferrer"` added alongside `noopener` on the external web link.

### Round 3 verification
- `node --check` passes on `concierge.js` and all six inline `index.html`
  scripts after the edits.
- Engine matching code paths untouched (only UI, the CTA bridge, a11y, and CSS
  changed); `selfTest()` outcomes are therefore unchanged from Round 2.
- Traced `runNext()` for all three `next` actions (modal / section / bsc) and the
  missing-bridge branch to confirm the panel only closes when an action will run.
