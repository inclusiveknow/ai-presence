/* app.js — viral civic awareness piece, viral-ready.
   - matrix code rain (intense during opener, dim ambient after)
   - 5-stage matrix opener with the actual quote
   - 3D globe via globe.gl
   - historical timeline 1999 -> 2026
   - LIVE mode: github + huggingface real polls + inference heartbeat
   - trending hot-zone callouts (pulses concentrate -> green floating label)
   - share to twitter/bluesky/reddit/copy
*/

(() => {
  "use strict";

  // ============================================================
  // STATE
  // ============================================================
  const state = {
    currentYear: 1999,
    isLive: false,
    isPlaying: true,
    layers: { models: true, code: true, inference: true },
    cumulativePoints: [],
    activePulses: [],
    counters: { systems: 0, events: 0, ratePerMin: 0 },
    eventTimestamps: [],
    seenEventIds: new Set(),
    pulseHistory: [],     // [{hubId, t, color}, ...] last 60s
  };

  // Timer/index handles declared at top so any function that references
  // them (enterLiveMode, leaveLiveMode, startLiveTicker, startProviderRotator)
  // can read them safely without hitting the TDZ.
  let tickerTimer = null;
  let providerTimer = null;
  let providerIndex = 0;

  const POINT_COLORS = {
    // historical points are warm bright gold/amber — they read as
    // "infection nodes" accumulating on the globe.
    historical: "#ffb84d",        // warm bright gold
    historicalRecent: "#fff2a8",  // near-white-yellow, almost glowing
    historicalNewPulse: "#ffffff",
    models: "#ff9a3c",
    code: "#4a90b8",
    inference: "#c2410c",
  };

  // ============================================================
  // MATRIX CODE RAIN
  // ============================================================
  const rainCanvas = document.getElementById("matrix-rain");
  const rainCtx = rainCanvas.getContext("2d");
  let rainCols = [];
  let rainAnimId = null;

  // mostly 0/1 with occasional katakana-ish flavor for that classic look
  const RAIN_CHARS = "01010101010101010101アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンｱｲｳｴｵｶｷｸｹｺ01001011010110100101";

  let rainDpr = 1;
  function setupRain() {
    rainDpr = Math.min(window.devicePixelRatio || 1, 2);
    rainCanvas.width = Math.floor(window.innerWidth * rainDpr);
    rainCanvas.height = Math.floor(window.innerHeight * rainDpr);
    rainCanvas.style.width = window.innerWidth + "px";
    rainCanvas.style.height = window.innerHeight + "px";
    // reset transform first to avoid cumulative scaling on resize
    rainCtx.setTransform(1, 0, 0, 1, 0, 0);
    rainCtx.scale(rainDpr, rainDpr);

    const fontSize = Math.max(15, Math.min(22, window.innerWidth / 48));
    rainCtx.font = `${fontSize}px ui-monospace, "SF Mono", Menlo, monospace`;
    rainCtx.textBaseline = "top";
    const colCount = Math.ceil(window.innerWidth / fontSize);
    rainCols = [];
    for (let i = 0; i < colCount; i++) {
      rainCols.push({
        x: i * fontSize,
        y: Math.random() * -window.innerHeight,
        speed: 2 + Math.random() * 4,
        fontSize,
        intensity: 0.55 + Math.random() * 0.45,
      });
    }
    // paint solid background once so first frames aren't fully transparent
    rainCtx.fillStyle = "rgba(0, 8, 4, 1)";
    rainCtx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  }

  function drawRain() {
    // gentle fade so trails persist longer (lower alpha = longer trail)
    rainCtx.fillStyle = "rgba(0, 6, 3, 0.06)";
    rainCtx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    for (const col of rainCols) {
      const ch = RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)];
      // leading character — bright cyan-white
      rainCtx.fillStyle = `rgba(200, 255, 220, ${0.95 * col.intensity})`;
      rainCtx.fillText(ch, col.x, col.y);
      // trailing characters — saturated green
      rainCtx.fillStyle = `rgba(0, 255, 102, ${0.65 * col.intensity})`;
      rainCtx.fillText(ch, col.x, col.y - col.fontSize);
      rainCtx.fillStyle = `rgba(0, 200, 80, ${0.4 * col.intensity})`;
      rainCtx.fillText(ch, col.x, col.y - col.fontSize * 2);

      col.y += col.speed;
      if (col.y > window.innerHeight + col.fontSize * 20) {
        col.y = -col.fontSize * (3 + Math.random() * 25);
        col.speed = 2 + Math.random() * 4;
        col.intensity = 0.55 + Math.random() * 0.45;
      }
    }
    rainAnimId = requestAnimationFrame(drawRain);
  }

  function startRain(mode = "live") {
    rainCanvas.classList.remove("gone");
    rainCanvas.classList.add(mode);
    if (!rainAnimId) drawRain();
  }

  function dimRain() {
    rainCanvas.classList.remove("live");
    rainCanvas.classList.add("ambient");
  }

  setupRain();
  startRain("live");
  window.addEventListener("resize", () => {
    if (rainAnimId) cancelAnimationFrame(rainAnimId);
    rainAnimId = null;
    setupRain();
    drawRain();
  });

  // ============================================================
  // OPENER SEQUENCE
  // ============================================================
  const opener = document.getElementById("opener");
  const lines = document.querySelectorAll(".opener-line");

  // 5 lines, each with [in, out] ms
  const SCRIPT = [
    { in: 800,   out: 5800 },   // line 1: the quote — held longer
    { in: 6300,  out: 9800 },   // line 2: "that was the line. then."
    { in: 10300, out: 14300 },  // line 3: "in 1999, the world had three."
    { in: 14800, out: 19000 },  // line 4: "today, you cannot count them."
    { in: 19500, out: 23800 },  // line 5: "Watch."
  ];
  const OPENER_END_MS = 24400;

  let openerFinished = false;
  const openerTimers = [];

  function runOpener() {
    SCRIPT.forEach((t, i) => {
      const el = lines[i];
      openerTimers.push(setTimeout(() => el.classList.add("visible"), t.in));
      openerTimers.push(setTimeout(() => {
        el.classList.remove("visible");
        el.classList.add("fade");
      }, t.out));
    });
    openerTimers.push(setTimeout(endOpener, OPENER_END_MS));
  }

  function endOpener() {
    if (openerFinished) return;
    openerFinished = true;
    openerTimers.forEach(clearTimeout);
    opener.classList.add("fading");
    document.getElementById("hud").classList.remove("invisible");
    dimRain();
    setTimeout(() => opener.classList.add("gone"), 1500);
    startTimelinePlayback();
    // ticker + provider rotator reveal in enterLiveMode — they're the
    // punchline at the end of the historical climb, not background noise
  }

  opener.addEventListener("click", endOpener);
  opener.addEventListener("touchend", (e) => { e.preventDefault(); endOpener(); }, { passive: false });

  // ============================================================
  // GLOBE
  // ============================================================
  const globeContainer = document.getElementById("globeViz");

  const globe = Globe()
    .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-night.jpg")
    .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
    .backgroundColor("#03060c")
    .showAtmosphere(true)
    .atmosphereColor("#3a8eb8")            // brighter, more visible atmosphere
    .atmosphereAltitude(0.28)              // thicker glow
    .pointsMerge(false)
    .pointAltitude(0.028)                  // lifted further off the surface
    .pointRadius((d) => d.radius || 0.48)  // significantly bigger so spread reads instantly
    .pointColor((d) => d.color || POINT_COLORS.historical)
    .pointResolution(10)
    .pointsTransitionDuration(600)
    .ringColor((d) => d.color || POINT_COLORS.models)
    .ringMaxRadius((d) => d.maxR || 4)
    .ringPropagationSpeed((d) => d.speed || 2)
    .ringRepeatPeriod(9999)
    .ringAltitude(0.003)
    (globeContainer);

  // initial view tilted north and centered around the densest AI belt
  // (Europe + Middle East + India + edges of Asia/US east coast)
  const POPULATED_VIEW = { lat: 28, lng: 30, altitude: 1.65 };
  globe.pointOfView(POPULATED_VIEW, 0);

  const controls = globe.controls();
  // gentle drift during the time-lapse so the spread feels global,
  // not bound to one hemisphere. We park the camera explicitly when
  // live mode begins so the final resting view never sits over an ocean.
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  function fitGlobe() {
    globe.width(window.innerWidth).height(window.innerHeight);
  }
  fitGlobe();
  window.addEventListener("resize", fitGlobe);

  // ============================================================
  // POINT GENERATION
  // ============================================================
  function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function jitterPoint(hub, rngFn) {
    // wider spread so accumulated points read as regional coverage
    // rather than tightly stacked at one pixel
    const dLat = (rngFn() - 0.5) * 4.5;
    const dLng = (rngFn() - 0.5) * 6;
    return { lat: hub.lat + dLat, lng: hub.lng + dLng };
  }

  function pickWeightedHub(hubIds, rngFn) {
    const pool = hubIds
      ? window.AI_HUBS.filter((h) => hubIds.includes(h.id))
      : window.AI_HUBS;
    if (pool.length === 0) return window.AI_HUBS[0];
    const totalW = pool.reduce((s, h) => s + h.weight, 0);
    let r = rngFn() * totalW;
    for (const h of pool) {
      r -= h.weight;
      if (r <= 0) return h;
    }
    return pool[pool.length - 1];
  }

  function generateHistoricalPoints() {
    const all = [];
    const localRng = mulberry32(42);
    for (const epoch of window.HISTORY) {
      for (let i = 0; i < epoch.seed; i++) {
        const hub = pickWeightedHub(epoch.hubs, localRng);
        const p = jitterPoint(hub, localRng);
        all.push({
          ...p,
          year: epoch.year,
          radius: 0.20 + localRng() * 0.10,
          color: POINT_COLORS.historical,
          kind: "historical",
        });
      }
    }
    return all;
  }

  const ALL_HISTORICAL = generateHistoricalPoints();

  function pointsThroughYear(year) {
    return ALL_HISTORICAL.filter((p) => p.year <= year).map((p) => {
      const recent = year - p.year < 3;
      return {
        ...p,
        color: recent ? POINT_COLORS.historicalRecent : POINT_COLORS.historical,
        radius: recent ? 0.28 : 0.20,
      };
    });
  }

  // ============================================================
  // TIMELINE
  // ============================================================
  const yearDisplay = document.getElementById("year-display");
  const yearContext = document.getElementById("year-context");
  const slider = document.getElementById("timeline-slider");
  const playBtn = document.getElementById("play-btn");
  const timelineEnd = document.getElementById("timeline-end");
  const countSystems = document.getElementById("count-systems");
  const countEvents = document.getElementById("count-events");
  const countRate = document.getElementById("count-rate");

  const FIRST_YEAR = 1999;
  const LAST_YEAR = 2026;

  // flash years hold for exactly their flash duration + fade + small buffer
  // so each anchor moment plays out fully before the timeline ticks
  function holdMsForYear(y) {
    if (typeof FLASH_TRIGGERS !== "undefined" && FLASH_TRIGGERS[y]) {
      const f = FLASH_TRIGGERS[y];
      const pre = f.preDelay || 0;
      const hold = f.hold || FLASH_DEFAULT_HOLD;
      return pre + hold + FLASH_FADE_MS + 150; // +150ms breathing room
    }
    if (y < 2010) return 950;
    if (y < 2017) return 720;
    if (y < 2020) return 600;
    if (y < 2022) return 500;
    if (y < 2024) return 650;
    return 800;
  }

  let playbackTimer = null;

  function startTimelinePlayback() {
    setYear(FIRST_YEAR, true);
    state.isPlaying = true;
    playBtn.textContent = "⏸";
    advance();
  }

  function advance() {
    if (!state.isPlaying || state.isLive) return;
    const nextYear = state.currentYear + 1;
    if (nextYear > LAST_YEAR) {
      enterLiveMode();
      return;
    }
    playbackTimer = setTimeout(() => {
      setYear(nextYear, true);
      advance();
    }, holdMsForYear(state.currentYear));
  }

  let lastYearShown = -1;
  function setYear(year, animatePoints) {
    state.currentYear = year;
    yearDisplay.textContent = year;
    slider.value = year;

    const epoch = nearestEpoch(year);
    yearContext.textContent = epoch.note || "";
    state.counters.systems = epoch.count;
    countSystems.textContent = formatNum(epoch.count);

    state.cumulativePoints = pointsThroughYear(year);
    renderPoints();

    // emit short amber "infection" pulses at every newly-appeared point so
    // the spread is visibly felt, not just a static jump in dot count.
    // capped per advance so the globe doesn't get paint-bombed in late years.
    if (animatePoints && lastYearShown >= 0 && year > lastYearShown) {
      const newPoints = ALL_HISTORICAL.filter(
        (p) => p.year > lastYearShown && p.year <= year
      );
      const cap = 18;
      const sample = newPoints.length <= cap
        ? newPoints
        : newPoints.filter((_, i) => i % Math.ceil(newPoints.length / cap) === 0).slice(0, cap);
      sample.forEach((p, i) => {
        setTimeout(() => {
          addPulse({
            lat: p.lat,
            lng: p.lng,
            color: POINT_COLORS.historicalNewPulse,
            maxR: 1.8,
            speed: 1.6,
            ttl: 1400,
            hubId: null, // don't count toward trending
          });
        }, i * 70);
      });
    }
    lastYearShown = year;

    // fire dramatic flash at inflection points (only during autoplay)
    if (animatePoints && FLASH_TRIGGERS[year]) {
      triggerYearFlash(year, FLASH_TRIGGERS[year]);
    }
  }

  // ============================================================
  // YEAR FLASH — turn the time-lapse into a story
  // ============================================================
  // each flash declares its own hold duration so anchor moments (1999, 2026)
  // get the time they need; default is 1900ms hold + 600ms fade = 2500ms total
  const FLASH_DEFAULT_HOLD = 1900;
  const FLASH_FADE_MS = 700;
  const FLASH_TRIGGERS = {
    1999: { event: "the matrix premieres · the GPU is born", hold: 4000, preDelay: 700 },
    2012: { event: "AlexNet · deep learning arrives", hold: 2200 },
    2017: { event: "Transformer · attention is all you need", hold: 2400 },
    2020: { event: "GPT-3 · 175 billion parameters", hold: 2400 },
    2022: { event: "ChatGPT · 100 million users in 2 months", hold: 2800 },
    2024: { event: "GPT-4o · Claude 3.5 · agents arrive", hold: 2400 },
    2025: { event: "reasoning models · DeepSeek R1 · long context", hold: 2400 },
    2026: { event: "you cannot count them", hold: 4500 },
  };

  const flashEl = document.getElementById("year-flash");
  const flashYearEl = document.getElementById("flash-year");
  const flashEventEl = document.getElementById("flash-event");
  let flashTimer = null;

  function triggerYearFlash(year, info) {
    const hold = info.hold || FLASH_DEFAULT_HOLD;
    const preDelay = info.preDelay || 0;
    const run = () => {
      flashYearEl.textContent = year;
      flashEventEl.textContent = info.event;
      flashEl.classList.remove("hidden");
      requestAnimationFrame(() => flashEl.classList.add("show"));
      if (flashTimer) clearTimeout(flashTimer);
      flashTimer = setTimeout(() => {
        flashEl.classList.remove("show");
        setTimeout(() => flashEl.classList.add("hidden"), FLASH_FADE_MS);
      }, hold);
    };
    if (preDelay > 0) setTimeout(run, preDelay);
    else run();
  }

  function nearestEpoch(year) {
    let best = window.HISTORY[0];
    for (const e of window.HISTORY) {
      if (e.year <= year) best = e;
    }
    return best;
  }

  slider.addEventListener("input", (e) => {
    const y = parseInt(e.target.value, 10);
    state.isPlaying = false;
    if (playbackTimer) clearTimeout(playbackTimer);
    if (y >= LAST_YEAR) {
      if (!state.isLive) enterLiveMode();
    } else {
      if (state.isLive) leaveLiveMode();
      timelineEnd.classList.remove("live");
      timelineEnd.textContent = "live";
      playBtn.textContent = "▶";
      setYear(y, false);
    }
  });

  playBtn.addEventListener("click", () => {
    if (state.isLive) return;
    state.isPlaying = !state.isPlaying;
    playBtn.textContent = state.isPlaying ? "⏸" : "▶";
    if (state.isPlaying) advance();
    else if (playbackTimer) clearTimeout(playbackTimer);
  });

  // ============================================================
  // LIVE MODE
  // ============================================================
  let livePollInterval = null;
  let inferenceHeartbeatInterval = null;
  let trendingInterval = null;

  function enterLiveMode() {
    state.isLive = true;
    state.isPlaying = false;
    state.currentYear = LAST_YEAR;

    const epoch = nearestEpoch(LAST_YEAR);
    state.cumulativePoints = pointsThroughYear(LAST_YEAR);
    state.counters.systems = epoch.count;
    countSystems.textContent = formatNum(epoch.count);
    renderPoints();

    yearDisplay.textContent = "now";
    yearContext.textContent = "live · public ai signals";
    slider.value = LAST_YEAR;
    timelineEnd.classList.add("live");
    timelineEnd.textContent = "live";
    playBtn.textContent = "●";
    document.getElementById("hud").classList.add("live-mode");
    // park the camera over the densest AI belt and stop rotating so the
    // final resting view always shows land, not ocean
    if (controls) controls.autoRotate = false;
    globe.pointOfView(POPULATED_VIEW, 1500);

    pollGitHub();
    pollHuggingFace();
    inferenceHeartbeat();

    livePollInterval = setInterval(() => {
      pollGitHub();
      pollHuggingFace();
    }, 60_000);
    inferenceHeartbeatInterval = setInterval(inferenceHeartbeat, 700);
    // Trending labels removed — they competed with the ticker for attention
    // and made the view noisy. The live pulses themselves carry the "where".

    // reveal the punchline: live ticker + rotating provider stat
    document.getElementById("live-ticker").classList.remove("invisible");
    document.getElementById("provider-rotator").classList.remove("invisible");

    // -- inline ticker startup (was a separate function; folded in for reliability) --
    if (!tickerTimer) {
      const PROVIDERS_LOCAL = window.PROVIDERS || [];
      const tickEl = document.getElementById("ticker-num");
      const tickCiteEl = document.getElementById("ticker-cite");
      const BASE_RATE = (window.AGGREGATE_PER_SECOND || 80000);
      if (tickCiteEl && PROVIDERS_LOCAL.length) {
        const names = PROVIDERS_LOCAL.slice(0, 6).map((p) => p.name).join(" · ");
        tickCiteEl.textContent = "≈ " + names + " · public usage disclosures";
      }
      const computeRate = () => {
        const utcH = new Date().getUTCHours() + new Date().getUTCMinutes() / 60;
        const regions = [-7, 1, 9];
        let activity = 0;
        for (const off of regions) {
          let local = (utcH + off) % 24;
          if (local < 0) local += 24;
          let f = 0.25;
          if (local >= 10 && local <= 21) f = 1.0;
          else if (local >= 7 && local < 10) f = 0.7;
          else if (local >= 21 && local < 24) f = 0.6;
          else if (local >= 0 && local < 3) f = 0.35;
          activity += f;
        }
        activity /= regions.length;
        const noise = 0.85 + Math.random() * 0.30;
        return BASE_RATE * activity * noise;
      };
      const doTick = () => {
        const v = computeRate();
        tickEl.textContent = Math.round(v).toLocaleString();
        tickEl.classList.add("flash");
        setTimeout(() => tickEl.classList.remove("flash"), 220);
      };
      // dramatic count-up from 0 to live rate over ~1.6s, then settle
      // into per-second updates — uses setInterval for reliability under
      // headless / background-tab throttling that can pause rAF.
      const targetValue = computeRate();
      const stepMs = 30;
      const durationMs = 1600;
      const totalSteps = Math.ceil(durationMs / stepMs);
      let step = 0;
      const countUpTimer = setInterval(() => {
        step++;
        const t = Math.min(1, step / totalSteps);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
        tickEl.textContent = Math.round(targetValue * eased).toLocaleString();
        if (step >= totalSteps) {
          clearInterval(countUpTimer);
          doTick();
          tickerTimer = setInterval(doTick, 1000);
        }
      }, stepMs);
    }

    // -- inline provider rotator startup --
    if (!providerTimer) {
      const PROVIDERS_LOCAL2 = window.PROVIDERS || [];
      const provNameLocal = document.getElementById("provider-name");
      const provStatLocal = document.getElementById("provider-stat");
      const provSourceLocal = document.getElementById("provider-source");
      const provCardLocal = document.querySelector(".provider-card");
      const showProv = (idx) => {
        if (!PROVIDERS_LOCAL2.length) return;
        const p = PROVIDERS_LOCAL2[idx % PROVIDERS_LOCAL2.length];
        if (provCardLocal) provCardLocal.classList.add("swapping");
        setTimeout(() => {
          if (provNameLocal) provNameLocal.textContent = p.name + (p.org ? "  ·  " + p.org : "");
          if (provStatLocal) provStatLocal.textContent = p.headlineStat;
          if (provSourceLocal) provSourceLocal.textContent = "source · " + p.headlineSource;
          if (provCardLocal) provCardLocal.classList.remove("swapping");
        }, 350);
      };
      showProv(providerIndex);
      providerTimer = setInterval(() => {
        providerIndex = (providerIndex + 1) % PROVIDERS_LOCAL2.length;
        showProv(providerIndex);
      }, 5500); // slowed so each fact has time to land
    }
  }

  function leaveLiveMode() {
    state.isLive = false;
    if (livePollInterval) { clearInterval(livePollInterval); livePollInterval = null; }
    if (inferenceHeartbeatInterval) { clearInterval(inferenceHeartbeatInterval); inferenceHeartbeatInterval = null; }
    if (tickerTimer) { clearInterval(tickerTimer); tickerTimer = null; }
    if (providerTimer) { clearInterval(providerTimer); providerTimer = null; }
    state.activePulses = [];
    globe.ringsData([]);
    document.getElementById("live-ticker").classList.add("invisible");
    document.getElementById("provider-rotator").classList.add("invisible");
    document.getElementById("hud").classList.remove("live-mode");
    // resume gentle drift when scrubbing back into the time-lapse
    if (controls) controls.autoRotate = true;
  }

  // ---- GitHub events ----
  async function pollGitHub() {
    if (!state.layers.code) return;
    try {
      const res = await fetch("https://api.github.com/events?per_page=30");
      if (!res.ok) return;
      const events = await res.json();
      let staggered = 0;
      for (const ev of events) {
        if (state.seenEventIds.has(ev.id)) continue;
        state.seenEventIds.add(ev.id);
        if (!isAIRelated(ev)) continue;
        setTimeout(() => emitCodePulse(ev), staggered * 500);
        staggered++;
        if (staggered >= 14) break;
      }
      if (state.seenEventIds.size > 5000) {
        state.seenEventIds = new Set([...state.seenEventIds].slice(-2000));
      }
    } catch (err) {
      console.warn("github poll failed:", err.message);
    }
  }

  // word-boundary regex (avoids "ai" matching "fairclo", "ml" matching "html")
  const AI_REGEX = /(?:^|[\/_\-\s.])(ai|ml|llm|gpt|claude|gemini|llama|mistral|qwen|deepseek|diffusion|embedding|transformer|rag|agent|neural|huggingface|pytorch|tensorflow|openai|anthropic|copilot|cursor|ollama|langchain|vllm|triton|cuda|stable-diffusion|comfyui|automatic1111|whisper|sora|mlx|onnx|nlp|llava|sglang)(?:[\/_\-\s.]|$)/i;

  function isAIRelated(event) {
    const repo = (event.repo && event.repo.name) ? event.repo.name : "";
    if (AI_REGEX.test(repo)) return true;
    const payload = JSON.stringify(event.payload || {}).slice(0, 2000);
    return AI_REGEX.test(payload);
  }

  function emitCodePulse(event) {
    if (!state.layers.code) return;
    const hub = pickWeightedHub(null, Math.random);
    addPulse({
      lat: hub.lat + (Math.random() - 0.5) * 0.6,
      lng: hub.lng + (Math.random() - 0.5) * 0.8,
      color: POINT_COLORS.code,
      maxR: 3.5,
      speed: 2.5,
      ttl: 2400,
      hubId: hub.id,
    });
    bumpEventCounter();
  }

  // ---- Hugging Face ----
  async function pollHuggingFace() {
    if (!state.layers.models) return;
    try {
      const res = await fetch("https://huggingface.co/api/models?sort=lastModified&direction=-1&limit=30");
      if (!res.ok) return;
      const models = await res.json();
      let staggered = 0;
      for (const m of models) {
        const id = "hf:" + (m.modelId || m.id || m._id);
        if (state.seenEventIds.has(id)) continue;
        state.seenEventIds.add(id);
        setTimeout(() => emitModelPulse(m), staggered * 700);
        staggered++;
        if (staggered >= 12) break;
      }
    } catch (err) {
      console.warn("huggingface poll failed:", err.message);
    }
  }

  function emitModelPulse(model) {
    if (!state.layers.models) return;
    const author = ((model.modelId || model.id || "") + "").split("/")[0].toLowerCase();
    const hub = inferHubFromOrg(author) || pickWeightedHub(null, Math.random);
    addPulse({
      lat: hub.lat + (Math.random() - 0.5) * 0.5,
      lng: hub.lng + (Math.random() - 0.5) * 0.7,
      color: POINT_COLORS.models,
      maxR: 4.5,
      speed: 2.2,
      ttl: 2800,
      hubId: hub.id,
    });
    bumpEventCounter();
  }

  const ORG_TO_HUB = {
    openai: "sf", anthropic: "sf", google: "mtv", "google-research": "mtv",
    deepmind: "lon", meta: "sf", "meta-llama": "sf", microsoft: "sea",
    huggingface: "par", mistralai: "par", stabilityai: "lon",
    qwen: "hgh", "qwen2": "hgh", alibaba: "hgh", baidu: "bjs", tsinghua: "bjs",
    deepseek: "szx", tencent: "szx", baai: "bjs", thudm: "bjs",
    "01-ai": "bjs", moonshot: "sha", "internlm": "sha",
    nvidia: "sf", apple: "sf", xai: "sf", "snowflake": "sf",
    naver: "icn", kakao: "icn", samsung: "icn", "sakana": "tyo",
    cohere: "tor", "ai21": "tlv",
  };

  function inferHubFromOrg(author) {
    if (!author) return null;
    const hubId = ORG_TO_HUB[author];
    if (!hubId) return null;
    return window.AI_HUBS.find((h) => h.id === hubId) || null;
  }

  // ---- Inference heartbeat ----
  function inferenceHeartbeat() {
    if (!state.layers.inference) return;
    for (const dc of window.INFERENCE_DCS) {
      const hourBoost = timeOfDayBoost(dc.lng);
      const p = dc.weight * 0.22 * hourBoost;
      if (Math.random() < p) {
        addPulse({
          lat: dc.lat + (Math.random() - 0.5) * 0.4,
          lng: dc.lng + (Math.random() - 0.5) * 0.4,
          color: POINT_COLORS.inference,
          maxR: 2.5,
          speed: 1.6,
          ttl: 2000,
          hubId: nearestHubFor(dc.lat, dc.lng),
        });
      }
    }
  }

  function nearestHubFor(lat, lng) {
    let best = null, bestD = Infinity;
    for (const h of window.AI_HUBS) {
      const d = (h.lat - lat) ** 2 + (h.lng - lng) ** 2;
      if (d < bestD) { bestD = d; best = h; }
    }
    return best ? best.id : null;
  }

  function timeOfDayBoost(lng) {
    const utcHour = new Date().getUTCHours() + new Date().getUTCMinutes() / 60;
    let local = (utcHour + lng / 15) % 24;
    if (local < 0) local += 24;
    if (local >= 9 && local <= 22) return 1.0;
    if (local >= 6 && local < 9) return 0.6;
    if (local >= 22 || local < 2) return 0.7;
    return 0.3;
  }

  // ============================================================
  // PULSE MANAGEMENT
  // ============================================================
  function addPulse(p) {
    p.id = Math.random().toString(36).slice(2);
    state.activePulses.push(p);
    state.pulseHistory.push({ hubId: p.hubId, t: Date.now(), color: p.color });
    globe.ringsData([...state.activePulses]);
    setTimeout(() => {
      state.activePulses = state.activePulses.filter((x) => x.id !== p.id);
      globe.ringsData([...state.activePulses]);
    }, p.ttl || 2500);
    if (state.activePulses.length > 100) {
      state.activePulses.splice(0, state.activePulses.length - 100);
    }
  }

  function bumpEventCounter() {
    state.counters.events++;
    state.eventTimestamps.push(Date.now());
    countEvents.textContent = formatNum(state.counters.events);
    updateRate();
  }

  function updateRate() {
    const cutoff = Date.now() - 60_000;
    state.eventTimestamps = state.eventTimestamps.filter((t) => t > cutoff);
    state.counters.ratePerMin = state.eventTimestamps.length;
    countRate.textContent = formatNum(state.counters.ratePerMin);
  }
  setInterval(updateRate, 4000);

  // ============================================================
  // TRENDING HOT-ZONE CALLOUTS
  // ============================================================
  const trendingEl = document.getElementById("trending");
  let activeTrendLabels = new Map(); // hubId -> {el, count}

  function updateTrending() {
    if (!state.isLive) { clearTrending(); return; }
    const cutoff = Date.now() - 30_000;
    state.pulseHistory = state.pulseHistory.filter((p) => p.t > cutoff);

    const byHub = new Map();
    for (const p of state.pulseHistory) {
      if (!p.hubId) continue;
      byHub.set(p.hubId, (byHub.get(p.hubId) || 0) + 1);
    }

    const top = [...byHub.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .filter(([, c]) => c >= 1);

    const seenHubIds = new Set();
    for (const [hubId, count] of top) {
      seenHubIds.add(hubId);
      const hub = window.AI_HUBS.find((h) => h.id === hubId);
      if (!hub) continue;

      const screen = globeCoordToScreen(hub.lat, hub.lng);
      if (!screen) continue;

      let label = activeTrendLabels.get(hubId);
      if (!label) {
        const el = document.createElement("div");
        el.className = "trend-label";
        trendingEl.appendChild(el);
        label = { el };
        activeTrendLabels.set(hubId, label);
      }
      label.el.innerHTML = `${hub.name.toUpperCase()}<span class="arrow">↑</span><span class="count">${count}</span>`;
      label.el.style.left = screen.x + "px";
      label.el.style.top = (screen.y - 14) + "px";
      requestAnimationFrame(() => label.el.classList.add("visible"));
    }

    // remove labels for hubs no longer in top
    for (const [hubId, label] of activeTrendLabels.entries()) {
      if (!seenHubIds.has(hubId)) {
        label.el.classList.remove("visible");
        setTimeout(() => label.el.remove(), 800);
        activeTrendLabels.delete(hubId);
      }
    }
  }

  function clearTrending() {
    for (const [, label] of activeTrendLabels.entries()) {
      label.el.remove();
    }
    activeTrendLabels.clear();
  }

  // continuously update label positions as globe rotates.
  // hide labels that fall off-viewport — the slow auto-rotate will bring
  // hot zones around naturally rather than crowding the edge with clamped pills.
  function repositionTrending() {
    if (state.isLive && activeTrendLabels.size > 0) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 12;
      const bottomReserve = 180; // keep labels clear of HUD bottom bar

      const placedRects = []; // for simple stacking-avoidance

      for (const [hubId, label] of activeTrendLabels.entries()) {
        const hub = window.AI_HUBS.find((h) => h.id === hubId);
        if (!hub) continue;
        const screen = globeCoordToScreen(hub.lat, hub.lng);
        if (!screen) { label.el.classList.remove("visible"); continue; }

        const lw = label.el.offsetWidth || 100;
        const lh = label.el.offsetHeight || 28;
        let x = screen.x;
        let y = screen.y - 14;

        // skip if behind globe or outside viewport bounds (rotation will bring it back)
        const onScreen =
          !screen.behind &&
          x >= lw / 2 + margin &&
          x <= vw - lw / 2 - margin &&
          y >= lh + margin &&
          y <= vh - bottomReserve;

        if (!onScreen) {
          label.el.classList.remove("visible");
          continue;
        }

        // simple anti-collision: if another label's bbox overlaps, push this down
        let attempts = 0;
        const myRect = () => ({
          l: x - lw / 2, r: x + lw / 2, t: y - lh, b: y,
        });
        let r = myRect();
        while (attempts < 4 && placedRects.some((p) =>
          r.l < p.r && r.r > p.l && r.t < p.b && r.b > p.t)) {
          y += lh + 6;
          r = myRect();
          attempts++;
        }
        if (y > vh - bottomReserve) {
          label.el.classList.remove("visible");
          continue;
        }
        placedRects.push(r);

        label.el.style.left = x + "px";
        label.el.style.top = y + "px";
        label.el.classList.add("visible");
      }
    }
    requestAnimationFrame(repositionTrending);
  }
  requestAnimationFrame(repositionTrending);

  // manual projection — avoids needing THREE on window (globe.gl bundles its own).
  // applies a 4x4 matrix (column-major as used by three.js) to a homogeneous vector.
  function applyMatrix4(x, y, z, w, e) {
    return {
      x: e[0]*x + e[4]*y + e[8]*z  + e[12]*w,
      y: e[1]*x + e[5]*y + e[9]*z  + e[13]*w,
      z: e[2]*x + e[6]*y + e[10]*z + e[14]*w,
      w: e[3]*x + e[7]*y + e[11]*z + e[15]*w,
    };
  }

  function globeCoordToScreen(lat, lng) {
    const coords = globe.getCoords(lat, lng, 0.01);
    if (!coords) return null;
    const renderer = globe.renderer();
    const camera = globe.camera();
    if (!renderer || !camera) return null;

    // dot of point-from-origin with camera-from-origin tells us if point is on
    // facing hemisphere of the globe
    const camPos = camera.position;
    const camLen = Math.hypot(camPos.x, camPos.y, camPos.z) || 1;
    const ptLen = Math.hypot(coords.x, coords.y, coords.z) || 1;
    const dot = (coords.x*camPos.x + coords.y*camPos.y + coords.z*camPos.z) / (camLen * ptLen);
    const behind = dot < 0;

    // world -> view -> clip
    let p = applyMatrix4(coords.x, coords.y, coords.z, 1, camera.matrixWorldInverse.elements);
    p = applyMatrix4(p.x, p.y, p.z, p.w, camera.projectionMatrix.elements);
    if (p.w === 0) return null;
    const xn = p.x / p.w;
    const yn = p.y / p.w;

    const w = renderer.domElement.clientWidth;
    const h = renderer.domElement.clientHeight;
    return {
      x: (xn * 0.5 + 0.5) * w,
      y: (-yn * 0.5 + 0.5) * h,
      behind,
    };
  }

  // ============================================================
  // RENDER + UTIL
  // ============================================================
  function renderPoints() {
    globe.pointsData(state.cumulativePoints);
  }

  function formatNum(n) {
    if (n < 1000) return String(n);
    if (n < 10000) return n.toLocaleString();
    if (n < 1_000_000) return Math.round(n / 100) / 10 + "k";
    return Math.round(n / 100_000) / 10 + "M";
  }

  // ============================================================
  // LAYER TOGGLES
  // ============================================================
  document.getElementById("l-models").addEventListener("change", (e) => {
    state.layers.models = e.target.checked;
  });
  document.getElementById("l-code").addEventListener("change", (e) => {
    state.layers.code = e.target.checked;
  });
  document.getElementById("l-inference").addEventListener("change", (e) => {
    state.layers.inference = e.target.checked;
  });

  // ============================================================
  // INFO MODAL
  // ============================================================
  const infoModal = document.getElementById("info-modal");
  document.getElementById("info-link").addEventListener("click", (e) => {
    e.preventDefault();
    infoModal.classList.remove("hidden");
  });
  document.getElementById("close-modal").addEventListener("click", () => {
    infoModal.classList.add("hidden");
  });
  infoModal.addEventListener("click", (e) => {
    if (e.target === infoModal) infoModal.classList.add("hidden");
  });

  // ============================================================
  // SHARE MODAL
  // ============================================================
  const shareModal = document.getElementById("share-modal");
  const shareBtn = document.getElementById("share-btn");
  const shareUrl = window.location.href.split("#")[0].split("?")[0];
  const shareHashtags = "AI,civictech,AIWeather";

  // build share text fresh on each open so it includes the live ticker number —
  // a specific, eye-catching figure works much better as a share hook
  function currentShareText() {
    const tn = document.getElementById("ticker-num");
    const liveNum = (tn && tn.textContent && tn.textContent !== "—") ? tn.textContent : null;
    if (liveNum) {
      return `in 1999, the world had three.  right now, ~${liveNum} AI prompts every second — and rising.  watch where.`;
    }
    return "in 1999, the world had three. today, you cannot count them. — a live map of the AI already here";
  }

  function buildShareUrls() {
    const t = currentShareText();
    const u = encodeURIComponent(shareUrl);
    const te = encodeURIComponent(t);
    const h = encodeURIComponent(shareHashtags);
    document.getElementById("share-twitter").href =
      `https://twitter.com/intent/tweet?text=${te}&url=${u}&hashtags=${h}`;
    document.getElementById("share-bluesky").href =
      `https://bsky.app/intent/compose?text=${te}%20${u}`;
    document.getElementById("share-reddit").href =
      `https://reddit.com/submit?url=${u}&title=${te}`;
    const previewEl = document.getElementById("share-preview");
    if (previewEl) previewEl.textContent = t;
  }
  buildShareUrls();

  shareBtn.addEventListener("click", async () => {
    buildShareUrls(); // refresh with current ticker value
    const text = currentShareText();
    if (navigator.share) {
      try {
        await navigator.share({ title: "presence · the AI is already here", text, url: shareUrl });
        return;
      } catch (_) { /* user canceled — fall through to modal */ }
    }
    shareModal.classList.remove("hidden");
  });

  document.getElementById("close-share").addEventListener("click", () => {
    shareModal.classList.add("hidden");
  });
  shareModal.addEventListener("click", (e) => {
    if (e.target === shareModal) shareModal.classList.add("hidden");
  });

  document.getElementById("share-copy").addEventListener("click", async (e) => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      const orig = e.target.textContent;
      e.target.textContent = "copied ✓";
      setTimeout(() => { e.target.textContent = orig; }, 1800);
    } catch (_) {}
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      infoModal.classList.add("hidden");
      shareModal.classList.add("hidden");
    }
  });

  // ============================================================
  // KICK OFF
  // ============================================================
  runOpener();
})();
