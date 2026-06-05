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
    // Tuned so distinctive single keywords ("mailroom", "shredding") clear
    // it while off-topic queries ("book a flight") fall through to handoff.
    scoreFloor: 22,
    // If the runner-up is within this ratio of the top score, the matches
    // are too close to call, so the concierge qualifies instead of guessing.
    // (0.30 = runner-up scored within 30 percent of the leader.)
    clarifySeparation: 0.30,
    // Intent ids shown as quick-reply chips when the panel first opens.
    openingChips: ["capabilities-overview", "how-to-buy", "abilityone", "locations", "contact-human"],
    // Fallback intent id used for the greeting bubble.
    greetingId: "greeting"
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
    fields: ["label", "triggers", "answer"],
    storeFields: ["intentId"],
    idField: "intentId",
    processTerm: processTerm,
    searchOptions: {
      boost: { triggers: 5, label: 3, answer: 1 },
      fuzzy: 0.2, prefix: true, combineWith: "OR"
    }
  });
  mini.addAll(INTENTS.map(function(i){
    return {
      intentId: i.id,
      label: i.label || "",
      triggers: (i.triggers || []).join(" "),
      answer: i.answer || ""
    };
  }));

  /* ------------------------------------------------------------------ *
   * 2. CLASSIFY  ·  answer / clarify / handoff                         *
   * ------------------------------------------------------------------ */
  function classify(text){
    var results = mini.search(text || "");
    if (!results.length || results[0].score < CONFIG.scoreFloor){
      return { type: "handoff" };
    }
    var top = byId[results[0].intentId];
    if (!top) return { type: "handoff" };

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
      'aria-labelledby="ecHeadTitle" hidden>' +
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
          'placeholder="Ask about a product, a channel, or who to call"></textarea>' +
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
    var card = el("div", "ec-contact");
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
      methods.push('<a href="' + esc(href) + '" target="_blank" rel="noopener">' + SVG.web + esc(m.web) + '</a>');
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
    // Opening a deck modal / section takes over the screen, so close the
    // concierge first to keep focus management clean (no nested dialogs).
    closePanel({ silent: true });
    if (next.action === "modal" && deck.openModal){ deck.openModal(next.target); }
    else if (next.action === "section" && deck.goToSection){ deck.goToSection(next.target); }
    else if (next.action === "bsc" && deck.openBSC){ deck.openBSC(); }
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
    var contact = resolveContact(intent);
    addContactCard(contact);
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

  function handleQuery(text){
    text = (text || "").trim();
    if (!text) return;
    addUserMessage(text);
    var verdict = classify(text);
    if (verdict.type === "answer"){ dispatchIntent(verdict.intent); }
    else if (verdict.type === "clarify"){ renderClarify(verdict.question, verdict.options); }
    else { renderHandoff(); }
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
    // Move focus into the panel for keyboard and screen-reader users.
    setTimeout(function(){ input.focus(); }, 60);
  }

  function closePanel(opts){
    if (!opened) return;
    opened = false;
    panel.classList.remove("is-open");
    launcher.setAttribute("aria-expanded", "false");
    document.removeEventListener("keydown", onKeydown, true);
    var done = function(){ panel.hidden = true; };
    // Wait out the transition, then hide.
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
    handleQuery(text);
  });

  // Enter sends, Shift+Enter makes a newline.
  input.addEventListener("keydown", function(e){
    if (e.key === "Enter" && !e.shiftKey){
      e.preventDefault();
      form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true }));
    }
  });

  function autosize(){
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 96) + "px";
  }
  input.addEventListener("input", autosize);

})();
