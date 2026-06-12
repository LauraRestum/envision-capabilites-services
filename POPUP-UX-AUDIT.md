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
| — | Per-slide disclosures | `.reg-pill`/`.reg-panel`, `.proc-stage` | main IIFE |

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
- Innovation **process-stage** machine lists (`.proc-stage`).

Expand one, navigate away, return → it is still open.

**Fix:** `resetSlideDisclosures()` collapses every `.reg-pill` and `.proc-stage`
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

### Observations — not user-facing bugs (left as-is, flagged for you)
- **Dead code: `dtCat` contact-category preselect.** The modal "Get in Touch"
  handler tries to pre-select a category via `getElementById("dtCat")`, but there
  is **no `<select>` anywhere on the site** and no `dtCat` element. The
  `if (dtCat && catVal)` guard makes it a silent no-op, so the jump-to-Contact
  still works; the preselect is leftover from a removed form. Also note the
  In-Action CTA passes `data-contact-cat="manufacturing"` (already a category),
  which the handler would mis-look-up as a modal key — moot while `dtCat` is
  absent. Safe to delete the dead block whenever the Contact form's final shape
  is settled.
- **Arrow-key deck nav while the chat is open.** The concierge is `aria-modal`
  but only traps Tab, not the deck's arrow/number shortcuts, so if focus sits
  outside the panel the slides behind it can still be paged. Low impact (the
  chat is a corner panel and closes whenever a real overlay opens); call it if
  you want the chat to fully capture navigation.
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
