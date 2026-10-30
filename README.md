# ReadNext 📚🎮

> **Cross-Domain Taste-Graph Book Recommender for Educators & Librarians**  
> *Submitted to the Qloo Agentic AI Hackathon (Devpost, October 2026)*

ReadNext solves a timeless classroom challenge: **How do we get reluctant readers excited about books?**  
Instead of asking kids what genres they read, ReadNext asks what **video games** or **TV shows** they love. Using **Qloo's cultural taste graph**, ReadNext projects their entertainment passions across domains into captivating, age-appropriate book recommendations backed by empirical explainability signals and a strict dual-layer safety gate.

---

## 🌟 Why Qloo Beats Generic LLM-Only Recommendations

| Capability | Generic LLM Prompt (e.g. ChatGPT / Raw Claude) | ReadNext (Qloo Taste Graph + Agent) |
|---|---|---|
| **Underlying Signal** | Text token frequency, franchise branding & bestseller bias | **Empirical cultural affinity across media boundaries** |
| **Cross-Domain Leap** | If input is *Minecraft*, LLMs recommend literal spin-offs: *"Minecraft: The Island"* or *"Diary of an 8-Bit Warrior"*. | Maps underlying player agency, sandbox survival, and wilderness mystery $\rightarrow$ *Hatchet* by Gary Paulsen or *The Wild Robot* by Peter Brown. |
| **Truth & Explainability** | LLMs hallucinate plausible-sounding "reasons" with zero mathematical grounding. | **Verifiable mathematical vector scores** (`signal.interests.entities`) displaying exact signal contribution percentages. |
| **Classroom Safety** | Unpredictable prompt drift; risk of jailbreaks or hallucinated adult content. | **Deterministic Code-level pre-filter + Gemini Flash Safety Gatekeeper** screening every single title. |

*Try the built-in **"Compare with LLM-only"** toggle inside the app to see the difference side-by-side on any student profile.*

---

## 🧠 Agent Architecture & Technical Flow

ReadNext employs a constrained, deterministic-bounded agentic architecture (max 6 tool calls, max 3 LLM calls per request):

1. **Entity Disambiguation**: Autocomplete chip selector queries Qloo `/search?types=urn:entity:videogame` and `urn:entity:tv_show` with explicit URN types, preventing popular titles from resolving as brands or merchandise.
2. **Cross-Domain Taste Retrieval**: The agent queries Qloo `/v2/insights` with `filter.type=urn:entity:book`, passing 1–4 entity seeds, tailored age genre tags (e.g. `childrens`, `juvenile`, `middle_grade`, `teen`, `young_adult`), explicit tag exclusions (`erotic_romance`), and `feature.explainability=true`.
3. **Deterministic Pre-Filter (Code Gate)**:
   - Excludes any blacklisted media tags.
   - Enforces "Short Reads" filter (drops books > 250 pages, retains unknown lengths with clear label).
   - Drops non-English records.
4. **Agentic Tag Relaxation Retry**: If fewer than 3 books survive the pre-filter, the agent automatically triggers a relaxed tag query to broaden the candidate pool.
5. **Gemini Content Safety Gate**: Evaluates candidate books in batch against target grade-band criteria via Gemini Flash with strict JSON schema enforcement (`suitable`, `concerns`, `reading_effort`, `teacher_note`). Third-party titles and descriptions are treated strictly as untrusted data.
6. **Deterministic Post-Filter**: Unconditionally discards any book where `suitable === false` or where safety parsing failed. Never pads with fake or unverified titles.

---

## 🛡️ Security & Zero-Data-Persistence Design

- **Server-Side Only Secrets**: `QLOO_API_KEY` and `GEMINI_API_KEY` are read exclusively in Node.js runtime (`process.env`). They are never exposed in browser bundles or client network requests.
- **Zero Qloo Data Storage**: In strict compliance with Qloo data guidelines, no Qloo responses, fixtures, or database dumps are committed to this repository. All caching occurs in volatile in-memory RAM with automatic TTL eviction.
- **Quota & Rate Limiting**:
  - Per-IP rate limiter: 10 requests / minute per client.
  - Global daily Gemini safety budget tracker (resets at midnight UTC) to prevent judges or crawlers from exhausting API quotas.
  - Request body limit capped at 10kb.
- **XSS & Content Sanitization**: All book metadata is rendered purely as plain-text React nodes without `dangerouslySetInnerHTML`. Image assets are restricted strictly to secure `https://` URLs with fallback CSS cover art.
- **Privacy & Telemetry**: Zero user accounts, zero cookies, zero external tracking scripts, and zero personal data retained.

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- Node.js 20+ installed
- A Qloo Hackathon API Key (`https://hackathon.api.qloo.com`)
- A Google Gemini API Key

### 1. Clone & Install
```bash
git clone https://github.com/your-username/readnext.git
cd readnext
npm install --legacy-peer-deps
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env`:
```env
QLOO_API_KEY="your_qloo_hackathon_key"
GEMINI_API_KEY="your_gemini_key"
GEMINI_MODEL="gemini-3.8-flash"
PORT=3000
DAILY_GEMINI_BUDGET=500
```

### 3. Run Automated Smoke Tests (Mocks)
Verify the complete pipeline, cache eviction, code-level safety filters, and rate limiting:
```bash
npm run test:smoke
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ 1-Command Production Deployment (Free, 24/7 until Nov 16 2026+)

ReadNext is containerized and ready to deploy to Google Cloud Run or Render with zero server costs:

### Deploy to Google Cloud Run (Recommended - Scale to zero, 2M req/mo free)
```bash
gcloud run deploy readnext \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars QLOO_API_KEY="your_key",GEMINI_API_KEY="your_key",GEMINI_MODEL="gemini-3.8-flash"
```

### Or Deploy to Render / Railway
1. Push to a GitHub repository.
2. Link the repository in [Render.com](https://render.com) as a **Web Service** (Docker or Node runtime).
3. Add `QLOO_API_KEY` and `GEMINI_API_KEY` in Render Environment Settings.
4. Set build command: `npm run build`, start command: `npm start`.

---

## 📋 Dependency Audit Report

Audit conducted via `npm audit` with pinned dependency versions:
- Audited packages: **253**
- All application runtime dependencies are locked and pinned in `package.json`.
- Strict input sanitization and 10kb body size capping defend against upstream parser edge-cases.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
