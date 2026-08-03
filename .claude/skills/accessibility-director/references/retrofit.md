# Retrofit Playbook

For bringing existing live properties up to the standard: the capabilities deck, partner pitch decks, the H2F microsite, campaign and event pages, and anything else already deployed. The skill governs new work automatically; this playbook is how the backlog catches up.

The method mirrors the reference case study (eighteen commits, one concern at a time) but ordered by user risk instead of discovery order. **One pass per category, one commit per pass, verify before moving on.** Never attempt a single mega-fix; when something breaks, a scoped pass tells you exactly where.

## Pass 0: Inventory and baseline

- List the property's pages, its interactive components, and above all its **keyboard listeners and any AI or input widgets**. These determine Pass 1 scope.
- Run Lighthouse or axe on each page and save the baseline scores so improvement is measurable.
- Note hardcoded style values encountered; they get tokenized in Pass 3.

## Pass 1: Keyboard safety (highest severity, always first)

- Add the editable-target guard (web module, Section 3) to every global and arrow-key listener. On any deck with slide navigation plus a text input, this is the live-bug check: typing in the input must never change slides.
- Restore visible focus everywhere: remove bare `outline: none`, add the house `:focus-visible` ring.
- Walk the tab order; fix traps and unreachable controls; confirm Escape closes what it should.

## Pass 2: Structure

- `lang`, unique `<title>`, one `<h1>`, heading levels unskipped.
- Landmarks (roles on legacy divs are fine), the three skip links, and `scroll-padding-top` for the fixed nav.

## Pass 3: Contrast, opacity floors, and tokenization

- Apply the opacity floors table (web module, Section 5): nav links to 0.62, low-opacity citations and micro-labels to 0.55 or removed.
- Verify every color pairing against the hub tables; fix off-table combinations.
- Tokenize hardcoded values as you touch them; this pass is what makes Pass 6 cheap.

## Pass 4: Alt text and forms

- Alt text audit: every meaningful image described, decorative images emptied.
- Forms rewired per the web module: labels, `aria-required`, error announcement via `role="alert"`, `autocomplete`, focus to first error.

## Pass 5: Motion and targets

- Wrap every animation (hero zoom, entrance sequences, pulses) in both reduced-motion guards.
- Apply the 44px touch-target media query and hit-area expansion.

## Pass 6: Themes

- Install the three token sets and the anti-flash script. Because Pass 3 tokenized the styles, this is a swap, not a rebuild.

## Pass 7: The accessibility panel

- Drop in the house panel, wire persistence, confirm the pre-paint restore shows no flash.

## Pass 8: AI widget compliance

- Bring any conversational widget up to the web module's Section 11: live-region status, labeled controls, managed focus, recoverable errors, calm streaming.

## Sequencing across properties

Order the backlog by traffic and stakes: the property partners see most, first. Any property containing both slide navigation and a text input gets its Pass 1 immediately, ahead of everything else, because that combination is the live-bug scenario.

After the final pass on each property, run the full web verification checklist and re-run the Pass 0 scan to document the before and after.
