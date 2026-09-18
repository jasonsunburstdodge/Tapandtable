(() => {
  "use strict";

  let overlay, modal, lastTrigger;

  function fieldsHTML() {
    return `
      <div class="dd-field-row">
        <label class="dd-field">First Name*<input type="text" name="firstName" autocomplete="given-name" required></label>
        <label class="dd-field">Last Name*<input type="text" name="lastName" autocomplete="family-name" required></label>
      </div>
      <div class="dd-field-row">
        <label class="dd-field">Email*<input type="email" name="email" autocomplete="email" required></label>
        <label class="dd-field">Phone*<input type="tel" name="phone" autocomplete="tel" required></label>
      </div>
      <label class="dd-field full">Restaurant / Bar Name*<input type="text" name="business" required></label>
      <label class="dd-field full">Anything else we should know?<textarea name="notes" rows="4" maxlength="4000"></textarea></label>
    `;
  }

  function buildOverlay() {
    overlay = document.createElement("div");
    overlay.className = "dd-modal-overlay";
    overlay.hidden = true;
    overlay.innerHTML = `<div class="dd-modal" role="dialog" aria-modal="true" aria-labelledby="dd-modal-title"></div>`;
    document.body.appendChild(overlay);
    modal = overlay.querySelector(".dd-modal");

    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !overlay.hidden) close(); });
  }

  function render(prefillNotes) {
    modal.innerHTML = `
      <button type="button" class="dd-modal-close" aria-label="Close">&times;</button>
      <h2 id="dd-modal-title" class="dd-modal-title">Request Your Deep-Dive Analysis</h2>
      <p class="dd-modal-sub">Tell us where to send it. A member of the Tap and Table team will follow up to schedule your findings review.</p>
      <a class="dd-call-now" href="tel:+14694429291">Prefer to talk now? Call (469) 442-9291 &rarr;</a>
      <form class="dd-modal-form">
        ${fieldsHTML()}
        <div class="dd-actions">
          <button type="submit" class="btn">Request Deep-Dive Analysis &rarr;</button>
        </div>
      </form>
    `;

    const form = modal.querySelector("form");
    const notes = modal.querySelector("textarea[name=notes]");
    if (prefillNotes) notes.value = prefillNotes;

    modal.querySelector(".dd-modal-close").addEventListener("click", close);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      // Placeholder only: no lead-capture backend is wired up yet. Once one
      // is (Formspree, HubSpot, a serverless function, etc. — see
      // README.md), this is where the submission is sent and routed to the
      // Tap and Table team.
      close();
      form.reset();
    });
  }

  function open(prefillNotes, trigger) {
    if (!overlay) buildOverlay();
    lastTrigger = trigger || null;
    render(prefillNotes);
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    const firstField = modal.querySelector("input");
    if (firstField) firstField.focus();
  }

  function close() {
    if (!overlay) return;
    overlay.hidden = true;
    document.body.style.overflow = "";
    if (lastTrigger && typeof lastTrigger.focus === "function") lastTrigger.focus();
  }

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-deepdive-trigger]");
    if (trigger) {
      e.preventDefault();
      open(trigger.getAttribute("data-deepdive-notes") || "", trigger);
    }
  });

  window.TapAndTableLead = { open };
})();
