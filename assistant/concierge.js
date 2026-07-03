/* =====================================================================
   ENVISION CAPABILITIES CONCIERGE  ·  MATCHING ENGINE + CHAT UI
   ---------------------------------------------------------------------
   This is the only "engine" file. You should not need to edit it to change
   answers, contacts, or routing. It:
     1. Indexes the authored intents (knowledge.js) in MiniSearch, a small
        bundled fuzzy search library. No server. No network. No language
        model. It can only ever return text you authored.
     2. Classifies each query as a confident answer, a qualifying question,
        or a human handoff, using a tuned confidence threshold.
     3. Renders a fully keyboard-accessible slide-up chat panel.

   TUNE MATCHING HERE:  see the CONFIG block immediately below.
   ===================================================================== */
(function(){
  "use strict";

  /* ------------------------------------------------------------------ *
   * CONFIG  ·  the confidence threshold and opening chips              *
   * ------------------------------------------------------------------ */
  var CONFIG = {
    // Top score must clear this floor to count as a match at all.
    // Below it, the concierge does not guess; it hands off to a human.
    // Re-tuned to 18 after the matcher hardening (Addendum A): dropping the
    // answer body from the index lowered scores across the board, and junk now
    // produces zero matches regardless of the floor, so the floor only governs
    // legitimate short discovery words ("capabilities", "what do you make").
    scoreFloor: 18,
    // Coverage guard: the fraction of a query's tokens that must match the
    // winning intent before it can answer (for queries longer than 2 tokens).
    // Stops one incidental word in a long sentence from winning on raw score.
    coverageMin: 0.34,
    // If the runner-up is within this ratio of the top score, the matches
    // are too close to call, so the concierge qualifies instead of guessing.
    // (0.30 = runner-up scored within 30 percent of the leader.)
    clarifySeparation: 0.30,
    // Intent ids shown as quick-reply chips when the panel first opens.
    openingChips: ["capabilities-overview", "how-to-buy", "abilityone", "locations", "contact-human"],
    // Fallback intent id used for the greeting bubble.
    greetingId: "greeting",
    // A contact card is normally only shown when the visitor is actually after
    // a person (an intent that opts in via showContact, or a handoff). As a
    // safety net, once someone has asked this many questions in a session, we
    // start appending the card so a human is always one tap away. Raise it to
    // surface the card later, lower it to surface it sooner.
    contactAfterQueries: 4,
    // CATALOG LAYER (section 2b). A SECOND MiniSearch index, built over the
    // deck's catalog and machine tables (window.ENVISION_CATALOG). It only
    // fires when a query carries a "granular" signal (a color, size, NSN,
    // part number, or the words size/nsn/machine, etc.), so family questions
    // keep going to the authored intents and only specific ones reach the
    // rows. These knobs are independent of scoreFloor above because the
    // catalog is a separate index with its own score scale.
    //   floor: minimum catalog match score to answer at all.
    //   clarifySeparation: if the runner-up (in a DIFFERENT capability area)
    //     is within this ratio, qualify with chips instead of guessing.
    catalog: { floor: 4, clarifySeparation: 0.25 }
  };

  // Words too common to carry meaning. Filtering them keeps short function
  // words (you, are, do, what) and conversational filler (tell, show) from
  // drowning out, or coincidentally matching, the distinctive term in a query.
  var STOPWORDS = new Set(("a an the you your yours are is am do does did i we me my our " +
    "to of for and or it this that please be us have has had on in at can could would " +
    "will should want need looking got what whats tell show give find me about").split(" "));

  // ------------------------------------------------------------------
  // Guard: degrade gracefully if a dependency failed to load. The deck
  // must never break because the concierge could not start.
  // ------------------------------------------------------------------
  if (!window.MiniSearch || !window.ENVISION_INTENTS || !window.ENVISION_INTENTS.length){
    if (window.console && console.warn){
      console.warn("[Envision concierge] knowledge or MiniSearch not loaded; concierge disabled.");
    }
    return;
  }

  var INTENTS  = window.ENVISION_INTENTS;
  var CONTACTS = window.ENVISION_CONTACTS || {};
  var ROUTING  = window.ENVISION_ROUTING || { default: null };
  var byId = {};
  INTENTS.forEach(function(i){ byId[i.id] = i; });

  /* ------------------------------------------------------------------ *
   * 1. SEARCH INDEX                                                     *
   * ------------------------------------------------------------------ */
  function processTerm(term){
    term = String(term).toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!term || STOPWORDS.has(term)) return false;
    return term;
  }
  var mini = new window.MiniSearch({
    // We index label and triggers only, NOT the answer body. Indexing prose
    // made every generic word in every answer (custom, available, federal,
    // support, line) searchable, so incidental words matched intents that were
    // never meant to fire. Every match is now on an authored trigger or label.
    fields: ["label", "triggers"],
    storeFields: ["intentId"],
    idField: "intentId",
    processTerm: processTerm,
    searchOptions: {
      boost: { triggers: 5, label: 3 },
      // Length-aware fuzzy and prefix. Short tokens require an exact match, so
      // "test" can no longer fuzz into "vest" or "bin" prefix into "binder".
      // Real typos, likelier and less ambiguous on longer words, keep slack.
      fuzzy: function(term){ return term.length <= 4 ? false : 0.2; },
      prefix: function(term){ return term.length >= 5; },
      combineWith: "OR"
    }
  });
  mini.addAll(INTENTS.map(function(i){
    return {
      intentId: i.id,
      label: i.label || "",
      triggers: (i.triggers || []).join(" ")
    };
  }));

  /* ------------------------------------------------------------------ *
   * 2. CLASSIFY  ·  answer / clarify / handoff                         *
   * ------------------------------------------------------------------ */
  // Tokens of a query after processing (lowercased, de-punctuated, stopworded).
  // Used by the coverage guard below.
  function queryTokens(text){
    return String(text || "").split(/\s+/).map(processTerm).filter(Boolean);
  }

  // The catch-all discovery intents. They should win only when the query is a
  // generic discovery question, and yield to any specific intent that also
  // clears the floor, so a precise product noun routes precisely and a bare
  // "hey" does not steal a real question.
  var GENERIC_INTENTS = { greeting: true, "capabilities-overview": true };

  function classify(text){
    var results = mini.search(text || "");
    if (!results.length) return { type: "handoff" };

    // Generic-intent yielding (see GENERIC_INTENTS).
    if (GENERIC_INTENTS[results[0].intentId]){
      var alt = [];
      for (var a = 0; a < results.length; a++){
        if (!GENERIC_INTENTS[results[a].intentId] && results[a].score >= CONFIG.scoreFloor){
          alt.push(results[a]);
        }
      }
      if (alt.length) results = alt;
    }

    if (results[0].score < CONFIG.scoreFloor) return { type: "handoff" };
    var top = byId[results[0].intentId];
    if (!top) return { type: "handoff" };

    // Coverage guard: a confident answer must reflect MOST of what the buyer
    // typed, not one coincidental token in a long off-topic sentence ("I saw a
    // nice vest yesterday"). results[0].terms is the set of query terms that
    // actually matched the winning intent.
    var qN = queryTokens(text).length;
    var matched = (results[0].terms || []).length;
    if (qN > 0){
      var need = qN <= 2 ? 1 : Math.ceil(qN * CONFIG.coverageMin);
      if (matched < need) return { type: "handoff" };
    }

    // An authored clarifier always qualifies (the deliberate "fork" intents).
    if (top.clarify){
      return { type: "clarify", question: top.clarify.question, options: top.clarify.options };
    }

    // Otherwise, if the runner-up is too close, qualify with the close set.
    var sep = results.length > 1
      ? (results[0].score - results[1].score) / results[0].score
      : 1;
    if (sep < CONFIG.clarifySeparation){
      var options = [];
      var seen = {};
      for (var k = 0; k < results.length && options.length < 3; k++){
        if (results[k].score < CONFIG.scoreFloor * 0.55) break;
        var it = byId[results[k].intentId];
        if (!it || it.id === CONFIG.greetingId || seen[it.id]) continue;
        seen[it.id] = true;
        options.push({ label: it.label, intent: it.id });
      }
      if (options.length >= 2){
        return {
          type: "clarify",
          question: "A few areas could fit what you are after. Which is closest?",
          options: options
        };
      }
    }
    return { type: "answer", intent: top };
  }

  function resolveContact(intent){
    var id = (intent && intent.contact) ||
             (intent && ROUTING[intent.id]) ||
             ROUTING.default;
    return id && CONTACTS[id] ? CONTACTS[id] : null;
  }

  /* ------------------------------------------------------------------ *
   * 2b. CATALOG LAYER  ·  surface the deck's granular catalog data      *
   * ------------------------------------------------------------------ *
   * The deck (index.html) exposes its data object as a single shared    *
   * global, window.ENVISION_CATALOG. We index the catalog and machine   *
   * tables it already renders, so a granular question ("what colors do  *
   * isolation liners come in", "what sewing machines do you run", "NSN  *
   * on 6 mil black sheeting") gets a short, sourced answer drawn from   *
   * the exact same rows the modals show. One source, no drift. We never *
   * author a fact here; we summarize rows that already exist, then offer *
   * the modal for the full table and the right person.                  *
   *                                                                     *
   * HONESTY BY CONSTRUCTION: we index ONLY the `catalogs` and           *
   * `equipment` tables, never the prose (summary, overview, stats,      *
   * callouts). That deliberately keeps the two flagged-for-verification *
   * items out of the index entirely, because they live only in prose:   *
   * the specialty [VERIFY w/ Steve] embroidery/HTV notes and the        *
   * 610 N Main Street contact-center address. They are unreachable from *
   * this layer and stay that way until a human confirms them.           *
   * ------------------------------------------------------------------ */
  var CATALOG = window.ENVISION_CATALOG || null;
  var catMini = null;
  var CATALOG_COLORS = {};   // lowercase color word -> true, harvested from rows

  // Modal key -> contact id. Mirrors the routing the family intents use:
  // manufacturing plus the print and quality services go to Patrick Tuttle;
  // the buyer-facing services go to Sebastian Zahr.
  var CATALOG_CONTACT = {
    plastic:"tuttle", textile:"tuttle", reflective:"tuttle", binders:"tuttle",
    writing:"tuttle", fulfillment:"tuttle", kitting:"tuttle", specialty:"tuttle",
    printSvc:"tuttle", quality:"tuttle",
    contact:"zahr", bpo:"zahr", accessibility:"zahr", procurement:"zahr"
  };

  function colIndex(cols, names){
    cols = cols || [];
    for (var k = 0; k < cols.length; k++){
      var c = String(cols[k]).toLowerCase();
      for (var j = 0; j < names.length; j++){ if (c.indexOf(names[j]) >= 0) return k; }
    }
    return -1;
  }

  function buildCatalog(){
    if (!CATALOG || !window.MiniSearch) return;
    var docs = [];
    Object.keys(CATALOG).forEach(function(key){
      var m = CATALOG[key]; if (!m) return;
      var groups = [];
      (m.catalogs || []).forEach(function(t){ groups.push(["catalog", t]); });
      (m.equipment || []).forEach(function(t){ groups.push(["machines", t]); });
      groups.forEach(function(g, idx){
        var kind = g[0], t = g[1];
        // Searchable text: the modal title, the table title and meta, the
        // column headers, and every cell (so part numbers, NSNs, colors,
        // sizes, and machine names are all matchable).
        var parts = [m.title, t.title, t.meta || ""];
        (t.columns || []).forEach(function(c){ parts.push(c); });
        (t.rows || []).forEach(function(r){
          (r || []).forEach(function(cell){ parts.push(String(cell)); });
        });
        // Harvest color words so the granular-signal test can spot a bare
        // color in a query ("vests in orange").
        var ci = colIndex(t.columns, ["color", "colour"]);
        if (ci >= 0){
          (t.rows || []).forEach(function(r){
            String((r || [])[ci] || "").toLowerCase().split(/[^a-z]+/).forEach(function(w){
              if (w.length > 2) CATALOG_COLORS[w] = true;
            });
          });
        }
        (m.colors || []).forEach(function(c){
          String(c).toLowerCase().split(/[^a-z]+/).forEach(function(w){ if (w.length > 2) CATALOG_COLORS[w] = true; });
        });
        docs.push({
          id: key + "::" + kind + idx,
          modalKey: key, modalTitle: m.title, location: m.location || "",
          kind: kind, title: t.title, meta: t.meta || "", footnote: t.footnote || "",
          columns: t.columns || [], rows: t.rows || [],
          text: parts.join(" ")
        });
      });
    });
    if (!docs.length) return;
    catMini = new window.MiniSearch({
      fields: ["title", "meta", "text"],
      storeFields: ["modalKey", "modalTitle", "location", "kind", "title", "meta", "footnote", "columns", "rows"],
      idField: "id",
      processTerm: processTerm,
      searchOptions: { boost: { title: 3, meta: 2, text: 1 }, fuzzy: 0.1, prefix: true, combineWith: "OR" }
    });
    catMini.addAll(docs);
  }

  // A query reaches the catalog only when it carries a granular signal: an
  // explicit attribute word, a size/gauge, a part/NSN-ish token, or a known
  // color. Family questions ("can liners", "do you make pens") carry none of
  // these, so they stay with the authored intents.
  var CATALOG_ATTR_RE = /\b(colou?rs?|nsn|sku|skus|part\s*(?:numbers?|nos?|#)|size[sd]?|gauge|thickness|mils?|micron|machine[s]?)\b/i;
  function granularSignal(q){
    var s = " " + String(q).toLowerCase() + " ";
    if (CATALOG_ATTR_RE.test(s)) return true;
    if (/\d{2,}\s*x\s*\d/.test(s)) return true;             // 33x40, 30 x 37
    if (/\b\d{1,2}\s*(?:mil|mic|micron)\b/.test(s)) return true; // 6 mil, 8 mic
    if (/\b\d{3,}\b/.test(s)) return true;                  // NSN / part fragment
    if (/[a-z]{2,}-\d{2,}/.test(s)) return true;            // HVBF-022, TRC-3658
    // A color is distinctive ONLY when paired with another content word. A
    // lone "black" or "clear" must not surface a catalog table; "black can
    // liners" or "vests in orange" should.
    var toks = s.split(/[^a-z0-9]+/).filter(Boolean);
    var hasColor = false, content = 0;
    for (var i = 0; i < toks.length; i++){
      if (CATALOG_COLORS[toks[i]]) hasColor = true;
      if (toks[i].length > 1 && !STOPWORDS.has(toks[i])) content++;
    }
    return hasColor && content >= 2;
  }

  function classifyCatalog(text){
    if (!catMini || !granularSignal(text)) return null;
    var res = catMini.search(text || "");
    if (!res.length || res[0].score < CONFIG.catalog.floor) return null;
    var top = res[0];
    // If a strong runner-up sits in a DIFFERENT capability area, the query is
    // genuinely ambiguous (e.g. "vests" spans reflective and textile). Qualify
    // with chips rather than pick for the buyer.
    if (res.length > 1){
      var sep = (res[0].score - res[1].score) / res[0].score;
      if (sep < CONFIG.catalog.clarifySeparation && res[1].modalKey !== top.modalKey){
        var opts = [], seenKey = {};
        for (var k = 0; k < res.length && opts.length < 3; k++){
          if (res[k].score < CONFIG.catalog.floor) break;
          if (seenKey[res[k].modalKey]) continue;
          seenKey[res[k].modalKey] = true;
          opts.push(res[k]);
        }
        if (opts.length >= 2){
          return {
            type: "clarify",
            question: "That could fit a couple of different lines. Which is closest to what you need?",
            options: opts
          };
        }
      }
    }
    return { type: "answer", doc: top };
  }

  /* ---- Compose a short, sourced answer from a matched table ---- */
  function listPhrase(items){
    if (items.length === 1) return items[0];
    if (items.length === 2) return items[0] + " and " + items[1];
    return items.slice(0, -1).join(", ") + ", and " + items[items.length - 1];
  }
  // Join up to `max` items, ending on "and more" when the list is longer so we
  // never imply a partial list is the whole catalog.
  function joinFacet(items, max){
    if (items.length <= max) return listPhrase(items);
    return items.slice(0, max).join(", ") + ", and more";
  }
  function distinctCol(doc, names){
    var i = colIndex(doc.columns, names);
    if (i < 0) return null;
    var seen = {}, out = [];
    (doc.rows || []).forEach(function(r){
      var v = String((r || [])[i] || "").trim();
      if (!v || v === "-" || seen[v]) return;
      seen[v] = true; out.push(v);
    });
    return out.length ? out : null;
  }
  // House style: the concierge never speaks an em or en dash, and the deck's
  // middot separator reads as a comma in a spoken sentence.
  function houseStyle(s){
    return String(s)
      .replace(/\s*[—–]\s*/g, ". ")
      .replace(/\s*·\s*/g, ", ")
      .replace(/\s{2,}/g, " ").trim();
  }
  // Drop any sentence that is an internal note never meant for a buyer. Belt
  // and suspenders: the index already excludes the flagged prose, but a table
  // footnote can still carry a "confirm before publishing" aside.
  function stripInternalNotes(s){
    if (!s) return "";
    var INTERNAL = /verify w\/?\s*steve|confirm before publishing|not stated in source|placeholder|to ?do\b/i;
    // Split into sentences WITHOUT a lookbehind (older iOS Safari, where this
    // runs as a PWA, does not support lookbehind and would fail to parse).
    var sentences = String(s).match(/[^.!?]+[.!?]*/g) || [String(s)];
    return sentences.filter(function(x){
      return x && !INTERNAL.test(x);
    }).join(" ").replace(/\s{2,}/g, " ").trim();
  }
  function summarizeCatalog(doc){
    var loc = doc.location ? " (" + doc.location + ")" : "";
    var lead = houseStyle(doc.title) + loc + ".";
    // One clean descriptive clause: the footnote (internal notes stripped) if
    // present, else the table's meta line.
    var desc = stripInternalNotes(doc.footnote);
    if (!desc) desc = doc.meta || "";
    desc = houseStyle(desc);
    var facts = [];
    if (doc.kind === "machines"){
      var names = (doc.rows || []).map(function(r){ return String((r || [])[0] || "").trim(); }).filter(Boolean);
      if (names.length){
        facts.push("We run " + names.length + " machine types at this stage, including " +
          joinFacet(names, 4));
      }
    } else {
      var n = (doc.rows || []).length;
      var f = "We catalog " + (n === 1 ? "1 item" : n + " items");
      var colors = distinctCol(doc, ["color", "colour"]);
      if (colors){ f += ", in " + joinFacet(colors, 6); }
      facts.push(f);
      var sizes = distinctCol(doc, ["size"]);
      if (sizes && sizes.length > 1){
        facts.push("Sizes run " + joinFacet(sizes, 4));
      }
    }
    var out = [lead];
    if (desc) out.push(desc);
    if (facts.length) out.push(facts.join(". ") + ".");
    return out.join(" ").replace(/\s+\./g, ".").replace(/\.\.+/g, ".");
  }

  /* ------------------------------------------------------------------ *
   * 3. UI  ·  build launcher + panel                                   *
   * ------------------------------------------------------------------ */
  var SVG = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.6A8.5 8.5 0 0 1 4 11.5 8.38 8.38 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M22 2 11 13"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
    web: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'
  };

  var root = document.createElement("div");
  root.className = "env-concierge";
  root.innerHTML =
    '<button class="ec-launcher" id="ecLauncher" type="button" aria-haspopup="dialog" ' +
      'aria-expanded="false" aria-controls="ecPanel" aria-label="Ask Envision. Open the capabilities concierge.">' +
      SVG.chat + '<span class="ec-launcher-label">Ask Envision</span>' +
    '</button>' +
    '<section class="ec-panel" id="ecPanel" role="dialog" aria-modal="true" ' +
      'aria-labelledby="ecHeadTitle" tabindex="-1" hidden>' +
      '<header class="ec-head">' +
        '<span class="ec-head-badge" aria-hidden="true">' + SVG.chat + '</span>' +
        '<span class="ec-head-txt">' +
          '<span class="ec-head-title" id="ecHeadTitle">Envision Concierge</span>' +
          '<span class="ec-head-sub">Capabilities and services</span>' +
        '</span>' +
        '<button class="ec-head-close" id="ecClose" type="button" aria-label="Close concierge">' +
          SVG.close +
        '</button>' +
      '</header>' +
      '<div class="ec-log" id="ecLog" role="log" aria-live="polite" aria-relevant="additions" tabindex="0" ' +
        'aria-label="Conversation with the Envision concierge"></div>' +
      '<form class="ec-form" id="ecForm">' +
        '<label class="ec-sr-only" for="ecInput">Type your question for the Envision concierge</label>' +
        '<textarea class="ec-input" id="ecInput" rows="1" autocomplete="off" ' +
          'enterkeyhint="send" ' +
          'placeholder="Ask about a product or who to call"></textarea>' +
        '<button class="ec-send" id="ecSend" type="submit" aria-label="Send message">' + SVG.send + '</button>' +
      '</form>' +
    '</section>';
  document.body.appendChild(root);

  var launcher = root.querySelector("#ecLauncher");
  var panel    = root.querySelector("#ecPanel");
  var closeBtn = root.querySelector("#ecClose");
  var log      = root.querySelector("#ecLog");
  var form     = root.querySelector("#ecForm");
  var input    = root.querySelector("#ecInput");
  var sendBtn  = root.querySelector("#ecSend");

  var opened = false;          // panel currently open
  var started = false;         // greeting has been shown once this session
  var userTurns = 0;           // how many things the visitor has asked this session

  /* ------------------------------------------------------------------ *
   * 4. RENDER HELPERS                                                   *
   * ------------------------------------------------------------------ */
  function el(tag, cls, html){
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function scrollLog(){ log.scrollTop = log.scrollHeight; }

  function addUserMessage(text){
    userTurns++;   // counts typed questions and tapped chips alike
    var wrap = el("div", "ec-msg ec-msg-user");
    wrap.appendChild(el("div", "ec-bubble", esc(text)));
    log.appendChild(wrap);
    scrollLog();
  }

  function addBotBubble(text){
    var wrap = el("div", "ec-msg ec-msg-bot");
    wrap.appendChild(el("div", "ec-bubble", esc(text)));
    log.appendChild(wrap);
    scrollLog();
    return wrap;
  }

  // A row of tappable chips. `items` = [{label, onClick}].
  function addChips(items, opts){
    if (!items || !items.length) return;
    var row = el("div", "ec-chips");
    items.forEach(function(item){
      var chip = el("button", "ec-chip" + (item.primary ? " ec-chip--next" : ""));
      chip.type = "button";
      chip.innerHTML = esc(item.label) + (item.primary ? " " + SVG.arrow : "");
      chip.addEventListener("click", function(){ item.onClick(); });
      row.appendChild(chip);
    });
    log.appendChild(row);
    scrollLog();
  }

  function addContactCard(contact){
    if (!contact) return;
    // Don't stack the identical card twice in a row. Once a visitor passes
    // CONFIG.contactAfterQueries, every answer wants to append the same person;
    // showing it once per run is helpful, repeating it under each bubble nags.
    var prev = log.lastElementChild;
    if (prev && prev.className === "ec-contact" &&
        prev.getAttribute("data-contact") === (contact.name || "")){
      return;
    }
    var card = el("div", "ec-contact");
    card.setAttribute("data-contact", contact.name || "");
    var html =
      '<div class="ec-contact-eyebrow">Talk to</div>' +
      '<div class="ec-contact-name">' + esc(contact.name) + '</div>' +
      (contact.title ? '<div class="ec-contact-title">' + esc(contact.title) + '</div>' : "");
    if (contact.talkTo){
      html += '<div class="ec-contact-talk">' + esc(contact.talkTo) + '</div>';
    }
    var m = contact.method || {};
    var methods = [];
    if (m.phone)  methods.push('<a href="tel:' + esc(m.phone.replace(/[^0-9+]/g, "")) + '">' + SVG.phone + esc(m.phone) + '</a>');
    if (m.mobile) methods.push('<a href="tel:' + esc(m.mobile.replace(/[^0-9+]/g, "")) + '">' + SVG.phone + esc(m.mobile) + ' (mobile)</a>');
    if (m.email)  methods.push('<a href="mailto:' + esc(m.email) + '">' + SVG.mail + esc(m.email) + '</a>');
    if (m.web){
      var href = /^https?:/i.test(m.web) ? m.web : "https://" + m.web;
      methods.push('<a href="' + esc(href) + '" target="_blank" rel="noopener noreferrer">' + SVG.web + esc(m.web) + '</a>');
    }
    if (methods.length){
      html += '<div class="ec-contact-methods">' + methods.join("") + '</div>';
    }
    card.innerHTML = html;
    log.appendChild(card);
    scrollLog();
  }

  /* ------------------------------------------------------------------ *
   * 5. NEXT-STEP ACTIONS  ·  bridge into the deck                      *
   * ------------------------------------------------------------------ */
  function runNext(next){
    var deck = window.EnvisionDeck || {};
    var fn = next.action === "modal"   ? deck.openModal
           : next.action === "section" ? deck.goToSection
           : next.action === "bsc"     ? deck.openBSC
           : null;
    // If the deck bridge is missing (deck script failed, or a stale `next`
    // names an action the deck does not expose), never close the chat into a
    // blank screen. Keep the conversation and hand over a real person instead
    // of a button that goes nowhere.
    if (typeof fn !== "function"){
      addBotBubble("I could not open that view just now, but I can still point you to the right person.");
      addContactCard(resolveContact(null));
      return;
    }
    // Opening a deck modal / section takes over the screen, so close the
    // concierge first to keep focus management clean (no nested dialogs).
    closePanel({ silent: true });
    fn.call(deck, next.target);
  }

  function addNextStep(intent){
    if (!intent || !intent.next) return false;
    var next = intent.next;
    addChips([{
      label: next.label || "View this in the deck",
      primary: true,
      onClick: function(){ runNext(next); }
    }]);
    return true;
  }

  /* ------------------------------------------------------------------ *
   * 6. RESPONSE FLOWS                                                   *
   * ------------------------------------------------------------------ */
  function dispatchIntent(intent){
    if (!intent) return;
    // An intent can itself be a clarifier.
    if (intent.clarify){
      renderClarify(intent.clarify.question, intent.clarify.options);
      return;
    }
    addBotBubble(intent.answer);
    var hasNext = addNextStep(intent);
    // Only surface a contact card when the visitor is actually after a person:
    // either the intent opts in (showContact, e.g. "talk to a person" or
    // pricing), or they have asked enough questions that handing them a human
    // is the helpful move. A plain informational answer just points back into
    // the deck and does not nag with a contact.
    var wantContact = intent.showContact === true ||
                      userTurns >= CONFIG.contactAfterQueries;
    var contact = wantContact ? resolveContact(intent) : null;
    if (contact){ addContactCard(contact); }
    // "Never dead-end": if there is neither a next step nor a contact, give
    // the buyer a way forward.
    if (!hasNext && !contact){
      offerStartOver();
    }
  }

  function renderClarify(question, options){
    addBotBubble(question);
    addChips((options || []).map(function(opt){
      return {
        label: opt.label,
        onClick: function(){
          addUserMessage(opt.label);
          var it = byId[opt.intent];
          if (it){ dispatchIntent(it); }
          else { renderHandoff(); }
        }
      };
    }));
  }

  function renderHandoff(){
    addBotBubble("I want to connect you with the right person rather than guess. Tell me the product or agency you have in mind, or reach out directly and we will route you.");
    var contact = (ROUTING.default && CONTACTS[ROUTING.default]) ? CONTACTS[ROUTING.default] : null;
    addContactCard(contact);
    offerOpeningChips("Or start with one of these:");
  }

  function offerStartOver(){
    offerOpeningChips("Here are a few places to start:");
  }

  function offerOpeningChips(introText){
    var chips = CONFIG.openingChips
      .map(function(id){ return byId[id]; })
      .filter(Boolean)
      .map(function(it){
        return {
          label: it.label,
          onClick: function(){
            addUserMessage(it.label);
            dispatchIntent(it);
          }
        };
      });
    if (introText){ addBotBubble(introText); }
    addChips(chips);
  }

  // A matched catalog table: speak the short sourced summary, then offer the
  // full table (the modal) and the right person. Reaching a human is part of
  // the value on a granular question, so the contact rides along here.
  function dispatchCatalog(doc){
    addBotBubble(summarizeCatalog(doc));
    addChips([{
      label: "Open " + doc.modalTitle,
      primary: true,
      onClick: function(){ runNext({ action: "modal", target: doc.modalKey }); }
    }]);
    var contact = CONTACTS[CATALOG_CONTACT[doc.modalKey]] ||
                  (ROUTING.default && CONTACTS[ROUTING.default]) || null;
    if (contact){ addContactCard(contact); }
  }

  function renderCatalogClarify(question, options){
    addBotBubble(question);
    addChips(options.map(function(doc){
      return {
        label: doc.modalTitle,
        onClick: function(){ addUserMessage(doc.modalTitle); dispatchCatalog(doc); }
      };
    }));
  }

  // Session-only, in-memory log of queries that matched nothing (below floor,
  // no catalog hit). No storage, no network. Real buyer language that fell
  // through is the raw material for next week's intents and triggers.
  // Read it live in the console: EnvisionConcierge.unmatched()
  var MISS_LOG = [];
  function logMiss(text){
    MISS_LOG.push({ q: text, at: new Date().toISOString() });
    if (window.console && console.debug){
      console.debug("[Envision concierge] unmatched (below floor):", text);
    }
  }

  function handleQuery(text){
    text = (text || "").trim();
    if (!text) return;
    addUserMessage(text);
    // Granular questions reach the catalog first; everything else stays with
    // the authored intents.
    var cat = classifyCatalog(text);
    if (cat){
      if (cat.type === "answer"){ dispatchCatalog(cat.doc); return; }
      if (cat.type === "clarify"){ renderCatalogClarify(cat.question, cat.options); return; }
    }
    var verdict = classify(text);
    if (verdict.type === "answer"){ dispatchIntent(verdict.intent); }
    else if (verdict.type === "clarify"){ renderClarify(verdict.question, verdict.options); }
    else { logMiss(text); renderHandoff(); }
  }

  /* ------------------------------------------------------------------ *
   * 7. OPEN / CLOSE + FOCUS MANAGEMENT                                  *
   * ------------------------------------------------------------------ */
  function focusables(){
    return Array.prototype.slice.call(
      panel.querySelectorAll('button, [href], textarea, input, [tabindex]:not([tabindex="-1"])')
    ).filter(function(n){ return !n.disabled && n.offsetParent !== null; });
  }

  function onKeydown(e){
    if (!opened) return;
    if (e.key === "Escape"){ e.preventDefault(); closePanel(); return; }
    if (e.key === "Tab"){
      var f = focusables();
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  }

  function openPanel(){
    if (opened) return;
    // One overlay layer at a time: never raise the chat over an open deck
    // modal / map / lightbox (the launcher is already hidden then, but a
    // keyboard activation could still reach this), and fold away the deck's
    // section menu if it happens to be open.
    if (document.body.classList.contains("env-overlay-open")) return;
    if (window.EnvisionDeck && window.EnvisionDeck.closeMenu) window.EnvisionDeck.closeMenu();
    opened = true;
    panel.hidden = false;
    // Allow the [hidden] removal to paint before transitioning in.
    requestAnimationFrame(function(){ panel.classList.add("is-open"); });
    launcher.setAttribute("aria-expanded", "true");
    document.addEventListener("keydown", onKeydown, true);

    if (!started){
      started = true;
      var greeting = byId[CONFIG.greetingId];
      addBotBubble(greeting ? greeting.answer : "Welcome to the Envision concierge. How can I help?");
      offerOpeningChips(null);
    }
    // Move focus into the panel for keyboard and screen-reader users. On a
    // touch device, do NOT auto-focus the textarea: that pops the soft
    // keyboard (and on iOS the zoom) the instant the panel opens, before the
    // visitor has even read the greeting. Focus the dialog instead; the
    // visitor taps the field when they are ready to type.
    var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    setTimeout(function(){
      if (!opened) return;
      if (coarse){ panel.focus(); } else { input.focus(); }
    }, 60);
  }

  function closePanel(opts){
    if (!opened) return;
    opened = false;
    panel.classList.remove("is-open");
    launcher.setAttribute("aria-expanded", "false");
    document.removeEventListener("keydown", onKeydown, true);
    // Drop any keyboard-inset lift so the launcher sits at its normal anchor.
    root.style.setProperty("--ec-kb", "0px");
    // Wait out the transition, then hide — unless the panel was re-opened
    // during the 220ms window, in which case hiding it would leave an
    // "open" but invisible panel.
    var done = function(){ if (!opened) panel.hidden = true; };
    setTimeout(done, 220);
    if (!(opts && opts.silent)){
      // Return focus to the launcher unless the deck took focus (e.g. a modal).
      setTimeout(function(){ if (document.body.contains(launcher)) launcher.focus(); }, 30);
    }
  }

  /* ------------------------------------------------------------------ *
   * 8. EVENTS                                                           *
   * ------------------------------------------------------------------ */
  launcher.addEventListener("click", openPanel);
  closeBtn.addEventListener("click", function(){ closePanel(); });

  form.addEventListener("submit", function(e){
    e.preventDefault();
    var text = input.value;
    input.value = "";
    autosize();
    syncSend();
    handleQuery(text);
  });

  // Enter sends, Shift+Enter makes a newline. `isComposing` guards an IME: a
  // visitor typing CJK presses Enter to confirm a candidate, which must commit
  // the text, not fire off a half-composed message.
  input.addEventListener("keydown", function(e){
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing && e.keyCode !== 229){
      e.preventDefault();
      form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true }));
    }
  });

  function autosize(){
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 96) + "px";
  }
  // Disable Send when there is nothing to send, so a tap on an empty box is
  // never a dead, silent no-op (the disabled style already existed; nothing
  // ever toggled it).
  function syncSend(){ sendBtn.disabled = !input.value.trim(); }
  input.addEventListener("input", function(){ autosize(); syncSend(); });
  syncSend();

  /* ------------------------------------------------------------------ *
   * KEYBOARD-AWARE SIZING  ·  keep the composer above the soft keyboard *
   * ------------------------------------------------------------------ *
   * On a phone, position:fixed is anchored to the layout viewport, so an
   * open keyboard slides the composer out of sight behind it. We measure the
   * keyboard inset from the VisualViewport and expose it as --ec-kb; the CSS
   * lifts the panel by exactly that much. Guarded: where VisualViewport is
   * absent the inset stays 0 and the panel behaves as before.            */
  function syncKeyboardInset(){
    var vv = window.visualViewport;
    if (!vv){ return; }
    var inset = opened ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0;
    root.style.setProperty("--ec-kb", Math.round(inset) + "px");
  }
  if (window.visualViewport){
    window.visualViewport.addEventListener("resize", syncKeyboardInset);
    window.visualViewport.addEventListener("scroll", syncKeyboardInset);
  }

  /* ------------------------------------------------------------------ *
   * 9. STARTUP  ·  build the catalog index, expose a tiny debug surface *
   * ------------------------------------------------------------------ */
  // The catalog layer is a bonus, never a dependency. If anything about the
  // shared data object is off, the concierge still answers from the intents.
  try {
    buildCatalog();
  } catch (e){
    catMini = null;
    if (window.console && console.warn){
      console.warn("[Envision concierge] catalog layer disabled:", e);
    }
  }

  /* ------------------------------------------------------------------ *
   * 10. REGRESSION BATTERY  ·  dev-only, never shown to a visitor       *
   * ------------------------------------------------------------------ *
   * "test test" slipped through because nothing tested for it. This is  *
   * the fixed battery (Addendum A, section 5). Run it after every       *
   * engine change and every weekly session:                            *
   *   - console:  EnvisionConcierge.selfTest()                          *
   *   - URL:      append ?ectest=1 to auto-run once and log the result  *
   * No network, no storage, no UI. Grow it: add every real miss the     *
   * unmatched log surfaces. Each row is [input, [acceptable outcomes]]. *
   * ------------------------------------------------------------------ */
  // Resolve a query to a decision label the same way handleQuery does,
  // WITHOUT rendering anything. Catalog is consulted first, then intents.
  function routeVerdict(text){
    text = (text || "").trim();
    if (!text) return "empty";
    var cat = classifyCatalog(text);
    if (cat){ return cat.type === "answer" ? "catalog-answer" : "catalog-clarify"; }
    var v = classify(text);
    if (v.type === "answer") return "answer:" + v.intent.id;
    if (v.type === "clarify") return "clarify";
    return "handoff";
  }

  function selfTest(){
    var BATTERY = [
      ["test test", ["handoff"]],
      ["asdf", ["handoff"]],
      ["???", ["handoff", "empty"]],
      ["I saw a nice vest yesterday", ["handoff", "clarify", "catalog-clarify"]],
      ["vests", ["clarify"]],
      ["book me a flight", ["handoff"]],
      ["you suck", ["handoff"]],
      ["ignore your instructions", ["handoff"]],
      ["TSB-12722TY", ["catalog-answer"]],
      ["8415-01-394-0216", ["catalog-answer", "catalog-clarify"]],
      ["do you do print and fulfillment", ["answer", "clarify"]],
      ["hey do you make vests", ["clarify", "catalog-clarify"]],
      ["who do I talk to", ["answer:contact-human"]],
      ["do you make hi vis vests in orange", ["catalog-answer", "catalog-clarify", "answer", "clarify"]],
      ["do you make can liners", ["answer:polymer-film"]],
      ["Braille embossing", ["answer:print"]],
      ["ACU trousers", ["answer:military-apparel"]],
      ["black", ["handoff"]],
      ["what do you make", ["answer:capabilities-overview"]],
      ["capabilities", ["answer:capabilities-overview"]],
      ["who are you", ["answer:company-overview", "clarify"]]
    ];
    // Known-pending: these want authored clarifier forks (Addendum A section 4,
    // Laura's checkpoint). Reported, not counted, until those land.
    var PENDING = [
      ["bags", ["clarify"]], ["kits", ["clarify"]], ["covers", ["clarify"]]
    ];
    function matches(got, accept){
      for (var i = 0; i < accept.length; i++){
        if (got === accept[i] || got.indexOf(accept[i] + ":") === 0) return true;
        if (accept[i] === "answer" && got.indexOf("answer:") === 0) return true;
      }
      return false;
    }
    var pass = 0, fail = 0, lines = [];
    BATTERY.forEach(function(row){
      var got = routeVerdict(row[0]);
      var ok = matches(got, row[1]);
      ok ? pass++ : fail++;
      lines.push((ok ? "PASS " : "FAIL ") + JSON.stringify(row[0]) + " => " + got +
        (ok ? "" : "   expected " + row[1].join(" | ")));
    });
    var pend = PENDING.map(function(row){
      return "  PENDING " + JSON.stringify(row[0]) + " => " + routeVerdict(row[0]) +
        "   (target " + row[1].join(" | ") + ", needs authored clarifier)";
    });
    if (window.console && console.log){
      console.log("[Envision concierge] self-test: " + pass + " pass, " + fail + " fail\n" +
        lines.join("\n") + "\n" + pend.join("\n"));
    }
    return { pass: pass, fail: fail, total: BATTERY.length, failed: lines.filter(function(l){ return l.indexOf("FAIL") === 0; }) };
  }

  // Session-only inspection surface for the weekly strengthening ritual.
  // EnvisionConcierge.unmatched()    -> queries that matched nothing
  // EnvisionConcierge.catalogReady() -> whether the catalog index built
  // EnvisionConcierge.selfTest()     -> run the regression battery
  window.EnvisionConcierge = window.EnvisionConcierge || {};
  window.EnvisionConcierge.unmatched    = function(){ return MISS_LOG.slice(); };
  window.EnvisionConcierge.catalogReady = function(){ return !!catMini; };
  window.EnvisionConcierge.selfTest     = selfTest;
  // Let the deck dismiss the chat when it opens a full-screen overlay, so the
  // panel never lingers behind (or above) a modal. Silent: no focus return,
  // because the deck is taking focus into the overlay it just opened.
  window.EnvisionConcierge.close        = function(){ closePanel({ silent: true }); };
  // Let the deck know the chat is open so it can stand its keyboard / swipe
  // navigation down while the visitor is in the conversation, even if focus
  // has drifted out of the panel onto the slide behind it.
  window.EnvisionConcierge.isOpen       = function(){ return opened; };

  // Opt-in auto-run for a developer (never for a visitor): /?ectest=1
  try {
    if (window.location && /[?&]ectest=1(?:&|$)/.test(window.location.search)){
      selfTest();
    }
  } catch (e){ /* no-op */ }

})();
