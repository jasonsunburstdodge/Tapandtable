(() => {
  "use strict";

  const engine = window.TapAndTableScorecard;
  const form = document.getElementById("scorecard-form");
  const resultsEl = document.getElementById("results");
  if (!form || !resultsEl || !engine) return;

  function scoreLabel(score) {
    return score.toFixed(1).replace(/\.0$/, ".0");
  }

  function renderCategoryCard(cat, score) {
    const status = engine.statusForScore(score);
    const band = cat.bands[status.key];
    return `
      <div class="score-card">
        <div class="score-card-top">
          <h3>${cat.label}</h3>
          <span class="score-card-num">${scoreLabel(score)} / 10</span>
        </div>
        <span class="status-pill status-${status.key}">${status.label}</span>
        <p class="what">${cat.what}</p>
        <p class="meaning"><strong>What this score means</strong>${band.meaning}</p>
        <p class="implication"><strong>What it could mean for your business</strong>${band.implication}</p>
      </div>
    `;
  }

  function renderOverall(overallScore, name) {
    const status = engine.statusForScore(overallScore);
    const band = engine.OVERALL.bands[status.key];
    return `
      <div class="results-header">
        <div class="eyebrow">Overall Concept&ndash;Location Fit</div>
        <h2>${name ? name + " — " : ""}Scorecard Results</h2>
        <div class="overall-score">${scoreLabel(overallScore)} / 10</div>
        <span class="status-pill status-${status.key}">${status.label}</span>
        <p class="overall-copy"><strong>What this means:</strong> ${band.meaning} ${band.implication}</p>
      </div>
    `;
  }

  function renderRider(name) {
    return `
      <div class="rider">
        <div class="eyebrow">A Note on What You're Looking At</div>
        <h3>This Is a Surface Read, Not a Full Audit</h3>
        <p>This scorecard is a fast, honest gut-check built from real, observable, publicly available signals about location, competition, digital presence, and demographics &mdash; scored on the same 0&ndash;10 scale we use in our full engagements. It's built to show you <em>where</em> things stand.</p>
        <p>It intentionally does not yet tell you <em>why</em> a score landed where it did, or exactly what to do about it. That level of detail &mdash; and the specific, prioritized plan that comes with it &mdash; is what our full Deep-Dive Analysis is built to deliver.</p>
        <div class="rider-deepdive">
          <h4>The Tap and Table Deep-Dive Analysis</h4>
          <ul class="deepdive-list">
            <li>A full, data-driven analysis across demographics, psychographics, competition, concept, menu, reputation, digital presence, and marketing.</li>
            <li>A clear explanation of what each factor is doing to your business today, how, and why &mdash; in plain language.</li>
            <li>A prioritized action roadmap sorted into Must Do, Should Do, and Can Do, sequenced by real dependency.</li>
            <li>A percentage-benchmark score for each category, tied to the draw and profitability increase closing the gap could realistically deliver.</li>
            <li>An assessment of the intangibles &mdash; guest experience, likelihood of recommendation, likelihood of return &mdash; that drive word-of-mouth and repeat revenue.</li>
          </ul>
          <p class="deepdive-price">One-time fee: <strong>$1,200</strong> &mdash; includes a 1-hour review of your findings document and next steps with the Tap and Table team.</p>
          <button type="button" class="btn" data-deepdive-trigger="true" data-deepdive-notes="${name ? "Following up on my Scorecard results for " + name.replace(/"/g, "'") : ""}">Request Your Deep-Dive Analysis &rarr;</button>
        </div>
      </div>
    `;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = (data.get("name") || "").toString().trim();
    const concept = (data.get("concept") || "").toString().trim();
    const conceptOther = (data.get("conceptOther") || "").toString().trim();
    const location = (data.get("location") || "").toString().trim();
    const conceptFinal = concept === "other" ? conceptOther : concept;

    const { scores, overallScore } = engine.runDemoScore({ name, concept: conceptFinal, location });

    const cards = engine.CATEGORIES.map((cat) => renderCategoryCard(cat, scores[cat.key])).join("");

    resultsEl.innerHTML = `
      <div class="results-inner">
        ${renderOverall(overallScore, name)}
        ${cards}
        ${renderRider(name)}
      </div>
    `;
    resultsEl.hidden = false;
    resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
  });
})();
