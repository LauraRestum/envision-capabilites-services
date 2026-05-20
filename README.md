# Envision Capabilities & Services

An interactive, single-file capabilities deck for **Envision** — U.S.
manufacturing and services across the Wichita, Kansas and Dallas, Texas
campuses, built for federal scale.

## What it is

A self-contained static presentation (`index.html`) with no build step and no
runtime dependencies. All styles and scripts are inline; the only external
request is Google Fonts (loaded with `preconnect`).

- Keyboard navigation: `←` / `→` / `Space`, `1`–`9` jump to sections, `F` fullscreen, `Esc` to exit
- Touch swipe on mobile
- Section progress bar with hover tooltips
- Capability and service drawers with expandable cards
- Base Supply Center network map modal

## Structure

Capabilities (6 tiles) and Services (6 tiles) are organized as broader
buckets, each with a deep-dive modal that includes narrative, stat cards,
product callouts, and (where applicable) collapsible product catalogs:

- **Capabilities:** Polymer & Film, Textile & Apparel, Reflective Safety
  Systems, Metal Fabrication, Print + Bindery + Writing Instruments,
  Fulfillment + Kitting + Assembly.
- **Services:** Envision Contact Center, Secure Document Services
  (BPO / IRS mailrooms), Design + Sourcing + DAM, Accessibility Services,
  Federal Procurement Services, Quality Assurance & Compliance.

Each capability/service is tagged with a subtle location chip:
`Wichita`, `Dallas`, or `Both`. Tiles, modal eyebrows, and select
compliance/proof cards carry the chip. Body copy stays Envision-system
neutral wherever the work spans both campuses.

## Data sources

- Wichita campus content: ported from the Wichita-only capabilities deck.
- Dallas campus content: integrated from the Envision Dallas
  Manufacturing and Prototyping document (2026), including the merged
  AbilityOne + Texas WorkQuest + Commercial catalog index.

## Deploy on Vercel

This is a zero-config static deployment.

1. Import the repository into Vercel (no framework preset needed — it's static).
2. Leave build & output settings empty; Vercel serves `index.html` at the root.
3. Deploy.

[`vercel.json`](./vercel.json) configures security headers (HSTS, no-sniff,
frame options, referrer/permissions policy), `cleanUrls`, and a
revalidate-on-every-request cache policy so content updates go live immediately
on the next deploy.

### Local preview

Open `index.html` directly in a browser, or serve the folder:

```bash
npx serve .
```
