# Tap and Table — Website + Scorecard Tool

Static site for tapandtable.com, including the **Tap and Table Scorecard**:
a free, instant, eleven-category concept–location fit check for restaurants
and bars, modeled directly on the `Pour & Play Tap and Table Scorecard`
document.

## What's here

- `index.html` — homepage. The hero is Section 1; the Scorecard promo
  (`#scorecard`) is the section directly below it, as requested.
- `scorecard/index.html` — the Scorecard tool: an intake form (name,
  concept, location) that renders all eleven category scores plus the
  overall Concept–Location Fit score, each with a plain-language "what this
  score means" / "what it could mean for your business" explanation, ending
  in the Rider disclaimer and the Deep-Dive Analysis upsell.
- `scorecard-data.js` — the eleven category definitions, their four
  status-band explanations (Strong / Solid / Needs Attention / Priority
  Concern), and the **demo scoring engine**.
- `scorecard.js` — form handling and results rendering for the tool page.
- `lead-form.js` — the "Request Deep-Dive Analysis" modal (same pattern as
  a typical lightweight lead-capture widget; not wired to a backend yet).
- `styles.css` — the whole site's visual system.

## Status: this is a working front end running on placeholder scoring

`scorecard-data.js` currently generates scores with a **deterministic hash**
of the name/concept/location — same inputs always return the same numbers,
so the tool is fully demonstrable and screenshot-able, but **the numbers are
not real analysis.** The tool page says so plainly ("Preview Mode — Sample
Scoring") so nobody mistakes a demo score for a researched one. Do not
remove that banner until real data is wired in below.

## Putting the real intelligence in place

This is the part that makes the Scorecard actually match the source
document instead of just looking like it. Three pieces have to come
together: **real data feeds**, **a scoring/reasoning engine**, and **a
place to run both server-side** (this can't live in client-side JS once
API keys are involved).

### 1. A backend to call — GitHub Pages alone won't do this

Everything above is static HTML/JS, which is fine for hosting but cannot
safely hold API keys or call paid APIs (they'd be exposed in the browser).
You need one serverless function, e.g.:

- **Netlify Functions** or **Vercel Functions** (easiest path if you deploy
  the static site there instead of/alongside GitHub Pages), or
- A **Cloudflare Worker**, or a small **AWS Lambda / Google Cloud Function**
  behind an API Gateway.

That function is what `scorecard.js` should call instead of
`runDemoScore()` — e.g. `POST /api/scorecard { name, concept, location }` →
JSON back in the same shape (`{ scores: {...}, overallScore }`).

### 2. Real data per category

| Category | Real signal | Typical source |
|---|---|---|
| Location Viability | Traffic counts, visibility, parking, co-tenancy | Geocoding + Google Places API; state/county DOT traffic-count data |
| Market Demand | Trade-area population & density | U.S. Census Bureau ACS 5-Year API (free) |
| Competitive Opportunity | Same-category venues nearby | Google Places API "Nearby Search" filtered by category |
| Demographic Fit | Age, income, household composition vs. concept's target profile | Census ACS API, cross-referenced against a target-profile table you define per concept |
| Psychographic Fit | Lifestyle/attitudinal segments, not just stats | Esri Tapestry, Claritas PRIZM, or MRI-Simmons segment data (paid); SparkToro as a lighter-weight proxy |
| Menu and Pricing Fit | Price points vs. competitors and local income | Google Places `price_level` + light competitor menu review; cross-check against ACS income data |
| GBP / Local SEO Opportunity | Profile completeness & local ranking vs. competitors | Google Business Profile API; a rank-tracking tool (BrightLocal, SEMrush Local, Whitespark) |
| Review Sentiment Opportunity | Themes and sentiment in existing reviews | Google Places API reviews + Yelp Fusion API, summarized with an LLM (see below) |
| Differentiation Potential | Derived from the competitive + menu datasets | Computed, not fetched — built from the two rows above |
| Operational Risk | Labor market, occupancy cost, compliance/health/crime exposure | BLS QCEW/local wage data; LoopNet/Crexi/CoStar lease comps; county open-data health-inspection and crime portals |
| Marketing Difficulty | Category search competition & local media cost | Google Keyword Planner / SEMrush / Ahrefs; local ad-rate benchmarks |

A few of these (Yelp in particular) restrict caching/displaying review
content under their API terms — read the ToS for any review data source
before storing or redisplaying it.

### 3. The reasoning layer — this is where your Claude Project comes in

You already have a Claude Project ("Restaurant and Bar Demographic Info")
that knows how to read this kind of data and produce a scorecard in this
exact format. The production version of the backend function should:

1. Geocode the submitted location and pull the raw data above.
2. Send that structured data, together with the submitted name/concept, to
   the **Claude API** (not the claude.ai Project UI — the Project's
   instructions/knowledge need to be exported and placed into the API call
   as the system prompt, since Projects themselves aren't callable via API).
3. Ask it to return the eleven scores **and** the status/meaning/implication
   text in a fixed JSON schema (you can reuse the exact schema
   `scorecard-data.js` already expects: `{ scores: { locationViability: 6.0, ... }, overallScore: 6.0 }`), so no frontend changes are needed when you swap in the real engine.
4. Cache results per business (same name+location shouldn't re-run the full
   pipeline every time it's requested) to control API cost.

This requires an `ANTHROPIC_API_KEY` set as a server-side environment
variable in whatever function host you choose — never in client-side code.

### 4. Other keys/accounts to provision

- `ANTHROPIC_API_KEY` — Claude API access for the reasoning layer.
- Google Maps Platform key — Places API + Geocoding API (has a per-call cost
  beyond a monthly free tier; budget for it).
- Census Bureau API key — free, instant signup.
- Optional: Yelp Fusion API key, and whichever local-SEO/rank-tracking tool
  you choose (most have their own APIs).

### 5. Lead capture for the Deep-Dive CTA

`lead-form.js` currently just closes the modal on submit — there's no
backend behind "Request Your Deep-Dive Analysis" yet. Wire the form's
`submit` handler to a real destination: a service like Formspree, a HubSpot
form endpoint, or the same serverless function stack above posting to email
or a CRM.

### 6. Business details to fill in before launch

Contact info is now real: `Rob@TapAndTable.com` and `(469) 442-9291` appear
in both pages' header/footer and in the Deep-Dive lead modal. Still no
street address on the site — add one if you want it displayed. Also
confirm the $1,200 Deep-Dive price and 1-hour review are still accurate
before this goes live, since both are quoted verbatim from the source
document.
