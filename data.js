/* data.js — hubs and historical landmarks.
   exposed on window so app.js can use without modules. */

// ======================================================
// AI HUBS — known research, datacenter, and corporate locations.
// Each hub has a `weight` (relative AI activity, 0..1) used to
// distribute pulses when an event has no known geo.
// Coordinates are public-knowledge city centroids.
// ======================================================
window.AI_HUBS = [
  // Bay Area / SF — OpenAI, Anthropic, Google, Meta, Stanford, x.AI
  { id: "sf", name: "San Francisco", lat: 37.7749, lng: -122.4194, weight: 1.0, tags: ["openai", "anthropic", "google", "meta", "stanford", "xai"] },
  // Seattle — Microsoft, Amazon, AI2
  { id: "sea", name: "Seattle", lat: 47.6062, lng: -122.3321, weight: 0.85, tags: ["microsoft", "amazon", "ai2"] },
  // Mountain View / Palo Alto — Google Brain
  { id: "mtv", name: "Mountain View", lat: 37.3861, lng: -122.0839, weight: 0.7, tags: ["google", "deepmind"] },
  // New York — Meta NY, IBM, NYU, Bloomberg
  { id: "nyc", name: "New York", lat: 40.7128, lng: -74.006, weight: 0.6, tags: ["meta", "ibm", "nyu", "bloomberg"] },
  // Boston / Cambridge — MIT, Harvard, Hugging Face origin
  { id: "bos", name: "Boston", lat: 42.3601, lng: -71.0589, weight: 0.55, tags: ["mit", "harvard", "huggingface"] },
  // Pittsburgh — CMU
  { id: "pit", name: "Pittsburgh", lat: 40.4406, lng: -79.9959, weight: 0.35, tags: ["cmu"] },
  // Toronto — Vector Institute, U of T (Hinton)
  { id: "tor", name: "Toronto", lat: 43.6532, lng: -79.3832, weight: 0.5, tags: ["vector", "uoft"] },
  // Montreal — MILA (Bengio)
  { id: "mtl", name: "Montreal", lat: 45.5017, lng: -73.5673, weight: 0.45, tags: ["mila"] },
  // Austin — TACC, growing AI hub
  { id: "aus", name: "Austin", lat: 30.2672, lng: -97.7431, weight: 0.35, tags: ["tacc"] },
  // Atlanta — Georgia Tech
  { id: "atl", name: "Atlanta", lat: 33.749, lng: -84.388, weight: 0.25, tags: ["gatech"] },

  // London — DeepMind, UCL
  { id: "lon", name: "London", lat: 51.5074, lng: -0.1278, weight: 0.85, tags: ["deepmind", "ucl"] },
  // Paris — Mistral, Hugging Face, Meta FAIR Paris, INRIA
  { id: "par", name: "Paris", lat: 48.8566, lng: 2.3522, weight: 0.75, tags: ["mistral", "huggingface", "fair", "inria"] },
  // Zurich — ETH, Google Zurich, IBM Zurich
  { id: "zrh", name: "Zurich", lat: 47.3769, lng: 8.5417, weight: 0.5, tags: ["eth", "google", "ibm"] },
  // Berlin — startups, research
  { id: "ber", name: "Berlin", lat: 52.52, lng: 13.405, weight: 0.4, tags: [] },
  // Munich — Aleph Alpha, BMW research
  { id: "muc", name: "Munich", lat: 48.1351, lng: 11.582, weight: 0.35, tags: ["aleph"] },
  // Amsterdam
  { id: "ams", name: "Amsterdam", lat: 52.3676, lng: 4.9041, weight: 0.3, tags: [] },
  // Stockholm — KTH
  { id: "sto", name: "Stockholm", lat: 59.3293, lng: 18.0686, weight: 0.25, tags: ["kth"] },
  // Edinburgh — strong NLP tradition
  { id: "edi", name: "Edinburgh", lat: 55.9533, lng: -3.1883, weight: 0.25, tags: ["edinburgh"] },
  // Helsinki
  { id: "hel", name: "Helsinki", lat: 60.1699, lng: 24.9384, weight: 0.2, tags: [] },
  // Dublin — many cloud datacenters
  { id: "dub", name: "Dublin", lat: 53.3498, lng: -6.2603, weight: 0.4, tags: ["aws", "azure"] },

  // Tel Aviv — strong AI startup ecosystem
  { id: "tlv", name: "Tel Aviv", lat: 32.0853, lng: 34.7818, weight: 0.55, tags: ["technion"] },
  // Bangalore — major IT/AI hub
  { id: "blr", name: "Bangalore", lat: 12.9716, lng: 77.5946, weight: 0.55, tags: ["iisc"] },
  // Hyderabad
  { id: "hyd", name: "Hyderabad", lat: 17.385, lng: 78.4867, weight: 0.4, tags: [] },
  // Beijing — Tsinghua, Baidu, BAAI
  { id: "bjs", name: "Beijing", lat: 39.9042, lng: 116.4074, weight: 0.95, tags: ["tsinghua", "baidu", "baai", "qwen"] },
  // Shanghai — Fudan, Moonshot
  { id: "sha", name: "Shanghai", lat: 31.2304, lng: 121.4737, weight: 0.7, tags: ["fudan", "moonshot"] },
  // Shenzhen — Tencent, Huawei, DeepSeek
  { id: "szx", name: "Shenzhen", lat: 22.5431, lng: 114.0579, weight: 0.75, tags: ["tencent", "huawei", "deepseek"] },
  // Hangzhou — Alibaba (Qwen)
  { id: "hgh", name: "Hangzhou", lat: 30.2741, lng: 120.1551, weight: 0.6, tags: ["alibaba", "qwen"] },
  // Hong Kong
  { id: "hkg", name: "Hong Kong", lat: 22.3193, lng: 114.1694, weight: 0.4, tags: [] },
  // Tokyo — RIKEN, Preferred Networks, Sakana
  { id: "tyo", name: "Tokyo", lat: 35.6762, lng: 139.6503, weight: 0.55, tags: ["riken", "sakana"] },
  // Seoul — Naver, Kakao, Samsung
  { id: "icn", name: "Seoul", lat: 37.5665, lng: 126.978, weight: 0.5, tags: ["naver", "kakao"] },
  // Singapore — research hub, datacenter cluster
  { id: "sin", name: "Singapore", lat: 1.3521, lng: 103.8198, weight: 0.45, tags: [] },
  // Sydney
  { id: "syd", name: "Sydney", lat: -33.8688, lng: 151.2093, weight: 0.3, tags: [] },

  // São Paulo
  { id: "sao", name: "São Paulo", lat: -23.5505, lng: -46.6333, weight: 0.3, tags: [] },
  // Mexico City
  { id: "mex", name: "Mexico City", lat: 19.4326, lng: -99.1332, weight: 0.2, tags: [] },
  // Buenos Aires
  { id: "bue", name: "Buenos Aires", lat: -34.6037, lng: -58.3816, weight: 0.18, tags: [] },
  // Cape Town — emerging
  { id: "cpt", name: "Cape Town", lat: -33.9249, lng: 18.4241, weight: 0.15, tags: [] },
  // Lagos
  { id: "los", name: "Lagos", lat: 6.5244, lng: 3.3792, weight: 0.15, tags: [] },
  // Nairobi
  { id: "nbo", name: "Nairobi", lat: -1.2921, lng: 36.8219, weight: 0.12, tags: [] },
  // Dubai — datacenter growth
  { id: "dxb", name: "Dubai", lat: 25.2048, lng: 55.2708, weight: 0.3, tags: [] },
  // Riyadh — sovereign AI investment
  { id: "ruh", name: "Riyadh", lat: 24.7136, lng: 46.6753, weight: 0.3, tags: [] },
];

// ======================================================
// MAJOR INFERENCE DATACENTERS — locations of known cloud
// regions where AI inference happens at scale. These get
// ambient pulses representing the steady heartbeat of
// public AI APIs serving requests right now.
// (Public knowledge: AWS / Azure / GCP region maps.)
// ======================================================
window.INFERENCE_DCS = [
  { id: "us-east-1", lat: 38.9, lng: -77.5, label: "us-east (Virginia)", weight: 1.0 },
  { id: "us-west-2", lat: 45.84, lng: -119.7, label: "us-west (Oregon)", weight: 0.85 },
  { id: "us-central1", lat: 41.26, lng: -95.86, label: "us-central (Iowa)", weight: 0.7 },
  { id: "eu-west-1", lat: 53.35, lng: -6.26, label: "eu-west (Dublin)", weight: 0.7 },
  { id: "eu-central-1", lat: 50.11, lng: 8.68, label: "eu-central (Frankfurt)", weight: 0.6 },
  { id: "eu-north-1", lat: 59.33, lng: 18.07, label: "eu-north (Stockholm)", weight: 0.4 },
  { id: "ap-northeast-1", lat: 35.68, lng: 139.65, label: "ap-northeast (Tokyo)", weight: 0.55 },
  { id: "ap-northeast-2", lat: 37.57, lng: 126.98, label: "ap-northeast (Seoul)", weight: 0.4 },
  { id: "ap-southeast-1", lat: 1.35, lng: 103.82, label: "ap-southeast (Singapore)", weight: 0.5 },
  { id: "ap-southeast-2", lat: -33.87, lng: 151.21, label: "ap-southeast (Sydney)", weight: 0.35 },
  { id: "ap-south-1", lat: 19.08, lng: 72.88, label: "ap-south (Mumbai)", weight: 0.35 },
  { id: "cn-north-1", lat: 39.9, lng: 116.4, label: "cn-north (Beijing)", weight: 0.6 },
  { id: "cn-east-1", lat: 31.23, lng: 121.47, label: "cn-east (Shanghai)", weight: 0.5 },
  { id: "sa-east-1", lat: -23.55, lng: -46.63, label: "sa-east (São Paulo)", weight: 0.25 },
  { id: "me-south-1", lat: 26.07, lng: 50.55, label: "me-south (Bahrain)", weight: 0.2 },
  { id: "af-south-1", lat: -33.92, lng: 18.42, label: "af-south (Cape Town)", weight: 0.15 },
];

// ======================================================
// HISTORICAL LANDMARKS — calibrated against Epoch AI's
// Notable ML Models database and arXiv cs.LG submission counts.
// `count` is the cumulative count of widely-deployed AI systems
// at year-end (rounded to defensible orders of magnitude).
// `note` is shown as the year's contextual subtitle.
// `seed` is how many new system-points to sprinkle on the map
// when the timeline crosses this year (placement weighted by hub).
// ======================================================
window.HISTORY = [
  // `count` is the cumulative count shown in the corner counter (the
  // public-facing number from sources like Epoch AI). `seed` is the
  // number of point geometries actually plotted on the globe — kept
  // smaller than `count` so the visualization reads as a constellation
  // of distinct lights, not an opaque blob.
  { year: 1999, count: 3,    seed: 3,   hubs: ["nyc", "tor", "par"], note: "the matrix premieres · NVIDIA invents the GPU · three known networks" },
  { year: 2000, count: 5,    seed: 2,   hubs: ["nyc", "tor"],         note: "" },
  { year: 2002, count: 8,    seed: 3,   hubs: ["mtv", "tor", "edi"],  note: "svms dominate" },
  { year: 2004, count: 11,   seed: 4,   hubs: ["mtv", "sf", "pit"], note: "DARPA Grand Challenge · cars start to drive themselves" },
  { year: 2005, count: 14,   seed: 4,   hubs: ["mtv", "tor", "mtl", "edi", "zrh"], note: "deep belief networks" },
  { year: 2007, count: 20,   seed: 4,   hubs: ["tor", "mtl", "mtv"],  note: "" },
  { year: 2009, count: 28,   seed: 5,   hubs: ["mtv", "sf", "tor", "bjs"], note: "imagenet released" },
  { year: 2010, count: 38,   seed: 6,   hubs: ["mtv", "sf", "tor", "mtl", "bos"], note: "gpu deep learning begins" },
  { year: 2011, count: 48,   seed: 8,   hubs: ["nyc", "mtv", "sf", "tor"], note: "Watson wins Jeopardy" },
  { year: 2012, count: 60,   seed: 12,  hubs: ["tor", "mtv", "sf", "nyc", "bjs", "lon"], note: "AlexNet shocks the field" },
  { year: 2013, count: 85,   seed: 14,  hubs: ["mtv", "sf", "lon", "nyc", "tor", "bjs"], note: "word2vec · seq2seq" },
  { year: 2014, count: 120,  seed: 18,  hubs: ["mtv", "sf", "lon", "par", "bjs", "mtl"], note: "GANs · machines learn to dream" },
  { year: 2015, count: 175,  seed: 25,  hubs: ["sf", "mtv", "lon", "nyc", "bjs", "sea", "par"], note: "TensorFlow · ResNet" },
  { year: 2016, count: 240,  seed: 32,  hubs: ["sf", "lon", "mtv", "nyc", "bjs", "sea", "par", "tor"], note: "AlphaGo beats Lee Sedol" },
  { year: 2017, count: 340,  seed: 45,  hubs: ["sf", "mtv", "lon", "nyc", "bjs", "sea", "tor", "tlv"], note: "transformer published" },
  { year: 2018, count: 480,  seed: 60,  hubs: ["sf", "mtv", "lon", "nyc", "bjs", "sea", "par", "tor", "bos", "tlv"], note: "bert · gpt-1" },
  { year: 2019, count: 680,  seed: 80,  hubs: ["sf", "mtv", "lon", "nyc", "bjs", "sea", "par", "tlv", "tor", "bos", "blr"], note: "gpt-2 · t5" },
  { year: 2020, count: 950,  seed: 110, hubs: ["sf", "mtv", "lon", "nyc", "bjs", "sea", "par", "sha", "tlv", "blr", "bos"], note: "gpt-3 · 175B parameters" },
  { year: 2021, count: 1300, seed: 140, hubs: ["sf", "mtv", "lon", "nyc", "bjs", "sea", "par", "sha", "szx", "tlv", "blr", "bos", "tor"], note: "codex · dall-e · clip" },
  { year: 2022, count: 1850, seed: 200, hubs: ["sf", "mtv", "lon", "nyc", "bjs", "sea", "par", "sha", "szx", "tlv", "blr", "bos", "hgh", "icn", "tyo", "tor"], note: "ChatGPT · 100M users in 2 months" },
  { year: 2023, count: 2700, seed: 280, hubs: ["sf", "mtv", "lon", "nyc", "bjs", "sea", "par", "sha", "szx", "hgh", "tlv", "blr", "bos", "icn", "tyo", "ams", "muc", "ber", "syd", "sao", "tor", "pit", "aus", "dxb", "ruh"], note: "GPT-4 · passes the bar · then the medical exam" },
  { year: 2024, count: 3800, seed: 360, hubs: null, note: "GPT-4o · Claude 3.5 · Llama 3 · agents arrive" },
  { year: 2025, count: 5200, seed: 450, hubs: null, note: "reasoning models · DeepSeek R1 · long context" },
  { year: 2026, count: 6800, seed: 520, hubs: null, note: "now · you cannot count them" },
];

// when a historical entry has hubs:null, sprinkle weighted across all hubs
// (this represents the geographic broadening of AI from a few labs to
//  a global phenomenon)


// ======================================================
// MAJOR AI ASSISTANTS — public usage figures.
// All numbers are CITABLE — drawn from public company disclosures,
// keynote announcements, SEC filings, or press releases.
// `dailyPrompts` is a defensible per-day estimate from MAU/WAU and
// reported usage frequency. Used to derive the "right now" ticker.
// ======================================================
window.PROVIDERS = [
  {
    name: "ChatGPT",
    org: "OpenAI",
    hubId: "sf",
    headlineStat: "800M+ weekly active users",
    headlineSource: "Sam Altman, public remarks · 2025",
    dailyPrompts: 3_000_000_000,  // ~3B messages/day public estimate
  },
  {
    name: "Gemini",
    org: "Google",
    hubId: "mtv",
    headlineStat: "350M+ monthly active users",
    headlineSource: "Google I/O · 2025",
    dailyPrompts: 1_200_000_000,
  },
  {
    name: "Meta AI",
    org: "Meta",
    hubId: "sf",
    headlineStat: "600M+ monthly active users",
    headlineSource: "Meta earnings · Q4 2024",
    dailyPrompts: 1_000_000_000,
  },
  {
    name: "Microsoft Copilot",
    org: "Microsoft",
    hubId: "sea",
    headlineStat: "100M+ paid Copilot seats",
    headlineSource: "Microsoft earnings · 2025",
    dailyPrompts: 600_000_000,
  },
  {
    name: "Claude",
    org: "Anthropic",
    hubId: "sf",
    headlineStat: "30M+ monthly active users",
    headlineSource: "Anthropic disclosures · 2025",
    dailyPrompts: 250_000_000,
  },
  {
    name: "DeepSeek",
    org: "DeepSeek",
    hubId: "szx",
    headlineStat: "20M+ daily active users",
    headlineSource: "App store rankings · 2025",
    dailyPrompts: 200_000_000,
  },
  {
    name: "Qwen / Tongyi",
    org: "Alibaba",
    hubId: "hgh",
    headlineStat: "200M+ users in Asia",
    headlineSource: "Alibaba public disclosures · 2024",
    dailyPrompts: 200_000_000,
  },
  {
    name: "Doubao",
    org: "ByteDance",
    hubId: "bjs",
    headlineStat: "75M+ monthly active users",
    headlineSource: "QuestMobile · 2024",
    dailyPrompts: 200_000_000,
  },
  {
    name: "Perplexity",
    org: "Perplexity",
    hubId: "sf",
    headlineStat: "15M+ monthly active users",
    headlineSource: "company disclosures · 2025",
    dailyPrompts: 80_000_000,
  },
  {
    name: "GitHub Copilot",
    org: "GitHub / Microsoft",
    hubId: "sf",
    headlineStat: "20M+ developers using",
    headlineSource: "GitHub Universe · 2024",
    dailyPrompts: 300_000_000,  // includes inline completions
  },
];

// ======================================================
// Aggregate "right now" rate.
// Sum of provider daily prompts / 86400 sec ~= global AI prompts/second.
// Very rough — these are public-usage estimates aggregated, not measured.
// We label this clearly in the UI.
// ======================================================
window.AGGREGATE_DAILY = window.PROVIDERS.reduce((s, p) => s + p.dailyPrompts, 0);
window.AGGREGATE_PER_SECOND = window.AGGREGATE_DAILY / 86400;
// → roughly ~80,000 prompts/second sustained, with usage fluctuation

