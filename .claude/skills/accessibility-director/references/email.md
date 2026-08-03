# Email Accessibility

Applies to every Envision send: Mailchimp campaigns, the donor newsletter, event confirmations and reminders, appeals, and transactional messages. Email clients strip and mangle markup, so the rules here are the survivable subset.

## Structure

- Single column, 600px max width. Multi-column desktop layouts read out of order on screen readers and collapse unpredictably; the reading order is the source order, so make source order the story order.
- Layout tables carry `role="presentation"` so screen readers skip the scaffolding instead of announcing "table, 3 rows, 2 columns" around every section. Data tables (rare in email) keep real semantics with header cells.
- Set `lang="en"` on the `<html>` element and `<title>` on the document. Use real heading tags (`<h1>`, `<h2>`) for section titles; clients that respect them give structure, clients that do not lose nothing.
- One clear call to action per send (already the pillar rule; it is also a cognitive accessibility rule).

## Type and color

- Body text 16px minimum, 14px absolute floor for legal fine print. Line height 1.5 or more. Left aligned, never justified.
- Font stack per the pillar skill's email rule: `'Montserrat', Helvetica, Arial, sans-serif`. The fallbacks are a rendering necessity for clients that block webfonts, not a typeface pairing.
- Most emails sit on a white or light ground, so the white-ground table in the hub governs: Charcoal or Navy body text, Primary Blue headings, and Green never as text on light. Buttons: Green background with #001852 text (7.3:1) or Primary Blue background with white text (11.9:1).
- Links in body copy are underlined in addition to colored. Color-only links fail rule 2 of the universal core.

## Images and buttons

- Alt text on every image through the editor's alt field; decorative spacers and flourishes get empty alt. The test: with images off, the email still makes complete sense, because many clients block images by default.
- Never send an all-image email, and never bake the headline or CTA into an image. Key content is live HTML text.
- Buttons are bulletproof: a padded table cell or padded link, minimum 44px tall, with the label as live text. Image-only buttons are banned.
- The logo needs a solid background or built-in padding fill so dark mode inversion does not swallow it. Preview every send in dark mode; do not fight client color inversion with forced overrides, design to survive it.

## Copy details

- Link text describes the destination: "View the Supplier Summit schedule", never "click here". The plain-text version can carry full URLs.
- Write a meaningful preheader (the hidden preview line); screen readers announce it right after the subject.
- Maintain the plain-text alternative in the platform; it is the most accessible version of every send.
- Emoji sparingly and never as structure or bullets. No Unicode pseudo-fonts anywhere.
- Unsubscribe visible and at the type floor, never 9px gray-on-gray.

## Verification

- [ ] Renders correctly with images off (alt text carries the message)
- [ ] Dark mode preview checked (logo, buttons, text all survive)
- [ ] Reading order sensible top to bottom in source
- [ ] Every image has alt or empty alt; every link descriptive and underlined
- [ ] Type floors and contrast table respected; buttons 44px and live text
- [ ] Plain-text version present and current
- [ ] Test send read with a screen reader or at minimum tabbed through in a real inbox
