# Project standards — Envision Capabilities & Services

This is a single self-contained static deck (`index.html`, no build step). All
styles and scripts are inline. Follow the conventions below when editing.

## Current Projects ("Envision in Action")

Projects live in the `PROJECTS` object in `index.html`; `PROJECT_ORDER` controls
the order and a project appears in the list automatically once added.

### Capabilities Behind It → icons, not photos

The "Capabilities Behind It" callout cards must render an **icon**, never a
photo or photo placeholder. Icons come from `calloutIcon(tag, title)`, which maps
a capability tag/title to a line SVG (textiles, fulfillment, contact center,
workforce, public sector, quality, print/design, polymer/film, plus a generic
default). Style is the green-tinted `.m-card-icon` box.

- When a new capability tag is introduced, add a matching branch to
  `calloutIcon()` rather than falling back to the default.
- Do **not** reintroduce `m-card-ph` (the dashed photo placeholder) or
  `m-card-photo` inside project callouts. (`m-card-ph` is still fine for the
  product-catalog cards, which genuinely await product photography.)

## Innovation slide — "The Process" tooling is visible, not hidden

The equipment under each stage of `.proc-flow` is the proof on that slide, so it
renders on the card. Do **not** put the whole list back behind a click.

- Each `.proc-stage` shows its first `PROC_VISIBLE` chips (4) inline. Anything
  past that folds behind a per-stage "N more" button; a tail of only one chip
  is not worth a click, so those stages just show everything.
- The "N more" buttons and the section-line "Show all tooling" control are
  built by `initProcFlow()` from the chips themselves. Add or remove an
  `<li class="proc-chip">` and the counts follow; never hand-write a count into
  the markup, and never mark chips `hidden` there (with scripting off, every
  chip should simply render).
- Cards are equal height (`align-items:stretch`) with the toggle pushed to the
  bottom, so the row keeps one baseline no matter how uneven the chip counts
  are. Keep the representative or branded machines first in each list — those
  are what shows by default.
- `resetSlideDisclosures()` collapses every open tail on navigation. Any new
  per-slide disclosure belongs in that function too.

## Referring to people who are blind or have low vision

Write it out: **people who are blind or have low vision**. Never "BVI" and never
"visually impaired," in copy, labels, stat cards, or chips. Where a label is too
tight for the full phrase (a four-across stat band, for example), shorten the
label and carry the phrase in the line underneath rather than abbreviating it.

## The online store is "the Base Supply Center"

The `envisionxpress.com` CTA (`.xp-cta` in the two dark overlays, `.xp-inline`
on the Base Supply channel card) links to that domain, but in copy it is always
**the online Base Supply Center**. Do not introduce a separate product or brand
name for it in headings, buttons, or body text.

It exists for military, government, and tax-exempt buyers who are not near one
of the 16 physical store locations, and it ships worldwide including APO and FPO
addresses. Keep that framing wherever the CTA appears.

## AbilityOne explainer overlay

The AbilityOne program's history and chain of authority live in one dedicated
overlay (`#a1Modal`), not in the Proof section or the Base Supply Center map.
Both of those stay about the channel; each carries only a small "Learn more
about AbilityOne" trigger (`[data-a1]`).

- It holds two visual components: a timeline of eras (each panel collapsed to a
  single line by default, `.a1-era-btn` toggling `aria-expanded` and the body's
  `hidden`) and a top-down authority tree ending on Envision's highlighted node
  (`.a1-node--env`).
- The explainer and the map modal **swap, they never stack**. Each exposes its
  own open/close bridge (`window.EnvisionBSC`), so opening one closes the other,
  and closing the explainer hands back to the map when that is where it came
  from. Any new dark overlay must be added to the `anyDeckOverlayOpen()` id list
  and the `trapTabWithin` list, or the deck behind it will stay focusable.
- Keep the copy minimal and business-first: one line visible, the detail behind
  the expand.
- The workforce fact lives at the top of the map pop-up's info column
  (`.bsc-qual`), not in the Proof section and not in the explainer. Keep it to
  the fact itself, that every store is operated by Envision and staffed by
  people who are blind or have low vision, with no framing sentence
  attached. The explainer must not repeat the line. It carries the deeper
  employment story instead, through the eras (employment as the qualification,
  then the 75% direct-labor ratio) and Envision's node (88% against that 75%).

## Program videos on callout cards

Any callout entry (in the `MODALS` mission/capability pop-ups or in `PROJECTS`)
can carry a `video:"https://youtu.be/..."` field (YouTube, Instagram Reels, or
any external URL). It renders a green "Watch the video" link with a play icon
(`videoLinkHTML()`, styled `.m-card-link.m-card-video`) that opens the video in
a new tab. For more than one video on a card, use
`videos:[{url:"...",label:"Heather's Camp"},...]` — each renders as
"Watch: <label>". A `cta` field replaces the link text entirely (e.g.
`videos:[{url:"...",cta:"Explore Esther's Place"}]`) for links that aren't
"watch"-framed. Strip share-tracking params (`?si=`, `?igsh=`) from pasted
links before adding them.

### Timelines — keep evergreen, hide what's over

Project copy should stay evergreen. Avoid timeline language that ages and goes
"over" — e.g. "year to date", "on schedule", "this quarter", explicit dates, or
forward-looking promises. Keep a timeline only when it is an explicit, fixed
fact about the program (for example, "two weeks of training" for a certification
program), not a calendar reference that expires.

To take a finished program off the board, set `hidden:true` on its `PROJECTS`
entry. It stays in the data (and keeps its deep link) but no longer renders on
the In Action grid — that is the supported way to hide a project that is over,
instead of deleting it or letting stale timeline copy linger.
