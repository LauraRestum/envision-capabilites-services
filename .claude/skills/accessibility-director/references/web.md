# Web and HTML Accessibility (WCAG 2.2 AA, Envision system)

Applies to every browser-rendered Envision output: pitch decks, microsites, campaign pages, dashboards, artifacts, event sites, and web apps. These rules extend the ux-enhancer visual system; where they correct it, this file wins.

Contents:
1. Document foundation
2. Structure: headings, landmarks, skip links
3. Keyboard operability
4. Touch targets
5. Opacity floors on the dark system
6. Themes: dark, light, high contrast
7. Motion safety
8. Forms
9. Modals and overlays
10. The Envision accessibility panel (drop-in)
11. AI and conversational widgets
12. Verification checklist

---

## 1. Document foundation

Every page starts with these, no exceptions:

```html
<html lang="en" data-env-theme="dark">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Specific Page Purpose | Envision</title>
```

- `lang` is set (screen reader pronunciation depends on it). Never add `maximum-scale` or `user-scalable=no`.
- Unique, descriptive `<title>` per page: it is the first thing announced.
- Page must reflow at 200 percent zoom and at 320px width without horizontal scrolling or content loss. `overflow-x: hidden` on body is acceptable; clipping actual content is not.
- All styling through CSS custom properties. No raw hex values inside components.

---

## 2. Structure: headings, landmarks, skip links

**Headings.** Exactly one `<h1>` per page. Levels never skip (h2 to h4 is a fail). If a section visually opens with something small, the h1 can be visually hidden but must exist:

```css
.visually-hidden {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
```

**Landmarks.** Wrap the page in real regions: `<header>` (or `role="banner"`), `<nav aria-label="Main">`, `<main id="main" tabindex="-1">`, `<footer>` (or `role="contentinfo"`). On legacy templates where swapping tags risks breaking markup, adding `role` attributes to the existing divs is the pragmatic equivalent.

**Skip links.** Three, as the first focusable elements, jumping to content, navigation, and footer. Invisible until focused, unmistakable after, styled as the house pill:

```html
<a class="skip-link" href="#main">Skip to content</a>
<a class="skip-link" href="#nav">Skip to navigation</a>
<a class="skip-link" href="#site-footer">Skip to footer</a>
```
```css
.skip-link {
  position: absolute; left: 1rem; top: -100px; z-index: 200;
  background: var(--green); color: var(--blue-dark);
  padding: 0.7rem 1.4rem; font-weight: 700; font-size: 0.75rem;
  letter-spacing: 0.1em; text-transform: uppercase; border-radius: 2px;
  transition: top 0.15s;
}
.skip-link:focus { top: 1rem; }
```

**Focus not obscured (WCAG 2.4.11).** The fixed glass nav can cover a focused element scrolled to the top. Prevent it globally:

```css
html { scroll-padding-top: 5.5rem; } /* nav height plus breathing room */
:target, [tabindex="-1"]:focus { scroll-margin-top: 5.5rem; }
```

---

## 3. Keyboard operability

Every interactive element works with keyboard alone: Tab/Shift+Tab to reach, Enter/Space to activate, Escape to dismiss, arrows within composite widgets. Use native elements (`<button>`, `<a>`, `<select>`) first; a clickable `<div>` needs `role`, `tabindex="0"`, and key handlers to earn its place, which is three reasons to just use a button.

**Visible focus, styled as the brand.** Never `outline: none` without a replacement. The house focus ring is a deliberate design element:

```css
:focus-visible {
  outline: 2px solid var(--green);
  outline-offset: 3px;
  border-radius: 2px;
}
```

**The editable-target guard.** Every global or arrow-key listener skips editable elements and modifier combos. This is mandatory. Envision's HTML decks navigate slides with arrow keys, and the capabilities deck now contains the AI concierge input: exactly the setup where an unguarded listener throws someone to another slide mid-sentence while they type. The signature bug of the reference case study, prevented in eight lines:

```js
function editable(t) {
  if (!t) return false;
  const tag = (t.tagName || '').toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable;
}
document.addEventListener('keydown', (e) => {
  if (editable(e.target)) return;
  if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); nextSlide(); }
  if (e.key === 'ArrowLeft')  { e.preventDefault(); prevSlide(); }
});
```

Slide navigation also needs visible on-screen previous/next buttons (keyboard is one path, not the only affordance), and slide changes announced via the live region pattern in Section 11.

---

## 4. Touch targets

44 by 44 CSS pixels minimum on touch devices (the AAA figure, adopted as house standard). Desktop layouts stay visually compact by expanding the hit area, not the artwork:

```css
@media (hover: none) and (pointer: coarse) {
  .nav-cta, nav ul a, button, .btn-primary, .btn-ghost { min-height: 44px; min-width: 44px; }
}
/* Invisible hit-area expansion for small visual controls, all devices: */
.hit-target { position: relative; }
.hit-target::after { content: ''; position: absolute; inset: -10px; }
```

Interactive elements sit at least 8px apart so adjacent targets do not overlap once expanded.

---

## 5. Opacity floors on the dark system

Verified against the dark surfaces. These override the older ux-enhancer values:

| Text role | Old value | Status | Floor |
|---|---|---|---|
| Muted body (`--text-muted`) | 0.52 white | 5.6:1, passes | Keep 0.52; prefer 0.62 (7.6:1) for long secondary passages |
| Nav links | 0.45 white | 4.46:1, fails by a hair | Raise to 0.62 |
| Citations, bylines | 0.28 white | 2.4:1, fails | Raise to 0.55 minimum |
| Scroll hints, micro-labels | 0.25 white | 2.2:1, fails | Raise to 0.55, or remove the text and keep only the decorative line |

Rule: no informational text below 52 percent white opacity on `#000d2e`, `#001852`, or `#003087`. Purely decorative elements with no text (lines, glows, grain) are exempt.

---

## 6. Themes: dark, light, high contrast

Three complete token sets. Components never change between themes; only tokens swap. Dark is the Envision default. Light exists because light-on-dark text halos for many readers with astigmatism and low vision: the assistive gap in a dark-first system runs opposite to most sites. High contrast serves significant low vision at AAA ratios.

```css
:root, html[data-env-theme="dark"] {
  --blue: #003087; --blue-dark: #001852; --blue-mid: #004bb5;
  --green: #78BE21; --green-text: #78BE21; --green-dim: rgba(120,190,33,0.15);
  --bg-body: #000d2e; --surface-card: rgba(0,24,82,0.52);
  --text-main: #f0f4ff; --text-muted: rgba(240,244,255,0.62);
  --border-soft: rgba(255,255,255,0.08);
  --error: #FF6B3D; --warn: #FFCF00;
  --focus: #78BE21;
}
html[data-env-theme="light"] {
  --blue: #003087; --blue-dark: #002855; --blue-mid: #004bb5;
  --green: #78BE21;            /* accent fills, rules, bars only */
  --green-text: #457010;       /* 5.5:1 on the light ground: eyebrows, links, green words */
  --green-dim: rgba(120,190,33,0.18);
  --bg-body: #f4f7fb; --surface-card: #ffffff;
  --text-main: #002855; --text-muted: #53565A;
  --border-soft: rgba(0,40,85,0.14);
  --error: #9E3000; --warn: #8a6d00;
  --focus: #003087;            /* green ring reads weak on light; blue ring holds */
}
html[data-env-theme="hc"] {
  --blue: #41B6E6; --blue-dark: #000000; --blue-mid: #41B6E6;
  --green: #78BE21; --green-text: #78BE21; --green-dim: rgba(120,190,33,0.25);
  --bg-body: #000000; --surface-card: #000000;
  --text-main: #ffffff; --text-muted: #ffffff;
  --border-soft: #ffffff;
  --error: #FF6B3D; --warn: #FFCF00;
  --focus: #78BE21;
}
html[data-env-theme="hc"] * { backdrop-filter: none !important; text-shadow: none !important; }
html[data-env-theme="hc"] img { opacity: 1 !important; }
html[data-env-theme="hc"] a { text-decoration: underline; color: var(--green-text); }
html[data-env-theme="light"] .hero-overlay { background: linear-gradient(to bottom, rgba(244,247,251,0.72), rgba(244,247,251,0.92)); }
```

Verified anchors: light theme text 13.6:1, headings 11:1, muted 6.9:1, green-text 5.5:1, error 6.8:1. High contrast: white 21:1, green 9.2:1, all AAA. In light mode, `#78BE21` is 2.1:1 and never carries text; `--green-text` does.

**Anti-flash script.** First element inside `<head>`, before any stylesheet, so the theme paints correctly on the first frame:

```html
<script>(function(){try{
  var p = JSON.parse(localStorage.getItem('env-a11y') || '{}');
  var t = p.theme;
  if (!['dark','light','hc'].includes(t)) {
    t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  var r = document.documentElement;
  r.setAttribute('data-env-theme', t);
  ['zoom','lines','paras','underline','motion','readable','cursor'].forEach(function(k){
    if (p[k]) r.setAttribute('data-env-' + k, p[k]);
  });
}catch(e){}})();</script>
```

---

## 7. Motion safety

The Ken Burns hero zoom, entrance sequence, and smooth scrolling remain the house defaults, always guarded. Reduced motion is honored from two sources: the OS preference and the panel toggle.

```css
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
html[data-env-motion="reduce"] { scroll-behavior: auto; }
html[data-env-motion="reduce"] *, html[data-env-motion="reduce"] *::before, html[data-env-motion="reduce"] *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}
```

Nothing flashes more than three times per second, ever. No parallax, no scroll hijacking (already banned by ux-enhancer; the ban is also an accessibility rule).

---

## 8. Forms

Every RSVP site, campaign page, and contact form follows this pattern:

```html
<label for="email">Email</label>
<input id="email" name="email" type="email" required
       aria-required="true" autocomplete="email"
       aria-describedby="email-err">
<span id="email-err" class="field-error" role="alert" hidden></span>
```

- A visible `<label>` for every field. Placeholder text never substitutes.
- On validation failure: set `aria-invalid="true"`, unhide the error span, write the specific message into it. `role="alert"` announces it to screen readers in real time. Error text uses `--error` (verified on both themes) plus an icon or border so color is not the only signal.
- `autocomplete` on identity fields (`name`, `email`, `tel`, `organization`): password managers and cognitive accessibility both depend on it.
- Errors identified in text, next to the field, with focus moved to the first invalid field on submit.
- No CAPTCHAs or puzzles as a sole gate (WCAG 3.3.7). Use honeypots or server-side checks.

---

## 9. Modals and overlays

Any dialog (including the accessibility panel): `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at its heading. Focus moves into the dialog on open, cycles inside it (trap), Escape closes, overlay click closes, and focus returns to the trigger on close. A visible close control inside the dialog, minimum 44px hit area. Background content is inert while open (`inert` attribute on the page wrapper, or aria-hidden fallback).

---

## 10. The Envision accessibility panel (drop-in)

One self-contained block, styled as a house component: glass surface, eyebrow header, sharp corners, green active states. Trigger is a text button labeled "Accessibility" in the nav or footer eyebrow style, never a floating wheelchair bubble (that is the overlay-widget look, banned). Include on every multi-page property and every public-facing page; optional on internal one-offs.

Options: theme (Dark, Light, High contrast), text size (100/112/125/140 percent), line spacing (Normal, Wide), paragraph spacing (Normal, Wide), underline links, reduce motion, readable text, large cursor, reset. Readable text keeps Montserrat and tunes it, per the settled precedence rule. All preferences persist in `localStorage` under `env-a11y` and apply through `data-env-*` attributes, which the anti-flash script restores pre-paint.

```html
<button class="a11y-trigger" id="a11yTrigger" aria-haspopup="dialog">Accessibility</button>

<div class="a11y-overlay" id="a11yOverlay" hidden>
  <div class="a11y-dialog" role="dialog" aria-modal="true" aria-labelledby="a11yTitle">
    <div class="a11y-head">
      <span class="section-eyebrow" id="a11yTitle">Accessibility Options</span>
      <button class="a11y-close" data-a11y-close aria-label="Close accessibility options">&times;</button>
    </div>
    <div class="a11y-group" role="group" aria-labelledby="gTheme">
      <span class="a11y-label" id="gTheme">Theme</span>
      <button data-set="theme" data-val="dark" aria-pressed="false">Dark</button>
      <button data-set="theme" data-val="light" aria-pressed="false">Light</button>
      <button data-set="theme" data-val="hc" aria-pressed="false">High contrast</button>
    </div>
    <div class="a11y-group" role="group" aria-labelledby="gZoom">
      <span class="a11y-label" id="gZoom">Text size</span>
      <button data-set="zoom" data-val="1" aria-pressed="false">100%</button>
      <button data-set="zoom" data-val="2" aria-pressed="false">112%</button>
      <button data-set="zoom" data-val="3" aria-pressed="false">125%</button>
      <button data-set="zoom" data-val="4" aria-pressed="false">140%</button>
    </div>
    <div class="a11y-group" role="group" aria-labelledby="gLines">
      <span class="a11y-label" id="gLines">Line spacing</span>
      <button data-set="lines" data-val="normal" aria-pressed="false">Normal</button>
      <button data-set="lines" data-val="wide" aria-pressed="false">Wide</button>
    </div>
    <div class="a11y-group" role="group" aria-labelledby="gParas">
      <span class="a11y-label" id="gParas">Paragraph spacing</span>
      <button data-set="paras" data-val="normal" aria-pressed="false">Normal</button>
      <button data-set="paras" data-val="wide" aria-pressed="false">Wide</button>
    </div>
    <div class="a11y-group">
      <span class="a11y-label">Preferences</span>
      <button data-toggle="underline" aria-pressed="false">Underline links</button>
      <button data-toggle="motion" data-on="reduce" aria-pressed="false">Reduce motion</button>
      <button data-toggle="readable" aria-pressed="false">Readable text</button>
      <button data-toggle="cursor" aria-pressed="false">Large cursor</button>
    </div>
    <div class="a11y-foot">
      <button class="a11y-reset" id="a11yReset">Reset all</button>
      <button class="btn-primary" data-a11y-close>Done</button>
    </div>
  </div>
</div>
```

```css
.a11y-trigger { background: none; border: 1px solid var(--border-soft); color: var(--text-muted);
  font: 600 0.68rem 'Montserrat', sans-serif; letter-spacing: 0.18em; text-transform: uppercase;
  padding: 0.55rem 1.1rem; border-radius: 2px; cursor: pointer; }
.a11y-trigger:hover, .a11y-trigger:focus-visible { color: var(--text-main); border-color: var(--green); }
.a11y-overlay { position: fixed; inset: 0; z-index: 300; background: rgba(0,5,20,0.6);
  display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
.a11y-dialog { background: var(--bg-body); border: 1px solid var(--border-soft); border-radius: 2px;
  padding: 2rem; width: min(460px, 100%); max-height: 90vh; overflow-y: auto; }
.a11y-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.a11y-close { background: none; border: 0; color: var(--text-main); font-size: 1.6rem;
  min-width: 44px; min-height: 44px; cursor: pointer; }
.a11y-group { margin-bottom: 1.25rem; }
.a11y-label { display: block; font: 700 0.62rem 'Montserrat', sans-serif; letter-spacing: 0.2em;
  text-transform: uppercase; color: var(--green-text); margin-bottom: 0.6rem; }
.a11y-group button { background: transparent; border: 1px solid var(--border-soft); color: var(--text-main);
  font: 600 0.78rem 'Montserrat', sans-serif; padding: 0.6rem 1rem; margin: 0 0.4rem 0.4rem 0;
  border-radius: 2px; min-height: 44px; cursor: pointer; }
.a11y-group button[aria-pressed="true"] { background: var(--green); color: #001852; border-color: var(--green); }
.a11y-foot { display: flex; justify-content: space-between; margin-top: 1.5rem; }
.a11y-reset { background: none; border: 0; color: var(--text-muted); text-decoration: underline;
  font: 600 0.78rem 'Montserrat', sans-serif; cursor: pointer; min-height: 44px; }

/* Preference effects */
html[data-env-zoom="2"] body { zoom: 1.125; }
html[data-env-zoom="3"] body { zoom: 1.25; }
html[data-env-zoom="4"] body { zoom: 1.4; }
html[data-env-lines="wide"] body { line-height: 1.95; }
html[data-env-paras="wide"] p { margin-bottom: 2em; }
html[data-env-underline="on"] a { text-decoration: underline !important; }
html[data-env-readable="on"] body { font-weight: 500; letter-spacing: 0.012em; word-spacing: 0.08em; line-height: 1.85; }
html[data-env-cursor="on"], html[data-env-cursor="on"] * {
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M6 2l24 14-11 2 6 12-5 3-6-12-8 8z' fill='%23fff' stroke='%23001852' stroke-width='2'/%3E%3C/svg%3E") 4 2, auto !important; }
```

```js
(function(){
  const KEY='env-a11y', root=document.documentElement;
  const trigger=document.getElementById('a11yTrigger');
  const overlay=document.getElementById('a11yOverlay');
  if(!trigger||!overlay) return;
  const dialog=overlay.querySelector('.a11y-dialog');
  let prefs={}; try{ prefs=JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){}
  if(!prefs.motion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) prefs.motion='reduce';

  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(prefs)); }catch(e){} }
  function apply(){
    ['theme','zoom','lines','paras','underline','motion','readable','cursor'].forEach(k=>{
      if(prefs[k]) root.setAttribute('data-env-'+k, prefs[k]);
      else root.removeAttribute('data-env-'+k);
    });
    if(!root.getAttribute('data-env-theme')) root.setAttribute('data-env-theme','dark');
    overlay.querySelectorAll('[data-set]').forEach(b=>
      b.setAttribute('aria-pressed', String(prefs[b.dataset.set]===b.dataset.val)));
    overlay.querySelectorAll('[data-toggle]').forEach(b=>{
      const on=b.dataset.on||'on';
      b.setAttribute('aria-pressed', String(prefs[b.dataset.toggle]===on));
    });
  }
  overlay.addEventListener('click', e=>{
    const set=e.target.closest('[data-set]'), tog=e.target.closest('[data-toggle]');
    if(set){ prefs[set.dataset.set]=set.dataset.val; save(); apply(); }
    if(tog){ const on=tog.dataset.on||'on', k=tog.dataset.toggle;
      prefs[k]=(prefs[k]===on)?null:on; if(!prefs[k]) delete prefs[k]; save(); apply(); }
    if(e.target.closest('[data-a11y-close]') || e.target===overlay) close();
  });
  document.getElementById('a11yReset').addEventListener('click', ()=>{ prefs={}; save(); apply(); });

  let lastFocus=null;
  function open(){ lastFocus=document.activeElement; overlay.hidden=false;
    dialog.querySelector('button').focus(); document.addEventListener('keydown', keys); }
  function close(){ overlay.hidden=true; document.removeEventListener('keydown', keys);
    if(lastFocus) lastFocus.focus(); }
  function keys(e){
    if(e.key==='Escape'){ close(); return; }
    if(e.key!=='Tab') return;
    const f=[...dialog.querySelectorAll('button:not([disabled])')];
    const first=f[0], last=f[f.length-1];
    if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
  }
  trigger.addEventListener('click', open);
  apply();
})();
```

Adapt freely, but keep: the trigger style, aria-pressed state, focus trap, Escape, focus restore, localStorage key, and the pre-paint restore via the anti-flash script.

---

## 11. AI and conversational widgets

Applies to the capabilities deck concierge and any future chat, search, or agent interface embedded in an Envision property. WCAG covers the markup; these rules, drawn from published accessibility heuristics for AI conversational interfaces, cover the interaction. The documented failure points are status feedback, keyboard access, and focus management, so:

1. **Status is announced.** A visually hidden `aria-live="polite"` region reports state changes: "Thinking", "Response ready", "Error, try again". A spinner alone is invisible to a screen reader.
```html
<div class="visually-hidden" role="status" aria-live="polite" id="ai-status"></div>
```
2. **The response is reachable.** Generated output sits in the reading order and can receive screen reader focus. Never render responses only inside a canvas or an unreachable iframe.
3. **Every control is labeled.** Input has a label ("Ask about Envision's capabilities"), send and regenerate buttons have accessible names, suggestion chips are real buttons.
4. **Focus is managed, never stolen.** Focus stays in the input after submit; it never jumps mid-typing. If a dialog needs attention, focus moves to it and returns after.
5. **Full keyboard path.** Submit on Enter, all actions reachable by Tab, Escape collapses the widget, and the arrow-key guard from Section 3 protects the input from any slide navigation on the page.
6. **Errors are recoverable.** Failures announce through the live region, in text, with a retry action. The user's typed input survives the error.
7. **Streaming stays calm.** Announce "Response ready" once at completion rather than firing the live region per token, which floods a screen reader.

---

## 12. Verification checklist

Before any web asset ships:

- [ ] Automated pass: Lighthouse accessibility category or axe DevTools, zero critical issues
- [ ] Keyboard walkthrough: Tab through the entire page, activate everything, escape everything, focus always visible, arrow keys safe inside every input
- [ ] Zoom check: 200 percent zoom and 320px width, no loss, no horizontal scroll
- [ ] All three themes rendered, spot-checked against the token anchors
- [ ] Reduced motion verified (OS setting and panel toggle both kill animation)
- [ ] Headings outline sensibly (one h1, no skips), landmarks and skip links present
- [ ] Forms: labels, error announcement, autocomplete
- [ ] Panel present, persists, restores without flash
- [ ] Screen reader spot check where possible (VoiceOver or NVDA on the hero, nav, one form, and any AI widget)

Automated tools catch roughly 70 percent. The keyboard walkthrough and screen reader pass exist because no tool would ever have found an arrow key hijacking a text field.
