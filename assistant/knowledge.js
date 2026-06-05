/* =====================================================================
   ENVISION CAPABILITIES CONCIERGE  ·  KNOWLEDGE FILE (the answers)
   =====================================================================

   This is the ONLY file you edit to change what the concierge says. The
   matching engine and the chat UI never need to be touched to add, remove,
   or reword an answer.

   Every entry is an "intent": one thing a buyer might ask about, with the
   phrasings they might use and the answer Envision gives back. The engine
   fuzzy-matches what the visitor types against the triggers, then surfaces
   the matching answer, next step, and contact. It NEVER generates new text.
   If nothing matches with confidence, the engine hands off to a human. So
   anything not written here will simply never be said.

   ---------------------------------------------------------------------
   INTENT SCHEMA
   ---------------------------------------------------------------------
   {
     id:       Unique, stable string. Referenced by chips and clarifiers.
     label:    Short human name. Shown on quick-reply chips and clarifier
               options. Keep it under ~32 characters.
     triggers: Array of phrasings, keywords, and synonyms a buyer might use.
               More phrasings = better matching. Lowercase, no punctuation
               needed. This is where you teach the bot how people ask.
     answer:   The written answer, in Envision's sales voice. Plain text.
               House style: business first, mission throughout. No em dashes
               (use periods, commas, or parentheses). Say "people who are
               blind or have low vision," never "visually impaired."
     next:     OPTIONAL next step. One of:
                 {action:"modal",   target:"<modal key>", label:"..."}
                 {action:"section", target:"<Section name>", label:"..."}
                 {action:"bsc",     label:"..."}            // opens map
               Valid modal keys: plastic, textile, reflective, binders,
               writing, fulfillment, kitting, specialty, printSvc, contact,
               bpo, accessibility, procurement, quality.
               Valid section names: Home, Campuses, Mission, Operations,
               Capabilities, Services, Innovation, Proof, Compliance, Contact.
     contact:  OPTIONAL contact id from contacts.js (e.g. "zahr","tuttle").
               If omitted, the engine falls back to the routing map there.
     source:   Where in the deck this came from. For your reference only;
               not shown to buyers. Helps you keep answers honest.
     clarify:  OPTIONAL. Use INSTEAD of answer when a phrase is genuinely
               ambiguous and a real rep would ask before answering:
                 {question:"...", options:[
                    {label:"...", intent:"<other intent id>"}, ...]}
               Tapping an option fires that intent. This is the "qualify,
               don't guess" behavior.
   }

   ---------------------------------------------------------------------
   THINGS THAT ARE DELIBERATELY NOT ANSWERED (no source in the deck)
   ---------------------------------------------------------------------
   - Specific prices, rates, MOQs, and lead times. The `pricing` intent
     routes to a human on purpose and quotes no numbers. Do not add numbers
     here unless you have authored, approvable figures.
   - Any capability, certification, statistic, or contact not already in the
     deck. If it is not in the deck, it does not belong here.
   ===================================================================== */

window.ENVISION_INTENTS = [

  /* ---------- Orientation / company ---------- */
  {
    id: "capabilities-overview",
    label: "Our capabilities",
    /* Discovery intent. Keep the generic verb forms (make, manufacture, offer)
       here so the broad "what do you make" question lands, but do NOT add bare
       product nouns. Those belong to the specific intents so a precise question
       routes precisely instead of landing on this overview. */
    triggers: ["product range", "full range", "full catalog", "product catalog",
      "product line", "product lines", "all products", "your products", "product list",
      "line card", "capabilities", "capability", "what can you do", "what do you make",
      "what do you sell", "what do you offer", "what do you manufacture",
      "what do you produce", "range of products"],
    answer: "Envision manufactures across two campuses. Polymer and film (can liners, medical and specialty bags, sheeting), textile and apparel (Berry-compliant military gear and ANSI high-visibility), reflective safety systems like the VISI-BELT, binders and document covers, and writing instruments, plus fulfillment, kitting, and specialty decoration. On the services side we run print with in-house Braille, the contact center, secure document services, accessibility services, federal procurement, and quality assurance. Tell me what you need and I will take you straight to it.",
    next: {action:"section", target:"Capabilities", label:"Browse all capabilities"},
    contact: "zahr",
    source: "Capabilities + Services hubs"
  },
  {
    id: "company-overview",
    label: "About Envision",
    triggers: ["who is envision", "what is envision", "about envision", "envision history",
      "envision background", "company", "mission", "what do you do", "who are you",
      "nonprofit", "social enterprise"],
    answer: "Envision is one of the nation's largest employers of people who are blind or have low vision, with 90 years of continuous U.S. manufacturing across two campuses. We provide manufacturing, printing, packaging, and fulfillment for federal, commercial, and state clients, and we run the services that sustain each program. Business first, mission throughout.",
    next: {action:"section", target:"Mission", label:"See our mission and impact"},
    contact: "zahr",
    source: "Hero + Mission"
  },
  {
    id: "capacity-scale",
    label: "Size and capacity",
    triggers: ["how big", "capacity", "size", "square feet", "square footage", "facility size",
      "facilities", "workforce", "how many employees", "how many people", "scale", "footprint",
      "capital investment", "how large"],
    answer: "Across Wichita and Dallas we operate 410,000 square feet of climate-controlled industrial space and a combined workforce of 460. Dallas runs 235,000 square feet with 145 team members. Wichita runs 175,000 square feet with 315. 88 percent of our combined direct labor is performed by people who are blind or have low vision. Built for federal scale.",
    next: {action:"section", target:"Campuses", label:"Tour the campuses"},
    contact: "zahr",
    source: "Campuses"
  },
  {
    id: "locations",
    label: "Where we are",
    triggers: ["location", "locations", "address", "where are you", "where are you located",
      "headquarters", "hq", "directions", "map", "campuses", "phone number", "main number"],
    answer: "Envision operates two campuses. The Dallas campus is at 1801 Valley View Lane, Farmers Branch, TX 75234, (214) 821-2375. The Wichita campus is at 2301 S. Water Street, Wichita, KS 67213, (316) 522-3232.",
    next: {action:"section", target:"Campuses", label:"Tour the campuses"},
    contact: "zahr",
    source: "Campuses + Contact"
  },

  /* ---------- Campus split (qualify Wichita vs Dallas) ---------- */
  {
    id: "campus-capabilities",
    label: "Capabilities by campus",
    triggers: ["which campus", "by campus", "by location", "campus split",
      "wichita or dallas", "which location", "made where", "split by campus"],
    clarify: {
      question: "We manufacture across both campuses. Which one should I focus on?",
      options: [
        {label:"Wichita Campus", intent:"campus-wichita"},
        {label:"Dallas Campus",  intent:"campus-dallas"}
      ]
    },
    source: "Campuses"
  },
  {
    id: "campus-wichita",
    label: "Wichita Campus",
    triggers: ["wichita", "kansas", "ict", "wichita capabilities", "what is in wichita",
      "water street", "67213", "wichita campus"],
    answer: "The Wichita campus (2301 S. Water Street) runs polymer and film manufacturing (can liners, medical and specialty bags, and sheeting), reflective safety systems including the VISI-BELT, pen assembly, federal-grade print with in-house Braille embossing, and accessibility services. It is the verified Kansas State Use participant. 175,000 square feet, 315 team members.",
    next: {action:"section", target:"Capabilities", label:"Browse capabilities"},
    contact: "tuttle",
    source: "Campuses, Wichita"
  },
  {
    id: "campus-dallas",
    label: "Dallas Campus",
    triggers: ["dallas", "texas", "dfw", "farmers branch", "dallas capabilities",
      "what is in dallas", "valley view", "75234", "dallas campus"],
    answer: "The Dallas campus (1801 Valley View Lane, Farmers Branch) runs textile and apparel (Berry-compliant military gear and ANSI high-visibility), binders and document covers, marker assembly, secure document services including IRS mailrooms, and fulfillment with 23 dock doors. It holds the ISO 9001:2015 registration and is the Texas WorkQuest participant. 235,000 square feet, 145 team members.",
    next: {action:"section", target:"Capabilities", label:"Browse capabilities"},
    contact: "tuttle",
    source: "Campuses, Dallas"
  },

  /* ---------- Manufacturing capabilities ---------- */
  {
    id: "polymer-film",
    label: "Can liners and bags",
    triggers: ["can liner", "can liners", "trash bag", "trash bags", "garbage bag",
      "refuse bag", "poly bag", "plastic bag", "hdpe", "lldpe", "isolation bag",
      "medical bag", "biohazard bag", "plastic sheeting", "sheeting", "polyethylene film",
      "body fluid kit", "tidygirl", "va belongings bag", "compostable bag", "liners"],
    answer: "Out of Wichita we convert polyethylene film into finished can liners, medical and specialty bags, and plastic sheeting, in HDPE and LLDPE across a wide range of gauges and sizes. Lines include high-density and low-density can liners, environmentally friendly and compostable options, color-coded medical isolation liners, and specialty bags. Custom sizes, colors, and in-line imprinting are standard.",
    next: {action:"modal", target:"plastic", label:"Explore Polymer & Film"},
    contact: "tuttle",
    source: "Capabilities, Polymer & Film (Wichita)"
  },
  {
    id: "military-apparel",
    label: "Military apparel",
    triggers: ["military apparel", "acu", "army combat uniform", "combat trousers",
      "molle", "etool", "pouches", "military gear", "uniforms", "berry apparel",
      "cordura", "mag pouch", "tactical gear", "combat uniform"],
    answer: "Our Dallas campus runs heavy sewing operations producing Berry-compliant military gear. Army Combat Uniform trousers on an active multi-station line, MOLLE and ETOOL pouches in Cordura with military hardware, and more. Gerber Paragon CNC cutting with digital pattern nesting feeds the floor. Berry and TAA compliant, and authorized under DCMA Alternate Release.",
    next: {action:"modal", target:"textile", label:"Explore Textile & Apparel"},
    contact: "tuttle",
    source: "Capabilities, Textile & Apparel (Dallas)"
  },
  {
    id: "hi-vis-apparel",
    label: "High-visibility apparel",
    triggers: ["high visibility", "hi vis", "high vis", "safety shirt", "safety apparel",
      "ansi", "isea", "class ii", "class iii", "reflective shirt", "mesh vest",
      "safety trousers", "hard hat", "visibility apparel"],
    answer: "We sew ANSI/ISEA 107 Class I, II, and III high-visibility safety apparel in Dallas. Vests, birdseye polyester mesh shirts in regular and tall lengths, and trousers, in sizes through 8X. Fluorescent mesh is layered with micro-prismatic retroreflective tape. Available through AbilityOne and Texas WorkQuest.",
    next: {action:"modal", target:"textile", label:"Explore Textile & Apparel"},
    contact: "tuttle",
    source: "Capabilities, Textile & Apparel (Dallas)"
  },
  {
    id: "safety-vests",
    label: "Safety vests",
    triggers: ["safety vest", "safety vests", "hi vis vest", "reflective vest", "vest",
      "vests", "visibility vest", "reflective gear"],
    clarify: {
      question: "We build reflective products on two different lines. Which one fits your need?",
      options: [
        {label:"Sewn high-visibility apparel (Dallas)", intent:"hi-vis-apparel"},
        {label:"Reflective belts and systems (Wichita)", intent:"reflective"}
      ]
    },
    source: "Capabilities, Textile (Dallas) + Reflective (Wichita)"
  },
  {
    id: "reflective",
    label: "Reflective systems",
    triggers: ["reflective", "visi belt", "visibelt", "reflective belt", "reflective system",
      "retroreflective", "safety belt", "visibility belt", "reflective safety"],
    answer: "Our Wichita campus builds reflective safety systems in house, received as vinyl and nylon on rolls, then sewn, fitted with buckles and hardware, and finished. The flagship is the VISI-BELT, an adjustable 31 to 55 inch reflective belt with 446 feet of visibility, carried in the federal SKILCRAFT catalog and available through the Base Supply Center network.",
    next: {action:"modal", target:"reflective", label:"Explore Reflective Safety Systems"},
    contact: "tuttle",
    source: "Capabilities, Reflective Safety Systems (Wichita)"
  },
  {
    id: "binders",
    label: "Binders and covers",
    triggers: ["binder", "binders", "document cover", "portfolio", "presentation binder",
      "award binder", "certificate cover", "retirement binder", "hardcover folder",
      "texas seal", "folders", "document covers", "presentation folder"],
    answer: "Out of Dallas we produce custom binders, presentation portfolios, and document covers. Vinyl and presentation award binders in portrait and landscape, padded retirement binders, hardcover and custom folders, gold foil-stamped certificate and document covers, and Texas State Seal portfolios. Service-branch foil seals available.",
    next: {action:"modal", target:"binders", label:"Explore Binders & Document Covers"},
    contact: "tuttle",
    source: "Capabilities, Binders & Document Covers (Dallas)"
  },
  {
    id: "writing-instruments",
    label: "Writing instruments",
    triggers: ["writing instrument", "writing instruments", "marker", "markers", "pen",
      "pens", "dry erase", "highlighter", "permanent marker", "skilcraft pen",
      "marker kit", "writing"],
    answer: "We assemble marker and pen lines. Dry erase, highlighters, and permanent markers in singles, sets, and kits from the Dallas campus, plus pens assembled in Wichita. Available across AbilityOne, Texas WorkQuest, and Kansas State Use catalogs.",
    next: {action:"modal", target:"writing", label:"Explore Writing Instruments"},
    contact: "tuttle",
    source: "Capabilities, Writing Instruments (Dallas, Wichita pens)"
  },
  {
    id: "fulfillment",
    label: "Fulfillment",
    triggers: ["fulfillment", "distribution", "pick and pack", "pick pack", "warehousing",
      "warehouse", "storage", "packaging", "mil-std-129", "labeling", "inventory",
      "dock", "shipping", "3pl", "logistics", "fulfilment"],
    answer: "We provide pick and pack, MIL-STD-129 compliant packaging and labeling, climate-controlled storage, real-time inventory, and distribution across the Envision system, all on a federal-compliant labor model. Dallas alone has 23 dock doors plus 8 rail-spur doors.",
    next: {action:"modal", target:"fulfillment", label:"Explore Fulfillment & Distribution"},
    contact: "tuttle",
    source: "Capabilities, Fulfillment & Distribution"
  },
  {
    id: "kitting",
    label: "Kitting and assembly",
    triggers: ["kitting", "kit", "kits", "assembly", "assemble", "kit build",
      "military kit", "value add", "ready to issue", "sub assembly", "hand assembly"],
    answer: "Our kitting and assembly teams build finished, ready-to-issue kits from component parts, including military kit builds, on a federal-compliant labor model. It is value-add work that ships complete.",
    next: {action:"modal", target:"kitting", label:"Explore Kitting & Assembly"},
    contact: "tuttle",
    source: "Capabilities, Kitting & Assembly"
  },
  {
    id: "specialty-decoration",
    label: "Custom decoration",
    triggers: ["embroidery", "logo", "heat transfer", "decoration", "custom decoration",
      "bespoke", "branded", "monogram", "custom product", "logo apparel", "specialty product"],
    answer: "Our Dallas specialty line handles custom decoration and bespoke production. Logo embroidery and heat-transfer logo application on apparel and finished goods, plus specialty product lines built to your specification.",
    next: {action:"modal", target:"specialty", label:"Explore Specialty Products"},
    contact: "tuttle",
    source: "Capabilities, Specialty Products (Dallas)"
  },

  /* ---------- Services ---------- */
  {
    id: "print",
    label: "Print and Braille",
    triggers: ["print", "printing", "print shop", "web to print", "offset", "digital print",
      "bindery", "braille", "braille embossing", "commercial print", "storefront",
      "soft proof", "print services", "printer"],
    answer: "Our Wichita print service runs web-to-print storefronts with customer-approved templates, instant soft proofs, and configurable approvals, backed by digital and offset production, bindery, and specialty finishing. We also emboss Grade 2 English and Computer Braille in house. Federal-grade commercial print, SKILCRAFT cataloged.",
    next: {action:"modal", target:"printSvc", label:"Explore Print"},
    contact: "tuttle",
    source: "Services, Print (Wichita)"
  },
  {
    id: "contact-center",
    label: "Contact center",
    triggers: ["contact center", "call center", "customer service", "help desk",
      "phone support", "chat support", "multichannel", "omnichannel", "inbound",
      "outbound", "customer support", "support center"],
    answer: "The Envision Contact Center delivers bi-locational, multi-channel customer service built for federal and enterprise scale. Phone, email, chat, and digital support from two synchronized sites, Dallas and Wichita, on an AbilityOne-compliant labor model.",
    next: {action:"modal", target:"contact", label:"Explore the Contact Center"},
    contact: "zahr",
    source: "Services, Envision Contact Center"
  },
  {
    id: "secure-documents",
    label: "Secure documents",
    triggers: ["secure document", "secure documents", "mailroom", "mail room", "irs",
      "scanning", "digitization", "ocr", "icr", "shredding", "certified destruction",
      "document destruction", "bpo", "records", "archive", "scan", "mail processing"],
    answer: "Our Dallas secure document services run high-security mailroom operations for federal agencies, including IRS mailroom contracts at the Earle Cabell Federal Building and the IRS Farmers Branch Complex. The work spans high-speed scan, OCR and ICR digitization, encrypted archive, and certified destruction.",
    next: {action:"modal", target:"bpo", label:"Explore Secure Document Services"},
    contact: "zahr",
    source: "Services, Secure Document Services (Dallas)"
  },
  {
    id: "accessibility-services",
    label: "Accessibility services",
    triggers: ["accessibility", "ada", "ada title ii", "wcag", "audit", "accessibility audit",
      "508", "section 508", "screen reader testing", "accessible", "usability",
      "user testing", "digital accessibility", "accessibility consulting"],
    answer: "Our accessibility services deliver ADA Title II consulting, WCAG-aligned audits, training, and user testing, with lived-experience expertise on every engagement. This is accessibility evaluated by people who navigate the world with blindness and vision loss.",
    next: {action:"modal", target:"accessibility", label:"Explore Accessibility Services"},
    contact: "zahr",
    source: "Services, Accessibility Services (Wichita)"
  },
  {
    id: "procurement-services",
    label: "Federal procurement",
    triggers: ["procurement services", "federal procurement", "government market",
      "government markets", "into government markets", "procurement pathway",
      "channel partner", "distributor", "manufacturer partner", "become a supplier",
      "federal market"],
    answer: "Federal Procurement Services is a managed pathway into federal and military procurement. We bring the channel infrastructure, compliance credentials, and procurement intelligence, so manufacturers can sell into government markets without building the federal machinery themselves. Partner products flow through the channels Envision already operates.",
    next: {action:"modal", target:"procurement", label:"Explore Federal Procurement Services"},
    contact: "zahr",
    source: "Services, Federal Procurement Services"
  },
  {
    id: "quality",
    label: "Quality and QA",
    triggers: ["quality", "qa", "quality assurance", "inspection", "iso lab", "dimensional",
      "gauge", "calibration", "dcma", "alternate release", "quality lab", "metrology",
      "quality control"],
    answer: "Quality runs on ISO 9001:2015 across both campuses, registered at Dallas, with material and dimensional validation against gauge, strength, and spec in our on-site Quality Labs. We hold federal compliance credentials across every capability and operate under the DCMA Alternate Release Program out of Dallas.",
    next: {action:"modal", target:"quality", label:"Explore Quality Assurance & Compliance"},
    contact: "tuttle",
    source: "Services, Quality Assurance & Compliance"
  },

  /* ---------- How to buy / channels / compliance ---------- */
  {
    id: "how-to-buy",
    label: "How to buy",
    triggers: ["how do i buy", "how to buy", "how to purchase", "procurement", "order",
      "contract vehicle", "buy from you", "contract", "channels", "acquisition",
      "how do we work together", "purchasing", "how to order"],
    answer: "Envision is an active, pre-cleared source across federal and state channels, so the qualification work is already done. You can buy through AbilityOne mandatory source, our DLA Prime Vendor contracts, the Base Supply Center network, the federal NSN catalog, and the Texas WorkQuest and Kansas State Use programs. Tell me your product or agency and I will point you to the right channel.",
    next: {action:"section", target:"Proof", label:"See every channel"},
    contact: "zahr",
    source: "Proof"
  },
  {
    id: "abilityone",
    label: "AbilityOne",
    triggers: ["abilityone", "ability one", "mandatory source", "skilcraft", "nib",
      "national industries for the blind", "javits wagner o day", "set aside",
      "nonprofit agency", "jwod"],
    answer: "Yes. Envision is an AbilityOne mandatory-source participant nationally, affiliated with National Industries for the Blind. SKILCRAFT-branded Envision products in the federal catalog include trash and seal-closure bags, VISI-BELTs, and print services. 88 percent of our combined direct labor is performed by people who are blind or have low vision, well above the 75 percent AbilityOne threshold.",
    next: {action:"section", target:"Proof", label:"See our federal channels"},
    contact: "zahr",
    source: "Proof + Compliance"
  },
  {
    id: "dla-prime-vendor",
    label: "DLA Prime Vendor",
    triggers: ["dla", "prime vendor", "idiq", "troop support", "defense logistics",
      "abobsc", "h2f", "contract capacity", "ceiling"],
    answer: "Envision is a DLA Prime Vendor with 198 million dollars in combined contract capacity across two active 5-year IDIQ contracts. The ABOBSC TLS contract carries a 150 million dollar ceiling and H2F carries 48 million, and each ships Envision SKUs. All pricing is considered fair and reasonable by DLA Troop Support.",
    next: {action:"section", target:"Proof", label:"See our federal channels"},
    contact: "zahr",
    source: "Proof"
  },
  {
    id: "compliance",
    label: "Compliance",
    triggers: ["compliance", "berry", "berry amendment", "taa", "trade agreements act",
      "buy american", "iso", "iso 9001", "certified", "dcma", "quality system",
      "country of origin", "domestic", "made in usa", "compliant"],
    answer: "The credentials federal and military buyers require are already in place. ISO 9001:2015 across both campuses (Dallas registered, certificate CERT-0145812), Berry Amendment and TAA compliant, Buy American compliant, and authorized under the DCMA Alternate Release Program out of Dallas. The compliance work is done.",
    next: {action:"section", target:"Compliance", label:"Review every credential"},
    contact: "zahr",
    source: "Compliance"
  },
  {
    id: "registrations",
    label: "SAM and CAGE codes",
    triggers: ["sam.gov", "sam registration", "cage", "cage code", "uei", "duns",
      "registration codes", "entity", "naics", "sam active", "registrations"],
    answer: "Envision is SAM.gov active, with federal registrations by campus. Wichita (ICT) carries Envision Industries, CAGE 2A178, UEI HC9MYND3ZLW5, and Envision, Inc., CAGE 7A1U0, UEI KEAMG55THMS3. Dallas (DFW) is CAGE 5A062, UEI RPKGK5NASDZ7. The Base Supply Center entity is CAGE 3BLJ3, UEI WC8ZXNHDLKE1.",
    next: {action:"section", target:"Compliance", label:"See all registration codes"},
    contact: "zahr",
    source: "Compliance"
  },
  {
    id: "base-supply-centers",
    label: "Base Supply Centers",
    triggers: ["base supply center", "base supply centers", "bsc", "on base", "military base",
      "gpc", "impac", "base store", "on-base store", "supply center"],
    answer: "Envision operates 16 Base Supply Centers across 10 states, serving Air Force, Army, Space Force, and Navy, as part of the AbilityOne network that spans 160-plus bases. Pricing is pre-approved, so there is no competitive bid cycle, and GPC and IMPAC cards are accepted.",
    next: {action:"bsc", label:"View the network map"},
    contact: "zahr",
    source: "Campuses + Proof"
  },
  {
    id: "state-use",
    label: "State Use programs",
    triggers: ["state use", "kansas state use", "texas workquest", "workquest", "tibh",
      "state contract", "state agency", "state procurement", "state use program"],
    answer: "Both campuses are authorized State Use sources. The Wichita campus is the verified Kansas State Use participant, and the Dallas campus is an authorized Texas WorkQuest participant under the State of Texas State Use Program. State agencies procure campus-manufactured product through the mandatory-source channel.",
    next: {action:"section", target:"Proof", label:"See state channels"},
    contact: "zahr",
    source: "Proof"
  },
  {
    id: "documents",
    label: "Documents and PDFs",
    triggers: ["capabilities statement", "brochure", "document library", "pdf", "download",
      "spec sheet", "certificate", "line card", "one pager", "literature", "paperwork",
      "compliance letter", "documents"],
    /* NOTE: the deck's document links are placeholders (href="#"). Swap in the
       real files in index.html before promising downloads. */
    answer: "Our document library includes the Capabilities Statement, the ISO 9001:2015 certificate (CERT-0145812, Dallas), and the Berry and TAA compliance letter. You will find them in the Compliance section of the deck.",
    next: {action:"section", target:"Compliance", label:"Open the document library"},
    contact: "zahr",
    source: "Compliance, Document Library"
  },

  /* ---------- Pricing / lead time: route to a human, never quote ---------- */
  {
    id: "pricing",
    label: "Pricing and lead time",
    triggers: ["price", "pricing", "cost", "quote", "how much", "rate", "rates",
      "lead time", "turnaround", "moq", "minimum order", "capacity availability",
      "delivery time", "eta", "ship date", "how long"],
    answer: "Pricing and lead times depend on the product, volume, and channel, and all federal-channel pricing is reviewed and approved as fair and reasonable by DLA Troop Support. I do not quote numbers here, but the right person can get you a precise figure for your order.",
    contact: "zahr",
    source: "Proof (pricing routes to a human by design)"
  },

  /* ---------- Talk to a person ---------- */
  {
    id: "contact-human",
    label: "Talk to a person",
    triggers: ["contact", "talk to someone", "talk to a person", "sales rep", "who do i talk to",
      "get in touch", "representative", "speak to", "human", "salesperson", "email",
      "reach you", "connect me", "who can i call"],
    answer: "Happy to connect you. Tell me what you are working on and I will route you to the right person. For partnership and procurement, our Chief Revenue and Strategy Officer is the front door.",
    next: {action:"section", target:"Contact", label:"See contact details"},
    contact: "zahr",
    source: "Contact"
  },

  /* ---------- Greeting ---------- */
  {
    id: "greeting",
    label: "Hello",
    triggers: ["hi", "hello", "hey", "good morning", "good afternoon", "start",
      "help", "what can you do", "get started", "howdy"],
    answer: "Welcome. I am the Envision capabilities concierge. Ask me what we make, how to buy from us, or who to talk to, and I will route you to the right place.",
    contact: null,
    source: "—"
  }

];
