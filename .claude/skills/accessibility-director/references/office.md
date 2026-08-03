# PowerPoint and Word Accessibility

Applies to corporate decks, briefs, proposals, and reports built in Office formats. Both applications ship a built-in Accessibility Checker; it runs before every export, and zero errors is the gate.

## PowerPoint

**Layouts are the accessibility architecture.** Content lives in the built-in slide layouts and placeholders, never in loose floating text boxes. Placeholders give every slide a machine-readable title and a defined reading order; floating boxes read last and out of sequence. When a design needs no visible title, the title placeholder still exists, filled and moved off-canvas, so screen reader users can navigate the deck by slide titles.

- **Unique title on every slide.** "Q3 Results" three times is three identical stops in a screen reader's slide list.
- **Reading order checked per slide** via the Accessibility Checker's reading order pane (or the Selection Pane, which lists bottom-up). Order follows the story: title, then content in narrative sequence, decorations last or marked decorative.
- **Alt text on every visual**: photos, charts, SmartArt, icons, logos. Decorative elements marked decorative. Complex charts also get their takeaway stated on the slide or in the notes pane.
- **Type floors.** 18pt minimum for body text, 24pt preferred; titles larger. The corporate deck standard already runs large; never shrink below the floor to cram, cut content instead. Montserrat only. Five to six bullets maximum per the corporate style, which is also a cognitive load rule.
- **Charts carry a second cue.** Direct data labels on series, and differentiation by marker shape, line style, or pattern in addition to color. A legend keyed only by the Blue and Green fills fails rule 2.
- **Tables**: header row box checked in Table Design, no merged cells.
- **Media**: embedded video plays with captions; no auto-advancing slides or flashing transitions.
- **Links** descriptive, never pasted bare URLs on the slide face.

### Verified corporate deck palette (the #1B365D / #4A90A4 / #7CB342 system)

| Combination | Ratio | Use as |
|---|---|---|
| Navy #1B365D on white, and white on Navy | 12.1:1 | Any text, AAA. The impact-slide pairing is fully clear |
| Blue #4A90A4 on white, and white on Blue | 3.6:1 | Large text (18pt+, or 14pt+ bold) and chart fills only. Never body or bullet text |
| Green #7CB342 on white | 2.5:1 | Never text on light slides. Chart fills, accent shapes, gradient ends only |
| Green #7CB342 on Navy #1B365D | 4.8:1 | Text allowed on navy impact slides |
| Navy on Green | 4.8:1 | Callout text on green fills allowed |
| Blue #4A90A4 on Navy | 3.4:1 | Large text on navy only |
| Charcoal #53565A on white | 7.4:1 | The body-text default for white data slides |

The house gradients (navy-to-blue, blue-to-green) are fine as fills; any text sitting on a gradient is checked against the gradient's lightest point.

## Word

- **Styles, not formatting.** Headings are real Heading 1/2/3 styles, never bold-enlarged body text. One Title or Heading 1, levels never skipped. This is what makes navigation, the TOC, and tagged PDF export all work.
- **Real lists** via the list controls, not typed dashes or asterisks.
- **Tables** for data only, with "Repeat as header row" set and no merged or split cells. Never use tables for page layout.
- **No text boxes for body content**; they fall outside the reading order.
- **Alt text** on every image and chart; decorative marked decorative.
- **Links** descriptive ("Read the H2F program overview"), full URLs only in reference lists.
- **Type**: 11pt floor, 12pt preferred, left aligned, line spacing 1.15 or more. Montserrat only.
- **Long documents** get a generated TOC from styles and page numbers via fields.
- **Export** to PDF with "Document structure tags for accessibility" checked, then the PDF module's verification applies to the result.

## Verification

- [ ] Accessibility Checker: zero errors in the final file
- [ ] PPT: every slide titled uniquely, reading order reviewed, no floating content boxes
- [ ] Every visual has alt text or a decorative mark; charts labeled beyond color
- [ ] Palette table respected; no #4A90A4 or #7CB342 body text on white
- [ ] Type floors held; Montserrat only
- [ ] Word: navigation pane shows a sensible heading outline
- [ ] Tagged export verified if a PDF is produced
