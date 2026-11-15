/* Project Claude V2 – loader (v2 · 15 Nov). The widget's styling and code live on GitHub Pages
   (https://lanzagb.github.io/lanza-overlay/). This tab:
   - keeps the widget invisible while it loads, then fades it in fully set up (no half-built "loading" look)
   - asks GitHub which version is current (a tiny file, never cached), then downloads the CSS + JS for that version side by side –
     an unchanged version comes straight from OBS's own cache, so reloads are near-instant
   - holds on to StreamElements' start-up events until the code has arrived, then hands them over
   - if GitHub can't be reached it quietly retries (2s, 4s, 6s ... up to every 30s) – nothing errors on stream */
(function () {
  var BASE = "https://lanzagb.github.io/lanza-overlay/", EVENTS = ["onWidgetLoad", "onEventReceived", "onSessionUpdate"], held = [], tries = 0, loaded = false, gotLoad = false;
  var veil = document.createElement("style"); veil.textContent = "#ciw{opacity:0!important}"; document.head.appendChild(veil);
  function reveal() { // (a soft fade in once everything is in place)
    if (!loaded || !gotLoad || !veil) return;
    setTimeout(function () {
      var r = document.getElementById("ciw"); if (r) { r.style.transition = "opacity .5s ease"; r.style.opacity = "0"; }
      if (veil) { veil.remove(); veil = null; }
      requestAnimationFrame(function () { requestAnimationFrame(function () { if (r) r.style.opacity = "1"; setTimeout(function () { if (r) { r.style.transition = ""; r.style.opacity = ""; } }, 700); }); });
    }, 450);
  }
  function hold(e) { held.push([e.type, e.detail]); }
  EVENTS.forEach(function (n) { window.addEventListener(n, hold); });
  window.addEventListener("onWidgetLoad", function () { gotLoad = true; reveal(); });
  setTimeout(function () { if (veil && loaded) { gotLoad = true; reveal(); } }, 8000); // (never stays hidden for good)
  function retry(fn) { tries++; setTimeout(fn, Math.min(30000, 2000 * tries)); }
  function start() {
    fetch(BASE + "version.json?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : {}; })
      .catch(function () { return {}; })
      .then(function (v) { go(v && v.v ? String(v.v) : String(Date.now())); });
  }
  function go(ver) { // the styles and the code download at the same time
    var get = function (f) { return fetch(BASE + f + "?v=" + ver).then(function (r) { if (!r.ok) throw r.status; return r.text(); }); };
    Promise.all([get("widget.css"), get("widget.js")]).then(function (x) {
      var st = document.getElementById("pcv2-css") || document.createElement("style"); st.id = "pcv2-css"; st.textContent = x[0]; document.head.appendChild(st); // styles first
      var s = document.createElement("script"); s.textContent = x[1] + "\n//# sourceURL=widget.js"; document.head.appendChild(s); // then the code (runs straight away)
      loaded = true; tries = 0;
      EVENTS.forEach(function (n) { window.removeEventListener(n, hold); });
      held.forEach(function (e) { window.dispatchEvent(new CustomEvent(e[0], { detail: e[1] })); });
      held = []; reveal();
    }).catch(function () { retry(start); });
  }
  start();
})();
