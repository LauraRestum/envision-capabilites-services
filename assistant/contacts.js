/* =====================================================================
   ENVISION CAPABILITIES CONCIERGE  ·  CONTACTS & ROUTING FILE
   =====================================================================

   This file is the single source of truth for WHO the concierge hands a
   buyer off to. The engine never invents a name, title, phone, or email.
   It can only surface a contact that exists here, so an empty or wrong
   entry is the only thing that can go out.

   ---------------------------------------------------------------------
   HOW ROUTING WORKS
   ---------------------------------------------------------------------
   1. Each intent in knowledge.js may name a `contact` id (e.g. "zahr").
      That wins.
   2. If an intent names no contact, the engine falls back to ENVISION_ROUTING
      below, keyed by intent id, and finally to ENVISION_ROUTING.default.
   3. On a no-confident-match handoff, the engine uses ENVISION_ROUTING.default.

   ---------------------------------------------------------------------
   CONTACT SCHEMA
   ---------------------------------------------------------------------
   <id>: {
     name:   Full name as it should appear.
     title:  Role / title.
     org:    Organization line (optional).
     method: { phone, mobile, email, web }  // include ONLY what is real.
             Leave a field out entirely if you do not have it. Do not
             invent an email or a direct line. A web link is fine.
     talkTo: One sentence: what this person is the right call for. Shown to
             the buyer as "Talk to them about ..."
   }

   ---------------------------------------------------------------------
   WHAT IS REAL VS. A PLACEHOLDER
   ---------------------------------------------------------------------
   The two people below (Zahr, Tuttle) are the only contacts authored in
   the deck. Phone numbers shown are the ones published in the deck. No
   email addresses were published, so none are listed. Add them when you
   have them (see the TODO markers).

   The commented STUBS at the bottom are templates for per-area sales leads.
   They are intentionally inactive. Fill in a real name, title, and method,
   uncomment, and point ENVISION_ROUTING at them to route a capability area
   to a dedicated person.
   ===================================================================== */

window.ENVISION_CONTACTS = {

  /* ---- Primary: revenue, partnership, procurement strategy ---- */
  zahr: {
    name:  "Sebastian Zahr",
    title: "Chief Revenue & Strategy Officer",
    org:   "Envision, Inc.",
    method: {
      web: "www.envisionus.com"
      // TODO: add a direct phone and/or email for Sebastian if you want
      // buyers to reach him directly. e.g. email: "...", phone: "..."
    },
    talkTo: "Partnership, procurement strategy, and figuring out where to start."
  },

  /* ---- Secondary: operations and new product development ---- */
  tuttle: {
    name:  "Patrick Tuttle",
    title: "Senior Vice President, Operations and New Product Development",
    org:   "Envision, Inc.",
    method: {
      phone:  "316-425-7129",
      mobile: "316-253-1468",
      web:    "www.envisionus.com"
      // TODO: add email if you want it surfaced.
    },
    talkTo: "Manufacturing capabilities, custom builds, and new product development."
  }

  /* -------------------------------------------------------------------
     STUBS FOR PER-AREA LEADS (inactive templates, fill and uncomment)
     -------------------------------------------------------------------
     ,
     "manufacturing_lead": {
       name:  "TODO: name",
       title: "TODO: title",
       org:   "Envision, Inc.",
       method: { phone: "TODO", email: "TODO" },
       talkTo: "TODO: e.g. polymer, textile, and reflective product lines."
     },
     "services_lead": {
       name:  "TODO: name",
       title: "TODO: title",
       org:   "Envision, Inc.",
       method: { phone: "TODO", email: "TODO" },
       talkTo: "TODO: e.g. contact center, secure documents, accessibility."
     },
     "federal_lead": {
       name:  "TODO: name",
       title: "TODO: title",
       org:   "Envision, Inc.",
       method: { phone: "TODO", email: "TODO" },
       talkTo: "TODO: e.g. AbilityOne, DLA, and Base Supply Center channels."
     }
  ------------------------------------------------------------------- */

};

/* =====================================================================
   ROUTING MAP  ·  capability area / intent id  ->  contact id
   =====================================================================
   Only used as a FALLBACK when an intent in knowledge.js does not name its
   own contact. Today every intent names a contact directly, so this map is
   mostly here for you: add entries to override routing in one place, or
   point an area at a new per-area lead once you add one above.

   `default` is required. It is the contact for the no-match handoff.
   ===================================================================== */
window.ENVISION_ROUTING = {
  default: "zahr",

  // Examples (uncomment / edit to override an intent's own contact):
  // "polymer-film": "manufacturing_lead",
  // "secure-documents": "services_lead",
  // "how-to-buy": "federal_lead"
};
