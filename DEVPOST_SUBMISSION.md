# ReadNext - Devpost Submission Draft

**Project Title:** ReadNext: Cross-Domain Taste-Graph Book Recommender for Reluctant Readers  
**Tagline:** Bridging student video game and TV passions into safe, captivating books via Qloo's cultural taste graph and Gemini safety gates.

---

## 🎯 Inspiration
Every teacher and librarian knows the reluctant reader dilemma: students who declare they "hate reading" will gladly spend 20 hours a week immersed in deep storytelling through video games like *Minecraft*, *Zelda*, or anime and TV series like *Avatar: The Last Airbender*.

Standard book recommendation tools fail because they are trapped within literature silos: they ask for favorite book genres or authors. When educators turn to generic LLMs, they get flat, stereotypical answers: ask for books for a *Minecraft* fan and an LLM simply suggests *Minecraft: The Island* or *Diary of an 8-Bit Warrior*. 

We built **ReadNext** to break media silos by projecting a student's entertainment passions across domains into genuine, high-interest books powered by **Qloo's cultural taste graph**.

---

## 🚀 What It Does
1. **Interactive Taste Seeds**: Educators select an age band (Primary 6–10, Middle School 11–14, Teens 14–18) and pick 1–4 favorite video games or TV shows.
2. **Qloo Taste Graph Cross-Domain Projection**: The ReadNext agent queries Qloo's `/v2/insights` across cultural domains to discover books sharing underlying thematic DNA, pacing, and emotional agency.
3. **Mathematical Grounding**: Every recommendation displays verifiable affinity percentages derived from Qloo's explainability vector scores (`signal.interests.entities`).
4. **Dual Safety Gate**:
   - *Deterministic Code Gate*: Instantly filters explicit tags and enforces length caps (≤ 250 pages for short reads).
   - *Gemini Flash Librarian Gate*: Batch-evaluates candidates for classroom appropriateness, flags potential concerns, and generates tailored 25-word teacher notes.
5. **Side-by-Side LLM Comparison**: A real-time toggle shows how generic LLMs rely on literal franchise spin-offs, whereas Qloo uncovers rich literary matches (e.g., *Minecraft* $\rightarrow$ *Hatchet* and *The Wild Robot*).

---

## 🧠 How We Built It & Qloo's Role
ReadNext is a full-stack TypeScript application (Vite, React 19, Tailwind CSS, Node/Express):
- **Qloo Hackathon API**: Authenticates server-side to `https://hackathon.api.qloo.com`. Autocomplete uses typed `/search` (`urn:entity:videogame`, `urn:entity:tv_show`), while recommendations use `/v2/insights` with genre-tag routing.
- **Agentic Pipeline**: Constrained to max 6 tool calls and max 3 LLM calls with automatic tag relaxation retry if initial safety filters yield under 3 titles.
- **Enterprise-Grade Security**: Per-IP rate limiting, 10kb body caps, daily quota tracker, and zero data persistence (RAM cache only).

---

## 🏆 Accomplishments
- Delivered a zero-login, instant (<30s) educator workflow with 3 one-click presets.
- 100% test-covered mock smoke pipeline and verified zero token leakage.
