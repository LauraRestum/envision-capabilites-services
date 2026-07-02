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

## Deep links (shareable anchors)

Every slide, capability/service pop-up, and current project has its own URL
hash, so a link can drop a visitor on an exact spot. Inbound links route on
load and on `hashchange`; as the visitor moves, the address bar stays in sync
(via `replaceState`, so it never pollutes browser history or fights the in-app
Back button) — whatever is on screen, the current URL is a copyable link to it.

Append the hash to the deployed URL, e.g. `https://…/#textile`.

**Slides:** `#home` (bare URL), `#campuses`, `#mission`, `#operations`,
`#capabilities`, `#services`, `#innovation`, `#proof`, `#compliance`,
`#contact`.

**Capability pop-ups:** `#plastic` (`#polymer`, `#film`), `#textile`
(`#apparel`), `#reflective` (`#safety`), `#binders` (`#document-covers`),
`#writing` (`#markers`, `#pens`), `#fulfillment` (`#distribution`),
`#kitting` (`#assembly`), `#specialty`.

**Service pop-ups:** `#print`, `#contact-center`, `#bpo`
(`#secure-documents`, `#mailroom`), `#accessibility`, `#procurement`
(`#federal-procurement`), `#quality` (`#quality-assurance`).

> Note: `#contact` is the Contact **slide**; the contact-center **pop-up** is
> `#contact-center`.

**Current projects** — the hash is just the project's name: `#h2f`,
`#underarmour`, `#dallas311`, `#oncor`, `#texaslions`, `#va`. The
project-list pop-up is `#projects`.

**Nested (drops straight into a pop-up's catalog):** add a second segment —
`#textile/products` or `#plastic/products` opens the Product Catalog;
`#…/equipment` opens the Equipment & Machinery list.

Slugs derive from the same data the tiles and project list already render
from, so a new capability/service/project gets a working anchor automatically.
`EnvisionDeck.deepLink("textile/products")` routes by slug from the console or
the concierge.

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
