/* Gestion du consentement aux traceurs (RGPD / directive ePrivacy)
   - aucun traceur optionnel avant un choix explicite
   - refuser est aussi simple qu'accepter
   - choix conservé 6 mois, modifiable à tout moment */
(function () {
  'use strict';

  var KEY = 'pa_consent';
  var VERSION = 1;
  var MAX_AGE = 1000 * 60 * 60 * 24 * 182; // ~6 mois

  var banner = document.querySelector('.cookies');
  if (!banner) return;
  var prefs = banner.querySelector('.cookies__prefs');
  var customBtn = banner.querySelector('[data-cookie-custom]');
  var analyticsInput = prefs.querySelector('input[name="analytics"]');

  function read() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (data.v !== VERSION || Date.now() - data.ts > MAX_AGE) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function save(choices) {
    var data = { v: VERSION, ts: Date.now(), analytics: !!choices.analytics };
    try { window.localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* stockage indisponible */ }
    apply(data);
    hide();
  }

  // Point d'accroche : les outils optionnels ne sont chargés qu'ici, après accord
  function apply(data) {
    document.dispatchEvent(new CustomEvent('consent:change', { detail: data }));
  }

  var lastFocus = null;

  function show(openPrefs) {
    var current = read();
    analyticsInput.checked = !!(current && current.analytics);
    prefs.hidden = !openPrefs;
    customBtn.setAttribute('aria-expanded', String(!!openPrefs));
    lastFocus = document.activeElement;
    banner.hidden = false;
    banner.classList.remove('is-entering');
    void banner.offsetWidth;
    banner.classList.add('is-entering');
    var first = openPrefs ? analyticsInput : banner.querySelector('[data-cookie-accept]');
    if (openPrefs && first) first.focus({ preventScroll: true });
  }

  function hide() {
    banner.hidden = true;
    if (lastFocus && document.body.contains(lastFocus) && lastFocus !== document.body) lastFocus.focus({ preventScroll: true });
  }

  banner.querySelector('[data-cookie-accept]').addEventListener('click', function () { save({ analytics: true }); });
  banner.querySelector('[data-cookie-reject]').addEventListener('click', function () { save({ analytics: false }); });
  customBtn.addEventListener('click', function () {
    var open = prefs.hidden;
    prefs.hidden = !open;
    customBtn.setAttribute('aria-expanded', String(open));
    if (open) analyticsInput.focus();
  });
  prefs.addEventListener('submit', function (e) {
    e.preventDefault();
    save({ analytics: analyticsInput.checked });
  });
  banner.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && read()) hide();
  });

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-cookie-open]');
    if (t) { e.preventDefault(); show(true); }
  });

  var existing = read();
  if (existing) apply(existing);
  else window.setTimeout(function () { show(false); }, document.querySelector('.preloader') ? 1800 : 300);

  window.PropulseConsent = { get: read, open: function () { show(true); } };
})();
