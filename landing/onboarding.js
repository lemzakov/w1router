// W1 Brokers — onboarding flow + AI campaign builder
//
// The chat below is a self-contained demo: it interviews the broker slot by slot,
// drafts a campaign preview live, and then accepts free-text refinements
// ("more luxury", "bigger budget", "target young families", ...).
//
// To wire it to a real LLM backend, replace `aiGenerateBaseCampaign()` and
// `aiApplyRefinement()` with calls to your completion endpoint and feed the
// returned JSON into the same `state.campaign` shape.

(function () {
  "use strict";

  // ---------- Multi-step shell ----------

  const stepsOrder = ["account", "profile", "campaign", "launch"];
  const steps = new Map();
  const sidebarItems = new Map();

  document.querySelectorAll("[data-step]").forEach((el) => steps.set(el.dataset.step, el));
  document.querySelectorAll("[data-step-list] li").forEach((el) => sidebarItems.set(el.dataset.stepId, el));

  let currentStep = "account";
  const profile = { firstName: "", lastName: "", email: "", phone: "", brokerage: "", city: "", experience: "", specialties: [], voice: "" };

  function gotoStep(name) {
    if (!steps.has(name)) return;
    currentStep = name;
    steps.forEach((el, key) => el.classList.toggle("is-active", key === name));
    sidebarItems.forEach((el, key) => {
      const order = stepsOrder.indexOf(key);
      const cur = stepsOrder.indexOf(name);
      el.classList.toggle("is-active", key === name);
      el.classList.toggle("is-done", order < cur);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = stepsOrder.indexOf(currentStep);
      if (idx > 0) gotoStep(stepsOrder[idx - 1]);
    });
  });

  // ---------- Chip groups ----------

  const chipState = {}; // groupName -> Set or string
  document.querySelectorAll("[data-chip-group]").forEach((group) => {
    const name = group.dataset.chipGroup;
    const multi = group.dataset.multi === "true";
    chipState[name] = multi ? new Set() : null;
    group.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const value = chip.dataset.value;
        if (multi) {
          const set = chipState[name];
          if (set.has(value)) {
            set.delete(value);
            chip.classList.remove("is-selected");
          } else {
            set.add(value);
            chip.classList.add("is-selected");
          }
        } else {
          chipState[name] = value;
          group.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-selected"));
          chip.classList.add("is-selected");
        }
      });
    });
  });

  // ---------- Account form ----------

  document.querySelector('[data-form="account"]').addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const firstName = (fd.get("firstName") || "").toString().trim();
    const lastName = (fd.get("lastName") || "").toString().trim();
    const email = (fd.get("email") || "").toString().trim();
    const err = document.querySelector('[data-error="account"]');

    if (!firstName || !lastName) { err.textContent = "Please enter your first and last name."; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = "Please enter a valid work email."; return; }
    err.textContent = "";

    profile.firstName = firstName;
    profile.lastName = lastName;
    profile.email = email;
    profile.phone = (fd.get("phone") || "").toString().trim();
    gotoStep("profile");
  });

  // ---------- Profile form ----------

  document.querySelector('[data-form="profile"]').addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const brokerage = (fd.get("brokerage") || "").toString().trim();
    const city = (fd.get("city") || "").toString().trim();
    const err = document.querySelector('[data-error="profile"]');

    if (!brokerage) { err.textContent = "Please tell us your brokerage name."; return; }
    if (!city) { err.textContent = "Please share the city or market you serve."; return; }
    err.textContent = "";

    profile.brokerage = brokerage;
    profile.city = city;
    profile.experience = (fd.get("experience") || "").toString();
    profile.specialties = Array.from(chipState.specialties || []);
    profile.voice = chipState.voice || "warm";

    gotoStep("campaign");
    startChat();
  });

  // ============================================================
  //                  AI Campaign Builder
  // ============================================================

  const stream = document.querySelector("[data-chat-stream]");
  const chatForm = document.querySelector("[data-chat-form]");
  const chatInput = document.querySelector("[data-chat-input]");
  const chatStatus = document.querySelector("[data-chat-status]");
  const launchBtn = document.querySelector("[data-next-from-campaign]");

  /**
   * Slot-by-slot interview. Each entry defines what we're asking,
   * how to suggest answers, and how to parse the response.
   */
  const interview = [
    {
      slot: "propertyType",
      ask: (s) =>
        `Hi ${s.firstName}! I'll get your first campaign live. What kind of property are we marketing?`,
      suggestions: ["3BR townhouse", "Luxury condo", "Single-family home", "Investment duplex"],
    },
    {
      slot: "location",
      ask: (s) =>
        `Nice — a ${s.propertyType.toLowerCase()}. What neighborhood or area is it in?`,
      suggestionsFn: (s) => [
        `Downtown ${profile.city.split(",")[0]}`,
        `Suburban ${profile.city.split(",")[0]}`,
        `Waterfront ${profile.city.split(",")[0]}`,
      ],
    },
    {
      slot: "price",
      ask: () => "What's the asking price? You can write it any way — $1.1M, 850k, 425000.",
      suggestions: ["$450,000", "$799,000", "$1.2M", "$2.5M+"],
      parse: (txt) => parsePrice(txt),
    },
    {
      slot: "audience",
      ask: () => "Who's the dream buyer for this listing?",
      suggestions: ["Young families", "First-time buyers", "Downsizers", "Investors", "Luxury buyers"],
    },
    {
      slot: "highlight",
      ask: (s) =>
        `What's the one feature that'll make a buyer fall in love with this ${s.propertyType.toLowerCase()}?`,
      suggestions: ["Renovated kitchen", "Private backyard", "Walk-to-everything location", "Skyline views", "Top-rated school zone"],
    },
    {
      slot: "urgency",
      ask: () => "How fast do you want this sold?",
      suggestions: ["ASAP — under 30 days", "Under 60 days", "No rush — best price wins"],
    },
    {
      slot: "budget",
      ask: () => "Last one: how much weekly ad budget should we work with?",
      suggestions: ["$500/wk", "$1,200/wk", "$2,500/wk", "Use AI recommendation"],
      parse: (txt) => parseBudget(txt),
    },
  ];

  let interviewIndex = 0;
  const state = {
    answers: {},          // raw answers from the broker
    campaign: null,       // generated campaign once interview is done
    mode: "interview",    // "interview" | "refining"
  };

  function startChat() {
    if (stream.children.length) return; // already started
    askNext();
  }

  function askNext() {
    if (interviewIndex >= interview.length) {
      finalizeCampaign();
      return;
    }
    const step = interview[interviewIndex];
    const text = step.ask(state.answers);
    const suggestions = step.suggestionsFn
      ? step.suggestionsFn(state.answers)
      : step.suggestions || [];
    chatStatus.textContent = `Question ${interviewIndex + 1} of ${interview.length}`;
    typingThen(() => addAiMessage(text, suggestions));
  }

  function finalizeCampaign() {
    chatStatus.textContent = "Drafting your campaign…";
    typingThen(
      () => {
        state.campaign = aiGenerateBaseCampaign(state.answers, profile);
        renderPreview();
        state.mode = "refining";
        chatStatus.textContent = "Ready · keep refining";
        addAiMessage(
          `Your campaign is drafted on the right.\n\nWant to tweak anything? Just tell me — for example: "make it more luxurious", "double the budget on weekends", "add a Spanish version", "target younger families". When it's perfect, hit Approve & launch.`,
          ["Make it more luxurious", "Bigger weekend budget", "Target young families", "Add a Spanish version"],
        );
        launchBtn.disabled = false;
        launchBtn.removeAttribute("title");
      },
      900,
    );
  }

  // ---------- Chat send handler ----------

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = "";
    handleUserMessage(text);
  });

  function handleUserMessage(text) {
    addUserMessage(text);

    if (state.mode === "interview") {
      const step = interview[interviewIndex];
      const parsed = step.parse ? step.parse(text) : text;
      state.answers[step.slot] = parsed;
      interviewIndex += 1;
      renderPreview();
      askNext();
    } else {
      // Free-text refinement mode
      typingThen(
        () => {
          const result = aiApplyRefinement(text, state.campaign, state.answers, profile);
          state.campaign = result.campaign;
          renderPreview();
          addAiMessage(result.reply, result.followups || []);
        },
        700,
      );
    }
  }

  // ---------- Chat rendering ----------

  function addAiMessage(text, suggestions) {
    const wrap = document.createElement("div");
    wrap.className = "msg msg-ai";
    wrap.innerHTML = `
      <span class="avatar">W1</span>
      <div>
        <div class="bubble"></div>
        ${suggestions && suggestions.length ? `<div class="msg-options"></div>` : ""}
      </div>`;
    wrap.querySelector(".bubble").textContent = text;
    if (suggestions && suggestions.length) {
      const opts = wrap.querySelector(".msg-options");
      suggestions.forEach((s) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip";
        chip.textContent = s;
        chip.addEventListener("click", () => {
          chip.closest(".msg-options").querySelectorAll(".chip").forEach((c) => (c.disabled = true));
          handleUserMessage(s);
        });
        opts.appendChild(chip);
      });
    }
    stream.appendChild(wrap);
    scrollChat();
  }

  function addUserMessage(text) {
    const wrap = document.createElement("div");
    wrap.className = "msg msg-user";
    wrap.innerHTML = `<div class="bubble"></div>`;
    wrap.querySelector(".bubble").textContent = text;
    stream.appendChild(wrap);
    scrollChat();
  }

  function typingThen(fn, delay = 700) {
    const row = document.createElement("div");
    row.className = "typing-row";
    row.innerHTML = "<i></i><i></i><i></i>";
    stream.appendChild(row);
    scrollChat();
    setTimeout(() => {
      row.remove();
      fn();
    }, delay);
  }

  function scrollChat() {
    stream.scrollTop = stream.scrollHeight;
  }

  // ---------- Parsers ----------

  function parsePrice(txt) {
    const clean = txt.replace(/[, $]/g, "").toLowerCase();
    const m = clean.match(/^(\d+(?:\.\d+)?)([km])?/);
    if (!m) return txt;
    let n = parseFloat(m[1]);
    if (m[2] === "m") n *= 1_000_000;
    else if (m[2] === "k") n *= 1_000;
    return n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
      : `$${Math.round(n).toLocaleString()}`;
  }

  function parseBudget(txt) {
    if (/recommend|auto|ai/i.test(txt)) return "AI recommended";
    const m = txt.replace(/[, ]/g, "").match(/(\d+(?:\.\d+)?)([km]?)/i);
    if (!m) return txt;
    let n = parseFloat(m[1]);
    if (m[2].toLowerCase() === "k") n *= 1_000;
    return `$${Math.round(n).toLocaleString()}/wk`;
  }

  // ============================================================
  //   AI generation (demo). Swap with real LLM call when ready.
  // ============================================================

  function aiGenerateBaseCampaign(a, p) {
    const channels = ["Meta", "Google"];
    if (/luxury|downsizer/i.test(a.audience)) channels.push("Email");
    if (/young|first-time|investor/i.test(a.audience)) channels.push("TikTok");
    if (/asap|under 30/i.test(a.urgency || "")) channels.push("SMS");

    const headline = composeHeadline(a, p);
    const body = composeBody(a, p);
    const budget =
      a.budget === "AI recommended" ? recommendedBudget(a) : a.budget || "$1,200/wk";

    return {
      listing: `${a.propertyType} · ${a.location}${a.price ? ` · ${a.price}` : ""}`,
      audience: a.audience,
      headline,
      body,
      channels,
      budget,
      refinements: [],
    };
  }

  function composeHeadline(a, p) {
    const voice = p.voice || "warm";
    const subject = a.propertyType;
    const loc = (a.location || p.city || "").split(",")[0];
    if (voice === "luxury") return `An Exceptional ${subject} in ${loc}`;
    if (voice === "direct") return `${subject} in ${loc} — ${a.price || "Priced to move"}`;
    if (voice === "fun") return `Say hi to your next home in ${loc}`;
    if (voice === "local") return `Just listed in ${loc}: ${subject}`;
    return `New in ${loc}: a ${subject.toLowerCase()} you'll actually want to see`;
  }

  function composeBody(a, p) {
    const audienceLine = a.audience
      ? `Built for ${a.audience.toLowerCase()}.`
      : "";
    const highlightLine = a.highlight
      ? `What sets it apart: ${a.highlight.toLowerCase()}.`
      : "";
    const urgencyLine = /asap|under 30/i.test(a.urgency || "")
      ? "Showings are filling up fast — first viewings this weekend."
      : "Private tours available all week.";
    return [
      `${a.propertyType} in ${a.location}${a.price ? `, listed at ${a.price}` : ""}.`,
      audienceLine,
      highlightLine,
      urgencyLine,
      `Brought to you by ${p.brokerage}.`,
    ]
      .filter(Boolean)
      .join(" ");
  }

  function recommendedBudget(a) {
    const priceNum = parsePriceToNumber(a.price);
    if (priceNum >= 2_000_000) return "$3,500/wk";
    if (priceNum >= 1_000_000) return "$2,200/wk";
    if (priceNum >= 500_000) return "$1,400/wk";
    return "$800/wk";
  }

  function parsePriceToNumber(s) {
    if (!s) return 0;
    const clean = s.replace(/[, $]/g, "").toLowerCase();
    const m = clean.match(/^(\d+(?:\.\d+)?)([km])?/);
    if (!m) return 0;
    let n = parseFloat(m[1]);
    if (m[2] === "m") n *= 1_000_000;
    else if (m[2] === "k") n *= 1_000;
    return n;
  }

  // ---------- Refinement intent handling ----------
  // Detects what the broker wants to change and updates the campaign.

  function aiApplyRefinement(text, campaign, answers, p) {
    const t = text.toLowerCase();
    const c = { ...campaign, refinements: [...campaign.refinements] };
    const note = (label) => c.refinements.push(label);

    // Tone shifts
    if (/luxur|upscale|premium|elegant/.test(t)) {
      c.headline = `An Exceptional ${answers.propertyType} in ${(answers.location || p.city).split(",")[0]}`;
      c.body = c.body
        .replace(/^[^.]+\./, `A rare ${answers.propertyType.toLowerCase()} offering in ${answers.location}.`)
        .replace(/you'll actually want to see/i, "of uncommon distinction");
      note("Tone → luxurious");
      return reply(c, `Done — re-skinned the campaign with a more upscale tone. Headline and body are tighter and more aspirational.`, ["Bigger weekend budget", "Add an email sequence"]);
    }

    if (/playful|fun|casual|friendly/.test(t)) {
      c.headline = `Say hi to your next home in ${(answers.location || p.city).split(",")[0]}`;
      note("Tone → playful");
      return reply(c, "Switched to a friendlier, more conversational tone.", ["Make headline shorter", "Try a video ad"]);
    }

    if (/direct|data|honest|straightforward/.test(t)) {
      c.headline = `${answers.propertyType} in ${(answers.location || p.city).split(",")[0]} — ${answers.price || "priced to move"}`;
      note("Tone → direct");
      return reply(c, "Tightened things up — direct, price-led, no fluff.", ["Add SMS follow-up", "Increase budget"]);
    }

    // Budget shifts
    if (/double|increase|more budget|bigger budget|raise/.test(t)) {
      c.budget = bumpBudget(c.budget, 2);
      note(`Budget → ${c.budget}`);
      return reply(c, `Bumped the weekly budget to ${c.budget}. I'll skew the extra spend toward weekend prime time.`, ["Add TikTok", "Tone down on weekdays"]);
    }
    if (/half|lower budget|less budget|reduce|cut budget/.test(t)) {
      c.budget = bumpBudget(c.budget, 0.5);
      note(`Budget → ${c.budget}`);
      return reply(c, `Trimmed the budget down to ${c.budget}. I'll focus spend on your highest-converting channel.`, ["Pause TikTok", "Email only"]);
    }
    const explicitBudget = text.match(/\$?\s*(\d{2,5})\s*(?:\/?\s*(?:wk|week|day|d))?/i);
    if (explicitBudget && /budget|spend|\$/.test(t)) {
      const v = parseInt(explicitBudget[1], 10);
      c.budget = `$${v.toLocaleString()}/wk`;
      note(`Budget → ${c.budget}`);
      return reply(c, `Updated the budget to ${c.budget}.`, ["Add SMS", "Add email follow-up"]);
    }

    // Audience pivots
    if (/young families|young family/.test(t)) {
      c.audience = "Young families";
      c.body = c.body.replace(/built for [^.]+\./i, "Built for young families.");
      note("Audience → young families");
      return reply(c, "Re-targeted to young families — added school-zone and commute signals to the audience.", ["Add a Spanish version", "Make it more playful"]);
    }
    if (/downsizer|empty nest/.test(t)) {
      c.audience = "Downsizers";
      c.body = c.body.replace(/built for [^.]+\./i, "Built for downsizers seeking simplicity.");
      note("Audience → downsizers");
      return reply(c, "Shifted targeting to downsizers — quieter, equity-rich segments.", ["Add email sequence", "More luxurious tone"]);
    }
    if (/investor|investment/.test(t)) {
      c.audience = "Investors";
      c.body = c.body.replace(/built for [^.]+\./i, "Built for investors and landlords.");
      note("Audience → investors");
      return reply(c, "Re-targeted toward investor-grade audiences and added ROI talking points.", ["Add rent comps", "More direct tone"]);
    }
    if (/first[- ]time/.test(t)) {
      c.audience = "First-time buyers";
      note("Audience → first-time buyers");
      return reply(c, "Targeting first-time buyers — added mortgage education and FHA messaging.", ["Add Spanish version", "Bigger TikTok push"]);
    }

    // Channel adds
    if (/tiktok/.test(t) && !c.channels.includes("TikTok")) {
      c.channels.push("TikTok");
      note("Added TikTok");
      return reply(c, "Added TikTok with a short-form vertical edit of the listing.", ["Add SMS", "More budget"]);
    }
    if (/sms|text/.test(t) && !c.channels.includes("SMS")) {
      c.channels.push("SMS");
      note("Added SMS follow-up");
      return reply(c, "Added an SMS follow-up sequence for inbound leads.", ["Add email too", "Add a Spanish version"]);
    }
    if (/email/.test(t) && !c.channels.includes("Email")) {
      c.channels.push("Email");
      note("Added email nurture");
      return reply(c, "Added an email nurture sequence — 4 touches over 10 days.", ["Add SMS", "Add TikTok"]);
    }
    if (/youtube/.test(t) && !c.channels.includes("YouTube")) {
      c.channels.push("YouTube");
      note("Added YouTube");
      return reply(c, "Added a YouTube placement with a 30s walkthrough cut.", ["Add a Spanish version"]);
    }

    // Language / copy variants
    if (/spanish|español|espanol/.test(t)) {
      note("Added Spanish variant");
      return reply(c, "Generated a Spanish-language variant of the headline, body and landing page. Will A/B test against the English copy.", ["Make it more upscale", "Add a French version"]);
    }
    if (/headline shorter|short headline|tighter headline/.test(t)) {
      c.headline = c.headline.split("—")[0].trim().split(":")[0].trim();
      note("Headline → shorter");
      return reply(c, "Trimmed the headline.", ["Make it more upscale", "Add SMS"]);
    }
    if (/variation|variant|a\/?b|test/.test(t)) {
      note("Generated 3 ad variants");
      return reply(c, "Drafted 3 variations and queued them for an automatic A/B test. The winner will get 80% of the budget by day 4.", ["Bigger budget", "Add a Spanish version"]);
    }

    // Fallback — treat as additional context
    note(`Custom tweak: "${text}"`);
    return reply(
      c,
      `Got it — I'll factor that in. Anything else? You can say things like "more luxurious", "target downsizers", "double the budget", or "add a Spanish version".`,
      ["Make it more luxurious", "Add SMS follow-up", "Bigger budget"],
    );
  }

  function bumpBudget(current, factor) {
    const m = (current || "").match(/(\d[\d,]*)/);
    const base = m ? parseInt(m[1].replace(/,/g, ""), 10) : 1200;
    const next = Math.max(100, Math.round((base * factor) / 50) * 50);
    return `$${next.toLocaleString()}/wk`;
  }

  function reply(campaign, msg, followups) {
    return { campaign, reply: msg, followups };
  }

  // ---------- Preview rendering ----------

  function renderPreview() {
    const c = state.campaign;
    const a = state.answers;
    const $ = (sel) => document.querySelector(sel);

    $("[data-preview-listing]").textContent =
      [a.propertyType, a.location, a.price].filter(Boolean).join(" · ") || "Waiting for your first answer…";
    $("[data-preview-audience]").textContent = a.audience || "—";

    if (c) {
      $("[data-preview-headline]").textContent = c.headline;
      $("[data-preview-body]").textContent = c.body;
      $("[data-preview-budget]").textContent = `Weekly budget: ${c.budget}`;
      const chans = $("[data-preview-channels]");
      chans.innerHTML = "";
      c.channels.forEach((ch) => {
        const tag = document.createElement("span");
        tag.textContent = ch;
        chans.appendChild(tag);
      });
      const ref = $("[data-preview-refinements]");
      if (c.refinements.length === 0) {
        ref.innerHTML = '<span class="preview-empty">No tweaks yet — try &ldquo;make it more upscale&rdquo;.</span>';
      } else {
        ref.innerHTML = "";
        c.refinements.slice(-5).forEach((r) => {
          const row = document.createElement("div");
          row.style.fontSize = "0.88rem";
          row.style.color = "var(--ink-soft)";
          row.style.marginBottom = "4px";
          row.textContent = `• ${r}`;
          ref.appendChild(row);
        });
      }
    } else {
      // mid-interview: still surface what we know
      if (a.propertyType || a.location) {
        $("[data-preview-headline]").textContent = `Drafting headline…`;
      }
    }
  }

  // ---------- Launch ----------

  launchBtn.addEventListener("click", () => {
    if (!state.campaign) return;
    document.querySelector("[data-launch-name]").textContent = profile.firstName || "broker";
    document.querySelector("[data-launch-channels]").textContent = state.campaign.channels.length;
    document.querySelector("[data-launch-budget]").textContent = state.campaign.budget;
    gotoStep("launch");
  });
})();
