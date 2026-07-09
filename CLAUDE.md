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

## Program videos on callout cards

Any callout entry (in the `MODALS` mission/capability pop-ups or in `PROJECTS`)
can carry a `video:"https://youtu.be/..."` field (YouTube, Instagram Reels, or
any external URL). It renders a green "Watch the video" link with a play icon
(`videoLinkHTML()`, styled `.m-card-link.m-card-video`) that opens the video in
a new tab. For more than one video on a card, use
`videos:[{url:"...",label:"Heather's Camp"},...]` — each renders as
"Watch: <label>". Strip share-tracking params (`?si=`, `?igsh=`) from pasted
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
