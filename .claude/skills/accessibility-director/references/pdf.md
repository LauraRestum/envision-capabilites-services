# PDF Accessibility

Applies to every PDF deliverable: one-pagers, capability statements, catalogs, program overviews, forms, and print-ready files that also circulate digitally. The target is a tagged PDF aligned with PDF/UA; W3C's WCAG2ICT guidance maps WCAG 2.2 onto documents, and the universal core applies in full.

## The one decision that determines everything

**Accessibility is built in the source file, then exported with tags.** Remediating a finished flat PDF costs multiples and often means rebuilding anyway. Choose the pathway before designing:

- **Word source** (briefs, reports, statements): build per the Word rules in `office.md`, then export with "Document structure tags for accessibility" enabled. Cleanest pathway; use it whenever the deliverable is document-shaped.
- **HTML source**: browser print-to-PDF tagging is unreliable. Fine when the PDF is only a print proxy of an accessible live page (link the page as the accessible version); not sufficient when the PDF itself is the deliverable of record. In that case, route through Word or remediate in Acrobat.
- **Canva or design-tool source**: these export untagged PDFs. Flag this honestly every time. For a PDF that must itself be accessible, either rebuild the source in Word or run full Acrobat remediation after export, and budget for it.

## Requirements for every tagged PDF

- **Document properties.** Title metadata set (and "Document Title" chosen as the window display, not the filename), language set, filename human-readable.
- **Real text.** Selectable and searchable throughout. No outlined type, no text living only inside placed images. Any scanned page gets OCR before shipping.
- **Tag tree.** Headings tagged H1 through H6 matching the visual hierarchy, one H1, no skipped levels. Paragraphs as P, lists as real L/LI structures, figures as Figure with alt text.
- **Reading order.** Verified in the order panel, not assumed from layout. Single column when possible; multi-column layouts get their order checked column by column. Decorative elements (rules, accent bars, background art) marked as artifacts so screen readers skip them.
- **Alt text.** Every informative image, chart, and logo. Charts also state their takeaway in nearby body text, since alt text is a poor home for data.
- **Tables.** Header cells tagged TH with scope. Keep table structure simple; merged and split cells break screen reader navigation, so redesign rather than merge.
- **Links.** Link annotations present and the visible text descriptive. A printed short URL can accompany, per the print module, when the piece is dual-use.
- **Forms.** Every field gets a label and tooltip, a logical tab order, and no cognitive-test gate. Required fields marked in text, not color alone.
- **Bookmarks.** For anything over about nine pages (catalogs, program guides), bookmarks mirroring the heading structure.
- **Color and type.** The hub's white-ground contrast table governs (most PDFs are light ground). Print type floors apply to print-destined files; 11pt body minimum either way.

## Verification

- [ ] Acrobat accessibility checker: full pass, zero errors, warnings resolved or justified
- [ ] Tags panel and reading order panel manually reviewed page by page
- [ ] Title, language, and display setting confirmed in document properties
- [ ] Text selectable everywhere; zoom to 400 percent and confirm reflow view is coherent
- [ ] Screen reader spot check on the first page, one table, and one form field where present
- [ ] If the source was a design tool, remediation actually performed, not just planned
