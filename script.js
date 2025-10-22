// 1) Transparent header gains blur on scroll
(function () {
  const header = document.querySelector('.site-header');
  const toggle = () => {
    if (window.scrollY > 8) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  toggle();
  window.addEventListener('scroll', toggle, { passive: true });
})();

// 2) Preserve UTM/ad params to ALL quiz links
(function () {
  const qs = window.location.search.replace(/^\?/, "");
  if (!qs) return;
  const ids = ["to-quiz-top", "to-quiz-hero", "to-quiz-final"];
  ids.forEach(id => {
    const a = document.getElementById(id);
    if (!a) return;
    const url = new URL(a.getAttribute("href"), window.location.origin);
    url.search = qs;
    a.setAttribute("href", url.pathname + url.search + (url.hash || ""));
  });
})();





// ---- SETUP / UTMS ----
const qs = window.location.search || "";
const utmString = qs.replace(/^\?/, "");
const form = document.getElementById("quizForm");
const steps = Array.from(document.querySelectorAll(".q-step"));
const stepNowEl = document.getElementById("stepNow");
const stepTotalEl = document.getElementById("stepTotal");
const progressBar = document.getElementById("progressBar");

stepTotalEl.textContent = String(steps.length);

// Result redirect + UTM capture
(function setRedirectAndUtm(){
  const next = document.getElementById("nextUrl");
  const utmField = document.getElementById("utmField");
  const dest = new URL("result.html", window.location.origin);
  if (utmString) { dest.search = utmString; utmField.value = utmString; }
  next.value = dest.pathname + dest.search;
})();

// ---- STEP STATE ----
let currentStep = 1;

function showStep(n){
  steps.forEach((s, i) => {
    const active = (i + 1) === n;
    s.classList.toggle("is-active", active);
    s.hidden = !active;              // more reliable than aria-hidden for display
  });
  currentStep = n;
  stepNowEl.textContent = String(n);
  const pct = Math.round((n - 1) / (steps.length - 1) * 100);
  progressBar.style.width = pct + "%";
  window.scrollTo({ top: 0, behavior: "smooth" });
}
showStep(1);

// Check if current step has an answer
function stepHasAnswer(n){
  const name = "q" + n;
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return !!checked;
}

// ---- EVENT DELEGATION (bulletproof) ----
document.addEventListener("click", (e) => {
  const nextBtn = e.target.closest("[data-next]");
  const backBtn = e.target.closest("[data-back]");

  if (nextBtn) {
    e.preventDefault(); // ensure no accidental form submit
    if (!stepHasAnswer(currentStep)) {
      alert("Please select an option to continue.");
      return;
    }
    const next = Math.min(currentStep + 1, steps.length);
    showStep(next);
    return;
  }

  if (backBtn) {
    e.preventDefault();
    const prev = Math.max(currentStep - 1, 1);
    showStep(prev);
    return;
  }
});

// ---- SUBMIT: move answers into hidden fields ----
form.addEventListener("submit", (e)=>{
  const email = form.email.value.trim();
  if(!/^\S+@\S+\.\S+$/.test(email)){
    e.preventDefault();
    alert("Enter a valid email address.");
    return;
  }
  const set = (n, id) => {
    const v = document.querySelector(`input[name="q${n}"]:checked`);
    if (v) document.getElementById(id).value = v.value;
  };
  set(1, "ans_q1");
  set(2, "ans_q2");
  set(3, "ans_q3");
  set(4, "ans_q4");
  // if you later add a 5th radio step, also set ans_q5 here
});






// Header blur on scroll (kept minimal)
(function () {
  const header = document.querySelector('.site-header');
  const toggle = () => (window.scrollY > 8 ? header.classList.add('scrolled') : header.classList.remove('scrolled'));
  toggle(); window.addEventListener('scroll', toggle, { passive: true });
})();

// QUIZ STEPPER + UTM carryover + submit packing
(function () {
  "use strict";

  const form = document.getElementById("quizForm");
  const steps = Array.from(document.querySelectorAll(".q-step"));
  const progressBar = document.getElementById("progressBar");
  const stepNowEl = document.getElementById("stepNow");
  const stepTotalEl = document.getElementById("stepTotal");
  if (stepTotalEl) stepTotalEl.textContent = String(steps.length);

  // UTM + redirect
  const qs = window.location.search || "";
  const utmString = qs.replace(/^\?/, "");
  const next = document.getElementById("nextUrl");
  const utmField = document.getElementById("utmField");
  if (next) {
    const dest = new URL("result.html", window.location.origin);
    if (utmString) { dest.search = utmString; if (utmField) utmField.value = utmString; }
    next.value = dest.pathname + dest.search;
  }

  // Stepper
  let current = 1;
  const showStep = (n) => {
    steps.forEach((s, i) => {
      const on = (i + 1) === n;
      s.classList.toggle("is-active", on);
      s.style.display = on ? "block" : "none";
    });
    current = n;
    if (stepNowEl) stepNowEl.textContent = String(n);
    if (progressBar){
      const pct = Math.round((n-1)/(steps.length-1)*100);
      progressBar.style.width = pct + "%";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  showStep(1);

  const hasAns = (n)=> !!document.querySelector(`input[name="q${n}"]:checked`);
  document.addEventListener("click", (e) => {
    const nextBtn = e.target.closest("[data-next]");
    const backBtn = e.target.closest("[data-back]");
    if (nextBtn) {
      e.preventDefault();
      if (!hasAns(current)) return alert("Please select an option to continue.");
      showStep(Math.min(current+1, steps.length));
    }
    if (backBtn) {
      e.preventDefault();
      showStep(Math.max(current-1, 1));
    }
  });

  if (form) {
    form.addEventListener("submit", (e)=>{
      const email = form.email?.value?.trim() || "";
      if(!/^\S+@\S+\.\S+$/.test(email)){
        e.preventDefault(); return alert("Enter a valid email address.");
      }
      const set=(n,id)=>{ const v=document.querySelector(`input[name="q${n}"]:checked`); if(v) document.getElementById(id).value=v.value; };
      set(1,"ans_q1"); set(2,"ans_q2"); set(3,"ans_q3"); set(4,"ans_q4");
    });
  }

  // RESULT PAGE: personalize title + wire CTA if present
  (function resultEnhance(){
    const titleEl = document.getElementById("resultTitle");
    if (!titleEl) return; // not on result page
    const params = new URLSearchParams(window.location.search);
    const typeMap = { metabolic: "Night-Time Metabolic Blocker", hormonal: "Hormonal Sleep Imbalance" };
    const chosen = typeMap[(params.get("type") || "").toLowerCase()] || typeMap.metabolic;
    titleEl.textContent = chosen;

    const AFFILIATE_LINK = "#"; // TODO: paste your ClickBank hoplink
    const cta = document.getElementById("cta-offer");
    if (cta) {
      if (AFFILIATE_LINK === "#") {
        cta.addEventListener("click",(e)=>{ e.preventDefault(); alert("Add your SleepLean affiliate link in quiz.js (AFFILIATE_LINK)."); });
      } else {
        const url = new URL(AFFILIATE_LINK, window.location.origin);
        if (window.location.search) url.search = window.location.search.slice(1);
        cta.setAttribute("href", url.toString());
      }
    }
  })();
})();





// result.js — personalize + wire CTA with UTM
(function () {
  "use strict";

  // If later you pass a ?type= param, we can swap the label. Default is Metabolic Blocker.
  const params = new URLSearchParams(window.location.search);
  const typeMap = {
    metabolic: "Night-Time Metabolic Blocker",
    hormonal: "Hormonal Sleep Imbalance",
  };
  const typeParam = (params.get("type") || "").toLowerCase();
  const chosen = typeMap[typeParam] || typeMap.metabolic;

  const titleEl = document.getElementById("resultTitle");
  if (titleEl) titleEl.textContent = chosen;

  // CTA — set your affiliate link once, UTM auto-attached
  const AFFILIATE_LINK = "#"; // 🔗 TODO: paste your SleepLean ClickBank hoplink here
  const cta = document.getElementById("cta-offer");
  if (cta) {
    const url = new URL(AFFILIATE_LINK, window.location.origin);
    // Carry UTMs through
    const qs = window.location.search;
    if (qs && AFFILIATE_LINK !== "#") url.search = (qs.startsWith("?") ? qs.slice(1) : qs);
    cta.setAttribute("href", AFFILIATE_LINK === "#" ? "#" : url.toString());

    // Safety: if link is still '#', dim the button so you remember to set it
    if (AFFILIATE_LINK === "#") {
      cta.style.opacity = ".8";
      cta.style.pointerEvents = "auto"; // keep clickable if you want to test
      cta.addEventListener("click", (e)=> {
        e.preventDefault();
        alert("Add your SleepLean affiliate link in result.js — look for AFFILIATE_LINK.");
      });
    }
  }
})();





