/* Project Claude V2 – loader (14 Nov). The widget's styling and code now live on GitHub Pages:
   https://lanzagb.github.io/lanza-overlay/widget.css + widget.js – this tab just loads them (CSS first, then JS),
   holds on to StreamElements' start-up events until the code has arrived, then hands them over.
   If GitHub can't be reached it quietly retries (2s, 4s, 6s ... up to every 30s) – nothing errors on stream. */
(function () {
  var BASE = "https://lanzagb.github.io/lanza-overlay/", EVENTS = ["onWidgetLoad", "onEventReceived", "onSessionUpdate"], held = [], tries = 0;
  function hold(e) { held.push([e.type, e.detail]); }
  EVENTS.forEach(function (n) { window.addEventListener(n, hold); });
  function fresh(f) { return BASE + f + "?t=" + Date.now(); } // (always the latest version - no stale copies)
  function retry(fn) { tries++; setTimeout(fn, Math.min(30000, 2000 * tries)); }
  function loadCss() { // (fetched and put in place as text: a font that can't load never holds the styles up)
    fetch(fresh("widget.css"), { cache: "no-store" }).then(function (r) { if (!r.ok) throw r.status; return r.text(); })
      .then(function (css) { var st = document.createElement("style"); st.id = "pcv2-css"; st.textContent = css; document.head.appendChild(st); tries = 0; loadJs(); })
      .catch(function () { retry(loadCss); });
  }
  function loadJs() {
    var s = document.createElement("script"); s.src = fresh("widget.js");
    s.onload = function () {
      EVENTS.forEach(function (n) { window.removeEventListener(n, hold); });
      held.forEach(function (x) { window.dispatchEvent(new CustomEvent(x[0], { detail: x[1] })); });
      held = [];
    };
    s.onerror = function () { s.remove(); retry(loadJs); };
    document.head.appendChild(s);
  }
  loadCss();
})();
