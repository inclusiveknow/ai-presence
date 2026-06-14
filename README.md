# presence

A live map of the AI already running on Earth.

In **1999**, the world had three known neural networks of consequence. The same year, NVIDIA shipped the GPU. *The Matrix* premiered.

In **2026**, you cannot count them.

This is a static, single-page web artifact that opens with that frame and then shows — using real public data — what AI activity on Earth looks like right now. It's meant for sharing, not for engineering. Civic awareness piece. No backend, no tracking, no analytics.

## What's in here

- **`index.html`** — the page
- **`styles.css`** — dark palette, mobile-first, restrained
- **`data.js`** — AI hubs, inference datacenters, historical landmarks, provider stats
- **`app.js`** — opener, globe, timeline, live polling, ticker

## How it works

1. **Cold open.** Black screen, then *"Humankind is a virus. You are a plague."* — Agent Smith, 1999. Matrix code rain in the background.
2. **Time-lapse.** 1999 → 2026. Bright gold "infection nodes" accumulate on the globe at the labs, datacenters, and corporate hubs that built or host modern AI. Year-flashes mark the inflection points (AlexNet 2012, Transformer 2017, GPT-3 2020, ChatGPT 2022, GPT-4o 2024, reasoning models 2025).
3. **Now.** Timeline lands on 2026. A big ticker counts up from zero to the current estimated *AI prompts per second globally* (drawn from public usage disclosures: ChatGPT, Gemini, Claude, Copilot, Meta AI, DeepSeek, Qwen, etc.). A rotating card cycles the headline stats from each provider. Live pulses fire on the globe from real GitHub events (AI-tagged repos) and Hugging Face model uploads.

## Live data sources

- **Hugging Face public model API** — recent model uploads, mapped to author org HQ when known
- **GitHub public events API** — AI-tagged repos (regex word-boundary filter for `gpt`, `claude`, `llama`, `transformer`, `huggingface`, etc.)
- **Public provider disclosures** — for the per-second prompt estimate
- **Epoch AI notable ML models** — historical year-by-year counts
- **arXiv `cs.LG` submission counts** — historical AI research volume

All numbers in the ticker are clearly cited as estimates derived from public usage disclosures.

## Running locally

It's a static site. Open `index.html` in any modern browser. For best results serve it (so the asset fetches respect CORS):

```bash
python -m http.server 8980
# then open http://localhost:8980
```

## License

MIT — share, embed, fork. The point is reach.

## Credits

Built as a civic awareness artifact. Data from public APIs. No personal data is collected by this page.
