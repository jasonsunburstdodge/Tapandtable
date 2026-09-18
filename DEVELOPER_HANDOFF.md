# Developer Handoff — Tap and Table Scorecard Backend

This doc is written to be handed to a developer with no other context. If
you're that developer: welcome, here's everything you need.

## What exists today

A complete, working static frontend (`index.html`, `scorecard/index.html`,
`styles.css`, `scorecard.js`, `lead-form.js`) that collects a restaurant/bar
**name, concept, and location**, and renders an 11-category scorecard plus
an overall score. The scoring itself currently comes from
`scorecard-data.js`'s `runDemoScore()` — a deterministic hash function, not
real analysis. **Your job is to replace that one function's output with a
real backend call.** Nothing else in the frontend needs to change if you
match the contract below.

## The one integration point

In `scorecard.js`, this line:

```js
const { scores, overallScore } = engine.runDemoScore({ name, concept, location });
```

becomes an async call to your new backend endpoint, e.g.:

```js
const res = await fetch("/api/scorecard", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, concept, location: locationFinal })
});
const { scores, overallScore } = await res.json();
```

(You'll need to make the surrounding `submit` handler `async` and add
loading/error states — there are none today since the demo engine is
synchronous.)

## The contract your endpoint must return

```json
{
  "scores": {
    "locationViability": 6.0,
    "marketDemand": 5.0,
    "competitiveOpportunity": 5.0,
    "demographicFit": 7.0,
    "psychographicFit": 6.0,
    "menuPricingFit": 7.0,
    "gbpLocalSeo": 7.0,
    "reviewSentiment": 6.0,
    "differentiation": 7.0,
    "operationalRisk": 5.0,
    "marketingDifficulty": 5.0
  },
  "overallScore": 6.0
}
```

- All scores are 0–10, in 0.5 increments (matches the source scorecard
  document).
- Keys must exactly match `CATEGORIES[].key` in `scorecard-data.js` — the
  frontend looks them up by key, not by array order.
- The frontend derives the status label (Strong/Solid/Needs
  Attention/Priority Concern) and the meaning/implication copy itself from
  `scorecard-data.js` — your backend only needs to return numbers.

## What your endpoint needs to do internally

1. **Geocode** the submitted location (Google Geocoding API).
2. **Fetch real data** for as many of the 11 categories as your phase
   covers — see the table below and `README.md`'s longer per-category
   breakdown for source suggestions.
3. **Call the Claude API** with that structured data plus a system prompt
   (export this from the "Restaurant and Bar Demographic Info" Claude
   Project — the Claude API cannot call a claude.ai Project directly, so its
   instructions/knowledge need to be copied into your own system prompt).
   Ask for the JSON shape above, e.g. via `output_config.format` or by
   instructing the model explicitly and validating the parsed JSON.
4. **Cache** by normalized `(name, location)` so repeat requests for the
   same business don't re-run the full pipeline (controls both latency and
   API cost).
5. Return the JSON contract above with a 200, or a clear error shape on
   failure (the frontend will need error-state handling added).

## Environment variables to provision (server-side only, never client-side)

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API calls |
| `GOOGLE_MAPS_API_KEY` | Geocoding + Places API |
| `CENSUS_API_KEY` | Free signup at api.census.gov |
| `YELP_API_KEY` | Optional, for Review Sentiment |

## Where to run this

GitHub Pages (or any static host) can serve the frontend files as-is, but
none of them can run the backend function above since it needs to hold
secret API keys server-side. Deploy the whole site to **Netlify** or
**Vercel** instead (both host static files + serverless functions
together, so this is a lift-and-shift, not a rebuild), or put a Cloudflare
Worker in front of the existing static hosting.

## Phased task list (see README.md for cost/time framing)

**Phase 1 — MVP (real data for 8 of 11 categories):**
- [ ] Geocoding + Census ACS integration → Market Demand, Demographic Fit
- [ ] Google Places integration (nearby search, place details, reviews) →
      Location Viability, Competitive Opportunity, GBP/Local SEO,
      Review Sentiment, Differentiation Potential
- [ ] Menu/pricing heuristic from Places `price_level` + Census income →
      Menu and Pricing Fit
- [ ] Claude API reasoning layer wired to the above, returning the JSON
      contract
- [ ] Backend function deployed (Netlify/Vercel/Cloudflare Worker)
- [ ] Frontend wired to the real endpoint; demo banner removed
- [ ] Caching layer
- [ ] Manual QA across at least 5 concept/location combinations

**Phase 2 — full category coverage:**
- [ ] Psychographic Fit — Esri Tapestry, Claritas, or a lighter proxy
- [ ] Operational Risk — BLS wage data, lease comps (LoopNet/Crexi/CoStar),
      county health/crime open-data portals
- [ ] Marketing Difficulty — keyword/competition data (SEMrush/Ahrefs) and
      local media-cost benchmarks
- [ ] Lead-form backend (Formspree, HubSpot, or a custom endpoint) for the
      "Request Deep-Dive Analysis" modal in `lead-form.js`

## Acceptance criteria ("done" for Phase 1)

- Submitting the form on `/scorecard/` for a real restaurant/bar returns
  scores that plausibly reflect its actual location and category (spot-check
  against the source `Pour & Play` example in `README.md`'s commit history
  and your own judgment — this isn't unit-testable in the traditional
  sense).
- The "Preview Mode — Sample Scoring" banner is removed once real data is
  live.
- A second run for the *same* business within the cache window doesn't
  re-hit paid APIs.
- No API key appears in any file served to the browser (check
  `view-source:` on the deployed site, and grep the repo for the key
  variable names before pushing).
